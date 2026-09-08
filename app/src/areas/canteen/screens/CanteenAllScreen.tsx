import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import { useMensen, useSpeisepläne, type Gericht } from '../api';
import { useGerichtFilter, type GerichtKennzeichen } from '../filter';
import { gruppiereNachKategorie } from '../consolidate';
import { preisText } from '../preise';
import { isoHeute } from '../tageswahl';
import { AnkerListe } from '@/ui/AnkerListe';

// MENSA-F-130 bis F-150: Ansicht aller vom Backend gelieferten Mensen für den aus
// der Hauptansicht übernommenen Tag, nach Mensa getrennt untereinander mit
// derselben Ankernavigation wie die Hauptansicht (MENSA-F-016/F-017/F-019).
// Reine Leseansicht — ändert weder Mensaauswahl noch Reihenfolge (MENSA-F-150).
// Alle drei Preise unabhängig von der Preisgruppe (MENSA-F-230); Gerichte mit
// festgelegter Filtervorgabe ausgegraut statt ausgeblendet (MENSA-F-210).

export function CanteenAllScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ datum?: string }>();
  const datum = typeof params.datum === 'string' && params.datum ? params.datum : isoHeute();

  const { mensen } = useMensen();
  const ids = useMemo(() => mensen.map((m) => m.id), [mensen]);
  const ergebnisse = useSpeisepläne(ids, datum);
  const { betroffen } = useGerichtFilter();

  const abschnitte = ids
    .map((id, i) => ({
      id,
      name: mensen.find((m) => m.id === id)?.name ?? id,
      gerichte: ergebnisse[i]?.data?.gerichte ?? [],
    }))
    // Mensen ohne Angebot am Tag auslassen (MENSA-F-140).
    .filter((a) => a.gerichte.length > 0);

  const irgendwasGeladen = ergebnisse.some((r) => r.data !== undefined);
  const aktualisierteMs = ergebnisse
    .filter((r) => r.data !== undefined && r.dataUpdatedAt > 0)
    .map((r) => r.dataUpdatedAt);

  const aggregat: QueryLike<{ abschnitte: typeof abschnitte }> = {
    data: irgendwasGeladen ? { abschnitte } : undefined,
    isPending: ergebnisse.length > 0 && ergebnisse.every((r) => r.isPending),
    isError: ergebnisse.length > 0 && ergebnisse.every((r) => r.isError) && !irgendwasGeladen,
    isFetching: ergebnisse.some((r) => r.isFetching),
    isStale: ergebnisse.some((r) => r.isStale),
    error: ergebnisse.find((r) => r.isError)?.error ?? null,
    dataUpdatedAt: aktualisierteMs.length > 0 ? Math.min(...aktualisierteMs) : 0,
    refetch: () => Promise.all(ergebnisse.map((r) => r.refetch())),
  };

  const { colors } = useTheme();

  return (
    <Screen tight>
      <Text style={[styles.datum, { color: colors.textMuted }]}>{datum}</Text>
      <AsyncStates
        query={aggregat}
        isEmpty={(d) => d.abschnitte.length === 0}
        emptyTitle={t('mensa.keinAngebotTitel')}
        emptyNextStep={t('mensa.alleMensenLeerHinweis')}
      >
        {(d) => (
          <AnkerListe
            chips={d.abschnitte.map((a) => ({ id: a.id, titel: a.name }))}
            contentContainerStyle={styles.liste}
            scrollProps={{ showsVerticalScrollIndicator: false }}
            abschnitte={d.abschnitte.map((a) => ({
              id: a.id,
              inhalt: (
                <MensaAbschnitt name={a.name} gerichte={a.gerichte} betroffen={betroffen} />
              ),
            }))}
          />
        )}
      </AsyncStates>
    </Screen>
  );
}

function MensaAbschnitt({
  name,
  gerichte,
  betroffen,
}: {
  name: string;
  gerichte: Gericht[];
  betroffen: (g: GerichtKennzeichen) => boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const gruppen = useMemo(() => gruppiereNachKategorie(gerichte), [gerichte]);

  return (
    <View style={styles.abschnitt}>
      <Text style={[styles.mensaName, { color: colors.text }]}>{name}</Text>
      {gruppen.map(({ kategorie, gerichte: gs }) => (
        <View key={kategorie || ' ohne'} style={styles.gruppe}>
          {kategorie ? (
            <Text style={[styles.gruppeTitel, { color: colors.textMuted }]}>{kategorie}</Text>
          ) : null}
          {gs.map((g, i) => {
            const istBetroffen = betroffen(g);
            return (
              <View
                key={`${g.schluessel}-${i}`}
                style={[
                  styles.karte,
                  { borderColor: colors.border },
                  istBetroffen && styles.ausgegraut,
                ]}
                accessibilityState={istBetroffen ? { disabled: true } : undefined}
                accessibilityHint={istBetroffen ? t('mensa.durchFilterBetroffen') : undefined}
              >
                <Text style={[styles.bezeichnung, { color: colors.text }]}>{g.bezeichnung}</Text>
                {g.kennzeichnungen && g.kennzeichnungen.length > 0 ? (
                  <Text style={[styles.klein, { color: colors.textMuted }]}>
                    {g.kennzeichnungen.join(' · ')}
                  </Text>
                ) : null}
                <Text style={[styles.klein, { color: colors.text }]}>
                  {t('mensa.preise', {
                    studierende: preisText(g.preisStudierende),
                    mitarbeitende: preisText(g.preisMitarbeitende),
                    gaeste: preisText(g.preisGaeste),
                  })}
                </Text>
                {g.zusatzstoffe && g.zusatzstoffe.length > 0 ? (
                  <Text style={[styles.klein, { color: colors.textMuted }]}>
                    {t('mensa.zusatzstoffe', { liste: g.zusatzstoffe.join(', ') })}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  datum: { fontSize: 15, fontWeight: '600' },
  liste: { gap: 20, paddingBottom: 24 },
  abschnitt: { gap: 8 },
  mensaName: { fontSize: 17, fontWeight: '700' },
  gruppe: { gap: 6 },
  gruppeTitel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  karte: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  ausgegraut: { opacity: 0.4 },
  bezeichnung: { fontSize: 15, fontWeight: '600' },
  klein: { fontSize: 13 },
});
