import {
  gruppiereNachKategorie,
  konsolidiere,
  type Konsolidierung,
  type KonsolidiertesGericht,
  type MensaTagesplan,
} from './consolidate';
import type { Gericht } from './api';

const g = (over: Partial<Gericht> = {}): Gericht => ({
  schluessel: 'bolognese',
  kategorie: 'Menü 1',
  bezeichnung: 'Bolognese',
  preisStudierende: 3.3,
  preisMitarbeitende: 5.4,
  preisGaeste: 6.5,
  zusatzstoffe: ['Weizen'],
  kennzeichnungen: ['Vegan'],
  ...over,
});

/**
 * Tagesplan einer Mensa. `geoeffnet` ist die Öffnungsangabe der Schnittstelle für
 * den angezeigten Tag; ohne Angabe bleibt sie unbekannt — und unbekannt gilt nicht
 * als geschlossen.
 */
const plan = (
  mensaId: string,
  gerichte: Gericht[],
  geoeffnet?: boolean,
): MensaTagesplan => ({ mensaId, gerichte, geoeffnet });

const alleGerichte = (k: Konsolidierung): KonsolidiertesGericht[] =>
  k.sektionen.flatMap((s) => s.gruppen.flatMap((gr) => gr.gerichte));

describe('MENSA-F-012 Gerichte der gewählten Mensen zu einem Eintrag je Gericht zusammengefasst', () => {
  it('führt dasselbe Gericht an zwei Mensen nur einmal in der Liste', () => {
    const k = konsolidiere([plan('Mensa', [g()]), plan('Sued', [g()])]);
    expect(alleGerichte(k)).toHaveLength(1);
    expect(alleGerichte(k)[0]!.schluessel).toBe('bolognese');
  });
});

describe('MENSA-F-014 Ausweis der anbietenden Mensen je zusammengefasstem Gericht', () => {
  it('nennt beide anbietenden Mensen in Auswahlreihenfolge', () => {
    const k = konsolidiere([plan('Mensa', [g()]), plan('Sued', [g()])]);
    expect(alleGerichte(k)[0]!.anbieter).toEqual(['Mensa', 'Sued']);
  });

  it('führt ein nur an einer Mensa angebotenes Gericht mit genau dieser Mensa', () => {
    const k = konsolidiere([
      plan('Mensa', [g()]),
      plan('Sued', [g({ schluessel: 'curry', bezeichnung: 'Curry' })]),
    ]);
    const curry = alleGerichte(k).find((x) => x.schluessel === 'curry')!;
    expect(curry.anbieter).toEqual(['Sued']);
  });
});

describe('MENSA-F-013 / MENSA-F-025 primär nach Mensa-Auswahlreihenfolge gruppiert', () => {
  it('bildet je Mensa mit Angebot einen Abschnitt in Auswahlreihenfolge', () => {
    const k = konsolidiere([
      plan('Sued', [g({ schluessel: 'curry', bezeichnung: 'Curry' })]),
      plan('Mensa', [g()]),
    ]);
    expect(k.sektionen.map((s) => s.mensaId)).toEqual(['Sued', 'Mensa']);
  });

  it('stellt ein an mehreren Mensen angebotenes Gericht in den Abschnitt der ersten anbietenden Mensa', () => {
    const k = konsolidiere([
      plan('Mensa', [g({ schluessel: 'curry', bezeichnung: 'Curry' })]),
      plan('Sued', [g(), g({ schluessel: 'curry', bezeichnung: 'Curry' })]),
    ]);
    const mensaAbschnitt = k.sektionen.find((s) => s.mensaId === 'Mensa')!;
    const suedAbschnitt = k.sektionen.find((s) => s.mensaId === 'Sued')!;
    expect(mensaAbschnitt.gruppen.flatMap((gr) => gr.gerichte).map((x) => x.schluessel)).toEqual([
      'curry',
    ]);
    expect(suedAbschnitt.gruppen.flatMap((gr) => gr.gerichte).map((x) => x.schluessel)).toEqual([
      'bolognese',
    ]);
  });
});

describe('MENSA-F-018 Angaben der maßgeblichen (Abschnitts-)Mensa', () => {
  it('zeigt die Angaben der Mensa, in deren Abschnitt das Gericht steht', () => {
    const k = konsolidiere([
      plan('Mensa', [g({ preisStudierende: 3.3 })]),
      plan('Sued', [g({ preisStudierende: 9.9 })]),
    ]);
    expect(alleGerichte(k)[0]!.massgeblich.mensaId).toBe('Mensa');
    expect(alleGerichte(k)[0]!.massgeblich.preisStudierende).toBe(3.3);
  });

  it('bleibt bei abweichenden Preisen ein Eintrag, ohne Aufspaltung oder Durchschnitt', () => {
    const k = konsolidiere([
      plan('Mensa', [g({ preisStudierende: 3 })]),
      plan('Sued', [g({ preisStudierende: 5 })]),
    ]);
    expect(alleGerichte(k)).toHaveLength(1);
    expect(alleGerichte(k)[0]!.massgeblich.preisStudierende).toBe(3);
  });
});

