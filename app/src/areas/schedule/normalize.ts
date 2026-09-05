// SCHED-F-030: überführt einen FBWS-Rohsatz aus INT-002 (`platform/integrations.md`,
// Abschnitt „INT-002 — FBWS Termine") in den Typ `OfficialTermin`. Nach Auftrag nur
// `name`, `courseType`, `studentSet`, `weekday`, `timeBegin`, `timeEnd` als sicher
// vorhanden behandelt — alles andere optional. Fehlt eines der sechs sicheren Felder
// oder trägt einen Typ, der sich nicht auswerten lässt, wird der Satz übersprungen
// (Vorbild: `specs/features/room-finder/spec.md` Abschnitt 9, „Raumplan-Termin ohne
// auswertbare Zeitangabe … überspringen"); jede optionale Abweichung wird protokolliert,
// nie stillschweigend verschluckt (SEC-F-060). Reine Funktion ohne React.

import { logError } from '@/errors/AppError';

import { zeitZuMinuten } from './time';
import type { CourseType, OfficialTermin, Weekday } from './typen';

const BEKANNTE_WOCHENTAGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BEKANNTE_COURSE_TYPES: readonly CourseType[] = ['V', 'Ü', 'ÜPP', 'P', 'SV', 'T'];

function istNichtleererString(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.trim() !== '';
}

function istFbwsZeit(wert: unknown): wert is string | number {
  return typeof wert === 'string' || typeof wert === 'number';
}

function alsOptionalerString(wert: unknown, kontext: string): string | undefined {
  if (wert === undefined || wert === null) return undefined;
  if (typeof wert === 'string') return wert;
  logError(kontext, new Error('unerwarteter Feldtyp, erwartet String'));
  return undefined;
}

function alsUnixSekundenOderNull(wert: unknown, kontext: string): number | null {
  if (wert === undefined || wert === null) return null;
  if (typeof wert === 'number' && Number.isFinite(wert)) return wert;
  logError(kontext, new Error('unerwarteter Feldtyp, erwartet Unix-Sekunden'));
  return null;
}

/**
 * Normalisiert einen INT-002-Rohsatz. Gibt `null` zurück, wenn eines der sechs
 * sicher erwarteten Felder fehlt oder nicht auswertbar ist — der Satz wird dann
 * übersprungen, der Vorfall protokolliert (SEC-F-060).
 */
export function normalizeOfficialTermin(roh: Record<string, unknown>): OfficialTermin | null {
  const { name, courseType, studentSet, weekday, timeBegin, timeEnd } = roh;

  if (!istNichtleererString(name)) {
    logError('normalize.name', new Error('fehlt oder ist kein String'));
    return null;
  }
  if (!istNichtleererString(studentSet)) {
    logError('normalize.studentSet', new Error('fehlt oder ist kein String'));
    return null;
  }
  if (typeof weekday !== 'string' || !BEKANNTE_WOCHENTAGE.includes(weekday as Weekday)) {
    logError('normalize.weekday', new Error('fehlt oder ist kein bekannter Wochentag'));
    return null;
  }
  if (!istFbwsZeit(timeBegin)) {
    logError('normalize.timeBegin', new Error('fehlt oder hat unerwarteten Typ'));
    return null;
  }
  if (!istFbwsZeit(timeEnd)) {
    logError('normalize.timeEnd', new Error('fehlt oder hat unerwarteten Typ'));
    return null;
  }
  if (!istNichtleererString(courseType)) {
    logError('normalize.courseType', new Error('fehlt oder ist kein String'));
    return null;
  }
  if (!BEKANNTE_COURSE_TYPES.includes(courseType as CourseType)) {
    // Unbekannter, aber vorhandener Wert: protokollieren und dennoch übernehmen
    // (sichtbar statt verworfen, gleicher Grundsatz wie beim Gruppenabgleich).
    logError('normalize.courseType.unbekannt', new Error(`unbekannter Wert: ${courseType}`));
  }

  const courseId = alsOptionalerString(roh.courseId, 'normalize.courseId') ?? '';
  const lecturerName = alsOptionalerString(roh.lecturerName, 'normalize.lecturerName') ?? '';
  const roomId = alsOptionalerString(roh.roomId, 'normalize.roomId') ?? '';
  const note = alsOptionalerString(roh.note, 'normalize.note');
  const examinationReg = alsOptionalerString(roh.examinationReg, 'normalize.examinationReg');
  const grade = roh.grade === undefined || roh.grade === null ? undefined : String(roh.grade);

  const termin: OfficialTermin = {
    courseId,
    name,
    courseType: courseType as CourseType,
    lecturerName,
    studentSet,
    roomId,
    weekday: weekday as Weekday,
    timeBeginMin: zeitZuMinuten(timeBegin),
    timeEndMin: zeitZuMinuten(timeEnd),
    gueltigVon: alsUnixSekundenOderNull(roh.dateBegin, 'normalize.dateBegin'),
    gueltigBis: alsUnixSekundenOderNull(roh.dateEnd, 'normalize.dateEnd'),
  };
  if (note !== undefined) termin.note = note;
  if (examinationReg !== undefined) termin.examinationReg = examinationReg;
  if (grade !== undefined) termin.grade = grade;
  return termin;
}

/** Normalisiert eine Liste von INT-002-Rohsätzen; übersprungene Sätze fehlen im Ergebnis. */
export function normalizeOfficialTermine(rohliste: readonly Record<string, unknown>[]): OfficialTermin[] {
  return rohliste.map(normalizeOfficialTermin).filter((t): t is OfficialTermin => t !== null);
}
