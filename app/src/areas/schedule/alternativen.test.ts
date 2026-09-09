import { alternativenDesTages, gewaehlteModule } from './alternativen';
import type { Modul } from './kursbaum';
import type { OfficialPlanEntry, OfficialTermin } from './typen';

function termin(over: Partial<OfficialTermin> & { courseId: string }): OfficialTermin {
  return {
    name: 'Mathematik für Informatik 3',
    courseType: 'V',
    lecturerName: 'Prof. Beispiel',
    studentSet: '*',
    roomId: 'A.1.01',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gueltigVon: null,
    gueltigBis: null,
    ...over,
  };
}

function eintrag(over: Partial<OfficialPlanEntry> & { id: string; courseId: string }): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    deaktiviertBis: null,
    color: '#1E88E5',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    name: 'Mathematik für Informatik 3',
    courseType: 'V',
    lecturerName: 'Prof. Beispiel',
    studentSet: '*',
    roomId: 'A.1.01',
    ...over,
  };
}

const V = termin({ courseId: 'INF999' });
const UE_FREMD = termin({
  courseId: 'INF999',
  courseType: 'Ü',
  studentSet: 'A-B',
  weekday: 'Tue',
  timeBeginMin: 600,
  timeEndMin: 690,
});
const UE_EIGEN = termin({
  courseId: 'INF999',
  courseType: 'Ü',
  studentSet: 'C5-E',
  weekday: 'Tue',
  timeBeginMin: 720,
  timeEndMin: 810,
});
const MODUL: Modul = { key: 'INF999|', courseId: 'INF999', name: V.name, termine: [V, UE_FREMD, UE_EIGEN] };

const ANDERES_MODUL: Modul = {
  key: 'INF111|',
  courseId: 'INF111',
  name: 'Rechnernetze',
  termine: [termin({ courseId: 'INF111', name: 'Rechnernetze', weekday: 'Wed' })],
};

describe('Gewählte Module', () => {
  it('führt nur Module, die der persönliche Plan bereits trägt', () => {
    const entries = [eintrag({ id: 'v', courseId: 'INF999' })];
    expect(gewaehlteModule([MODUL, ANDERES_MODUL], entries)).toEqual([MODUL]);
  });

  it('führt kein Modul, wenn der Plan leer ist', () => {
    expect(gewaehlteModule([MODUL, ANDERES_MODUL], [])).toEqual([]);
  });
});

describe('Einblenden aller Veranstaltungen gewählter Module', () => {
  it('Alternativen einblenden: zeigt weitere Termine eines gewählten Moduls, die nicht bereits im Plan stehen', () => {
    const entries = [eintrag({ id: 'v', courseId: 'INF999' })];
    const alternativen = alternativenDesTages([MODUL], entries, 'Tue', 'C8');

    expect(alternativen).toHaveLength(2);
    expect(alternativen.every((a) => a.istAlternative)).toBe(true);
    expect(alternativen.map((a) => a.studentSet)).toEqual(['A-B', 'C5-E']);
  });

  it('lässt einen bereits übernommenen Slot aus den Alternativen aus', () => {
    const entries = [
      eintrag({ id: 'v', courseId: 'INF999' }),
      eintrag({
        id: 'ue',
        courseId: 'INF999',
        courseType: 'Ü',
        studentSet: 'C5-E',
        weekday: 'Tue',
        timeBeginMin: 720,
        timeEndMin: 810,
      }),
    ];
    const alternativen = alternativenDesTages([MODUL], entries, 'Tue', 'C8');

    expect(alternativen).toHaveLength(1);
    expect(alternativen[0]!.studentSet).toBe('A-B');
  });

  it('zeigt nur Termine des angefragten Wochentags', () => {
    const entries = [eintrag({ id: 'v', courseId: 'INF999' })];
    expect(alternativenDesTages([MODUL], entries, 'Mon', 'C8')).toEqual([]);
  });

  it('kennzeichnet die eigene Gruppe unter den Alternativen', () => {
    const entries = [eintrag({ id: 'v', courseId: 'INF999' })];
    const alternativen = alternativenDesTages([MODUL], entries, 'Tue', 'C8');

    expect(alternativen.find((a) => a.studentSet === 'C5-E')!.gruppenzugehoerig).toBe(true);
    expect(alternativen.find((a) => a.studentSet === 'A-B')!.gruppenzugehoerig).toBe(false);
  });

  it('zeigt keine Alternativen für ein nicht gewähltes Modul', () => {
    const entries = [eintrag({ id: 'v', courseId: 'INF999' })];
    expect(alternativenDesTages([ANDERES_MODUL], entries, 'Wed', 'C8')).toEqual([]);
  });
});
