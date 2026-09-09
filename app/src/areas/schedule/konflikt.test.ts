import { ermittleKonflikte, pruefeKandidatGegenZwischenstand } from './konflikt';
import type { PlanEntry } from './typen';

const JETZT_SEK = 0;

function termin(überschreibung: Partial<PlanEntry> & { id: string }): PlanEntry {
  return {
    kind: 'eigen',
    deaktiviertBis: null,
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

describe('Konflikthinweis bei überschneidenden Terminen', () => {
  it('zwei aktive Termine überschneiden sich: beide tragen einen Konflikthinweis', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 });
    const b = termin({ id: 'b', timeBeginMin: 540, timeEndMin: 630 });

    const konflikte = ermittleKonflikte([a, b], JETZT_SEK);

    expect(konflikte.offen).toHaveLength(1);
    expect(konflikte.angenommen).toHaveLength(0);
    expect([...konflikte.hinweisIds].sort()).toEqual(['a', 'b']);
  });

  it('kein Hinweis, wenn ein Termin endet, sobald der nächste beginnt', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 });
    const b = termin({ id: 'b', timeBeginMin: 570, timeEndMin: 660 });

    expect(ermittleKonflikte([a, b], JETZT_SEK).offen).toHaveLength(0);
  });

  it('ein beidseitig angenommenes Paar zeigt allein die Kennzeichnung, keinen Hinweis', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570, akzeptierteKonflikte: ['b'] });
    const b = termin({ id: 'b', timeBeginMin: 540, timeEndMin: 630, akzeptierteKonflikte: ['a'] });

    const konflikte = ermittleKonflikte([a, b], JETZT_SEK);

    expect(konflikte.offen).toHaveLength(0);
    expect(konflikte.angenommen).toHaveLength(1);
    expect([...konflikte.angenommenIds].sort()).toEqual(['a', 'b']);
    expect(konflikte.hinweisIds.size).toBe(0);
  });

  it('einseitige Nennung gilt nicht als angenommen', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570, akzeptierteKonflikte: ['b'] });
    const b = termin({ id: 'b', timeBeginMin: 540, timeEndMin: 630 });

    const konflikte = ermittleKonflikte([a, b], JETZT_SEK);

    expect(konflikte.offen).toHaveLength(1);
    expect(konflikte.angenommen).toHaveLength(0);
  });

  it('ein an die Stelle des angenommenen Gegenparts getretener Termin erzeugt wieder einen Hinweis', () => {
    // A und B waren angenommen; B ist gelöscht, C tritt zur selben Zeit hinzu.
    // A trägt die Nennung auf B noch — für das neue Paar A×C liegt keine
    // Annahme vor, der Hinweis erscheint wieder.
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570, akzeptierteKonflikte: ['b'] });
    const c = termin({ id: 'c', timeBeginMin: 480, timeEndMin: 570 });

    const konflikte = ermittleKonflikte([a, c], JETZT_SEK);

    expect(konflikte.offen).toHaveLength(1);
    expect([...konflikte.hinweisIds].sort()).toEqual(['a', 'c']);
  });

  it('ein dritter Termin: angenommenes Paar bleibt stumm, das offene Paar meldet sich', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 600, akzeptierteKonflikte: ['b'] });
    const b = termin({ id: 'b', timeBeginMin: 480, timeEndMin: 540, akzeptierteKonflikte: ['a'] });
    const c = termin({ id: 'c', timeBeginMin: 540, timeEndMin: 600 });

    const konflikte = ermittleKonflikte([a, b, c], JETZT_SEK);

    expect(konflikte.angenommen).toHaveLength(1);
    expect(konflikte.offen).toHaveLength(1);
    expect(konflikte.offen[0]!.a.id).toBe('a');
    expect(konflikte.offen[0]!.b.id).toBe('c');
    // Derselbe Termin trägt gleichzeitig eine angenommene und eine offene Kollision.
    expect(konflikte.angenommenIds.has('a')).toBe(true);
    expect(konflikte.hinweisIds.has('a')).toBe(true);
    expect(konflikte.hinweisIds.has('b')).toBe(false);
  });

  it('einer der Termine ist deaktiviert: keine Kollision', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 });
    const b = termin({ id: 'b', deaktiviertBis: 'dauerhaft', timeBeginMin: 540, timeEndMin: 630 });

    const konflikte = ermittleKonflikte([a, b], JETZT_SEK);

    expect(konflikte.offen).toHaveLength(0);
    expect(konflikte.hinweisIds.size).toBe(0);
  });
});

