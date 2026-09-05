// SCHED-F-600: verdichtet den flachen INT-002-Terminbestand zu einem Baum
// Veranstaltung → Veranstaltungsart → Gruppen-Slot, statt ihn als flache Liste
// darzustellen (Live-Prüfung 2026-09-04: 121 bzw. 161 Einträge je Abruf — als
// flache Liste nicht bedienbar). Gruppierungsschlüssel einer Veranstaltung ist
// `courseId`, mit Rückfall auf `name`, wenn `courseId` leer ist (INT-002 liefert
// `courseId` beobachtet leer). Je Slot wird die Gruppenzugehörigkeit nach
// `groupMatch.ts` mitgeführt (SCHED-F-140), damit der eigene Slot vorgewählt
// werden kann. Reine Funktion ohne React; Vorbild `canteen/consolidate.ts`
// (Gruppierung mit stabiler Eingabereihenfolge über eine `Map`).

import { gruppenzugehoerig } from './groupMatch';
import type { CourseType, OfficialTermin } from './typen';

/** Ein einzelner Termin innerhalb einer Veranstaltungsart — ein Gruppenangebot. */
export interface KursSlot {
  termin: OfficialTermin;
  /** Ergebnis von `groupMatch.ts` (SCHED-F-050 bis F-090) für die aktuelle Gruppenkennung. */
  gruppenzugehoerig: boolean;
}

export interface KursArt {
  courseType: CourseType;
  /**
   * Mehrere Slots derselben Veranstaltungsart bleiben nebeneinander bestehen
   * und sind unabhängig voneinander wählbar (SCHED-F-620) — diese Struktur
   * schließt keinen Slot aufgrund eines anderen aus.
   */
  slots: KursSlot[];
}

export interface Kurs {
  /** Gruppierungsschlüssel: `courseId`, ersatzweise `name` (siehe Moduldoku oben). */
  key: string;
  courseId: string;
  name: string;
  arten: KursArt[];
}

function kursSchluessel(termin: OfficialTermin): string {
  return termin.courseId.trim() !== '' ? termin.courseId : termin.name;
}

/**
 * Baut den dreistufigen Auswahlbestand (SCHED-F-600) aus einer flachen Liste
 * normalisierter Termine. `gruppenkennung` ist `null`/leer, solange keine
 * Gruppenkennung eingegeben wurde (SCHED-F-050). Reihenfolge folgt der
 * Eingabereihenfolge der Termine (stabile Gruppierung, kein Sortieren).
 */
export function baueKursbaum(
  termine: readonly OfficialTermin[],
  gruppenkennung: string | null | undefined,
): Kurs[] {
  const kurse = new Map<string, { index: number; courseId: string; name: string; arten: Map<CourseType, { index: number; slots: KursSlot[] }> }>();
  let kursIndex = 0;

  for (const termin of termine) {
    const schluessel = kursSchluessel(termin);
    let kurs = kurse.get(schluessel);
    if (!kurs) {
      kurs = { index: kursIndex++, courseId: termin.courseId, name: termin.name, arten: new Map() };
      kurse.set(schluessel, kurs);
    }

    let art = kurs.arten.get(termin.courseType);
    if (!art) {
      art = { index: kurs.arten.size, slots: [] };
      kurs.arten.set(termin.courseType, art);
    }
    art.slots.push({ termin, gruppenzugehoerig: gruppenzugehoerig(gruppenkennung, termin.studentSet) });
  }

  return [...kurse.entries()]
    .sort((a, b) => a[1].index - b[1].index)
    .map(([key, kurs]) => ({
      key,
      courseId: kurs.courseId,
      name: kurs.name,
      arten: [...kurs.arten.entries()]
        .sort((a, b) => a[1].index - b[1].index)
        .map(([courseType, art]) => ({ courseType, slots: art.slots })),
    }));
}
