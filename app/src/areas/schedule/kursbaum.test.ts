import { baueModulliste, type EndpunktTermine } from './kursbaum';
import type { OfficialTermin } from './typen';

function termin(überschreibung: Partial<OfficialTermin>): OfficialTermin {
  return {
    courseId: '42012',
    name: 'Algorithmen und Datenstrukturen',
    courseType: 'V',
    lecturerName: 'Beispiel',
    studentSet: '*',
    roomId: 'A.1.01',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gueltigVon: null,
    gueltigBis: null,
    ...überschreibung,
  };
}

describe('Gliederung der Modulauswahl nach Fachsemester', () => {
  it('Bachelor-Endpunkt mit Fachsemestern: gliedert dessen Module in die Abschnitte der drei Fachsemester', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'INPBPI',
      name: 'Bachelor Informatik (StgPO 2019)',
      termine: [
        termin({ courseId: '1', name: 'Erstsemestermodul', grade: '2' }),
        termin({ courseId: '2', name: 'Softwaretechnik', grade: '4' }),
        termin({ courseId: '3', name: 'Bachelorarbeit', grade: '6' }),
      ],
    };
    const abschnitte = baueModulliste([endpunkt]);

    expect(abschnitte.map((a) => a.kennung)).toEqual([
      { art: 'fachsemester', grade: '2' },
      { art: 'fachsemester', grade: '4' },
      { art: 'fachsemester', grade: '6' },
    ]);
    expect(abschnitte[0]!.module.map((m) => m.name)).toEqual(['Erstsemestermodul']);
  });

  it('Endpunkt ohne Fachsemester: führt dessen Module in einem nach dem Endpunkt benannten Abschnitt', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'TUPB',
      name: 'Tutorien',
      termine: [
        termin({ courseId: '10', name: 'Tutorium Mathematik', grade: '0' }),
        termin({ courseId: '11', name: 'Tutorium Programmieren', grade: '0' }),
      ],
    };
    const abschnitte = baueModulliste([endpunkt]);

    expect(abschnitte).toHaveLength(1);
    expect(abschnitte[0]!.kennung).toEqual({ art: 'endpunkt', name: 'Tutorien' });
    expect(abschnitte[0]!.module.map((m) => m.name)).toEqual(['Tutorium Mathematik', 'Tutorium Programmieren']);
  });

  it('mehrere Termine desselben Moduls (Veranstaltungsarten/Slots) bleiben unter einem Eintrag zusammengefasst', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'INPBPI',
      name: 'Bachelor Informatik (StgPO 2019)',
      termine: [
        termin({ courseId: '1', courseType: 'V', grade: '2' }),
        termin({ courseId: '1', courseType: 'Ü', grade: '2', studentSet: 'A-M' }),
        termin({ courseId: '1', courseType: 'Ü', grade: '2', studentSet: 'N-P' }),
      ],
    };
    const abschnitte = baueModulliste([endpunkt]);

    expect(abschnitte).toHaveLength(1);
    expect(abschnitte[0]!.module).toHaveLength(1);
    expect(abschnitte[0]!.module[0]!.termine).toHaveLength(3);
  });

  it('fällt bei leerem courseId auf den Klarnamen als Gruppierungsschlüssel zurück', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'INPBPI',
      name: 'Bachelor Informatik (StgPO 2019)',
      termine: [
        termin({ courseId: '', name: 'Lern- und Arbeitstechniken', roomId: 'A.2.03', grade: '2' }),
        termin({ courseId: '', name: 'Lern- und Arbeitstechniken', roomId: 'A.3.03', grade: '2' }),
      ],
    };
    const abschnitte = baueModulliste([endpunkt]);
    expect(abschnitte[0]!.module).toHaveLength(1);
    expect(abschnitte[0]!.module[0]!.key).toBe('Lern- und Arbeitstechniken|2');
  });

  it('Modulnummer mit Wiederholerangebot in anderem Fachsemester: führt beide als eigenständige Module in ihren Fachsemester-Abschnitten', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'INPBTI',
      name: 'Bachelor Technische Informatik',
      termine: [
        termin({ courseId: '42012', name: 'Algorithmen und Datenstrukturen', grade: '2' }),
        termin({ courseId: '42012', name: 'Wdh. Algorithmen und Datenstrukturen', grade: '4' }),
      ],
    };
    const abschnitte = baueModulliste([endpunkt]);

    expect(abschnitte.map((a) => a.kennung)).toEqual([
      { art: 'fachsemester', grade: '2' },
      { art: 'fachsemester', grade: '4' },
    ]);
    expect(abschnitte[0]!.module.map((m) => m.name)).toEqual(['Algorithmen und Datenstrukturen']);
    expect(abschnitte[1]!.module.map((m) => m.name)).toEqual(['Wdh. Algorithmen und Datenstrukturen']);
    expect(abschnitte[0]!.module[0]!.key).not.toBe(abschnitte[1]!.module[0]!.key);
  });

  it('Keine zusätzliche Fachsemester-Filterung: die Gliederung in Abschnitte ist die einzige Fachsemester-Navigation', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'INPBPI',
      name: 'Bachelor Informatik (StgPO 2019)',
      termine: [
        termin({ courseId: '1', name: 'Erstsemestermodul', grade: '2' }),
        termin({ courseId: '2', name: 'Softwaretechnik', grade: '4' }),
      ],
    };
    const abschnitte = baueModulliste([endpunkt]);

    expect(abschnitte).toHaveLength(2);
    // Kein Filter-Feld o. ä. existiert auf dem Rückgabetyp — die Abschnittsliste
    // selbst ist bereits vollständig, ohne dass ein Fachsemester ausgeblendet wird.
    expect(abschnitte.flatMap((a) => a.module)).toHaveLength(2);
  });

  it('mehrere gewählte Endpunkte tragen ihre Module gemeinsam in den Auswahlbestand ein', () => {
    const bachelor: EndpunktTermine = {
      sname: 'INPBPI',
      name: 'Bachelor Informatik (StgPO 2019)',
      termine: [termin({ courseId: '1', grade: '2' })],
    };
    const blockwoche: EndpunktTermine = {
      sname: 'Blockwoche1',
      name: 'Blockwoche 1 (13.04.-17.04.2026)',
      termine: [termin({ courseId: '99', name: 'IT-Landschaft', grade: '0' })],
    };
    const abschnitte = baueModulliste([bachelor, blockwoche]);

    expect(abschnitte).toEqual([
      { kennung: { art: 'fachsemester', grade: '2' }, module: expect.any(Array) },
      { kennung: { art: 'endpunkt', name: 'Blockwoche 1 (13.04.-17.04.2026)' }, module: expect.any(Array) },
    ]);
  });
});

