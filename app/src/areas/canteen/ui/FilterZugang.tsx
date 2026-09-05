import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { useDietPreference } from '../dietPreference';
import { useIntolerances } from '../intolerances';
import { usePriceLimit } from '../priceLimit';

// MENSA-F-170 / F-280: Zugang zum Filtermenü auf Höhe des Bildschirmtitels (als
// headerRight der Speiseplan-Ansicht). Klassisches Trichter-/Filtersymbol
// (Ionicons `funnel`, dasselbe Symbolsystem wie die Tab-Leiste, UX-F-150). Es
// hebt sich farblich ab und wird gefüllt dargestellt, sobald irgendein Filter
// aktiv ist (Preis, Unverträglichkeit, Lebensstil-Vorgabe oder Ausschluss).
export function FilterZugang() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { codes } = useIntolerances();
  const { prefs } = useDietPreference();
  const { limit } = usePriceLimit();
  const aktiv =
    (limit != null ? 1 : 0) + codes.length + prefs.nurZeigen.length + prefs.ausschluss.length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('mensa.filterZugang')}
      accessibilityState={{ selected: aktiv }}
      onPress={() => router.push('/canteen/filter')}
      style={styles.zugang}
      hitSlop={8}
    >
      <Ionicons
        name={aktiv ? 'funnel' : 'funnel-outline'}
        size={22}
        color={aktiv ? colors.accent : colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zugang: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
