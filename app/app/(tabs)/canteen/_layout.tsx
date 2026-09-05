import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FilterResetAction } from '@/areas/canteen/ui/FilterResetAction';
import { FilterZugang } from '@/areas/canteen/ui/FilterZugang';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Verschachtelter Stack des Mensaplans (SHELL-F-050: Routendateien sind reine
// Re-Exporte aus app/src/areas/canteen). Die Mensenauswahl (auswahl) liegt als
// Unterseite darüber; initialRouteName legt die Speiseplan-Ansicht unter jeden
// tieferen Einsprung (SHELL-F-100).
export const unstable_settings = { initialRouteName: 'index' };

export default function CanteenLayout() {
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
      <Stack.Screen
        name="index"
        options={{ title: t('nav.canteen'), headerRight: () => <FilterZugang /> }}
      />
      <Stack.Screen name="auswahl" options={{ title: t('mensa.mensenWaehlen') }} />
      <Stack.Screen name="alle" options={{ title: t('mensa.alleMensenTitel') }} />
      <Stack.Screen
        name="filter"
        options={{ title: t('mensa.filterTitel'), headerRight: () => <FilterResetAction /> }}
      />
    </Stack>
  );
}
