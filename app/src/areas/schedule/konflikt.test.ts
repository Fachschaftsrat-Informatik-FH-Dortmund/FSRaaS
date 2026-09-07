import { ermittleKonflikte } from './konflikt';
import type { PlanEntry } from './typen';

function termin(überschreibung: Partial<PlanEntry> & { id: string }): PlanEntry {
  return {
    kind: 'eigen',
    status: 'fest',
    color: '#1E88E5',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    title: 'Termin',
    wiederkehrend: true,
    ...überschreibung,
  } as PlanEntry;
}

describe('Konflikthinweis bei festen Terminen', () => {
  it('zwei feste Termine überschneiden sich: beide tragen einen Konflikthinweis', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 });
    const b = termin({ id: 'b', timeBeginMin: 540, timeEndMin: 630 });

    const konflikte = ermittleKonflikte([a, b]);

    expect(konflikte.offen).toHaveLength(1);
    expect(konflikte.angenommen).toHaveLength(0);
    expect([...konflikte.hinweisIds].sort()).toEqual(['a', 'b']);
  });

  it('kein Hinweis, wenn ein Termin endet, sobald der nächste beginnt', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 });
    const b = termin({ id: 'b', timeBeginMin: 570, timeEndMin: 660 });

    expect(ermittleKonflikte([a, b]).offen).toHaveLength(0);
  });

  it('ein beidseitig angenommenes Paar zeigt allein die Kennzeichnung, keinen Hinweis', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570, akzeptierteKonflikte: ['b'] });
    const b = termin({ id: 'b', timeBeginMin: 540, timeEndMin: 630, akzeptierteKonflikte: ['a'] });

    const konflikte = ermittleKonflikte([a, b]);

    expect(konflikte.offen).toHaveLength(0);
    expect(konflikte.angenommen).toHaveLength(1);
    expect([...konflikte.angenommenIds].sort()).toEqual(['a', 'b']);
    expect(konflikte.hinweisIds.size).toBe(0);
  });

  it('einseitige Nennung gilt nicht als angenommen', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570, akzeptierteKonflikte: ['b'] });
    const b = termin({ id: 'b', timeBeginMin: 540, timeEndMin: 630 });

    const konflikte = ermittleKonflikte([a, b]);

    expect(konflikte.offen).toHaveLength(1);
    expect(konflikte.angenommen).toHaveLength(0);
  });

  it('ein an die Stelle des angenommenen Gegenparts getretener Termin erzeugt wieder einen Hinweis', () => {
    // A und B waren angenommen; B ist gelöscht, C tritt zur selben Zeit hinzu.
    // A trägt die Nennung auf B noch — für das neue Paar A×C liegt keine
    // Annahme vor, der Hinweis erscheint wieder.
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570, akzeptierteKonflikte: ['b'] });
    const c = termin({ id: 'c', timeBeginMin: 480, timeEndMin: 570 });

    const konflikte = ermittleKonflikte([a, c]);

    expect(konflikte.offen).toHaveLength(1);
    expect([...konflikte.hinweisIds].sort()).toEqual(['a', 'c']);
  });

  it('ein dritter Termin: angenommenes Paar bleibt stumm, das offene Paar meldet sich', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 600, akzeptierteKonflikte: ['b'] });
    const b = termin({ id: 'b', timeBeginMin: 480, timeEndMin: 540, akzeptierteKonflikte: ['a'] });
    const c = termin({ id: 'c', timeBeginMin: 540, timeEndMin: 600 });

    const konflikte = ermittleKonflikte([a, b, c]);

    expect(konflikte.angenommen).toHaveLength(1);
    expect(konflikte.offen).toHaveLength(1);
    expect(konflikte.offen[0]!.a.id).toBe('a');
    expect(konflikte.offen[0]!.b.id).toBe('c');
    // Derselbe Termin trägt gleichzeitig eine angenommene und eine offene Kollision.
    expect(konflikte.angenommenIds.has('a')).toBe(true);
    expect(konflikte.hinweisIds.has('a')).toBe(true);
    expect(konflikte.hinweisIds.has('b')).toBe(false);
  });
});

describe('Kein Konflikthinweis bei vorgemerkten Terminen', () => {
  it('zwei vorgemerkte Termine erzeugen keinen Hinweis', () => {
    const a = termin({ id: 'a', status: 'vorgemerkt', timeBeginMin: 480, timeEndMin: 570 });
    const b = termin({ id: 'b', status: 'vorgemerkt', timeBeginMin: 540, timeEndMin: 630 });

    const konflikte = ermittleKonflikte([a, b]);

    expect(konflikte.offen).toHaveLength(0);
    expect(konflikte.hinweisIds.size).toBe(0);
  });

  it('ein vorgemerkter Termin erzeugt auch gegen einen festen keinen Hinweis', () => {
    const fest = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 });
    const vorgemerkt = termin({ id: 'b', status: 'vorgemerkt', timeBeginMin: 540, timeEndMin: 630 });

    const konflikte = ermittleKonflikte([fest, vorgemerkt]);

    expect(konflikte.offen).toHaveLength(0);
    expect(konflikte.hinweisIds.size).toBe(0);
  });
});
