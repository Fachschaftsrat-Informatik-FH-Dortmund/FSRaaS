import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import type { PlanEntry, Weekday } from './typen';

// DATA-F-010: der persönliche Stundenplan (`PlanEntry[]`) wird ausschließlich
// lokal gespeichert. Anlegen, Ändern, Löschen, Deaktivieren (Requirement
// „Deaktivieren eines Termins") und Farbe setzen (SCHED-F-247). Reaktiver
// Modul-Speicher wie `canteen/selection.ts`.
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

/**
 * Prüft das Feld `akzeptierteKonflikte` (`typen.ts`): eine Liste von
 * Gegenpart-Kennungen. Ein Eintrag, dessen Feld nicht lesbar ist, fällt damit
 * durch `istGueltigerEintrag` und wird von `bereinige` einzeln übersprungen —
 * der übrige Bestand bleibt erhalten (DATA-F-020).
 */
function istKennungsliste(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((k) => typeof k === 'string');
}

function istGueltigeDeaktiviertBis(x: unknown): boolean {
  return x === null || x === 'dauerhaft' || typeof x === 'number';
}

function istGueltigeBasis(e: Record<string, unknown>): boolean {
  return (
    typeof e.id === 'string' &&
    e.id !== '' &&
    istGueltigeDeaktiviertBis(e.deaktiviertBis) &&
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
  for (const roheintrag of roh) {
    if (istGueltigerEintrag(roheintrag)) {
      entries.push(roheintrag);
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

/**
 * Requirement „Gültigkeitszeitraum je Eintrag änderbar" (design.md,
 * Entscheidung 8): `wiederkehrend` wird aus dem Zeitraum abgeleitet, statt
 * unabhängig davon geführt zu werden — sonst ließe sich ein als „einmalig"
 * geführter Eintrag über einen freien Zeitraum auf mehrere Wochen spannen,
 * ohne dass das Kennzeichen mitzöge. Nur ein Zeitraum von genau einem Tag
 * (`gueltigVon === gueltigBis`, beide gesetzt) gilt als einmalig; ein
 * offener oder mehrtägiger Zeitraum gilt als wiederkehrend.
 */
export function wiederkehrendAusZeitraum(gueltigVon: number | null, gueltigBis: number | null): boolean {
  return !(gueltigVon !== null && gueltigVon === gueltigBis);
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

  /**
   * Requirement „Deaktivieren eines Termins": setzt oder nimmt die Deaktivierung
   * eines Termins zurück. `null` aktiviert ihn wieder, `'dauerhaft'` deaktiviert
   * ihn bis zur Rücknahme, eine Zahl (Unix-Sekunden) deaktiviert ihn bis zu
   * diesem Zeitpunkt (Reichweite „nur dieses Vorkommen",
   * `wochenrechnung.endeDesNaechstenVorkommens`). Verlustfrei: alle übrigen
   * Angaben des Eintrags bleiben unverändert.
   */
  const deaktivierungSetzen = useCallback((id: string, deaktiviertBis: null | 'dauerhaft' | number) => {
    schreiben(snapshot.map((e) => (e.id === id ? ({ ...e, deaktiviertBis } as PlanEntry) : e)));
  }, []);

  /** SCHED-F-247: Farbe eines einzelnen Termins abweichend von der Vorbelegung setzen. */
  const farbeSetzen = useCallback((id: string, color: string) => {
    schreiben(snapshot.map((e) => (e.id === id ? { ...e, color } : e)));
  }, []);

  /**
   * Requirement „Farbwahl je Termin", Szenario „Geltungsbereich erfragen":
   * setzt die Farbe für alle offiziellen Planeinträge desselben Moduls —
   * derselbe Gruppierungsschlüssel wie in `kursbaum.ts` (`courseId`,
   * ersatzweise `name`). Eigene Termine kennen kein Modul und sind hier nie
   * betroffen.
   */
  const farbeFuerModulSetzen = useCallback((courseId: string, name: string, color: string) => {
    const basis = courseId.trim() !== '' ? courseId : name;
    schreiben(
      snapshot.map((e) => {
        if (e.kind !== 'offiziell') return e;
        const eBasis = e.courseId.trim() !== '' ? e.courseId : e.name;
        return eBasis === basis ? { ...e, color } : e;
      }),
    );
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

  /**
   * Requirement „Nutzeraktion „Stundenplan leeren"": entfernt die offiziellen
   * Termine, lässt selbst angelegte (`kind: 'eigen'`) stehen, sofern
   * `eigeneMitentfernen` nicht ausdrücklich zustimmt — sie sind Handarbeit und
   * im FBWS nicht wiederbeschaffbar, anders als die offiziellen.
   */
  const clear = useCallback((eigeneMitentfernen: boolean = false) => {
    schreiben(eigeneMitentfernen ? [] : snapshot.filter((e) => e.kind === 'eigen'));
  }, []);

  /**
   * Requirement „Ausdrückliches Sichern der Planung": übernimmt die im
   * Planungsmodus gesammelten Entscheidungen in **einem** Schreibvorgang —
   * neue Einträge, Löschungen abgewählter bestehender Einträge und
   * Aktualisierungen (z. B. eine im Planungsmodus akzeptierte Kollision mit
   * einem bereits gespeicherten Termin) wirken gemeinsam, nicht schrittweise.
   */
  const mehrereUebernehmen = useCallback(
    (
      hinzuzufuegen: readonly PlanEntry[],
      zuEntfernendeIds: readonly string[],
      aktualisierungen: readonly { id: string; patch: Partial<PlanEntry> }[] = [],
    ) => {
      const patchesJeId = new Map(aktualisierungen.map((a) => [a.id, a.patch]));
      const rest = snapshot
        .filter((e) => !zuEntfernendeIds.includes(e.id))
        .map((e) => {
          const patch = patchesJeId.get(e.id);
          return patch ? ({ ...e, ...patch } as PlanEntry) : e;
        });
      schreiben([...rest, ...hinzuzufuegen]);
    },
    [],
  );

  return {
    entries,
    loaded,
    verworfeneEintraegeAnzahl,
    hinzufuegen,
    aktualisieren,
    entfernen,
    deaktivierungSetzen,
    farbeSetzen,
    farbeFuerModulSetzen,
    konfliktAnnehmen,
    mehrereUebernehmen,
    clear,
  };
}
