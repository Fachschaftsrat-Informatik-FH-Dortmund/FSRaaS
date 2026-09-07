import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import type { PlanEntry, PlanEntryStatus, Weekday } from './typen';

// DATA-F-010: der persönliche Stundenplan (`PlanEntry[]`) wird ausschließlich
// lokal gespeichert. Anlegen, Ändern, Löschen, Status fest/vorgemerkt wechseln
// (SCHED-F-570) und Farbe setzen (SCHED-F-247). Reaktiver Modul-Speicher wie
// `canteen/selection.ts`.
//
// DATA-F-020 (ausdrücklich verworfenes Altverhalten der Flutter-App, siehe
// `openspec/specs/data-and-storage/spec.md`): Ein inkonsistenter gespeicherter
// Bestand wird NICHT kommentarlos gelöscht. Jeder Eintrag wird einzeln
// geprüft; ein Eintrag, der nicht dem erwarteten Schema entspricht, wird
// protokolliert und übersprungen, der lesbare Rest bleibt erhalten. Die Zahl
// der verworfenen Einträge wird über den Hook ausgewiesen, damit ein
// Bildschirm die Nutzerin informieren kann (SEC-F-060).

const KEY = 'scheduleEntries';

const WEEKDAYS: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUSES: readonly PlanEntryStatus[] = ['fest', 'vorgemerkt'];

/**
 * Prüft das Feld `akzeptierteKonflikte` (`typen.ts`): eine Liste von
 * Gegenpart-Kennungen. Ein Eintrag, dessen Feld nicht lesbar ist, fällt damit
 * durch `istGueltigerEintrag` und wird von `bereinige` einzeln übersprungen —
 * der übrige Bestand bleibt erhalten (DATA-F-020).
 */
function istKennungsliste(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((k) => typeof k === 'string');
}

function istGueltigeBasis(e: Record<string, unknown>): boolean {
  return (
    typeof e.id === 'string' &&
    e.id !== '' &&
    typeof e.status === 'string' &&
    STATUSES.includes(e.status as PlanEntryStatus) &&
    typeof e.color === 'string' &&
    typeof e.weekday === 'string' &&
    WEEKDAYS.includes(e.weekday as Weekday) &&
    typeof e.timeBeginMin === 'number' &&
    typeof e.timeEndMin === 'number' &&
    typeof e.gruppenzugehoerig === 'boolean' &&
    typeof e.abweichendeGruppe === 'boolean' &&
    istKennungsliste(e.akzeptierteKonflikte) &&
    typeof e.istPruefung === 'boolean' &&
    (e.gueltigVon === null || typeof e.gueltigVon === 'number') &&
    (e.gueltigBis === null || typeof e.gueltigBis === 'number')
  );
}

/** Prüft einen einzelnen rohen Eintrag gegen das `PlanEntry`-Schema (`typen.ts`). */
function istGueltigerEintrag(x: unknown): x is PlanEntry {
  if (typeof x !== 'object' || x === null) return false;
  const e = x as Record<string, unknown>;
  if (!istGueltigeBasis(e)) return false;

  if (e.kind === 'offiziell') {
    return (
      typeof e.courseId === 'string' &&
      typeof e.name === 'string' &&
      typeof e.courseType === 'string' &&
      typeof e.lecturerName === 'string' &&
      typeof e.studentSet === 'string' &&
      typeof e.roomId === 'string'
    );
  }
  if (e.kind === 'eigen') {
    // SCHED-F-730: wöchentlich wiederkehrend oder einmalig an einem Datum.
    return typeof e.title === 'string' && typeof e.wiederkehrend === 'boolean';
  }
  return false;
}

interface Bereinigt {
  entries: PlanEntry[];
  verworfen: number;
}

/** DATA-F-020: verwirft nur ungültige Einzeleinträge, nie den gesamten Bestand kommentarlos. */
function bereinige(roh: unknown): Bereinigt {
  if (roh === undefined || roh === null) return { entries: [], verworfen: 0 };
  if (!Array.isArray(roh)) {
    logError('planStore.load.keineListe', new Error('gespeicherter Bestand ist keine Liste'));
    return { entries: [], verworfen: 0 };
  }

  const entries: PlanEntry[] = [];
  let verworfen = 0;
  for (const eintrag of roh) {
    if (istGueltigerEintrag(eintrag)) {
      entries.push(eintrag);
    } else {
      verworfen++;
      logError('planStore.load.ungueltigerEintrag', new Error('Eintrag entspricht nicht dem PlanEntry-Schema'));
    }
  }
  return { entries, verworfen };
}

