import ausgangsbestand from './assets/stammdaten-ausgangsbestand.json';

// MENSA-F-075 / API-F-235: der im Anwendungspaket mitgelieferte Ausgangsbestand
// muss ohne Backend eine brauchbare Mensa-Liste liefern.

describe('MENSA-F-075 / API-F-235 mitgelieferter Stammdaten-Ausgangsbestand', () => {
  it('enthält eine nicht-leere Mensa-Liste mit den Pflichtfeldern', () => {
    expect(Array.isArray(ausgangsbestand.mensen)).toBe(true);
    expect(ausgangsbestand.mensen.length).toBeGreaterThan(0);
    for (const m of ausgangsbestand.mensen) {
      expect(typeof m.id).toBe('string');
      expect(m.id.length).toBeGreaterThan(0);
      expect(typeof m.name).toBe('string');
      expect(typeof m.quelleId).toBe('string');
      expect(typeof m.reihenfolge).toBe('number');
    }
  });

  it('markiert genau eine Mensa als Standardauswahl', () => {
    const standard = ausgangsbestand.mensen.filter((m) => m.standardAuswahl);
    expect(standard).toHaveLength(1);
  });

  it('trägt die vom Vertrag geforderten Sammlungen, auch wenn leer', () => {
    expect(ausgangsbestand).toHaveProperty('raeume');
    expect(ausgangsbestand).toHaveProperty('links');
    expect(ausgangsbestand).toHaveProperty('semestertermine');
  });
});
