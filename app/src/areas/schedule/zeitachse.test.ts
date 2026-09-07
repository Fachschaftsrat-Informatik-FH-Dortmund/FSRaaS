import { spanneDerWoche, STANDARD_SPANNE } from './zeitachse';

describe('Proportionale Zeitachse', () => {
  it('rundet den frühesten Beginn ab und das späteste Ende auf die volle Stunde auf', () => {
    const woche = [
      { timeBeginMin: 8 * 60 + 15, timeEndMin: 9 * 60 + 45 },
      { timeBeginMin: 13 * 60, timeEndMin: 16 * 60 + 5 },
    ];

    expect(spanneDerWoche(woche)).toEqual({ vonMin: 8 * 60, bisMin: 17 * 60 });
  });

  it('lässt eine Spanne unverändert, die bereits auf vollen Stunden liegt', () => {
    const woche = [{ timeBeginMin: 10 * 60, timeEndMin: 12 * 60 }];

    expect(spanneDerWoche(woche)).toEqual({ vonMin: 10 * 60, bisMin: 12 * 60 });
  });

  it('nimmt die Randzeiten der ganzen Woche auf, nicht die eines einzelnen Tages', () => {
    const woche = [
      { timeBeginMin: 10 * 60, timeEndMin: 11 * 60 },
      { timeBeginMin: 7 * 60 + 30, timeEndMin: 8 * 60 }, // frühester Beginn
      { timeBeginMin: 18 * 60, timeEndMin: 20 * 60 + 30 }, // spätestes Ende
    ];

    expect(spanneDerWoche(woche)).toEqual({ vonMin: 7 * 60, bisMin: 21 * 60 });
  });

  it('liefert für eine Woche ohne Termine die Rückfallspanne', () => {
    expect(spanneDerWoche([])).toEqual(STANDARD_SPANNE);
  });
});
