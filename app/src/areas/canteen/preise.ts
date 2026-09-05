import type { Gericht } from './api';
import type { PriceGroup } from './priceGroup';

// Preisauswahl je Preisgruppe (SET-F-180 / MENSA-F-220) und einheitliche
// Preisdarstellung. Reine Funktionen ohne React, von mehreren Ansichten genutzt.

export function preisFuer(g: Gericht, group: PriceGroup): number | null | undefined {
  if (group === 'staff') return g.preisMitarbeitende;
  if (group === 'guest') return g.preisGaeste;
  return g.preisStudierende;
}

export function preisText(n: number | null | undefined): string {
  return n == null ? '–' : `${n.toFixed(2).replace('.', ',')} €`;
}
