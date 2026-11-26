import { logDatenhinweis } from '@/errors/AppError';
import type { Raumtermin, RaumStatus } from './api';

// Reine Logik der Raumübersicht und der Ansicht laufender Veranstaltungen
// (Capability `room-finder`). Beide sind Projektionen derselben Antwort von
// `/raeume/uebersicht` „jetzt".

export type Zustandsfilter = 'alle' | 'frei' | 'belegt';

/** Raumkennungen sind großgeschrieben (`C.E.44`); Eingaben werden angeglichen. */
export function normalisiereKennung(eingabe: string): string {
  return eingabe.trim().toUpperCase();
}

/**
 * Übersicht nach Belegungszustand und Raumkennung einschränken (Requirements
 * „Übersicht nach Belegungszustand einschränken" und „Suche nach Raumkennung
 * in der Übersicht"). Die Suche trifft jeden Raum, dessen Kennung die Eingabe
 * enthält, ohne Rücksicht auf Groß-/Kleinschreibung.
 */
export function filtereUebersicht(
  raeume: RaumStatus[],
  zustand: Zustandsfilter,
  suche: string,
): RaumStatus[] {
  const kennung = normalisiereKennung(suche);
  return raeume.filter(
    (r) =>
      (zustand === 'alle' || r.zustand === zustand) &&
      (kennung === '' || r.roomId.toUpperCase().includes(kennung)),
  );
}

export interface LaufendeVeranstaltung {
  bezeichnung: string;
  beginn: string;
  ende: string;
  art: Raumtermin['art'];
  note: string | null;
  raeume: string[];
}

/**
 * Laufende Veranstaltungen (Requirement „Ansicht laufender Veranstaltungen"):
 * die belegten Räume, gruppiert nach (Bezeichnung, Beginn, Ende) — eine
 * Veranstaltung, die mehrere Räume belegt, erscheint einmal mit allen Räumen.
 * Sortiert nach Ende, das zuerst endende oben. Ein Termin ohne auswertbare
 * Zeitangabe wird übersprungen und protokolliert (room-finder, Fehlerfälle).
 */
export function laufendeVeranstaltungen(raeume: RaumStatus[]): LaufendeVeranstaltung[] {
  const gruppen = new Map<string, LaufendeVeranstaltung>();
  let unlesbar = 0;

  for (const raum of raeume) {
    const termin = raum.zustand === 'belegt' ? raum.aktuellerTermin : undefined;
    if (!termin) continue;
    if (Number.isNaN(Date.parse(termin.beginn)) || Number.isNaN(Date.parse(termin.ende))) {
      unlesbar += 1;
      continue;
    }
    const bezeichnung = termin.bezeichnung ?? '';
    const schluessel = `${bezeichnung}\u0000${termin.beginn}\u0000${termin.ende}`;
    const gruppe = gruppen.get(schluessel);
    if (gruppe) {
      gruppe.raeume.push(raum.roomId);
      if (!gruppe.note && termin.note) gruppe.note = termin.note;
    } else {
      gruppen.set(schluessel, {
        bezeichnung,
        beginn: termin.beginn,
        ende: termin.ende,
        art: termin.art,
        note: termin.note ?? null,
        raeume: [raum.roomId],
      });
    }
  }

  if (unlesbar > 0) logDatenhinweis('raum.laufend', 'Termin ohne auswertbare Zeitangabe', unlesbar);
  const liste = [...gruppen.values()];
  for (const g of liste) g.raeume.sort((a, b) => a.localeCompare(b));
  return liste.sort(
    (a, b) => Date.parse(a.ende) - Date.parse(b.ende) || a.bezeichnung.localeCompare(b.bezeichnung),
  );
}
