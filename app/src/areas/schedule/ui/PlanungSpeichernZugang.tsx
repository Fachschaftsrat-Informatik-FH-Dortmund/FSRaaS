import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { usePlanungAktion } from '../planungAktion';

// Requirements „Ausdrückliches Sichern der Planung" und „Verwerfen der Auswahl
// im Planungsmodus": die beiden Kopfzeilen-Symbole des Planungsmodus
// (design.md, Entscheidung 7), als headerRight in
// `app/(tabs)/(schedule)/_layout.tsx` — wie `FilterResetAction" beim
// Mensaplan. Außerhalb des Planungsmodus liefert `usePlanungAktion` `null`,
// beide Schaltflächen verschwinden dann vollständig.
export function PlanungSpeichernZugang() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const aktion = usePlanungAktion();

  if (!aktion) return null;

  return (
    <View style={styles.gruppe}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('schedule.planungVerwerfen')}
        onPress={aktion.verwerfen}
        style={styles.zugang}
        hitSlop={8}
      >
        <Ionicons name="close" size={22} color={colors.text} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !aktion.hatUngesicherteAenderungen }}
        accessibilityLabel={
          aktion.hatUngesicherteAenderungen
            ? t('schedule.planungSichernMitAenderungen')
            : t('schedule.planungSichern')
        }
        disabled={!aktion.hatUngesicherteAenderungen}
        onPress={aktion.sichern}
        style={styles.zugang}
        hitSlop={8}
      >
        <Ionicons
          name={aktion.hatUngesicherteAenderungen ? 'save' : 'save-outline'}
          size={22}
          color={aktion.hatUngesicherteAenderungen ? colors.accent : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gruppe: { flexDirection: 'row' },
  zugang: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
