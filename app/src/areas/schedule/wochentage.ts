// SCHED-F-460/470: welche Wochentage die Leiste über dem Stundenplan zeigt, und die
// Belegungsvorschau je gezeigtem Tag. Reine Funktionen, ohne React.

import type { Weekday } from './typen';

const PFLICHTTAGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const OPTIONALE_TAGE: readonly Weekday[] = ['Sat', 'Sun'];

/**
 * SCHED-F-460: Montag bis Freitag stehen immer in der Leiste; Samstag/Sonntag nur,
 * wenn an ihnen mindestens ein Termin liegt. `hatTermin` prüft das je Wochentag.
 */
export function sichtbareWochentage(hatTermin: (wochentag: Weekday) => boolean): Weekday[] {
  return [...PFLICHTTAGE, ...OPTIONALE_TAGE.filter(hatTermin)];
}

export interface Belegungsvorschau {
  wochentag: Weekday;
  anzahl: number;
}

/**
 * SCHED-F-470: Anzahl der Termine je Wochentag, für die Vorschau in der Leiste.
 * `wochentage` legt Reihenfolge und Umfang fest (z. B. das Ergebnis von
 * `sichtbareWochentage`).
 */
export function belegungsvorschauJeTag(
  termine: readonly { weekday: Weekday }[],
  wochentage: readonly Weekday[],
): Belegungsvorschau[] {
  return wochentage.map((wochentag) => ({
    wochentag,
    anzahl: termine.filter((t) => t.weekday === wochentag).length,
  }));
}
