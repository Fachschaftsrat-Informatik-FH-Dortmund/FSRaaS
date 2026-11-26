import type { Modul } from './kursbaum';
import { VOREINSTELLUNGEN, type KriterienParameter } from './planungskriterien';
import { terminSchluessel } from './planungsstand';
import {
  bildeReihen,
  einteilungNachGruppe,
  erzeugeVorschlag,
  type PlanungsEingabe,
  type VorschlagsEingabe,
} from './planungsvorschlag';
import type { CustomPlanEntry, OfficialPlanEntry, OfficialTermin, PlanEntry } from './typen';

const PARAMETER: KriterienParameter = {
  vorbereitungAllgemeinMin: 30,
  vorbereitungJeArt: {},
  abstandVorlesungUebungMin: 0,
  zeitfenster: null,
};

function termin(ü: Partial<OfficialTermin>): OfficialTermin {
  return {
    courseId: 'M1',
    name: 'Mathe',
    courseType: 'V',
    lecturerName: 'Prof. Test',
    studentSet: '*',
    roomId: 'R1',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gueltigVon: null,
    gueltigBis: null,
    ...ü,
  };
}

function modul(key: string, termine: OfficialTermin[]): Modul {
  return { key, courseId: termine[0]!.courseId, name: termine[0]!.name, termine };
}

let idZaehler = 0;
function eintrag(t: OfficialTermin, ü: Partial<OfficialPlanEntry> = {}): OfficialPlanEntry {
  idZaehler += 1;
  return {
    kind: 'offiziell',
    id: `e${idZaehler}`,
    deaktiviertBis: null,
    color: '#123456',
    weekday: t.weekday,
    timeBeginMin: t.timeBeginMin,
    timeEndMin: t.timeEndMin,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    gueltigVon: null,
    gueltigBis: null,
    courseId: t.courseId,
    name: t.name,
    courseType: t.courseType,
    lecturerName: t.lecturerName,
    studentSet: t.studentSet,
    roomId: t.roomId,
    ...ü,
  };
}

function eigener(weekday: OfficialTermin['weekday'], von: number, bis: number): CustomPlanEntry {
  return {
    kind: 'eigen',
    id: 'eigen1',
    title: 'Nebenjob',
    wiederkehrend: true,
    deaktiviertBis: null,
    color: '#000000',
    weekday,
    timeBeginMin: von,
    timeEndMin: bis,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    gueltigVon: null,
    gueltigBis: null,
  };
}

function eingabe(
  module: Modul[],
  zwischenstand: PlanEntry[] = [],
  ü: Partial<VorschlagsEingabe> = {},
): VorschlagsEingabe {
  return {
    module,
    zwischenstand,
    umgebung: [],
    gruppenkennung: 'A1',
    jetztSek: 0,
    rangfolge: VOREINSTELLUNGEN.fahrtenZurUni,
    parameter: PARAMETER,
    ...ü,
  };
}

const schluessel = (ts: readonly OfficialTermin[]) => ts.map(terminSchluessel).sort();

// Mathe: Vorlesung Montag (für alle), Übung in zwei Gruppen Montag/Mittwoch.
const matheV = termin({ courseType: 'V', weekday: 'Mon', timeBeginMin: 480, timeEndMin: 570 });
const matheUeMo = termin({ courseType: 'Ü', studentSet: 'B', weekday: 'Mon', timeBeginMin: 600, timeEndMin: 690 });
const matheUeMi = termin({ courseType: 'Ü', studentSet: 'A', weekday: 'Wed', timeBeginMin: 600, timeEndMin: 690 });
const mathe = modul('M1|2', [matheV, matheUeMo, matheUeMi]);

