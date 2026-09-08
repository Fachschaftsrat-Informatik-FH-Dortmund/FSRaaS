import { baueModulliste, type EndpunktTermine } from './kursbaum';
import { filtereModulAbschnitte } from './kurssuche';
import type { OfficialTermin } from './typen';

function termin(überschreibung: Partial<OfficialTermin>): OfficialTermin {
  return {
    courseId: '42012',
    name: 'Algorithmen und Datenstrukturen',
    courseType: 'V',
    lecturerName: 'Müller',
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

const abschnitte = () =>
  baueModulliste([
    {
      sname: 'INPBPI',
      name: 'Bachelor Informatik (StgPO 2019)',
      termine: [
        termin({ courseId: '42012', name: 'Algorithmen und Datenstrukturen', courseType: 'V', lecturerName: 'Müller', grade: '2' }),
        termin({ courseId: '42012', name: 'Algorithmen und Datenstrukturen', courseType: 'Ü', lecturerName: 'Özdemir', grade: '2' }),
        termin({ courseId: '42099', name: 'Softwaretechnik', courseType: 'V', lecturerName: 'Schmidt', grade: '4' }),
      ] as EndpunktTermine['termine'],
    },
  ]);

describe('Freitextsuche im Auswahlbestand', () => {
  it('findet ein Modul über einen Teil der Bezeichnung, diakritika- und großschreibungstolerant', () => {
    const treffer = filtereModulAbschnitte(abschnitte(), { text: 'ALGORITHMEN' });
    expect(treffer.flatMap((a) => a.module.map((m) => m.key))).toEqual(['42012']);
  });

  it('findet ein Modul über die Modulnummer', () => {
    const treffer = filtereModulAbschnitte(abschnitte(), { text: '42099' });
    expect(treffer.flatMap((a) => a.module.map((m) => m.key))).toEqual(['42099']);
  });

  it('findet ein Modul über die lehrende Person, diakritikatolerant (Özdemir ↔ ozdemir)', () => {
    const treffer = filtereModulAbschnitte(abschnitte(), { text: 'ozdemir' });
    expect(treffer.flatMap((a) => a.module.map((m) => m.key))).toEqual(['42012']);
  });

  it('liefert alle Module ohne Text', () => {
    expect(abschnitte().flatMap((a) => a.module)).toHaveLength(2);
    expect(filtereModulAbschnitte(abschnitte(), {}).flatMap((a) => a.module)).toHaveLength(2);
  });

  it('liefert keinen Treffer für einen nicht vorkommenden Text', () => {
    expect(filtereModulAbschnitte(abschnitte(), { text: 'xyz-nichts' })).toEqual([]);
  });
});

describe('Filter nach Fachsemester', () => {
  it('lässt nur den Abschnitt des gewählten Fachsemesters übrig', () => {
    const treffer = filtereModulAbschnitte(abschnitte(), { grade: '4' });
    expect(treffer.flatMap((a) => a.module.map((m) => m.key))).toEqual(['42099']);
  });

  it('ohne Fachsemester-Filter bleiben alle Abschnitte erhalten', () => {
    expect(filtereModulAbschnitte(abschnitte(), {})).toHaveLength(2);
  });
});
