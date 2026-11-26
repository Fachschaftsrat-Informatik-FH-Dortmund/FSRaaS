import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useRaumuebersicht } from '../api';
import { raumplanQuelleStand } from '../standAlter';
import { laufendeVeranstaltungen } from '../uebersicht';
import { Karte, Kennung, Zeile, useZeitText } from './bausteine';

// Ansicht laufender Veranstaltungen (Requirements „Ansicht laufender
// Veranstaltungen", „Raum, Bezeichnung und Endzeitpunkt je laufender
// Veranstaltung", „Freitextfeld eines Raumplan-Termins anzeigen",
// „Tagesbelegung aus Übersicht oder laufenden Veranstaltungen öffnen"). Teilt
// die Abfrage „jetzt" mit der Raumübersicht.

export function LaufendSicht() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const zeitText = useZeitText();
  const query = useRaumuebersicht();

  return (
    <AsyncStates
      query={query}
      isEmpty={(d) => laufendeVeranstaltungen(d.raeume).length === 0}
      emptyTitle={t('raum.laufendSicht.leerTitel')}
      emptyNextStep={t('raum.laufendSicht.leerHinweis')}
      quelleStand={raumplanQuelleStand(query.data?.standAlter, query.dataUpdatedAt)}
    >
      {(d) => {
        const jetzt = new Date();
        return (
          <ScrollView contentContainerStyle={styles.liste}>
            {laufendeVeranstaltungen(d.raeume).map((v) => (
              <Karte key={`${v.bezeichnung}|${v.beginn}|${v.ende}`}>
                <Text style={[styles.titel, { color: colors.text }]}>
                  {v.bezeichnung || t('raum.ohneBezeichnung')}
                </Text>
                <Zeile text={t('raum.laufendSicht.bis', { zeit: zeitText(new Date(v.ende), jetzt) })} />
                {v.art === 'pruefung' ? <Zeile text={t('raum.pruefung')} gedaempft /> : null}
                {v.note ? <Zeile text={t('raum.notiz', { note: v.note })} gedaempft /> : null}
                <View style={styles.raeume} accessibilityLabel={t('raum.laufendSicht.raeume')}>
                  {v.raeume.map((roomId) => (
                    <Karte
                      key={roomId}
                      label={t('raum.oeffnen', { roomId })}
                      onPress={() => router.push({ pathname: '/rooms/raum/[roomId]', params: { roomId } })}
                    >
                      <Kennung roomId={roomId} />
                    </Karte>
                  ))}
                </View>
              </Karte>
            ))}
          </ScrollView>
        );
      }}
    </AsyncStates>
  );
}

const styles = StyleSheet.create({
  liste: { gap: 8, paddingBottom: 24 },
  titel: { fontSize: 17, fontWeight: '700' },
  raeume: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
