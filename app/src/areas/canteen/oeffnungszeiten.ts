import type { Oeffnungsangaben } from './api';

// MENSA: Auflösung der Öffnungszeit eines Wochentags aus den Öffnungsangaben der
// Mensa-Schnittstelle (Requirement „Öffnungszeiten je Mensa und Wochentag").
// Bis 2026-09-22 kamen diese Zeiten aus handgepflegten Stammdaten; sie verfielen
// dort unbemerkt (Hauptmensa freitags: gepflegt `11:30 - 14:00`, tatsächlich
// `11:30 - 14:15`). Reine Fachlogik ohne React (Capability `quality-and-testing`,
// Abschnitt 5). Der Wiedereröffnungshinweis an einer geschlossenen Mensa stützt
// sich nicht auf diese Wochenangabe (siehe CanteenScreen.tsx).

/** Wochentag nach ISO 8601 (1 = Montag … 7 = Sonntag) für ein ISO-Datum. */
function isoWochentag(datum: string): number {
  const [y, m, d] = datum.split('-').map(Number);
  const tag = new Date(y!, m! - 1, d!).getDay(); // 0 = Sonntag … 6 = Samstag
  return tag === 0 ? 7 : tag;
}

/**
 * Öffnungszeit der Mensa für den Wochentag des angezeigten Datums, oder `null`,
 * wenn die Schnittstelle für diesen Wochentag keine führt oder die Mensa an ihm
 * regulär geschlossen ist. Der Wochenplan der Quelle trägt keinen Datumsbezug;
 * maßgeblich ist deshalb allein der Wochentag. Fehlt eine der beiden Zeiten,
 * entfällt die Angabe, statt eine halbe Spanne anzuzeigen.
 */
export function oeffnungszeitFuer(
  angaben: Oeffnungsangaben | undefined,
  datum: string,
): string | null {
  const tag = angaben?.wochenplan?.find((w) => w.wochentag === isoWochentag(datum));
  if (!tag || !tag.geoeffnet) return null;
  if (tag.oeffnet == null || tag.schliesst == null) return null;
  return `${tag.oeffnet} - ${tag.schliesst}`;
}
