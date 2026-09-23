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

/** Ob `datum` in den vom Schließtag `s` beschriebenen Zeitraum bzw. Einzeltag fällt. */
function inSchliesstag(s: Schliesstag, datum: string): boolean {
  if (s.von && s.bis) return s.von <= datum && datum <= s.bis;
  return s.datum === datum;
}

export interface Schliessungsangabe {
  /** Klartextgrund, wie die Quelle ihn liefert — nicht in eine eigene Formulierung übersetzt. */
  grund: string;
  /** Letzter Tag der Schließung (ISO-Datum), oder `null` ohne bekanntes Enddatum. */
  bis: string | null;
}

/**
 * Grund und Zeitraum der Schließung eines geschlossenen Tages (Requirement „Grund
 * und Zeitraum einer Schließung"): der Klartextgrund kommt aus der Öffnungsangabe
 * des Tages selbst (`heute`/`wochenplan`/`vorausschau`), das Enddatum aus dem
 * dazu passenden Eintrag in `schliesstage`. `null`, wenn der Tag geöffnet ist oder
 * die Quelle zu ihm keinen Grund führt.
 */
export function schliessungFuer(
  angaben: Oeffnungsangaben | undefined,
  datum: string,
): Schliessungsangabe | null {
  const tag = oeffnungstagFuer(angaben, datum);
  if (!tag || tag.geoeffnet || !tag.grund) return null;
  const zeitraum = angaben?.schliesstage?.find((s) => inSchliesstag(s, datum));
  return { grund: tag.grund, bis: zeitraum?.bis ?? zeitraum?.datum ?? null };
}
