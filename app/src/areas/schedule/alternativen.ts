// Requirement „Einblenden aller Veranstaltungen gewählter Module": aus dem
// Auswahlbestand (Module der gewählten Endpunkte, `kursbaum.ts`) alle
// weiteren Termine der Module, die der persönliche Plan bereits trägt
// ("gewählte Module"), abzüglich der bereits im Plan stehenden Slots. Reine
// Funktionen ohne React — Vorbild `planungsstand.ts`.
//
// Das Ergebnis sind synthetische, nie persistierte `PlanEntry`-Objekte
// (`istAlternative: true`, `typen.ts`), damit Zeitachse und Stapelung
// (`dayLayout.ts`) sie unverändert mitverarbeiten — ohne eigene
// Darstellungslogik für Alternativen.

import { farbeFuerVeranstaltung } from './farbe';
import { gruppenzugehoerig } from './groupMatch';
import type { Modul } from './kursbaum';
import { planEintraegeFuerModul, terminEntsprichtEintrag, terminSchluessel } from './planungsstand';
import type { OfficialPlanEntry, PlanEntry, Weekday } from './typen';

/**
 * Module, die der persönliche Plan bereits trägt — "gewählte Module" im
 * Sinn des Requirements. Ohne einen bestehenden Planeintrag gibt es nichts,
 * zu dem eine Alternative sinnvoll wäre.
 */
export function gewaehlteModule(module: readonly Modul[], entries: readonly PlanEntry[]): Modul[] {
  return module.filter((m) => planEintraegeFuerModul(entries, m).length > 0);
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
  gruppenkennung: string | null,
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
      ergebnis.push({
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
        istPruefung: false,
        gueltigVon: termin.gueltigVon,
        gueltigBis: termin.gueltigBis,
        courseId: termin.courseId,
        name: termin.name,
        courseType: termin.courseType,
        lecturerName: termin.lecturerName,
        studentSet: termin.studentSet,
        roomId: termin.roomId,
        istAlternative: true,
      });
    }
  }
  return ergebnis;
}
