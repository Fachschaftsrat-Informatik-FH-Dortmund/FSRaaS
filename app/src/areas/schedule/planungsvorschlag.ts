// Requirements „Automatischer Planungsvorschlag", „Gemeinsames Umlegen der
// Termine eines Gruppen-Slots", „Anpinnen eines Termins", „Konfliktprüfung
// gegenüber angepinnten Terminen", „Ausgangszustand ohne Optimierung" und
// „Rücknahme einer übernommenen Optimierung" (Change
// `planungsmodus-voreinstellungen-anpinnen`, design.md Entscheidungen 2, 3
// und 5).
//
// Rechnet aus gewählten Modulen und Zwischenstand, welche Termine je
// Veranstaltungsreihe danach gewählt sein sollen. Schreibt nichts: Den
// Zwischenstand passt `PlanungScreen.tsx` an (Entscheidung 4). Greedy, keine
// Kombinatorik — die Zurückstellung der Vollkombinatorik vom 2026-08-25
// bleibt in Kraft.

import { gruppenzugehoerig } from './groupMatch';
import type { Modul } from './kursbaum';
import {
  bewerteEntwurf,
  ueberschneidungen,
  vergleicheBewertung,
  type EntwurfTermin,
  type KriterienParameter,
  type Kriterium,
} from './planungskriterien';
import { terminEntsprichtEintrag, terminSchluessel } from './planungsstand';
import { istAktiv } from './time';
import type { CourseType, OfficialTermin, PlanEntry } from './typen';

/** Termine einer Veranstaltungsart mit gleicher Gruppenmenge und gleichem Namen — eine Option. */
export interface GruppenSlot {
  schluessel: string;
  termine: OfficialTermin[];
}

/** Eine Veranstaltungsreihe: Veranstaltungsart eines gewählten Moduls. */
export interface Reihe {
  modulKey: string;
  modulName: string;
  art: CourseType;
  slots: GruppenSlot[];
}

export type Behandlung =
  /** Angepinnt oder bewusste Mehrfachwahl — unverändert, feste Umgebung. */
  | 'fest'
  /** Nur ein Gruppen-Slot vorhanden — dieser, vollständig. */
  | 'einzig'
  /** Wird neu belegt. */
  | 'neu';

export interface ReihenErgebnis {
  reihe: Reihe;
  behandlung: Behandlung;
  vorher: OfficialTermin[];
  nachher: OfficialTermin[];
  geaendert: boolean;
  /** Namen der Veranstaltungen, mit denen die gewählte Option kollidiert; leer, wenn konfliktfrei. */
  konfliktMit: string[];
}

export interface PlanungsEingabe {
  module: readonly Modul[];
  /** Planeinträge der gewählten Module samt ungesicherter Entscheidungen. */
  zwischenstand: readonly PlanEntry[];
  /** Übrige Einträge des Plans (eigene Termine, andere Module) — feste Umgebung. */
  umgebung: readonly PlanEntry[];
  gruppenkennung: string;
  jetztSek: number;
}

export interface VorschlagsEingabe extends PlanungsEingabe {
  rangfolge: readonly Kriterium[];
  parameter: KriterienParameter;
}

/** ADDED-Requirement „Gemeinsames Umlegen der Termine eines Gruppen-Slots": Gruppenmenge und Name. */
export function gruppenSlotSchluessel(t: Pick<OfficialTermin, 'studentSet' | 'name'>): string {
  return `${t.studentSet}|${t.name}`;
}

/** Bildet die Reihen der gewählten Module, stabil in Eingabereihenfolge. */
export function bildeReihen(module: readonly Modul[]): Reihe[] {
  const reihen: Reihe[] = [];
  for (const modul of module) {
    const jeArt = new Map<CourseType, Map<string, OfficialTermin[]>>();
    for (const termin of modul.termine) {
      let slots = jeArt.get(termin.courseType);
      if (!slots) {
        slots = new Map();
        jeArt.set(termin.courseType, slots);
      }
      const schluessel = gruppenSlotSchluessel(termin);
      const liste = slots.get(schluessel);
      if (liste) liste.push(termin);
      else slots.set(schluessel, [termin]);
    }
    for (const [art, slots] of jeArt) {
      reihen.push({
        modulKey: modul.key,
        modulName: modul.name,
        art,
        slots: [...slots].map(([schluessel, termine]) => ({ schluessel, termine })),
      });
    }
  }
  return reihen;
}

