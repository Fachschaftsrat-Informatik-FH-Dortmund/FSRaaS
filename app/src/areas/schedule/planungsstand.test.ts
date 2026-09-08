import { pruefeKandidatGegenZwischenstand } from './konflikt';
import { ermittlePlanungsstand, terminEntsprichtEintrag, vorbelegteSlots } from './planungsstand';
import type { Modul } from './kursbaum';
import type { OfficialPlanEntry, OfficialTermin, PlanEntry } from './typen';

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

function planeintragFuer(t: OfficialTermin, status: PlanEntry['status'] = 'fest'): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    id: `plan-${t.courseType}-${t.timeBeginMin}`,
    status,
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
    const zwischenstand = [planeintragFuer(gewaehlt, 'fest')];

    expect(terminEntsprichtEintrag(gewaehlt, zwischenstand[0]!)).toBe(true);
    const stufe = pruefeKandidatGegenZwischenstand(kandidat, zwischenstand);

    expect(stufe).toBe('konflikt');
  });
});
