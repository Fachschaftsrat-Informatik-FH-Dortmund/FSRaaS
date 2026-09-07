import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { Screen } from '@/ui/Screen';
import { AppButton, MessageView, RadioList, SegmentedControl } from '@/ui/primitives';
import { useSortierGruppierung } from '../sortierPreset';
import {
  VORDEFINIERTE_PRESETS,
  type Gruppierung,
  type GruppenKriterium,
  type Kombination,
  type Richtung,
  type Sortierkriterium,
} from '../sortierung';

// Requirements „Wahl der Gruppierung" bis „Merken des zuletzt gewählten Presets"
// (canteen/spec.md). Obenan die vordefinierten und eigenen Presets zum direkten
// Anwählen (aktives hervorgehoben), darunter der Zusammenstellungsbereich:
// Gruppierung; bei aktiver Gruppierung die Gruppenreihenfolge; die
// Gerichte-Sortierung mit Kriterium und Richtung als zwei getrennten
// Auswahlfeldern (Requirement „Wahl der Gerichte-Sortierung"). Eigene Presets
// tragen Umbenennen/Löschen, vordefinierte nicht.
//
// Alle Hooks stehen vor jedem bedingten Return; Dependency-Arrays enthalten nur
// volle Referenzen (siehe design.md „Risks", eslint-plugin-react-hooks).

const GRUPPIERUNGEN: Gruppierung[] = ['keine', 'mensa', 'kategorie'];
const GRUPPEN_KRITERIEN: GruppenKriterium[] = ['reihenfolge', 'alphabetisch'];
const SORTIER_KRITERIEN: Sortierkriterium[] = [
  'quelle',
  'bezeichnung',
  'preis',
  'eigeneBewertung',
  'community',
];
const RICHTUNGEN: Richtung[] = ['auf', 'ab'];

/** Ergänzt/entfernt die Gruppenreihenfolge passend zur Gruppierung. */
function normalisiere(k: Kombination): Kombination {
  if (k.gruppierung === 'keine') {
    return { gruppierung: 'keine', gerichteSortierung: k.gerichteSortierung };
  }
  return {
    ...k,
    gruppenreihenfolge: k.gruppenreihenfolge ?? { kriterium: 'reihenfolge', richtung: 'auf' },
  };
}

