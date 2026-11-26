import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import {
  KRITERIEN,
  VOREINSTELLUNGEN,
  VOREINSTELLUNGS_REIHENFOLGE,
  type KriterienParameter,
  type Kriterium,
  type Voreinstellung,
} from './planungskriterien';

// Planungseinstellungen (Spec `schedule`, Abschnitt „Datenmodell"; Change
// `planungsmodus-voreinstellungen-anpinnen`, design.md Entscheidungen 7 und 8;
// Change `planungsmodus-rangfolge-frei`, design.md Entscheidungen 1 bis 3):
// Kriterienrangfolge, Vorbereitungszeiten je Veranstaltungsart, Mindestabstand
// Vorlesung–Übung, bevorzugtes Zeitfenster und die als Pflicht markierten
// Module. Rein gerätelokal (DATA-F-010), reaktiver Modulspeicher wie
// `ansichtEinstellungen.ts`. Ein unlesbarer gespeicherter Wert fällt einzeln
// auf seine Vorgabe zurück und wird protokolliert, statt den Rest zu verwerfen
// (DATA-F-020, SEC-F-060).

const KEY = 'schedulePlanungSettings';

export const VORBEREITUNG_SCHRITT_MIN = 15;
export const VORBEREITUNG_MAX_MIN = 240;
/** Unter einer Woche — sonst überholte ein Fehlbetrag die Wertung „Übung vor der Vorlesung" (design.md, Entscheidung 1). */
export const ABSTAND_MAX_MIN = 6 * 24 * 60;
export const ABSTAND_SCHRITT_MIN = 60;
/** Requirement „Bevorzugtes Zeitfenster festlegen": halbstündlich von 6:00 bis 22:00. */
export const ZEITFENSTER_SCHRITT_MIN = 30;
export const ZEITFENSTER_FRUEHESTENS_MIN = 6 * 60;
export const ZEITFENSTER_SPAETESTENS_MIN = 22 * 60;

export interface Zeitfenster {
  vonMin: number;
  bisMin: number;
}

export const STANDARD_ZEITFENSTER: Zeitfenster = { vonMin: 8 * 60, bisMin: 18 * 60 };

export interface PlanungsEinstellungen {
  /**
   * Requirement „Kriterienrangfolge für die Planung": die eingeschalteten
   * Kriterien in ihrer Rangfolge. Was fehlt, ist abgeschaltet (Change
   * `planungsmodus-rangfolge-frei`, design.md Entscheidung 1).
   */
  rangfolge: Kriterium[];
  vorbereitungAllgemeinMin: number;
  /** Requirement „Vorbereitungszeit je Veranstaltungsart": nur die abweichenden Arten. */
  vorbereitungJeArt: Record<string, number>;
  abstandVorlesungUebungMin: number;
  /** Requirement „Bevorzugtes Zeitfenster festlegen"; `null`, solange keines festgelegt ist. */
  zeitfenster: Zeitfenster | null;
  /** Requirement „Kandidat als Pflicht markieren": Modulschlüssel (`Modul.key`). */
  pflichtModule: string[];
}

export const STANDARD_PLANUNG: PlanungsEinstellungen = {
  rangfolge: [...VOREINSTELLUNGEN.fahrtenZurUni],
  vorbereitungAllgemeinMin: 30,
  vorbereitungJeArt: {},
  abstandVorlesungUebungMin: 0,
  zeitfenster: null,
  pflichtModule: [],
};

function begrenzt(x: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(x)));
}

function ungueltig(feld: string): void {
  logError('planungseinstellungen.load.ungueltig', new Error(`Feld ${feld} nicht lesbar`));
}

function alsMinuten(x: unknown, standard: number, max: number, feld: string): number {
  if (x === undefined) return standard;
  if (typeof x === 'number' && Number.isFinite(x)) return begrenzt(x, max);
  ungueltig(feld);
  return standard;
}

/**
 * Bereinigt eine gespeicherte Rangfolge eintragsweise: unbekannte und doppelte
 * Kriterien entfallen einzeln, der Rest bleibt in seiner Reihenfolge. Ein
 * Bestand aus dem ersten Zug kennt nur die Voreinstellung — dann füllt diese
 * die Rangfolge (Change `planungsmodus-rangfolge-frei`, design.md
 * Entscheidung 1).
 */
