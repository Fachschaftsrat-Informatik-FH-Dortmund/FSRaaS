import type { Raum, RaumStatus } from './api';
import { filterGesetzt, freieRaeume, OHNE_FILTER } from './freieRaeume';

// 26.11.2026, Ortszeit des Testlaufs.
const at = (h: number, m = 0) => new Date(2026, 10, 26, h, m);
const iso = (h: number, m = 0) => at(h, m).toISOString();

const raum = (roomId: string, over: Partial<Raum> = {}): Raum => ({
  roomId,
  groesse: 'mittel',
  ekeyZugaenglich: false,
  schliesszeit: null,
  ...over,
});

const frei = (roomId: string, naechsterBeginn?: number): RaumStatus => ({
  roomId,
  zustand: 'frei',
  besetztMeldungen: 0,
  naechsterTermin:
    naechsterBeginn === undefined
      ? undefined
      : { roomId, beginn: iso(naechsterBeginn), ende: iso(naechsterBeginn + 1), bezeichnung: 'Folgetermin' },
});

const belegt = (roomId: string, art: 'lehrveranstaltung' | 'pruefung' = 'lehrveranstaltung'): RaumStatus => ({
  roomId,
  zustand: 'belegt',
  besetztMeldungen: 0,
  aktuellerTermin: { roomId, beginn: iso(9), ende: iso(11), bezeichnung: 'Läuft', art },
});

describe('Suche nach freien Räumen', () => {
  it('Zeitraum ohne belegte Räume: liefert die freien Räume, eine leere Liste ist kein Fehler', () => {
    expect(freieRaeume([frei('A.E.01')], [raum('A.E.01')], at(10), at(12)).map((r) => r.roomId)).toEqual(['A.E.01']);
    expect(freieRaeume([], [], at(10), at(12))).toEqual([]);
  });

  it('Termin beginnt innerhalb des Zeitraums: Raum ist nicht frei', () => {
    expect(freieRaeume([frei('A.E.01', 11)], [raum('A.E.01')], at(10), at(12))).toEqual([]);
  });

  it('Termin beginnt genau zum Ende des Zeitraums: Raum ist frei', () => {
    expect(freieRaeume([frei('A.E.01', 12)], [raum('A.E.01')], at(10), at(12))).toHaveLength(1);
  });

  it('Kuratierter Raum ohne Raumplan-Eintrag wird nicht als frei ausgewiesen', () => {
    expect(freieRaeume([], [raum('A.E.01')], at(10), at(12))).toEqual([]);
  });

  it('Termin ohne auswertbare Zeitangabe: Raum nicht als frei ausgewiesen, Vorfall protokolliert', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const kaputt: RaumStatus = {
      ...frei('A.E.01'),
      naechsterTermin: { roomId: 'A.E.01', beginn: 'kaputt', ende: 'kaputt' },
    };
    expect(freieRaeume([kaputt], [raum('A.E.01')], at(10), at(12))).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('sortiert nach Raumkennung', () => {
    const ergebnis = freieRaeume([frei('C.E.40'), frei('A.E.01')], [raum('C.E.40'), raum('A.E.01')], at(10), at(12));
    expect(ergebnis.map((r) => r.roomId)).toEqual(['A.E.01', 'C.E.40']);
  });
});

describe('Raum als belegt kennzeichnen', () => {
  it('Prüfungstermin belegt den Raum ebenso wie eine Lehrveranstaltung', () => {
    const ergebnis = freieRaeume(
      [belegt('A.E.01', 'pruefung'), belegt('A.E.02')],
      [raum('A.E.01'), raum('A.E.02')],
      at(10),
      at(12),
    );
    expect(ergebnis).toEqual([]);
  });
});

describe('Raumsuche auf kuratierte Liste beschränken', () => {
  it('Nicht kuratierter Raum ist kein Suchergebnis', () => {
    const ergebnis = freieRaeume([frei('A.E.01'), frei('Z.9.99')], [raum('A.E.01')], at(10), at(12));
    expect(ergebnis.map((r) => r.roomId)).toEqual(['A.E.01']);
  });
});

describe('Größenklasse anzeigen und filtern', () => {
  const kuratiert = [raum('A', { groesse: 'klein' }), raum('B', { groesse: 'mittel' }), raum('C', { groesse: 'gross' })];
  const status = [frei('A'), frei('B'), frei('C')];

  it('Nach Größenklasse filtern: nur Räume genau dieser Größenklasse', () => {
    const ergebnis = freieRaeume(status, kuratiert, at(10), at(12), { groesse: 'mittel', nurEkey: false });
    expect(ergebnis.map((r) => r.roomId)).toEqual(['B']);
  });

  it('jedes Ergebnis trägt seine Größenklasse', () => {
    expect(freieRaeume(status, kuratiert, at(10), at(12)).map((r) => r.groesse)).toEqual(['klein', 'mittel', 'gross']);
  });

  it('erkennt gesetzte Filter', () => {
    expect(filterGesetzt(OHNE_FILTER)).toBe(false);
    expect(filterGesetzt({ groesse: 'klein', nurEkey: false })).toBe(true);
    expect(filterGesetzt({ groesse: 'alle', nurEkey: true })).toBe(true);
  });
});

describe('E-Key-Zugänglichkeit kennzeichnen', () => {
  it('nur mit E-Key zugängliche Räume, wenn so eingeschränkt; das Kennzeichen steht am Ergebnis', () => {
    const ergebnis = freieRaeume(
      [frei('A'), frei('B')],
      [raum('A', { ekeyZugaenglich: true }), raum('B')],
      at(10),
      at(12),
      { groesse: 'alle', nurEkey: true },
    );
    expect(ergebnis).toEqual([expect.objectContaining({ roomId: 'A', ekeyZugaenglich: true })]);
  });
});

describe('Freizeitpunkt eines freien Raums anzeigen', () => {
  it('frei bis zum Beginn des nächsten Termins', () => {
    const [r] = freieRaeume([frei('A', 14)], [raum('A', { schliesszeit: '21:30' })], at(10), at(12));
    expect(r.freiBis).toEqual(at(14));
    expect(r.freiBisSchliesszeit).toBe(false);
  });
});

describe('Gepflegte Gebäudeschließzeit statt fester Wert', () => {
  it('Kein nachfolgender Termin: frei bis zur gepflegten Schließzeit', () => {
    const [r] = freieRaeume([frei('A')], [raum('A', { schliesszeit: '21:30' })], at(10), at(12));
    expect(r.freiBis).toEqual(at(21, 30));
    expect(r.freiBisSchliesszeit).toBe(true);
  });

  it('Schließzeit vor dem nächsten Termin geht vor', () => {
    const [r] = freieRaeume([frei('A', 22)], [raum('A', { schliesszeit: '20:00' })], at(10), at(12));
    expect(r.freiBis).toEqual(at(20));
  });

  it('Keine Schließzeit gepflegt: kein Endzeitpunkt', () => {
    const [r] = freieRaeume([frei('A')], [raum('A')], at(10), at(12));
    expect(r.freiBis).toBeNull();
  });

  it('Zeitraum über die Schließzeit hinaus: nicht frei', () => {
    expect(freieRaeume([frei('A')], [raum('A', { schliesszeit: '21:00' })], at(20), at(22))).toEqual([]);
  });

  it('nach der Schließzeit: nicht frei', () => {
    expect(freieRaeume([frei('A')], [raum('A', { schliesszeit: '21:00' })], at(21, 30), at(22))).toEqual([]);
  });
});
