// Requirements „Proportionale Zeitachse", „Nebeneinanderdarstellung
// überschneidender Termine" und „Stapelung bei mehr als drei überschneidenden
// Terminen": Termine eines Tages werden in Spalten gelegt, wenn sie sich
// zeitlich überschneiden, mit höchstens drei sichtbaren Spalten, und
// Zeiträume ohne Termin erscheinen als Lücke mit Dauer — kurze Lücken ohne
// Block, lange gestaucht mit Bruchzeichen. Ergebnis ist die reine
// Datenstruktur `DaySlot` — keine Pixelwerte, keine React-Abhängigkeit; die
// Umrechnung auf eine proportionale Achse ist Sache der Darstellungsschicht
// (design.md, Entscheidung 1).

import { sortiereNachBeginnzeit } from './time';
import type { BelegtSlot, DaySlot, PlanEntry } from './typen';

/** Requirement „Stapelung bei mehr als drei überschneidenden Terminen". */
const MAX_SICHTBARE_SPALTEN = 3;

/** Requirement „Proportionale Zeitachse": Schwellen für Lücken. */
const KURZE_LUECKE_MAX_MIN = 15;
const LANGE_LUECKE_AB_MIN = 60;
/** Requirement: eine lange Lücke wird auf Stundenhöhe gestaucht. */
const GESTAUCHTE_LUECKE_HOEHE_MIN = 60;

const MINUTEN_JE_STUNDE = 60;

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
      stundenlinien: stundenmarkenIn(von, bis),
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
 * Requirement „Nebeneinanderdarstellung überschneidender Termine" (bis drei)
 * und „Stapelung bei mehr als drei überschneidenden Terminen" (ab vier):
 * Übersteigt eine Überschneidungsgruppe drei Termine, bleiben die ersten drei
 * — Termine des Plans zuerst, chronologisch danach — einzeln sichtbar, die
 * übrigen werden zu einem Stapel-Slot zusammengefasst.
 */
function ordneSpaltenZu(gruppe: readonly PlanEntry[]): BelegtSlot[] {
  if (gruppe.length <= MAX_SICHTBARE_SPALTEN) {
    const spaltenEnden: number[] = [];
    const ergebnis: BelegtSlot[] = [];
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

  // Requirement „Stapelung bei mehr als drei überschneidenden Terminen",
  // Szenario „Eigene Termine zuerst": innerhalb der Überschneidungsgruppe
  // belegen Termine des persönlichen Plans die sichtbaren Plätze vor
  // eingeblendeten Alternativen (`istAlternative`, `typen.ts`). `filter`
  // erhält dabei die chronologische Reihenfolge innerhalb jeder Herkunft
  // (stabile Sortierung von `gruppe`).
  const eigene = gruppe.filter((e) => !e.istAlternative);
  const alternativen = gruppe.filter((e) => e.istAlternative);
  const geordnet = [...eigene, ...alternativen];

  const sichtbar = geordnet.slice(0, MAX_SICHTBARE_SPALTEN);
  const gestapelt = geordnet.slice(MAX_SICHTBARE_SPALTEN);
  const spalten = MAX_SICHTBARE_SPALTEN + 1;

  const ergebnis: BelegtSlot[] = sichtbar.map((entry, spalte) => ({
    art: 'termin',
    entry,
    spalte,
    spalten,
  }));
  ergebnis.push({
    art: 'stapel',
    entries: gestapelt,
    spalte: MAX_SICHTBARE_SPALTEN,
    spalten,
    vonMin: gestapelt.reduce((min, e) => Math.min(min, e.timeBeginMin), gestapelt[0]!.timeBeginMin),
    bisMin: gestapelt.reduce((max, e) => Math.max(max, e.timeEndMin), gestapelt[0]!.timeEndMin),
  });
  return ergebnis;
}

/**
 * Requirement „Proportionale Zeitachse": eine Lücke unter fünfzehn Minuten
 * bleibt ohne Block und ohne Beschriftung (`kurz`), eine über einer Stunde
 * wird auf Stundenhöhe gestaucht (`gestaucht`) und trägt Bruchzeichen samt
 * tatsächlicher Dauer (`echteDauerMin`).
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
    stundenlinien: gestaucht ? [] : stundenmarkenIn(vonMin, bisMin),
  };
}

/** Requirement „Stundenlinien auf der Zeitachse": volle Stunden echt innerhalb `[von, bis)`. */
function stundenmarkenIn(von: number, bis: number): number[] {
  const marken: number[] = [];
  let marke = Math.ceil(von / MINUTEN_JE_STUNDE) * MINUTEN_JE_STUNDE;
  if (marke <= von) marke += MINUTEN_JE_STUNDE;
  for (; marke < bis; marke += MINUTEN_JE_STUNDE) {
    marken.push(marke);
  }
  return marken;
}
