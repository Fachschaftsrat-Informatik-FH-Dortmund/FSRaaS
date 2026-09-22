import { oeffnungszeitFuer } from './oeffnungszeiten';
import type { Oeffnungsangaben } from './api';

// 2026-09-07 ist ein Montag, 2026-09-11 ein Freitag, 2026-09-12 ein Samstag,
// 2026-09-13 ein Sonntag.
type Wochentag = Oeffnungsangaben['wochenplan'][number];

const angaben = (wochenplan: Wochentag[]): Oeffnungsangaben => ({
  heute: { datum: '2026-09-07', geoeffnet: true },
  wochenplan,
  vorausschau: [],
  schliesstage: [],
  standAlter: { abgerufenAm: '2026-09-07T08:00:00Z', quelleErreichbar: true },
});

const offen = (wochentag: number, oeffnet: string, schliesst: string): Wochentag => ({
  wochentag,
  geoeffnet: true,
  oeffnet,
  schliesst,
});

const geschlossen = (wochentag: number): Wochentag => ({ wochentag, geoeffnet: false });

describe('Öffnungszeiten je Mensa und Wochentag', () => {
  it('löst den Wochentag des angezeigten Datums aus dem Wochenplan auf', () => {
    const a = angaben([
      offen(1, '11:30', '14:00'),
      offen(2, '11:30', '14:00'),
      offen(3, '11:30', '14:00'),
      offen(4, '11:30', '14:00'),
      offen(5, '11:30', '14:15'),
    ]);
    expect(oeffnungszeitFuer(a, '2026-09-07')).toBe('11:30 - 14:00');
    expect(oeffnungszeitFuer(a, '2026-09-11')).toBe('11:30 - 14:15');
  });

  it('liefert für einen Wochentag ohne Eintrag nichts, ohne die übrigen zu verlieren', () => {
    const a = angaben([offen(1, '11:30', '14:00'), offen(3, '11:30', '14:00')]);
    expect(oeffnungszeitFuer(a, '2026-09-07')).toBe('11:30 - 14:00');
    expect(oeffnungszeitFuer(a, '2026-09-08')).toBeNull();
    expect(oeffnungszeitFuer(a, '2026-09-09')).toBe('11:30 - 14:00');
  });

  it('liefert für einen regulär geschlossenen Wochentag nichts', () => {
    const a = angaben([offen(1, '11:30', '14:00'), geschlossen(6), geschlossen(7)]);
    expect(oeffnungszeitFuer(a, '2026-09-12')).toBeNull();
    expect(oeffnungszeitFuer(a, '2026-09-13')).toBeNull();
  });

  it('bedient einen samstags geöffneten Standort', () => {
    // Canapé (Iserlohn) und Snack it (Hagen) sind samstags geöffnet — der
    // Speiseplan führt Wochenendtage grundsätzlich nicht.
    const a = angaben([offen(1, '08:00', '15:00'), offen(6, '10:00', '14:00')]);
    expect(oeffnungszeitFuer(a, '2026-09-12')).toBe('10:00 - 14:00');
  });

  it('lässt eine halbe Spanne entfallen, statt sie unvollständig anzuzeigen', () => {
    const a = angaben([{ wochentag: 1, geoeffnet: true, oeffnet: '11:30' }]);
    expect(oeffnungszeitFuer(a, '2026-09-07')).toBeNull();
  });

  it('liefert ohne geladene Öffnungsangaben nichts', () => {
    expect(oeffnungszeitFuer(undefined, '2026-09-07')).toBeNull();
  });
});
