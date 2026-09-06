import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, removeKey, writeJson } from '@/storage/kv';

// SCHED-F-020/F-040/F-640: die einmalig gewählte Einrichtung des Stundenplans —
// Studiengang (`sname`) mit Fachsemester (`grade`), optionale Gruppenkennung
// (SCHED-F-040, Muster `^[A-Z][0-9]+$` — Buchstabe und Zahl beide
// verpflichtend, SCHED-F-720) und die zusätzlich abgerufenen Fachsemester
// desselben Studiengangs (SCHED-F-640, z. B. für Wiederholerinnen oder
// Vorzieherinnen). Rein gerätelokal (DATA-F-010). Reaktiver Modul-Speicher wie
// `canteen/selection.ts`, damit alle Stundenplan-Bildschirme denselben Stand
// teilen.
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
  sname: string | null;
  grade: string | null;
  gruppenkennung: string | null;
  /** SCHED-F-640: weitere, zusätzlich abgerufene Fachsemester desselben Studiengangs. */
  zusatzFachsemester: string[];
  /** SCHED-F-700: per INT-019 ermittelte, noch nicht bestätigte Gruppenkennung. */
  gruppenkennungVorschlag: string | null;
}

const LEER: Einrichtung = {
  sname: null,
  grade: null,
  gruppenkennung: null,
  zusatzFachsemester: [],
  gruppenkennungVorschlag: null,
};

let snapshot: Einrichtung = LEER;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function bereinige(v: unknown): Einrichtung {
  const roh = (v ?? {}) as Partial<Record<keyof Einrichtung, unknown>>;
  const alsStringOderNull = (x: unknown): string | null => (typeof x === 'string' && x !== '' ? x : null);
  const alsStringListe = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((e): e is string => typeof e === 'string') : [];
  return {
    sname: alsStringOderNull(roh.sname),
    grade: alsStringOderNull(roh.grade),
    gruppenkennung: alsStringOderNull(roh.gruppenkennung),
    zusatzFachsemester: alsStringListe(roh.zusatzFachsemester),
    gruppenkennungVorschlag: alsStringOderNull(roh.gruppenkennungVorschlag),
  };
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<Einrichtung>(KEY, LEER)
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
  return readJson<Einrichtung>(KEY, LEER).then(bereinige);
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

  /** SCHED-F-020: Studiengang und Fachsemester gemeinsam setzen (ein neuer Studiengang verwirft SCHED-F-640-Zusatzsemester). */
  const setStudiengangUndFachsemester = useCallback((sname: string, grade: string) => {
    schreiben({ ...snapshot, sname, grade, zusatzFachsemester: [] });
  }, []);

  const setFachsemester = useCallback((grade: string) => {
    schreiben({ ...snapshot, grade });
  }, []);

  /** SCHED-F-040: Gruppenkennung setzen (großgeschrieben) oder mit `null` entfernen. */
  const setGruppenkennung = useCallback((wert: string | null) => {
    const bereinigt = wert && wert.trim() !== '' ? wert.trim().toUpperCase() : null;
    schreiben({ ...snapshot, gruppenkennung: bereinigt });
  }, []);

  /** SCHED-F-640: ein weiteres Fachsemester desselben Studiengangs zusätzlich abrufen. */
  const zusatzFachsemesterHinzufuegen = useCallback((grade: string) => {
    if (snapshot.zusatzFachsemester.includes(grade)) return;
    schreiben({ ...snapshot, zusatzFachsemester: [...snapshot.zusatzFachsemester, grade] });
  }, []);

  const zusatzFachsemesterEntfernen = useCallback((grade: string) => {
    schreiben({ ...snapshot, zusatzFachsemester: snapshot.zusatzFachsemester.filter((g) => g !== grade) });
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
    setStudiengangUndFachsemester,
    setFachsemester,
    setGruppenkennung,
    zusatzFachsemesterHinzufuegen,
    zusatzFachsemesterEntfernen,
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
// Der frühere Speicherschlüssel `scheduleMatrikelnummer` wird beim ersten
// Zugriff gelöscht: Ohne das bliebe auf einem Gerät, das die App vor dem
// 2026-09-06 genutzt hat, eine Matrikelnummer dauerhaft liegen — die
// Anforderung wäre dort nicht erfüllt.

const MATRIKELNUMMER_ALTSCHLUESSEL = 'scheduleMatrikelnummer';

let matrikelnummerSnapshot: string | null = null;
let altbestandGeloescht = false;
const matrikelnummerHoerer = new Set<() => void>();

function matrikelnummerMelden() {
  for (const h of matrikelnummerHoerer) h();
}

function bereinigeMatrikelnummer(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function matrikelnummerSubscribe(cb: () => void): () => void {
  matrikelnummerHoerer.add(cb);
  if (!altbestandGeloescht) {
    altbestandGeloescht = true;
    removeKey(MATRIKELNUMMER_ALTSCHLUESSEL).catch((error) =>
      logError('einrichtung.matrikelnummer.altbestand', error),
    );
  }
  return () => {
    matrikelnummerHoerer.delete(cb);
  };
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetMatrikelnummerForTest(): void {
  matrikelnummerSnapshot = null;
  altbestandGeloescht = false;
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
