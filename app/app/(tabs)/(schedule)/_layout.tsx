import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Verschachtelter Stack des Stundenplans (SHELL-F-050: Routendateien sind reine
// Re-Exporte aus app/src/areas/schedule). Der Ordnername trägt Klammern
// ((schedule)), damit er selbst nicht zum Pfad beiträgt — `index` darin bleibt
// `/`, wie es `src/navigation/navMap.ts` (href: '/') und der Tab-Platz an
// erster Stelle verlangen (specs/features/schedule/spec.md, Etappe 2b).
// `initialRouteName` legt die Übersicht unter jeden tieferen Einsprung
// (SHELL-F-100), wie im `canteen`- und `more`-Stack.
export const unstable_settings = { initialRouteName: 'index' };

export default function ScheduleLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        animation: reducedMotion ? 'none' : 'default',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('nav.schedule') }} />
      <Stack.Screen name="einrichtung" options={{ title: t('schedule.einrichtungTitel') }} />
      <Stack.Screen name="kurse" options={{ title: t('schedule.kurseTitel') }} />
      <Stack.Screen name="detail" options={{ title: t('schedule.detailTitel') }} />
      <Stack.Screen name="termin" options={{ title: t('schedule.terminTitel') }} />
    </Stack>
  );
}
