// Auswahl der Termine, die die Wochenansicht an einem Tag zeigt — reine
// Funktionen ohne React, damit die Wirkung ohne Renderer prüfbar bleibt.
//
// Requirement „Anzeige nur im Gültigkeitszeitraum" gilt unbedingt: Ein Termin
// außerhalb seines Zeitraums erscheint nicht mehr. Die beiden vormals
// wählbaren Filter — Ausblenden gruppenfremder Termine, Abschalten aller
// Filter — sind mit diesem Change ersatzlos entfallen (design.md,
// Entscheidung 5).
//
// Der Gültigkeitszeitraum wird je **Kalenderdatum** geprüft, nicht je Woche:
// Eine Veranstaltung, deren Zeitraum in der Wochenmitte endet, erscheint an den
// Tagen davor und an den Tagen danach nicht mehr.

import { sortiereNachBeginnzeit } from './time';
import type { PlanEntry, Weekday } from './typen';
import { datumFuerWochentag, imGueltigkeitszeitraum } from './wochenrechnung';

/**
 * Ein `Date` als ISO-Datum `"YYYY-MM-DD"` in lokaler Zeit — die Form, in der
 * `wochenrechnung.ts` rechnet. Dort liegt dieselbe Umrechnung modulintern; sie
 * wird hier nicht aus jenem Modul geholt, weil es unverändert bleibt
 * (design.md, Nicht-Ziele).
 */
export function isoDatumVon(zeitpunkt: Date): string {
  const monat = String(zeitpunkt.getMonth() + 1).padStart(2, '0');
  const tag = String(zeitpunkt.getDate()).padStart(2, '0');
  return `${zeitpunkt.getFullYear()}-${monat}-${tag}`;
}

/** Warum an einem Wochentag kein Termin steht — Grundlage des Leerzustands (Requirement „Kennzeichnung eines leeren Wochentags"). */
export type LeerGrund = 'ohneTermine' | 'gueltigkeitszeitraum';

/** Alle Termine, die an diesem Wochentag liegen — noch ohne den Gültigkeitszeitraum. */
function amWochentag(entries: readonly PlanEntry[], wochentag: Weekday): PlanEntry[] {
  return entries.filter((e) => e.weekday === wochentag);
}

/**
 * Die Termine eines Wochentags der angezeigten Woche, im Gültigkeitszeitraum
 * und aufsteigend nach Beginnzeit sortiert (Requirement „Sortierung nach
 * Beginnzeit").
 */
export function termineDesTages(
  entries: readonly PlanEntry[],
  wochenanfang: string,
  wochentag: Weekday,
): PlanEntry[] {
  const datum = datumFuerWochentag(wochenanfang, wochentag);
  const gefiltert = amWochentag(entries, wochentag).filter((e) =>
    imGueltigkeitszeitraum(datum, e.gueltigVon, e.gueltigBis),
  );
  return sortiereNachBeginnzeit(gefiltert);
}

/** Die Termine der ganzen angezeigten Woche — Grundlage der Wochentagsleiste. */
export function termineDerWoche(
  entries: readonly PlanEntry[],
  wochenanfang: string,
  wochentage: readonly Weekday[],
): PlanEntry[] {
  return wochentage.flatMap((tag) => termineDesTages(entries, wochenanfang, tag));
}

/**
 * Requirement „Kennzeichnung eines leeren Wochentags": Liegt der Grund im
 * Gültigkeitszeitraum, wird das genannt; liegt am Tag ohnehin kein Termin,
 * wird kein Grund behauptet.
 */
export function leerGrund(entries: readonly PlanEntry[], wochenanfang: string, wochentag: Weekday): LeerGrund {
  const alle = amWochentag(entries, wochentag);
  if (alle.length === 0) return 'ohneTermine';

  const datum = datumFuerWochentag(wochenanfang, wochentag);
  if (alle.some((e) => !imGueltigkeitszeitraum(datum, e.gueltigVon, e.gueltigBis))) {
    return 'gueltigkeitszeitraum';
  }

  return 'ohneTermine';
}
