import de from './de.json';

// UX-F-210: Deutsche Nutzertexte durchgängig in der Anrede „du". Prüft die
// Kataloge auf formelle Anrede-Formen als eigenständige Wörter.

function values(obj: unknown): string[] {
  if (typeof obj === 'string') return [obj];
  if (obj && typeof obj === 'object') return Object.values(obj as Record<string, unknown>).flatMap(values);
  return [];
}

describe('UX-F-210 Anrede „du" in den deutschen Texten', () => {
  const formal = /\b(Sie|Ihnen|Ihre[nrms]?|Ihr)\b/;

  it.each(values(de).map((v) => [v] as const))('kein förmliches „Sie/Ihr" in %j', (text) => {
    expect(formal.test(text)).toBe(false);
  });

  it('verwendet die informelle Anrede tatsächlich (Stichprobe)', () => {
    const all = values(de).join(' ');
    expect(/\b(du|dein|deine[nrms]?|dich|dir)\b/i.test(all)).toBe(true);
  });
});
