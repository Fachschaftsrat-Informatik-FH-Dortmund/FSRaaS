// Requirement „Weiterführender Bedienweg in der Kopfzeile" (design.md,
// Entscheidung 2): Der Weg zum nächsten Schritt sitzt in der Kopfzeile
// (`app/(tabs)/(schedule)/_layout.tsx`, außerhalb der Komponentenbäume von
// `SetupScreen`, `CourseSelectionScreen` und `GruppenkennungScreen`) — dasselbe
// Register-Muster wie `modulauswahlAktion.ts` und `planungAktion.ts`.
//
// Anders als jene beiden tragen alle drei Bildschirme hier dieselbe Nutzlast,
// darum ein gemeinsames Register statt dreier Kopien. Zu jeder Zeit liegt nur
// ein Bildschirm des Stapels vorn; beim Verlassen meldet er sich ab.
//
// Weil sich mehrere Bildschirme dasselbe Register teilen, trägt jede Anmeldung
// eine Besitzermarke (Change `weiter-bedienweg-absturzschutz`, design.md
// Entscheidung 1). Abgemeldet wird nur, wer noch eingetragen ist: Beim
// Vorwärtsnavigieren meldet der nachfolgende Bildschirm seinen Weg an, bevor
// der vorige den Fokus verliert — ohne Marke löschte dessen Aufräumschritt den
// frischen Eintrag des Nachfolgers und das Kopfzeilen-Symbol bliebe verwaist.

import { useCallback, useRef, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';

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

/**
 * Marke des anmeldenden Bildschirms — je Bildschirminstanz ein eigenes Objekt,
 * nur über Identität verglichen. Kein Inhalt nötig, die Identität ist der Wert.
 */
export type WeiterAktionBesitzer = object;

let besitzer: WeiterAktionBesitzer | null = null;
let aktuelleAktion: WeiterAktion | null = null;
const hoerer = new Set<() => void>();

function benachrichtige(): void {
  for (const h of hoerer) h();
}

/** Vom jeweiligen Bildschirm beim Fokussieren/bei jeder Änderung aufgerufen. */
export function registriereWeiterAktion(neuerBesitzer: WeiterAktionBesitzer, aktion: WeiterAktion): void {
  besitzer = neuerBesitzer;
  aktuelleAktion = aktion;
  benachrichtige();
}

/**
 * Gegenstück zu `registriereWeiterAktion`. Wer nicht (mehr) eingetragen ist,
 * räumt nichts ab — siehe Kopfkommentar: Anmeldung des Nachfolgers und
 * Abmeldung des Vorgängers treffen beim Navigieren in unbestimmter Reihenfolge
 * aufeinander.
 */
export function meldeWeiterAktionAb(alterBesitzer: WeiterAktionBesitzer): void {
  if (besitzer !== alterBesitzer) return;
  besitzer = null;
  aktuelleAktion = null;
  benachrichtige();
}

/**
 * Meldet den Bedienweg ab und navigiert erst einen Frame später (Change
 * `weiter-bedienweg-absturzschutz`, design.md Entscheidung 2 — dieselbe
 * Trennung wie beim Sichern im Planungsmodus, Change
 * `planungsmodus-sichern-absturz` design.md Entscheidung 2).
 *
 * Ohne diesen Versatz mutiert das Abmelden die Kopfzeile, während
 * react-native-screens auf Android die Fragment-Transaktion der Navigation
 * bereits begonnen hat (`IllegalStateException: ScreenStackFragment added into
 * a fragment manager for a different fragment`). Mit ihm läuft die
 * Kopfzeilen-Mutation nachweislich davor und ist committet, bevor der Stapel
 * sich bewegt.
 *
 * Aufrufbar nur aus einem `weiter` heraus, also aus dem Bildschirm, der in
 * diesem Moment eingetragen ist — darum genügt es, den aktuellen Eintrag
 * abzuräumen, ohne die Marke am Aufrufort durchzureichen.
 */
export function navigiereNachAbmeldung(navigiere: () => void): void {
  if (besitzer !== null) meldeWeiterAktionAb(besitzer);
  requestAnimationFrame(navigiere);
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  return () => hoerer.delete(cb);
}

/** Von der Kopfzeilen-Schaltfläche gelesen; `null`, solange kein Bildschirm mit Weiter-Weg offen ist. */
export function useWeiterAktion(): WeiterAktion | null {
  return useSyncExternalStore(subscribe, () => aktuelleAktion);
}

/**
 * Anmeldung des Bedienwegs aus einem Bildschirm heraus — für alle drei
 * Bildschirme derselbe Ablauf, darum hier einmal statt dreimal kopiert (Change
 * `weiter-bedienweg-absturzschutz`, design.md Entscheidung 3).
 *
 * `useFocusEffect` statt `useEffect`: Das Register ist bildschirmübergreifend
 * gemeinsam (Kopfkommentar). Bleibt ein Bildschirm beim Vorwärtsnavigieren im
 * Stapel bestehen und wird über „Zurück" wieder sichtbar, muss er sich beim
 * Wiedererlangen des Fokus erneut anmelden — ein reiner Mount-Effekt liefe
 * dabei nicht erneut und das Kopfzeilen-Symbol bliebe verwaist (Fund aus dem
 * Gerätetest, Prüfprotokoll 2026-09-22).
 *
 * `weiter` gehört in ein `useCallback` des aufrufenden Bildschirms: Ein bei
 * jedem Render neu gebildeter Verweis meldete sonst bei jedem Render erneut an.
 */
export function useWeiterAktionAnmelden(freigegeben: boolean, weiter: () => void): void {
  const marke = useRef<WeiterAktionBesitzer>({});

  useFocusEffect(
    useCallback(() => {
      const eigeneMarke = marke.current;
      registriereWeiterAktion(eigeneMarke, { freigegeben, weiter });
      return () => meldeWeiterAktionAb(eigeneMarke);
    }, [freigegeben, weiter]),
  );
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetWeiterAktionForTest(): void {
  besitzer = null;
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
