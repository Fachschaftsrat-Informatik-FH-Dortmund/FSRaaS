import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import type { PlanEntry } from './typen';

// Requirements „Eigener Name je Modul" und „Geltungsbereich des eigenen
// Namens" (Change `modul-umbenennen-und-namenskuerzung`, design.md
// Entscheidungen 1, 2 und 4).
//
// Die Zuordnung Modul → eigener Name liegt ausschließlich auf dem Gerät und
// wird an kein Ziel übertragen; vordefinierte oder zentral gepflegte Namen
// gibt es nicht (am 2026-09-11 verworfen). Sie hängt am Modul, nicht am
// einzelnen Planeintrag — ein später in den Plan aufgenommener Termin
// desselben Moduls findet sie deshalb ohne weiteres Zutun vor.
//
// DATA-F-020: Ein ungültiger gespeicherter Eintrag wird einzeln protokolliert
// und übersprungen, der lesbare Rest bleibt erhalten (wie `planStore.ts`).

const KEY = 'scheduleModuleNames';

/** Höchstlänge eines eigenen Namens (design.md, Entscheidung 5). */
export const MODULNAME_MAX_LAENGE = 40;

export type Modulnamen = Readonly<Record<string, string>>;

/**
 * Modulschlüssel eines Planeintrags: `courseId`, ersatzweise der offizielle
 * Name — dieselbe Regel wie die modulweite Farbwahl (`farbeFuerModulSetzen`,
 * `planStore.ts`). Ein eigener Termin gehört keinem Modul an: `null`.
 */
export function modulSchluesselVon(entry: PlanEntry): string | null {
  if (entry.kind !== 'offiziell') return null;
  return entry.courseId.trim() !== '' ? entry.courseId : entry.name;
}

/** Offizielle Bezeichnung eines offiziellen Termins bzw. Titel eines eigenen. */
function offiziellerTitel(entry: PlanEntry): string {
  return entry.kind === 'offiziell' ? entry.name : entry.title;
}

/** Der eigene Name des Moduls, dem der Eintrag angehört, sonst `null`. */
export function eigenerNameVon(entry: PlanEntry, namen: Modulnamen): string | null {
  const schluessel = modulSchluesselVon(entry);
  if (schluessel === null) return null;
  return Object.prototype.hasOwnProperty.call(namen, schluessel) ? namen[schluessel]! : null;
}

/**
 * Titel einer Stundenplan-Kachel: der eigene Name des Moduls, sonst die
 * offizielle Bezeichnung. Ausschließlich für `TerminKachel` bestimmt —
 * Modulauswahl, Planungsmodus und Termindetail führen die offizielle
 * Bezeichnung (Requirement „Geltungsbereich des eigenen Namens").
 */
export function kachelTitel(entry: PlanEntry, namen: Modulnamen): string {
  return eigenerNameVon(entry, namen) ?? offiziellerTitel(entry);
}

function bereinige(roh: unknown): Record<string, string> {
  if (roh === undefined || roh === null) return {};
  if (typeof roh !== 'object' || Array.isArray(roh)) {
    logError('modulnamen.load.keinObjekt', new Error('gespeicherte Modulnamen sind kein Objekt'));
    return {};
  }
  const namen: Record<string, string> = {};
  for (const [schluessel, name] of Object.entries(roh as Record<string, unknown>)) {
    if (typeof name === 'string' && name.trim() !== '') {
      namen[schluessel] = name;
    } else {
      logError('modulnamen.load.ungueltigerEintrag', new Error('eigener Modulname ist keine nichtleere Zeichenkette'));
    }
  }
  return namen;
}

let snapshot: Modulnamen = {};
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
    readJson<unknown>(KEY, {})
      .then((roh) => {
        snapshot = bereinige(roh);
      })
      .catch((error) => logError('modulnamen.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: Modulnamen) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('modulnamen.save', error));
}

export function readModulnamen(): Promise<Modulnamen> {
  return readJson<unknown>(KEY, {}).then(bereinige);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetModulnamenForTest(): void {
  snapshot = {};
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useModulnamen() {
  const namen = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  /** Setzt den eigenen Namen eines Moduls; ein leerer Name wird nicht gespeichert. */
  const setzen = useCallback((schluessel: string, name: string) => {
    const bereinigt = name.trim().slice(0, MODULNAME_MAX_LAENGE);
    if (bereinigt === '') return;
    schreiben({ ...snapshot, [schluessel]: bereinigt });
  }, []);

  /** Entfernt den eigenen Namen eines Moduls; danach gilt wieder die offizielle Bezeichnung. */
  const entfernen = useCallback((schluessel: string) => {
    if (!Object.prototype.hasOwnProperty.call(snapshot, schluessel)) return;
    const { [schluessel]: _entfernt, ...rest } = snapshot;
    schreiben(rest);
  }, []);

  return { namen, loaded, setzen, entfernen };
}