export function SortierGruppierScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { aktiv, istEntwurf, presets, loaded, waehle, stelleEin, speichereEigenes, benenneUm, loesche } =
    useSortierGruppierung();

  const [name, setName] = useState('');
  const [umbenennen, setUmbenennen] = useState<{ id: string; text: string } | null>(null);

  const kombi: Kombination = useMemo(
    () => ({
      gruppierung: aktiv.gruppierung,
      gruppenreihenfolge: aktiv.gruppenreihenfolge,
      gerichteSortierung: aktiv.gerichteSortierung,
    }),
    [aktiv],
  );

  const kriteriumLabel = (k: Sortierkriterium) => t(`mensa.sortierkriterium.${k}`);
  // Das Reihenfolge-Kriterium heißt nach seiner Bedeutung im jeweiligen Kontext
  // (design.md D7, Requirement „Beschriftung des Reihenfolge-Kriteriums nach
  // seiner Bedeutung"): bei Gruppierung nach Mensa die von der Nutzerin
  // eingestellte Mensa-Reihenfolge, bei Gruppierung nach Kategorie die
  // Reihenfolge, in der die Mensa ausgibt. Der gespeicherte Wert bleibt
  // `'reihenfolge'`.
  const gruppenKriteriumLabel = (k: GruppenKriterium) => {
    if (k === 'reihenfolge') {
      return kombi.gruppierung === 'mensa'
        ? t('mensa.gruppenkriterium.reihenfolgeMensa')
        : t('mensa.gruppenkriterium.reihenfolgeKategorie');
    }
    return t(`mensa.gruppenkriterium.${k}`);
  };
  const richtungLabel = (r: Richtung) => t(`mensa.richtung.${r}`);
  const presetName = (id: string) =>
    VORDEFINIERTE_PRESETS.some((p) => p.id === id)
      ? t(`mensa.preset.${id}`)
      : (presets.find((p) => p.id === id)?.name ?? id);

  if (!loaded) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  const aendere = (naechste: Kombination) => stelleEin(normalisiere(naechste));

  return (
    <Screen scroll tight hideScrollbar>
      <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>
        {t('mensa.presetsTitel')}
      </Text>
      <View style={[styles.presetBox, { borderColor: colors.border }]}>
        {[...VORDEFINIERTE_PRESETS.map((p) => p.id), ...presets.map((p) => p.id)].map((id) => {
          const eigen = !VORDEFINIERTE_PRESETS.some((p) => p.id === id);
          const gewaehlt = !istEntwurf && aktiv.id === id;
          const wirdUmbenannt = umbenennen?.id === id;
          return (
            <View key={id} style={[styles.presetZeile, { borderBottomColor: colors.border }]}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: gewaehlt }}
                accessibilityLabel={t('mensa.presetWahlLabel', { name: presetName(id) })}
                onPress={() => waehle(id)}
                style={styles.presetWahl}
              >
                <Text style={[styles.presetMarke, { color: gewaehlt ? colors.accent : colors.border }]}>
                  {gewaehlt ? '●' : '○'}
                </Text>
                {wirdUmbenannt ? (
                  <TextInput
                    accessibilityLabel={t('mensa.presetUmbenennen')}
                    value={umbenennen.text}
                    onChangeText={(text) => setUmbenennen({ id, text })}
                    style={[styles.eingabe, { color: colors.text, borderColor: colors.border }]}
                    autoFocus
                  />
                ) : (
                  <View style={styles.presetNameZeile}>
                    <Text style={[styles.presetName, { color: colors.text }]}>{presetName(id)}</Text>
                    {gewaehlt ? (
                      <Text style={{ color: colors.textMuted }}> · {t('mensa.presetAktiv')}</Text>
                    ) : null}
                  </View>
                )}
              </Pressable>
              {eigen ? (
                <View style={styles.presetAktionen}>
                  {wirdUmbenannt ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('common.done')}
                      onPress={() => {
                        if (umbenennen.text.trim()) benenneUm(id, umbenennen.text);
                        setUmbenennen(null);
                      }}
                      style={styles.miniKnopf}
                    >
                      <Text style={{ color: colors.accent }}>✓</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t('mensa.presetUmbenennen')} – ${presetName(id)}`}
                      onPress={() => setUmbenennen({ id, text: presetName(id) })}
                      style={styles.miniKnopf}
                    >
                      <Text style={{ color: colors.text }}>✎</Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t('mensa.presetLoeschen')} – ${presetName(id)}`}
                    onPress={() =>
                      Alert.alert(t('mensa.presetLoeschen'), presetName(id), [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('mensa.presetLoeschen'), style: 'destructive', onPress: () => loesche(id) },
                      ])
                    }
                    style={styles.miniKnopf}
                  >
                    <Text style={{ color: colors.danger }}>🗑</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>
        {t('mensa.eigeneKombinationTitel')}
      </Text>

      <View style={styles.feld}>
        <Text style={[styles.feldTitel, { color: colors.text }]}>{t('mensa.gruppierungTitel')}</Text>
        <RadioList<Gruppierung>
          label={t('mensa.gruppierungTitel')}
          options={GRUPPIERUNGEN.map((g) => ({ value: g, label: t(`mensa.gruppierung.${g}`) }))}
          value={kombi.gruppierung}
          onChange={(g) => aendere({ ...kombi, gruppierung: g })}
        />
      </View>

      {kombi.gruppierung !== 'keine' ? (
        <View style={styles.feld}>
          <Text style={[styles.feldTitel, { color: colors.text }]}>
            {t('mensa.gruppenreihenfolgeTitel')}
          </Text>
          <RadioList<GruppenKriterium>
            label={t('mensa.gruppenreihenfolgeTitel')}
            options={GRUPPEN_KRITERIEN.map((k) => ({ value: k, label: gruppenKriteriumLabel(k) }))}
            value={kombi.gruppenreihenfolge?.kriterium ?? 'reihenfolge'}
            onChange={(k) =>
              aendere({
                ...kombi,
                gruppenreihenfolge: {
                  kriterium: k,
                  richtung: kombi.gruppenreihenfolge?.richtung ?? 'auf',
                },
              })
            }
          />
          <SegmentedControl<Richtung>
            label={`${t('mensa.gruppenreihenfolgeTitel')} · ${t('mensa.richtungLabel')}`}
            options={RICHTUNGEN.map((r) => ({ value: r, label: richtungLabel(r) }))}
            value={kombi.gruppenreihenfolge?.richtung ?? 'auf'}
            onChange={(r) =>
              aendere({
                ...kombi,
                gruppenreihenfolge: {
                  kriterium: kombi.gruppenreihenfolge?.kriterium ?? 'reihenfolge',
                  richtung: r,
                },
              })
            }
          />
        </View>
      ) : null}

      <View style={styles.feld}>
        <Text style={[styles.feldTitel, { color: colors.text }]}>
          {t('mensa.gerichteSortierungTitel')}
        </Text>
        <RadioList<Sortierkriterium>
          label={t('mensa.gerichteSortierungTitel')}
          options={SORTIER_KRITERIEN.map((k) => ({ value: k, label: kriteriumLabel(k) }))}
          value={kombi.gerichteSortierung.kriterium}
          onChange={(k) =>
            aendere({
              ...kombi,
              gerichteSortierung: { ...kombi.gerichteSortierung, kriterium: k },
            })
          }
        />
        <SegmentedControl<Richtung>
          label={`${t('mensa.gerichteSortierungTitel')} · ${t('mensa.richtungLabel')}`}
          options={RICHTUNGEN.map((r) => ({ value: r, label: richtungLabel(r) }))}
          value={kombi.gerichteSortierung.richtung}
          onChange={(r) =>
            aendere({
              ...kombi,
              gerichteSortierung: { ...kombi.gerichteSortierung, richtung: r },
            })
          }
        />
      </View>

      <View style={styles.speichernZeile}>
        <TextInput
          accessibilityLabel={t('mensa.presetNamePlatzhalter')}
          placeholder={t('mensa.presetNamePlatzhalter')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          style={[styles.eingabe, { color: colors.text, borderColor: colors.border }]}
        />
        <AppButton
          label={t('mensa.presetSpeichern')}
          disabled={name.trim().length === 0}
          onPress={() => {
            speichereEigenes(name, normalisiere(kombi));
            setName('');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  abschnittTitel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  presetBox: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  presetZeile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingRight: 6,
  },
  presetWahl: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minHeight: 48, paddingLeft: 10 },
  presetMarke: { fontSize: 16, width: 18, textAlign: 'center' },
  presetNameZeile: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  presetName: { fontSize: 16 },
  presetAktionen: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  miniKnopf: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  feld: { marginTop: 16, gap: 8 },
  feldTitel: { fontSize: 15, fontWeight: '700' },
  speichernZeile: { marginTop: 20, gap: 10 },
  eingabe: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, minHeight: 44, flex: 1 },
});
