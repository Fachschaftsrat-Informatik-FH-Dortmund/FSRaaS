import { Ionicons } from '@expo/vector-icons';

// Symbol je Tab der Tab-Leiste (UX-F-150): Ionicons, die mitgelieferte
// Icon-Schrift — keine Netz- oder Fremddienst-Abhängigkeit (NFR-N-170). Im
// aktiven Zustand die gefüllte Variante. Eigenes Modul unter src/navigation,
// nicht in app/(tabs)/_layout.tsx selbst (SHELL-F-050: Routendateien tragen
// keine Fachlogik) — und damit direkt testbar, ohne den (in Tests per
// jest.setup.js als Attrappe geführten) Router zu rendern.

type IoniconName = keyof typeof Ionicons.glyphMap;

export const symbole: Record<string, { aktiv: IoniconName; inaktiv: IoniconName }> = {
  index: { aktiv: 'calendar', inaktiv: 'calendar-outline' }, // Stundenplan
  canteen: { aktiv: 'restaurant', inaktiv: 'restaurant-outline' }, // Mensa: Gabel & Messer
  news: { aktiv: 'newspaper', inaktiv: 'newspaper-outline' }, // Aktuelles: Zeitung
  rooms: { aktiv: 'search', inaktiv: 'search-outline' }, // Raumsuche: Lupe (ux-and-theming.md)
  more: { aktiv: 'ellipsis-horizontal', inaktiv: 'ellipsis-horizontal-outline' }, // Mehr: ⋯
};

export function tabIcon(name: string) {
  const s = symbole[name]!;
  function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={focused ? s.aktiv : s.inaktiv} size={size} color={color} />;
  }
  return TabIcon;
}
