import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { SCHEDULE_PALETTE } from '@/theme/tokens';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { textfarbeFuerHintergrund } from '../farbe';
import { ermittleKonflikte } from '../konflikt';
import { useScheduleEntries } from '../planStore';
import { istAktiv } from '../time';
import type { PlanEntry } from '../typen';
import { endeDesNaechstenVorkommens } from '../wochenrechnung';

// Termindetails (Requirement „Anzeige der Termindetails"). Der Bildschirm zeigt
// alle Angaben des Eintrags und trägt die Bedienwege, die die Anforderungen
// ausdrücklich als sichtbar verlangen: Farbwahl je Termin, Deaktivieren mit den
// zwei Reichweiten (Requirement „Deaktivieren eines Termins"), Bearbeiten und
// Löschen eines eigenen Termins sowie die bewusste Übernahme trotz Konflikt.
//
// Er schreibt ausschließlich über `planStore.ts`, also rein gerätelokal
// (DATA-F-010).

const MINUTEN_JE_STUNDE = 60;

function formatZeit(minutenSeitMitternacht: number): string {
  const stunden = Math.floor(minutenSeitMitternacht / MINUTEN_JE_STUNDE);
  const minuten = minutenSeitMitternacht % MINUTEN_JE_STUNDE;
  return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
}

function titelVon(entry: PlanEntry): string {
  return entry.kind === 'offiziell' ? entry.name : entry.title;
}

function formatZeitpunkt(unixSekunden: number): string {
  const datum = new Date(unixSekunden * 1000);
  const tag = String(datum.getDate()).padStart(2, '0');
  const monat = String(datum.getMonth() + 1).padStart(2, '0');
  const uhrzeit = `${String(datum.getHours()).padStart(2, '0')}:${String(datum.getMinutes()).padStart(2, '0')}`;
  return `${tag}.${monat}. ${uhrzeit}`;
}

