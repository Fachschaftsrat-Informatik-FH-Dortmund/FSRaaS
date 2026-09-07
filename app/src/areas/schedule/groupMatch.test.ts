import { logError } from '@/errors/AppError';

import { gruppenzugehoerig, parseStudentSet, zaehleGruppenTreffer } from './groupMatch';

jest.mock('@/errors/AppError', () => ({
  logError: jest.fn(),
}));

describe('QA-F-030 Beispieltabelle aus spec.md Abschnitt 4 (Gruppenzuordnung)', () => {
  // Jede Zeile exakt wie in der Spec-Tabelle, inklusive der dort genannten Begründung.
  const faelle: { kennung: string | null; studentSet: string; erwartet: boolean; grund: string }[] = [
    { kennung: null, studentSet: 'C8', erwartet: true, grund: 'ohne Gruppenkennung gelten alle Termine als zugehörig' },
    { kennung: 'C8', studentSet: 'C8', erwartet: true, grund: 'Einzelwert, Buchstabenteil stimmt überein' },
    { kennung: 'C8', studentSet: 'C3', erwartet: true, grund: 'Einzelwert, nur der Buchstabe zählt' },
    { kennung: 'C8', studentSet: 'D3', erwartet: false, grund: 'Einzelwert, Buchstabe C weicht von D ab' },
    { kennung: 'C8', studentSet: '*', erwartet: true, grund: 'Wildcard gilt für jede Gruppenkennung' },
    { kennung: 'B5', studentSet: 'A1-C9', erwartet: true, grund: 'Buchstabe B liegt echt zwischen A und C' },
    { kennung: 'A1', studentSet: 'A1-C9', erwartet: true, grund: 'Paar entspricht genau der Anfangsgrenze' },
    { kennung: 'A0', studentSet: 'A1-C9', erwartet: false, grund: 'Zahl liegt unterhalb der Anfangsgrenze' },
    { kennung: 'C9', studentSet: 'A1-C9', erwartet: true, grund: 'Paar entspricht genau der Endgrenze' },
    {
      kennung: 'C10',
      studentSet: 'A1-C9',
      erwartet: false,
      grund: 'numerischer Vergleich: 10 > 9 (ein Zeichenkettenvergleich läge hier fälschlich bei ja)',
    },
    { kennung: 'D2', studentSet: 'A1-C9', erwartet: false, grund: 'Buchstabe D liegt außerhalb A bis C' },
    { kennung: 'A5', studentSet: 'A-C9', erwartet: true, grund: 'offene Anfangsgrenze, jede Zahl bei A zählt' },
    { kennung: 'C1', studentSet: 'A1-C', erwartet: true, grund: 'offene Endgrenze, jede Zahl bei C zählt' },
    { kennung: 'M3', studentSet: 'A-P', erwartet: true, grund: 'Bereich ohne Zahlen an beiden Grenzen, M liegt dazwischen' },
    { kennung: 'M3', studentSet: 'M-N', erwartet: true, grund: 'Bereich ohne Zahlen, M entspricht der Anfangsgrenze' },
    { kennung: 'M3', studentSet: 'C-D', erwartet: false, grund: 'M liegt außerhalb von C bis D' },
    { kennung: 'M3', studentSet: 'A', erwartet: false, grund: 'Einzelwert ohne Zahl, Buchstabe A weicht von M ab' },
    { kennung: 'D2', studentSet: 'D', erwartet: true, grund: 'Einzelwert ohne Zahl, Buchstabe stimmt überein' },
    { kennung: 'D2', studentSet: 'C5-E', erwartet: true, grund: 'gemischte Grenzen, Paar liegt dazwischen' },
    { kennung: 'C4', studentSet: 'C5-E', erwartet: false, grund: 'Buchstabe gleich Anfangsgrenze, Zahl 4 kleiner als 5' },
    { kennung: 'M5', studentSet: 'J-M4', erwartet: false, grund: 'Buchstabe gleich Endgrenze M, Zahl 5 größer als 4' },
    { kennung: 'H3', studentSet: 'H5-J', erwartet: false, grund: 'Buchstabe gleich Anfangsgrenze H, Zahl 3 kleiner als 5' },
    {
      kennung: 'C8',
      studentSet: 'A1B2',
      erwartet: true,
      grund: 'unbekanntes Muster, sicherer Rückfall auf zugehörig statt fälschlich fremd (SEC-F-060)',
    },
    // Kennung ohne Zahl: seit dem 2026-09-06 unzulässig, über eine bestätigte
    // INT-019-Antwort aber weiterhin möglich — der Vorschlag wird ungeprüft
    // übernommen, und der Endpunkt ist undokumentiert und ohne SLA.
    { kennung: 'H', studentSet: 'H5-J', erwartet: true, grund: 'unvollständig an der Anfangsgrenze mit Zahl, nicht entscheidbar' },
    { kennung: 'C', studentSet: 'C5-E', erwartet: true, grund: 'unvollständig an der Anfangsgrenze mit Zahl, nicht entscheidbar' },
    { kennung: 'M', studentSet: 'J-M4', erwartet: true, grund: 'unvollständig an der Endgrenze mit Zahl, nicht entscheidbar' },
    { kennung: 'D', studentSet: 'A1-C9', erwartet: false, grund: 'unvollständig, aber der Buchstabe D entscheidet allein — außerhalb A bis C' },
  ];

  it.each(faelle)('$kennung gegen studentSet=$studentSet → $erwartet ($grund)', ({ kennung, studentSet, erwartet }) => {
    expect(gruppenzugehoerig(kennung, studentSet)).toBe(erwartet);
  });
});

