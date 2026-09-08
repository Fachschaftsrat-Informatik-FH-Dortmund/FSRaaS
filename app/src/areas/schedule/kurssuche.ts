// Requirement „Freitextsuche im Auswahlbestand" (unverändert, weiterhin
// aktiv) — Freitextsuche über Bezeichnung, Modulnummer (`courseId`) und
// lehrende Person, diakritika- und großschreibungstolerant, auf der
// Modulebene (Requirement „Modulauswahl ohne Veranstaltungsart und Gruppen-
// Slot"). Kein struktureller Fachsemester-Filter (Requirement „Gliederung
// der Modulauswahl nach Fachsemester" — die Abschnittsgliederung selbst ist
// die einzige Fachsemester-Navigation). Reine Funktion ohne React.

import type { ModulAbschnitt } from './kursbaum';

export interface ModulFilter {
  /** Freitext; leer/undefiniert = kein Textfilter. */
  text?: string;
}

/** Entfernt Diakritika und vereinheitlicht Groß-/Kleinschreibung für den Vergleich. */
function normalisiereText(wert: string): string {
  return wert
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Wendet die Freitextsuche auf die Module aller Abschnitte an. Ein Abschnitt
 * ohne verbleibendes Modul fällt vollständig aus dem Ergebnis.
 */
export function filtereModulAbschnitte(
  abschnitte: readonly ModulAbschnitt[],
  filter: ModulFilter,
): ModulAbschnitt[] {
  const suchtext = filter.text?.trim() ? normalisiereText(filter.text.trim()) : '';
  if (!suchtext) return [...abschnitte];

  return abschnitte
    .map((a) => ({
      ...a,
      module: a.module.filter(
        (m) =>
          normalisiereText(m.name).includes(suchtext) ||
          (m.courseId !== '' && normalisiereText(m.courseId).includes(suchtext)) ||
          m.termine.some((t) => normalisiereText(t.lecturerName).includes(suchtext)),
      ),
    }))
    .filter((a) => a.module.length > 0);
}
