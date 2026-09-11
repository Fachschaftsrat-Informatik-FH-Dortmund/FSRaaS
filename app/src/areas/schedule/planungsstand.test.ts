import { pruefeKandidatGegenZwischenstand } from './konflikt';
import { ermittlePlanungsstand, terminEntsprichtEintrag, vorbelegteSlots } from './planungsstand';
import type { Modul } from './kursbaum';
import type { OfficialPlanEntry, OfficialTermin } from './typen';

const JETZT_SEK = 0;

function rohtermin(überschreibung: Partial<OfficialTermin> & { courseType: OfficialTermin['courseType'] }): OfficialTermin {
  return {
    courseId: 'INF123',
    name: 'Testmodul',
    lecturerName: 'Prof. Test',
    studentSet: '*',
    roomId: 'R1',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gueltigVon: null,
    gueltigBis: null,
    ...überschreibung,
  };
}

function modul(name: string, termine: OfficialTermin[]): Modul {
  return { key: `INF123|${name}`, courseId: 'INF123', name, termine };
}

function planeintragFuer(t: OfficialTermin): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    id: `plan-${t.courseType}-${t.timeBeginMin}`,
    deaktiviertBis: null,
    color: '#1E88E5',
    weekday: t.weekday,
    timeBeginMin: t.timeBeginMin,
    timeEndMin: t.timeEndMin,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    courseId: t.courseId,
    name: t.name,
    courseType: t.courseType,
    lecturerName: t.lecturerName,
    studentSet: t.studentSet,
    roomId: t.roomId,
  };
}

