import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Verschachtelter Stack der Verwaltung (SHELL-F-050: Routendateien sind reine
// Re-Exporte aus app/src/areas/admin). Der Bereich ist nur mit Verwaltungsrolle
// sichtbar (ADMIN-F-020) und serverseitig geschützt (ADMIN-F-010).
export const unstable_settings = { initialRouteName: 'index' };

export default function AdminLayout() {
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
      <Stack.Screen name="index" options={{ title: t('admin.title') }} />
      <Stack.Screen name="rollen" options={{ title: t('admin.sections.rollen') }} />
      <Stack.Screen name="stammdaten" options={{ title: t('admin.sections.stammdaten') }} />
      <Stack.Screen name="laufwege" options={{ title: t('admin.sections.laufwege') }} />
    </Stack>
  );
}
