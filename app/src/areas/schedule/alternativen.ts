// Requirements „Einblenden aller Veranstaltungen gewählter Module" und
// „Einblenden nicht gewählter Veranstaltungen". Erstes: aus dem
// Auswahlbestand (Module der gewählten Endpunkte, `kursbaum.ts`) alle
// weiteren Termine der Module, die der persönliche Plan bereits trägt
// ("gewählte Module"), abzüglich der bereits im Plan stehenden Slots. Reine
// Funktionen ohne React — Vorbild `planungsstand.ts`.
//
// Das Ergebnis sind synthetische, nie persistierte `PlanEntry`-Objekte
// (Merkmal `einblendung`, `typen.ts`), damit Zeitachse und Stapelung
// (`dayLayout.ts`) sie unverändert mitverarbeiten — ohne eigene
// Darstellungslogik für Alternativen.

import { farbeFuerVeranstaltung } from './farbe';
import { gruppenzugehoerig } from './groupMatch';
import type { Modul } from './kursbaum';
import { planEintraegeFuerModul, terminEntsprichtEintrag, terminSchluessel } from './planungsstand';
import type { Einblendung, OfficialPlanEntry, OfficialTermin, PlanEntry, Weekday } from './typen';

/**
 * Module, die der persönliche Plan bereits trägt — "gewählte Module" im
 * Sinn des Requirements. Ohne einen bestehenden Planeintrag gibt es nichts,
 * zu dem eine Alternative sinnvoll wäre.
 */
export function gewaehlteModule(module: readonly Modul[], entries: readonly PlanEntry[]): Modul[] {
  return module.filter((m) => planEintraegeFuerModul(entries, m).length > 0);
}

/** Ein Rohtermin als eingeblendeter, nie gespeicherter Planeintrag. */
function eingeblendeterEintrag(
  termin: OfficialTermin,
  id: string,
  einblendung: Einblendung,
  gruppenkennung: string,
): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    id,
    deaktiviertBis: null,
    color: farbeFuerVeranstaltung(termin.courseId || termin.name),
    weekday: termin.weekday,
    timeBeginMin: termin.timeBeginMin,
    timeEndMin: termin.timeEndMin,
    gruppenzugehoerig: gruppenzugehoerig(gruppenkennung, termin.studentSet),
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    gueltigVon: termin.gueltigVon,
    gueltigBis: termin.gueltigBis,
    courseId: termin.courseId,
    name: termin.name,
    courseType: termin.courseType,
    lecturerName: termin.lecturerName,
    studentSet: termin.studentSet,
    roomId: termin.roomId,
    einblendung,
  };
}

/**
 * Alle Termine der gewählten Module an einem Wochentag, die nicht bereits im
 * persönlichen Plan stehen. Jeder erhält eine stabile, aus dem Rohtermin
 * abgeleitete Kennung (`terminSchluessel`) — Alternativen ändern sich mit
 * jedem Abruf nicht in ihrer Identität, solange INT-002 denselben Termin
 * liefert.
 */
export function alternativenDesTages(
  module: readonly Modul[],
  entries: readonly PlanEntry[],
  wochentag: Weekday,
  gruppenkennung: string,
): OfficialPlanEntry[] {
  const ergebnis: OfficialPlanEntry[] = [];
  // Derselbe Rohtermin kann in mehreren gewählten Modulen stehen (Change
  // `planungsmodus-mehrfachauswahl-defekt`, design.md Entscheidungen 3 und 4)
  // — er wird nur einmal eingeblendet.
  const bereitsEingeblendet = new Set<string>();
  for (const modul of gewaehlteModule(module, entries)) {
    for (const termin of modul.termine) {
      if (termin.weekday !== wochentag) continue;
      if (entries.some((e) => terminEntsprichtEintrag(termin, e))) continue;
      const id = `alternative-${terminSchluessel(termin)}`;
      if (bereitsEingeblendet.has(id)) continue;
      bereitsEingeblendet.add(id);
      ergebnis.push(
        eingeblendeterEintrag(termin, id, { art: 'alternative', modulKey: modul.key }, gruppenkennung),
      );
    }
  }
  return ergebnis;
}

/**
 * Requirement „Einblenden nicht gewählter Veranstaltungen": alle Termine der
 * Module ohne Planeintrag an einem Wochentag. Ein Rohtermin, der zugleich in
 * einem gewählten Modul steht, gehört zur gewählten Seite und erscheint hier
 * nie — sonst böte sein Antippen ein Modul zum Aufnehmen an, dessen Termin der
 * Plan schon führt oder als Alternative zeigt (Change
 * `alle-veranstaltungen-einblenden`, design.md Entscheidung 2).
 */
export function nichtGewaehlteDesTages(
  module: readonly Modul[],
  entries: readonly PlanEntry[],
  wochentag: Weekday,
  gruppenkennung: string,
): OfficialPlanEntry[] {
  const gewaehlt = gewaehlteModule(module, entries);
  const gewaehlteSchluessel = new Set(gewaehlt.flatMap((m) => m.termine.map(terminSchluessel)));
  const ergebnis: OfficialPlanEntry[] = [];
  const bereitsEingeblendet = new Set<string>();
  for (const modul of module) {
    if (gewaehlt.includes(modul)) continue;
    for (const termin of modul.termine) {
      if (termin.weekday !== wochentag) continue;
      const schluessel = terminSchluessel(termin);
      if (gewaehlteSchluessel.has(schluessel)) continue;
      if (entries.some((e) => terminEntsprichtEintrag(termin, e))) continue;
      const id = `nichtgewaehlt-${schluessel}`;
      if (bereitsEingeblendet.has(id)) continue;
      bereitsEingeblendet.add(id);
      ergebnis.push(
        eingeblendeterEintrag(termin, id, { art: 'nichtGewaehlt', modulKey: modul.key }, gruppenkennung),
      );
    }
  }
  return ergebnis;
}
