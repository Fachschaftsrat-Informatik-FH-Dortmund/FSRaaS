import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Verschachtelter Stack des Raum-Bereichs (SHELL-F-050: Routendateien sind reine
// Re-Exporte aus app/src/areas/room-finder). Die drei Sichten liegen in `index`,
// die Tagesbelegung eines Raums als Unterseite darüber; initialRouteName legt
// die Sichten unter jeden tieferen Einsprung (SHELL-F-100).
export const unstable_settings = { initialRouteName: 'index' };

export default function RoomsLayout() {
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
      <Stack.Screen name="index" options={{ title: t('nav.rooms') }} />
      <Stack.Screen name="raum/[roomId]" options={{ title: t('raum.tag.titel') }} />
    </Stack>
  );
}
