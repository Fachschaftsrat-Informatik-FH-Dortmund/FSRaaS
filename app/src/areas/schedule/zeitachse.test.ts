import { spanneDesTages, STANDARD_SPANNE } from './zeitachse';

describe('Proportionale Zeitachse', () => {
  it('beginnt beim ersten und endet beim letzten Termin des Tages', () => {
    const tag = [
      { timeBeginMin: 8 * 60 + 15, timeEndMin: 9 * 60 + 45 },
      { timeBeginMin: 13 * 60, timeEndMin: 16 * 60 + 5 },
    ];

    expect(spanneDesTages(tag)).toEqual({ vonMin: 8 * 60 + 15, bisMin: 16 * 60 + 5 });
  });

  it('lässt eine Spanne mit nur einem Termin auf dessen Zeiten stehen', () => {
    const tag = [{ timeBeginMin: 10 * 60, timeEndMin: 12 * 60 }];

    expect(spanneDesTages(tag)).toEqual({ vonMin: 10 * 60, bisMin: 12 * 60 });
  });

  it('liefert für einen Tag ohne Termine die Rückfallspanne', () => {
    expect(spanneDesTages([])).toEqual(STANDARD_SPANNE);
  });

  it('Kein Leerraum an den Tagesrändern', () => {
    const dienstag = [{ timeBeginMin: 10 * 60, timeEndMin: 11 * 60 }];
    // Ein anderer Wochentag hat bereits um 8:00 Uhr einen Termin — die Spanne
    // dieses Tages darf sich davon nicht beeinflussen lassen.
    expect(spanneDesTages(dienstag)).toEqual({ vonMin: 10 * 60, bisMin: 11 * 60 });
  });
});
