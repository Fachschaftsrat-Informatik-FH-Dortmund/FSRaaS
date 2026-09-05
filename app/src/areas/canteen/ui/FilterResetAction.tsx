import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { useDietPreference } from '../dietPreference';
import { useIntolerances } from '../intolerances';
import { usePriceLimit } from '../priceLimit';

// „Alle Filter entfernen" als headerRight des Filtermenüs — oben rechts neben dem
// Titel, damit das Anhaken einer Zeile keinen Inhalt verschiebt (Nutzerhinweis).
// Immer sichtbar, nur bei mindestens einer gesetzten Vorgabe auslösbar.
export function FilterResetAction() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const intolerances = useIntolerances();
  const diet = useDietPreference();
  const preis = usePriceLimit();

  const etwasGesetzt =
    (preis.limit != null ? 1 : 0) +
      intolerances.codes.length +
      diet.prefs.nurZeigen.length +
      diet.prefs.ausschluss.length >
    0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('mensa.filterZuruecksetzen')}
      accessibilityState={{ disabled: !etwasGesetzt }}
      disabled={!etwasGesetzt}
      onPress={() => {
        intolerances.clear();
        diet.clear();
        preis.clear();
      }}
      style={styles.aktion}
      hitSlop={8}
    >
      <Text
        style={[styles.text, { color: etwasGesetzt ? colors.accent : colors.textMuted }]}
      >
        {t('mensa.filterZuruecksetzenKurz')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  aktion: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
  text: { fontSize: 15, fontWeight: '600' },
});
