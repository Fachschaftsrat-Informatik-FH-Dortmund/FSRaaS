// SCHED-F-550/560: laufender und nächster Termin samt verbleibender Zeit, abgeleitet
// aus dem Plan eines einzelnen Tages und der aktuellen Uhrzeit. Die Uhrzeit wird als
// Parameter hereingereicht (nicht `Date.now()` im Modul), damit das Ergebnis
// deterministisch und testbar bleibt. Reine Funktion, ohne React.
//
// Requirement „Wirkung eines deaktivierten Termins": ein deaktivierter Termin
// gilt hier weder als laufend noch als nächster (`istAktiv`, `time.ts`).

import { istAktiv, sortiereNachBeginnzeit } from './time';
import type { PlanEntry } from './typen';

export interface JetztStatus {
  /** Der Termin, der `jetztMin` einschließt ([Beginn, Ende)), oder `null`. */
  laufend: PlanEntry | null;
  /** Minuten bis zum Ende des laufenden Termins, oder `null` ohne laufenden Termin. */
  laufendVerbleibendMin: number | null;
  /** Der zeitlich nächste, noch nicht begonnene Termin des Tages, oder `null`. */
  naechster: PlanEntry | null;
  /** Minuten bis zum Beginn des nächsten Termins, oder `null` ohne nächsten Termin. */
  naechsterInMin: number | null;
}

/**
 * Ermittelt aus den Terminen **eines** Tages (bereits nach Wochentag gefiltert) und
 * der aktuellen Uhrzeit in Minuten seit Mitternacht (`jetztMin`) den laufenden und
 * den nächsten Termin (SCHED-F-550) sowie die jeweils verbleibende Zeit. `jetztSek`
 * (Unix-Sekunden desselben Zeitpunkts) entscheidet über `istAktiv`: ein deaktivierter
 * Termin kommt weder als laufender noch als nächster in Betracht.
 */
export function ermittleJetztStatus(
  tagesTermine: readonly PlanEntry[],
  jetztMin: number,
  jetztSek: number,
): JetztStatus {
  const sortiert = sortiereNachBeginnzeit(tagesTermine.filter((t) => istAktiv(t, jetztSek)));
  const laufend = sortiert.find((t) => t.timeBeginMin <= jetztMin && jetztMin < t.timeEndMin) ?? null;
  const naechster = sortiert.find((t) => t.timeBeginMin > jetztMin) ?? null;

  return {
    laufend,
    laufendVerbleibendMin: laufend ? laufend.timeEndMin - jetztMin : null,
    naechster,
    naechsterInMin: naechster ? naechster.timeBeginMin - jetztMin : null,
  };
}
