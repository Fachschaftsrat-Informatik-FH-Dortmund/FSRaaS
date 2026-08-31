// NFR-F-115: Deutsch und Englisch von Anfang an. Beide Kataloge müssen exakt
// denselben Schlüsselbaum tragen — sonst zeigt eine Sprache Lücken oder
// verwaiste Einträge.

import de from './de.json';
import en from './en.json';

function flatKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('NFR-F-115 Sprachkataloge Deutsch und Englisch', () => {
  const deKeys = flatKeys(de).sort();
  const enKeys = flatKeys(en).sort();

  it('tragen exakt denselben Schlüsselbaum', () => {
    expect(enKeys).toEqual(deKeys);
  });

  it('haben zu jedem Schlüssel einen nicht-leeren Wert', () => {
    for (const catalog of [de, en]) {
      for (const key of flatKeys(catalog)) {
        const value = key
          .split('.')
          .reduce<unknown>((acc, part) => (acc as Record<string, unknown>)[part], catalog);
        expect(typeof value).toBe('string');
        expect((value as string).trim().length).toBeGreaterThan(0);
      }
    }
  });
});
