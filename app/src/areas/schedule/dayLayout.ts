// Requirements „Proportionale Zeitachse" und „Nebeneinanderdarstellung
// überschneidender Termine": Termine eines Tages werden in Spalten gelegt,
// wenn sie sich zeitlich überschneiden, und Zeiträume ohne Termin erscheinen
// als Lücke mit Dauer — kurze Lücken ohne Block, lange gestaucht. Ergebnis ist
// die reine Datenstruktur `DaySlot` — keine Pixelwerte, keine
// React-Abhängigkeit; die Umrechnung auf eine proportionale Achse ist Sache
// der Darstellungsschicht (design.md, Entscheidung 1).

import { sortiereNachBeginnzeit } from './time';
import type { DaySlot, PlanEntry, TerminSlot } from './typen';

/** Requirement „Proportionale Zeitachse": Schwellen für Lücken. */
const KURZE_LUECKE_MAX_MIN = 15;
const LANGE_LUECKE_AB_MIN = 60;
/** Requirement: eine lange Lücke wird auf Stundenhöhe gestaucht. */
const GESTAUCHTE_LUECKE_HOEHE_MIN = 60;

/**
 * Legt die Termine eines Tages in Spalten und füllt die Zeiträume von
 * `tagBeginnMin` bis `tagEndeMin` ohne Termin als Lücken auf. Das Ergebnis ist
 * chronologisch sortiert.
 */
export function layoutTag(
  termine: readonly PlanEntry[],
  tagBeginnMin: number,
  tagEndeMin: number,
): DaySlot[] {
  const sortiert = sortiereNachBeginnzeit(termine);
  const gruppen = gruppiereUeberlappend(sortiert);

  const ergebnis: DaySlot[] = [];
  let cursor = tagBeginnMin;
  for (const gruppe of gruppen) {
    const von = gruppe[0]!.timeBeginMin;
    const bis = gruppe.reduce((max, e) => Math.max(max, e.timeEndMin), gruppe[0]!.timeEndMin);

    if (von > cursor) {
      ergebnis.push(baueLuecke(cursor, von));
    }

    const slots = ordneSpaltenZu(gruppe);
    ergebnis.push({
      art: 'belegt',
      vonMin: von,
      bisMin: bis,
      hoeheMin: bis - von,
      slots,
    });

    cursor = Math.max(cursor, bis);
  }
  if (tagEndeMin > cursor) {
    ergebnis.push(baueLuecke(cursor, tagEndeMin));
  }
  return ergebnis;
}

/** Fasst transitiv überlappende Termine zu Gruppen zusammen (chronologisch sortierte Eingabe vorausgesetzt). */
function gruppiereUeberlappend(sortiert: readonly PlanEntry[]): PlanEntry[][] {
  const gruppen: PlanEntry[][] = [];
  let i = 0;
  while (i < sortiert.length) {
    let gruppenende = sortiert[i]!.timeEndMin;
    let j = i + 1;
    while (j < sortiert.length && sortiert[j]!.timeBeginMin < gruppenende) {
      gruppenende = Math.max(gruppenende, sortiert[j]!.timeEndMin);
      j++;
    }
    gruppen.push(sortiert.slice(i, j));
    i = j;
  }
  return gruppen;
}

/**
 * Requirement „Nebeneinanderdarstellung überschneidender Termine": jeder
 * Termin einer Überschneidungsgruppe bekommt eine eigene Spalte, gierig
 * vergeben in chronologischer Reihenfolge. Eine Obergrenze gibt es nicht — wer
 * viele sich überschneidende Veranstaltungen wählt, bekommt entsprechend
 * schmale Kacheln und weicht für den Überblick auf die nicht maßstabsgetreue
 * Ansicht aus (Prüfprotokoll 2026-09-09, Abschnitt 1).
 */
function ordneSpaltenZu(gruppe: readonly PlanEntry[]): TerminSlot[] {
  const spaltenEnden: number[] = [];
  const ergebnis: TerminSlot[] = [];
  for (const termin of gruppe) {
    let spalte = spaltenEnden.findIndex((ende) => ende <= termin.timeBeginMin);
    if (spalte === -1) {
      spalte = spaltenEnden.length;
      spaltenEnden.push(termin.timeEndMin);
    } else {
      spaltenEnden[spalte] = termin.timeEndMin;
    }
    ergebnis.push({ art: 'termin', entry: termin, spalte, spalten: spaltenEnden.length });
  }
  const spalten = spaltenEnden.length;
  return ergebnis.map((slot) => ({ ...slot, spalten }));
}

/**
 * Requirement „Proportionale Zeitachse": eine Lücke unter fünfzehn Minuten
 * bleibt ohne Block und ohne Beschriftung (`kurz`), eine über einer Stunde
 * wird auf Stundenhöhe gestaucht (`gestaucht`) und trägt ihre tatsächliche
 * Dauer (`echteDauerMin`).
 */
function baueLuecke(vonMin: number, bisMin: number): DaySlot {
  const echteDauerMin = bisMin - vonMin;
  const gestaucht = echteDauerMin > LANGE_LUECKE_AB_MIN;
  const kurz = echteDauerMin < KURZE_LUECKE_MAX_MIN;
  const hoeheMin = gestaucht ? GESTAUCHTE_LUECKE_HOEHE_MIN : echteDauerMin;
  return {
    art: 'luecke',
    vonMin,
    bisMin,
    hoeheMin,
    echteDauerMin,
    gestaucht,
    kurz,
  };
}
