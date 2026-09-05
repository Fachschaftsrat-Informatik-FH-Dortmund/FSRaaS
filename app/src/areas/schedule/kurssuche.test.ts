import { baueKursbaum } from './kursbaum';
import { filtereKurse } from './kurssuche';
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

const kurse = () =>
  baueKursbaum(
    [
      termin({ courseId: '42012', name: 'Algorithmen und Datenstrukturen', courseType: 'V', lecturerName: 'Müller', grade: '2' }),
      termin({ courseId: '42012', name: 'Algorithmen und Datenstrukturen', courseType: 'Ü', lecturerName: 'Özdemir', grade: '2' }),
      termin({ courseId: '42099', name: 'Softwaretechnik', courseType: 'V', lecturerName: 'Schmidt', grade: '4' }),
    ],
    null,
  );

describe('SCHED-F-630 Freitextsuche über Bezeichnung, Modulnummer und lehrende Person', () => {
  it('findet eine Veranstaltung über einen Teil der Bezeichnung, diakritika- und großschreibungstolerant', () => {
    const treffer = filtereKurse(kurse(), { text: 'ALGORITHMEN' });
    expect(treffer.map((k) => k.key)).toEqual(['42012']);
  });

  it('findet eine Veranstaltung über die Modulnummer', () => {
    const treffer = filtereKurse(kurse(), { text: '42099' });
    expect(treffer.map((k) => k.key)).toEqual(['42099']);
  });

  it('findet eine Veranstaltung über die lehrende Person, diakritikatolerant (Özdemir ↔ ozdemir)', () => {
    const treffer = filtereKurse(kurse(), { text: 'ozdemir' });
    expect(treffer.map((k) => k.key)).toEqual(['42012']);
  });

  it('liefert alle Veranstaltungen ohne Text', () => {
    expect(filtereKurse(kurse(), {})).toHaveLength(2);
  });

  it('liefert keinen Treffer für einen nicht vorkommenden Text', () => {
    expect(filtereKurse(kurse(), { text: 'xyz-nichts' })).toEqual([]);
  });
});

describe('SCHED-F-610 Filter nach Veranstaltungsart', () => {
  it('lässt nur Veranstaltungsarten aus der Filterliste übrig, ohne die Veranstaltung selbst zu entfernen', () => {
    const treffer = filtereKurse(kurse(), { courseTypes: ['V'] });
    const algo = treffer.find((k) => k.key === '42012');
    expect(algo).toBeDefined();
    expect(algo!.arten.map((a) => a.courseType)).toEqual(['V']);
    expect(treffer.some((k) => k.key === '42099')).toBe(true);
  });

  it('entfernt eine Veranstaltung vollständig, wenn keine ihrer Arten zum Filter passt', () => {
    const treffer = filtereKurse(kurse(), { courseTypes: ['P'] });
    expect(treffer).toEqual([]);
  });
});

describe('SCHED-F-640 Filter nach Fachsemester', () => {
  it('lässt nur Slots mit dem gewählten Fachsemester übrig', () => {
    const treffer = filtereKurse(kurse(), { grade: '4' });
    expect(treffer.map((k) => k.key)).toEqual(['42099']);
  });

  it('ohne Fachsemester-Filter bleiben alle Slots erhalten', () => {
    expect(filtereKurse(kurse(), {})).toHaveLength(2);
  });
});
