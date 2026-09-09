import { sichtbareWochentage } from './wochentage';

describe('Wochentagsleiste mit bedarfsweisem Samstag', () => {
  it('zeigt Montag bis Freitag, wenn keinerlei Wochenendtermine vorliegen', () => {
    expect(sichtbareWochentage(() => false)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  });

  it('nimmt den Samstag auf, sobald an ihm ein Termin liegt', () => {
    expect(sichtbareWochentage((wt) => wt === 'Sat')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  });

  it('nimmt Samstag und Sonntag gemeinsam auf, wenn beide Termine haben', () => {
    expect(sichtbareWochentage(() => true)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('lässt den Sonntag verschwinden, sobald sein letzter Termin entfernt ist', () => {
    let hatSonntagsTermin = true;
    const leisteVorher = sichtbareWochentage((wt) => wt === 'Sun' && hatSonntagsTermin);
    hatSonntagsTermin = false;
    const leisteNachher = sichtbareWochentage((wt) => wt === 'Sun' && hatSonntagsTermin);
    expect(leisteVorher).toContain('Sun');
    expect(leisteNachher).not.toContain('Sun');
  });

  it('erzwingt Montag bis Freitag nie außerhalb der Reihenfolge oder mit Lücke', () => {
    expect(sichtbareWochentage(() => false).slice(0, 5)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  });
});
