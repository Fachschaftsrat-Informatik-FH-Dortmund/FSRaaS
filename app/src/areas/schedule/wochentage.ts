// SCHED-F-460: welche Wochentage die Leiste über dem Stundenplan zeigt. Reine
// Funktion, ohne React.
//
// Die Belegungsvorschau je Tag (vormals `belegungsvorschauJeTag`) entfällt mit
// dem Requirement „Belegungsvorschau je Tag" (REMOVED, entschieden 2026-09-08):
// Ein Eintrag der Wochentagsleiste trägt seither nur noch Wochentag und
// Kalenderdatum (Requirement „Wochentagsleiste mit bedarfsweisem Samstag").

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
