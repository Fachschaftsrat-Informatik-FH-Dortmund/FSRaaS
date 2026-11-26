import { useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useAngepinnt, ordnen } from '../angepinnt';
import { useMeldungen, type Meldung } from '../api';
import { MeldungKarte, ZurueckgezogeneKarte } from '../ui/MeldungBausteine';

// News-Tab (Capability `news`, Change `news-redaktion`): Meldungen absteigend
// chronologisch mit Klassifizierung, angepinnte dauerhaft oben, Nachladen
// älterer Meldungen am Listenende. Lade-, Leer-, Fehler- und Offline-Zustand
// über `AsyncStates`; ein fehlgeschlagenes Aktualisieren bei vorhandenem Bestand
// meldet der Bildschirm selbst (design.md D7).

export function NewsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useMeldungen();
  const { pins, istAngepinnt, umschalten, loesen, abgleichen } = useAngepinnt();

  // Kopien angepinnter Meldungen auffrischen und Rückzüge kennzeichnen (design.md D4).
  useEffect(() => {
    if (query.data) abgleichen(query.data.meldungen, query.data.zurueckgezogen);
  }, [query.data, pins, abgleichen]);

  const oeffnen = (m: Meldung) => router.push(`/news/${m.id}`);

  return (
    <Screen tight>
      {query.isRefetchError && query.data ? (
        <FehlerHinweis text={t('news.aktualisierenFehler')} onRetry={() => void query.refetch()} />
      ) : null}
      <AsyncStates
        query={query}
        isEmpty={(d) => d.meldungen.length === 0 && pins.length === 0}
        emptyTitle={t('news.leerTitel')}
        emptyNextStep={t('news.leerHinweis')}
        emptyAction={
          <AppButton label={t('common.refresh')} variant="secondary" onPress={() => void query.refetch()} />
        }
      >
        {(bestand) => (
          <Liste
            meldungen={bestand.meldungen}
            pins={pins}
            istAngepinnt={istAngepinnt}
            onPin={umschalten}
            onLoesen={loesen}
            onOeffnen={oeffnen}
            aktualisiertGerade={query.isRefetching && !query.isFetchingNextPage}
            onAktualisieren={() => void query.refetch()}
            nachladen={{
              hatMehr: query.hasNextPage,
              laedt: query.isFetchingNextPage,
              fehler: query.isFetchNextPageError,
              laden: () => void query.fetchNextPage(),
            }}
          />
        )}
      </AsyncStates>
    </Screen>
  );
}

interface Nachladen {
  hatMehr: boolean;
  laedt: boolean;
  fehler: boolean;
  laden: () => void;
}

function Liste({
  meldungen,
  pins,
  istAngepinnt,
  onPin,
  onLoesen,
  onOeffnen,
  aktualisiertGerade,
  onAktualisieren,
  nachladen,
}: {
  meldungen: Meldung[];
  pins: ReturnType<typeof useAngepinnt>['pins'];
  istAngepinnt: (id: string) => boolean;
  onPin: (m: Meldung) => void;
  onLoesen: (id: string) => void;
  onOeffnen: (m: Meldung) => void;
  aktualisiertGerade: boolean;
  onAktualisieren: () => void;
  nachladen: Nachladen;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { angepinnt, uebrige } = useMemo(() => ordnen(meldungen, pins), [meldungen, pins]);

  const kopf =
    angepinnt.length > 0 ? (
      <View style={styles.abschnitt}>
        <Text style={[styles.abschnittTitel, { color: colors.textMuted }]} accessibilityRole="header">
          {t('news.angepinnt')}
        </Text>
        {angepinnt.map((p) =>
          p.zurueckgezogen ? (
            <ZurueckgezogeneKarte key={p.meldung.id} titel={p.meldung.titel} onLoesen={() => onLoesen(p.meldung.id)} />
          ) : (
            <MeldungKarte
              key={p.meldung.id}
              meldung={p.meldung}
              angepinnt
              onOeffnen={() => onOeffnen(p.meldung)}
              onPin={() => onPin(p.meldung)}
            />
          ),
        )}
        {uebrige.length > 0 ? (
          <Text style={[styles.abschnittTitel, { color: colors.textMuted }]} accessibilityRole="header">
            {t('news.aktuell')}
          </Text>
        ) : null}
      </View>
    ) : null;

  return (
    <FlatList
      testID="meldungsliste"
      data={uebrige}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.liste}
      ListHeaderComponent={kopf}
      renderItem={({ item }) => (
        <MeldungKarte
          meldung={item}
          angepinnt={istAngepinnt(item.id)}
          onOeffnen={() => onOeffnen(item)}
          onPin={() => onPin(item)}
        />
      )}
      ItemSeparatorComponent={Abstand}
      refreshControl={<RefreshControl refreshing={aktualisiertGerade} onRefresh={onAktualisieren} />}
      // Requirement „Nachladen älterer Meldungen": beim Blättern ans Ende.
      onEndReached={() => {
        if (nachladen.hatMehr && !nachladen.laedt && !nachladen.fehler) nachladen.laden();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={<Fuss {...nachladen} />}
    />
  );
}

function Abstand() {
  return <View style={styles.abstand} />;
}

/** Listenende: Nachladen läuft, ist fehlgeschlagen, ist möglich oder der Bestand ist vollständig. */
function Fuss({ hatMehr, laedt, fehler, laden }: Nachladen) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (laedt) {
    return (
      <View style={styles.fuss}>
        <ActivityIndicator accessibilityLabel={t('news.laedtAeltere')} color={colors.accent} />
      </View>
    );
  }
  if (fehler) {
    return <FehlerHinweis text={t('news.nachladenFehler')} onRetry={laden} />;
  }
  if (hatMehr) {
    // Sichtbarer Weg zusätzlich zum Blättern, damit Nachladen nicht nur über eine Geste geht.
    return (
      <View style={styles.fuss}>
        <AppButton label={t('news.aeltereLaden')} variant="secondary" onPress={laden} />
      </View>
    );
  }
  return (
    <View style={styles.fuss}>
      <Text style={[styles.ende, { color: colors.textMuted }]}>{t('news.alleGeladen')}</Text>
    </View>
  );
}

function FehlerHinweis({ text, onRetry }: { text: string; onRetry: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.fehler, { borderColor: colors.danger }]} accessibilityLiveRegion="polite">
      <Text style={[styles.fehlerText, { color: colors.text }]}>⚠ {text}</Text>
      <AppButton label={t('common.retry')} variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  liste: { paddingBottom: 24 },
  abschnitt: { gap: 8, marginBottom: 8 },
  abschnittTitel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginTop: 4 },
  abstand: { height: 8 },
  fuss: { paddingVertical: 16, alignItems: 'center' },
  ende: { fontSize: 13 },
  fehler: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8, marginVertical: 8 },
  fehlerText: { fontSize: 14 },
});
