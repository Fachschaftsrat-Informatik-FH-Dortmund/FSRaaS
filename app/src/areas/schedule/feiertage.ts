// Gesetzliche Feiertage in Nordrhein-Westfalen — berechnet statt gepflegt
// (Requirement „Hinweis auf gesetzlichen Feiertag", design.md, Entscheidung
// „Berechnung statt Liste oder API"). Reine Funktionen ohne React und ohne
// Netzzugriff; die Rechnung arbeitet auf ISO-Datumszeichenketten
// `"YYYY-MM-DD"` wie `wochenrechnung.ts`.
//
// Maßgeblich ist § 2 Feiertagsgesetz NRW: elf gesetzliche Feiertage, davon
// sechs mit festem Kalenderdatum und fünf aus dem Ostersonntag abgeleitet.
// Der Reformationstag (31.10.) gehört ausdrücklich **nicht** dazu — er ist in
// NRW kein gesetzlicher Feiertag, anders als in den norddeutschen Ländern.

import { verschiebeDatum } from './wochenrechnung';

/** Kennung eines Feiertags — zugleich der i18n-Schlüssel unter `schedule.feiertage.*`. */
export type FeiertagSchluessel =
  | 'neujahr'
  | 'karfreitag'
  | 'ostermontag'
  | 'tagDerArbeit'
  | 'christiHimmelfahrt'
  | 'pfingstmontag'
  | 'fronleichnam'
  | 'tagDerDeutschenEinheit'
  | 'allerheiligen'
  | 'ersterWeihnachtstag'
  | 'zweiterWeihnachtstag';

/** Die sechs Feiertage mit festem Kalenderdatum (Monat/Tag). */
const FESTE_FEIERTAGE: readonly { monat: number; tag: number; schluessel: FeiertagSchluessel }[] = [
  { monat: 1, tag: 1, schluessel: 'neujahr' },
  { monat: 5, tag: 1, schluessel: 'tagDerArbeit' },
  { monat: 10, tag: 3, schluessel: 'tagDerDeutschenEinheit' },
  { monat: 11, tag: 1, schluessel: 'allerheiligen' },
  { monat: 12, tag: 25, schluessel: 'ersterWeihnachtstag' },
  { monat: 12, tag: 26, schluessel: 'zweiterWeihnachtstag' },
];

/** Die fünf aus dem Ostersonntag abgeleiteten Feiertage, als Abstand in Tagen. */
const OSTERABSTAENDE: readonly { tage: number; schluessel: FeiertagSchluessel }[] = [
  { tage: -2, schluessel: 'karfreitag' },
  { tage: 1, schluessel: 'ostermontag' },
  { tage: 39, schluessel: 'christiHimmelfahrt' },
  { tage: 50, schluessel: 'pfingstmontag' },
  { tage: 60, schluessel: 'fronleichnam' },
];

/**
 * Ostersonntag eines Jahres im gregorianischen Kalender als `"YYYY-MM-DD"` —
 * Gaußsche Osterformel in der Fassung ohne gesonderte Ausnahmeregeln (anonyme
 * gregorianische Osterformel). Sie gilt für alle Jahre ab 1583 und braucht
 * keine Tabelle.
 */
export function ostersonntag(jahr: number): string {
  const a = jahr % 19;
  const b = Math.floor(jahr / 100);
  const c = jahr % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31); // 3 = März, 4 = April
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
}

/** Zwischenspeicher je Jahr — die Berechnung ist deterministisch, eine Wiederholung je Termin wäre verschenkt. */
const jahresZwischenspeicher = new Map<number, ReadonlyMap<string, FeiertagSchluessel>>();

/** Alle gesetzlichen Feiertage eines Jahres in NRW, als Zuordnung ISO-Datum → Kennung. */
export function feiertageNRW(jahr: number): ReadonlyMap<string, FeiertagSchluessel> {
  const vorhanden = jahresZwischenspeicher.get(jahr);
  if (vorhanden) return vorhanden;

  const tage = new Map<string, FeiertagSchluessel>();
  for (const { monat, tag, schluessel } of FESTE_FEIERTAGE) {
    tage.set(`${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`, schluessel);
  }
  const ostern = ostersonntag(jahr);
  for (const { tage: abstand, schluessel } of OSTERABSTAENDE) {
    tage.set(verschiebeDatum(ostern, abstand), schluessel);
  }

  jahresZwischenspeicher.set(jahr, tage);
  return tage;
}

/**
 * Ist `datum` (`"YYYY-MM-DD"`) ein gesetzlicher Feiertag in NRW? Liefert dessen
 * Kennung, sonst `null`. Grundlage des Hinweises am Stundenplan-Termin — ohne
 * jeden Bezug zum Raumplan (INT-009) oder dessen Abrufstand.
 */
export function feiertagAm(datum: string): FeiertagSchluessel | null {
  const jahr = Number(datum.slice(0, 4));
  if (!Number.isInteger(jahr)) return null;
  return feiertageNRW(jahr).get(datum) ?? null;
}
