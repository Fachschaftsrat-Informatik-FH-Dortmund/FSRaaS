// Requirements „Kriterienrangfolge für die Planung", „Reihung nach der
// Kriterienrangfolge" und „Vorbereitungszeit je Veranstaltungsart"
// (`openspec/specs/schedule/spec.md`; Change
// `planungsmodus-voreinstellungen-anpinnen`, design.md Entscheidung 1).
//
// Bewertet einen Planentwurf — alle aktiven Termine nach Einsetzen einer
// Option — je Kriterium mit einer Zahl, kleiner ist besser. Zwei Entwürfe
// werden streng der Reihe nach verglichen: Das oberste Kriterium entscheidet,
// erst bei Gleichstand zählt das nächste, ohne Toleranz. Reine Funktionen ohne
// React, wie `konflikt.ts` und `planungsstand.ts`.

import { ueberschneidenSich } from './time';
import type { CourseType, Weekday } from './typen';

export type Kriterium =
  | 'uniTage'
  | 'anwesenheitszeit'
  | 'gleichmaessigeWoche'
  | 'abstandLerneinheiten'
  | 'vorbereitungszeit'
  | 'abstandVorlesungUebung'
  | 'abwechslung'
  | 'zeitfenster';

export const KRITERIEN: readonly Kriterium[] = [
  'uniTage',
  'anwesenheitszeit',
  'gleichmaessigeWoche',
  'abstandLerneinheiten',
  'vorbereitungszeit',
  'abstandVorlesungUebung',
  'abwechslung',
  'zeitfenster',
];

export type Voreinstellung =
  | 'zeitAnDerUni'
  | 'fahrtenZurUni'
  | 'ausgeglicheneWoche'
  | 'abstandLerneinheiten'
  | 'vorbereitungszeit';

/**
 * Requirement „Kriterienrangfolge für die Planung": die fünf benannten
 * Voreinstellungen mit fester Reihenfolge. Eine Voreinstellung schaltet genau
 * ihre Kriterien ein; alle übrigen sind abgeschaltet und fehlen deshalb in
 * der Liste.
 */
export const VOREINSTELLUNGEN: Readonly<Record<Voreinstellung, readonly Kriterium[]>> = {
  zeitAnDerUni: ['anwesenheitszeit'],
  fahrtenZurUni: ['uniTage', 'anwesenheitszeit'],
  ausgeglicheneWoche: ['gleichmaessigeWoche'],
  abstandLerneinheiten: ['abstandLerneinheiten'],
  vorbereitungszeit: ['vorbereitungszeit', 'abstandVorlesungUebung'],
};

export const VOREINSTELLUNGS_REIHENFOLGE: readonly Voreinstellung[] = [
  'zeitAnDerUni',
  'fahrtenZurUni',
  'ausgeglicheneWoche',
  'abstandLerneinheiten',
  'vorbereitungszeit',
];

/** Ein Termin des Planentwurfs. `art: null` steht für einen selbst angelegten Termin. */
export interface EntwurfTermin {
  weekday: Weekday;
  timeBeginMin: number;
  timeEndMin: number;
  art: CourseType | null;
  /** Veranstaltungsbezug (`courseId`, ersatzweise Name) für „Abstand Vorlesung–Übung"; `null` bei eigenen Terminen. */
  veranstaltung: string | null;
  /** Anzeigename, für die Nennung der Beteiligten bei einem Konflikt. */
  bezeichnung: string;
}

export interface KriterienParameter {
  /** Allgemeiner Zielwert der Vorbereitungszeit in Minuten. */
  vorbereitungAllgemeinMin: number;
  /** Abweichende Zielwerte je Veranstaltungsart; fehlt eine Art, gilt der allgemeine Wert. */
  vorbereitungJeArt: Readonly<Partial<Record<string, number>>>;
  /** Angestrebter Mindestabstand nach der Vorlesung in Minuten. */
  abstandVorlesungUebungMin: number;
  /** Bevorzugtes Zeitfenster; `null`, solange keines festgelegt ist. */
  zeitfenster: { vonMin: number; bisMin: number } | null;
}

const WOCHE_MIN = 7 * 24 * 60;
const TAG_MIN = 24 * 60;
const TAGESINDEX: Readonly<Record<Weekday, number>> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

/**
 * Requirement „Vorbereitungszeit je Veranstaltungsart": der abweichende Wert
 * der Art, sonst der allgemeine — auch für eine unbekannte Art und für eigene
 * Termine (`art: null`, design.md Entscheidung 1).
 */
export function zielVorbereitung(art: CourseType | string | null, parameter: KriterienParameter): number {
  if (art === null) return parameter.vorbereitungAllgemeinMin;
  return parameter.vorbereitungJeArt[art] ?? parameter.vorbereitungAllgemeinMin;
}

function nachTagen(entwurf: readonly EntwurfTermin[]): Map<Weekday, EntwurfTermin[]> {
  const tage = new Map<Weekday, EntwurfTermin[]>();
  for (const t of entwurf) {
    const liste = tage.get(t.weekday);
    if (liste) liste.push(t);
    else tage.set(t.weekday, [t]);
  }
  for (const liste of tage.values()) liste.sort((a, b) => a.timeBeginMin - b.timeBeginMin || a.timeEndMin - b.timeEndMin);
  return tage;
}

function tagesspanne(termine: readonly EntwurfTermin[]): number {
  const beginn = Math.min(...termine.map((t) => t.timeBeginMin));
  const ende = Math.max(...termine.map((t) => t.timeEndMin));
  return ende - beginn;
}