function veranstaltungsbezug(courseId: string, name: string): string {
  return courseId.trim() !== '' ? courseId : name;
}

function ausTermin(t: OfficialTermin): EntwurfTermin {
  return {
    weekday: t.weekday,
    timeBeginMin: t.timeBeginMin,
    timeEndMin: t.timeEndMin,
    art: t.courseType,
    veranstaltung: veranstaltungsbezug(t.courseId, t.name),
    bezeichnung: t.name,
  };
}

function ausEintrag(e: PlanEntry): EntwurfTermin {
  if (e.kind === 'eigen') {
    return {
      weekday: e.weekday,
      timeBeginMin: e.timeBeginMin,
      timeEndMin: e.timeEndMin,
      art: null,
      veranstaltung: null,
      bezeichnung: e.title,
    };
  }
  return {
    weekday: e.weekday,
    timeBeginMin: e.timeBeginMin,
    timeEndMin: e.timeEndMin,
    art: e.courseType,
    veranstaltung: veranstaltungsbezug(e.courseId, e.name),
    bezeichnung: e.name,
  };
}

interface Einordnung {
  reihe: Reihe;
  index: number;
  behandlung: Behandlung;
  vorher: OfficialTermin[];
  /** Bei `fest`: die aktiven Einträge, die als Umgebung zählen. */
  festeEintraege: PlanEntry[];
}

/** design.md, Entscheidung 3: welche Reihen angefasst werden dürfen. */
function ordneEin(eingabe: PlanungsEingabe): Einordnung[] {
  return bildeReihen(eingabe.module).map((reihe, index) => {
    const alleTermine = reihe.slots.flatMap((s) => s.termine);
    const vorher = alleTermine.filter((t) => eingabe.zwischenstand.some((e) => terminEntsprichtEintrag(t, e)));
    const eintraege = eingabe.zwischenstand.filter((e) => alleTermine.some((t) => terminEntsprichtEintrag(t, e)));
    const gewaehlteSlots = new Set(vorher.map(gruppenSlotSchluessel));
    const angepinnt = eintraege.some((e) => e.angepinnt === true);
    const behandlung: Behandlung =
      angepinnt || gewaehlteSlots.size > 1 ? 'fest' : reihe.slots.length === 1 ? 'einzig' : 'neu';
    return {
      reihe,
      index,
      behandlung,
      vorher,
      festeEintraege: eintraege.filter((e) => istAktiv(e, eingabe.jetztSek)),
    };
  });
}

function gleicheTermine(a: readonly OfficialTermin[], b: readonly OfficialTermin[]): boolean {
  const sa = new Set(a.map(terminSchluessel));
  const sb = new Set(b.map(terminSchluessel));
  return sa.size === sb.size && [...sa].every((k) => sb.has(k));
}

function ergebnis(e: Einordnung, nachher: OfficialTermin[], konfliktMit: string[] = []): ReihenErgebnis {
  return {
    reihe: e.reihe,
    behandlung: e.behandlung,
    vorher: e.vorher,
    nachher,
    geaendert: !gleicheTermine(e.vorher, nachher),
    konfliktMit,
  };
}

function istSlotDerEigenenGruppe(slot: GruppenSlot, gruppenkennung: string): boolean {
  return slot.termine.every((t) => gruppenzugehoerig(gruppenkennung, t.studentSet));
}

function istBisherGewaehlt(slot: GruppenSlot, vorher: readonly OfficialTermin[]): boolean {
  return vorher.length > 0 && vorher.every((t) => gruppenSlotSchluessel(t) === slot.schluessel);
}

/**
 * Requirement „Automatischer Planungsvorschlag": geht die neu zu belegenden
 * Reihen in fester Reihenfolge durch — wenigste Gruppen-Slots zuerst, dann
 * Eingabereihenfolge — und wählt je Reihe den nach der Rangfolge besten
 * Gruppen-Slot, der gegen den bis dahin aufgebauten Entwurf konfliktfrei ist.
 * Angepinnte Reihen und bewusste Mehrfachwahlen bleiben stehen und bilden mit
 * den übrigen Planeinträgen die feste Umgebung. Keine Reihe verliert ihre
 * Belegung. Ist keine Option konfliktfrei, gewinnt die mit den wenigsten
 * Überschneidungen; die Kollisionspartner werden benannt.
 */
