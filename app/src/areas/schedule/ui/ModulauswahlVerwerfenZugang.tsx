import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme } from '@/theme';
import { useModulauswahlAktion } from '../modulauswahlAktion';

// Requirement „Verwerfen der Modulauswahl": Kopfzeilen-Symbol, als headerRight
// in `app/(tabs)/(schedule)/_layout.tsx` — wie `PlanungSpeichernZugang".
// Außerhalb der Modulauswahl liefert `useModulauswahlAktion` `null`, die
// Schaltfläche verschwindet dann vollständig.
export function ModulauswahlVerwerfenZugang() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const aktion = useModulauswahlAktion();

  if (!aktion) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('schedule.modulauswahlVerwerfen')}
      onPress={aktion.verwerfen}
      style={styles.zugang}
      hitSlop={8}
    >
      <Ionicons name="close" size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zugang: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