describe('Automatischer Planungsvorschlag', () => {
  it('wählt je Veranstaltungsart den nach der Rangfolge besten Gruppen-Slot', () => {
    const ergebnis = erzeugeVorschlag(eingabe([mathe]));
    const uebung = ergebnis.find((r) => r.reihe.art === 'Ü')!;
    // Montag hält die Zahl der Uni-Tage bei eins, obwohl Mittwoch die eigene Gruppe wäre.
    expect(schluessel(uebung.nachher)).toEqual(schluessel([matheUeMo]));
    expect(uebung.konfliktMit).toEqual([]);
  });

  it('legt einen nicht angepinnten Termin auf einen besseren Gruppen-Slot um und weist die Änderung aus', () => {
    const ergebnis = erzeugeVorschlag(eingabe([mathe], [eintrag(matheV), eintrag(matheUeMi)]));
    const uebung = ergebnis.find((r) => r.reihe.art === 'Ü')!;
    expect(uebung.behandlung).toBe('neu');
    expect(schluessel(uebung.vorher)).toEqual(schluessel([matheUeMi]));
    expect(schluessel(uebung.nachher)).toEqual(schluessel([matheUeMo]));
    expect(uebung.geaendert).toBe(true);
  });

  it('entfernt keine Veranstaltung: jede Reihe behält eine Belegung', () => {
    const ergebnis = erzeugeVorschlag(eingabe([mathe]));
    expect(ergebnis.every((r) => r.nachher.length > 0)).toBe(true);
  });

  it('ändert bei Gleichstand aller Kriterien nichts an der bisherigen Wahl', () => {
    const gleichwertig = modul('M2|2', [
      termin({ courseId: 'M2', name: 'Info', courseType: 'P', studentSet: 'A', weekday: 'Tue', timeBeginMin: 480, timeEndMin: 570 }),
      termin({ courseId: 'M2', name: 'Info', courseType: 'P', studentSet: 'B', weekday: 'Thu', timeBeginMin: 480, timeEndMin: 570 }),
    ]);
    const gewaehlt = gleichwertig.termine[1]!;
    const ergebnis = erzeugeVorschlag(eingabe([gleichwertig], [eintrag(gewaehlt)]));
    expect(ergebnis[0]!.geaendert).toBe(false);
  });

  it('zeigt ohne konfliktfreie Konstellation die beste gefundene und benennt die beteiligten Veranstaltungen', () => {
    const job = eigener('Mon', 590, 700);
    const nurMontag = modul('M3|2', [
      termin({ courseId: 'M3', name: 'Physik', courseType: 'Ü', studentSet: 'A', weekday: 'Mon', timeBeginMin: 600, timeEndMin: 690 }),
      termin({ courseId: 'M3', name: 'Physik', courseType: 'Ü', studentSet: 'B', weekday: 'Mon', timeBeginMin: 610, timeEndMin: 700 }),
    ]);
    const ergebnis = erzeugeVorschlag(eingabe([nurMontag], [], { umgebung: [job] }));
    expect(ergebnis[0]!.nachher).toHaveLength(1);
    expect(ergebnis[0]!.konfliktMit).toEqual(['Nebenjob']);
  });

  it('meidet Termine, die mit eigenen Terminen kollidieren', () => {
    const job = eigener('Mon', 590, 700);
    const ergebnis = erzeugeVorschlag(eingabe([mathe], [], { umgebung: [job] }));
    const uebung = ergebnis.find((r) => r.reihe.art === 'Ü')!;
    expect(schluessel(uebung.nachher)).toEqual(schluessel([matheUeMi]));
  });
});

describe('Anpinnen eines Termins', () => {
  it('ein angepinnter Termin bleibt bei einer Optimierung an seinem Zeitslot', () => {
    const ergebnis = erzeugeVorschlag(eingabe([mathe], [eintrag(matheUeMi, { angepinnt: true })]));
    const uebung = ergebnis.find((r) => r.reihe.art === 'Ü')!;
    expect(uebung.behandlung).toBe('fest');
    expect(uebung.geaendert).toBe(false);
    expect(schluessel(uebung.nachher)).toEqual(schluessel([matheUeMi]));
  });

  it('nach Zurücknehmen des Anpinnens darf eine Optimierung den Termin wieder umlegen', () => {
    const ergebnis = erzeugeVorschlag(eingabe([mathe], [eintrag(matheUeMi, { angepinnt: false })]));
    const uebung = ergebnis.find((r) => r.reihe.art === 'Ü')!;
    expect(uebung.geaendert).toBe(true);
  });
});

describe('Konfliktprüfung gegenüber angepinnten Terminen', () => {
  it('prüft gegen angepinnte Termine, nicht gegen andere noch unentschiedene Kandidaten', () => {
    // Info-Praktikum angepinnt am Montag 10:00 — die Mathe-Übung am Montag kollidiert damit.
    const infoP = termin({ courseId: 'M2', name: 'Info', courseType: 'P', weekday: 'Mon', timeBeginMin: 600, timeEndMin: 690 });
    const info = modul('M2|2', [
      infoP,
      termin({ courseId: 'M2', name: 'Info', courseType: 'P', studentSet: 'X', weekday: 'Fri', timeBeginMin: 600, timeEndMin: 690 }),
    ]);
    const ergebnis = erzeugeVorschlag(eingabe([mathe, info], [eintrag(infoP, { angepinnt: true })]));
    const uebung = ergebnis.find((r) => r.reihe.modulKey === 'M1|2' && r.reihe.art === 'Ü')!;
    expect(schluessel(uebung.nachher)).toEqual(schluessel([matheUeMi]));
    expect(uebung.konfliktMit).toEqual([]);
  });

  it('ein deaktivierter angepinnter Termin zählt nicht als Bezugsgröße', () => {
    const ergebnis = erzeugeVorschlag(
      eingabe([mathe], [eintrag(matheV, { angepinnt: true, deaktiviertBis: 'dauerhaft' })]),
    );
    const uebung = ergebnis.find((r) => r.reihe.art === 'Ü')!;
    expect(uebung.konfliktMit).toEqual([]);
  });
});

