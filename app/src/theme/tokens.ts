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

/**
 * SCHED-F-660: feste Farbpalette für die selbsttätige Veranstaltungsfarbvergabe
 * im Stundenplan (`areas/schedule/farbe.ts`). Ein Satz kräftiger, voneinander
 * unterscheidbarer Farbtöne, der in hellem wie dunklem Erscheinungsbild als
 * Terminfläche trägt — die Textfarbe wird je Verwendung aus der Helligkeit des
 * gewählten Farbtons abgeleitet (UX-F-040), nicht aus dem Schema selbst, daher
 * genügt eine einzige Palette für beide Schemata.
 */
/**
 * Requirement „Farbwahl je Termin": Platzhalterfarbe für neu angelegte
 * Termine, solange die Farbautomatik abgeschaltet ist (`ansichtEinstellungen.ts`).
 * Theme-unabhängiger fester Wert wie die übrige Palette. Die endgültige
 * Gestalt — neutrale Fläche oder Umriss — ist eine Gestaltungsfrage
 * (design.md, offene Frage, Prüfprotokoll Aufgabe 9.2); dieser Wert ist ein
 * begründeter Zwischenstand, kein Abschluss der Frage.
 */
export const SCHEDULE_NEUTRAL = '#9E9E9E';

export const SCHEDULE_PALETTE: readonly string[] = [
  '#1E88E5', // Blau
  '#43A047', // Grün
  '#8E24AA', // Violett
  '#FB8C00', // Orange
  '#00897B', // Petrol
  '#D81B60', // Magenta
  '#6D4C41', // Braun
  '#3949AB', // Indigo
  '#7CB342', // Hellgrün
  '#F4511E', // Ziegelrot
  '#00ACC1', // Türkis
  '#5E35B1', // Lila
];
