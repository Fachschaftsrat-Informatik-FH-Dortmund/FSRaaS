import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useQuickActionRouting } from '@/navigation/quickActions';
import { tabIcon } from '@/navigation/tabIcons';
import { useStartView } from '@/navigation/useStartView';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Tab-Leiste mit genau vier Bereichen (SHELL-F-060); alles Übrige liegt im
// „Mehr"-Tab, der selbst ein verschachtelter Stack ist (SHELL-F-010, ADR 0013).
// Jeder Tab hält seinen eigenen Stack und behält ihn bei Tab-Wechsel; erneutes
// Antippen kehrt zur Wurzel zurück — beides Standardverhalten des Navigators
// (SHELL-F-080/F-085), hier nicht abgeschaltet. Die Symboltabelle (UX-F-150)
// liegt in src/navigation/tabIcons.tsx (SHELL-F-050: Routendateien tragen
// keine Fachlogik).

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  useStartView(); // SHELL-F-070 (Startansicht), SET-F-160 (zuletzt genutzt)
  useQuickActionRouting(); // SHELL-F-040 (Schnellzugriffe), SHELL-F-100 (Rückweg)

  return (
    <Tabs
      screenOptions={{
        // Kopfzeile an Ort und Stelle überblenden statt waagerecht verschieben —
        // sonst wirkt der Titelwechsel beim Tab-Wechsel unruhig
        // (specs/platform/ux-and-theming.md, zu UX-F-170 / UX-N-030).
        animation: reducedMotion ? 'none' : 'fade', // UX-N-030
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.schedule'), tabBarIcon: tabIcon('index') }}
      />
      {/* Mensaplan ist ein verschachtelter Stack (Speiseplan + Mensenauswahl) und
          zeigt seine eigenen Kopfzeilen. */}
      <Tabs.Screen
        name="canteen"
        options={{ title: t('nav.canteen'), headerShown: false, tabBarIcon: tabIcon('canteen') }}
      />
      <Tabs.Screen name="news" options={{ title: t('nav.news'), tabBarIcon: tabIcon('news') }} />
      <Tabs.Screen name="rooms" options={{ title: t('nav.rooms'), tabBarIcon: tabIcon('rooms') }} />
      <Tabs.Screen
        name="more"
        options={{ title: t('nav.more'), headerShown: false, tabBarIcon: tabIcon('more') }}
      />
    </Tabs>
  );
}
