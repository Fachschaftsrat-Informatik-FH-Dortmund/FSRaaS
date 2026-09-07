import { konsolidiere, type MensaTagesplan } from './consolidate';
import type { Gericht } from './api';
import {
  istGueltigeKombination,
  loeseAuf,
  sortiereGerichte,
  VOREINSTELLUNG_ID,
  VORDEFINIERTE_PRESETS,
  wendeAn,
  type Kombination,
  type SortierKontext,
} from './sortierung';

const g = (over: Partial<Gericht> = {}): Gericht => ({
  schluessel: 'bolognese',
  kategorie: 'Menü 1',
  bezeichnung: 'Bolognese',
  preisStudierende: 3.3,
  preisMitarbeitende: 5.4,
  preisGaeste: 6.5,
  zusatzstoffe: [],
  kennzeichnungen: [],
  ...over,
});

const plan = (mensaId: string, gerichte: Gericht[]): MensaTagesplan => ({ mensaId, gerichte });

const kontext = (over: Partial<SortierKontext> = {}): SortierKontext => ({
  preisGruppe: 'student',
  mensaReihenfolge: ['Mensa', 'Sued'],
  mensaName: (id) => ({ Mensa: 'Hauptmensa', Sued: 'Mensa Süd' })[id] ?? id,
  sprache: 'de',
  ...over,
});

const kombi = (over: Partial<Kombination> = {}): Kombination => ({
  gruppierung: 'keine',
  gerichteSortierung: { kriterium: 'quelle', richtung: 'auf' },
  ...over,
});

const namen = (gerichte: { massgeblich: { bezeichnung: string } }[]) =>
  gerichte.map((x) => x.massgeblich.bezeichnung);

