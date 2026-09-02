import { resolveScheme } from './appearanceMode';

describe('UX-F-030 Manuelle Übersteuerung des Erscheinungsbilds folgt der Wahl, nicht dem System', () => {
  it('erzwingt hell, auch wenn das System dunkel meldet', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
  });

  it('erzwingt dunkel, auch wenn das System hell meldet', () => {
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });

  it('erzwingt dunkel auch bei unbekanntem Systemwert (null)', () => {
    expect(resolveScheme('dark', null)).toBe('dark');
  });
});

describe('UX-F-020 „system" folgt der Systemeinstellung', () => {
  it('übernimmt den aktuellen Systemwert', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('fällt bei unbekanntem Systemwert auf hell zurück', () => {
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', undefined)).toBe('light');
  });
});
