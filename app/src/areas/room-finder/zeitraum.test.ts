import { kalendertag, uhrzeit, verschiebeStart, zeitraumEnde } from './zeitraum';

describe('Suche nach freien Räumen', () => {
  const jetzt = new Date(2026, 10, 26, 10, 7, 30);

  it('Zeitraum: Startzeit in Halbstundenschritten, nie vor jetzt, höchstens sieben Tage voraus', () => {
    expect(verschiebeStart(new Date(2026, 10, 26, 10, 7), 1, jetzt)).toEqual(new Date(2026, 10, 26, 10, 37));
    expect(verschiebeStart(new Date(2026, 10, 26, 10, 7), -1, jetzt)).toEqual(new Date(2026, 10, 26, 10, 7));
    expect(verschiebeStart(new Date(2026, 10, 26, 10, 7), 1000, jetzt)).toEqual(new Date(2026, 11, 3, 10, 7));
  });

  it('Zeitraum: Ende aus Startzeit und Dauer', () => {
    expect(zeitraumEnde(new Date(2026, 10, 26, 10, 0), 2)).toEqual(new Date(2026, 10, 26, 12, 0));
  });

  it('formatiert Uhrzeit und Kalendertag in Ortszeit', () => {
    expect(uhrzeit(new Date(2026, 10, 26, 9, 5))).toBe('09:05');
    expect(kalendertag(new Date(2026, 0, 3, 23, 59))).toBe('2026-01-03');
  });
});
