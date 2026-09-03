import { DefaultTheme } from '@react-navigation/native';

import { navigationThemeFor } from './navigationTheme';
import { darkColors, lightColors } from './tokens';

// UX-F-020: Das Erscheinungsbild muss durchgängig wirken, auch für die vom
// Navigations-Werkzeug gezeichneten Flächen (Navigator-Grund, Kopf-/Tab-Leiste,
// Übergangsflächen). Sichtprüfung des behobenen weißen Aufblitzens beim
// Tab-Wechsel: specs/pruefprotokolle/2026-09-02-app-rahmen.md.

describe('UX-F-020 Navigations-Theme folgt dem wirksamen Farbschema', () => {
  it('nimmt im Dunkelmodus den dunklen Flächengrund für Navigator und Szenenübergänge', () => {
    const theme = navigationThemeFor('dark', darkColors);
    expect(theme.dark).toBe(true);
    expect(theme.colors.background).toBe(darkColors.background);
    expect(theme.colors.card).toBe(darkColors.background);
    expect(theme.colors.text).toBe(darkColors.text);
    expect(theme.colors.border).toBe(darkColors.border);
  });

  it('nimmt im Hellmodus den hellen Flächengrund', () => {
    const theme = navigationThemeFor('light', lightColors);
    expect(theme.dark).toBe(false);
    expect(theme.colors.background).toBe(lightColors.background);
    expect(theme.colors.card).toBe(lightColors.background);
  });

  it('ersetzt die helle Voreinstellung von React Navigation im Dunkelmodus', () => {
    // Ohne die Brücke stünde hier der near-weiße DefaultTheme-Grund.
    expect(navigationThemeFor('dark', darkColors).colors.background).not.toBe(
      DefaultTheme.colors.background,
    );
  });

  it('verwendet die Akzentfarbe als primäre Navigationsfarbe (UX-F-010)', () => {
    expect(navigationThemeFor('dark', darkColors).colors.primary).toBe(darkColors.accent);
    expect(navigationThemeFor('light', lightColors).colors.primary).toBe(lightColors.accent);
  });

  it('behält Schriftbild-Vorgaben des Basis-Themes bei, statt sie selbst zu setzen', () => {
    expect(navigationThemeFor('light', lightColors).fonts).toEqual(DefaultTheme.fonts);
  });
});
