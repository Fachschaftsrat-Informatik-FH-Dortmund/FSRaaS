// Requirement „Weiterführender Bedienweg in der Kopfzeile" (design.md,
// Entscheidung 2): Der Weg zum nächsten Schritt sitzt in der Kopfzeile
// (`app/(tabs)/(schedule)/_layout.tsx`, außerhalb der Komponentenbäume von
// `SetupScreen`, `CourseSelectionScreen` und `GruppenkennungScreen`) — dasselbe
// Register-Muster wie `modulauswahlAktion.ts` und `planungAktion.ts`.
//
// Anders als jene beiden tragen alle drei Bildschirme hier dieselbe Nutzlast,
// darum ein gemeinsames Register statt dreier Kopien. Zu jeder Zeit liegt nur
// ein Bildschirm des Stapels vorn; beim Verlassen meldet er `null`.

import { useSyncExternalStore } from 'react';

export interface WeiterAktion {
  /**
   * Ob der nächste Schritt erreichbar ist. Der Bedienweg bleibt auch ohne
   * Freigabe sichtbar und bedienbar — was beim Antippen geschieht, entscheidet
   * `weiter`: Der Schritt zur Gruppenkennung benennt dann die fehlende Angabe,
   * statt wortlos nichts zu tun (Requirement „Gruppenkennung verpflichtend vor
   * dem Planungsmodus", Szenario „Weitergehen ohne Kennung").
   */
  freigegeben: boolean;
  weiter: () => void;
}

let aktuelleAktion: WeiterAktion | null = null;
const hoerer = new Set<() => void>();

/** Vom jeweiligen Bildschirm beim Mounten/bei jeder Änderung aufgerufen; `null` beim Unmounten. */
export function registriereWeiterAktion(aktion: WeiterAktion | null): void {
  aktuelleAktion = aktion;
  for (const h of hoerer) h();
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  return () => hoerer.delete(cb);
}

/** Von der Kopfzeilen-Schaltfläche gelesen; `null`, solange kein Bildschirm mit Weiter-Weg offen ist. */
export function useWeiterAktion(): WeiterAktion | null {
  return useSyncExternalStore(subscribe, () => aktuelleAktion);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetWeiterAktionForTest(): void {
  aktuelleAktion = null;
  hoerer.clear();
}

/**
 * Nur für Tests: den angemeldeten Bedienweg lesen, ohne ihn über den Hook zu
 * beziehen. Ein Bildschirmtest prüft, was sein Bildschirm anmeldet — die
 * Anbindung von Hook und Kopfzeilen-Symbol prüft `WeiterZugang.test.tsx`.
 */
export function __leseWeiterAktionForTest(): WeiterAktion | null {
  return aktuelleAktion;
}
