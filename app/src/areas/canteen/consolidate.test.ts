import { gruppiereNachKategorie, konsolidiere, type MensaTagesplan } from './consolidate';
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

const plan = (mensaId: string, gerichte: Gericht[]): MensaTagesplan => ({ mensaId, gerichte });

describe('MENSA-F-012 Gerichte der gewählten Mensen zu einem Eintrag je Gericht zusammengefasst', () => {
  it('führt dasselbe Gericht an zwei Mensen nur einmal in der Liste', () => {
    const { gruppen } = konsolidiere(
      [plan('Mensa', [g()]), plan('Sued', [g()])],
      'Mensa',
    );
    const alle = gruppen.flatMap((k) => k.gerichte);
    expect(alle).toHaveLength(1);
    expect(alle[0]!.schluessel).toBe('bolognese');
  });
});

describe('MENSA-F-014 Ausweis der anbietenden Mensen je zusammengefasstem Gericht', () => {
  it('nennt beide anbietenden Mensen in Auswahlreihenfolge', () => {
    const { gruppen } = konsolidiere([plan('Mensa', [g()]), plan('Sued', [g()])], 'Mensa');
    expect(gruppen[0]!.gerichte[0]!.anbieter).toEqual(['Mensa', 'Sued']);
  });

  it('führt ein nur an einer Mensa angebotenes Gericht mit genau dieser Mensa', () => {
    const { gruppen } = konsolidiere(
      [plan('Mensa', [g()]), plan('Sued', [g({ schluessel: 'curry', bezeichnung: 'Curry' })])],
      'Mensa',
    );
    const curry = gruppen.flatMap((k) => k.gerichte).find((x) => x.schluessel === 'curry')!;
    expect(curry.anbieter).toEqual(['Sued']);
  });
});

describe('MENSA-F-016 Gericht der aktiven Mensa unterscheidbar von den übrigen', () => {
  it('markiert nur Gerichte, welche die aktive Mensa führt, als anAktiver', () => {
    const { gruppen } = konsolidiere(
      [
        plan('Mensa', [g()]),
        plan('Sued', [g({ schluessel: 'curry', bezeichnung: 'Curry' })]),
      ],
      'Mensa',
    );
    const alle = gruppen.flatMap((k) => k.gerichte);
    expect(alle.find((x) => x.schluessel === 'bolognese')!.anAktiver).toBe(true);
    expect(alle.find((x) => x.schluessel === 'curry')!.anAktiver).toBe(false);
  });
});

describe('MENSA-F-018 Angaben der maßgeblichen Mensa', () => {
  it('zeigt die Angaben der aktiven Mensa, wenn diese das Gericht führt', () => {
    const { gruppen } = konsolidiere(
      [
        plan('Mensa', [g({ preisStudierende: 3.3 })]),
        plan('Sued', [g({ preisStudierende: 9.9 })]),
      ],
      'Mensa',
    );
    expect(gruppen[0]!.gerichte[0]!.massgeblich.preisStudierende).toBe(3.3);
  });

  it('fällt auf die erste anbietende Mensa zurück, wenn die aktive das Gericht nicht führt', () => {
    const { gruppen } = konsolidiere(
      [
        plan('Mensa', []),
        plan('Sued', [g({ preisStudierende: 9.9 })]),
        plan('Nord', [g({ preisStudierende: 4.4 })]),
      ],
      'Mensa',
    );
    // Aktiv = Mensa (kein Angebot) → maßgeblich ist Sued (erste anbietende in Reihenfolge).
    expect(gruppen[0]!.gerichte[0]!.massgeblich.mensaId).toBe('Sued');
    expect(gruppen[0]!.gerichte[0]!.massgeblich.preisStudierende).toBe(9.9);
  });

  it('bleibt bei abweichenden Preisen ein Eintrag, ohne Aufspaltung oder Durchschnitt', () => {
    const { gruppen } = konsolidiere(
      [plan('Mensa', [g({ preisStudierende: 3 })]), plan('Sued', [g({ preisStudierende: 5 })])],
      'Sued',
    );
    const alle = gruppen.flatMap((k) => k.gerichte);
    expect(alle).toHaveLength(1);
    expect(alle[0]!.massgeblich.preisStudierende).toBe(5);
  });
});

describe('MENSA-F-049 geschlossene Mensen ohne Angebot am Tag', () => {
  it('listet gewählte Mensen ohne Gerichte als geschlossen', () => {
    const { geschlossene } = konsolidiere(
      [plan('Mensa', [g()]), plan('Sued', []), plan('Nord', [])],
      'Mensa',
    );
    expect(geschlossene).toEqual(['Sued', 'Nord']);
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
