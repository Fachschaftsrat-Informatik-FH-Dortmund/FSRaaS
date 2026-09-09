// Gemeinsame Typen des Stundenplans (`openspec/specs/schedule/spec.md` Abschnitt 5).
// Reine Typdeklarationen, keine Logik.

/** Wochentag als englisches Dreibuchstaben-Kürzel. Schließt das Wochenende ein,
 * weil eigene Termine (SCHED-F-110) an jedem Wochentag angelegt werden dürfen —
 * INT-002 selbst liefert im geprüften Bestand nur Mon..Fri (integrations.md). */
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

/** Veranstaltungsart, beobachtete INT-002-Werte (integrations.md, Feld `courseType`).
 * `PR` (Blockwochen) und `S` (Seminare) ergänzt über die Live-Abfrage vom
 * 2026-09-08 — keine abgeschlossene Werteliste, `normalize.ts` übernimmt auch
 * unbekannte Werte, protokolliert sie aber. */
export type CourseType = 'V' | 'Ü' | 'ÜPP' | 'P' | 'SV' | 'T' | 'PR' | 'S';

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
  /** null = aktiv; 'dauerhaft' = bis zur Rücknahme; Zahl = Unix-Sekunden, bis wann
   * (Requirement „Deaktivieren eines Termins", design.md Entscheidung 1). Ausgewertet
   * über `istAktiv` (`time.ts`), nicht an dieser Stelle. */
  deaktiviertBis: null | 'dauerhaft' | number;
  color: string;
  weekday: Weekday;
  timeBeginMin: number;
  timeEndMin: number;
  /** Ergebnis von SCHED-F-060 bis SCHED-F-090 (`groupMatch.ts`). */
  gruppenzugehoerig: boolean;
  /** SCHED-F-260: Termin einer anderen Gruppe übernommen statt des eigenen. */
  abweichendeGruppe: boolean;
  /** Kennungen der Termine, mit denen eine Kollision bewusst angenommen wurde
   * (Requirement „Bewusste Übernahme trotz Konflikt", vormals SCHED-F-310).
   * Die Annahme trägt das Terminpaar, nicht der einzelne Eintrag: Ein Paar gilt
   * nur als angenommen, wenn **beide** Termine einander nennen. Ein einzelnes
   * Flag am Eintrag ließe eine nie angenommene Kollision stumm bleiben, sobald
   * der angenommene Gegenpart durch einen anderen Termin ersetzt wird
   * (design.md, Entscheidung 2). */
  akzeptierteKonflikte: string[];
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

/** Ein einzelner Termin innerhalb eines belegten Abschnitts (`dayLayout.ts`). */
export interface TerminSlot {
  art: 'termin';
  entry: PlanEntry;
  spalte: number;
  spalten: number;
}

/**
 * Requirement „Stapelung bei mehr als drei überschneidenden Terminen": die
 * Termine, die über die drei sichtbaren Spalten hinausgehen, gemeinsam in
 * einer Spalte.
 */
export interface StapelSlot {
  art: 'stapel';
  entries: PlanEntry[];
  spalte: number;
  spalten: number;
  vonMin: number;
  bisMin: number;
}

export type BelegtSlot = TerminSlot | StapelSlot;

/**
 * Ergebnis von `dayLayout.ts` (Requirements „Proportionale Zeitachse",
 * „Nebeneinanderdarstellung überschneidender Termine", „Stapelung bei mehr
 * als drei überschneidenden Terminen"): eine Folge von Abschnitten mit je
 * eigener Höhe (`hoeheMin`), keine lineare Formel mehr (design.md,
 * Entscheidung 1). Die Umrechnung auf Pixel bleibt Sache der
 * Darstellungsschicht. `stundenlinien` nennt die absoluten Minutenmarken
 * voller Stunden, die innerhalb des Abschnitts maßstabsgetreu liegen — bei
 * einer gestauchten Lücke immer leer (Requirement „Stundenlinien auf der
 * Zeitachse").
 */
export type DaySlot =
  | { art: 'belegt'; vonMin: number; bisMin: number; hoeheMin: number; slots: BelegtSlot[]; stundenlinien: number[] }
  | {
      art: 'luecke';
      vonMin: number;
      bisMin: number;
      hoeheMin: number;
      echteDauerMin: number;
      gestaucht: boolean;
      kurz: boolean;
      stundenlinien: number[];
    };
