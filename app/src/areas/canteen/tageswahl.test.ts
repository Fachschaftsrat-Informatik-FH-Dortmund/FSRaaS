import { naechsterTag } from './tageswahl';

// 2026-09-04 ist ein Freitag. 2026-09-05 Samstag, 2026-09-06 Sonntag, 2026-09-07 Montag.
const FREITAG = new Date(2026, 8, 4, 9, 0, 0);

describe('MENSA-F-042 Tagesauswahl auf heute und Folgetage begrenzt', () => {
  it('lässt am heutigen Tag kein „Tag zurück" zu', () => {
    expect(naechsterTag('2026-09-04', -1, () => true, FREITAG)).toBeNull();
  });

  it('erlaubt „Tag zurück" von einem künftigen Tag zurück bis heute', () => {
    expect(naechsterTag('2026-09-08', -1, () => true, FREITAG)).toBe('2026-09-07');
  });

  it('erlaubt Blättern in die Zukunft', () => {
    expect(naechsterTag('2026-09-04', 1, () => true, FREITAG)).toBe('2026-09-05');
  });
});

describe('MENSA-F-044 Wochenenden ohne Angebot beim Blättern überspringen', () => {
  it('überspringt einen Samstag ohne Angebot und landet auf Montag', () => {
    // Von Freitag vorwärts: Sa (2026-09-05) und So (2026-09-06) ohne Angebot → Montag.
    const ziel = naechsterTag('2026-09-04', 1, (tag) => tag === '2026-09-07', FREITAG);
    expect(ziel).toBe('2026-09-07');
  });

  it('zeigt einen Samstag mit Angebot an', () => {
    const ziel = naechsterTag('2026-09-04', 1, (tag) => tag === '2026-09-05', FREITAG);
    expect(ziel).toBe('2026-09-05');
  });

  it('behandelt ein unbekanntes Wochenende (offline/Ladefehler) wie „kein Angebot"', () => {
    const ziel = naechsterTag('2026-09-04', 1, () => undefined, FREITAG);
    expect(ziel).toBe('2026-09-07');
  });

  it('überspringt Werktage nie, auch ohne Angebot', () => {
    const ziel = naechsterTag('2026-09-07', 1, () => false, FREITAG);
    expect(ziel).toBe('2026-09-08');
  });
});
