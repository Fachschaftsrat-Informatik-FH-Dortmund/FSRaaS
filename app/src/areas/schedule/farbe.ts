// SCHED-F-660: deterministische Farbvergabe je Veranstaltung — derselbe
// Schlüssel (z. B. `courseId`, ersatzweise `name`, siehe `kursbaum.ts`) ergibt
// immer dieselbe Farbe aus `theme/tokens.ts` (`SCHEDULE_PALETTE`). Dazu
// UX-F-040: Ableitung der Textfarbe aus der Hintergrundhelligkeit, mit dem in
// UX-N-010 geforderten Mindestkontrast von 4,5:1 (WCAG „AA", normaler Text).
// Reine Funktionen ohne React.

import { SCHEDULE_NEUTRAL, SCHEDULE_PALETTE } from '@/theme/tokens';
import type { PlanEntry } from './typen';

/** Stabiler String-Hash (djb2) — deterministisch, keine Abhängigkeit von Objekt-/Map-Reihenfolge. */
function hashText(text: string): number {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return hash >>> 0; // vorzeichenlos
}

/**
 * SCHED-F-660: liefert für `schluessel` immer dieselbe Farbe aus `palette`.
 * Reiner Funktionsaufruf, kein Zufall, keine Abhängigkeit von der Reihenfolge
 * vorheriger Aufrufe — anders als z. B. ein fortlaufender Zähler.
 */
export function farbeFuerVeranstaltung(
  schluessel: string,
  palette: readonly string[] = SCHEDULE_PALETTE,
): string {
  if (palette.length === 0) {
    throw new Error('farbeFuerVeranstaltung: Palette darf nicht leer sein');
  }
  const index = hashText(schluessel) % palette.length;
  return palette[index]!;
}

/**
 * Requirement „Farbwahl je Termin": entscheidet, welche Farbe ein Eintrag
 * tatsächlich zeigt. `entry.color` trägt immer eine echte Farbe — automatisch
 * vergeben oder von der Nutzerin gewählt. Ist die Automatik abgeschaltet,
 * erscheinen nur die automatisch vergebenen Farben als neutrale Fläche; eine
 * eigene Farbwahl (`farbeVonNutzer`) bleibt sichtbar und geht dadurch nicht
 * verloren. Das Abschalten wirkt damit auch auf einen bereits bestehenden Plan
 * und ist umkehrbar (Prüfprotokoll 2026-09-09, Abschnitt 3).
 */
export function anzeigeFarbe(entry: PlanEntry, farbautomatik: boolean): string {
  return farbautomatik || entry.farbeVonNutzer === true ? entry.color : SCHEDULE_NEUTRAL;
}

function hexZuRgb(hex: string): { r: number; g: number; b: number } {
  const bereinigt = hex.replace('#', '');
  return {
    r: parseInt(bereinigt.slice(0, 2), 16),
    g: parseInt(bereinigt.slice(2, 4), 16),
    b: parseInt(bereinigt.slice(4, 6), 16),
  };
}

/** sRGB-Kanal (0..255) in den linearen Anteil der WCAG-Leuchtdichteformel. */
function linearerKanal(kanal8Bit: number): number {
  const kanal = kanal8Bit / 255;
  return kanal <= 0.03928 ? kanal / 12.92 : ((kanal + 0.055) / 1.055) ** 2.4;
}

/** Relative Leuchtdichte nach WCAG 2.x (0 = Schwarz, 1 = Weiß). */
function relativeLeuchtdichte(hex: string): number {
  const { r, g, b } = hexZuRgb(hex);
  return 0.2126 * linearerKanal(r) + 0.7152 * linearerKanal(g) + 0.0722 * linearerKanal(b);
}

/** Kontrastverhältnis zweier relativer Leuchtdichten nach WCAG 2.x. */
function kontrastverhaeltnis(a: number, b: number): number {
  const [hell, dunkel] = a > b ? [a, b] : [b, a];
  return (hell + 0.05) / (dunkel + 0.05);
}

const WEISS_LEUCHTDICHTE = 1;
const SCHWARZ_LEUCHTDICHTE = 0;

/**
 * UX-F-040/UX-N-010: leitet aus einer Hintergrundfarbe die besser lesbare
 * Textfarbe (Schwarz oder Weiß) ab. Für jede beliebige Hintergrundfarbe
 * erreicht die jeweils bessere der beiden Optionen mathematisch mindestens
 * ~4,58:1 (Kontrast-Kreuzungspunkt der WCAG-Formel bei Leuchtdichte ≈0,179) —
 * damit ist der geforderte Mindestkontrast von 4,5:1 stets erfüllt.
 */
export function textfarbeFuerHintergrund(hintergrundHex: string): string {
  const leuchtdichte = relativeLeuchtdichte(hintergrundHex);
  const kontrastZuWeiss = kontrastverhaeltnis(leuchtdichte, WEISS_LEUCHTDICHTE);
  const kontrastZuSchwarz = kontrastverhaeltnis(leuchtdichte, SCHWARZ_LEUCHTDICHTE);
  return kontrastZuWeiss >= kontrastZuSchwarz ? '#FFFFFF' : '#000000';
}

/** Tatsächlich erreichtes Kontrastverhältnis zwischen einer Textfarbe und einer Hintergrundfarbe. */
export function kontrastZuHintergrund(textHex: string, hintergrundHex: string): number {
  return kontrastverhaeltnis(relativeLeuchtdichte(textHex), relativeLeuchtdichte(hintergrundHex));
}
