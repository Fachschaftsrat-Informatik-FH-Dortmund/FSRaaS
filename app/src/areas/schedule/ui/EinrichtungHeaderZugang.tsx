import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme } from '@/theme';

// Requirement „Dauerhafter Zugang zur Einrichtung": ein jederzeit sichtbares
// Kopfzeilen-Element, unabhängig davon, ob bereits ein persönlicher Plan
// besteht. Anders als `PlanungSpeichernZugang` braucht dieser Bedienweg kein
// Register (design.md, Entscheidung 7) — er navigiert nur und steht als
// Teil des headerRight der Wochenansicht in `app/(tabs)/(schedule)/_layout.tsx`,
// neben `VerwaltungsblattZugang`.
//
// Wiederhergestellt am 2026-09-09: `stundenplan-wochenansicht-nutzerfuehrung`
// hatte diesen eigenständigen Zugang zwischenzeitlich wieder ins
// Verwaltungsblatt gebündelt. Das widerspricht dem Requirement „Dauerhafter
// Zugang zur Einrichtung" (Capability `schedule`), das einen eigenen
// Bedienweg verlangt, der beim Blättern sichtbar bleibt — Entscheidung bei
// der Bereinigung der beiden Changes: die Spec gilt, das Verwaltungsblatt
// führt nur noch Ansichtsschalter und Löschaktionen.
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
