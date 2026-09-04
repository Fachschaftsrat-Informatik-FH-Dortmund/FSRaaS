import { wischRichtung } from './gesten';

describe('MENSA-F-046 waagerechtes Wischen wechselt zum benachbarten Tag', () => {
  it('nach links über die Schwelle → nächster Tag', () => {
    expect(wischRichtung(-80)).toBe(1);
  });

  it('nach rechts über die Schwelle → vorheriger Tag', () => {
    expect(wischRichtung(80)).toBe(-1);
  });

  it('kurze Bewegung unter der Schwelle → kein Tageswechsel', () => {
    expect(wischRichtung(20)).toBe(0);
    expect(wischRichtung(-20)).toBe(0);
  });
});
