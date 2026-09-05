// SCHED-F-630: Freitextsuche über den Auswahlbestand (`kursbaum.ts`), diakritika-
// und großschreibungstolerant, berücksichtigt Bezeichnung, Modulnummer
// (`courseId`) und lehrende Person. Dazu SCHED-F-610 (Filter nach
// Veranstaltungsart) und SCHED-F-640 (Filter nach Fachsemester). Reine Funktion
// ohne React.

import type { Kurs } from './kursbaum';
import type { CourseType } from './typen';

export interface KurssucheFilter {
  /** Freitext (SCHED-F-630); leer/undefiniert = kein Textfilter. */
  text?: string;
  /** SCHED-F-610: nur diese Veranstaltungsarten bleiben sichtbar; undefiniert = alle. */
  courseTypes?: readonly CourseType[];
  /** SCHED-F-640: nur Slots mit diesem Fachsemester bleiben sichtbar; undefiniert = alle. */
  grade?: string;
}

/** Entfernt Diakritika und vereinheitlicht Groß-/Kleinschreibung für den Vergleich. */
function normalisiereText(wert: string): string {
  return wert
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function slotPasstZuFachsemester(grade: string | undefined, filter: string | undefined): boolean {
  if (filter === undefined) return true;
  return (grade ?? '') === filter;
}

/**
 * Wendet Veranstaltungsart- und Fachsemester-Filter strukturell auf den
 * Kursbaum an (SCHED-F-610/F-640) und danach die Freitextsuche (SCHED-F-630)
 * auf das gefilterte Ergebnis. Eine Veranstaltung ohne verbleibende
 * Veranstaltungsart bzw. eine Veranstaltungsart ohne verbleibenden Slot fällt
 * vollständig aus dem Ergebnis.
 */
export function filtereKurse(kurse: readonly Kurs[], filter: KurssucheFilter): Kurs[] {
  const suchtext = filter.text?.trim() ? normalisiereText(filter.text.trim()) : '';

  const strukturellGefiltert = kurse
    .map((kurs) => {
      const arten = kurs.arten
        .filter((art) => !filter.courseTypes || filter.courseTypes.includes(art.courseType))
        .map((art) => ({
          ...art,
          slots: art.slots.filter((slot) => slotPasstZuFachsemester(slot.termin.grade, filter.grade)),
        }))
        .filter((art) => art.slots.length > 0);
      return { ...kurs, arten };
    })
    .filter((kurs) => kurs.arten.length > 0);

  if (!suchtext) return strukturellGefiltert;

  return strukturellGefiltert.filter((kurs) => {
    if (normalisiereText(kurs.name).includes(suchtext)) return true;
    if (kurs.courseId && normalisiereText(kurs.courseId).includes(suchtext)) return true;
    return kurs.arten.some((art) =>
      art.slots.some((slot) => normalisiereText(slot.termin.lecturerName).includes(suchtext)),
    );
  });
}
