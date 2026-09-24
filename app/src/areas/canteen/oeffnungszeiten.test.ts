import { ausgabezeitFuer, istGeoeffnet, oeffnungszeitFuer, schliessungFuer } from './oeffnungszeiten';
import type { Oeffnungsangaben, Oeffnungstag } from './api';

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
  // Mensa Süd, Stand 2026-09-22: Betriebsferien bis zum 04.10.
  const betriebsferien = angaben({
    wochenplan: [tag({ wochentag: 1, oeffnet: '11:30', schliesst: '14:15' })],
    vorausschau: [
      tag({
        datum: '2026-09-07',
        wochentag: 1,
        geoeffnet: false,
        grund: 'Restaurant-Schließtag: Betriebsferien',
      }),
    ],
    schliesstage: [
      {
        bezeichnung: 'Betriebsferien',
        von: '2026-09-01',
        bis: '2026-10-04',
        feiertag: false,
        geltungsbereich: 'mensa',
      },
    ],
  });

  it('nennt Grund und Enddatum der Schließung', () => {
    expect(schliessungFuer(betriebsferien, '2026-09-07')).toEqual({
      grund: 'Restaurant-Schließtag: Betriebsferien',
      bis: '2026-10-04',
    });
  });

  it('nimmt die Bezeichnung des Schließtags, wo der Tag selbst keinen Grund führt', () => {
    const ohneGrundAmTag = angaben({
      wochenplan: betriebsferien.wochenplan,
      vorausschau: [tag({ datum: '2026-09-07', wochentag: 1, geoeffnet: false })],
      schliesstage: betriebsferien.schliesstage,
    });

    expect(schliessungFuer(ohneGrundAmTag, '2026-09-07')).toEqual({
      grund: 'Betriebsferien',
      bis: '2026-10-04',
    });
  });

  it('liefert ohne jede Grundangabe nichts — es bleibt beim Geschlossen-Hinweis', () => {
    // Samstag: im Wochenplan geschlossen, ohne Grund und ohne Schließtag.
    expect(schliessungFuer(wochenplan, '2026-09-12')).toBeNull();
  });

  it('liefert für eine geöffnete Mensa nichts', () => {
    expect(schliessungFuer(betriebsferien, '2026-09-14')).toBeNull(); // Montag, laut Wochenplan offen
  });

  it('nennt ein Enddatum nicht, das nicht über den angezeigten Tag hinausreicht', () => {
    const letzterTag = angaben({
      vorausschau: [tag({ datum: '2026-10-04', wochentag: 7, geoeffnet: false })],
      schliesstage: betriebsferien.schliesstage,
    });

    expect(schliessungFuer(letzterTag, '2026-10-04')).toEqual({ grund: 'Betriebsferien', bis: null });
  });
});
