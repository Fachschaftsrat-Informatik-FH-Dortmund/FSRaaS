import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';

// Requirement „Zugang zur Sortier-/Gruppierauswahl": eigener Zugang im
// Kopfbereich der Hauptansicht, neben dem Filter-Trichter (als headerRight in
// app/(tabs)/canteen/_layout.tsx). Eigenes Symbol (Ionicons `swap-vertical`),
// klar vom Filter-Trichter abgrenzbar. accessibilityLabel aus i18n (NFR-F-115).
export function SortierZugang() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('mensa.sortierZugang')}
      onPress={() => router.push('/canteen/sortierung')}
      style={styles.zugang}
      hitSlop={8}
    >
      <Ionicons name="swap-vertical" size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zugang: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
