// Anpassung der Betriebssystem-Statusleiste an das wirksame Erscheinungsbild
// (UX-F-220). Ohne diese Anpassung behält Android die hell voreingestellte
// Systemleiste, wodurch Uhr, Akku- und Empfangsanzeige im Dunkelmodus
// unsichtbar werden (weiße Symbole auf weißem Grund).

import { StatusBar } from 'expo-status-bar';

import { useTheme } from './ThemeProvider';
import type { Scheme } from './tokens';

/**
 * Symbolfarbe der Statusleiste für ein Erscheinungsbild: auf dunklem Grund
 * helle Symbole, auf hellem dunkle. Folgt dem wirksamen Schema und damit auch
 * einer manuellen Übersteuerung (UX-F-030), nicht nur der Systemhelligkeit.
 */
export function statusBarStyle(scheme: Scheme): 'light' | 'dark' {
  return scheme === 'dark' ? 'light' : 'dark';
}

/**
 * Rendert die Statusleiste passend zum aktuellen Farbschema. `translucent`
 * (Vorgabe von expo-status-bar) lässt den themengefärbten Hintergrund der
 * jeweiligen Ansicht durchscheinen, statt einer festen Farbe.
 */
export function ThemedStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={statusBarStyle(scheme)} />;
}
