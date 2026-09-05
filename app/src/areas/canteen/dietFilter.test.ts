import { baueTokenGruppen, gerichtDietBetroffen } from './dietFilter';

describe('MENSA-F-250 Lebensstil-Vorgabe (nur Gerichte mit allen gewählten Kennzeichnungen)', () => {
  it('blendet Gerichte aus, die nicht jede geforderte Kennzeichnung tragen', () => {
    const nurZeigen = [['1', 'vegan']];
    expect(gerichtDietBetroffen(['vegan'], nurZeigen, [])).toBe(false);
    expect(gerichtDietBetroffen(['vegetarisch'], nurZeigen, [])).toBe(true);
    expect(gerichtDietBetroffen(undefined, nurZeigen, [])).toBe(true);
  });

  it('fordert bei mehreren Vorgaben alle (UND-Verknüpfung)', () => {
    const nurZeigen = [['vegan'], ['klimateller']];
    expect(gerichtDietBetroffen(['vegan', 'klimateller'], nurZeigen, [])).toBe(false);
    expect(gerichtDietBetroffen(['vegan'], nurZeigen, [])).toBe(true);
  });

  it('trifft über die Verzeichnis-Id genauso wie über den Anzeigenamen', () => {
    const nurZeigen = baueTokenGruppen(['1'], (id) => (id === '1' ? 'vegan' : undefined));
    expect(gerichtDietBetroffen(['1'], nurZeigen, [])).toBe(false);
    expect(gerichtDietBetroffen(['vegan'], nurZeigen, [])).toBe(false);
  });
});

describe('MENSA-F-260 Ausschluss (Gericht mit einer der Kennzeichnungen verbergen)', () => {
  it('blendet Gerichte mit einer ausgeschlossenen Kennzeichnung aus', () => {
    const ausschluss = [['9', 'Schwein']];
    expect(gerichtDietBetroffen(['Schwein', 'Rind'], [], ausschluss)).toBe(true);
    expect(gerichtDietBetroffen(['Rind'], [], ausschluss)).toBe(false);
    expect(gerichtDietBetroffen(undefined, [], ausschluss)).toBe(false);
  });
});

describe('Ohne Vorgabe ist kein Gericht betroffen', () => {
  it('leere Vorgaben lassen alles durch', () => {
    expect(gerichtDietBetroffen(['Schwein'], [], [])).toBe(false);
    expect(gerichtDietBetroffen(undefined, [], [])).toBe(false);
  });
});
