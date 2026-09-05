import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useMensaVerzeichnisse, type Schluesselwert, type Verzeichnisse } from '../api';
import { useDietPreference } from '../dietPreference';
import { useIntolerances } from '../intolerances';
import { preisText } from '../preise';
import { usePriceGroup } from '../priceGroup';
import { PREIS_MAX, PREIS_MIN, usePriceLimit } from '../priceLimit';

// MENSA-F-170 bis F-275: das Filtermenü des Mensaplans. Abschnitte:
//   1. Preis (MENSA-F-235) — Höchstpreis-Steller, verglichen gegen die
//      Preisgruppe der Einstellungen.
//   2. Lebensstil (MENSA-F-250) — nur Gerichte zeigen, die ALLE gewählten
//      Kennzeichnungen tragen.
//   3. Ausschließen (MENSA-F-260) — Gerichte mit einer der Kennzeichnungen verbergen.
//   4. Unverträglichkeiten (MENSA-F-180) — Zusatzstoff-/Allergenkennzeichnungen.
// Am Seitenende der Hinweis auf die ausschließlich lokale Verarbeitung
// (MENSA-F-175). Nichts davon verlässt das Gerät (MENSA-F-215/F-275).

function KennzeichnungsAbschnitt({
  titel,
  eintraege,
  aktiv,
  onToggle,
}: {
  titel: string;
  eintraege: Schluesselwert[];
  aktiv: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  const { colors } = useTheme();
  if (eintraege.length === 0) return null;
  return (
    <View style={styles.abschnitt}>
      <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>{titel}</Text>
      {eintraege.map((e) => (
        <View key={e.id} style={[styles.zeile, { borderBottomColor: colors.border }]}>
          <Text style={[styles.name, { color: colors.text }]}>{e.bezeichnung}</Text>
          <Switch
            value={aktiv(e.id)}
            onValueChange={() => onToggle(e.id)}
            accessibilityLabel={e.bezeichnung}
          />
        </View>
      ))}
    </View>
  );
}

function PreisAbschnitt() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { group } = usePriceGroup();
  const { limit, erhoehen, senken } = usePriceLimit();

  const wert = limit == null ? t('mensa.preisKeinLimit') : t('mensa.preisMax', { preis: preisText(limit) });

  const StellKnopf = ({
    zeichen,
    label,
    onPress,
    aus,
  }: {
    zeichen: string;
    label: string;
    onPress: () => void;
    aus: boolean;
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: aus }}
      disabled={aus}
      onPress={onPress}
      style={[styles.stellKnopf, { borderColor: colors.border }]}
    >
      <Text style={[styles.stellZeichen, { color: aus ? colors.textMuted : colors.text }]}>
        {zeichen}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.abschnitt}>
      <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>{t('mensa.preisTitel')}</Text>
      <View style={styles.preisZeile}>
        <StellKnopf
          zeichen="−"
          label={t('mensa.preisSenken')}
          onPress={senken}
          aus={limit == null || limit <= PREIS_MIN}
        />
        <Text style={[styles.preisWert, { color: colors.text }]}>{wert}</Text>
        <StellKnopf
          zeichen="+"
          label={t('mensa.preisErhoehen')}
          onPress={erhoehen}
          aus={limit != null && limit >= PREIS_MAX}
        />
      </View>
      <Text style={[styles.preisHinweis, { color: colors.textMuted }]}>
        {t('mensa.preisGruppeHinweis', { gruppe: t(`priceGroup.${group}`) })}
      </Text>
    </View>
  );
}

export function FilterScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const query = useMensaVerzeichnisse();
  const intolerances = useIntolerances();
  const diet = useDietPreference();

  return (
    <Screen scroll tight hideScrollbar>
      <PreisAbschnitt />

      <AsyncStates<Verzeichnisse>
        query={query}
        isEmpty={(d) => d.zusatzstoffe.length === 0 && d.kennzeichnungen.length === 0}
        emptyTitle={t('mensa.unvertraeglichkeitenLeerTitel')}
        emptyNextStep={t('mensa.unvertraeglichkeitenLeerHinweis')}
      >
        {(d) => (
          <View>
            <KennzeichnungsAbschnitt
              titel={t('mensa.lebensstilTitel')}
              eintraege={d.kennzeichnungen}
              aktiv={(id) => diet.prefs.nurZeigen.includes(id)}
              onToggle={diet.toggleNurZeigen}
            />
            <KennzeichnungsAbschnitt
              titel={t('mensa.ausschliessenTitel')}
              eintraege={d.kennzeichnungen}
              aktiv={(id) => diet.prefs.ausschluss.includes(id)}
              onToggle={diet.toggleAusschluss}
            />
            <KennzeichnungsAbschnitt
              titel={t('mensa.unvertraeglichkeitenTitel')}
              eintraege={d.zusatzstoffe}
              aktiv={(id) => intolerances.codes.includes(id)}
              onToggle={intolerances.toggle}
            />
          </View>
        )}
      </AsyncStates>

      {/* „Alle Filter entfernen" liegt als headerRight oben rechts neben dem
          Titel (app/(tabs)/canteen/_layout.tsx → FilterResetAction). */}

      {/* MENSA-F-175: Hinweis auf die ausschließlich lokale Verarbeitung, am Seitenende. */}
      <View style={[styles.hinweis, { backgroundColor: colors.banner }]}>
        <Text style={[styles.hinweisText, { color: colors.onBanner }]}>
          {t('mensa.unvertraeglichkeitenLokalHinweis')}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hinweis: { padding: 10, borderRadius: 8 },
  hinweisText: { fontSize: 13 },
  abschnitt: { marginBottom: 16 },
  abschnittTitel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  name: { fontSize: 16, flex: 1 },
  preisZeile: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 48 },
  preisWert: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  preisHinweis: { fontSize: 12, marginTop: 4 },
  stellKnopf: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stellZeichen: { fontSize: 22, fontWeight: '600' },
});
