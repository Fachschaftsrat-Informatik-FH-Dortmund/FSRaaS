import { groessteSpaltenzahl, legePlanungsTagAus, type AchsenAbschnitt } from './planungZeitachse';

const z = (name: string, von: number, bis: number) => ({ name, timeBeginMin: von, timeEndMin: bis });
type Z = ReturnType<typeof z>;

function belegte(abschnitte: AchsenAbschnitt<Z>[]) {
  return abschnitte.filter((a): a is Extract<AchsenAbschnitt<Z>, { art: 'belegt' }> => a.art === 'belegt');
}

describe('Zeitachse im Planungsmodus', () => {
  it('Parallele Termine: sich überschneidende Termine stehen nebeneinander und zählen ihre Überschneidungen', () => {
    const abschnitte = legePlanungsTagAus([z('A', 600, 690), z('B', 600, 690), z('C', 630, 720)]);
    const [gruppe] = belegte(abschnitte);
    expect(abschnitte).toHaveLength(1);
    expect(gruppe!.elemente.map((e) => [e.element.name, e.spalte, e.spalten, e.ueberschneidungen])).toEqual([
      ['A', 0, 3, 2],
      ['B', 1, 3, 2],
      ['C', 2, 3, 2],
    ]);
  });

  it('Aufeinanderfolgende Termine: stehen untereinander, getrennt durch eine Lücke mit Dauer', () => {
    const abschnitte = legePlanungsTagAus([z('später', 720, 810), z('früher', 480, 570)]);
    expect(abschnitte.map((a) => a.art)).toEqual(['belegt', 'luecke', 'belegt']);
    const [erster, zweiter] = belegte(abschnitte);
    expect(erster!.elemente[0]!.element.name).toBe('früher');
    expect(zweiter!.elemente[0]).toMatchObject({ spalte: 0, spalten: 1, ueberschneidungen: 0 });
    // 150 Minuten frei — auf Stundenhöhe gestaucht, mit echter Dauer.
    expect(abschnitte[1]).toMatchObject({ echteDauerMin: 150, hoeheMin: 60, gestaucht: true, kurz: false });
  });

  it('zählt nur unmittelbare Überschneidungen, nicht die der ganzen Gruppe', () => {
    // A überschneidet B, B überschneidet C, A und C nicht: eine Gruppe, zwei Spalten.
    const [gruppe] = belegte(legePlanungsTagAus([z('A', 480, 570), z('B', 540, 630), z('C', 600, 690)]));
    expect(gruppe!.elemente.map((e) => [e.element.name, e.spalte, e.ueberschneidungen])).toEqual([
      ['A', 0, 1],
      ['B', 1, 2],
      ['C', 0, 1],
    ]);
  });

  it('eine kurze Lücke bleibt ohne Beschriftung, eine direkte Folge ohne Lücke', () => {
    expect(legePlanungsTagAus([z('A', 480, 570), z('B', 580, 670)])[1]).toMatchObject({ art: 'luecke', kurz: true });
    expect(legePlanungsTagAus([z('A', 480, 570), z('B', 570, 660)]).map((a) => a.art)).toEqual(['belegt', 'belegt']);
  });

  it('Viele parallele Termine: die größte Spaltenzahl des Tages bestimmt die Breite', () => {
    const sechs = Array.from({ length: 6 }, (_, i) => z(`G${i}`, 600, 690));
    expect(groessteSpaltenzahl(legePlanungsTagAus([...sechs, z('früh', 480, 570)]))).toBe(6);
    expect(groessteSpaltenzahl(legePlanungsTagAus([]))).toBe(1);
  });
});
