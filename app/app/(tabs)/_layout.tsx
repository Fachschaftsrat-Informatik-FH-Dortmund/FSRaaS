import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useQuickActionRouting } from '@/navigation/quickActions';
import { useStartView } from '@/navigation/useStartView';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Tab-Leiste mit genau vier Bereichen (SHELL-F-060); alles Übrige liegt im
// „Mehr"-Tab, der selbst ein verschachtelter Stack ist (SHELL-F-010, ADR 0013).
// Jeder Tab hält seinen eigenen Stack und behält ihn bei Tab-Wechsel; erneutes
// Antippen kehrt zur Wurzel zurück — beides Standardverhalten des Navigators
// (SHELL-F-080/F-085), hier nicht abgeschaltet.
export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  useStartView(); // SHELL-F-070 (Startansicht), SET-F-160 (zuletzt genutzt)
  useQuickActionRouting(); // SHELL-F-040 (Schnellzugriffe), SHELL-F-100 (Rückweg)

  return (
    <Tabs
      screenOptions={{
        animation: reducedMotion ? 'none' : 'shift', // UX-N-030
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.schedule') }} />
      <Tabs.Screen name="canteen" options={{ title: t('nav.canteen') }} />
      <Tabs.Screen name="news" options={{ title: t('nav.news') }} />
      <Tabs.Screen name="rooms" options={{ title: t('nav.rooms') }} />
      <Tabs.Screen name="more" options={{ title: t('nav.more'), headerShown: false }} />
    </Tabs>
  );
}