/** Nachbarabstand: die kleinste Pause zu einem anderen Termin desselben Tages; überlappend negativ, ohne anderen Termin ein ganzer Tag. */
function nachbarabstand(termin: EntwurfTermin, entwurf: readonly EntwurfTermin[]): number {
  let kleinster = TAG_MIN;
  for (const anderer of entwurf) {
    if (anderer === termin || anderer.weekday !== termin.weekday) continue;
    const pause = Math.max(termin.timeBeginMin - anderer.timeEndMin, anderer.timeBeginMin - termin.timeEndMin);
    kleinster = Math.min(kleinster, pause);
  }
  return kleinster;
}

function vorbereitungsFehlbetrag(tage: Map<Weekday, EntwurfTermin[]>, parameter: KriterienParameter): number {
  let summe = 0;
  for (const termine of tage.values()) {
    let spaetestesEnde = -Infinity;
    for (const [index, termin] of termine.entries()) {
      // Der erste Termin eines Tages gilt als erfüllt (Erläuterung „Zwei Randfestlegungen").
      if (index > 0) {
        const freieZeit = termin.timeBeginMin - spaetestesEnde;
        summe += Math.max(0, zielVorbereitung(termin.art, parameter) - freieZeit);
      }
      spaetestesEnde = Math.max(spaetestesEnde, termin.timeEndMin);
    }
  }
  return summe;
}

function wochenzeit(weekday: Weekday, minuten: number): number {
  return TAGESINDEX[weekday] * TAG_MIN + minuten;
}

/**
 * „Abstand Vorlesung–Übung": je Termin anderer Art einer Veranstaltung mit
 * Vorlesung im Entwurf der Fehlbetrag zum Mindestabstand nach der letzten
 * vorangehenden Vorlesung. Liegt keine Vorlesung davor, zählt eine ganze
 * Woche — schlechter als jeder Fehlbetrag nach der Vorlesung (Szenario
 * „Übung vor der zugehörigen Vorlesung").
 */
function vorlesungsabstandFehlbetrag(entwurf: readonly EntwurfTermin[], parameter: KriterienParameter): number {
  let summe = 0;
  for (const termin of entwurf) {
    if (termin.veranstaltung === null || termin.art === null || termin.art === 'V') continue;
    const vorlesungen = entwurf.filter((v) => v.art === 'V' && v.veranstaltung === termin.veranstaltung);
    if (vorlesungen.length === 0) continue;
    const beginn = wochenzeit(termin.weekday, termin.timeBeginMin);
    const vorangehendeEnden = vorlesungen
      .map((v) => wochenzeit(v.weekday, v.timeEndMin))
      .filter((ende) => ende <= beginn);
    if (vorangehendeEnden.length === 0) {
      summe += WOCHE_MIN;
      continue;
    }
    const abstand = beginn - Math.max(...vorangehendeEnden);
    summe += Math.max(0, parameter.abstandVorlesungUebungMin - abstand);
  }
  return summe;
}

function abwechslungsverstoesse(tage: Map<Weekday, EntwurfTermin[]>): number {
  let anzahl = 0;
  for (const termine of tage.values()) {
    for (let i = 1; i < termine.length; i++) {
      const art = termine[i]!.art;
      if (art !== null && art === termine[i - 1]!.art) anzahl++;
    }
  }
  return anzahl;
}

/**
 * Requirement „Reihung nach der Kriterienrangfolge": Bewertung eines
 * Planentwurfs je eingeschaltetem Kriterium, in der Reihenfolge der
 * Rangfolge. `eingesetzt` sind die Termine der gerade bewerteten Option —
 * für die Kriterien, die die Spec am einzelnen Termin misst
 * (Nachbarabstand, Zeitfenster).
 */
export function bewerteEntwurf(
  entwurf: readonly EntwurfTermin[],
  eingesetzt: readonly EntwurfTermin[],
  rangfolge: readonly Kriterium[],
  parameter: KriterienParameter,
): number[] {
  const tage = nachTagen(entwurf);
  const spannen = [...tage.values()].map(tagesspanne);
  return rangfolge.map((kriterium) => {
    switch (kriterium) {
      case 'uniTage':
        return tage.size;
      case 'anwesenheitszeit':
        return spannen.reduce((a, b) => a + b, 0);
      case 'gleichmaessigeWoche':
        return spannen.length < 2 ? 0 : Math.max(...spannen) - Math.min(...spannen);
      case 'abstandLerneinheiten':
        // Größer ist besser — negiert, damit „kleiner ist besser" durchgängig gilt.
        return eingesetzt.length === 0 ? -TAG_MIN : -Math.min(...eingesetzt.map((t) => nachbarabstand(t, entwurf)));
      case 'vorbereitungszeit':
        return vorbereitungsFehlbetrag(tage, parameter);
      case 'abstandVorlesungUebung':
        return vorlesungsabstandFehlbetrag(entwurf, parameter);
      case 'abwechslung':
        return abwechslungsverstoesse(tage);
      case 'zeitfenster': {
        const fenster = parameter.zeitfenster;
        if (fenster === null) return 0;
        return eingesetzt.filter((t) => t.timeBeginMin < fenster.vonMin || t.timeEndMin > fenster.bisMin).length;
      }
    }
  });
}

/** Streng lexikographischer Vergleich zweier Bewertungen, ohne Toleranz: negativ, wenn `a` besser ist. */
export function vergleicheBewertung(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i]! - b[i]!;
  }
  return 0;
}

/** Die Termine des Entwurfs, mit denen sich einer der Termine der Option überschneidet. */
export function ueberschneidungen(option: readonly EntwurfTermin[], entwurf: readonly EntwurfTermin[]): EntwurfTermin[] {
  return entwurf.filter((e) =>
    option.some(
      (o) => o.weekday === e.weekday && ueberschneidenSich(o.timeBeginMin, o.timeEndMin, e.timeBeginMin, e.timeEndMin),
    ),
  );
}