function bereinigeRangfolge(roh: unknown, voreinstellungRoh: unknown): Kriterium[] {
  if (Array.isArray(roh)) {
    const rangfolge: Kriterium[] = [];
    for (const k of roh) {
      if (KRITERIEN.includes(k as Kriterium) && !rangfolge.includes(k as Kriterium)) rangfolge.push(k as Kriterium);
      else ungueltig(`rangfolge (${String(k)})`);
    }
    return rangfolge;
  }
  if (roh !== undefined) ungueltig('rangfolge');
  if (VOREINSTELLUNGS_REIHENFOLGE.includes(voreinstellungRoh as Voreinstellung)) {
    return [...VOREINSTELLUNGEN[voreinstellungRoh as Voreinstellung]];
  }
  if (voreinstellungRoh !== undefined) ungueltig('voreinstellung');
  return [...STANDARD_PLANUNG.rangfolge];
}

export function zeitfensterGueltig(z: Zeitfenster): boolean {
  return (
    Number.isFinite(z.vonMin) &&
    Number.isFinite(z.bisMin) &&
    z.vonMin >= ZEITFENSTER_FRUEHESTENS_MIN &&
    z.bisMin <= ZEITFENSTER_SPAETESTENS_MIN &&
    z.vonMin < z.bisMin
  );
}

function bereinigeZeitfenster(roh: unknown): Zeitfenster | null {
  if (roh === undefined || roh === null) return null;
  const z = roh as Partial<Record<keyof Zeitfenster, unknown>>;
  if (typeof z.vonMin === 'number' && typeof z.bisMin === 'number') {
    const fenster = { vonMin: z.vonMin, bisMin: z.bisMin };
    if (zeitfensterGueltig(fenster)) return fenster;
  }
  ungueltig('zeitfenster');
  return null;
}

function bereinigePflicht(roh: unknown): string[] {
  if (roh === undefined) return [];
  if (!Array.isArray(roh)) {
    ungueltig('pflichtModule');
    return [];
  }
  const keys: string[] = [];
  for (const k of roh) {
    if (typeof k === 'string' && !keys.includes(k)) keys.push(k);
    else ungueltig('pflichtModule');
  }
  return keys;
}

function bereinige(v: unknown): PlanungsEinstellungen {
  const roh = (v ?? {}) as Partial<Record<keyof PlanungsEinstellungen | 'voreinstellung', unknown>>;

  const vorbereitungJeArt: Record<string, number> = {};
  if (typeof roh.vorbereitungJeArt === 'object' && roh.vorbereitungJeArt !== null) {
    for (const [art, wert] of Object.entries(roh.vorbereitungJeArt as Record<string, unknown>)) {
      if (typeof wert === 'number' && Number.isFinite(wert)) {
        vorbereitungJeArt[art] = begrenzt(wert, VORBEREITUNG_MAX_MIN);
      } else {
        logError('planungseinstellungen.load.ungueltig', new Error(`Vorbereitungszeit für ${art} nicht lesbar`));
      }
    }
  } else if (roh.vorbereitungJeArt !== undefined) {
    ungueltig('vorbereitungJeArt');
  }

  return {
    rangfolge: bereinigeRangfolge(roh.rangfolge, roh.voreinstellung),
    vorbereitungAllgemeinMin: alsMinuten(
      roh.vorbereitungAllgemeinMin,
      STANDARD_PLANUNG.vorbereitungAllgemeinMin,
      VORBEREITUNG_MAX_MIN,
      'vorbereitungAllgemeinMin',
    ),
    vorbereitungJeArt,
    abstandVorlesungUebungMin: alsMinuten(
      roh.abstandVorlesungUebungMin,
      STANDARD_PLANUNG.abstandVorlesungUebungMin,
      ABSTAND_MAX_MIN,
      'abstandVorlesungUebungMin',
    ),
    zeitfenster: bereinigeZeitfenster(roh.zeitfenster),
    pflichtModule: bereinigePflicht(roh.pflichtModule),
  };
}

/** Die eingeschalteten Kriterien in ihrer Rangfolge (Requirement „Kriterienrangfolge für die Planung"). */
export function rangfolgeAus(e: PlanungsEinstellungen): readonly Kriterium[] {
  return e.rangfolge;
}

/**
 * Die Voreinstellung, deren Rangfolge der eingestellten genau entspricht;
 * `null` bei einer eigenen Rangfolge (Change `planungsmodus-rangfolge-frei`,
 * design.md Entscheidung 1).
 */
export function voreinstellungAus(e: PlanungsEinstellungen): Voreinstellung | null {
  return (
    VOREINSTELLUNGS_REIHENFOLGE.find((v) => {
      const liste = VOREINSTELLUNGEN[v];
      return liste.length === e.rangfolge.length && liste.every((k, i) => e.rangfolge[i] === k);
    }) ?? null
  );
}

/** Schaltet ein Kriterium ein (ans Ende der Rangfolge) oder ab (design.md, Entscheidung 1). */
export function kriteriumUmschalten(rangfolge: readonly Kriterium[], kriterium: Kriterium): Kriterium[] {
  return rangfolge.includes(kriterium) ? rangfolge.filter((k) => k !== kriterium) : [...rangfolge, kriterium];
}

