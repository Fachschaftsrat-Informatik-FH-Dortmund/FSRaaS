// Brücke zwischen dem Farbsystem der App (tokens.ts) und dem eigenen Theme von
// React Navigation. Expo Router hält über einen internen NavigationContainer ein
// getrenntes Theme, das ohne Zutun auf der hellen Voreinstellung (DefaultTheme)
// bleibt — auch im Dunkelmodus. Dann sind der Navigator-Grund, Kopf- und
// Tab-Leiste sowie die Fläche hinter Szenenübergängen hell; beim Tab-Wechsel
// blitzt sie durch die kurz teiltransparenten Szenen als weißer Rand durch.
// Diese Funktion leitet aus dem wirksamen Schema (also auch aus einer manuellen
// Übersteuerung, UX-F-030) ein passendes Navigations-Theme ab (UX-F-020).

import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

import type { Scheme, ThemeColors } from './tokens';

export function navigationThemeFor(scheme: Scheme, colors: ThemeColors): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
      notification: colors.accent,
    },
  };
}
