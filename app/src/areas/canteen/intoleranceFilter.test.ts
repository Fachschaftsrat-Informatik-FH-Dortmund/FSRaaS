import { gerichtBetroffen, teileNachUnvertraeglichkeit } from './intoleranceFilter';

describe('MENSA-F-190 Gerichte mit festgelegter Unverträglichkeit ausblenden', () => {
  it('erkennt ein Gericht als betroffen, wenn es eine gewählte Kennzeichnung trägt', () => {
    expect(gerichtBetroffen(['Weizen', 'Milch'], new Set(['Milch']))).toBe(true);
  });

  it('lässt ein Gericht ohne gewählte Kennzeichnung unberührt', () => {
    expect(gerichtBetroffen(['Weizen'], new Set(['Milch']))).toBe(false);
  });

  it('greift ohne festgelegte Unverträglichkeit nicht', () => {
    expect(gerichtBetroffen(['Weizen'], new Set())).toBe(false);
  });
});

describe('MENSA-F-200 Anzahl der ausgeblendeten Gerichte', () => {
  it('trennt sichtbare von ausgeblendeten und zählt korrekt', () => {
    const gerichte = [
      { name: 'A', z: ['Weizen'] },
      { name: 'B', z: ['Milch'] },
      { name: 'C', z: ['Milch', 'Ei'] },
    ];
    const { sichtbar, ausgeblendet } = teileNachUnvertraeglichkeit(
      gerichte,
      (e) => e.z,
      new Set(['Milch']),
    );
    expect(sichtbar.map((e) => e.name)).toEqual(['A']);
    expect(ausgeblendet).toHaveLength(2);
  });
});
