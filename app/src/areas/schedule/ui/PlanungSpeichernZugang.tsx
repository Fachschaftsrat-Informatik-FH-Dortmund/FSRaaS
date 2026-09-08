import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { usePlanungAktion } from '../planungAktion';

// Requirement „Ausdrückliches Sichern der Planung": die einzige hervorgehobene
// Primäraktion des Planungsmodus (design.md, Entscheidung 7), als headerRight
// in `app/(tabs)/(schedule)/_layout.tsx` — wie `FilterResetAction` beim
// Mensaplan. Außerhalb des Planungsmodus liefert `usePlanungAktion` `null`,
// die Schaltfläche verschwindet dann vollständig.
export function PlanungSpeichernZugang() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const aktion = usePlanungAktion();

  if (!aktion) return null;

  return (
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
  );
}

const styles = StyleSheet.create({
  zugang: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