export function erzeugeVorschlag(eingabe: VorschlagsEingabe): ReihenErgebnis[] {
  const einordnung = ordneEin(eingabe);
  const entwurf: EntwurfTermin[] = eingabe.umgebung.filter((e) => istAktiv(e, eingabe.jetztSek)).map(ausEintrag);
  const gesetzt = new Set<string>();
  const einsetzen = (termine: readonly OfficialTermin[]) => {
    for (const t of termine) {
      // Derselbe Rohtermin kann in zwei Modulen stehen — er zählt einmal.
      const k = terminSchluessel(t);
      if (gesetzt.has(k)) continue;
      gesetzt.add(k);
      entwurf.push(ausTermin(t));
    }
  };

  const ergebnisse = new Map<number, ReihenErgebnis>();
  for (const e of einordnung) {
    if (e.behandlung === 'fest') {
      entwurf.push(...e.festeEintraege.map(ausEintrag));
      ergebnisse.set(e.index, ergebnis(e, e.vorher));
    } else if (e.behandlung === 'einzig') {
      const nachher = e.reihe.slots[0]!.termine;
      einsetzen(nachher);
      ergebnisse.set(e.index, ergebnis(e, nachher));
    }
  }

  const offen = einordnung
    .filter((e) => e.behandlung === 'neu')
    .sort((a, b) => a.reihe.slots.length - b.reihe.slots.length || a.index - b.index);

  for (const e of offen) {
    const bewertet = e.reihe.slots.map((slot, slotIndex) => {
      const option = slot.termine.filter((t) => !gesetzt.has(terminSchluessel(t))).map(ausTermin);
      const kollisionen = ueberschneidungen(option, entwurf);
      return {
        slot,
        slotIndex,
        kollisionen,
        bewertung: bewerteEntwurf([...entwurf, ...option], option, eingabe.rangfolge, eingabe.parameter),
        bisher: istBisherGewaehlt(slot, e.vorher),
        eigeneGruppe: istSlotDerEigenenGruppe(slot, eingabe.gruppenkennung),
      };
    });
    const bester = [...bewertet].sort(
      (a, b) =>
        a.kollisionen.length - b.kollisionen.length ||
        vergleicheBewertung(a.bewertung, b.bewertung) ||
        Number(b.bisher) - Number(a.bisher) ||
        Number(b.eigeneGruppe) - Number(a.eigeneGruppe) ||
        a.slotIndex - b.slotIndex,
    )[0]!;
    einsetzen(bester.slot.termine);
    const konfliktMit = [...new Set(bester.kollisionen.map((k) => k.bezeichnung))];
    ergebnisse.set(e.index, ergebnis(e, bester.slot.termine, konfliktMit));
  }

  return einordnung.map((e) => ergebnisse.get(e.index)!);
}

/**
 * Requirements „Ausgangszustand ohne Optimierung" und „Rücknahme einer
 * übernommenen Optimierung" (design.md, Entscheidung 5): je Reihe, die der
 * Vorschlag anfassen dürfte, der Gruppen-Slot der eigenen Gruppe — bei
 * mehreren der bisher gewählte, sonst der erste; ohne passenden Slot bleibt
 * die Reihe, wie sie ist. Angepinnte Termine, Mehrfachwahlen und eigene
 * Termine bleiben unberührt.
 */
export function einteilungNachGruppe(eingabe: PlanungsEingabe): ReihenErgebnis[] {
  return ordneEin(eingabe).map((e) => {
    if (e.behandlung === 'fest') return ergebnis(e, e.vorher);
    const eigene = e.reihe.slots.filter((slot) => istSlotDerEigenenGruppe(slot, eingabe.gruppenkennung));
    const kandidaten = e.behandlung === 'einzig' ? e.reihe.slots : eigene;
    if (kandidaten.length === 0) return ergebnis(e, e.vorher);
    const gewaehlt = kandidaten.find((slot) => istBisherGewaehlt(slot, e.vorher)) ?? kandidaten[0]!;
    return ergebnis(e, gewaehlt.termine);
  });
}
