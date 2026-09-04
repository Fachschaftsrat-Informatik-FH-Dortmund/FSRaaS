import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useMensaVerzeichnisse, type Verzeichnisse } from '../api';
import { useIntolerances } from '../intolerances';

// MENSA-F-170 bis F-180: Festlegen eigener Unverträglichkeiten aus dem
// Zusatzstoff-/Allergenverzeichnis (INT-015 `/additives`). Der Hinweis auf die
// ausschließlich lokale Verarbeitung (MENSA-F-175) steht über der Auswahlliste.
// Die Auswahl verlässt das Gerät nie (MENSA-F-215).

export function IntoleranceScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const query = useMensaVerzeichnisse();
  const { codes, toggle, clear } = useIntolerances();

  return (
    <Screen scroll>
      <View style={[styles.hinweis, { backgroundColor: colors.banner }]}>
        <Text style={[styles.hinweisText, { color: colors.onBanner }]}>
          {t('mensa.unvertraeglichkeitenLokalHinweis')}
        </Text>
      </View>

      <AsyncStates<Verzeichnisse>
        query={query}
        isEmpty={(d) => d.zusatzstoffe.length === 0}
        emptyTitle={t('mensa.unvertraeglichkeitenLeerTitel')}
        emptyNextStep={t('mensa.unvertraeglichkeitenLeerHinweis')}
      >
        {(d) => (
          <View style={styles.liste}>
            {codes.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('mensa.unvertraeglichkeitenZuruecksetzen')}
                onPress={clear}
                style={styles.zuruecksetzen}
              >
                <Text style={[styles.zuruecksetzenText, { color: colors.accent }]}>
                  {t('mensa.unvertraeglichkeitenZuruecksetzen')}
                </Text>
              </Pressable>
            ) : null}
            {d.zusatzstoffe.map((z) => (
              <View
                key={z.id}
                style={[styles.zeile, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.name, { color: colors.text }]}>{z.bezeichnung}</Text>
                <Switch
                  value={codes.includes(z.id)}
                  onValueChange={() => toggle(z.id)}
                  accessibilityLabel={z.bezeichnung}
                />
              </View>
            ))}
          </View>
        )}
      </AsyncStates>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hinweis: { padding: 10, borderRadius: 8 },
  hinweisText: { fontSize: 13 },
  liste: { gap: 0 },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: { fontSize: 16, flex: 1 },
  zuruecksetzen: { minHeight: 44, justifyContent: 'center' },
  zuruecksetzenText: { fontSize: 15, fontWeight: '600' },
});
