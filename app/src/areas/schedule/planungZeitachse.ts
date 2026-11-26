// Requirement „Zeitachse im Planungsmodus" (Change `planungsmodus-zeitachse`,
// design.md Entscheidung 1): legt die Zeilen eines Wochentags im
// Planungsmodus in Spalten, wenn sie sich überschneiden, und füllt die
// Zeiträume dazwischen als Lücken auf. Spaltenvergabe, Gruppierung und
// Lückenschwellen folgen `dayLayout.ts`, damit beide Achsen gleich lesen;
// `dayLayout` hängt aber an `PlanEntry`, diese Funktion nimmt beliebige
// Elemente mit Beginn und Ende. Zusätzlich zählt sie je Element die
// unmittelbaren Überschneidungen — die Spaltenzahl eines Abschnitts reicht
// dafür nicht, weil eine Überschneidungsgruppe transitiv ist. Reine Funktion,
// keine Pixelwerte.

import { ueberschneidenSich } from './time';

/** Wie `dayLayout.ts`: kurze Lücken ohne Beschriftung, lange auf Stundenhöhe gestaucht. */
const KURZE_LUECKE_MAX_MIN = 15;
const LANGE_LUECKE_AB_MIN = 60;
const GESTAUCHTE_LUECKE_HOEHE_MIN = 60;

export interface Zeitraum {
  timeBeginMin: number;
  timeEndMin: number;
}

export interface AchsenElement<T extends Zeitraum> {
  element: T;
  spalte: number;
  /** Zahl der Spalten des Abschnitts, in dem das Element steht. */
  spalten: number;
  /** Zahl der anderen Elemente des Tages, mit denen es sich unmittelbar überschneidet. */
  ueberschneidungen: number;
}

export type AchsenAbschnitt<T extends Zeitraum> =
  | { art: 'belegt'; vonMin: number; bisMin: number; hoeheMin: number; elemente: AchsenElement<T>[] }
  | {
      art: 'luecke';
      vonMin: number;
      bisMin: number;
      hoeheMin: number;
      echteDauerMin: number;
      gestaucht: boolean;
      kurz: boolean;
    };

/**
 * Legt die Elemente eines Tages auf die Achse, chronologisch. Die Achse reicht
 * vom frühesten Beginn bis zum spätesten Ende; Leerraum an den Rändern
 * entfällt wie in der Wochenansicht.
 */
export function legePlanungsTagAus<T extends Zeitraum>(elemente: readonly T[]): AchsenAbschnitt<T>[] {
  const sortiert = [...elemente].sort(
    (a, b) => a.timeBeginMin - b.timeBeginMin || a.timeEndMin - b.timeEndMin,
  );
  const ergebnis: AchsenAbschnitt<T>[] = [];
  let cursor: number | null = null;
  let i = 0;
  while (i < sortiert.length) {
    let gruppenende = sortiert[i]!.timeEndMin;
    let j = i + 1;
    while (j < sortiert.length && sortiert[j]!.timeBeginMin < gruppenende) {
      gruppenende = Math.max(gruppenende, sortiert[j]!.timeEndMin);
      j++;
    }
    const gruppe = sortiert.slice(i, j);
    const von = gruppe[0]!.timeBeginMin;
    if (cursor !== null && von > cursor) ergebnis.push(luecke(cursor, von));
    ergebnis.push({
      art: 'belegt',
      vonMin: von,
      bisMin: gruppenende,
      hoeheMin: gruppenende - von,
      elemente: spaltenFuer(gruppe),
    });
    cursor = cursor === null ? gruppenende : Math.max(cursor, gruppenende);
    i = j;
  }
  return ergebnis;
}

/** Größte Spaltenzahl des Tages — bestimmt die Mindestbreite der Achse (design.md, Entscheidung 3). */
export function groessteSpaltenzahl<T extends Zeitraum>(abschnitte: readonly AchsenAbschnitt<T>[]): number {
  return abschnitte.reduce((max, a) => (a.art === 'belegt' ? Math.max(max, a.elemente[0]?.spalten ?? 1) : max), 1);
}

function spaltenFuer<T extends Zeitraum>(gruppe: readonly T[]): AchsenElement<T>[] {
  const spaltenEnden: number[] = [];
  const zuordnung: { element: T; spalte: number }[] = [];
  for (const element of gruppe) {
    let spalte = spaltenEnden.findIndex((ende) => ende <= element.timeBeginMin);
    if (spalte === -1) {
      spalte = spaltenEnden.length;
      spaltenEnden.push(element.timeEndMin);
    } else {
      spaltenEnden[spalte] = element.timeEndMin;
    }
    zuordnung.push({ element, spalte });
  }
  return zuordnung.map(({ element, spalte }) => ({
    element,
    spalte,
    spalten: spaltenEnden.length,
    ueberschneidungen: gruppe.filter(
      (anderes) =>
        anderes !== element &&
        ueberschneidenSich(element.timeBeginMin, element.timeEndMin, anderes.timeBeginMin, anderes.timeEndMin),
    ).length,
  }));
}

function luecke<T extends Zeitraum>(vonMin: number, bisMin: number): AchsenAbschnitt<T> {
  const echteDauerMin = bisMin - vonMin;
  const gestaucht = echteDauerMin > LANGE_LUECKE_AB_MIN;
  return {
    art: 'luecke',
    vonMin,
    bisMin,
    hoeheMin: gestaucht ? GESTAUCHTE_LUECKE_HOEHE_MIN : echteDauerMin,
    echteDauerMin,
    gestaucht,
    kurz: echteDauerMin < KURZE_LUECKE_MAX_MIN,
  };
}
