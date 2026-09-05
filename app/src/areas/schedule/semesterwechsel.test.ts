import { erkenneSemesterwechsel } from './semesterwechsel';

describe('SCHED-F-180 Hinweis auf möglichen Semesterwechsel', () => {
  it('meldet keine Änderung, wenn noch kein Stand gespeichert war (Ersteinrichtung)', () => {
    const ergebnis = erkenneSemesterwechsel(null, ['2', '4', '6']);
    expect(ergebnis.geaendert).toBe(false);
    expect(ergebnis.nachher).toEqual(['2', '4', '6']);
  });

  it('meldet keine Änderung, wenn dieselben Fachsemester in anderer Reihenfolge geliefert werden', () => {
    const ergebnis = erkenneSemesterwechsel(['2', '4', '6'], ['6', '2', '4']);
    expect(ergebnis.geaendert).toBe(false);
  });

  it('meldet eine Änderung, wenn ein Fachsemester hinzugekommen ist', () => {
    const ergebnis = erkenneSemesterwechsel(['2', '4', '6'], ['2', '4', '6', '8']);
    expect(ergebnis.geaendert).toBe(true);
  });

  it('meldet eine Änderung, wenn ein Fachsemester weggefallen ist', () => {
    const ergebnis = erkenneSemesterwechsel(['2', '4', '6'], ['4', '6']);
    expect(ergebnis.geaendert).toBe(true);
  });

  it('trägt vorher/nachher unverändert zur Anzeige mit', () => {
    const ergebnis = erkenneSemesterwechsel(['2'], ['2', '4']);
    expect(ergebnis.vorher).toEqual(['2']);
    expect(ergebnis.nachher).toEqual(['2', '4']);
  });
});
