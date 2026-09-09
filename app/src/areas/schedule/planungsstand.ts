// Requirements „Vorbelegung eindeutiger Veranstaltungen" und „Kennzeichnung des
// Planungsstands je Veranstaltung" (design.md, Entscheidungen 1 und 2): berechnet
// aus den gewählten Modulen und dem Zwischenstand (gesicherter Plan samt allen
// in der laufenden Sitzung getroffenen, noch ungesicherten Entscheidungen), was
// je (Modul, Veranstaltungsart) bereits entschieden ist. Reine Funktion ohne
// React, wie `dayLayout.ts` und `jetzt.ts` — Grundlage sowohl für die
// Zeilenkennzeichnung im Planungsmodus als auch für die Leiste der
// ausstehenden Veranstaltungen: eine Quelle, zwei Darstellungen (design.md).
//
// design.md nennt vier Ausprägungen des Stands ('offen'/'eindeutig'/
// 'gewaehlt'/'ausstehend'). 'ausstehend' beschreibt dort dieselbe Tatsache wie
// 'offen' und der noch nicht angewandte Fall von 'eindeutig' zusammen —
// „nichts gewählt" — und wird hier nicht als eigener Wert geführt: Sowohl die
// Zeilenkennzeichnung „noch nicht eingeplant" als auch die Leiste der
// Ausstehenden prüfen einheitlich `stand !== 'gewaehlt'`.

import type { Modul } from './kursbaum';
import type { CourseType, OfficialTermin, PlanEntry } from './typen';

export type VeranstaltungsartStandArt = 'offen' | 'eindeutig' | 'gewaehlt';

export interface VeranstaltungsartStand {
  modulKey: string;
  modulName: string;
  art: CourseType;
  /** Alle Termine dieser Veranstaltungsart im gewählten Modul, in Eingabereihenfolge des Moduls. */
  slots: readonly OfficialTermin[];
  /** Die von `slots` bereits im Zwischenstand gewählten Termine. */
  gewaehlteSlots: readonly OfficialTermin[];
  stand: VeranstaltungsartStandArt;
}

/**
 * Stabile Kennung eines Rohtermins innerhalb einer Veranstaltungsart. INT-002
 * liefert selbst keine Terminkennung (integrations.md); die Kombination aus
 * Kurs, Art, Wochentag, Zeitraum, Raum und Gruppenmenge ist im geprüften
 * Bestand eindeutig.
 */
export function terminSchluessel(t: OfficialTermin): string {
  return [t.courseId, t.courseType, t.weekday, t.timeBeginMin, t.timeEndMin, t.roomId, t.studentSet].join('|');
}

/** Trägt ein Planeintrag (gesichert oder im Zwischenstand) genau diesen Rohtermin? */
export function terminEntsprichtEintrag(t: OfficialTermin, e: PlanEntry): boolean {
  return (
    e.kind === 'offiziell' &&
    e.courseId === t.courseId &&
    e.courseType === t.courseType &&
    e.weekday === t.weekday &&
    e.timeBeginMin === t.timeBeginMin &&
    e.timeEndMin === t.timeEndMin &&
    e.studentSet === t.studentSet
  );
}

/** Gruppiert die Termine eines Moduls nach Veranstaltungsart, stabil in Eingabereihenfolge. */
function gruppiereNachArt(termine: readonly OfficialTermin[]): Map<CourseType, OfficialTermin[]> {
  const arten = new Map<CourseType, OfficialTermin[]>();
  for (const termin of termine) {
    const liste = arten.get(termin.courseType);
    if (liste) liste.push(termin);
    else arten.set(termin.courseType, [termin]);
  }
  return arten;
}

/**
 * Requirement „Vorbelegung eindeutiger Veranstaltungen": die Slots, die als
 * einziger ihrer Veranstaltungsart eines gewählten Moduls dastehen. Sie werden
 * beim Öffnen des Planungsmodus als gewählt vorbelegt. Bietet eine
 * Veranstaltungsart mehrere Slots, wird keiner vorbelegt — auch wenn die
 * Gruppenkennung genau einen einschließt (design.md, Entscheidung 1): Die
 * Gruppenkennung kann aus einer Handeingabe oder aus INT-019, einem
 * undokumentierten Endpunkt ohne SLA, stammen und ist keine Tatsache über den
 * Stundenplan der Nutzerin. Ein einziger Slot ist es.
 */
export function vorbelegteSlots(module: readonly Modul[]): OfficialTermin[] {
  const ergebnis: OfficialTermin[] = [];
  for (const modul of module) {
    for (const slots of gruppiereNachArt(modul.termine).values()) {
      if (slots.length === 1) ergebnis.push(slots[0]!);
    }
  }
  return ergebnis;
}

/**
 * Requirement „Kennzeichnung des Planungsstands je Veranstaltung": Stand je
 * (Modul, Veranstaltungsart), abgeleitet aus den gewählten Modulen und dem
 * Zwischenstand — dem gesicherten Plan samt allen in der laufenden Sitzung
 * getroffenen, noch ungesicherten Entscheidungen (design.md, Entscheidung 3).
 * Kandidaten, zu denen noch keine Entscheidung getroffen wurde, tragen per
 * Konstruktion keinen Eintrag im Zwischenstand und zählen deshalb nicht mit.
 */
export function ermittlePlanungsstand(
  module: readonly Modul[],
  zwischenstand: readonly PlanEntry[],
): VeranstaltungsartStand[] {
  const ergebnis: VeranstaltungsartStand[] = [];
  for (const modul of module) {
    for (const [art, slots] of gruppiereNachArt(modul.termine)) {
      const gewaehlteSlots = slots.filter((slot) => zwischenstand.some((e) => terminEntsprichtEintrag(slot, e)));
      const stand: VeranstaltungsartStandArt =
        gewaehlteSlots.length > 0 ? 'gewaehlt' : slots.length === 1 ? 'eindeutig' : 'offen';
      ergebnis.push({ modulKey: modul.key, modulName: modul.name, art, slots, gewaehlteSlots, stand });
    }
  }
  return ergebnis;
}
