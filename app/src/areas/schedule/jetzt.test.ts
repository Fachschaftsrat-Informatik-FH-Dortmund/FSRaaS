import { ermittleJetztStatus } from './jetzt';
import type { CustomPlanEntry } from './typen';

function termin(id: string, timeBeginMin: number, timeEndMin: number): CustomPlanEntry {
  return {
    kind: 'eigen',
    id,
    title: id,
    status: 'fest',
    color: '#000000',
    weekday: 'Mon',
    timeBeginMin,
    timeEndMin,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    wiederkehrend: true,
  };
}

describe('SCHED-F-550 laufender und nächster Termin mit verbleibender Zeit', () => {
  it('erkennt den laufenden Termin und die bis zu seinem Ende verbleibende Zeit', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const status = ermittleJetztStatus([a], 9 * 60 + 15);
    expect(status.laufend?.id).toBe('a');
    expect(status.laufendVerbleibendMin).toBe(45);
  });

  it('erkennt den nächsten Termin und die Zeit bis zu seinem Beginn', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 12 * 60, 13 * 60);
    const status = ermittleJetztStatus([a, b], 10 * 60 + 30);
    expect(status.laufend).toBeNull();
    expect(status.naechster?.id).toBe('b');
    expect(status.naechsterInMin).toBe(90);
  });

  it('liefert für laufend und nächster jeweils null, wenn keine Termine mehr anstehen', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const status = ermittleJetztStatus([a], 11 * 60);
    expect(status.laufend).toBeNull();
    expect(status.naechster).toBeNull();
    expect(status.laufendVerbleibendMin).toBeNull();
    expect(status.naechsterInMin).toBeNull();
  });

  it('behandelt den Beginn eines Termins als bereits laufend (Grenze eingeschlossen)', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const status = ermittleJetztStatus([a], 9 * 60);
    expect(status.laufend?.id).toBe('a');
  });

  it('behandelt das Ende eines Termins als nicht mehr laufend (Grenze ausgeschlossen)', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const status = ermittleJetztStatus([a], 10 * 60);
    expect(status.laufend).toBeNull();
  });

  it('wählt bei mehreren zukünftigen Terminen den zeitlich nächsten', () => {
    const a = termin('a', 14 * 60, 15 * 60);
    const b = termin('b', 12 * 60, 13 * 60);
    const status = ermittleJetztStatus([a, b], 9 * 60);
    expect(status.naechster?.id).toBe('b');
  });
});