let snapshot: PlanEntry[] = [];
let verworfeneAnzahl = 0;
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
    readJson<unknown>(KEY, [])
      .then((roh) => {
        const ergebnis = bereinige(roh);
        snapshot = ergebnis.entries;
        verworfeneAnzahl = ergebnis.verworfen;
      })
      .catch((error) => logError('planStore.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: PlanEntry[]) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('planStore.save', error));
}

export function readScheduleEntries(): Promise<PlanEntry[]> {
  return readJson<unknown>(KEY, []).then((roh) => bereinige(roh).entries);
}

/**
 * SCHED-F-730: Gültigkeitszeitraum für einen einmaligen eigenen Eintrag
 * (`wiederkehrend: false`) — Beginn und Ende fallen auf dasselbe Datum
 * (Unix-Sekunden, wie `gueltigVon`/`gueltigBis` in `typen.ts`). Reine
 * Hilfsfunktion, kein eigener Zustand; der Bedienweg zum Anlegen folgt in
 * einer späteren Etappe.
 */
export function einmaligerGueltigkeitszeitraum(datum: number): { gueltigVon: number; gueltigBis: number } {
  return { gueltigVon: datum, gueltigBis: datum };
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetScheduleEntriesForTest(): void {
  snapshot = [];
  verworfeneAnzahl = 0;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useScheduleEntries() {
  const entries = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);
  const verworfeneEintraegeAnzahl = useSyncExternalStore(subscribe, () => verworfeneAnzahl);

  const hinzufuegen = useCallback((entry: PlanEntry) => schreiben([...snapshot, entry]), []);

  const aktualisieren = useCallback((id: string, patch: Partial<PlanEntry>) => {
    schreiben(snapshot.map((e) => (e.id === id ? ({ ...e, ...patch } as PlanEntry) : e)));
  }, []);

  /**
   * Entfernt einen Termin und mit ihm die Nennungen auf ihn in den übrigen
   * Einträgen — sonst wüchsen Verweise ins Leere, und eine später an dieselbe
   * Stelle tretende, nie angenommene Kollision bliebe stumm (design.md,
   * Entscheidung 2). Aufräumen im Schreibpfad, keine Migration.
   */
  const entfernen = useCallback((id: string) => {
    schreiben(
      snapshot
        .filter((e) => e.id !== id)
        .map((e) =>
          e.akzeptierteKonflikte.includes(id)
            ? ({ ...e, akzeptierteKonflikte: e.akzeptierteKonflikte.filter((k) => k !== id) } as PlanEntry)
            : e,
        ),
    );
  }, []);

  /** SCHED-F-570: Status zwischen „fest" und „vorgemerkt" wechseln. */
  const statusUmschalten = useCallback((id: string) => {
    schreiben(
      snapshot.map((e) => (e.id === id ? { ...e, status: e.status === 'fest' ? 'vorgemerkt' : 'fest' } : e)),
    );
  }, []);

  /** SCHED-F-247: Farbe eines einzelnen Termins abweichend von der Vorbelegung setzen. */
  const farbeSetzen = useCallback((id: string, color: string) => {
    schreiben(snapshot.map((e) => (e.id === id ? { ...e, color } : e)));
  }, []);

  /**
   * Requirement „Bewusste Übernahme trotz Konflikt": hält die Annahme einer
   * Kollision am **Paar** fest, indem beide Termine einander nennen. Eine
   * einseitige Eintragung gilt als nicht angenommen und erzeugt weiterhin einen
   * Hinweis (`konflikt.ts`). Kollidiert ein Termin mit mehreren, wird die
   * Annahme je Paar einzeln über einen eigenen Aufruf festgehalten.
   */
  const konfliktAnnehmen = useCallback((idA: string, idB: string) => {
    if (idA === idB) return;
    const beide = [idA, idB];
    if (!beide.every((id) => snapshot.some((e) => e.id === id))) return;
    schreiben(
      snapshot.map((e) => {
        const gegenpart = e.id === idA ? idB : e.id === idB ? idA : null;
        if (gegenpart === null || e.akzeptierteKonflikte.includes(gegenpart)) return e;
        return { ...e, akzeptierteKonflikte: [...e.akzeptierteKonflikte, gegenpart] } as PlanEntry;
      }),
    );
  }, []);

  const clear = useCallback(() => schreiben([]), []);

  return {
    entries,
    loaded,
    verworfeneEintraegeAnzahl,
    hinzufuegen,
    aktualisieren,
    entfernen,
    statusUmschalten,
    farbeSetzen,
    konfliktAnnehmen,
    clear,
  };
}
