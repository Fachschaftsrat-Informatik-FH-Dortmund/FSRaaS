// Gemeinsame Typen des Stundenplans (`openspec/specs/schedule/spec.md` Abschnitt 5).
// Reine Typdeklarationen, keine Logik.

/** Wochentag als englisches Dreibuchstaben-Kürzel. Schließt das Wochenende ein,
 * weil eigene Termine (SCHED-F-110) an jedem Wochentag angelegt werden dürfen —
 * INT-002 selbst liefert im geprüften Bestand nur Mon..Fri (integrations.md). */
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

/** Veranstaltungsart, beobachtete INT-002-Werte (integrations.md, Feld `courseType`). */
export type CourseType = 'V' | 'Ü' | 'ÜPP' | 'P' | 'SV' | 'T';

/** SCHED-F-570: „fest" wird auf Konflikte geprüft, „vorgemerkt" nicht (SCHED-F-590). */
export type PlanEntryStatus = 'fest' | 'vorgemerkt';

/** Ein aus INT-002 abgerufener, normalisierter Rohtermin (SCHED-F-030), noch ohne
 * die persönlichen Ergänzungen (Status, Farbe, Gruppenzugehörigkeit) aus Abschnitt 5. */
export interface OfficialTermin {
  courseId: string;
  name: string;
  courseType: CourseType;
  lecturerName: string;
  studentSet: string;
  roomId: string;
  weekday: Weekday;
  timeBeginMin: number;
  timeEndMin: number;
  /** Beginn des Gültigkeitszeitraums (Unix-Sekunden), `null` wenn unbekannt (SCHED-F-500). */
  gueltigVon: number | null;
  /** Ende des Gültigkeitszeitraums (Unix-Sekunden), `null` wenn unbekannt (SCHED-F-500). */
  gueltigBis: number | null;
  note?: string;
  examinationReg?: string;
  grade?: string;
}

interface PlanEntryBase {
  id: string;
  status: PlanEntryStatus;
  color: string;
  weekday: Weekday;
  timeBeginMin: number;
  timeEndMin: number;
  /** Ergebnis von SCHED-F-060 bis SCHED-F-090 (`groupMatch.ts`). */
  gruppenzugehoerig: boolean;
  /** SCHED-F-260: Termin einer anderen Gruppe übernommen statt des eigenen. */
  abweichendeGruppe: boolean;
  /** SCHED-F-310: Kollision bewusst in Kauf genommen. */
  akzeptierterKonflikt: boolean;
  istPruefung: boolean;
  gueltigVon: number | null;
  gueltigBis: number | null;
}

export interface OfficialPlanEntry extends PlanEntryBase {
  kind: 'offiziell';
  courseId: string;
  name: string;
  courseType: CourseType;
  lecturerName: string;
  studentSet: string;
  roomId: string;
}

export interface CustomPlanEntry extends PlanEntryBase {
  kind: 'eigen';
  title: string;
  roomId?: string;
  lecturerName?: string;
  /** SCHED-F-730: wöchentlich wiederkehrend oder einmalig an einem Datum (dann
   * fallen `gueltigVon` und `gueltigBis` auf dasselbe Datum). */
  wiederkehrend: boolean;
}

export type PlanEntry = OfficialPlanEntry | CustomPlanEntry;

/** Ergebnis von `dayLayout.ts` (SCHED-F-520/540): reine Datenstruktur ohne Pixelwerte. */
export type DaySlot =
  | { art: 'termin'; entry: PlanEntry; spalte: number; spalten: number }
  | { art: 'luecke'; vonMin: number; bisMin: number };
