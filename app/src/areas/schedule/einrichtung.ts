import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// Requirements „Auswahl der Endpunkte des Lehrangebots" und „Gruppenkennung
// ohne Matrikelnummer": die einmalig gewählte Einrichtung des Stundenplans —
// beliebig viele Endpunkte des Lehrangebots (`endpunkte`, INT-001-Kurznamen,
// gleichrangig, kein Hauptendpunkt) und die Gruppenkennung (Muster
// `^[A-Z][0-9]+$` — Buchstabe und Zahl beide verpflichtend, SCHED-F-720).
// Rein gerätelokal (DATA-F-010). Reaktiver Modul-Speicher wie
// `canteen/selection.ts`, damit alle Stundenplan-Bildschirme denselben Stand
// teilen.
//
// Requirement „Gruppenkennung verpflichtend vor dem Planungsmodus": `null`
// steht nur noch für „noch nicht festgelegt" — beim ersten Durchlauf der
// Einrichtung und bei einem persönlichen Plan aus einer früheren Fassung der
// App. Es gibt keinen Bedienweg mehr, der eine gesetzte Kennung wieder auf
// `null` zurückführt; allein `clear()` (die Aktion „Stundenplan zurücksetzen")
// entfernt sie zusammen mit den Endpunkten.
//
// SCHED-F-690/F-700: die per INT-019 aus einer Matrikelnummer ermittelte
// Gruppenkennung wird nicht automatisch übernommen, sondern als Vorschlag
// (`gruppenkennungVorschlag`) abgelegt; erst eine ausdrückliche Bestätigung
// überführt sie in `gruppenkennung`. Grund: INT-019 liefert auch für frei
// erfundene Matrikelnummern plausible Kennungen (`integrations.md` INT-019).

const KEY = 'scheduleSetup';

/**
 * SCHED-F-040/F-720: verbindliches Muster einer Gruppenkennung — Buchstabe und
 * Zahl sind beide verpflichtend (entschieden 2026-09-06). Eine Eingabe ohne Zahl
 * wird zurückgewiesen; der voreingestellte Weg über die Matrikelnummer (INT-019)
 * liefert die vollständige Kennung, ohne dass die Nutzerin sie kennen muss.
 */
export const GRUPPENKENNUNG_MUSTER = /^[A-Z][0-9]+$/;

export interface Einrichtung {
  /** Requirement „Auswahl der Endpunkte des Lehrangebots": gewählte INT-001-Kurznamen (`sname`), gleichrangig. */
  endpunkte: string[];
  gruppenkennung: string | null;
  /** SCHED-F-700: per INT-019 ermittelte, noch nicht bestätigte Gruppenkennung. */
  gruppenkennungVorschlag: string | null;
}

const LEER: Einrichtung = {
  endpunkte: [],
  gruppenkennung: null,
  gruppenkennungVorschlag: null,
};

let snapshot: Einrichtung = LEER;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

/**
 * design.md Entscheidung 4: migriert einen gespeicherten Stand alter Gestalt
 * (`sname`/`grade`/`zusatzFachsemester`, vormals SCHED-F-020/F-640) auf
 * `endpunkte`. `grade` und `zusatzFachsemester` entfallen ersatzlos — ihre
 * Veranstaltungen sind über den Abruf mit `grade=*` ohnehin im Bestand. Ein
 * bereits in neuer Gestalt gespeicherter Stand (`endpunkte` vorhanden) wird
 * unverändert gelesen.
 */
