import { belegungsvorschauJeTag, sichtbareWochentage } from './wochentage';

describe('SCHED-F-460 Wochentagsleiste zeigt Mo-Fr immer, Wochenende nur bei Terminen', () => {
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

describe('SCHED-F-470 Belegungsvorschau je Tag', () => {
  it('zählt die Termine je Wochentag', () => {
    const termine = [{ weekday: 'Mon' as const }, { weekday: 'Mon' as const }, { weekday: 'Wed' as const }];
    const ergebnis = belegungsvorschauJeTag(termine, ['Mon', 'Tue', 'Wed']);
    expect(ergebnis).toEqual([
      { wochentag: 'Mon', anzahl: 2 },
      { wochentag: 'Tue', anzahl: 0 },
      { wochentag: 'Wed', anzahl: 1 },
    ]);
  });

  it('meldet 0, wenn ein Tag ganz ohne Termine ist, ohne den Tag wegzulassen', () => {
    const ergebnis = belegungsvorschauJeTag([], ['Mon']);
    expect(ergebnis).toEqual([{ wochentag: 'Mon', anzahl: 0 }]);
  });
});
