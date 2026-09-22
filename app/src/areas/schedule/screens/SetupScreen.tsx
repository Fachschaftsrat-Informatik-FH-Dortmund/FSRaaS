import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import { describeAge } from '@/ui/state/dataAge';
import { useStudiengaenge, type FbwsStudiengang } from '../api';
import { filtereEndpunktGruppen, gruppiereEndpunkte, type EndpunktGruppe } from '../endpunkte';
import { useEinrichtung } from '../einrichtung';
import { registriereWeiterAktion } from '../weiterAktion';

// Einrichtungs-Bildschirm des Stundenplans (Roadmap-Schritt 5, Etappe
// „Einrichtung"): Mehrfachauswahl der Endpunkte des Lehrangebots
// (Requirement „Auswahl der Endpunkte des Lehrangebots"), gegliedert und
// durchsuchbar (Requirements „Gruppierung …", „Auffangkorb …",
// „Freitextsuche in der Endpunktauswahl"). Die Fachlogik liegt in
// `einrichtung.ts`, `api.ts` und `endpunkte.ts` — dieser Bildschirm bindet sie
// nur an.
//
// Requirement „Eigener Schritt für die Gruppenkennung nach der Modulauswahl":
// Die Einrichtung verlangt keine Gruppenkennung mehr. Sie wird erst nach der
// Modulauswahl festgelegt, auf dem eigenen Schritt `GruppenkennungScreen` —
// erst dort steht der selbst gewählte Terminbestand fest, gegen den die
// Rückmeldung während der Eingabe zählen kann.

export function SetupScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const { einrichtung, loaded: einrichtungGeladen, endpunktUmschalten } = useEinrichtung();

  const { studiengaenge, istRueckfall, query: primaer, rueckfallQuery: rueckfall } = useStudiengaenge();
  const geladen = primaer.isSuccess || rueckfall.isSuccess;
  const studiengaengeQuery: QueryLike<FbwsStudiengang[]> = {
    data: geladen ? studiengaenge : undefined,
    isPending: primaer.isPending || (primaer.isError && rueckfall.isPending),
    isError: primaer.isError && rueckfall.isError,
    isFetching: primaer.isFetching || rueckfall.isFetching,
    isStale: primaer.isStale,
    error: rueckfall.isError ? rueckfall.error : primaer.error,
    dataUpdatedAt: istRueckfall ? rueckfall.dataUpdatedAt : primaer.dataUpdatedAt,
    refetch: () => {
      void primaer.refetch();
      if (primaer.isError) void rueckfall.refetch();
    },
  };

  const [suchtext, setSuchtext] = useState('');
  const hatEndpunkte = einrichtung.endpunkte.length > 0;

  // Requirement „Weiterführender Bedienweg in der Kopfzeile": Der Weg zur
  // Modulauswahl sitzt in der Kopfzeile (`weiterAktion.ts`, außerhalb dieses
  // Komponentenbaums), nicht mehr als Schaltfläche am Seitenende. Ohne einen
  // gewählten Endpunkt gibt es nichts, worüber die Modulauswahl entscheiden
  // könnte — der Weg bleibt dann zurückgenommen und führt nicht weiter.
  useEffect(() => {
    registriereWeiterAktion({
      freigegeben: hatEndpunkte,
      weiter: () => {
        if (hatEndpunkte) router.push('/kurse');
      },
    });
    return () => registriereWeiterAktion(null);
  }, [hatEndpunkte, router]);

  if (!einrichtungGeladen) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  return (
    <Screen scroll tight hideScrollbar>
      <AsyncStates<FbwsStudiengang[]>
        query={studiengaengeQuery}
        isEmpty={(d) => d.length === 0}
        emptyNextStep={t('schedule.studiengaengeLeerHinweis')}
      >
        {(liste) => {
          const gruppen = gruppiereEndpunkte(liste);
          const gefiltert = filtereEndpunktGruppen(gruppen, suchtext);
          return (
            <View style={styles.abschnitt}>
              {istRueckfall ? (
                <View style={[styles.hinweis, { backgroundColor: colors.banner }]}>
                  <Text style={[styles.hinweisText, { color: colors.onBanner }]}>
                    {`${t('schedule.rueckfallHinweis')} — ${t('dataAge.prefix')} ${t(
                      describeAge(rueckfall.dataUpdatedAt).key,
                      { count: describeAge(rueckfall.dataUpdatedAt).count },
                    )}`}
                  </Text>
                </View>
              ) : null}

              {/* Requirement „Freitextsuche in der Endpunktauswahl": sichtbare
                  Beschriftung als eigenes Element über dem Feld. Ein
                  Platzhalter verschwindet mit dem ersten Zeichen; wer die
                  Eingabe später wieder aufnimmt, sähe dann ein unbeschriftetes
                  Feld. */}
              <Text style={[styles.titel, { color: colors.textMuted }]}>{t('schedule.endpunkteSucheLabel')}</Text>
              <TextInput
                accessibilityLabel={t('schedule.endpunkteSucheLabel')}
                placeholder={t('schedule.endpunkteSuchePlatzhalter')}
                value={suchtext}
                onChangeText={setSuchtext}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />

              <EndpunktListe
                gruppen={gefiltert}
                gewaehlt={einrichtung.endpunkte}
                onUmschalten={endpunktUmschalten}
              />
            </View>
          );
        }}
      </AsyncStates>
    </Screen>
  );
}

/** Requirements „Gruppierung der Endpunkte in der Auswahl" und „Auswahl der Endpunkte des Lehrangebots": Gruppenüberschriften mit Mehrfachauswahl. */
function EndpunktListe({
  gruppen,
  gewaehlt,
  onUmschalten,
}: {
  gruppen: readonly EndpunktGruppe[];
  gewaehlt: readonly string[];
  onUmschalten: (sname: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.abschnitt}>
      {gruppen.map((gruppe) => (
        <View key={gruppe.schluessel} style={styles.abschnitt}>
          <Text style={[styles.titel, { color: colors.textMuted }]}>
            {t(`schedule.endpunktGruppe.${gruppe.schluessel}`)}
          </Text>
          {gruppe.eintraege.map((eintrag) => {
            const aktiv = gewaehlt.includes(eintrag.sname);
            return (
              <Pressable
                key={eintrag.sname}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: aktiv }}
                accessibilityLabel={eintrag.name}
                onPress={() => onUmschalten(eintrag.sname)}
                style={[styles.zeile, { borderBottomColor: colors.border }]}
              >
                <Text style={{ color: aktiv ? colors.accent : colors.border, fontSize: 18, width: 24 }}>
                  {aktiv ? '☑' : '☐'}
                </Text>
                <Text style={[styles.zeileText, { color: colors.text }]}>{eintrag.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  abschnitt: { gap: 10, marginBottom: 8 },
  titel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  hinweis: { padding: 10, borderRadius: 8 },
  hinweisText: { fontSize: 13 },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  zeileText: { fontSize: 15, flex: 1 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
});