describe('Anzeigename paralleler Termingruppen ohne bedeutungslose Endzahl', () => {
  it('mehrere Zahlenendungen bei gleichem Namensstamm: zeigt den Namensstamm ohne Zahl', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'INPBTI',
      name: 'Bachelor Technische Informatik',
      termine: Array.from({ length: 12 }, (_, i) =>
        termin({ courseId: '41102', name: `Technisches Englisch ${i + 1}`, courseType: 'SV', grade: '2' }),
      ),
    };
    const abschnitte = baueModulliste([endpunkt]);

    expect(abschnitte[0]!.module).toHaveLength(1);
    expect(abschnitte[0]!.module[0]!.name).toBe('Technisches Englisch');
  });

  it('durchgängig dieselbe Zahl: zeigt den Namen unverändert einschließlich der Zahl', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'INPBTI',
      name: 'Bachelor Technische Informatik',
      termine: [
        termin({ courseId: '44121', name: 'Softwaretechnik 2', courseType: 'V', grade: '4' }),
        termin({ courseId: '44121', name: 'Softwaretechnik 2', courseType: 'Ü', grade: '4', studentSet: 'A-M' }),
      ],
    };
    const abschnitte = baueModulliste([endpunkt]);

    expect(abschnitte[0]!.module).toHaveLength(1);
    expect(abschnitte[0]!.module[0]!.name).toBe('Softwaretechnik 2');
  });

  it('Namen unterscheiden sich über die angehängte Zahl hinaus: kein gemeinsamer Namensstamm, Name bleibt unverändert', () => {
    const endpunkt: EndpunktTermine = {
      sname: 'INPBTI',
      name: 'Bachelor Technische Informatik',
      termine: [
        termin({ courseId: '50000', name: 'Mathematik 1', courseType: 'V', grade: '2' }),
        termin({ courseId: '50000', name: 'Physik 2', courseType: 'V', grade: '2' }),
      ],
    };
    const abschnitte = baueModulliste([endpunkt]);

    expect(abschnitte[0]!.module).toHaveLength(1);
    expect(abschnitte[0]!.module[0]!.name).toBe('Mathematik 1');
  });
});
