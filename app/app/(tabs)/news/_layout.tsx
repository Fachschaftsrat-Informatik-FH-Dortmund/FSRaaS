import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Verschachtelter Stack des News-Bereichs (SHELL-F-050: Routendateien sind reine
// Re-Exporte aus app/src/areas/news). Die Liste liegt in `index`, die
// Detailansicht einer Meldung darüber; initialRouteName legt die Liste unter
// jeden tieferen Einsprung (SHELL-F-100).
export const unstable_settings = { initialRouteName: 'index' };

export default function NewsLayout() {
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
      <Stack.Screen name="index" options={{ title: t('nav.news') }} />
      <Stack.Screen name="[meldungId]" options={{ title: t('news.detail.titel') }} />
    </Stack>
  );
}