export function TerminDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { entries, loaded, deaktivierungSetzen, farbeSetzen, entfernen, konfliktAnnehmen } =
    useScheduleEntries();
  const [loeschenBestaetigen, setLoeschenBestaetigen] = useState(false);
  const jetztSek = Math.floor(Date.now() / 1000);

  const entry = entries.find((e) => e.id === params.id);

  if (!loaded) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (!entry) {
    return (
      <Screen center>
        <MessageView
          symbol="—"
          title={t('schedule.detailFehltTitel')}
          body={t('schedule.detailFehltHinweis')}
          action={<AppButton label={t('common.back')} onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const tagesTermine = entries.filter((e) => e.weekday === entry.weekday);
  const konflikte = ermittleKonflikte(tagesTermine, jetztSek);
  const offeneGegenparts = konflikte.offen
    .filter((paar) => paar.a.id === entry.id || paar.b.id === entry.id)
    .map((paar) => (paar.a.id === entry.id ? paar.b : paar.a));
  const angenommeneGegenparts = konflikte.angenommen
    .filter((paar) => paar.a.id === entry.id || paar.b.id === entry.id)
    .map((paar) => (paar.a.id === entry.id ? paar.b : paar.a));

  const zeitraum = `${t(`schedule.weekday.${entry.weekday}`)} ${formatZeit(entry.timeBeginMin)}–${formatZeit(
    entry.timeEndMin,
  )}`;

  return (
    <Screen scroll tight hideScrollbar>
      <View style={[styles.kopf, { backgroundColor: entry.color }]}>
        <Text style={[styles.titel, { color: textfarbeFuerHintergrund(entry.color) }]}>
          {titelVon(entry)}
        </Text>
        <Text style={{ color: textfarbeFuerHintergrund(entry.color) }}>{zeitraum}</Text>
      </View>

      <View style={styles.angaben}>
        {entry.kind === 'offiziell' ? (
          <>
            <Angabe label={t('schedule.detailArt')} wert={entry.courseType} />
            <Angabe label={t('schedule.detailBezeichnung')} wert={entry.name} />
            <Angabe
              label={t('schedule.detailGruppe')}
              wert={entry.studentSet === '*' ? t('schedule.kurseGruppeAlle') : entry.studentSet}
            />
            <Angabe label={t('schedule.detailLehrperson')} wert={entry.lecturerName} />
            <Angabe label={t('schedule.detailRaum')} wert={entry.roomId} />
          </>
        ) : (
          <>
            <Angabe label={t('schedule.detailBezeichnung')} wert={entry.title} />
            <Angabe label={t('schedule.detailHerkunft')} wert={t('schedule.kennzeichenEigen')} />
            {entry.lecturerName ? (
              <Angabe label={t('schedule.detailLehrperson')} wert={entry.lecturerName} />
            ) : null}
            {entry.roomId ? <Angabe label={t('schedule.detailRaum')} wert={entry.roomId} /> : null}
            <Angabe
              label={t('schedule.detailWiederholung')}
              wert={
                entry.wiederkehrend ? t('schedule.terminWiederkehrend') : t('schedule.terminEinmalig')
              }
            />
          </>
        )}
        <Angabe label={t('schedule.detailZeitraum')} wert={zeitraum} />
        {entry.istPruefung ? (
          <Angabe label={t('schedule.detailPruefung')} wert={t('schedule.kennzeichenPruefung')} />
        ) : null}
        {!entry.gruppenzugehoerig ? (
          <Angabe label={t('schedule.detailGruppenzugehoerigkeit')} wert={t('schedule.kennzeichenGruppenfremd')} />
        ) : null}
      </View>

      <DeaktivierenAbschnitt entry={entry} jetztSek={jetztSek} onSetzen={deaktivierungSetzen} />

      <View>
        <Text style={[styles.abschnitt, { color: colors.text }]}>{t('schedule.detailFarbe')}</Text>
        <View style={styles.farben}>
          {SCHEDULE_PALETTE.map((farbe) => {
            const gewaehlt = farbe === entry.color;
            return (
              <Pressable
                key={farbe}
                accessibilityRole="radio"
                accessibilityState={{ selected: gewaehlt }}
                accessibilityLabel={t('schedule.farbeWaehlen', { farbe })}
                onPress={() => farbeSetzen(entry.id, farbe)}
                style={[styles.farbe, { backgroundColor: farbe, borderColor: colors.border }]}
              >
                <Text style={{ color: textfarbeFuerHintergrund(farbe), fontSize: 16 }}>
                  {gewaehlt ? '✓' : ' '}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {offeneGegenparts.length > 0 || angenommeneGegenparts.length > 0 ? (
        <View style={[styles.konflikte, { borderColor: colors.border }]}>
          <Text style={[styles.abschnitt, { color: colors.text }]}>{t('schedule.detailKonflikte')}</Text>
          {angenommeneGegenparts.map((gegenpart) => (
            <Text key={gegenpart.id} style={{ color: colors.textMuted }}>
              {t('schedule.konfliktAngenommenMit', { titel: titelVon(gegenpart) })}
            </Text>
          ))}
          {offeneGegenparts.map((gegenpart) => (
            <View key={gegenpart.id} style={styles.konfliktZeile}>
              <Text style={{ color: colors.text, flex: 1 }}>
                {t('schedule.konfliktMit', { titel: titelVon(gegenpart) })}
              </Text>
              <AppButton
                variant="secondary"
                label={t('schedule.konfliktAnnehmen')}
                onPress={() => konfliktAnnehmen(entry.id, gegenpart.id)}
              />
            </View>
          ))}
        </View>
      ) : null}

      {entry.kind === 'eigen' ? (
        <AppButton
          variant="secondary"
          label={t('schedule.terminBearbeiten')}
          onPress={() => router.push({ pathname: '/termin', params: { id: entry.id } })}
        />
      ) : null}

      {loeschenBestaetigen ? (
        <View style={[styles.loeschen, { borderColor: colors.danger }]}>
          <Text style={{ color: colors.text }}>{t('schedule.terminLoeschenFrage')}</Text>
          <View style={styles.loeschenAktionen}>
            <AppButton
              variant="secondary"
              label={t('common.cancel')}
              onPress={() => setLoeschenBestaetigen(false)}
            />
            <AppButton
              variant="destructive"
              label={t('schedule.terminLoeschenBestaetigen')}
              onPress={() => {
                entfernen(entry.id);
                router.back();
              }}
            />
          </View>
        </View>
      ) : (
        <AppButton
          variant="destructive"
          label={t('schedule.terminLoeschen')}
          onPress={() => setLoeschenBestaetigen(true)}
        />
      )}
    </Screen>
  );
}

/**
 * Requirement „Deaktivieren eines Termins": bietet die zwei Reichweiten als
 * getrennte Einträge an (design.md, Entscheidung 4) und die Rücknahme, sobald
 * der Termin deaktiviert ist. Der aktuelle Zustand steht als Text davor —
 * die Bedeutung hängt nicht allein an der Farbe der Wochenansicht.
 */
function DeaktivierenAbschnitt({
  entry,
  jetztSek,
  onSetzen,
}: {
  entry: PlanEntry;
  jetztSek: number;
  onSetzen: (id: string, deaktiviertBis: null | 'dauerhaft' | number) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const aktiv = istAktiv(entry, jetztSek);

  return (
    <View>
      <Text style={[styles.abschnitt, { color: colors.text }]}>{t('schedule.detailDeaktivieren')}</Text>
      <Text style={{ color: colors.textMuted, marginBottom: 8 }}>
        {entry.deaktiviertBis === null
          ? t('schedule.detailAktivZustand')
          : entry.deaktiviertBis === 'dauerhaft'
            ? t('schedule.detailDeaktiviertDauerhaft')
            : t('schedule.detailDeaktiviertBis', { zeitpunkt: formatZeitpunkt(entry.deaktiviertBis) })}
      </Text>
      {aktiv ? (
        <View style={styles.deaktivierenAktionen}>
          <AppButton
            variant="secondary"
            label={t('schedule.detailDeaktivierenDauerhaft')}
            onPress={() => onSetzen(entry.id, 'dauerhaft')}
          />
          <AppButton
            variant="secondary"
            label={t('schedule.detailDeaktivierenEinmalig')}
            onPress={() =>
              onSetzen(entry.id, endeDesNaechstenVorkommens(jetztSek, entry.weekday, entry.timeEndMin))
            }
          />
        </View>
      ) : (
        <AppButton label={t('schedule.detailAktivieren')} onPress={() => onSetzen(entry.id, null)} />
      )}
    </View>
  );
}

function Angabe({ label, wert }: { label: string; wert: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.angabe}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 16 }}>{wert}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kopf: { borderRadius: 10, padding: 14, gap: 4 },
  titel: { fontSize: 20, fontWeight: '700' },
  angaben: { gap: 10 },
  angabe: { gap: 2 },
  abschnitt: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  farben: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  farbe: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deaktivierenAktionen: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  konflikte: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  konfliktZeile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loeschen: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  loeschenAktionen: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
