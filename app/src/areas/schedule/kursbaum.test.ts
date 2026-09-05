import { baueKursbaum } from './kursbaum';
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

describe('SCHED-F-600 Gliederung Veranstaltung → Veranstaltungsart → Gruppen-Slot', () => {
  it('gruppiert nach courseId und darunter nach courseType', () => {
    const baum = baueKursbaum(
      [
        termin({ courseId: '42012', courseType: 'V' }),
        termin({ courseId: '42012', courseType: 'Ü' }),
        termin({ courseId: '42099', name: 'Softwaretechnik', courseType: 'V' }),
      ],
      null,
    );

    expect(baum).toHaveLength(2);
    expect(baum[0]!.key).toBe('42012');
    expect(baum[0]!.arten.map((a) => a.courseType)).toEqual(['V', 'Ü']);
    expect(baum[1]!.key).toBe('42099');
    expect(baum[1]!.name).toBe('Softwaretechnik');
  });

  it('fällt bei leerem courseId auf die Bezeichnung als Gruppierungsschlüssel zurück', () => {
    const baum = baueKursbaum(
      [
        termin({ courseId: '', name: 'Lern- und Arbeitstechniken', roomId: 'A.2.03' }),
        termin({ courseId: '', name: 'Lern- und Arbeitstechniken', roomId: 'A.3.03' }),
        termin({ courseId: '', name: 'Anderes Fach' }),
      ],
      null,
    );

    expect(baum).toHaveLength(2);
    const lat = baum.find((k) => k.name === 'Lern- und Arbeitstechniken');
    expect(lat).toBeDefined();
    expect(lat!.key).toBe('Lern- und Arbeitstechniken');
    expect(lat!.arten[0]!.slots).toHaveLength(2);
  });

  it('behält die Eingabereihenfolge der Veranstaltungen und Veranstaltungsarten bei', () => {
    const baum = baueKursbaum(
      [
        termin({ courseId: '2', name: 'Zweite', courseType: 'Ü' }),
        termin({ courseId: '1', name: 'Erste', courseType: 'P' }),
        termin({ courseId: '2', name: 'Zweite', courseType: 'V' }),
      ],
      null,
    );

    expect(baum.map((k) => k.key)).toEqual(['2', '1']);
    expect(baum[0]!.arten.map((a) => a.courseType)).toEqual(['Ü', 'V']);
  });
});

describe('SCHED-F-140 Gruppenzugehörigkeit je Gruppen-Slot', () => {
  it('kennzeichnet jeden Slot einzeln als gruppenzugehörig oder gruppenfremd', () => {
    const baum = baueKursbaum(
      [
        termin({ courseId: '1', studentSet: 'C8' }),
        termin({ courseId: '1', studentSet: 'D3', roomId: 'A.2.02' }),
      ],
      'C8',
    );

    const slots = baum[0]!.arten[0]!.slots;
    expect(slots).toHaveLength(2);
    expect(slots[0]!.gruppenzugehoerig).toBe(true);
    expect(slots[1]!.gruppenzugehoerig).toBe(false);
  });

  it('ohne Gruppenkennung gelten alle Slots als zugehörig (SCHED-F-050)', () => {
    const baum = baueKursbaum([termin({ courseId: '1', studentSet: 'C8' })], null);
    expect(baum[0]!.arten[0]!.slots[0]!.gruppenzugehoerig).toBe(true);
  });
});

describe('SCHED-F-620 mehrere Gruppen-Slots derselben Veranstaltung bleiben gleichzeitig wählbar', () => {
  it('beide Slots derselben Veranstaltungsart bleiben unabhängig voneinander in der Liste erhalten', () => {
    const baum = baueKursbaum(
      [
        termin({ courseId: '1', weekday: 'Mon', studentSet: 'A-M' }),
        termin({ courseId: '1', weekday: 'Wed', studentSet: 'N-P' }),
      ],
      null,
    );

    const slots = baum[0]!.arten[0]!.slots;
    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.termin.weekday)).toEqual(['Mon', 'Wed']);
  });
});
