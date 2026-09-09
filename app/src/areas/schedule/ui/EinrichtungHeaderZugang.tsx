import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';

// Requirement „Dauerhafter Zugang zur Einrichtung": ein jederzeit sichtbares
// Kopfzeilen-Element, unabhängig davon, ob bereits ein persönlicher Plan
// besteht. Anders als `PlanungSpeichernZugang` braucht dieser Bedienweg kein
// Register (design.md, Entscheidung 7) — er navigiert nur und steht als
// headerRight der Wochenansicht in `app/(tabs)/(schedule)/_layout.tsx`.
export function EinrichtungHeaderZugang() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('schedule.einrichtungBearbeiten')}
      onPress={() => router.push('/einrichtung')}
      style={styles.zugang}
      hitSlop={8}
    >
      <Ionicons name="pencil" size={22} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zugang: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