describe('Gemeinsames Umlegen der Termine eines Gruppen-Slots', () => {
  const vMo = termin({ courseType: 'V', weekday: 'Mon' });
  const vDo = termin({ courseType: 'V', weekday: 'Thu' });

  it('zwei Vorlesungstermine derselben Gruppenmenge und desselben Namens bilden einen Gruppen-Slot und bleiben beide im Vorschlag', () => {
    const m = modul('M1|2', [vMo, vDo]);
    expect(bildeReihen([m])[0]!.slots).toHaveLength(1);
    const ergebnis = erzeugeVorschlag(eingabe([m]));
    expect(schluessel(ergebnis[0]!.nachher)).toEqual(schluessel([vMo, vDo]));
  });

  it('Parallelgruppen unterschiedlichen Namens sind zwei Gruppen-Slots, von denen einer gewählt wird', () => {
    const m = modul('TE|2', [
      termin({ courseId: 'TE', name: 'Technisches Englisch 1', courseType: 'Ü', roomId: 'R1' }),
      termin({ courseId: 'TE', name: 'Technisches Englisch 10', courseType: 'Ü', roomId: 'R2' }),
    ]);
    expect(bildeReihen([m])[0]!.slots).toHaveLength(2);
    expect(erzeugeVorschlag(eingabe([m]))[0]!.nachher).toHaveLength(1);
  });

  it('eine bewusste Mehrfachwahl über zwei Gruppen-Slots bleibt unverändert', () => {
    const ergebnis = erzeugeVorschlag(eingabe([mathe], [eintrag(matheUeMo), eintrag(matheUeMi)]));
    const uebung = ergebnis.find((r) => r.reihe.art === 'Ü')!;
    expect(uebung.behandlung).toBe('fest');
    expect(schluessel(uebung.nachher)).toEqual(schluessel([matheUeMo, matheUeMi]));
  });
});

describe('Rücknahme einer übernommenen Optimierung', () => {
  it('stellt die Termine der eigenen Gruppe wieder her und lässt angepinnte unverändert', () => {
    const infoA = termin({ courseId: 'M2', name: 'Info', courseType: 'P', studentSet: 'A', weekday: 'Tue' });
    const infoB = termin({ courseId: 'M2', name: 'Info', courseType: 'P', studentSet: 'B', weekday: 'Fri' });
    const info = modul('M2|2', [infoA, infoB]);
    const e: PlanungsEingabe = {
      module: [mathe, info],
      zwischenstand: [eintrag(matheV), eintrag(matheUeMo), eintrag(infoB, { angepinnt: true })],
      umgebung: [],
      gruppenkennung: 'A1',
      jetztSek: 0,
    };
    const ergebnis = einteilungNachGruppe(e);
    const uebung = ergebnis.find((r) => r.reihe.modulKey === 'M1|2' && r.reihe.art === 'Ü')!;
    const praktikum = ergebnis.find((r) => r.reihe.modulKey === 'M2|2')!;
    expect(schluessel(uebung.nachher)).toEqual(schluessel([matheUeMi]));
    expect(praktikum.geaendert).toBe(false);
    expect(schluessel(praktikum.nachher)).toEqual(schluessel([infoB]));
  });

  it('lässt eine Reihe ohne Slot der eigenen Gruppe, wie sie ist', () => {
    const fremd = modul('M4|2', [
      termin({ courseId: 'M4', name: 'Chemie', courseType: 'Ü', studentSet: 'C', weekday: 'Tue' }),
      termin({ courseId: 'M4', name: 'Chemie', courseType: 'Ü', studentSet: 'D', weekday: 'Wed' }),
    ]);
    const gewaehlt = fremd.termine[1]!;
    const ergebnis = einteilungNachGruppe({
      module: [fremd],
      zwischenstand: [eintrag(gewaehlt)],
      umgebung: [],
      gruppenkennung: 'A1',
      jetztSek: 0,
    });
    expect(ergebnis[0]!.geaendert).toBe(false);
  });
});

describe('Ausgangszustand ohne Optimierung', () => {
  it('ordnet die Termine allein nach der Gruppenkennung zu', () => {
    const ergebnis = einteilungNachGruppe({ module: [mathe], zwischenstand: [], umgebung: [], gruppenkennung: 'B2', jetztSek: 0 });
    const uebung = ergebnis.find((r) => r.reihe.art === 'Ü')!;
    expect(schluessel(uebung.nachher)).toEqual(schluessel([matheUeMo]));
  });
});