function bereinige(v: unknown): Einrichtung {
  const roh = (v ?? {}) as Partial<Record<string, unknown>> & { endpunkte?: unknown; sname?: unknown };
  const alsStringOderNull = (x: unknown): string | null => (typeof x === 'string' && x !== '' ? x : null);
  const alsStringListe = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((e): e is string => typeof e === 'string') : [];

  const legacySname = alsStringOderNull(roh.sname);
  const endpunkte =
    'endpunkte' in roh ? alsStringListe(roh.endpunkte) : legacySname ? [legacySname] : [];

  return {
    endpunkte,
    gruppenkennung: alsStringOderNull(roh.gruppenkennung),
    gruppenkennungVorschlag: alsStringOderNull(roh.gruppenkennungVorschlag),
  };
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<unknown>(KEY, LEER)
      .then((v) => {
        snapshot = bereinige(v);
      })
      .catch((error) => logError('einrichtung.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: Einrichtung) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('einrichtung.save', error));
}

export function readEinrichtung(): Promise<Einrichtung> {
  return readJson<unknown>(KEY, LEER).then(bereinige);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetEinrichtungForTest(): void {
  snapshot = LEER;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useEinrichtung() {
  const einrichtung = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  /** Requirement „Auswahl der Endpunkte des Lehrangebots": einen Endpunkt an- oder abwählen. */
  const endpunktUmschalten = useCallback((sname: string) => {
    const naechste = snapshot.endpunkte.includes(sname)
      ? snapshot.endpunkte.filter((e) => e !== sname)
      : [...snapshot.endpunkte, sname];
    schreiben({ ...snapshot, endpunkte: naechste });
  }, []);

  /**
   * SCHED-F-040 und Requirement „Gruppenkennung verpflichtend vor dem
   * Planungsmodus": Gruppenkennung setzen (großgeschrieben). Eine gesetzte
   * Kennung lässt sich nur durch eine andere ersetzen — eine leere Eingabe
   * bleibt bewusst wirkungslos, statt sie ersatzlos zu entfernen.
   */
  const setGruppenkennung = useCallback((wert: string) => {
    const bereinigt = wert.trim().toUpperCase();
    if (bereinigt === '') return;
    schreiben({ ...snapshot, gruppenkennung: bereinigt });
  }, []);

  /** SCHED-F-700: eine per INT-019 ermittelte Kennung als Vorschlag ablegen — noch nicht übernommen. */
  const gruppenkennungVorschlagSetzen = useCallback((vorschlag: string | null) => {
    schreiben({ ...snapshot, gruppenkennungVorschlag: vorschlag });
  }, []);

  /** SCHED-F-700: den vorliegenden Vorschlag ausdrücklich als Gruppenkennung übernehmen. */
  const gruppenkennungVorschlagBestaetigen = useCallback(() => {
    if (!snapshot.gruppenkennungVorschlag) return;
    schreiben({ ...snapshot, gruppenkennung: snapshot.gruppenkennungVorschlag, gruppenkennungVorschlag: null });
  }, []);

  /** SCHED-F-700: Vorschlag verwerfen, ohne ihn zu übernehmen. */
  const gruppenkennungVorschlagVerwerfen = useCallback(() => {
    schreiben({ ...snapshot, gruppenkennungVorschlag: null });
  }, []);

  const clear = useCallback(() => schreiben(LEER), []);

  return {
    einrichtung,
    loaded,
    endpunktUmschalten,
    setGruppenkennung,
    gruppenkennungVorschlagSetzen,
    gruppenkennungVorschlagBestaetigen,
    gruppenkennungVorschlagVerwerfen,
    clear,
  };
}

// Keine Speicherung der Matrikelnummer (entschieden 2026-09-06, vormals
// SCHED-F-710). Die Matrikelnummer ist personenbeziehbar (`integrations`
// INT-019) und wird nach der Ermittlung der Gruppenkennung nicht mehr
// gebraucht. Sie liegt deshalb ausschließlich im Arbeitsspeicher — für die
// Dauer der Eingabe und des Abrufs — und überlebt keinen App-Neustart.
// Gespeichert wird allein die bestätigte Gruppenkennung.
//
// Kein Aufräumen eines früheren Speicherschlüssels: Die App ist nicht
// ausgeliefert, es gibt kein Gerät, auf dem je eine Matrikelnummer abgelegt
// wurde.

let matrikelnummerSnapshot: string | null = null;
const matrikelnummerHoerer = new Set<() => void>();

function matrikelnummerMelden() {
  for (const h of matrikelnummerHoerer) h();
}

function bereinigeMatrikelnummer(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function matrikelnummerSubscribe(cb: () => void): () => void {
  matrikelnummerHoerer.add(cb);
  return () => {
    matrikelnummerHoerer.delete(cb);
  };
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetMatrikelnummerForTest(): void {
  matrikelnummerSnapshot = null;
  matrikelnummerHoerer.clear();
}

/**
 * Die Matrikelnummer für die Dauer der Einrichtung. Rein flüchtig — es gibt
 * bewusst kein Gegenstück zu `readMatrikelnummer`, das sie von der Platte läse.
 * `loaded` ist konstant `true`, weil nichts zu laden ist.
 */
export function useMatrikelnummer() {
  const matrikelnummer = useSyncExternalStore(matrikelnummerSubscribe, () => matrikelnummerSnapshot);

  const setMatrikelnummer = useCallback((wert: string | null) => {
    matrikelnummerSnapshot = bereinigeMatrikelnummer(wert);
    matrikelnummerMelden();
  }, []);

  return { matrikelnummer, loaded: true, setMatrikelnummer };
}
