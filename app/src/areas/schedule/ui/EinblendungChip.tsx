import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@react-native-vector-icons/ionicons';

import { useTheme } from '@/theme';
import { useEinblendungsStand } from '../einblendungsStand';

// Requirement „Hinweis auf aktive Einblendung in der Kopfzeile" (Change
// `alternativtermine-abgesetzt-und-sitzungsweise`, design.md Entscheidung 3):
// steht in der Kopfzeile der Wochenansicht vor den beiden Symbolen
// (`app/(tabs)/(schedule)/_layout.tsx`), solange eine Einblendung aktiv ist.
// Der Titel „Stundenplan" bleibt der native Kopfzeilentitel. Antippen schaltet
// alle Einblendungen ab. Die Bedeutung trägt der Text, nicht die Farbe.

/** Sichtbare Höhe des Chips; `hitSlop` ergänzt die Trefffläche auf 44 dp (UX-N-020). */
const CHIP_HOEHE = 28;
const TREFF_ERGAENZUNG = (44 - CHIP_HOEHE) / 2;

export function EinblendungChip() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { stand, aktiv, alleAbschalten } = useEinblendungsStand();

  if (!aktiv) return null;

  const was =
    stand.alternativen && stand.alle
      ? t('schedule.einblendungChipBeide')
      : stand.alternativen
        ? t('schedule.einblendungChipAlternativen')
        : t('schedule.einblendungChipAlle');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('schedule.einblendungChipLabel', { was })}
      onPress={alleAbschalten}
      hitSlop={{ top: TREFF_ERGAENZUNG, bottom: TREFF_ERGAENZUNG, left: 4, right: 4 }}
      style={[styles.chip, { backgroundColor: colors.accent }]}
    >
      <Text style={[styles.text, { color: colors.onAccent }]} numberOfLines={1}>
        {was}
      </Text>
      <Ionicons name="close" size={14} color={colors.onAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: CHIP_HOEHE,
    minWidth: 44,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: CHIP_HOEHE / 2,
    alignSelf: 'center',
    marginRight: 4,
  },
  text: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
});