describe('Wahl der Gruppierung', () => {
  const k = konsolidiere([
    plan('Mensa', [g(), g({ schluessel: 'curry', bezeichnung: 'Curry', kategorie: 'Wok' })]),
    plan('Sued', [g({ schluessel: 'suppe', bezeichnung: 'Suppe', kategorie: 'Menü 1' })]),
  ]);

  it('„keine" liefert genau einen Abschnitt ohne Überschrift', () => {
    const s = wendeAn(kombi({ gruppierung: 'keine' }), k, kontext());
    expect(s.abschnitte).toHaveLength(1);
    expect(s.abschnitte[0]!.titel).toBeNull();
    expect(s.gruppierungAktiv).toBe(false);
  });

  it('„nach Mensa" liefert einen Abschnitt je Mensa mit Angebot', () => {
    const s = wendeAn(
      kombi({ gruppierung: 'mensa', gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' } }),
      k,
      kontext(),
    );
    expect(s.abschnitte.map((a) => a.titel)).toEqual(['Hauptmensa', 'Mensa Süd']);
    expect(s.gruppierungAktiv).toBe(true);
  });

  it('„nach Kategorie" liefert einen Abschnitt je Kategorie über alle Mensen', () => {
    const s = wendeAn(
      kombi({
        gruppierung: 'kategorie',
        gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
      }),
      k,
      kontext(),
    );
    expect(s.abschnitte.map((a) => a.titel)).toEqual(['Menü 1', 'Wok']);
    // „Menü 1" bündelt Bolognese (Mensa) und Suppe (Süd).
    expect(namen(s.abschnitte[0]!.gerichte)).toEqual(['Bolognese', 'Suppe']);
  });
});

describe('Wahl der Gerichte-Sortierung', () => {
  const k = konsolidiere([
    plan('Mensa', [
      g({ schluessel: 'a', bezeichnung: 'Auflauf', preisStudierende: 5 }),
      g({ schluessel: 'b', bezeichnung: 'Brot', preisStudierende: 2 }),
      g({ schluessel: 'c', bezeichnung: 'Curry', preisStudierende: 4 }),
    ]),
  ]);

  it('bildet jede Kombination aus Kriterium und getrennter Richtung ab', () => {
    const aufQuelle = wendeAn(kombi({ gerichteSortierung: { kriterium: 'quelle', richtung: 'auf' } }), k, kontext());
    expect(namen(aufQuelle.abschnitte[0]!.gerichte)).toEqual(['Auflauf', 'Brot', 'Curry']);

    const abQuelle = wendeAn(kombi({ gerichteSortierung: { kriterium: 'quelle', richtung: 'ab' } }), k, kontext());
    expect(namen(abQuelle.abschnitte[0]!.gerichte)).toEqual(['Curry', 'Brot', 'Auflauf']);
  });
});

describe('Sortierkriterien für Gerichte', () => {
  const k = konsolidiere([
    plan('Mensa', [
      g({ schluessel: 'a', bezeichnung: 'Auflauf', preisStudierende: 5 }),
      g({ schluessel: 'b', bezeichnung: 'Brot', preisStudierende: 2 }),
      g({ schluessel: 'c', bezeichnung: 'Curry', preisStudierende: 4 }),
    ]),
  ]);
  const eins = k.sektionen[0]!.gruppen.flatMap((gr) => gr.gerichte);

  it('bietet alle fünf Kriterien an und sortiert Preis aufsteigend', () => {
    const s = sortiereGerichte(eins, { kriterium: 'preis', richtung: 'auf' }, kontext());
    expect(namen(s)).toEqual(['Brot', 'Curry', 'Auflauf']);
  });

  it('sortiert Bezeichnung lokalisiert absteigend', () => {
    const s = sortiereGerichte(eins, { kriterium: 'bezeichnung', richtung: 'ab' }, kontext());
    expect(namen(s)).toEqual(['Curry', 'Brot', 'Auflauf']);
  });

  it('nutzt den Bewertungs-Resolver für eigene und Community-Bewertung', () => {
    const bewertung = (schluessel: string, art: 'eigen' | 'community') =>
      art === 'eigen'
        ? ({ a: 1, b: 3, c: 2 } as Record<string, number>)[schluessel]
        : ({ a: 2, b: 1, c: 3 } as Record<string, number>)[schluessel];
    const eigen = sortiereGerichte(eins, { kriterium: 'eigeneBewertung', richtung: 'ab' }, kontext({ bewertung }));
    expect(namen(eigen)).toEqual(['Brot', 'Curry', 'Auflauf']);
    const community = sortiereGerichte(eins, { kriterium: 'community', richtung: 'ab' }, kontext({ bewertung }));
    expect(namen(community)).toEqual(['Curry', 'Auflauf', 'Brot']);
  });
});

describe('Wahl der Gruppenreihenfolge', () => {
  it('ändert bei geänderter Gruppenreihenfolge nicht den angezeigten Preis eines an mehreren Mensen angebotenen Gerichts', () => {
    const k = konsolidiere([
      plan('Mensa', [g({ preisStudierende: 3.3 })]),
      plan('Sued', [g({ preisStudierende: 9.9 }), g({ schluessel: 'curry', bezeichnung: 'Curry' })]),
    ]);
    const reihenfolge = wendeAn(
      kombi({ gruppierung: 'mensa', gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' } }),
      k,
      kontext(),
    );
    const alpha = wendeAn(
      kombi({ gruppierung: 'mensa', gruppenreihenfolge: { kriterium: 'alphabetisch', richtung: 'ab' } }),
      k,
      kontext(),
    );
    const bolognese = (s: typeof reihenfolge) =>
      s.abschnitte.flatMap((a) => a.gerichte).find((x) => x.schluessel === 'bolognese')!;
    expect(bolognese(reihenfolge).massgeblich.preisStudierende).toBe(3.3);
    expect(bolognese(alpha).massgeblich.preisStudierende).toBe(3.3);
    // Die Abschnittsreihenfolge unterscheidet sich hingegen.
    expect(reihenfolge.abschnitte.map((a) => a.titel)).toEqual(['Hauptmensa', 'Mensa Süd']);
    expect(alpha.abschnitte.map((a) => a.titel)).toEqual(['Mensa Süd', 'Hauptmensa']);
  });
});

describe('Gruppenreihenfolge-Kriterien bei Mensa-Gruppierung', () => {
  const k = konsolidiere([
    plan('Mensa', [g({ bezeichnung: 'X' })]),
    plan('Sued', [g({ schluessel: 'curry', bezeichnung: 'Curry' })]),
  ]);

  it('ordnet nach Mensa-Auswahlreihenfolge, auf- und absteigend', () => {
    const auf = wendeAn(
      kombi({ gruppierung: 'mensa', gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' } }),
      k,
      kontext(),
    );
    expect(auf.abschnitte.map((a) => a.titel)).toEqual(['Hauptmensa', 'Mensa Süd']);
    const ab = wendeAn(
      kombi({ gruppierung: 'mensa', gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'ab' } }),
      k,
      kontext(),
    );
    expect(ab.abschnitte.map((a) => a.titel)).toEqual(['Mensa Süd', 'Hauptmensa']);
  });

  it('ordnet alphabetisch nach Mensa-Name, auf- und absteigend', () => {
    const auf = wendeAn(
      kombi({ gruppierung: 'mensa', gruppenreihenfolge: { kriterium: 'alphabetisch', richtung: 'auf' } }),
      k,
      kontext(),
    );
    expect(auf.abschnitte.map((a) => a.titel)).toEqual(['Hauptmensa', 'Mensa Süd']);
    const ab = wendeAn(
      kombi({ gruppierung: 'mensa', gruppenreihenfolge: { kriterium: 'alphabetisch', richtung: 'ab' } }),
      k,
      kontext(),
    );
    expect(ab.abschnitte.map((a) => a.titel)).toEqual(['Mensa Süd', 'Hauptmensa']);
  });
});

describe('Gruppenreihenfolge-Kriterien bei Kategorie-Gruppierung', () => {
  const k = konsolidiere([
    plan('Mensa', [
      g({ schluessel: 'a', bezeichnung: 'A', kategorie: 'Wok' }),
      g({ schluessel: 'b', bezeichnung: 'B', kategorie: 'Aktion' }),
    ]),
  ]);

  it('ordnet nach Quellreihenfolge der Ausgabestellen, auf- und absteigend', () => {
    const auf = wendeAn(
      kombi({
        gruppierung: 'kategorie',
        gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
      }),
      k,
      kontext(),
    );
    expect(auf.abschnitte.map((a) => a.titel)).toEqual(['Wok', 'Aktion']);
    const ab = wendeAn(
      kombi({
        gruppierung: 'kategorie',
        gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'ab' },
      }),
      k,
      kontext(),
    );
    expect(ab.abschnitte.map((a) => a.titel)).toEqual(['Aktion', 'Wok']);
  });

  it('ordnet alphabetisch nach Kategoriename, auf- und absteigend', () => {
    const auf = wendeAn(
      kombi({
        gruppierung: 'kategorie',
        gruppenreihenfolge: { kriterium: 'alphabetisch', richtung: 'auf' },
      }),
      k,
      kontext(),
    );
    expect(auf.abschnitte.map((a) => a.titel)).toEqual(['Aktion', 'Wok']);
    const ab = wendeAn(
      kombi({
        gruppierung: 'kategorie',
        gruppenreihenfolge: { kriterium: 'alphabetisch', richtung: 'ab' },
      }),
      k,
      kontext(),
    );
    expect(ab.abschnitte.map((a) => a.titel)).toEqual(['Wok', 'Aktion']);
  });
});

describe('Einordnung unbewerteter Gerichte ans Ende', () => {
  const k = konsolidiere([
    plan('Mensa', [
      g({ schluessel: 'a', bezeichnung: 'A' }),
      g({ schluessel: 'b', bezeichnung: 'B' }),
      g({ schluessel: 'c', bezeichnung: 'C' }),
    ]),
  ]);
  const eins = k.sektionen[0]!.gruppen.flatMap((gr) => gr.gerichte);

  it('stellt ein unbewertetes Gericht unabhängig von der Richtung ans Ende', () => {
    const bewertung = (schluessel: string) => (schluessel === 'b' ? undefined : ({ a: 1, c: 2 } as Record<string, number>)[schluessel]);
    const ab = sortiereGerichte(eins, { kriterium: 'eigeneBewertung', richtung: 'ab' }, kontext({ bewertung }));
    expect(namen(ab)).toEqual(['C', 'A', 'B']);
    const auf = sortiereGerichte(eins, { kriterium: 'eigeneBewertung', richtung: 'auf' }, kontext({ bewertung }));
    expect(namen(auf)).toEqual(['A', 'C', 'B']);
  });

  it('entspricht ohne jede Bewertung der Reihenfolge der Quelle, kein Gericht fällt weg', () => {
    const bewertung = () => undefined;
    const s = sortiereGerichte(eins, { kriterium: 'community', richtung: 'ab' }, kontext({ bewertung }));
    expect(namen(s)).toEqual(['A', 'B', 'C']);
    expect(s).toHaveLength(3);
  });
});

describe('Feste Endposition von Beilagen- und Sammelgruppe', () => {
  const k = konsolidiere([
    plan('Mensa', [
      g({ schluessel: 'a', bezeichnung: 'A', kategorie: 'Wok' }),
      g({ schluessel: 'b', bezeichnung: 'B', kategorie: 'Aktion' }),
      g({ schluessel: 'o', bezeichnung: 'Ohne', kategorie: '' }),
      g({ schluessel: 'p', bezeichnung: 'Pommes', kategorie: 'Beilagen' }),
    ]),
  ]);

  it('lässt Sammelgruppe und danach Beilagen auch bei „alphabetisch, absteigend" zuletzt', () => {
    const s = wendeAn(
      kombi({
        gruppierung: 'kategorie',
        gruppenreihenfolge: { kriterium: 'alphabetisch', richtung: 'ab' },
      }),
      k,
      kontext(),
    );
    expect(s.abschnitte.map((a) => a.titel)).toEqual(['Wok', 'Aktion', null, 'Beilagen']);
  });

  it('sortiert Preset „Preis" (Gruppierung „keine") flach ohne Kategorieüberschriften', () => {
    const s = wendeAn(
      loeseAuf('preis', []),
      k,
      kontext(),
    );
    expect(s.abschnitte).toHaveLength(1);
    expect(s.abschnitte[0]!.titel).toBeNull();
    expect(s.gruppierungAktiv).toBe(false);
  });
});

describe('Vordefinierte Presets', () => {
  it('stellt genau die vier Presets der Tabelle bereit', () => {
    expect(VORDEFINIERTE_PRESETS.map((p) => p.id)).toEqual([
      'mensa-eigene-bewertung',
      'mensa-community',
      'mensa-guenstigstes',
      'preis',
    ]);
    const guenstigstes = VORDEFINIERTE_PRESETS.find((p) => p.id === 'mensa-guenstigstes')!;
    expect(guenstigstes.gruppierung).toBe('mensa');
    expect(guenstigstes.gruppenreihenfolge).toEqual({ kriterium: 'reihenfolge', richtung: 'auf' });
    expect(guenstigstes.gerichteSortierung).toEqual({ kriterium: 'preis', richtung: 'auf' });
    const preis = VORDEFINIERTE_PRESETS.find((p) => p.id === 'preis')!;
    expect(preis.gruppierung).toBe('keine');
    expect(preis.gerichteSortierung).toEqual({ kriterium: 'preis', richtung: 'auf' });
  });
});

describe('Voreingestelltes Preset', () => {
  it('löst ohne vorherige Wahl „Mensa, günstigstes zuerst" auf', () => {
    expect(loeseAuf(null, []).id).toBe(VOREINSTELLUNG_ID);
    expect(loeseAuf('gibt-es-nicht', []).id).toBe(VOREINSTELLUNG_ID);
    expect(VOREINSTELLUNG_ID).toBe('mensa-guenstigstes');
  });
});

describe('Ununterscheidbarkeit der Bewertungs-Presets bis Roadmap-Schritt 9', () => {
  it('lässt „Mensa, eigene Bewertung" und „Mensa, Community-Bewertung" ohne Bewertungsdaten wie Quellreihenfolge wirken', () => {
    const k = konsolidiere([
      plan('Mensa', [
        g({ schluessel: 'a', bezeichnung: 'A' }),
        g({ schluessel: 'b', bezeichnung: 'B' }),
      ]),
    ]);
    const ctx = kontext({ bewertung: () => undefined });
    for (const id of ['mensa-eigene-bewertung', 'mensa-community']) {
      const s = wendeAn(loeseAuf(id, []), k, ctx);
      const alle = s.abschnitte.flatMap((a) => a.gerichte);
      expect(namen(alle)).toEqual(['A', 'B']);
      expect(alle).toHaveLength(2);
    }
  });
});

describe('istGueltigeKombination verwirft unbekannte Werte', () => {
  it('akzeptiert eine vollständige Kombination und lehnt unbekannte Kriterien ab', () => {
    expect(
      istGueltigeKombination({
        gruppierung: 'mensa',
        gruppenreihenfolge: { kriterium: 'alphabetisch', richtung: 'ab' },
        gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
      }),
    ).toBe(true);
    expect(
      istGueltigeKombination({
        gruppierung: 'mensa',
        gerichteSortierung: { kriterium: 'entfernung', richtung: 'auf' },
      }),
    ).toBe(false);
    expect(istGueltigeKombination({ gruppierung: 'keine' })).toBe(false);
    expect(
      istGueltigeKombination({ gruppierung: 'keine', gerichteSortierung: { kriterium: 'preis', richtung: 'auf' } }),
    ).toBe(true);
  });
});
