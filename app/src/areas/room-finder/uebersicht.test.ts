import type { RaumStatus } from './api';
import { filtereUebersicht, laufendeVeranstaltungen, normalisiereKennung } from './uebersicht';

const frei = (roomId: string): RaumStatus => ({ roomId, zustand: 'frei', besetztMeldungen: 0 });
const belegt = (roomId: string, bezeichnung: string, ende: string, note?: string): RaumStatus => ({
  roomId,
  zustand: 'belegt',
  besetztMeldungen: 0,
  aktuellerTermin: {
    roomId,
    bezeichnung,
    beginn: '2026-11-26T08:00:00Z',
    ende,
    art: 'lehrveranstaltung',
    note: note ?? null,
  },
});

const raeume = [frei('A.E.01'), belegt('C.E.44', 'Datenbanken', '2026-11-26T10:00:00Z'), frei('C.E.40')];

describe('Übersicht nach Belegungszustand einschränken', () => {
  it('nur freie bzw. nur belegte Räume', () => {
    expect(filtereUebersicht(raeume, 'frei', '').map((r) => r.roomId)).toEqual(['A.E.01', 'C.E.40']);
    expect(filtereUebersicht(raeume, 'belegt', '').map((r) => r.roomId)).toEqual(['C.E.44']);
    expect(filtereUebersicht(raeume, 'alle', '')).toHaveLength(3);
  });

  it('Übersicht ohne passenden Raum ergibt eine leere Liste', () => {
    expect(filtereUebersicht([frei('A')], 'belegt', '')).toEqual([]);
  });
});

describe('Suche nach Raumkennung in der Übersicht', () => {
  it('Raumkennung in der Übersicht suchen: Teilkennung, ohne Rücksicht auf Groß-/Kleinschreibung', () => {
    expect(filtereUebersicht(raeume, 'alle', 'c.e.4').map((r) => r.roomId)).toEqual(['C.E.44', 'C.E.40']);
    expect(filtereUebersicht(raeume, 'frei', ' c.e ').map((r) => r.roomId)).toEqual(['C.E.40']);
  });

  it('gleicht die Eingabe an die Schreibweise der Kennungen an', () => {
    expect(normalisiereKennung('  c.e.44 ')).toBe('C.E.44');
  });
});

describe('Ansicht laufender Veranstaltungen', () => {
  it('Keine laufende Veranstaltung: leere Liste', () => {
    expect(laufendeVeranstaltungen([frei('A'), frei('B')])).toEqual([]);
  });

  it('gruppiert eine Veranstaltung über mehrere Räume und sortiert nach Ende', () => {
    const liste = laufendeVeranstaltungen([
      belegt('C.E.44', 'Mathe', '2026-11-26T11:00:00Z'),
      belegt('A.E.02', 'Datenbanken', '2026-11-26T10:00:00Z', 'Bitte Laptop mitbringen'),
      belegt('A.E.01', 'Datenbanken', '2026-11-26T10:00:00Z'),
      frei('B'),
    ]);
    expect(liste).toEqual([
      expect.objectContaining({ bezeichnung: 'Datenbanken', raeume: ['A.E.01', 'A.E.02'], note: 'Bitte Laptop mitbringen' }),
      expect.objectContaining({ bezeichnung: 'Mathe', raeume: ['C.E.44'] }),
    ]);
  });

  it('überspringt einen Termin ohne auswertbare Zeitangabe und protokolliert ihn', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const liste = laufendeVeranstaltungen([belegt('A', 'X', 'kaputt'), belegt('B', 'Y', '2026-11-26T10:00:00Z')]);
    expect(liste.map((v) => v.bezeichnung)).toEqual(['Y']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
