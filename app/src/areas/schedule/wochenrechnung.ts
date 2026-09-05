// Kalenderwochen-Arithmetik ohne Datumsbibliothek (analog `canteen/tageswahl.ts`).
// Datumsangaben sind ISO-Zeichenketten `"YYYY-MM-DD"`. Deckt SCHED-F-480 (Datum je
// Wochentag), SCHED-F-490 (Wochenblättern), SCHED-F-500 (Gültigkeitszeitraum),
// SCHED-F-510 (vorlesungsfreie Woche) und SCHED-F-150/160 (Zielwochentag beim
// Öffnen). Reine Funktionen, ohne React.

import type { Weekday } from './typen';

/** Wochentagsreihenfolge Montag zuerst — Index 0..6, Grundlage für Wochenanfang/-datum. */
const WOCHENTAGSREIHENFOLGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isoDatum(dt: Date): string {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(
    2,
    '0',
  )}`;
}

/** Verschiebt ein ISO-Datum um `tage` Kalendertage (auch über Monats-/Jahresgrenzen hinweg). */
export function verschiebeDatum(datum: string, tage: number): string {
  const [y, m, d] = datum.split('-').map(Number);
  return isoDatum(new Date(y!, m! - 1, d! + tage));
}

/** 0 = Montag … 6 = Sonntag (anders als `Date.getDay()`, das bei Sonntag beginnt). */
function wochentagIndex(datum: string): number {
  const [y, m, d] = datum.split('-').map(Number);
  const jsWochentag = new Date(y!, m! - 1, d!).getDay(); // 0 = Sonntag … 6 = Samstag
  return (jsWochentag + 6) % 7;
}

/** Liefert das Wochentags-Kürzel (`Weekday`) für ein ISO-Datum. */
export function wochentagVonDatum(datum: string): Weekday {
  return WOCHENTAGSREIHENFOLGE[wochentagIndex(datum)]!;
}

/** SCHED-F-480: Montag der Kalenderwoche, die `datum` enthält. */
export function wochenanfang(datum: string): string {
  return verschiebeDatum(datum, -wochentagIndex(datum));
}

/** SCHED-F-480: Datum eines bestimmten Wochentags innerhalb der Woche, deren Montag `wochenanfangDatum` ist. */
export function datumFuerWochentag(wochenanfangDatum: string, wochentag: Weekday): string {
  return verschiebeDatum(wochenanfangDatum, WOCHENTAGSREIHENFOLGE.indexOf(wochentag));
}

/** SCHED-F-490: verschiebt einen Wochenanfang um `wochen` Kalenderwochen (negativ = zurück). */
export function verschiebeWoche(wochenanfangDatum: string, wochen: number): string {
  return verschiebeDatum(wochenanfangDatum, wochen * 7);
}

/** Unix-Sekunden zur Mittagszeit eines ISO-Datums — Vergleichspunkt innerhalb des Tages, der bei
 * Vergleichen mit `gueltigVon`/`gueltigBis` unempfindlich gegenüber Zeitzonen-Randfällen ist. */
function unixSekundenMittag(datum: string): number {
  const [y, m, d] = datum.split('-').map(Number);
  return Math.floor(new Date(y!, m! - 1, d!, 12, 0, 0).getTime() / 1000);
}

/**
 * SCHED-F-500: liegt `datum` innerhalb des Gültigkeitszeitraums eines Termins
 * (`gueltigVon`/`gueltigBis`, Unix-Sekunden aus INT-002 `dateBegin`/`dateEnd`)?
 * `null` an einer Grenze bedeutet „keine Einschränkung" an dieser Seite.
 */
export function imGueltigkeitszeitraum(
  datum: string,
  gueltigVon: number | null,
  gueltigBis: number | null,
): boolean {
  const zeitpunkt = unixSekundenMittag(datum);
  if (gueltigVon !== null && zeitpunkt < gueltigVon) return false;
  if (gueltigBis !== null && zeitpunkt > gueltigBis) return false;
  return true;
}

/**
 * SCHED-F-510: liegt die Woche, deren Montag `wochenanfangDatum` ist, vollständig
 * außerhalb der Vorlesungszeit (`vorlesungszeitVon`/`vorlesungszeitBis`, Unix-Sekunden
 * aus den Semester-Stammdaten, API-F-230)? Ohne Angabe der Vorlesungszeit wird kein
 * Hinweis erzeugt (sicherer Rückfall: kein Fehlalarm mangels Datengrundlage).
 */
export function wocheAusserhalbVorlesungszeit(
  wochenanfangDatum: string,
  vorlesungszeitVon: number | null,
  vorlesungszeitBis: number | null,
): boolean {
  if (vorlesungszeitVon === null || vorlesungszeitBis === null) return false;
  const wochenStart = unixSekundenMittag(wochenanfangDatum);
  const wochenEnde = unixSekundenMittag(verschiebeDatum(wochenanfangDatum, 6));
  return wochenEnde < vorlesungszeitVon || wochenStart > vorlesungszeitBis;
}

/**
 * SCHED-F-150/160: Zielwochentag beim Öffnen des Stundenplans. An einem Werktag
 * (Mon–Fri) immer der aktuelle Tag (SCHED-F-150). An einem Wochenendtag ohne
 * Termine wird stattdessen — anders als im Altverhalten (dort: vorangegangener
 * Freitag) — vorwärts zum nächsten Wochentag mit Terminen gesprungen (SCHED-F-160).
 * Hat die ganze Woche keine Termine, bleibt es beim aktuellen Tag.
 */
export function zielWochentagBeimOeffnen(
  heutigerWochentag: Weekday,
  hatTermine: (wochentag: Weekday) => boolean,
): Weekday {
  const istWochenende = heutigerWochentag === 'Sat' || heutigerWochentag === 'Sun';
  if (!istWochenende || hatTermine(heutigerWochentag)) return heutigerWochentag;

  const startIndex = WOCHENTAGSREIHENFOLGE.indexOf(heutigerWochentag);
  for (let schritt = 1; schritt <= WOCHENTAGSREIHENFOLGE.length; schritt++) {
    const kandidat = WOCHENTAGSREIHENFOLGE[(startIndex + schritt) % WOCHENTAGSREIHENFOLGE.length]!;
    if (hatTermine(kandidat)) return kandidat;
  }
  return heutigerWochentag;
}