describe('Vorbelegung eindeutiger Veranstaltungen', () => {
  it('eine Veranstaltungsart mit genau einem Slot wird vorbelegt', () => {
    const einzigerSlot = rohtermin({ courseType: 'V' });
    const m = modul('Mathe 3', [einzigerSlot]);

    const vorbelegt = vorbelegteSlots([m]);

    expect(vorbelegt).toEqual([einzigerSlot]);
  });

  it('eine Veranstaltungsart mit mehreren Slots wird nicht vorbelegt, auch wenn die Gruppenkennung genau einen einschließt', () => {
    const slots = [
      rohtermin({ courseType: 'ÜPP', studentSet: 'A-B', timeBeginMin: 480, timeEndMin: 570 }),
      rohtermin({ courseType: 'ÜPP', studentSet: 'C5-E', timeBeginMin: 600, timeEndMin: 690 }),
    ];
    const m = modul('Algorithmen und Datenstrukturen', slots);

    expect(vorbelegteSlots([m])).toHaveLength(0);
  });

  // design.md, „Goals / Non-Goals — Größenordnung": Live-Abfrage von INT-002 am
  // 2026-09-08 für `INPBPI`, `grade=*`, Gruppenkennung `C8` — sechs Module, 13
  // Kombinationen aus Modul und Veranstaltungsart. Slotzahlen unten sind
  // gegenüber der Live-Messung vereinfacht (exakte Einzelwerte sind ohne
  // Netzzugriff nicht nachstellbar), das Verhältnis aus design.md bleibt
  // erhalten: 7 Veranstaltungsarten mit genau einem Slot (vorbelegt), 4 mit
  // mehreren Slots, bei denen die Gruppenkennung dennoch genau einen
  // einschließt (bewusst NICHT vorbelegt, Entscheidung 1), und 2 echte
  // Entscheidungen ohne Hilfe durch die Gruppenkennung.
  it('INPBPI/grade=*, Kennung C8: von dreizehn Kombinationen sind sieben vorbelegt, zwei stehen offen', () => {
    const rsbs2 = modul('Rechnerstrukturen und Betriebssysteme 2', [
      rohtermin({ courseType: 'V', timeBeginMin: 480, timeEndMin: 570 }),
      rohtermin({ courseType: 'Ü', timeBeginMin: 600, timeEndMin: 690 }),
      rohtermin({ courseType: 'P', studentSet: 'A-B', timeBeginMin: 720, timeEndMin: 810 }),
      rohtermin({ courseType: 'P', studentSet: 'C5-E', timeBeginMin: 840, timeEndMin: 930 }),
      rohtermin({ courseType: 'P', studentSet: 'F-Z', timeBeginMin: 960, timeEndMin: 1050 }),
    ]);
    const mathe3 = modul('Mathematik für Informatik 3', [
      rohtermin({ courseType: 'T', timeBeginMin: 480, timeEndMin: 570 }),
      rohtermin({ courseType: 'V', timeBeginMin: 600, timeEndMin: 690 }),
      rohtermin({ courseType: 'Ü', studentSet: 'A-B', timeBeginMin: 720, timeEndMin: 810 }),
      rohtermin({ courseType: 'Ü', studentSet: 'C5-E', timeBeginMin: 840, timeEndMin: 930 }),
      rohtermin({ courseType: 'Ü', studentSet: 'F-Z', timeBeginMin: 960, timeEndMin: 1050 }),
    ]);
    const programmierkurs1 = modul('Programmierkurs 1', [
      rohtermin({ courseType: 'V', timeBeginMin: 480, timeEndMin: 570 }),
      rohtermin({ courseType: 'P', studentSet: 'A-B', timeBeginMin: 600, timeEndMin: 690 }),
      rohtermin({ courseType: 'P', studentSet: 'C5-E', timeBeginMin: 720, timeEndMin: 810 }),
      rohtermin({ courseType: 'P', studentSet: 'F-Z', timeBeginMin: 840, timeEndMin: 930 }),
    ]);
    const mathe2 = modul('Mathematik für Informatik 2', [
      rohtermin({ courseType: 'V', timeBeginMin: 480, timeEndMin: 570 }),
      rohtermin({ courseType: 'Ü', studentSet: 'A-B', timeBeginMin: 600, timeEndMin: 690 }),
      rohtermin({ courseType: 'Ü', studentSet: 'C5-E', timeBeginMin: 720, timeEndMin: 810 }),
      rohtermin({ courseType: 'Ü', studentSet: 'F-Z', timeBeginMin: 840, timeEndMin: 930 }),
    ]);
    const algoDs = modul('Algorithmen und Datenstrukturen', [
      rohtermin({ courseType: 'V', timeBeginMin: 480, timeEndMin: 570 }),
      rohtermin({ courseType: 'ÜPP', studentSet: 'A-B', timeBeginMin: 600, timeEndMin: 690 }),
      rohtermin({ courseType: 'ÜPP', studentSet: 'C-D', timeBeginMin: 720, timeEndMin: 810 }),
      rohtermin({ courseType: 'ÜPP', studentSet: 'C5-Z', timeBeginMin: 840, timeEndMin: 930 }),
      rohtermin({ courseType: 'ÜPP', studentSet: 'E-F', timeBeginMin: 960, timeEndMin: 1050 }),
    ]);
    const technischesEnglisch8 = modul('Technisches Englisch 8', [
      rohtermin({ courseType: 'SV', studentSet: 'A-P', timeBeginMin: 480, timeEndMin: 570 }),
      rohtermin({ courseType: 'SV', studentSet: 'A-P', timeBeginMin: 600, timeEndMin: 690 }),
      rohtermin({ courseType: 'SV', studentSet: 'A-P', timeBeginMin: 720, timeEndMin: 810 }),
      rohtermin({ courseType: 'SV', studentSet: 'A-P', timeBeginMin: 840, timeEndMin: 930 }),
    ]);
    const module = [rsbs2, mathe3, programmierkurs1, mathe2, algoDs, technischesEnglisch8];

    const gesamtzahlKombinationen = module.reduce(
      (summe, m) => summe + new Set(m.termine.map((t) => t.courseType)).size,
      0,
    );
    expect(gesamtzahlKombinationen).toBe(13);

    const vorbelegt = vorbelegteSlots(module);
    expect(vorbelegt).toHaveLength(7);

    const stand = ermittlePlanungsstand(module, []);
    const algoDsUepp = stand.find((s) => s.modulKey === algoDs.key && s.art === 'ÜPP');
    const englischSv = stand.find((s) => s.modulKey === technischesEnglisch8.key && s.art === 'SV');
    // Die beiden echten Entscheidungen aus design.md: Bei `ÜPP` hilft die
    // Gruppenkennung nur teilweise (2 von 4 passen), bei `SV` passen alle —
    // in keinem der beiden Fälle bleibt eine einzelne Empfehlung übrig.
    expect(algoDsUepp!.stand).toBe('offen');
    expect(englischSv!.stand).toBe('offen');
  });
});

