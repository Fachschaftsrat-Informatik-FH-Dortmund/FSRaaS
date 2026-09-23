import type { Gericht } from './api';

// Unterscheidbarkeit von Allergen und Zusatzstoff (Requirement „Gerichtsangaben —
// Kategorie, Bezeichnung, Preise, Zusatzstoffe"): `zusatzstoffe` behält seine
// bisherige, umfassendere Bedeutung (Allergene **und** Zusatzstoffe, ADR 0016) und
// `allergene` kommt additiv als reine Teilmenge daneben (design.md). Für eine
// unterscheidbare Anzeige wird `allergene` gesondert ausgewiesen und aus
// `zusatzstoffe` herausgerechnet, damit kein Hinweis doppelt erscheint. Reine
// Fachlogik ohne React (Capability `quality-and-testing`, Abschnitt 5).

/**
 * Zusatzstoffhinweise ohne die bereits unter `allergene` ausgewiesenen. Fehlt
 * `allergene`, bleibt `zusatzstoffe` unverändert — eine ältere Anfrage ohne das
 * additive Feld verhält sich dann wie vor dieser Unterscheidung.
 */
export function reineZusatzstoffe(g: Pick<Gericht, 'zusatzstoffe' | 'allergene'>): string[] {
  const zusatzstoffe = g.zusatzstoffe ?? [];
  const allergene = g.allergene;
  if (!allergene || allergene.length === 0) return zusatzstoffe;
  const allergenSet = new Set(allergene);
  return zusatzstoffe.filter((z) => !allergenSet.has(z));
}
