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
import type { CourseType, OfficialPlanEntry, OfficialTermin, PlanEntry } from './typen';

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

/** Die Felder, die einen Rohtermin ausmachen — Rohtermin und Planeintrag tragen sie gleichermaßen. */
type TerminMerkmale = Pick<
  OfficialTermin,
  'courseId' | 'name' | 'courseType' | 'weekday' | 'timeBeginMin' | 'timeEndMin' | 'roomId' | 'studentSet'
>;

/**
 * Identität eines Rohtermins. INT-002 liefert selbst keine Terminkennung
 * (integrations, INT-002: `id` leer beobachtet); maßgeblich sind die Merkmale
 * des Requirements „Zusammenfassen deckungsgleicher Rohtermine" —
 * Veranstaltung (Kurs und Name), Art, Wochentag, Zeitraum, Raum und
 * Gruppenmenge. Dieselbe Kennung dient `kursbaum.ts` zum Zusammenfassen und
 * dem Planungsmodus zur Auswahl: Was als eine Zeile erscheint, wird als ein
 * Slot gewählt (Change `planungsmodus-mehrfachauswahl-defekt`, design.md
 * Entscheidung 1). Der Name zählt mit, weil Parallelgruppen wie „Technisches
 * Englisch 1" und „Technisches Englisch 10" Kurs, Zeit und Gruppenmenge teilen
 * und sich nur in Name und Raum unterscheiden.
 */
export function terminSchluessel(t: TerminMerkmale): string {
  return [t.courseId, t.courseType, t.weekday, t.timeBeginMin, t.timeEndMin, t.roomId, t.studentSet, t.name].join(
    '|',
  );
}

/**
 * Alle Planeinträge, die zu einem Modul gehören (`kursbaum.ts`-Gruppierungsschlüssel
 * `courseId`, ersatzweise `name`). Verwendet von der Modulauswahl (Abwahl mit
 * vorhandenen Planeinträgen), dem Planungsmodus (erneuter Aufruf) und den
 * eingeblendeten Alternativen (`alternativen.ts`).
 */
export function planEintraegeFuerModul(entries: readonly PlanEntry[], modul: Modul): OfficialPlanEntry[] {
  return entries.filter(
    (e): e is OfficialPlanEntry =>
      e.kind === 'offiziell' && (modul.courseId !== '' ? e.courseId === modul.courseId : e.name === modul.name),
  );
}

/** Trägt ein Planeintrag (gesichert oder im Zwischenstand) genau diesen Rohtermin? */
export function terminEntsprichtEintrag(t: OfficialTermin, e: PlanEntry): boolean {
  return e.kind === 'offiziell' && terminSchluessel(e) === terminSchluessel(t);
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
