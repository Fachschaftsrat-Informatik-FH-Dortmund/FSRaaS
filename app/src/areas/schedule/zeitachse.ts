// Die Spanne der proportionalen Zeitachse (Requirement „Proportionale
// Zeitachse"). `dayLayout.layoutTag` verlangt eine Spanne, die Anforderung nennt
// keine — sie wird deshalb eine Ebene darüber aus den Terminen des **angezeigten
// Tages** ermittelt: frühester Beginn und spätestes Ende dieses Tages, ohne
// Randlücken. Anders als in der Vorgängerfassung wird nicht mehr über die ganze
// Woche gemittelt: Ein einzelner Abendtermin an einem anderen Wochentag darf
// diesen Tag nicht mehr dehnen. Reine Funktion, ohne React.

const MINUTEN_JE_STUNDE = 60;

export interface Zeitspanne {
  vonMin: number;
  bisMin: number;
}

/**
 * Rückfall für einen Tag ohne Termine: Ohne Termin gibt es nichts, wozu die
 * Achse proportional sein könnte — der Tag zeigt dann seinen Leerzustand. Die
 * Spanne bleibt trotzdem gültig, damit die Darstellung keine leere oder
 * negative Achse rechnen muss.
 */
export const STANDARD_SPANNE: Zeitspanne = { vonMin: 8 * MINUTEN_JE_STUNDE, bisMin: 18 * MINUTEN_JE_STUNDE };

/**
 * Ermittelt die Spanne der Zeitachse aus den Terminen des angezeigten Tages.
 * Die Achse beginnt beim ersten und endet beim letzten Termin — ohne Rundung
 * und ohne Rücksicht auf andere Wochentage (Requirement „Proportionale
 * Zeitachse", Szenario „Kein Leerraum an den Tagesrändern").
 */
export function spanneDesTages(
  tagesTermine: readonly { timeBeginMin: number; timeEndMin: number }[],
): Zeitspanne {
  if (tagesTermine.length === 0) return STANDARD_SPANNE;

  let von = tagesTermine[0]!.timeBeginMin;
  let bis = tagesTermine[0]!.timeEndMin;
  for (const termin of tagesTermine) {
    if (termin.timeBeginMin < von) von = termin.timeBeginMin;
    if (termin.timeEndMin > bis) bis = termin.timeEndMin;
  }

  return { vonMin: von, bisMin: bis };
}
