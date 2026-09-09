// Requirement „Verwerfen der Modulauswahl" (design.md, Entscheidung 7): das
// Verwerfen-Symbol der Modulauswahl sitzt in der Kopfzeile
// (`app/(tabs)/(schedule)/_layout.tsx`, außerhalb des Komponentenbaums von
// `CourseSelectionScreen`) — dasselbe Register-Muster wie `planungAktion.ts`,
// als zweites Register derselben Bauart statt eines geteilten.

import { useSyncExternalStore } from 'react';

export interface ModulauswahlAktion {
  verwerfen: () => void;
}

let aktuelleAktion: ModulauswahlAktion | null = null;
const hoerer = new Set<() => void>();

/** Von der Modulauswahl beim Mounten/bei jeder Änderung aufgerufen; `null` beim Unmounten. */
export function registriereModulauswahlAktion(aktion: ModulauswahlAktion | null): void {
  aktuelleAktion = aktion;
  for (const h of hoerer) h();
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  return () => hoerer.delete(cb);
}

/** Von der Kopfzeilen-Schaltfläche gelesen; `null`, solange die Modulauswahl nicht geöffnet ist. */
export function useModulauswahlAktion(): ModulauswahlAktion | null {
  return useSyncExternalStore(subscribe, () => aktuelleAktion);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetModulauswahlAktionForTest(): void {
  aktuelleAktion = null;
  hoerer.clear();
}
