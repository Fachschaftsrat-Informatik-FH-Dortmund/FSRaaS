// Farbsystem der App. #FF6600 ist die Akzentfarbe (UX-F-010), nicht die
// Flächenfarbe jeder Ansicht. Hell- und Dunkelpalette teilen dieselben
// Rollennamen, damit Komponenten nur Rollen referenzieren, nie feste Hex-Werte.

export type Scheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  onAccent: string;
  danger: string;
  banner: string;
  onBanner: string;
}

const ACCENT = '#FF6600';

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#1C1C1E',
  textMuted: 'rgba(28,28,30,0.6)',
  border: '#C6C6C8',
  accent: ACCENT,
  onAccent: '#FFFFFF',
  danger: '#B3261E',
  banner: '#3A3A3C',
  onBanner: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#F2F2F7',
  textMuted: 'rgba(242,242,247,0.6)',
  border: '#38383A',
  accent: ACCENT,
  onAccent: '#FFFFFF',
  danger: '#F2B8B5',
  banner: '#48484A',
  onBanner: '#FFFFFF',
};

export function colorsFor(scheme: Scheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}
