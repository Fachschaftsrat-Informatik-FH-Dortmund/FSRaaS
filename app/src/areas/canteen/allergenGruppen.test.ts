import { allergenGruppen, gruppeVollstaendig } from './allergenGruppen';

// Ausschnitt aus der Legende von INT-020, Stand 2026-09-22/24: die Quelle führt
// `20` („Gluten, nicht näher bezeichnet") als eigenen Eintrag neben `20a`–`20f`
// und kennt zu den Nüssen gar keinen Stamm-Eintrag, sondern allein `27a`–`27h`.
const ALLERGENE = [
  { id: '20', bezeichnung: 'Gluten (nicht näher bezeichnet)' },
  { id: '20a', bezeichnung: 'Gluten aus Weizen' },
  { id: '20b', bezeichnung: 'Gluten aus Roggen' },
  { id: '20c', bezeichnung: 'Gluten aus Gerste' },
  { id: '20d', bezeichnung: 'Gluten aus Hafer' },
  { id: '20e', bezeichnung: 'Gluten aus Dinkel' },
  { id: '20f', bezeichnung: 'Gluten aus Kamut' },
  { id: '21', bezeichnung: 'Krebstiere' },
  { id: '26', bezeichnung: 'Milch inkl. Lactose' },
  { id: '27a', bezeichnung: 'Mandeln' },
  { id: '27b', bezeichnung: 'Haselnüsse' },
  { id: '27c', bezeichnung: 'Walnüsse' },
  { id: '27d', bezeichnung: 'Kaschunüsse' },
  { id: '27e', bezeichnung: 'Pekannüsse' },
  { id: '27f', bezeichnung: 'Paranüsse' },
  { id: '27g', bezeichnung: 'Pistazien' },
  { id: '27h', bezeichnung: 'Macadamia- oder Queenslandnüsse' },
];

describe('Sammelschalter für zusammengehörige Allergengruppen', () => {
  it('leitet genau die von der Quelle gegliederten Gruppen aus dem Verzeichnis ab', () => {
    expect(allergenGruppen(ALLERGENE)).toEqual([
      { stamm: '20', unterschluessel: ['20a', '20b', '20c', '20d', '20e', '20f'] },
      { stamm: '27', unterschluessel: ['27a', '27b', '27c', '27d', '27e', '27f', '27g', '27h'] },
    ]);
  });

  it('führt den Stamm selbst nicht als Unterschlüssel — `20` bleibt eine eigene Angabe', () => {
    const gluten = allergenGruppen(ALLERGENE)[0]!;
    expect(gluten.unterschluessel).not.toContain('20');
  });

  it('bildet keine Gruppe aus einem ungegliederten Allergen', () => {
    const nurMilch = ALLERGENE.filter((a) => a.id === '26');
    expect(allergenGruppen(nurMilch)).toEqual([]);
  });

  it('bildet keine Gruppe aus einem einzelnen Unterschlüssel', () => {
    const einzeln = [{ id: '40a', bezeichnung: 'Erfundenes' }];
    expect(allergenGruppen(einzeln)).toEqual([]);
  });

  it('gilt erst als vollständig, wenn jeder Unterschlüssel gewählt ist', () => {
    const gluten = allergenGruppen(ALLERGENE)[0]!;
    expect(gruppeVollstaendig(gluten, ['20a', '20b'])).toBe(false);
    expect(gruppeVollstaendig(gluten, ['20a', '20b', '20c', '20d', '20e', '20f'])).toBe(true);
    // Der Stamm allein macht die Gruppe nicht vollständig.
    expect(gruppeVollstaendig(gluten, ['20'])).toBe(false);
  });
});
