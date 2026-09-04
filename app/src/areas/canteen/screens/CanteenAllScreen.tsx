import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import { useMensaVerzeichnisse, useMensen, useSpeisepläne, type Gericht } from '../api';
import { gerichtBetroffen } from '../intoleranceFilter';
import { useIntolerances } from '../intolerances';
import { gruppiereNachKategorie } from '../consolidate';
import { isoHeute } from '../tageswahl';

// MENSA-F-130 bis F-150: Ansicht aller vom Backend gelieferten Mensen für den aus
// der Hauptansicht übernommenen Tag, nach Mensa getrennt untereinander. Reine
// Leseansicht — ändert weder Mensaauswahl noch Reihenfolge noch aktive Mensa
// (MENSA-F-150). Alle drei Preise unabhängig von der Preisgruppe (MENSA-F-230);
// Gerichte mit festgelegter Unverträglichkeit ausgegraut statt ausgeblendet
// (MENSA-F-210).

export function CanteenAllScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ datum?: string }>();
  const datum = typeof params.datum === 'string' && params.datum ? params.datum : isoHeute();

  const { mensen } = useMensen();
  const ids = useMemo(() => mensen.map((m) => m.id), [mensen]);
  const ergebnisse = useSpeisepläne(ids, datum);
  const { codes } = useIntolerances();
  const verzeichnisse = useMensaVerzeichnisse();

  const ausgewaehlt = useMemo(() => {
    const labelVon = new Map(
      (verzeichnisse.data?.zusatzstoffe ?? []).map((z) => [z.id, z.bezeichnung]),
    );
    const menge = new Set<string>();
    for (const code of codes) {
      menge.add(code);
      const label = labelVon.get(code);
      if (label) menge.add(label);
    }
    return menge;
  }, [codes, verzeichnisse.data]);

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

  return (
    <Screen scroll>
      <Text style={styles.datum}>{datum}</Text>
      <AsyncStates
        query={aggregat}
        isEmpty={(d) => d.abschnitte.length === 0}
        emptyTitle={t('mensa.keinAngebotTitel')}
        emptyNextStep={t('mensa.alleMensenLeerHinweis')}
      >
        {(d) => (
          <View style={styles.liste}>
            {d.abschnitte.map((a) => (
              <MensaAbschnitt key={a.id} name={a.name} gerichte={a.gerichte} ausgewaehlt={ausgewaehlt} />
            ))}
          </View>
        )}
      </AsyncStates>
    </Screen>
  );
}

function MensaAbschnitt({
  name,
  gerichte,
  ausgewaehlt,
}: {
  name: string;
  gerichte: Gericht[];
  ausgewaehlt: ReadonlySet<string>;
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
            const betroffen = gerichtBetroffen(g.zusatzstoffe, ausgewaehlt);
            return (
              <View
                key={`${g.schluessel}-${i}`}
                style={[styles.karte, { borderColor: colors.border }, betroffen && styles.ausgegraut]}
                accessibilityState={betroffen ? { disabled: true } : undefined}
                accessibilityHint={betroffen ? t('mensa.durchFilterBetroffen') : undefined}
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

function preisText(n: number | null | undefined): string {
  return n == null ? '–' : `${n.toFixed(2).replace('.', ',')} €`;
}

const styles = StyleSheet.create({
  datum: { fontSize: 15, fontWeight: '600' },
  liste: { gap: 20 },
  abschnitt: { gap: 8 },
  mensaName: { fontSize: 17, fontWeight: '700' },
  gruppe: { gap: 6 },
  gruppeTitel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  karte: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  ausgegraut: { opacity: 0.4 },
  bezeichnung: { fontSize: 15, fontWeight: '600' },
  klein: { fontSize: 13 },
});
