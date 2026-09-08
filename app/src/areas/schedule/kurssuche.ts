// Requirement „Freitextsuche im Auswahlbestand" (unverändert, weiterhin
// aktiv) — Freitextsuche über Bezeichnung, Modulnummer (`courseId`) und
// lehrende Person, diakritika- und großschreibungstolerant, jetzt auf der
// Modulebene (Requirement „Modulauswahl ohne Veranstaltungsart und Gruppen-
// Slot"). Dazu ein Filter auf ein einzelnes Fachsemester. Reine Funktion
// ohne React.

import type { ModulAbschnitt } from './kursbaum';

export interface ModulFilter {
  /** Freitext; leer/undefiniert = kein Textfilter. */
  text?: string;
  /** Nur der Abschnitt dieses Fachsemesters bleibt sichtbar; undefiniert = alle Abschnitte. */
  grade?: string;
}

/** Entfernt Diakritika und vereinheitlicht Groß-/Kleinschreibung für den Vergleich. */
function normalisiereText(wert: string): string {
  return wert
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Wendet den Fachsemester-Filter strukturell auf die Abschnitte an und danach
 * die Freitextsuche auf die verbleibenden Module. Ein Abschnitt ohne
 * verbleibendes Modul fällt vollständig aus dem Ergebnis.
 */
export function filtereModulAbschnitte(
  abschnitte: readonly ModulAbschnitt[],
  filter: ModulFilter,
): ModulAbschnitt[] {
  const strukturellGefiltert = abschnitte.filter(
    (a) => filter.grade === undefined || (a.kennung.art === 'fachsemester' && a.kennung.grade === filter.grade),
  );

  const suchtext = filter.text?.trim() ? normalisiereText(filter.text.trim()) : '';
  if (!suchtext) return strukturellGefiltert;

  return strukturellGefiltert
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
