import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import {
  VOREINSTELLUNGEN,
  VOREINSTELLUNGS_REIHENFOLGE,
  type KriterienParameter,
  type Kriterium,
  type Voreinstellung,
} from './planungskriterien';

// Planungseinstellungen (Spec `schedule`, Abschnitt „Datenmodell"; Change
// `planungsmodus-voreinstellungen-anpinnen`, design.md Entscheidung 7):
// gewählte Voreinstellung, Vorbereitungszeiten je Veranstaltungsart und
// Mindestabstand Vorlesung–Übung. Rein gerätelokal (DATA-F-010), reaktiver
// Modulspeicher wie `ansichtEinstellungen.ts`. Ein unlesbarer gespeicherter
// Wert fällt einzeln auf seine Vorgabe zurück und wird protokolliert, statt
// den Rest zu verwerfen (DATA-F-020, SEC-F-060).

const KEY = 'schedulePlanungSettings';

export const VORBEREITUNG_SCHRITT_MIN = 15;
export const VORBEREITUNG_MAX_MIN = 240;
/** Unter einer Woche — sonst überholte ein Fehlbetrag die Wertung „Übung vor der Vorlesung" (design.md, Entscheidung 1). */
export const ABSTAND_MAX_MIN = 6 * 24 * 60;
export const ABSTAND_SCHRITT_MIN = 60;

export interface PlanungsEinstellungen {
  voreinstellung: Voreinstellung;
  vorbereitungAllgemeinMin: number;
  /** Requirement „Vorbereitungszeit je Veranstaltungsart": nur die abweichenden Arten. */
  vorbereitungJeArt: Record<string, number>;
  abstandVorlesungUebungMin: number;
}

export const STANDARD_PLANUNG: PlanungsEinstellungen = {
  voreinstellung: 'fahrtenZurUni',
  vorbereitungAllgemeinMin: 30,
  vorbereitungJeArt: {},
  abstandVorlesungUebungMin: 0,
};

function begrenzt(x: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(x)));
}

function alsMinuten(x: unknown, standard: number, max: number, feld: string): number {
  if (x === undefined) return standard;
  if (typeof x === 'number' && Number.isFinite(x)) return begrenzt(x, max);
  logError('planungseinstellungen.load.ungueltig', new Error(`Feld ${feld} nicht lesbar`));
  return standard;
}

function bereinige(v: unknown): PlanungsEinstellungen {
  const roh = (v ?? {}) as Partial<Record<keyof PlanungsEinstellungen, unknown>>;

  let voreinstellung = STANDARD_PLANUNG.voreinstellung;
  if (VOREINSTELLUNGS_REIHENFOLGE.includes(roh.voreinstellung as Voreinstellung)) {
    voreinstellung = roh.voreinstellung as Voreinstellung;
  } else if (roh.voreinstellung !== undefined) {
    logError('planungseinstellungen.load.ungueltig', new Error('Feld voreinstellung nicht lesbar'));
  }

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
    logError('planungseinstellungen.load.ungueltig', new Error('Feld vorbereitungJeArt nicht lesbar'));
  }

  return {
    voreinstellung,
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
  };
}

/** Die Rangfolge der gewählten Voreinstellung (Requirement „Kriterienrangfolge für die Planung"). */
export function rangfolgeAus(e: PlanungsEinstellungen): readonly Kriterium[] {
  return VOREINSTELLUNGEN[e.voreinstellung];
}

/** Die Parameter der Kriterien. Ein Zeitfenster gibt es in diesem Zug noch nicht (proposal.md, „Nicht in diesem Change"). */
export function parameterAus(e: PlanungsEinstellungen): KriterienParameter {
  return {
    vorbereitungAllgemeinMin: e.vorbereitungAllgemeinMin,
    vorbereitungJeArt: e.vorbereitungJeArt,
    abstandVorlesungUebungMin: e.abstandVorlesungUebungMin,
    zeitfenster: null,
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
    schreiben({ ...snapshot, voreinstellung });
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
    vorbereitungAllgemeinSetzen,
    vorbereitungFuerArtSetzen,
    abstandVorlesungUebungSetzen,
  };
}
