import { naechsterOeffnungstag, oeffnungszeitFuer } from './oeffnungszeiten';
import type { Mensa } from './api';

// 2026-09-07 ist ein Montag, 2026-09-11 ein Freitag, 2026-09-12 ein Samstag,
// 2026-09-13 ein Sonntag, 2026-09-14 ein Montag.
const mensa = (oeffnungszeiten: (string | null)[] | undefined): Mensa =>
  ({ id: 'M', name: 'Mensa', standardAuswahl: true, reihenfolge: 10, oeffnungszeiten }) as Mensa;

describe('Öffnungszeit-Auflösung nach Wochentag', () => {
  it('bedient eine fünfstellige Liste von Montag bis Freitag', () => {
    const m = mensa(['Mo', 'Di', 'Mi', 'Do', 'Fr']);
    expect(oeffnungszeitFuer(m, '2026-09-07')).toBe('Mo');
    expect(oeffnungszeitFuer(m, '2026-09-11')).toBe('Fr');
  });

  it('liefert für Samstag und Sonntag einer fünfstelligen Liste nichts', () => {
    const m = mensa(['Mo', 'Di', 'Mi', 'Do', 'Fr']);
    expect(oeffnungszeitFuer(m, '2026-09-12')).toBeNull();
    expect(oeffnungszeitFuer(m, '2026-09-13')).toBeNull();
  });

  it('bedient eine siebenstellige Liste auch am Wochenende', () => {
    const m = mensa(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']);
    expect(oeffnungszeitFuer(m, '2026-09-12')).toBe('Sa');
    expect(oeffnungszeitFuer(m, '2026-09-13')).toBe('So');
  });

  it('behandelt einen null-Eintrag wie eine fehlende Angabe, ohne die übrigen Tage zu verlieren', () => {
    const m = mensa(['Mo', null, 'Mi']);
    expect(oeffnungszeitFuer(m, '2026-09-07')).toBe('Mo');
    expect(oeffnungszeitFuer(m, '2026-09-08')).toBeNull();
    expect(oeffnungszeitFuer(m, '2026-09-09')).toBe('Mi');
    // Donnerstag ist gar nicht gepflegt (Liste zu kurz) — kein Eintrag, kein Fehler.
    expect(oeffnungszeitFuer(m, '2026-09-10')).toBeNull();
  });

  it('liefert ohne hinterlegte Öffnungszeiten nichts', () => {
    expect(oeffnungszeitFuer(mensa(undefined), '2026-09-07')).toBeNull();
    expect(oeffnungszeitFuer(undefined, '2026-09-07')).toBeNull();
  });
});

describe('Wiedereröffnungshinweis an der geschlossenen Mensa', () => {
  it('nennt den nächstgelegenen der folgenden sieben Tage mit hinterlegter Öffnungszeit', () => {
    // Geschlossen am Samstag (2026-09-12); Mo–Fr gepflegt, Wochenende nicht.
    const m = mensa(['Mo', 'Di', 'Mi', 'Do', 'Fr']);
    // Folgetag ist Sonntag (nichts hinterlegt), dann Montag 2026-09-14 → getDay() 1.
    expect(naechsterOeffnungstag(m, '2026-09-12')).toBe(1);
  });

  it('sucht ab dem Folgetag, nicht ab dem angezeigten Tag selbst', () => {
    // Angezeigt: Montag 2026-09-07, nur Mittwoch gepflegt.
    const m = mensa([null, null, 'Mi', null, null]);
    expect(naechsterOeffnungstag(m, '2026-09-07')).toBe(3); // Mittwoch
  });

  it('findet einen Öffnungstag auch, wenn er genau sieben Tage entfernt liegt', () => {
    // Nur Montag gepflegt; angezeigt Montag → nächster Montag ist +7.
    const m = mensa(['Mo', null, null, null, null]);
    expect(naechsterOeffnungstag(m, '2026-09-07')).toBe(1);
  });

  it('liefert null, wenn keiner der folgenden sieben Tage eine Öffnungszeit führt', () => {
    expect(naechsterOeffnungstag(mensa([]), '2026-09-07')).toBeNull();
    expect(naechsterOeffnungstag(mensa(undefined), '2026-09-07')).toBeNull();
  });
});
