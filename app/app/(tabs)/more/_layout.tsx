import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// „Mehr" ist ein verschachtelter Stack (ADR 0013): eine gruppierte Liste
// weiterer Bereiche und die von dort erreichbaren Bildschirme. `initialRouteName`
// stellt sicher, dass die Liste unter jedem tieferen Bildschirm liegt — auch bei
// einem Einsprung über Schnellzugriff oder Deep Link (SHELL-F-100).
export const unstable_settings = { initialRouteName: 'index' };

export default function MoreLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        animation: reducedMotion ? 'none' : 'default', // UX-N-030
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t('more.title') }} />
      <Stack.Screen name="ticket" options={{ title: t('more.ticket') }} />
      <Stack.Screen name="settings" options={{ title: t('more.settings') }} />
      {/* Verwaltung ist ein eigener verschachtelter Stack mit eigenen Kopfzeilen. */}
      <Stack.Screen name="admin" options={{ title: t('more.admin'), headerShown: false }} />
    </Stack>
  );
}
