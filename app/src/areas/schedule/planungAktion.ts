// Requirement „Ausdrückliches Sichern der Planung": das Speichern-Symbol sitzt
// in der Kopfzeile (`app/(tabs)/(schedule)/_layout.tsx`, außerhalb des
// Komponentenbaums von `PlanungScreen`) — dasselbe Muster wie
// `FilterResetAction`/`dietPreference` beim Mensaplan. Anders als jeder andere
// Speicher des Bereichs (`planStore.ts`, `einrichtung.ts`, …) wird hier
// bewusst NICHT persistiert (design.md, Entscheidung 6): Der Zwischenstand
// lebt allein für die Lebensdauer des geöffneten Planungsmodus im
// Arbeitsspeicher, ein Absturz oder Tabwechsel verwirft ihn folgenlos.

import { useSyncExternalStore } from 'react';

export interface PlanungAktion {
  hatUngesicherteAenderungen: boolean;
  sichern: () => void;
}

let aktuelleAktion: PlanungAktion | null = null;
const hoerer = new Set<() => void>();

/** Vom Planungsmodus beim Mounten/bei jeder Änderung aufgerufen; `null` beim Unmounten. */
export function registriereePlanungAktion(aktion: PlanungAktion | null): void {
  aktuelleAktion = aktion;
  for (const h of hoerer) h();
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  return () => hoerer.delete(cb);
}

/** Von der Kopfzeilen-Schaltfläche gelesen; `null`, solange der Planungsmodus nicht geöffnet ist. */
export function usePlanungAktion(): PlanungAktion | null {
  return useSyncExternalStore(subscribe, () => aktuelleAktion);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetPlanungAktionForTest(): void {
  aktuelleAktion = null;
  hoerer.clear();
}
