import { ausgabezeitFuer, istGeoeffnet, oeffnungszeitFuer, schliessungFuer } from './oeffnungszeiten';
import type { Oeffnungsangaben, Oeffnungstag, Schliesstag } from './api';

// 2026-09-07 ist ein Montag, 2026-09-11 ein Freitag, 2026-09-12 ein Samstag,
// 2026-09-13 ein Sonntag.

const tag = (t: Partial<Oeffnungstag>): Oeffnungstag => ({ geoeffnet: true, ...t }) as Oeffnungstag;

const angaben = (teile: Partial<Oeffnungsangaben>): Oeffnungsangaben =>
  ({
    mensaId: 'M',
    heute: tag({ datum: '2026-09-07', wochentag: 1 }),
    wochenplan: [],
    vorausschau: [],
    schliesstage: [],
    standAlter: { abgerufenAm: '2026-09-07T08:00:00Z' },
    ...teile,
  }) as Oeffnungsangaben;

const wochenplan = angaben({
  wochenplan: [
    tag({ wochentag: 1, oeffnet: '11:30', schliesst: '14:45' }),
    tag({ wochentag: 5, oeffnet: '11:30', schliesst: '14:15' }),
    tag({ wochentag: 6, geoeffnet: false }),
    tag({ wochentag: 7, geoeffnet: false }),
  ],
});

describe('Öffnungszeiten je Mensa und Wochentag', () => {
  it('löst die Öffnungszeit über den Wochentag des angezeigten Tages auf', () => {
    expect(oeffnungszeitFuer(wochenplan, '2026-09-07')).toBe('11:30 - 14:45');
    expect(oeffnungszeitFuer(wochenplan, '2026-09-11')).toBe('11:30 - 14:15');
  });

  it('liefert für einen geschlossenen Tag keine Öffnungszeit', () => {
    expect(oeffnungszeitFuer(wochenplan, '2026-09-12')).toBeNull();
    expect(oeffnungszeitFuer(wochenplan, '2026-09-13')).toBeNull();
  });

  it('lässt einen im Wochenplan gar nicht geführten Tag ohne Angabe', () => {
    // Dienstag fehlt im Plan — keine Angabe, kein Fehler.
    expect(oeffnungszeitFuer(wochenplan, '2026-09-08')).toBeNull();
    expect(istGeoeffnet(wochenplan, '2026-09-08')).toBeUndefined();
  });

  it('zieht die datierte Vorausschau dem regulären Wochenplan vor', () => {
    // Am Montag ausnahmsweise geschlossen, obwohl der Wochenplan ihn führt.
    const mitVorausschau = angaben({
      wochenplan: wochenplan.wochenplan,
      vorausschau: [tag({ datum: '2026-09-07', wochentag: 1, geoeffnet: false, grund: 'Betriebsferien' })],
    });

    expect(oeffnungszeitFuer(mitVorausschau, '2026-09-07')).toBeNull();
    expect(istGeoeffnet(mitVorausschau, '2026-09-07')).toBe(false);
    // Ein Tag außerhalb der Vorausschau fällt weiterhin auf den Wochenplan zurück.
    expect(oeffnungszeitFuer(mitVorausschau, '2026-09-11')).toBe('11:30 - 14:15');
  });

  it('liefert ohne Öffnungsangaben nichts', () => {
    expect(oeffnungszeitFuer(undefined, '2026-09-07')).toBeNull();
    expect(istGeoeffnet(undefined, '2026-09-07')).toBeUndefined();
  });
});

describe('Ausweis der Ausgabezeit bei abweichender Öffnungszeit', () => {
  it('weist die Ausgabezeit aus, wo die Quelle eine abweichende führt', () => {
    // Max-Ophüls-Platz: offen ab 08:00, Essensausgabe ab 11:30.
    const max = angaben({
      wochenplan: [tag({ wochentag: 1, oeffnet: '08:00', schliesst: '14:15', ausgabeBeginn: '11:30' })],
    });

    expect(oeffnungszeitFuer(max, '2026-09-07')).toBe('08:00 - 14:15');
    expect(ausgabezeitFuer(max, '2026-09-07')).toBe('11:30 - 14:15');
  });

  it('weist ohne Abweichung allein die Öffnungszeit aus', () => {
    // Hauptmensa: die Quelle setzt servingOpen nur bei Abweichung.
    expect(oeffnungszeitFuer(wochenplan, '2026-09-07')).toBe('11:30 - 14:45');
    expect(ausgabezeitFuer(wochenplan, '2026-09-07')).toBeNull();
  });
});

describe('Grund und Zeitraum einer Schließung', () => {
  const schliesstag = (t: Partial<Schliesstag>): Schliesstag =>
    ({ bezeichnung: 'Betriebsferien', feiertag: false, geltungsbereich: 'mensa', ...t }) as Schliesstag;

  it('nennt Grund und Enddatum einer Schließung (Mensa Süd, Betriebsferien bis 04.10.)', () => {
    const sued = angaben({
      vorausschau: [
        tag({ datum: '2026-09-07', wochentag: 1, geoeffnet: false, grund: 'Restaurant-Schließtag: Betriebsferien' }),
      ],
      schliesstage: [schliesstag({ von: '2026-08-28', bis: '2026-10-04' })],
    });
    expect(schliessungFuer(sued, '2026-09-07')).toEqual({
      grund: 'Restaurant-Schließtag: Betriebsferien',
      bis: '2026-10-04',
    });
  });

  it('nennt allein den Grund ohne passenden Schließzeitraum', () => {
    const ohneZeitraum = angaben({
      vorausschau: [
        tag({ datum: '2026-09-07', wochentag: 1, geoeffnet: false, grund: 'Feiertag' }),
      ],
      schliesstage: [],
    });
    expect(schliessungFuer(ohneZeitraum, '2026-09-07')).toEqual({ grund: 'Feiertag', bis: null });
  });

  it('liefert nichts ohne Grundangabe', () => {
    const ohneGrund = angaben({
      vorausschau: [tag({ datum: '2026-09-07', wochentag: 1, geoeffnet: false })],
      schliesstage: [schliesstag({ von: '2026-09-01', bis: '2026-09-10' })],
    });
    expect(schliessungFuer(ohneGrund, '2026-09-07')).toBeNull();
  });

  it('liefert nichts für einen geöffneten Tag', () => {
    expect(schliessungFuer(wochenplan, '2026-09-07')).toBeNull();
  });

  it('liefert nichts ohne Öffnungsangaben', () => {
    expect(schliessungFuer(undefined, '2026-09-07')).toBeNull();
  });
});
