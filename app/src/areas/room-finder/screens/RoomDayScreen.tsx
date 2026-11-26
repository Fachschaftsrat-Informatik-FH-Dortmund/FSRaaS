import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppError } from '@/errors/AppError';
import { useOnlineStatus } from '@/state/useOnlineStatus';
import { useTheme } from '@/theme';
import { MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useRaumbelegung, useRaumuebersicht } from '../api';
import { raumplanQuelleStand } from '../standAlter';
import { normalisiereKennung } from '../uebersicht';
import { Karte, RaumOffline, Zeile } from '../ui/bausteine';
import { BesetztMeldungBaustein, BesetztWarteschlange } from '../ui/BesetztMeldung';
import { kalendertag, uhrzeit } from '../zeitraum';

// Tagesbelegung eines Raums (Requirements „Belegung eines gewählten Raums
// anzeigen", „Tagesbelegung aus Übersicht oder laufenden Veranstaltungen
// öffnen", „Freitextfeld eines Raumplan-Termins anzeigen"). Eine unbekannte
// Kennung ist kein technischer Ausfall, sondern der Hinweis „Raum unbekannt".
// Dazu Melden und Zurückziehen einer Besetzt-Meldung samt Anzahl (Change
// `besetzt-meldungen`) — auch offline, als einzige Ausnahme vom nicht
// verfügbaren Raum-Bereich.

export function RoomDayScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const online = useOnlineStatus();
  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = normalisiereKennung(params.roomId ?? '');
  const heute = new Date();
  const query = useRaumbelegung(roomId, kalendertag(heute));
  // Anzahl gültiger Besetzt-Meldungen aus der minütlich aktualisierten Übersicht.
  const uebersicht = useRaumuebersicht();
  const anzahl = uebersicht.data?.raeume.find((r) => r.roomId === roomId)?.besetztMeldungen;

  if (!online) {
    return (
      <Screen tight>
        <ScrollView contentContainerStyle={styles.liste}>
          <RaumOffline />
          <BesetztWarteschlange />
          {roomId ? <BesetztMeldungBaustein roomId={roomId} /> : null}
        </ScrollView>
      </Screen>
    );
  }

  if (query.isError && query.data === undefined && AppError.from(query.error).code === 'raum_unbekannt') {
    return (
      <Screen tight>
        <MessageView
          symbol="?"
          title={t('raum.tag.unbekanntTitel')}
          body={t('raum.tag.unbekanntHinweis', { roomId })}
        />
      </Screen>
    );
  }

  const jetzt = heute.getTime();
  return (
    <Screen tight>
      <Text style={[styles.ueberschrift, { color: colors.text }]} accessibilityRole="header">
        {t('raum.tag.ueberschrift', { roomId })}
      </Text>
      <BesetztWarteschlange />
      <BesetztMeldungBaustein roomId={roomId} anzahl={uebersicht.data ? (anzahl ?? 0) : undefined} />
      <View style={styles.fill}>
        <AsyncStates
          query={query}
          isEmpty={(d) => d.termine.length === 0}
          emptyTitle={t('raum.tag.leerTitel')}
          emptyNextStep={t('raum.tag.leerHinweis')}
          quelleStand={raumplanQuelleStand(query.data?.standAlter, query.dataUpdatedAt)}
        >
          {(d) => (
            <ScrollView contentContainerStyle={styles.liste}>
              {d.termine.map((termin) => {
                const beginn = new Date(termin.beginn);
                const ende = new Date(termin.ende);
                const laeuft = beginn.getTime() <= jetzt && jetzt < ende.getTime();
                return (
                  <Karte key={`${termin.beginn}|${termin.ende}|${termin.bezeichnung ?? ''}`}>
                    <Text style={[styles.zeit, { color: colors.text }]}>
                      {t('raum.tag.zeitspanne', { von: uhrzeit(beginn), bis: uhrzeit(ende) })}
                      {laeuft ? ` · ${t('raum.tag.laeuftGerade')}` : ''}
                    </Text>
                    <Zeile text={termin.bezeichnung || t('raum.ohneBezeichnung')} />
                    {termin.art === 'pruefung' ? <Zeile text={t('raum.pruefung')} gedaempft /> : null}
                    {termin.note ? <Zeile text={t('raum.notiz', { note: termin.note })} gedaempft /> : null}
                  </Karte>
                );
              })}
            </ScrollView>
          )}
        </AsyncStates>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  ueberschrift: { fontSize: 20, fontWeight: '700', paddingBottom: 12 },
  zeit: { fontSize: 16, fontWeight: '600' },
  liste: { gap: 8, paddingBottom: 24 },
});
