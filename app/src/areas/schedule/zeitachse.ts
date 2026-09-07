// Die Spanne der proportionalen Zeitachse (Requirement „Proportionale
// Zeitachse"). `dayLayout.layoutTag` verlangt eine Spanne, die Anforderung nennt
// keine — sie wird deshalb eine Ebene darüber aus der **angezeigten Woche**
// ermittelt: frühester Beginn und spätestes Ende aller Termine der Woche, auf
// die volle Stunde nach außen gerundet (design.md, Entscheidung 1). Alle Tage
// der Woche bekommen dieselbe Spanne, damit gleich hohe Kacheln für gleiche
// Dauern stehen und der Vergleich zwischen den Tagen trägt. Reine Funktion,
// ohne React.

const MINUTEN_JE_STUNDE = 60;

export interface Zeitspanne {
  vonMin: number;
  bisMin: number;
}

/**
 * Rückfall für eine Woche ohne Termine: Ohne Termin gibt es nichts, wozu die
 * Achse proportional sein könnte — der Tag zeigt dann seinen Leerzustand. Die
 * Spanne bleibt trotzdem gültig, damit die Darstellung keine leere oder
 * negative Achse rechnen muss.
 */
export const STANDARD_SPANNE: Zeitspanne = { vonMin: 8 * MINUTEN_JE_STUNDE, bisMin: 18 * MINUTEN_JE_STUNDE };

/**
 * Ermittelt die Spanne der Zeitachse aus den Terminen einer Woche. Der frühere
 * Rand wird auf die volle Stunde abgerundet, der spätere aufgerundet, damit die
 * Achse an Stundenmarken beginnt und endet.
 */
export function spanneDerWoche(
  wochenTermine: readonly { timeBeginMin: number; timeEndMin: number }[],
): Zeitspanne {
  if (wochenTermine.length === 0) return STANDARD_SPANNE;

  let fruehester = wochenTermine[0]!.timeBeginMin;
  let spaetestes = wochenTermine[0]!.timeEndMin;
  for (const termin of wochenTermine) {
    if (termin.timeBeginMin < fruehester) fruehester = termin.timeBeginMin;
    if (termin.timeEndMin > spaetestes) spaetestes = termin.timeEndMin;
  }

  return {
    vonMin: Math.floor(fruehester / MINUTEN_JE_STUNDE) * MINUTEN_JE_STUNDE,
    bisMin: Math.ceil(spaetestes / MINUTEN_JE_STUNDE) * MINUTEN_JE_STUNDE,
  };
}
