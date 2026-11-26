import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton, MessageView, SegmentedControl } from '@/ui/primitives';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useKuratierteRaeume, useRaumuebersicht, type Raum, type RaumStatus } from '../api';
import { freiBisFuer } from '../freieRaeume';
import { raumplanQuelleStand } from '../standAlter';
import { filtereUebersicht, normalisiereKennung, type Zustandsfilter } from '../uebersicht';
import { FreiBisText, Karte, Kennung, Merkmale, Zeile, Zustand, useZeitText } from './bausteine';
import { BesetztHinweis } from './BesetztMeldung';

// Raumübersicht (Requirements „Übersicht aller Räume mit Belegungszustand",
// „Laufende Veranstaltung bei belegtem Raum", „Freizeitpunkt bei freiem Raum in
// der Übersicht", „Größenklasse und E-Key-Kennzeichen in der Übersicht",
// „Freitextfeld eines Raumplan-Termins anzeigen", „Übersicht nach
// Belegungszustand einschränken", „Suche nach Raumkennung in der Übersicht",
// „Tagesbelegung aus Übersicht oder laufenden Veranstaltungen öffnen",
// „Besetzt-Meldung zusätzlich in der Übersicht anzeigen").

const ZUSTAENDE: Zustandsfilter[] = ['alle', 'frei', 'belegt'];

export function UebersichtSicht() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const [suche, setSuche] = useState('');
  const [zustand, setZustand] = useState<Zustandsfilter>('alle');

  const query = useRaumuebersicht();
  // Die Schließzeit kuratierter Räume ergänzt „frei bis"; ohne Stammdaten
  // bleibt die Übersicht nutzbar, dann zählt allein der nächste Termin.
  const kuratiert = useKuratierteRaeume();
  const schliesszeiten = new Map((kuratiert.data ?? []).map((r: Raum) => [r.roomId, r.schliesszeit]));

  const oeffne = (roomId: string) =>
    router.push({ pathname: '/rooms/raum/[roomId]', params: { roomId } });
  const kennung = normalisiereKennung(suche);
  const zuruecksetzen = () => {
    setSuche('');
    setZustand('alle');
  };

  return (
    <View style={styles.fill}>
      <View style={styles.steuerung}>
        <View style={styles.reihe}>
          <TextInput
            value={suche}
            onChangeText={setSuche}
            onSubmitEditing={() => kennung && oeffne(kennung)}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            placeholder={t('raum.uebersichtSicht.suchePlatzhalter')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('raum.uebersichtSicht.sucheLabel')}
            style={[styles.eingabe, { color: colors.text, borderColor: colors.border }]}
          />
          <AppButton
            variant="secondary"
            label={t('raum.uebersichtSicht.belegungAnzeigen')}
            disabled={!kennung}
            onPress={() => oeffne(kennung)}
          />
        </View>
        <SegmentedControl
          label={t('raum.uebersichtSicht.zustandLabel')}
          options={ZUSTAENDE.map((z) => ({
            value: z,
            label: z === 'alle' ? t('raum.uebersichtSicht.alle') : t(`raum.${z}`),
          }))}
          value={zustand}
          onChange={setZustand}
        />
      </View>

      <AsyncStates
        query={query}
        isEmpty={(d) => d.raeume.length === 0}
        emptyTitle={t('raum.uebersichtSicht.leerTitel')}
        emptyNextStep={t('raum.uebersichtSicht.leerHinweis')}
        emptyAction={<AppButton label={t('common.retry')} onPress={() => query.refetch()} />}
        quelleStand={raumplanQuelleStand(query.data?.standAlter, query.dataUpdatedAt)}
      >
        {(d) => {
          const raeume = filtereUebersicht(d.raeume, zustand, suche);
          if (raeume.length === 0) {
            return (
              <MessageView
                symbol="—"
                title={t('raum.uebersichtSicht.keinTrefferTitel')}
                body={t('raum.uebersichtSicht.keinTrefferHinweis')}
                action={<AppButton label={t('raum.uebersichtSicht.filterZuruecksetzen')} onPress={zuruecksetzen} />}
              />
            );
          }
          const jetzt = new Date();
          return (
            <ScrollView contentContainerStyle={styles.liste}>
              {raeume.map((r) => (
                <RaumZeile
                  key={r.roomId}
                  raum={r}
                  schliesszeit={schliesszeiten.get(r.roomId)}
                  jetzt={jetzt}
                  onPress={() => oeffne(r.roomId)}
                />
              ))}
            </ScrollView>
          );
        }}
      </AsyncStates>
    </View>
  );
}

function RaumZeile({
  raum,
  schliesszeit,
  jetzt,
  onPress,
}: {
  raum: RaumStatus;
  schliesszeit: string | null | undefined;
  jetzt: Date;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const zeitText = useZeitText();
  const termin = raum.zustand === 'belegt' ? raum.aktuellerTermin : undefined;
  const frei = raum.zustand === 'frei' ? freiBisFuer(raum, schliesszeit, jetzt) : undefined;

  return (
    <Karte label={t('raum.oeffnen', { roomId: raum.roomId })} onPress={onPress}>
      <View style={styles.kopf}>
        <Kennung roomId={raum.roomId} />
        <Zustand belegt={raum.zustand === 'belegt'} />
      </View>
      {termin ? (
        <>
          <Zeile
            text={t('raum.belegtBis', {
              bezeichnung: termin.bezeichnung || t('raum.ohneBezeichnung'),
              zeit: zeitText(new Date(termin.ende), jetzt),
            })}
          />
          {termin.art === 'pruefung' ? <Zeile text={t('raum.pruefung')} gedaempft /> : null}
          {termin.note ? <Zeile text={t('raum.notiz', { note: termin.note })} gedaempft /> : null}
        </>
      ) : null}
      {frei && typeof frei === 'object' ? (
        <FreiBisText freiBis={frei.freiBis} schliesszeit={frei.freiBisSchliesszeit} bezug={jetzt} />
      ) : null}
      <BesetztHinweis anzahl={raum.besetztMeldungen} />
      <Merkmale groesse={raum.groesse} ekey={raum.ekeyZugaenglich} />
    </Karte>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  steuerung: { gap: 8, paddingBottom: 8 },
  reihe: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eingabe: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  kopf: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liste: { gap: 8, paddingBottom: 24 },
});
