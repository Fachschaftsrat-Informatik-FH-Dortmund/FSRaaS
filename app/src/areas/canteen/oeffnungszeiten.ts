import type { Oeffnungsangaben, Oeffnungstag, Schliesstag } from './api';

// MENSA: Auflösung der Öffnungszeit eines Tages aus den Öffnungsangaben der
// Mensa-Schnittstelle (Capability `canteen`, Requirement „Öffnungszeiten je Mensa
// und Wochentag"). Seit der Ablösung von INT-015 kommen sie nicht mehr aus
// gepflegten Stammdaten, sondern aus INT-020 — die gepflegte Angabe war
// nachweislich veraltet (Hauptmensa freitags `11:30 - 14:00` statt `11:30 - 14:15`).
// Reine Fachlogik ohne React (Capability `quality-and-testing`, Abschnitt 5).

/** ISO-8601-Wochentag eines ISO-Datums: 1 = Montag … 7 = Sonntag. */
function isoWochentag(datum: string): number {
  const [y, m, d] = datum.split('-').map(Number);
  const tag = new Date(y!, m! - 1, d!).getDay(); // 0 = Sonntag … 6 = Samstag
  return tag === 0 ? 7 : tag;
}

/**
 * Eintrag der Öffnungsangaben für ein Datum. Die Vorausschau trägt den
 * Datumsbezug und geht deshalb vor; reicht sie nicht bis zu diesem Tag, tritt
 * der reguläre Wochenplan ein. Fehlt beides, bleibt es bei `undefined` — die
 * Angabe ist dann unbekannt, nicht „geschlossen".
 */
export function oeffnungstagFuer(
  angaben: Oeffnungsangaben | undefined,
  datum: string,
): Oeffnungstag | undefined {
  if (!angaben) return undefined;
  const ausVorausschau = angaben.vorausschau?.find((t) => t.datum === datum);
  if (ausVorausschau) return ausVorausschau;
  const wochentag = isoWochentag(datum);
  return angaben.wochenplan?.find((t) => t.wochentag === wochentag);
}

/** Zeitspanne `HH:MM - HH:MM`, oder `null`, wenn die Quelle keine Zeiten führt. */
function spanne(von: string | null | undefined, bis: string | null | undefined): string | null {
  if (!von) return null;
  return bis ? `${von} - ${bis}` : von;
}

/**
 * Öffnungszeit der Mensa für den angezeigten Tag, oder `null`. Für eine an
 * diesem Tag geschlossene Mensa wird bewusst nichts geliefert: ihre Öffnungszeit
 * darf in keiner Darstellungsform erscheinen (Requirement „Keine Öffnungszeit für
 * geschlossene Mensa").
 */
export function oeffnungszeitFuer(
  angaben: Oeffnungsangaben | undefined,
  datum: string,
): string | null {
  const tag = oeffnungstagFuer(angaben, datum);
  if (!tag?.geoeffnet) return null;
  return spanne(tag.oeffnet, tag.schliesst);
}

/**
 * Ausgabezeit, sofern die Quelle sie führt und sie von der Öffnungszeit abweicht.
 * INT-020 setzt `servingOpen`/`servingClose` ausschließlich bei Abweichung, also
 * genügt deren Vorhandensein als Bedingung (Requirement „Ausweis der Ausgabezeit
 * bei abweichender Öffnungszeit").
 */
export function ausgabezeitFuer(
  angaben: Oeffnungsangaben | undefined,
  datum: string,
): string | null {
  const tag = oeffnungstagFuer(angaben, datum);
  if (!tag?.geoeffnet) return null;
  return spanne(tag.ausgabeBeginn ?? null, tag.ausgabeEnde ?? tag.schliesst);
}

/** Ob die Mensa an diesem Tag geöffnet ist. Unbekannte Angabe gilt nicht als geschlossen. */
export function istGeoeffnet(
  angaben: Oeffnungsangaben | undefined,
  datum: string,
): boolean | undefined {
  return oeffnungstagFuer(angaben, datum)?.geoeffnet;
}

export interface Schliessung {
  /** Klartextgrund, wie die Quelle ihn liefert; `null`, wenn sie keinen führt. */
  grund: string | null;
  /** Letzter Tag der Schließung als ISO-Datum, sofern die Quelle einen Zeitraum führt. */
  bis: string | null;
}

/** Ob ein Schließtag oder -zeitraum den angezeigten Tag deckt. */
function deckt(s: Schliesstag, datum: string): boolean {
  if (s.datum === datum) return true;
  return Boolean(s.von && s.bis && datum >= s.von && datum <= s.bis);
}

/**
 * Grund und Zeitraum der Schließung am angezeigten Tag, oder `null` — sei es,
 * weil die Mensa geöffnet ist, sei es, weil die Quelle zu der Schließung nichts
 * weiter führt (Requirement „Grund und Zeitraum einer Schließung").
 *
 * Der Grund steht am Tag selbst (INT-020 `today.reason`, in der Vorausschau
 * `forecast[].reason`); fehlt er dort, tritt die Bezeichnung des deckenden
 * Schließtags ein — auch sie ist der Klartext der Quelle, nicht eine eigene
 * Formulierung. Das Enddatum führt allein die Schließtagsliste. Ein Enddatum, das
 * nicht über den angezeigten Tag hinausreicht, bleibt ungenannt: es sagt der
 * Nutzerin nichts, was der Geschlossen-Hinweis nicht schon sagt.
 *
 * Der Geltungsbereich (`global` / `mensa`) unterscheidet nur, wie weit eine
 * Schließung reicht — beide betreffen diese Mensa und werden gleich behandelt.
 */
export function schliessungFuer(
  angaben: Oeffnungsangaben | undefined,
  datum: string,
): Schliessung | null {
  const tag = oeffnungstagFuer(angaben, datum);
  if (tag?.geoeffnet !== false) return null;
  const deckend = angaben?.schliesstage?.find((s) => deckt(s, datum));
  const grund = tag.grund ?? deckend?.bezeichnung ?? null;
  const bis = deckend?.bis && deckend.bis > datum ? deckend.bis : null;
  return grund === null && bis === null ? null : { grund, bis };
}