describe('SCHED-F-050 ohne Gruppenkennung sind alle Termine zugehörig', () => {
  it('liefert true, wenn keine Gruppenkennung angegeben ist', () => {
    expect(gruppenzugehoerig(null, 'C8')).toBe(true);
    expect(gruppenzugehoerig(undefined, 'A1-C9')).toBe(true);
    expect(gruppenzugehoerig('', 'D3')).toBe(true);
  });
});

describe('SCHED-F-060 Wildcard studentSet gilt für jede Gruppenkennung', () => {
  it('trifft unabhängig von der eingegebenen Gruppenkennung zu', () => {
    expect(gruppenzugehoerig('Z9', '*')).toBe(true);
    expect(gruppenzugehoerig('A1', '*')).toBe(true);
  });
});

describe('SCHED-F-070 Einzelwert-studentSet vergleicht nur den Buchstabenteil', () => {
  it('trifft zu, wenn der Buchstabe übereinstimmt — unabhängig von der Zahl im studentSet', () => {
    expect(gruppenzugehoerig('C8', 'C8')).toBe(true);
    expect(gruppenzugehoerig('C8', 'C3')).toBe(true);
  });

  it('trifft nicht zu, wenn der Buchstabe abweicht', () => {
    expect(gruppenzugehoerig('C8', 'D3')).toBe(false);
  });

  it('behandelt einen Einzelwert ohne Zahl gleich — die real vorkommende Form', () => {
    expect(gruppenzugehoerig('D2', 'D')).toBe(true);
    expect(gruppenzugehoerig('M3', 'A')).toBe(false);
  });

  it('vergleicht ausdrücklich den Buchstaben, nicht die Zahl der Kennung (Fehler der Alt-App)', () => {
    // schedule_overview_viewmodel.dart:216 verglich info.groupNumber mit dem
    // ersten Zeichen des studentSet — ein Vergleich, der nie zutreffen kann.
    expect(gruppenzugehoerig('C3', 'C9')).toBe(true);
  });
});

describe('SCHED-F-080 Bereichs-studentSet vergleicht das Paar (Buchstabe, Zahl) numerisch', () => {
  it('schließt beide Grenzen ein', () => {
    expect(gruppenzugehoerig('A1', 'A1-C9')).toBe(true);
    expect(gruppenzugehoerig('C9', 'A1-C9')).toBe(true);
  });

  it('trifft für einen Buchstaben echt innerhalb des Bereichs unabhängig von der Zahl zu', () => {
    expect(gruppenzugehoerig('B5', 'A1-C9')).toBe(true);
  });

  it('trifft außerhalb der Grenzen nicht zu', () => {
    expect(gruppenzugehoerig('A0', 'A1-C9')).toBe(false);
    expect(gruppenzugehoerig('D2', 'A1-C9')).toBe(false);
  });

  it('vergleicht die Zahl numerisch, nicht als Zeichenkette', () => {
    // Als Zeichenkette wäre "10" < "9", der Termin also fälschlich zugehörig.
    expect(gruppenzugehoerig('C10', 'A1-C9')).toBe(false);
    expect(gruppenzugehoerig('C10', 'A1-C99')).toBe(true);
  });

  it('behandelt gemischte Grenzen, bei denen nur eine Seite eine Zahl trägt', () => {
    expect(gruppenzugehoerig('D2', 'C5-E')).toBe(true);
    expect(gruppenzugehoerig('C4', 'C5-E')).toBe(false);
    expect(gruppenzugehoerig('M5', 'J-M4')).toBe(false);
    expect(gruppenzugehoerig('H3', 'H5-J')).toBe(false);
  });
});