describe('Wirkung eines deaktivierten Termins', () => {
  it('zwei deaktivierte Termine erzeugen keinen Hinweis', () => {
    const a = termin({ id: 'a', deaktiviertBis: 'dauerhaft', timeBeginMin: 480, timeEndMin: 570 });
    const b = termin({ id: 'b', deaktiviertBis: 'dauerhaft', timeBeginMin: 540, timeEndMin: 630 });

    const konflikte = ermittleKonflikte([a, b], JETZT_SEK);

    expect(konflikte.offen).toHaveLength(0);
    expect(konflikte.hinweisIds.size).toBe(0);
  });

  it('ein einmalig deaktivierter Termin gilt nach Ablauf seines Zeitpunkts wieder als aktiv und erzeugt einen Hinweis', () => {
    const a = termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 });
    const b = termin({ id: 'b', deaktiviertBis: 100, timeBeginMin: 540, timeEndMin: 630 });

    expect(ermittleKonflikte([a, b], 50).hinweisIds.size).toBe(0);
    expect(ermittleKonflikte([a, b], 200).hinweisIds.size).toBe(2);
  });
});

describe('Konfliktprüfung paralleler Termine', () => {
  it('ein Kandidat, der mit einem aktiven Termin des Zwischenstands überschneidet, gilt als Konflikt', () => {
    const zwischenstand = [termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 })];

    const stufe = pruefeKandidatGegenZwischenstand(
      { weekday: 'Mon', timeBeginMin: 540, timeEndMin: 630 },
      zwischenstand,
      JETZT_SEK,
    );

    expect(stufe).toBe('konflikt');
  });

  it('ohne Überschneidung gilt der Kandidat als konfliktfrei', () => {
    const zwischenstand = [termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 })];

    const stufe = pruefeKandidatGegenZwischenstand(
      { weekday: 'Mon', timeBeginMin: 570, timeEndMin: 660 },
      zwischenstand,
      JETZT_SEK,
    );

    expect(stufe).toBe('konfliktfrei');
  });

  it('zwei in derselben Sitzung nacheinander gewählte, kollidierende Termine zeigen den Konflikt sofort', () => {
    // Die Nutzerin hat Termin A bereits ausgewählt (noch ungesichert, aber
    // Teil des Zwischenstands) und wählt nun Termin B, der damit kollidiert —
    // ohne dass zwischendurch gesichert wurde.
    const zwischenstandNachA = [termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 })];

    const stufeFuerB = pruefeKandidatGegenZwischenstand(
      { weekday: 'Mon', timeBeginMin: 540, timeEndMin: 630 },
      zwischenstandNachA,
      JETZT_SEK,
    );

    expect(stufeFuerB).toBe('konflikt');
  });

  it('Kollision mit einem deaktivierten Termin des gesicherten Plans gilt als konfliktfrei', () => {
    const zwischenstand = [termin({ id: 'a', deaktiviertBis: 'dauerhaft', timeBeginMin: 480, timeEndMin: 570 })];

    const stufe = pruefeKandidatGegenZwischenstand(
      { weekday: 'Mon', timeBeginMin: 540, timeEndMin: 630 },
      zwischenstand,
      JETZT_SEK,
    );

    expect(stufe).toBe('konfliktfrei');
  });
});

describe('Konfliktprüfung gegenüber angepinnten Terminen', () => {
  it('zwei gleichzeitig unentschiedene Kandidaten werden nicht gegeneinander geprüft', () => {
    // Zu keinem der beiden Kandidaten liegt eine Entscheidung vor — der
    // Zwischenstand ist leer, beide bleiben konfliktfrei.
    const zwischenstand: PlanEntry[] = [];

    const stufeA = pruefeKandidatGegenZwischenstand(
      { weekday: 'Mon', timeBeginMin: 480, timeEndMin: 570 },
      zwischenstand,
      JETZT_SEK,
    );
    const stufeB = pruefeKandidatGegenZwischenstand(
      { weekday: 'Mon', timeBeginMin: 540, timeEndMin: 630 },
      zwischenstand,
      JETZT_SEK,
    );

    expect(stufeA).toBe('konfliktfrei');
    expect(stufeB).toBe('konfliktfrei');
  });

  it('eine in der laufenden Sitzung getroffene, noch ungesicherte Entscheidung zählt für nachfolgende Kandidaten', () => {
    const zwischenstandMitUngesicherterEntscheidung = [
      termin({ id: 'a', timeBeginMin: 480, timeEndMin: 570 }),
    ];

    const stufe = pruefeKandidatGegenZwischenstand(
      { weekday: 'Mon', timeBeginMin: 540, timeEndMin: 630 },
      zwischenstandMitUngesicherterEntscheidung,
      JETZT_SEK,
    );

    expect(stufe).toBe('konflikt');
  });
});