/** Verschiebt ein eingeschaltetes Kriterium um eine Stelle; am Rand bleibt alles, wie es ist (design.md, Entscheidung 2). */
export function kriteriumVerschieben(
  rangfolge: readonly Kriterium[],
  kriterium: Kriterium,
  richtung: -1 | 1,
): Kriterium[] {
  const i = rangfolge.indexOf(kriterium);
  const j = i + richtung;
  if (i === -1 || j < 0 || j >= rangfolge.length) return [...rangfolge];
  const naechste = [...rangfolge];
  naechste[i] = rangfolge[j]!;
  naechste[j] = kriterium;
  return naechste;
}

/** Die Parameter der Kriterien. */
export function parameterAus(e: PlanungsEinstellungen): KriterienParameter {
  return {
    vorbereitungAllgemeinMin: e.vorbereitungAllgemeinMin,
    vorbereitungJeArt: e.vorbereitungJeArt,
    abstandVorlesungUebungMin: e.abstandVorlesungUebungMin,
    zeitfenster: e.zeitfenster,
  };
}

let snapshot: PlanungsEinstellungen = STANDARD_PLANUNG;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<unknown>(KEY, STANDARD_PLANUNG)
      .then((v) => {
        snapshot = bereinige(v);
      })
      .catch((error) => logError('planungseinstellungen.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: PlanungsEinstellungen) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('planungseinstellungen.save', error));
}

export function readPlanungsEinstellungen(): Promise<PlanungsEinstellungen> {
  return readJson<unknown>(KEY, STANDARD_PLANUNG).then(bereinige);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetPlanungsEinstellungenForTest(): void {
  snapshot = STANDARD_PLANUNG;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function usePlanungsEinstellungen() {
  const einstellungen = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const voreinstellungSetzen = useCallback((voreinstellung: Voreinstellung) => {
    schreiben({ ...snapshot, rangfolge: [...VOREINSTELLUNGEN[voreinstellung]] });
  }, []);

  const kriteriumSchalten = useCallback((kriterium: Kriterium) => {
    schreiben({ ...snapshot, rangfolge: kriteriumUmschalten(snapshot.rangfolge, kriterium) });
  }, []);

  const kriteriumBewegen = useCallback((kriterium: Kriterium, richtung: -1 | 1) => {
    schreiben({ ...snapshot, rangfolge: kriteriumVerschieben(snapshot.rangfolge, kriterium, richtung) });
  }, []);

  /** `null` nimmt das Zeitfenster zurück; ein ungültiges Fenster (Beginn nicht vor dem Ende) wird nicht übernommen. */
  const zeitfensterSetzen = useCallback((zeitfenster: Zeitfenster | null) => {
    if (zeitfenster !== null && !zeitfensterGueltig(zeitfenster)) return;
    schreiben({ ...snapshot, zeitfenster });
  }, []);

  const pflichtUmschalten = useCallback((modulKey: string) => {
    const pflichtModule = snapshot.pflichtModule.includes(modulKey)
      ? snapshot.pflichtModule.filter((k) => k !== modulKey)
      : [...snapshot.pflichtModule, modulKey];
    schreiben({ ...snapshot, pflichtModule });
  }, []);

  const vorbereitungAllgemeinSetzen = useCallback((minuten: number) => {
    schreiben({ ...snapshot, vorbereitungAllgemeinMin: begrenzt(minuten, VORBEREITUNG_MAX_MIN) });
  }, []);

  /** `null` nimmt die Abweichung zurück — die Art fällt auf den allgemeinen Wert. */
  const vorbereitungFuerArtSetzen = useCallback((art: string, minuten: number | null) => {
    const naechste = { ...snapshot.vorbereitungJeArt };
    if (minuten === null) delete naechste[art];
    else naechste[art] = begrenzt(minuten, VORBEREITUNG_MAX_MIN);
    schreiben({ ...snapshot, vorbereitungJeArt: naechste });
  }, []);

  const abstandVorlesungUebungSetzen = useCallback((minuten: number) => {
    schreiben({ ...snapshot, abstandVorlesungUebungMin: begrenzt(minuten, ABSTAND_MAX_MIN) });
  }, []);

  return {
    einstellungen,
    loaded,
    voreinstellungSetzen,
    kriteriumSchalten,
    kriteriumBewegen,
    zeitfensterSetzen,
    pflichtUmschalten,
    vorbereitungAllgemeinSetzen,
    vorbereitungFuerArtSetzen,
    abstandVorlesungUebungSetzen,
  };
}