describe('SCHED-F-090 offene Bereichsgrenzen ohne Zahl', () => {
  it('parst eine Grenze ohne Zahl als offen (zahl: null)', () => {
    const geparst = parseStudentSet('A-C9');
    expect(geparst).toEqual({ art: 'bereich', von: { buchstabe: 'A', zahl: null }, bis: { buchstabe: 'C', zahl: 9 } });
  });

  it('parst einen Bereich ohne Zahlen an beiden Grenzen', () => {
    expect(parseStudentSet('A-P')).toEqual({
      art: 'bereich',
      von: { buchstabe: 'A', zahl: null },
      bis: { buchstabe: 'P', zahl: null },
    });
  });
});

describe('SEC-F-060 unbekanntes studentSet-Muster fällt sicher auf zugehörig zurück', () => {
  const logErrorMock = jest.mocked(logError);

  beforeEach(() => logErrorMock.mockClear());

  it('behandelt ein Muster wie A1B2 als zugehörig und protokolliert den Vorfall', () => {
    expect(gruppenzugehoerig('C8', 'A1B2')).toBe(true);
    expect(logErrorMock).toHaveBeenCalledTimes(1);
    expect(logErrorMock.mock.calls[0]![0]).toBe('groupMatch.studentSet');
  });

  it('erkennt A1B2 beim reinen Parsen als unbekanntes Muster', () => {
    expect(parseStudentSet('A1B2')).toEqual({ art: 'unbekannt', roh: 'A1B2' });
  });
});

describe('Bereichsangabe im studentSet — unvollständige Gruppenkennung ohne Zahl', () => {
  const logErrorMock = jest.mocked(logError);

  beforeEach(() => logErrorMock.mockClear());

  it('behandelt sie an einer Grenze mit Zahl als zugehörig und protokolliert den Vorfall', () => {
    // Vor dem 2026-09-06 wurde die fehlende Zahl als 0 gelesen; 0 < 5 machte den
    // Termin fälschlich gruppenfremd und blendete ihn bei aktivem Schalter aus.
    expect(gruppenzugehoerig('H', 'H5-J')).toBe(true);
    expect(logErrorMock).toHaveBeenCalledTimes(1);
    expect(logErrorMock.mock.calls[0]![0]).toBe('groupMatch.gruppenkennung');
  });

  it('behandelt sie an der Endgrenze mit Zahl ebenso', () => {
    expect(gruppenzugehoerig('M', 'J-M4')).toBe(true);
    expect(logErrorMock).toHaveBeenCalledTimes(1);
  });

  it('entscheidet allein über den Buchstaben, wo dieser schon außerhalb liegt — ohne Protokolleintrag', () => {
    expect(gruppenzugehoerig('D', 'A1-C9')).toBe(false);
    expect(logErrorMock).not.toHaveBeenCalled();
  });

  it('protokolliert nicht, wenn beide Grenzen ohne Zahl sind — die fehlende Zahl entscheidet dort nichts', () => {
    expect(gruppenzugehoerig('M', 'A-P')).toBe(true);
    expect(logErrorMock).not.toHaveBeenCalled();
  });

  it('vergleicht bei einem Einzelwert weiterhin nur den Buchstaben', () => {
    expect(gruppenzugehoerig('D', 'D')).toBe(true);
    expect(gruppenzugehoerig('D', 'C')).toBe(false);
    expect(logErrorMock).not.toHaveBeenCalled();
  });
});

describe('SCHED-F-650 Rückmeldung, wie viele Termine des Auswahlbestands eine Gruppenkennung einschließt', () => {
  const termine = [
    { studentSet: 'C8' },
    { studentSet: 'D3' },
    { studentSet: 'A1-C9' },
    { studentSet: '*' },
  ];

  it('zählt die eingeschlossenen Termine gegenüber der Gesamtzahl des Auswahlbestands', () => {
    // C8 (Einzelwert, Buchstabe stimmt), A1-C9 (Bereich, C liegt an der
    // Endgrenze) und * (Wildcard) zählen; D3 nicht (Buchstabe weicht ab).
    expect(zaehleGruppenTreffer('C3', termine)).toEqual({ eingeschlossen: 3, gesamt: 4 });
  });

  it('meldet „0 von N" als reguläres Ergebnis, nicht als Fehler, wenn keiner passt', () => {
    expect(zaehleGruppenTreffer('Z9', [{ studentSet: 'A' }, { studentSet: 'B' }])).toEqual({
      eingeschlossen: 0,
      gesamt: 2,
    });
  });

  it('meldet „0 von 0", wenn der Auswahlbestand leer ist', () => {
    expect(zaehleGruppenTreffer('C8', [])).toEqual({ eingeschlossen: 0, gesamt: 0 });
  });

  it('zählt ohne Gruppenkennung jeden Termin als eingeschlossen (SCHED-F-050)', () => {
    expect(zaehleGruppenTreffer(null, termine)).toEqual({ eingeschlossen: 4, gesamt: 4 });
  });
});
