// SCHED-F-520/540: Termine eines Tages werden in Spalten gelegt, wenn sie sich
// zeitlich überschneiden (F-540), und Zeiträume ohne Termin erscheinen als Lücke
// mit Dauer (F-520). Ergebnis ist die reine Datenstruktur `DaySlot` — keine
// Pixelwerte, keine React-Abhängigkeit; die Umrechnung auf eine proportionale
// Achse (SCHED-F-520/530) ist Sache der Darstellungsschicht.

import { sortiereNachBeginnzeit } from './time';
import type { DaySlot, PlanEntry } from './typen';

type TerminSlot = Extract<DaySlot, { art: 'termin' }>;

/**
 * Legt die Termine eines Tages in Spalten (SCHED-F-540: transitiv überlappende
 * Termine bilden eine Gruppe, `spalten` ist die für diese Gruppe insgesamt nötige
 * Spaltenzahl) und füllt die Zeiträume von `tagBeginnMin` bis `tagEndeMin` ohne
 * Termin als Lücken auf (SCHED-F-520). Das Ergebnis ist chronologisch sortiert.
 */
export function layoutTag(
  termine: readonly PlanEntry[],
  tagBeginnMin: number,
  tagEndeMin: number,
): DaySlot[] {
  const sortiert = sortiereNachBeginnzeit(termine);
  const terminSlots = ordneSpaltenZu(sortiert);
  return fuegeLueckenEin(sortiert, terminSlots, tagBeginnMin, tagEndeMin);
}

/** SCHED-F-540: Spaltenzuordnung je transitiver Überschneidungsgruppe (Greedy-Intervallfärbung). */
function ordneSpaltenZu(sortiert: readonly PlanEntry[]): TerminSlot[] {
  const ergebnis: TerminSlot[] = [];
  let i = 0;
  while (i < sortiert.length) {
    let gruppenende = sortiert[i]!.timeEndMin;
    let j = i + 1;
    while (j < sortiert.length && sortiert[j]!.timeBeginMin < gruppenende) {
      gruppenende = Math.max(gruppenende, sortiert[j]!.timeEndMin);
      j++;
    }

    const spaltenEnden: number[] = [];
    const gruppe: { entry: PlanEntry; spalte: number }[] = [];
    for (let k = i; k < j; k++) {
      const termin = sortiert[k]!;
      let spalte = spaltenEnden.findIndex((ende) => ende <= termin.timeBeginMin);
      if (spalte === -1) {
        spalte = spaltenEnden.length;
        spaltenEnden.push(termin.timeEndMin);
      } else {
        spaltenEnden[spalte] = termin.timeEndMin;
      }
      gruppe.push({ entry: termin, spalte });
    }

    const spalten = spaltenEnden.length;
    for (const { entry, spalte } of gruppe) {
      ergebnis.push({ art: 'termin', entry, spalte, spalten });
    }
    i = j;
  }
  return ergebnis;
}

/** SCHED-F-520: fügt zwischen den (nach überlappungsvereinigten Zeiträumen) belegten Abschnitten Lücken ein. */
function fuegeLueckenEin(
  sortiert: readonly PlanEntry[],
  terminSlots: readonly TerminSlot[],
  tagBeginnMin: number,
  tagEndeMin: number,
): DaySlot[] {
  const belegt: { von: number; bis: number }[] = [];
  for (const termin of sortiert) {
    const letztes = belegt[belegt.length - 1];
    if (letztes && termin.timeBeginMin <= letztes.bis) {
      letztes.bis = Math.max(letztes.bis, termin.timeEndMin);
    } else {
      belegt.push({ von: termin.timeBeginMin, bis: termin.timeEndMin });
    }
  }

  const ergebnis: DaySlot[] = [];
  let cursor = tagBeginnMin;
  let terminIndex = 0;
  for (const intervall of belegt) {
    if (intervall.von > cursor) {
      ergebnis.push({ art: 'luecke', vonMin: cursor, bisMin: intervall.von });
    }
    while (terminIndex < terminSlots.length && terminSlots[terminIndex]!.entry.timeBeginMin < intervall.bis) {
      ergebnis.push(terminSlots[terminIndex]!);
      terminIndex++;
    }
    cursor = Math.max(cursor, intervall.bis);
  }
  if (tagEndeMin > cursor) {
    ergebnis.push({ art: 'luecke', vonMin: cursor, bisMin: tagEndeMin });
  }
  return ergebnis;
}