describe('Geschlossen-Hinweis für geschlossene Mensa', () => {
  it('führt eine von der Schnittstelle als geschlossen gemeldete Mensa als geschlossen und ohne Abschnitt', () => {
    const k = konsolidiere([
      plan('Mensa', [g()], true),
      plan('Sued', [], false),
      plan('Nord', [], false),
    ]);
    expect(k.geschlossene).toEqual(['Sued', 'Nord']);
    expect(k.ohneSpeiseplan).toEqual([]);
    expect(k.sektionen.map((s) => s.mensaId)).toEqual(['Mensa']);
  });

  it('führt eine geöffnete Mensa ohne Gericht nicht als geschlossen', () => {
    const k = konsolidiere([plan('Mensa', [g()], true), plan('Sued', [], true)]);
    expect(k.geschlossene).toEqual([]);
    expect(k.ohneSpeiseplan).toEqual(['Sued']);
  });

  it('behauptet ohne Öffnungsangabe keine Schließung', () => {
    // Unbekannt (noch nicht geladen) ist keine Aussage der Schnittstelle.
    const k = konsolidiere([plan('Mensa', [g()]), plan('Sued', [])]);
    expect(k.geschlossene).toEqual([]);
    expect(k.ohneSpeiseplan).toEqual(['Sued']);
  });

  it('führt die Gerichte einer als geschlossen gemeldeten Mensa dennoch', () => {
    // Der vierte Fall der Tabelle in design.md: nie beobachtet, aber behandelt —
    // eine verschwiegene Gerichtsliste wäre ein Fehler.
    const k = konsolidiere([plan('Mensa', [g()], false)]);
    expect(k.geschlossene).toEqual([]);
    expect(k.ohneSpeiseplan).toEqual([]);
    expect(k.sektionen.map((s) => s.mensaId)).toEqual(['Mensa']);
  });
});

describe('Hinweis für geöffnete Mensa ohne Speiseplan', () => {
  it('unterscheidet die geöffnete Mensa ohne Speiseplan von der geschlossenen', () => {
    const k = konsolidiere([
      plan('Mensa', [g()], true),
      plan('Sued', [], false), // Betriebsferien
      plan('Nord', [], true), // führt grundsätzlich keinen Speiseplan
    ]);
    expect(k.geschlossene).toEqual(['Sued']);
    expect(k.ohneSpeiseplan).toEqual(['Nord']);
  });
});

describe('Reihenfolge der Quelle als stabiler Quellrang', () => {
  it('gibt einem nur an der zweiten Mensa geführten Gericht einen höheren Quellrang', () => {
    const k = konsolidiere([
      plan('Mensa', [g(), g({ schluessel: 'suppe', bezeichnung: 'Suppe' })]),
      plan('Sued', [
        g({ schluessel: 'suppe', bezeichnung: 'Suppe' }),
        g({ schluessel: 'curry', bezeichnung: 'Curry' }),
      ]),
    ]);
    const rang = new Map(alleGerichte(k).map((x) => [x.schluessel, x.quellrang]));
    expect(rang.get('curry')!).toBeGreaterThan(rang.get('bolognese')!);
    expect(rang.get('curry')!).toBeGreaterThan(rang.get('suppe')!);
    // lückenlos 0..n-1
    expect([...rang.values()].sort((a, b) => a - b)).toEqual([0, 1, 2]);
  });

  it('lässt Zusammenfassung und maßgebliche Mensa unverändert', () => {
    const k = konsolidiere([
      plan('Mensa', [g({ preisStudierende: 3.3 })]),
      plan('Sued', [g({ preisStudierende: 9.9 })]),
    ]);
    expect(alleGerichte(k)).toHaveLength(1);
    expect(alleGerichte(k)[0]!.massgeblich.mensaId).toBe('Mensa');
    expect(alleGerichte(k)[0]!.quellrang).toBe(0);
  });
});

describe('MENSA-F-040 / MENSA-F-160 Gruppenreihenfolge: benannt, kategorielos, Beilagen', () => {
  it('stellt die kategorielose Sammelgruppe hinter benannte Kategorien und vor Beilagen', () => {
    const gerichte = [
      { kategorie: 'Beilagen', bezeichnung: 'Pommes' },
      { kategorie: '', bezeichnung: 'Ohne' },
      { kategorie: 'Menü 1', bezeichnung: 'Menü' },
    ];
    const gruppen = gruppiereNachKategorie(gerichte);
    expect(gruppen.map((k) => k.kategorie)).toEqual(['Menü 1', '', 'Beilagen']);
  });
});