describe('Kennzeichnung des Planungsstands je Veranstaltung', () => {
  it('eine Veranstaltungsart ohne jede Wahl gilt als noch nicht eingeplant', () => {
    const slots = [
      rohtermin({ courseType: 'ÜPP', studentSet: 'A-B', timeBeginMin: 480, timeEndMin: 570 }),
      rohtermin({ courseType: 'ÜPP', studentSet: 'C5-E', timeBeginMin: 600, timeEndMin: 690 }),
    ];
    const m = modul('Algorithmen und Datenstrukturen', slots);

    const [stand] = ermittlePlanungsstand([m], []);

    expect(stand!.stand).not.toBe('gewaehlt');
    expect(stand!.gewaehlteSlots).toHaveLength(0);
  });

  it('eine Veranstaltungsart mit gewählten Slots trägt die Anzahl der gewählten Slots', () => {
    const slotA = rohtermin({ courseType: 'ÜPP', studentSet: 'A-B', timeBeginMin: 480, timeEndMin: 570 });
    const slotB = rohtermin({ courseType: 'ÜPP', studentSet: 'C5-E', timeBeginMin: 600, timeEndMin: 690 });
    const m = modul('Algorithmen und Datenstrukturen', [slotA, slotB]);
    const zwischenstand = [planeintragFuer(slotA), planeintragFuer(slotB)];

    const [stand] = ermittlePlanungsstand([m], zwischenstand);

    expect(stand!.stand).toBe('gewaehlt');
    expect(stand!.gewaehlteSlots).toHaveLength(2);
  });

  it('die Wahl eines mit einem bereits gewählten Termin überschneidenden Slots wird als kollidierend gekennzeichnet', () => {
    const gewaehlt = rohtermin({ courseType: 'V', timeBeginMin: 480, timeEndMin: 570 });
    const kandidat = rohtermin({ courseType: 'Ü', timeBeginMin: 540, timeEndMin: 630 });
    const zwischenstand = [planeintragFuer(gewaehlt)];

    expect(terminEntsprichtEintrag(gewaehlt, zwischenstand[0]!)).toBe(true);
    const stufe = pruefeKandidatGegenZwischenstand(kandidat, zwischenstand, JETZT_SEK);

    expect(stufe).toBe('konflikt');
  });
});

