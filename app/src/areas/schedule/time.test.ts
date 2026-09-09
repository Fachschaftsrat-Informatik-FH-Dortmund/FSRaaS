import { istAktiv, minutenZuZeit, padZeit, sortiereNachBeginnzeit, ueberschneidenSich, zeitZuMinuten } from './time';

describe('QA-F-040 FBWS-Zeitfelder auf HHmm mit führenden Nullen auffüllen', () => {
  it('füllt eine Zahl ohne führende Null auf vier Stellen auf', () => {
    expect(padZeit(800)).toBe('0800');
    expect(padZeit(930)).toBe('0930');
  });

  it('lässt eine bereits vierstellige Zeit unverändert', () => {
    expect(padZeit(1215)).toBe('1215');
  });

  it('behandelt eine Zahl genauso wie dieselbe Zeichenkette', () => {
    expect(padZeit(800)).toBe(padZeit('800'));
    expect(padZeit('930')).toBe(padZeit(930));
  });
});

describe('QA-F-040 Umrechnung in Minuten seit Mitternacht und zurück', () => {
  it('rechnet eine aufgefüllte Zeit in Minuten seit Mitternacht um', () => {
    expect(zeitZuMinuten(800)).toBe(8 * 60);
    expect(zeitZuMinuten('930')).toBe(9 * 60 + 30);
    expect(zeitZuMinuten(1215)).toBe(12 * 60 + 15);
  });

  it('formatiert Minuten seit Mitternacht als HHmm zurück', () => {
    expect(minutenZuZeit(8 * 60)).toBe('0800');
    expect(minutenZuZeit(9 * 60 + 30)).toBe('0930');
    expect(minutenZuZeit(12 * 60 + 15)).toBe('1215');
  });

  it('ist für Zahl und Zeichenkette wechselseitig zueinander invers', () => {
    for (const wert of [800, '930', 1215, '0']) {
      expect(zeitZuMinuten(minutenZuZeit(zeitZuMinuten(wert)))).toBe(zeitZuMinuten(wert));
    }
  });
});

describe('Überschneidungsprüfung zweier Zeiträume', () => {
  it('erkennt eine echte Überschneidung', () => {
    expect(ueberschneidenSich(8 * 60, 10 * 60, 9 * 60, 11 * 60)).toBe(true);
  });

  it('erkennt vollständige Einbettung als Überschneidung', () => {
    expect(ueberschneidenSich(8 * 60, 12 * 60, 9 * 60, 10 * 60)).toBe(true);
  });

  it('behandelt aneinandergrenzende Zeiträume nicht als Überschneidung', () => {
    expect(ueberschneidenSich(8 * 60, 9 * 60 + 30, 9 * 60 + 30, 11 * 60)).toBe(false);
  });

  it('erkennt zwei völlig getrennte Zeiträume als überschneidungsfrei', () => {
    expect(ueberschneidenSich(8 * 60, 9 * 60, 10 * 60, 11 * 60)).toBe(false);
  });
});

describe('SCHED-F-252 Termine eines Wochentags nach Beginnzeit sortieren', () => {
  it('sortiert aufsteigend nach timeBeginMin', () => {
    const termine = [{ timeBeginMin: 720 }, { timeBeginMin: 480 }, { timeBeginMin: 600 }];
    expect(sortiereNachBeginnzeit(termine).map((t) => t.timeBeginMin)).toEqual([480, 600, 720]);
  });

  it('verändert die übergebene Liste nicht (reine Funktion)', () => {
    const termine = [{ timeBeginMin: 720 }, { timeBeginMin: 480 }];
    const original = [...termine];
    sortiereNachBeginnzeit(termine);
    expect(termine).toEqual(original);
  });

  it('ist stabil bei gleicher Beginnzeit', () => {
    const termine = [
      { timeBeginMin: 600, name: 'a' },
      { timeBeginMin: 600, name: 'b' },
    ];
    expect(sortiereNachBeginnzeit(termine).map((t) => t.name)).toEqual(['a', 'b']);
  });
});

describe('Wirkung eines deaktivierten Termins: Auswertung von deaktiviertBis', () => {
  it('gilt als aktiv, wenn deaktiviertBis null ist', () => {
    expect(istAktiv({ deaktiviertBis: null }, 1_000)).toBe(true);
  });

  it('gilt als deaktiviert, wenn deaktiviertBis dauerhaft ist, unabhängig von der Zeit', () => {
    expect(istAktiv({ deaktiviertBis: 'dauerhaft' }, 1_000)).toBe(false);
    expect(istAktiv({ deaktiviertBis: 'dauerhaft' }, Number.MAX_SAFE_INTEGER)).toBe(false);
  });

  it('gilt bei einem Zeitpunkt als deaktiviert, bis dieser erreicht ist, danach als aktiv', () => {
    expect(istAktiv({ deaktiviertBis: 2_000 }, 1_000)).toBe(false);
    expect(istAktiv({ deaktiviertBis: 2_000 }, 1_999 )).toBe(false);
    expect(istAktiv({ deaktiviertBis: 2_000 }, 2_000)).toBe(true);
    expect(istAktiv({ deaktiviertBis: 2_000 }, 2_001)).toBe(true);
  });
});
