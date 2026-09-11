import { feiertagAm, feiertageNRW, ostersonntag } from './feiertage';
import { wochentagVonDatum } from './wochenrechnung';

describe('Hinweis auf gesetzlichen Feiertag', () => {
  describe('Osterformel', () => {
    // Bekannte Ostersonntage — Anker gegen einen Rechenfehler in der Formel.
    it.each([
      [2000, '2000-04-23'],
      [2024, '2024-03-31'],
      [2025, '2025-04-20'],
      [2026, '2026-04-05'],
      [2027, '2027-03-28'],
      [2038, '2038-04-25'],
    ])('Ostersonntag %i liegt auf %s', (jahr, erwartet) => {
      expect(ostersonntag(jahr)).toBe(erwartet);
    });

    // Randfall „Osterdatum in unterschiedlichen Jahren": Ostern liegt
    // konstruktionsbedingt immer auf einem Sonntag zwischen dem 22. März
    // (frühestmöglich, zuletzt 1818, nächstes Mal 2285) und dem 25. April
    // (spätestmöglich, zuletzt 1943, nächstes Mal 2038).
    it.each([
      [1818, '1818-03-22'],
      [2285, '2285-03-22'],
      [1943, '1943-04-25'],
    ])('trifft den Randfall Ostersonntag %i (%s)', (jahr, erwartet) => {
      expect(ostersonntag(jahr)).toBe(erwartet);
    });

    it('liegt in jedem Jahr 2000–2100 auf einem Sonntag zwischen dem 22.03. und dem 25.04.', () => {
      const tagesangaben: string[] = [];
      for (let jahr = 2000; jahr <= 2100; jahr++) {
        const datum = ostersonntag(jahr);
        expect(wochentagVonDatum(datum)).toBe('Sun');
        tagesangaben.push(datum.slice(5));
      }
      expect(tagesangaben.every((tag) => tag >= '03-22' && tag <= '04-25')).toBe(true);
      expect([...tagesangaben].sort().at(-1)).toBe('04-25');
    });
  });

  describe('Feiertagsbestand Nordrhein-Westfalen', () => {
    it('umfasst je Jahr genau die elf gesetzlichen Feiertage', () => {
      for (const jahr of [2024, 2025, 2026, 2027]) {
        expect(feiertageNRW(jahr).size).toBe(11);
      }
    });

    // Referenzwerte 2026 aus dem INT-009-Spike (`2026-09-10-int-009-spike-befund`):
    // Pfingstmontag 25.05., Fronleichnam 04.06. — im Raumplan unauffällig, im
    // Kalender gesetzlicher Feiertag.
    it.each([
      ['2026-01-01', 'neujahr'],
      ['2026-04-03', 'karfreitag'],
      ['2026-04-06', 'ostermontag'],
      ['2026-05-01', 'tagDerArbeit'],
      ['2026-05-14', 'christiHimmelfahrt'],
      ['2026-05-25', 'pfingstmontag'],
      ['2026-06-04', 'fronleichnam'],
      ['2026-10-03', 'tagDerDeutschenEinheit'],
      ['2026-11-01', 'allerheiligen'],
      ['2026-12-25', 'ersterWeihnachtstag'],
      ['2026-12-26', 'zweiterWeihnachtstag'],
    ])('erkennt %s als %s', (datum, schluessel) => {
      expect(feiertagAm(datum)).toBe(schluessel);
    });

    it.each([
      ['2025-04-18', 'karfreitag'],
      ['2025-06-09', 'pfingstmontag'],
      ['2025-06-19', 'fronleichnam'],
      ['2024-03-29', 'karfreitag'],
      ['2024-05-20', 'pfingstmontag'],
      ['2024-05-30', 'fronleichnam'],
    ])('erkennt %s auch in anderen Jahren als %s', (datum, schluessel) => {
      expect(feiertagAm(datum)).toBe(schluessel);
    });

    // Der Reformationstag ist in NRW kein gesetzlicher Feiertag (§ 2
    // Feiertagsgesetz NRW), anders als in den norddeutschen Ländern.
    it.each(['2026-10-31', '2026-02-16', '2026-05-24', '2026-12-24', '2026-12-31'])(
      'führt %s nicht als Feiertag',
      (datum) => {
        expect(feiertagAm(datum)).toBeNull();
      },
    );

    // Randfall Jahreswechsel: der 1. Januar gehört zum neuen Jahr, der
    // 26. Dezember zum alten — das Jahr wird aus dem Datum selbst abgeleitet.
    it('trennt am Jahreswechsel richtig', () => {
      expect(feiertagAm('2026-12-26')).toBe('zweiterWeihnachtstag');
      expect(feiertagAm('2026-12-27')).toBeNull();
      expect(feiertagAm('2026-12-31')).toBeNull();
      expect(feiertagAm('2027-01-01')).toBe('neujahr');
      expect(feiertagAm('2027-01-02')).toBeNull();
    });

    it('liefert für eine unbrauchbare Datumsangabe keinen Feiertag', () => {
      expect(feiertagAm('kein-datum')).toBeNull();
    });
  });
});
