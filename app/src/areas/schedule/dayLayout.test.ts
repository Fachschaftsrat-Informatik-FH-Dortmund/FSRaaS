import { layoutTag } from './dayLayout';
import type { CustomPlanEntry, DaySlot } from './typen';

function termin(id: string, timeBeginMin: number, timeEndMin: number): CustomPlanEntry {
  return {
    kind: 'eigen',
    id,
    title: id,
    deaktiviertBis: null,
    color: '#000000',
    weekday: 'Mon',
    timeBeginMin,
    timeEndMin,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    wiederkehrend: true,
  };
}

function terminSlots(slots: DaySlot[]) {
  return slots.filter((s): s is Extract<DaySlot, { art: 'termin' }> => s.art === 'termin');
}

function lueckenSlots(slots: DaySlot[]) {
  return slots.filter((s): s is Extract<DaySlot, { art: 'luecke' }> => s.art === 'luecke');
}

describe('SCHED-F-520 Lücken ohne Termin mit Dauer', () => {
  it('gibt bei keinem Termin genau eine Lücke über den gesamten Tag aus', () => {
    const ergebnis = layoutTag([], 8 * 60, 18 * 60);
    expect(ergebnis).toEqual([{ art: 'luecke', vonMin: 8 * 60, bisMin: 18 * 60 }]);
  });

  it('setzt eine Lücke vor, zwischen und nach den Terminen an', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 12 * 60, 13 * 60);
    const ergebnis = layoutTag([a, b], 8 * 60, 18 * 60);
    expect(lueckenSlots(ergebnis)).toEqual([
      { art: 'luecke', vonMin: 8 * 60, bisMin: 9 * 60 },
      { art: 'luecke', vonMin: 10 * 60, bisMin: 12 * 60 },
      { art: 'luecke', vonMin: 13 * 60, bisMin: 18 * 60 },
    ]);
  });

  it('lässt keine Lücke, wenn ein Termin genau am Tagesrand beginnt bzw. endet', () => {
    const a = termin('a', 8 * 60, 18 * 60);
    const ergebnis = layoutTag([a], 8 * 60, 18 * 60);
    expect(lueckenSlots(ergebnis)).toEqual([]);
  });

  it('erzeugt keine Nulllücke zwischen zwei direkt aneinandergrenzenden Terminen', () => {
    const a = termin('a', 8 * 60, 9 * 60);
    const b = termin('b', 9 * 60, 10 * 60);
    const ergebnis = layoutTag([a, b], 8 * 60, 10 * 60);
    expect(lueckenSlots(ergebnis)).toEqual([]);
  });
});

describe('SCHED-F-540 Überschneidende Termine liegen nebeneinander', () => {
  it('weist zwei überschneidenden Terminen unterschiedliche Spalten zu', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 9 * 60 + 30, 10 * 60 + 30);
    const ergebnis = terminSlots(layoutTag([a, b], 8 * 60, 18 * 60));
    expect(ergebnis).toHaveLength(2);
    const spaltenA = ergebnis.find((s) => s.entry.id === 'a')!;
    const spaltenB = ergebnis.find((s) => s.entry.id === 'b')!;
    expect(spaltenA.spalte).not.toBe(spaltenB.spalte);
    expect(spaltenA.spalten).toBe(2);
    expect(spaltenB.spalten).toBe(2);
  });

  it('gibt überschneidungsfreien Terminen jeweils genau eine Spalte', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 11 * 60, 12 * 60);
    const ergebnis = terminSlots(layoutTag([a, b], 8 * 60, 18 * 60));
    expect(ergebnis.every((s) => s.spalten === 1 && s.spalte === 0)).toBe(true);
  });

  it('lässt einen Termin wiederverwenden, sobald seine Spalte wieder frei ist', () => {
    // a und b überlappen, c beginnt erst nach dem Ende von a → c darf As Spalte übernehmen.
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 9 * 60 + 30, 11 * 60);
    const c = termin('c', 10 * 60, 10 * 60 + 30);
    const ergebnis = terminSlots(layoutTag([a, b, c], 8 * 60, 18 * 60));
    const spaltenA = ergebnis.find((s) => s.entry.id === 'a')!.spalte;
    const spaltenC = ergebnis.find((s) => s.entry.id === 'c')!.spalte;
    expect(spaltenA).toBe(spaltenC);
    expect(ergebnis.every((s) => s.spalten === 2)).toBe(true);
  });

  it('benötigt für drei gleichzeitig laufende Termine drei Spalten', () => {
    const a = termin('a', 9 * 60, 11 * 60);
    const b = termin('b', 9 * 60, 11 * 60);
    const c = termin('c', 9 * 60, 11 * 60);
    const ergebnis = terminSlots(layoutTag([a, b, c], 8 * 60, 18 * 60));
    const spalten = new Set(ergebnis.map((s) => s.spalte));
    expect(spalten.size).toBe(3);
    expect(ergebnis.every((s) => s.spalten === 3)).toBe(true);
  });

  it('gibt eine spätere, unabhängige Gruppe unabhängig von einer früheren Dreiergruppe mit nur einer Spalte aus', () => {
    const a = termin('a', 9 * 60, 11 * 60);
    const b = termin('b', 9 * 60, 11 * 60);
    const c = termin('c', 9 * 60, 11 * 60);
    const d = termin('d', 14 * 60, 15 * 60);
    const ergebnis = terminSlots(layoutTag([a, b, c, d], 8 * 60, 18 * 60));
    const slotD = ergebnis.find((s) => s.entry.id === 'd')!;
    expect(slotD.spalten).toBe(1);
    expect(slotD.spalte).toBe(0);
  });

  it('gibt Termine in chronologischer Reihenfolge zurück', () => {
    const a = termin('a', 12 * 60, 13 * 60);
    const b = termin('b', 9 * 60, 10 * 60);
    const ergebnis = terminSlots(layoutTag([a, b], 8 * 60, 18 * 60));
    expect(ergebnis.map((s) => s.entry.id)).toEqual(['b', 'a']);
  });
});
