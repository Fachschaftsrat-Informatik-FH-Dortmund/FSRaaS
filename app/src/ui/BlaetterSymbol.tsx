import Ionicons from '@react-native-vector-icons/ionicons';

import { useTheme } from '@/theme';

// Requirement „Einheitliche Blätter-Symbole" (Capability `ux-and-theming`):
// dasselbe Symbolpaar aus dem Symbolsystem der App (Ionicons, UX-F-150) für
// jedes Blättern zwischen Zeiträumen — Tage im Mensaplan, Wochen im
// Stundenplan. Nur das Symbol; Bedienweg, Beschriftung für Bildschirmvorleser
// und Trefferfläche bleiben beim umgebenden `Pressable` der jeweiligen Ansicht.

export const BLAETTER_SYMBOLE = { zurueck: 'chevron-back', vor: 'chevron-forward' } as const;

export function BlaetterSymbol({ richtung, aus = false }: { richtung: 'zurueck' | 'vor'; aus?: boolean }) {
  const { colors } = useTheme();
  return <Ionicons name={BLAETTER_SYMBOLE[richtung]} size={22} color={aus ? colors.border : colors.text} />;
}
