import { layoutTag } from './dayLayout';
import type { CustomPlanEntry, DaySlot, TerminSlot } from './typen';

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

function belegteAbschnitte(slots: DaySlot[]) {
  return slots.filter((s): s is Extract<DaySlot, { art: 'belegt' }> => s.art === 'belegt');
}

function lueckenSlots(slots: DaySlot[]) {
  return slots.filter((s): s is Extract<DaySlot, { art: 'luecke' }> => s.art === 'luecke');
}

function terminSlotsVon(belegtSlots: TerminSlot[]) {
  return belegtSlots;
}

function alleTerminSlots(slots: DaySlot[]) {
  return belegteAbschnitte(slots).flatMap((a) => terminSlotsVon(a.slots));
}

describe('Lücken ohne Termin mit Dauer', () => {
  it('gibt bei keinem Termin genau eine Lücke über den gesamten Tag aus', () => {
    const ergebnis = layoutTag([], 8 * 60, 18 * 60);
    expect(lueckenSlots(ergebnis)).toHaveLength(1);
    expect(lueckenSlots(ergebnis)[0]).toMatchObject({ vonMin: 8 * 60, bisMin: 18 * 60 });
  });

  it('setzt eine Lücke vor, zwischen und nach den Terminen an', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 12 * 60, 13 * 60);
    const ergebnis = layoutTag([a, b], 8 * 60, 18 * 60);
    expect(lueckenSlots(ergebnis).map((l) => ({ vonMin: l.vonMin, bisMin: l.bisMin }))).toEqual([
      { vonMin: 8 * 60, bisMin: 9 * 60 },
      { vonMin: 10 * 60, bisMin: 12 * 60 },
      { vonMin: 13 * 60, bisMin: 18 * 60 },
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

describe('Proportionale Zeitachse', () => {
  it('Freistunde zwischen zwei Terminen', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 10 * 60 + 45, 11 * 60 + 45);
    const [luecke] = lueckenSlots(layoutTag([a, b], 9 * 60, 11 * 60 + 45));
    expect(luecke).toMatchObject({ vonMin: 10 * 60, bisMin: 10 * 60 + 45, hoeheMin: 45, gestaucht: false, kurz: false });
  });

  it('Kurze Lücke', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 10 * 60 + 10, 11 * 60);
    const [luecke] = lueckenSlots(layoutTag([a, b], 9 * 60, 11 * 60));
    expect(luecke).toMatchObject({ vonMin: 10 * 60, bisMin: 10 * 60 + 10, hoeheMin: 10, gestaucht: false, kurz: true });
  });

  it('Lange Lücke', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 13 * 60 + 30, 14 * 60 + 30);
    const [luecke] = lueckenSlots(layoutTag([a, b], 9 * 60, 14 * 60 + 30));
    expect(luecke).toMatchObject({
      vonMin: 10 * 60,
      bisMin: 13 * 60 + 30,
      hoeheMin: 60,
      echteDauerMin: 3 * 60 + 30,
      gestaucht: true,
      kurz: false,
    });
  });
});

describe('Nebeneinanderdarstellung überschneidender Termine', () => {
  it('Überschneidende Termine', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 9 * 60 + 30, 10 * 60 + 30);
    const ergebnis = terminSlotsVon(terminSlotsVonTag([a, b]));
    expect(ergebnis).toHaveLength(2);
    const spaltenA = ergebnis.find((s) => s.entry.id === 'a')!;
    const spaltenB = ergebnis.find((s) => s.entry.id === 'b')!;
    expect(spaltenA.spalte).not.toBe(spaltenB.spalte);
    expect(spaltenA.spalten).toBe(2);
    expect(spaltenB.spalten).toBe(2);
  });

  it('Drei überschneidende Termine', () => {
    const a = termin('a', 9 * 60, 11 * 60);
    const b = termin('b', 9 * 60, 11 * 60);
    const c = termin('c', 9 * 60, 11 * 60);
    const ergebnis = terminSlotsVon(terminSlotsVonTag([a, b, c]));
    const spalten = new Set(ergebnis.map((s) => s.spalte));
    expect(spalten.size).toBe(3);
    expect(ergebnis.every((s) => s.spalten === 3)).toBe(true);
  });

  it('Mehr als drei überschneidende Termine', () => {
    // Prüfprotokoll 2026-09-09, Abschnitt 1: Die Stapelung ab dem vierten
    // Termin ist ersatzlos entfallen. Es gibt keine Obergrenze mehr — alle
    // überschneidenden Termine stehen nebeneinander, die Kacheln werden
    // entsprechend schmal.
    const a = termin('a', 9 * 60, 11 * 60);
    const b = termin('b', 9 * 60, 11 * 60);
    const c = termin('c', 9 * 60, 11 * 60);
    const d = termin('d', 9 * 60, 11 * 60);
    const ergebnis = terminSlotsVon(terminSlotsVonTag([a, b, c, d]));

    expect(ergebnis).toHaveLength(4);
    expect(new Set(ergebnis.map((s) => s.spalte)).size).toBe(4);
    expect(ergebnis.every((s) => s.spalten === 4)).toBe(true);
    expect(ergebnis.map((s) => s.entry.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  function terminSlotsVonTag(termine: CustomPlanEntry[]): TerminSlot[] {
    return belegteAbschnitte(layoutTag(termine, 8 * 60, 18 * 60)).flatMap((a) => a.slots);
  }
});

describe('SCHED-F-540 Spalten werden wiederverwendet', () => {
  it('lässt einen Termin wiederverwenden, sobald seine Spalte wieder frei ist', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 9 * 60 + 30, 11 * 60);
    const c = termin('c', 10 * 60, 10 * 60 + 30);
    const ergebnis = alleTerminSlots(layoutTag([a, b, c], 8 * 60, 18 * 60));
    const spaltenA = ergebnis.find((s) => s.entry.id === 'a')!.spalte;
    const spaltenC = ergebnis.find((s) => s.entry.id === 'c')!.spalte;
    expect(spaltenA).toBe(spaltenC);
    expect(ergebnis.every((s) => s.spalten === 2)).toBe(true);
  });

  it('gibt überschneidungsfreien Terminen jeweils genau eine Spalte', () => {
    const a = termin('a', 9 * 60, 10 * 60);
    const b = termin('b', 11 * 60, 12 * 60);
    const ergebnis = alleTerminSlots(layoutTag([a, b], 8 * 60, 18 * 60));
    expect(ergebnis.every((s) => s.spalten === 1 && s.spalte === 0)).toBe(true);
  });

  it('gibt eine spätere, unabhängige Gruppe unabhängig von einer früheren Dreiergruppe mit nur einer Spalte aus', () => {
    const a = termin('a', 9 * 60, 11 * 60);
    const b = termin('b', 9 * 60, 11 * 60);
    const c = termin('c', 9 * 60, 11 * 60);
    const d = termin('d', 14 * 60, 15 * 60);
    const ergebnis = alleTerminSlots(layoutTag([a, b, c, d], 8 * 60, 18 * 60));
    const slotD = ergebnis.find((s) => s.entry.id === 'd')!;
    expect(slotD.spalten).toBe(1);
    expect(slotD.spalte).toBe(0);
  });

  it('gibt Termine in chronologischer Reihenfolge zurück', () => {
    const a = termin('a', 12 * 60, 13 * 60);
    const b = termin('b', 9 * 60, 10 * 60);
    const ergebnis = alleTerminSlots(layoutTag([a, b], 8 * 60, 18 * 60));
    expect(ergebnis.map((s) => s.entry.id)).toEqual(['b', 'a']);
  });
});