// Change `planungsmodus-mehrfachauswahl-defekt` (design.md, Context): Termine,
// die sich nur in Raum oder Name unterscheiden, stellt `kursbaum.ts` als
// getrennte Zeilen dar — sie müssen auch getrennt gewählt werden. Werte aus der
// Live-Abfrage von INT-002 am 2026-09-11, Endpunkt `INPBPI`.
describe('Zusammenfassen deckungsgleicher Rohtermine', () => {
  it('Termine mit abweichendem Raum: die Wahl des einen gilt nicht für den anderen', () => {
    const raumA = rohtermin({ courseId: '411031', name: 'Lern- und Arbeitstechniken (siehe ILIAS-Kurs)', courseType: 'SV', studentSet: 'A-P', weekday: 'Wed', timeBeginMin: 960, timeEndMin: 1005, roomId: 'A.2.03' });
    const raumB = { ...raumA, roomId: 'A.3.03' };

    expect(terminEntsprichtEintrag(raumA, planeintragFuer(raumA))).toBe(true);
    expect(terminEntsprichtEintrag(raumB, planeintragFuer(raumA))).toBe(false);
  });

  it('Termine mit abweichendem Namen: die Wahl des einen gilt nicht für den anderen', () => {
    const ersteHaelfte = rohtermin({ courseId: '46884', name: 'Sicherheits-und Servicemanagement (1. Semesterhälfte)', courseType: 'V', studentSet: 'A-P', weekday: 'Tue', timeBeginMin: 720, timeEndMin: 815, roomId: 'C.3.32' });
    const zweiteHaelfte = { ...ersteHaelfte, name: 'Sicherheits-und Servicemanagement (2. Semesterhälfte)' };

    expect(terminEntsprichtEintrag(zweiteHaelfte, planeintragFuer(ersteHaelfte))).toBe(false);
  });

  it('„Technisches Englisch 1" und „10" zur selben Zeit: nur die gewählte Gruppe zählt als gewählt', () => {
    const englisch1 = rohtermin({ courseId: '41102', name: 'Technisches Englisch 1', courseType: 'SV', studentSet: 'A-P', lecturerName: 'Feldman', weekday: 'Mon', timeBeginMin: 855, timeEndMin: 950, roomId: 'C.E.41' });
    const englisch10 = { ...englisch1, name: 'Technisches Englisch 10', lecturerName: 'Morovvatdar', roomId: 'C.E.42' };
    const m: Modul = { key: '41102|2', courseId: '41102', name: 'Technisches Englisch', termine: [englisch1, englisch10] };

    const [stand] = ermittlePlanungsstand([m], [planeintragFuer(englisch1)]);

    expect(stand!.gewaehlteSlots).toEqual([englisch1]);
  });
});

describe('Mehrere Gruppen-Slots übernehmen', () => {
  it('zwei Gruppen-Slots derselben Veranstaltung können gemeinsam gewählt werden', () => {
    const a = rohtermin({ courseType: 'ÜPP', studentSet: 'A-B', timeBeginMin: 480, timeEndMin: 570 });
    const b = rohtermin({ courseType: 'ÜPP', studentSet: 'C5-E', timeBeginMin: 600, timeEndMin: 690 });
    const m = modul('Algorithmen und Datenstrukturen', [a, b]);
    const zwischenstand = [planeintragFuer(a), planeintragFuer(b)];

    const [stand] = ermittlePlanungsstand([m], zwischenstand);

    expect(stand!.gewaehlteSlots).toHaveLength(2);
  });

  it('die Anzahl der übernommenen Slots ist am Stand erkennbar', () => {
    const a = rohtermin({ courseType: 'ÜPP', studentSet: 'A-B', timeBeginMin: 480, timeEndMin: 570 });
    const b = rohtermin({ courseType: 'ÜPP', studentSet: 'C5-E', timeBeginMin: 600, timeEndMin: 690 });
    const m = modul('Algorithmen und Datenstrukturen', [a, b]);

    const [einSlot] = ermittlePlanungsstand([m], [planeintragFuer(a)]);
    const [zweiSlots] = ermittlePlanungsstand([m], [planeintragFuer(a), planeintragFuer(b)]);

    expect(einSlot!.gewaehlteSlots).toHaveLength(1);
    expect(zweiSlots!.gewaehlteSlots).toHaveLength(2);
  });

  it('verlangt keine Bestimmung eines Vorrangs zwischen zwei gewählten Slots derselben Art', () => {
    const a = rohtermin({ courseType: 'ÜPP', studentSet: 'A-B', timeBeginMin: 480, timeEndMin: 570 });
    const b = rohtermin({ courseType: 'ÜPP', studentSet: 'C5-E', timeBeginMin: 600, timeEndMin: 690 });
    const m = modul('Algorithmen und Datenstrukturen', [a, b]);
    const zwischenstand = [planeintragFuer(a), planeintragFuer(b)];

    // ermittlePlanungsstand kennt keinen Vorrang zwischen gewaehlteSlots — beide
    // stehen gleichrangig in der Liste, kein Feld unterscheidet sie.
    const [stand] = ermittlePlanungsstand([m], zwischenstand);
    expect(stand!.gewaehlteSlots).toEqual(expect.arrayContaining([a, b]));
  });
});
