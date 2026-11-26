import { alternativenDesTages, gewaehlteModule, nichtGewaehlteDesTages } from './alternativen';
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
    expect(alternativen.every((a) => a.einblendung?.art === 'alternative' && a.einblendung.modulKey === 'INF999|')).toBe(true);
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

  // Change `planungsmodus-mehrfachauswahl-defekt`, design.md Entscheidung 4:
  // „Informationssicherheit" steht live in `INPBPI` (Fachsemester 4) und
  // `INPBDS` (6) mit identischem Termin — zwei Module, ein Termin.
  it('blendet einen Termin, der in zwei gewählten Modulen steht, nur einmal ein', () => {
    const v = termin({ courseId: '46813', name: 'Informationssicherheit', weekday: 'Tue' });
    const ue = termin({ courseId: '46813', name: 'Informationssicherheit', courseType: 'Ü', studentSet: 'A-D', weekday: 'Thu' });
    const fs4: Modul = { key: '46813|4', courseId: '46813', name: 'Informationssicherheit', termine: [v, ue] };
    const fs6: Modul = { ...fs4, key: '46813|6' };
    const entries = [eintrag({ id: 'v', courseId: '46813', name: 'Informationssicherheit', weekday: 'Tue' })];

    expect(alternativenDesTages([fs4, fs6], entries, 'Thu', 'C8')).toHaveLength(1);
  });

  // Live-Bestand `DDPM`, 2026-09-11: zwei Termine, die sich allein im Namen
  // unterscheiden — gleicher Kurs, gleiche Zeit, gleicher Raum.
  it('blendet zwei gleichzeitige Termine verschiedenen Namens getrennt ein', () => {
    const ersteHaelfte = termin({ courseId: '46884', name: 'Sicherheits-und Servicemanagement (1. Semesterhälfte)', studentSet: 'A-P', roomId: 'C.3.32', weekday: 'Tue', timeBeginMin: 720, timeEndMin: 815 });
    const zweiteHaelfte = { ...ersteHaelfte, name: 'Sicherheits-und Servicemanagement (2. Semesterhälfte)' };
    const uebung = { ...ersteHaelfte, courseType: 'Ü' as const, weekday: 'Wed' as const };
    const m: Modul = { key: '46884|2', courseId: '46884', name: ersteHaelfte.name, termine: [ersteHaelfte, zweiteHaelfte, uebung] };
    const entries = [eintrag({ id: 'ue', courseId: '46884', name: uebung.name, courseType: 'Ü', studentSet: 'A-P', roomId: 'C.3.32', weekday: 'Wed', timeBeginMin: 720, timeEndMin: 815 })];

    const alternativen = alternativenDesTages([m], entries, 'Tue', 'C8');

    expect(alternativen.map((a) => a.name)).toEqual([ersteHaelfte.name, zweiteHaelfte.name]);
    expect(new Set(alternativen.map((a) => a.id)).size).toBe(2);
  });
});

describe('Einblenden nicht gewählter Veranstaltungen', () => {
  const RN_MI = termin({ courseId: 'INF111', name: 'Rechnernetze', weekday: 'Wed', timeBeginMin: 600, timeEndMin: 690 });
  const RN_DO = termin({ courseId: 'INF111', name: 'Rechnernetze', weekday: 'Thu' });
  const RECHNERNETZE: Modul = { key: 'INF111|', courseId: 'INF111', name: 'Rechnernetze', termine: [RN_MI, RN_DO] };

  it('zeigt die Termine der Module ohne Planeintrag am Wochentag, gekennzeichnet mit ihrem Modul', () => {
    const entries = [eintrag({ id: 'v', courseId: 'INF999' })];
    const eingeblendet = nichtGewaehlteDesTages([MODUL, RECHNERNETZE], entries, 'Wed', 'C8');

    expect(eingeblendet).toHaveLength(1);
    expect(eingeblendet[0]!.name).toBe('Rechnernetze');
    expect(eingeblendet[0]!.einblendung).toEqual({ art: 'nichtGewaehlt', modulKey: 'INF111|' });
  });

  it('zeigt keinen Termin eines gewählten Moduls', () => {
    const entries = [eintrag({ id: 'v', courseId: 'INF999' })];
    expect(nichtGewaehlteDesTages([MODUL, RECHNERNETZE], entries, 'Tue', 'C8')).toEqual([]);
  });

  it('zeigt bei leerem Plan jedes Modul des Auswahlbestands', () => {
    const eingeblendet = nichtGewaehlteDesTages([MODUL, RECHNERNETZE], [], 'Mon', 'C8');
    expect(eingeblendet.map((e) => e.courseId)).toEqual(['INF999']);
  });

  it('zeigt einen Rohtermin, der zugleich in einem gewählten Modul steht, nie als nicht gewählt', () => {
    // Derselbe Rohtermin in zwei Modulen (Wahlpflicht-Sammelkategorie und Fachsemester).
    const geteilt = termin({ courseId: 'INF999', weekday: 'Fri' });
    const sammel: Modul = { key: 'INF999|6', courseId: 'INF999', name: V.name, termine: [geteilt] };
    const gewaehlt: Modul = { ...MODUL, termine: [...MODUL.termine, geteilt] };
    const entries = [eintrag({ id: 'v', courseId: 'INF999' })];

    expect(nichtGewaehlteDesTages([gewaehlt, sammel], entries, 'Fri', 'C8')).toEqual([]);
  });

  it('blendet einen Rohtermin mehrerer nicht gewählter Module nur einmal ein', () => {
    const zweitesModul: Modul = { ...RECHNERNETZE, key: 'INF111|4' };
    const eingeblendet = nichtGewaehlteDesTages([RECHNERNETZE, zweitesModul], [], 'Thu', 'C8');
    expect(eingeblendet).toHaveLength(1);
  });

  it('vergibt Kennungen, die sich von denen der Alternativen unterscheiden', () => {
    const eingeblendet = nichtGewaehlteDesTages([RECHNERNETZE], [], 'Wed', 'C8');
    expect(eingeblendet[0]!.id.startsWith('nichtgewaehlt-')).toBe(true);
  });
});
