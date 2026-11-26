import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton, SegmentedControl } from '@/ui/primitives';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useKuratierteRaeume, useRaumuebersicht } from '../api';
import { filterGesetzt, freieRaeume, OHNE_FILTER, type Groessenfilter, type Suchfilter } from '../freieRaeume';
import { raumplanQuelleStand } from '../standAlter';
import {
  aufMinute,
  DAUERN_STUNDEN,
  STANDARD_DAUER,
  verschiebeStart,
  zeitraumEnde,
  type DauerStunden,
} from '../zeitraum';
import { FreiBisText, Karte, Kennung, kombiniere, Merkmale, useZeitText } from './bausteine';

// Freie-Raum-Suche (Requirements „Suche nach freien Räumen", „Größenklasse
// anzeigen und filtern", „E-Key-Zugänglichkeit kennzeichnen", „Freizeitpunkt
// eines freien Raums anzeigen", „Raumsuche auf kuratierte Liste beschränken").
// Zeitraum: Beginn in Halbstundenschritten ab jetzt, Dauer 1–4 Stunden
// (Change `raumsuche-app`, design.md).

const GROESSEN: Groessenfilter[] = ['alle', 'klein', 'mittel', 'gross'];

export function FreieRaeumeSicht() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const zeitText = useZeitText();

  const [start, setStart] = useState(() => aufMinute(new Date()));
  const [dauer, setDauer] = useState<DauerStunden>(STANDARD_DAUER);
  const [filter, setFilter] = useState<Suchfilter>(OHNE_FILTER);
  const ende = zeitraumEnde(start, dauer);

  const uebersicht = useRaumuebersicht(start.toISOString());
  const kuratiert = useKuratierteRaeume();
  const query = kombiniere(uebersicht, kuratiert, (u, k) => freieRaeume(u.raeume, k, start, ende, filter));

  const verschieben = (schritte: number) => setStart((s) => verschiebeStart(s, schritte, new Date()));
  const heute = new Date();

  return (
    <View style={styles.fill}>
      <View style={styles.steuerung}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{t('raum.freiSuche.beginnLabel')}</Text>
        <View style={styles.reihe}>
          <AppButton variant="secondary" label={t('raum.freiSuche.frueherKurz')} accessibilityLabel={t('raum.freiSuche.frueher')} onPress={() => verschieben(-1)} />
          <Text style={[styles.beginn, { color: colors.text }]} accessibilityRole="text">
            {t('raum.freiSuche.beginn', { zeit: zeitText(start, heute) })}
          </Text>
          <AppButton variant="secondary" label={t('raum.freiSuche.spaeterKurz')} accessibilityLabel={t('raum.freiSuche.spaeter')} onPress={() => verschieben(1)} />
          <AppButton variant="secondary" label={t('raum.freiSuche.jetzt')} onPress={() => setStart(aufMinute(new Date()))} />
        </View>
        <SegmentedControl
          label={t('raum.freiSuche.dauerLabel')}
          options={DAUERN_STUNDEN.map((h) => ({ value: String(h), label: t('raum.freiSuche.dauer', { count: h }) }))}
          value={String(dauer)}
          onChange={(v) => setDauer(Number(v) as DauerStunden)}
        />
        <SegmentedControl
          label={t('raum.freiSuche.groesseFilterLabel')}
          options={GROESSEN.map((g) => ({
            value: g,
            label: g === 'alle' ? t('raum.freiSuche.alleGroessen') : t(`raum.groesse.${g}`),
          }))}
          value={filter.groesse}
          onChange={(groesse) => setFilter((f) => ({ ...f, groesse }))}
        />
        <View style={styles.schalter}>
          <Text style={[styles.schalterText, { color: colors.text }]}>{t('raum.freiSuche.nurEkey')}</Text>
          <Switch
            value={filter.nurEkey}
            onValueChange={(nurEkey) => setFilter((f) => ({ ...f, nurEkey }))}
            accessibilityLabel={t('raum.freiSuche.nurEkey')}
          />
        </View>
      </View>

      <AsyncStates
        query={query}
        isEmpty={(raeume) => raeume.length === 0}
        emptyTitle={t('raum.freiSuche.leerTitel')}
        emptyNextStep={filterGesetzt(filter) ? t('raum.freiSuche.leerFilterHinweis') : t('raum.freiSuche.leerHinweis')}
        emptyAction={
          <View style={styles.leerAktionen}>
            <AppButton label={t('raum.freiSuche.eineStundeSpaeter')} onPress={() => verschieben(2)} />
            {filterGesetzt(filter) ? (
              <AppButton
                variant="secondary"
                label={t('raum.freiSuche.filterZuruecksetzen')}
                onPress={() => setFilter(OHNE_FILTER)}
              />
            ) : null}
          </View>
        }
        quelleStand={raumplanQuelleStand(uebersicht.data?.standAlter, uebersicht.dataUpdatedAt)}
      >
        {(raeume) => (
          <ScrollView contentContainerStyle={styles.liste}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t('raum.freiSuche.zeitraum', { von: zeitText(start, heute), bis: zeitText(ende, start) })}
            </Text>
            {raeume.map((r) => (
              <Karte
                key={r.roomId}
                label={t('raum.oeffnen', { roomId: r.roomId })}
                onPress={() => router.push({ pathname: '/rooms/raum/[roomId]', params: { roomId: r.roomId } })}
              >
                <Kennung roomId={r.roomId} />
                <FreiBisText freiBis={r.freiBis} schliesszeit={r.freiBisSchliesszeit} bezug={start} />
                <Merkmale groesse={r.groesse} ekey={r.ekeyZugaenglich} />
              </Karte>
            ))}
          </ScrollView>
        )}
      </AsyncStates>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  steuerung: { gap: 8, paddingBottom: 8 },
  label: { fontSize: 13 },
  reihe: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  beginn: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  schalter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  schalterText: { fontSize: 15, flex: 1 },
  leerAktionen: { gap: 8 },
  liste: { gap: 8, paddingBottom: 24 },
});
