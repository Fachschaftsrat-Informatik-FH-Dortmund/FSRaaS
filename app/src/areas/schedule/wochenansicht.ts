// Auswahl der Termine, die die Wochenansicht an einem Tag zeigt — reine
// Funktionen ohne React, damit die Filterwirkung ohne Renderer prüfbar bleibt.
//
// Zwei Filter wirken auf die Wochenansicht: das Ausblenden gruppenfremder
// Termine (Requirement „Schalter zum Ausblenden gruppenfremder Termine") und
// der Gültigkeitszeitraum (Requirement „Anzeige nur im Gültigkeitszeitraum").
// Beide werden vom Schalter „alle Filter abschalten" überlagert, der die
// wirksamen Werte über `ansichtEinstellungen.wirksameFilter` liefert.
//
// Der Gültigkeitszeitraum wird je **Kalenderdatum** geprüft, nicht je Woche:
// Eine Veranstaltung, deren Zeitraum in der Wochenmitte endet, erscheint an den
// Tagen davor und an den Tagen danach nicht mehr.

import type { WirksameFilter } from './ansichtEinstellungen';
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

/** Warum an einem Wochentag kein Termin steht — Grundlage des Leerzustands. */
export type LeerGrund = 'ohneTermine' | 'gruppenfilter' | 'gueltigkeitszeitraum';

/** Alle Termine, die an diesem Wochentag liegen — noch ohne Filter. */
function amWochentag(entries: readonly PlanEntry[], wochentag: Weekday): PlanEntry[] {
  return entries.filter((e) => e.weekday === wochentag);
}

/**
 * Die Termine eines Wochentags der angezeigten Woche, nach den wirksamen
 * Filtern und aufsteigend nach Beginnzeit sortiert (Requirement „Sortierung
 * nach Beginnzeit").
 */
export function termineDesTages(
  entries: readonly PlanEntry[],
  wochenanfang: string,
  wochentag: Weekday,
  filter: WirksameFilter,
): PlanEntry[] {
  const datum = datumFuerWochentag(wochenanfang, wochentag);
  const gefiltert = amWochentag(entries, wochentag).filter((e) => {
    if (filter.gruppenfremdeAusblenden && !e.gruppenzugehoerig) return false;
    if (filter.gueltigkeitszeitraumPruefen && !imGueltigkeitszeitraum(datum, e.gueltigVon, e.gueltigBis)) {
      return false;
    }
    return true;
  });
  return sortiereNachBeginnzeit(gefiltert);
}

/** Die Termine der ganzen angezeigten Woche — Grundlage für Belegungsvorschau und Zeitachsenspanne. */
export function termineDerWoche(
  entries: readonly PlanEntry[],
  wochenanfang: string,
  filter: WirksameFilter,
  wochentage: readonly Weekday[],
): PlanEntry[] {
  return wochentage.flatMap((tag) => termineDesTages(entries, wochenanfang, tag, filter));
}

/**
 * Requirement „Leerer Tag bei wirksamem Filter": Nennt den Filter, der den Tag
 * geleert hat. Liegt am Tag ohnehin kein Termin, ist kein Filter schuld
 * (`'ohneTermine'`). Wirken beide Filter, wird der Gruppenfilter genannt — er
 * ist der von der Nutzerin unmittelbar umschaltbare.
 */
export function leerGrund(
  entries: readonly PlanEntry[],
  wochenanfang: string,
  wochentag: Weekday,
  filter: WirksameFilter,
): LeerGrund {
  const alle = amWochentag(entries, wochentag);
  if (alle.length === 0) return 'ohneTermine';

  if (filter.gruppenfremdeAusblenden && alle.some((e) => !e.gruppenzugehoerig)) return 'gruppenfilter';

  const datum = datumFuerWochentag(wochenanfang, wochentag);
  if (
    filter.gueltigkeitszeitraumPruefen &&
    alle.some((e) => !imGueltigkeitszeitraum(datum, e.gueltigVon, e.gueltigBis))
  ) {
    return 'gueltigkeitszeitraum';
  }

  return 'ohneTermine';
}
