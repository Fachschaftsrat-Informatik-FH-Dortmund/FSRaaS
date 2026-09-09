import { useEffect, useMemo, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import { useStudiengaenge, useVorlesungszeit } from '../api';
import {
  anfangsAnsicht,
  useAnsichtEinstellungen,
  useAnsichtsstand,
  type Ansichtsstand,
} from '../ansichtEinstellungen';
import { layoutTag } from '../dayLayout';
import { useEinrichtung } from '../einrichtung';
import { textfarbeFuerHintergrund } from '../farbe';
import { wischRichtung } from '../../canteen/gesten';
import { ermittleJetztStatus } from '../jetzt';
import { ermittleKonflikte, type Konflikte } from '../konflikt';
import { useScheduleEntries } from '../planStore';
import { useSemesterstand } from '../semesterstand';
import { erkenneSemesterwechsel } from '../semesterwechsel';
import { istAktiv } from '../time';
import type { BelegtSlot, DaySlot, PlanEntry, Weekday } from '../typen';
import { spanneDesTages } from '../zeitachse';
import { isoDatumVon, leerGrund, termineDerWoche, termineDesTages } from '../wochenansicht';
import { sichtbareWochentage } from '../wochentage';
import {
  datumFuerWochentag,
  verschiebeDatum,
  verschiebeWoche,
  wocheAusserhalbVorlesungszeit,
  wochenanfang,
  wochentagVonDatum,
  zielWochentagBeimOeffnen,
} from '../wochenrechnung';
import { WochentagsLeiste } from '../ui/WochentagsLeiste';

// Wochenansicht des Stundenplans (Roadmap-Schritt 5, Etappe 3). Sie verdrahtet
// die vorhandene, für sich getestete Logikschicht des Bereichs — `wochentage`,
// `wochenrechnung`, `dayLayout`, `jetzt`, `konflikt`, `zeitachse`,
// `semesterwechsel` — und fügt selbst keine Fachlogik hinzu.
//
// Der persönliche Plan liegt ausschließlich lokal (DATA-F-010); die vier
// Zustände Laden, Leer, Fehler und Offline kommen trotzdem über `AsyncStates`,
// die einzige Grundstruktur dafür (ARCH-N-020, design.md Entscheidung 6). Der
// lokale Speicher wird dazu als `QueryLike` gereicht.

/**
 * Höhe einer Minute auf der proportionalen Achse (dp). 1,5 dp je Minute, damit
 * der kürzeste im Bestand vorkommende Termin (30 min) mit 45 dp über der
 * Mindestgröße von 44×44 dp für Bedienelemente bleibt (UX-N-020). Für einen
 * noch kürzeren Termin greift zusätzlich `minHeight: 44` an der Kachel: Sie
 * wird dann etwas höher als proportional — die Bedienbarkeit geht hier der
 * exakten Proportion vor.
 */
const DP_JE_MINUTE = 1.5;
const MINUTEN_JE_STUNDE = 60;
/** Requirement „Stapelung…", Szenario „Stapel aufklappen": Mindesthöhe je Kachel im aufgeklappten Stapel. */
const KACHEL_AUFGEKLAPPT_HOEHE = 60;

function formatZeit(minutenSeitMitternacht: number): string {
  const stunden = Math.floor(minutenSeitMitternacht / MINUTEN_JE_STUNDE);
  const minuten = minutenSeitMitternacht % MINUTEN_JE_STUNDE;
  return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
}

/** `"YYYY-MM-DD"` als `"TT.MM."` — Kalenderdatum je Wochentag in der Leiste. */
function formatTagesdatum(isoDatum: string): string {
  const [, monat, tag] = isoDatum.split('-');
  return `${tag}.${monat}.`;
}

function titelVon(entry: PlanEntry): string {
  return entry.kind === 'offiziell' ? entry.name : entry.title;
}

function dauerText(minuten: number, t: TFunction): string {
  const stunden = Math.floor(minuten / MINUTEN_JE_STUNDE);
  const rest = minuten % MINUTEN_JE_STUNDE;
  if (stunden === 0) return t('schedule.dauerMinuten', { count: rest });
  if (rest === 0) return t('schedule.dauerStunden', { count: stunden });
  return t('schedule.dauerStundenMinuten', { stunden, minuten: rest });
}

export function ScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { einrichtung, loaded: einrichtungGeladen } = useEinrichtung();
  const { entries, loaded: planGeladen } = useScheduleEntries();
  const { einstellungen, loaded: einstellungenGeladen } = useAnsichtEinstellungen();
  const { zuletztBetrachtet, loaded: standGeladen, merkeStand } = useAnsichtsstand();
  const vorlesungszeit = useVorlesungszeit();

  const jetzt = useJetzt();
  const jetztSek = Math.floor(jetzt.getTime() / 1000);
  const heuteDatum = isoDatumVon(jetzt);
  const heutigerWochentag = wochentagVonDatum(heuteDatum);
  const laufendeWoche = wochenanfang(heuteDatum);

  const [stand, setStand] = useState<Ansichtsstand | null>(null);
  const allesGeladen = einrichtungGeladen && planGeladen && einstellungenGeladen && standGeladen;

  // Requirement „Sprung zum aktuellen Wochentag": einmalig beim Öffnen, sobald
  // alle gerätelokalen Stände vorliegen. Der Ausweichtag am Wochenende gilt
  // laut Anforderung allein beim automatischen Sprung.
  useEffect(() => {
    if (!allesGeladen || stand !== null) return;
    const zielTag = einstellungen.sprungZuHeute
      ? zielWochentagBeimOeffnen(heutigerWochentag, (tag) => termineDesTages(entries, laufendeWoche, tag).length > 0)
      : heutigerWochentag;
    setStand(
      anfangsAnsicht(einstellungen.sprungZuHeute, zuletztBetrachtet, {
        wochenanfang: laufendeWoche,
        wochentag: zielTag,
      }),
    );
  }, [allesGeladen, stand, einstellungen.sprungZuHeute, zuletztBetrachtet, heutigerWochentag, laufendeWoche, entries]);

  function wechsleStand(next: Ansichtsstand) {
    setStand(next);
    merkeStand(next);
  }

  const wocheTermine = useMemo(
    () => (stand ? termineDerWoche(entries, stand.wochenanfang, ALLE_WOCHENTAGE) : []),
    [entries, stand],
  );

  // Requirement „Wochentagsleiste mit bedarfsweisem Samstag": Samstag und
  // Sonntag nur, wenn dort ein sichtbarer Termin liegt.
  const wochentage = useMemo(
    () => sichtbareWochentage((tag) => wocheTermine.some((e) => e.weekday === tag)),
    [wocheTermine],
  );

  const tagesTermine = useMemo(
    () => (stand ? termineDesTages(entries, stand.wochenanfang, stand.wochentag) : []),
    [entries, stand],
  );
  const konflikte = useMemo(() => ermittleKonflikte(tagesTermine, jetztSek), [tagesTermine, jetztSek]);
  const spanne = useMemo(() => spanneDesTages(tagesTermine), [tagesTermine]);

  // Requirement „Tageswechsel durch Wischen": waagerechtes Wischen zusätzlich
  // zur Wochentagsleiste, die als sichtbarer Weg bestehen bleibt (UX-N-Regel
  // „keine Aktion allein über eine Geste"). Muster und Baustein (`gesten.ts`)
  // aus dem Mensaplan.
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_e, g) => {
          if (!stand) return;
          const richtung = wischRichtung(g.dx);
          if (richtung === 0) return;
          const naechstesDatum = verschiebeDatum(datumFuerWochentag(stand.wochenanfang, stand.wochentag), richtung);
          wechsleStand({
            wochenanfang: wochenanfang(naechstesDatum),
            wochentag: wochentagVonDatum(naechstesDatum),
          });
        },
      }),
    [stand],
  );

  // Der lokale Plan als `QueryLike`, damit Laden und Leerzustand über dieselbe
  // Grundstruktur laufen wie jede datenabhängige Ansicht (ARCH-N-020).
  const planQuery: QueryLike<PlanEntry[]> = {
    data: allesGeladen && stand !== null ? entries : undefined,
    isPending: !allesGeladen || stand === null,
    isError: false,
    isFetching: false,
    isStale: false,
    error: undefined,
    dataUpdatedAt: Date.now(),
    refetch: () => undefined,
  };

  const keineEinrichtung = einrichtung.endpunkte.length === 0;

  return (
    <Screen tight>
      <SemesterwechselHinweis />

      <AsyncStates<PlanEntry[]>
        query={planQuery}
        isEmpty={(alle) => keineEinrichtung || alle.length === 0}
        emptyTitle={keineEinrichtung ? t('schedule.kurseKeineEinrichtungTitel') : t('schedule.planLeerTitel')}
        emptyNextStep={
          keineEinrichtung ? t('schedule.kurseKeineEinrichtungHinweis') : t('schedule.planLeerHinweis')
        }
        emptyAction={
          keineEinrichtung ? (
            <AppButton label={t('schedule.einrichtungOeffnen')} onPress={() => router.push('/einrichtung')} />
          ) : (
            <AppButton label={t('schedule.weiterZurKursauswahl')} onPress={() => router.push('/kurse')} />
          )
        }
      >
        {() =>
          stand === null ? null : (
            <View style={styles.inhalt}>
              <JetztAnzeige
                termine={
                  stand.wochenanfang === laufendeWoche
                    ? termineDesTages(entries, laufendeWoche, heutigerWochentag)
                    : []
                }
                jetztMin={jetzt.getHours() * MINUTEN_JE_STUNDE + jetzt.getMinutes()}
                jetztSek={jetztSek}
              />

              {/* Requirement „Feststehender Kopfbereich der Wochenansicht": Wochenangabe
                  und Wochentagsleiste stehen außerhalb des scrollenden Tagesbereichs. */}
              <Wochenkopf stand={stand} laufendeWoche={laufendeWoche} onWechsel={wechsleStand} />

              <Wochentagsleiste
                stand={stand}
                wochentage={wochentage}
                heutigerWochentag={stand.wochenanfang === laufendeWoche ? heutigerWochentag : null}
                onWaehle={(wochentag) => wechsleStand({ ...stand, wochentag })}
              />

              <ScrollView
                testID="tagBereich"
                style={styles.tagBereich}
                contentContainerStyle={styles.tagBereichInhalt}
                showsVerticalScrollIndicator={false}
                {...swipe.panHandlers}
              >
                {wocheAusserhalbVorlesungszeit(
                  stand.wochenanfang,
                  vorlesungszeit.data?.von ?? null,
                  vorlesungszeit.data?.bis ?? null,
                ) ? (
                  <MessageView
                    symbol="◷"
                    title={t('schedule.vorlesungsfreiTitel')}
                    body={t('schedule.vorlesungsfreiHinweis')}
                    style={styles.hinweisFlaeche}
                  />
                ) : tagesTermine.length === 0 ? (
                  <LeererTag grund={leerGrund(entries, stand.wochenanfang, stand.wochentag)} />
                ) : einstellungen.zeitachse ? (
                  <Zeitachse
                    slots={layoutTag(tagesTermine, spanne.vonMin, spanne.bisMin)}
                    spanne={spanne}
                    konflikte={konflikte}
                    jetztSek={jetztSek}
                    jetztMin={
                      stand.wochenanfang === laufendeWoche && stand.wochentag === heutigerWochentag
                        ? jetzt.getHours() * MINUTEN_JE_STUNDE + jetzt.getMinutes()
                        : null
                    }
                    onOeffne={(id) => router.push({ pathname: '/detail', params: { id } })}
                  />
                ) : (
                  <KompakteListe
                    termine={tagesTermine}
                    konflikte={konflikte}
                    jetztSek={jetztSek}
                    onOeffne={(id) => router.push({ pathname: '/detail', params: { id } })}
                  />
                )}
              </ScrollView>
            </View>
          )
        }
      </AsyncStates>
    </Screen>
  );
}

const ALLE_WOCHENTAGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Aktuelle Uhrzeit, minütlich fortgeschrieben — Grundlage von `jetzt.ts` und der Uhrzeitmarke. */
function useJetzt(): Date {
  const [jetzt, setJetzt] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setJetzt(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return jetzt;
}

/**
 * Requirement „Hinweis bei Semesterwechsel": Die aktuell über INT-001
 * gelieferte Endpunktliste wird gegen den zuletzt gesehenen Stand gehalten.
 * Ohne gewählte Endpunkte gibt es nichts abzugleichen.
 *
 * Requirement „Kein selbsttätiges Entfernen des Stundenplans": dieser Hinweis
 * bietet das Leeren oder Zurücksetzen ausschließlich über das Verwaltungsblatt
 * an (`VerwaltungsblattZugang`) — er entfernt nie selbst etwas aus dem Plan.
 */
function SemesterwechselHinweis() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { einrichtung } = useEinrichtung();
  const { studiengaenge } = useStudiengaenge();
  const { gespeicherteEndpunkte, loaded, merkeEndpunkte } = useSemesterstand();

  if (!loaded || einrichtung.endpunkte.length === 0 || studiengaenge.length === 0) return null;

  const aktuelle = studiengaenge.map((s) => s.sname);
  const ergebnis = erkenneSemesterwechsel(gespeicherteEndpunkte, aktuelle);
  if (!ergebnis.geaendert) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.banner }]} accessibilityLiveRegion="polite">
      <Text style={{ color: colors.onBanner }}>{t('schedule.semesterwechselHinweis')}</Text>
      <View style={styles.bannerAktionen}>
        <AppButton
          variant="secondary"
          label={t('schedule.einrichtungOeffnen')}
          onPress={() => router.push('/einrichtung')}
        />
        <AppButton
          variant="secondary"
          label={t('schedule.semesterwechselVerstanden')}
          onPress={() => merkeEndpunkte(ergebnis.nachher)}
        />
      </View>
    </View>
  );
}

/** Requirement „Anzeige des laufenden und nächsten Termins" — nebeneinander über dem Plan. */
function JetztAnzeige({
  termine,
  jetztMin,
  jetztSek,
}: {
  termine: readonly PlanEntry[];
  jetztMin: number;
  jetztSek: number;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const status = ermittleJetztStatus(termine, jetztMin, jetztSek);
  if (!status.laufend && !status.naechster) return null;

  return (
    <View style={[styles.jetzt, { borderColor: colors.border }]} accessibilityLiveRegion="polite">
      {status.laufend ? (
        <View style={styles.jetztSpalte}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {t('schedule.jetztLaufend', {
              titel: titelVon(status.laufend),
              minuten: dauerText(status.laufendVerbleibendMin ?? 0, t),
            })}
          </Text>
        </View>
      ) : null}
      {status.naechster ? (
        <View style={styles.jetztSpalte}>
          <Text style={{ color: colors.textMuted }}>
            {t('schedule.jetztNaechster', {
              titel: titelVon(status.naechster),
              minuten: dauerText(status.naechsterInMin ?? 0, t),
            })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Requirement „Rückkehr zur laufenden Woche über die Wochenangabe": die Wochenangabe selbst ist der Bedienweg. */
function Wochenkopf({
  stand,
  laufendeWoche,
  onWechsel,
}: {
  stand: Ansichtsstand;
  laufendeWoche: string;
  onWechsel: (stand: Ansichtsstand) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const laufend = stand.wochenanfang === laufendeWoche;
  const bereich = t('schedule.wochenBereich', {
    von: formatTagesdatum(stand.wochenanfang),
    bis: formatTagesdatum(datumFuerWochentag(stand.wochenanfang, 'Sun')),
  });

  return (
    <View style={styles.wochenkopf}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('schedule.wocheVorige')}
        onPress={() => onWechsel({ ...stand, wochenanfang: verschiebeWoche(stand.wochenanfang, -1) })}
        style={styles.blaettern}
      >
        <Text style={{ color: colors.accent, fontSize: 18 }}>‹</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={laufend ? bereich : t('schedule.wocheAktuell')}
        onPress={laufend ? undefined : () => onWechsel({ ...stand, wochenanfang: laufendeWoche })}
        style={styles.wochenText}
      >
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{bereich}</Text>
        {!laufend ? (
          <Text style={{ color: colors.accent, fontSize: 12, textAlign: 'center' }}>{t('schedule.wocheAktuell')}</Text>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('schedule.wocheNaechste')}
        onPress={() => onWechsel({ ...stand, wochenanfang: verschiebeWoche(stand.wochenanfang, 1) })}
        style={styles.blaettern}
      >
        <Text style={{ color: colors.accent, fontSize: 18 }}>›</Text>
      </Pressable>
    </View>
  );
}

/**
 * Requirement „Wochentagsleiste mit bedarfsweisem Samstag": Wochentag und
 * Kalenderdatum je Eintrag, ohne Terminanzahl (Requirement, REMOVED
 * „Belegungsvorschau je Tag"), über die gemeinsame Komponente
 * `WochentagsLeiste` (design.md, Entscheidung 8).
 */
function Wochentagsleiste({
  stand,
  wochentage,
  heutigerWochentag,
  onWaehle,
}: {
  stand: Ansichtsstand;
  wochentage: readonly Weekday[];
  heutigerWochentag: Weekday | null;
  onWaehle: (wochentag: Weekday) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <WochentagsLeiste
      aktiverWochentag={stand.wochentag}
      onWaehle={onWaehle}
      eintraege={wochentage.map((wochentag) => {
        const datum = datumFuerWochentag(stand.wochenanfang, wochentag);
        const aktiv = wochentag === stand.wochentag;
        return {
          wochentag,
          accessibilityLabel: `${t(`schedule.weekday.${wochentag}`)} ${formatTagesdatum(datum)}`,
          inhalt: (
            <>
              <Text style={{ color: aktiv ? colors.onAccent : colors.text, fontWeight: '600' }}>
                {`${heutigerWochentag === wochentag ? '• ' : ''}${t(`schedule.weekday.${wochentag}`)}`}
              </Text>
              <Text style={{ color: aktiv ? colors.onAccent : colors.textMuted, fontSize: 12 }}>
                {formatTagesdatum(datum)}
              </Text>
            </>
          ),
        };
      })}
    />
  );
}

/** Requirement „Kennzeichnung eines leeren Wochentags". */
function LeererTag({ grund }: { grund: ReturnType<typeof leerGrund> }) {
  const { t } = useTranslation();
  const text = grund === 'gueltigkeitszeitraum' ? t('schedule.tagLeerZeitraum') : t('schedule.tagLeerOhneTermine');

  return <MessageView symbol="—" title={t('schedule.tagLeerTitel')} body={text} style={styles.hinweisFlaeche} />;
}

function schluesselFuerStapel(abschnitt: Extract<DaySlot, { art: 'belegt' }>, slot: Extract<BelegtSlot, { art: 'stapel' }>): string {
  return `${abschnitt.vonMin}-${abschnitt.bisMin}-${slot.spalte}`;
}

/**
 * Requirements „Proportionale Zeitachse", „Nebeneinanderdarstellung
 * überschneidender Termine", „Stapelung bei mehr als drei überschneidenden
 * Terminen", „Stundenlinien auf der Zeitachse" und „Hervorhebung des
 * laufenden Termins und der aktuellen Uhrzeit". Die Slots kommen unverändert
 * aus `dayLayout.layoutTag`; hier wird allein auf Pixel umgerechnet
 * (design.md, Entscheidung 1) — je Abschnitt eine eigene Höhe, keine lineare
 * Formel mehr.
 */
function Zeitachse({
  slots,
  spanne,
  konflikte,
  jetztMin,
  jetztSek,
  onOeffne,
}: {
  slots: readonly DaySlot[];
  spanne: { vonMin: number; bisMin: number };
  konflikte: Konflikte;
  jetztMin: number | null;
  jetztSek: number;
  onOeffne: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [aufgeklappterStapel, setAufgeklappterStapel] = useState<string | null>(null);

  // Requirement „Hervorhebung des laufenden Termins und der aktuellen Uhrzeit",
  // Szenario „Uhrzeit vor dem ersten Termin": die Kennzeichnung wird an den
  // Rand geheftet, statt zu verschwinden.
  const jetztGeklemmt =
    jetztMin === null ? null : Math.min(Math.max(jetztMin, spanne.vonMin), spanne.bisMin);

  let cursor = 0;
  const abschnitte = slots.map((slot, index) => {
    let hoehe = slot.hoeheMin * DP_JE_MINUTE;
    if (slot.art === 'belegt') {
      const stapel = slot.slots.find((s): s is Extract<BelegtSlot, { art: 'stapel' }> => s.art === 'stapel');
      if (stapel && aufgeklappterStapel === schluesselFuerStapel(slot, stapel)) {
        const normalHoehe = (stapel.bisMin - stapel.vonMin) * DP_JE_MINUTE;
        const aufgeklapptHoehe = stapel.entries.length * KACHEL_AUFGEKLAPPT_HOEHE;
        hoehe += Math.max(0, aufgeklapptHoehe - normalHoehe);
      }
    }
    const top = cursor;
    cursor += hoehe;
    return { slot, top, hoehe, key: index };
  });
  const gesamthoehe = cursor;

  return (
    <View style={[styles.achse, { height: gesamthoehe }]}>
      {abschnitte.map(({ slot, top, hoehe, key }) =>
        slot.art === 'luecke' ? (
          <View key={`luecke-${key}`} style={[styles.abschnitt, { top, height: hoehe }]}>
            {slot.stundenlinien.map((marke) => (
              <View
                key={marke}
                style={[
                  styles.stundenlinie,
                  { top: (marke - slot.vonMin) * DP_JE_MINUTE, backgroundColor: colors.border },
                ]}
              />
            ))}
            {slot.kurz ? null : (
              <View
                accessibilityRole="text"
                accessibilityLabel={t('schedule.lueckeLabel', {
                  dauer: dauerText(slot.echteDauerMin, t),
                  von: formatZeit(slot.vonMin),
                  bis: formatZeit(slot.bisMin),
                })}
                style={[styles.luecke, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  {slot.gestaucht
                    ? `⌇ ${t('schedule.luecke', { dauer: dauerText(slot.echteDauerMin, t) })}`
                    : t('schedule.luecke', { dauer: dauerText(slot.echteDauerMin, t) })}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View key={`belegt-${key}`} style={[styles.abschnitt, { top, height: hoehe }]}>
            {slot.stundenlinien.map((marke) => (
              <View
                key={marke}
                style={[
                  styles.stundenlinie,
                  { top: (marke - slot.vonMin) * DP_JE_MINUTE, backgroundColor: colors.border },
                ]}
              />
            ))}
            {slot.slots.map((einzelslot) =>
              einzelslot.art === 'termin' ? (
                <View
                  key={einzelslot.entry.id}
                  style={[
                    styles.terminPlatz,
                    {
                      top: (einzelslot.entry.timeBeginMin - slot.vonMin) * DP_JE_MINUTE,
                      height: (einzelslot.entry.timeEndMin - einzelslot.entry.timeBeginMin) * DP_JE_MINUTE,
                      left: `${(einzelslot.spalte / einzelslot.spalten) * 100}%`,
                      width: `${(1 / einzelslot.spalten) * 100}%`,
                    },
                  ]}
                >
                  <TerminKachel
                    entry={einzelslot.entry}
                    konflikte={konflikte}
                    jetztSek={jetztSek}
                    laeuft={
                      jetztMin !== null &&
                      einzelslot.entry.timeBeginMin <= jetztMin &&
                      jetztMin < einzelslot.entry.timeEndMin
                    }
                    onOeffne={onOeffne}
                  />
                </View>
              ) : (
                <StapelKachel
                  key={schluesselFuerStapel(slot, einzelslot)}
                  abschnitt={slot}
                  stapel={einzelslot}
                  aufgeklappt={aufgeklappterStapel === schluesselFuerStapel(slot, einzelslot)}
                  onUmschalten={() =>
                    setAufgeklappterStapel((bisher) =>
                      bisher === schluesselFuerStapel(slot, einzelslot) ? null : schluesselFuerStapel(slot, einzelslot),
                    )
                  }
                  konflikte={konflikte}
                  jetztSek={jetztSek}
                  onOeffne={onOeffne}
                />
              ),
            )}
          </View>
        ),
      )}

      {jetztGeklemmt !== null ? (
        <View
          accessibilityRole="text"
          accessibilityLabel={t('schedule.aktuelleUhrzeit', { zeit: formatZeit(jetztMin ?? jetztGeklemmt) })}
          style={[styles.uhrzeitMarke, { top: mapJetztAufAchse(jetztGeklemmt, abschnitte), backgroundColor: colors.danger }]}
        />
      ) : null}
    </View>
  );
}

/** Bildet eine (bereits an die Tagesspanne geklemmte) Uhrzeit auf die kumulierte Pixelposition der Abschnitte ab. */
function mapJetztAufAchse(
  minute: number,
  abschnitte: readonly { slot: DaySlot; top: number; hoehe: number }[],
): number {
  for (const { slot, top } of abschnitte) {
    if (minute >= slot.vonMin && minute <= slot.bisMin) {
      if (slot.art === 'luecke' && slot.gestaucht) return top; // in einer gestauchten Lücke nicht maßstabsgetreu abbildbar
      return top + (minute - slot.vonMin) * DP_JE_MINUTE;
    }
  }
  const letzter = abschnitte[abschnitte.length - 1];
  return letzter ? letzter.top + letzter.hoehe : 0;
}

/** Requirement „Stapelung bei mehr als drei überschneidenden Terminen", Szenario „Stapel aufklappen". */
function StapelKachel({
  abschnitt,
  stapel,
  aufgeklappt,
  onUmschalten,
  konflikte,
  jetztSek,
  onOeffne,
}: {
  abschnitt: Extract<DaySlot, { art: 'belegt' }>;
  stapel: Extract<BelegtSlot, { art: 'stapel' }>;
  aufgeklappt: boolean;
  onUmschalten: () => void;
  konflikte: Konflikte;
  jetztSek: number;
  onOeffne: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const top = (stapel.vonMin - abschnitt.vonMin) * DP_JE_MINUTE;
  const left = `${(stapel.spalte / stapel.spalten) * 100}%` as const;
  const width = `${(1 / stapel.spalten) * 100}%` as const;

  if (aufgeklappt) {
    return (
      <View
        style={[styles.terminPlatz, { top, left, width, height: stapel.entries.length * KACHEL_AUFGEKLAPPT_HOEHE }]}
      >
        {stapel.entries.map((entry) => (
          <View key={entry.id} style={{ height: KACHEL_AUFGEKLAPPT_HOEHE }}>
            <TerminKachel entry={entry} konflikte={konflikte} jetztSek={jetztSek} laeuft={false} onOeffne={onOeffne} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.terminPlatz,
        { top, left, width, height: (stapel.bisMin - stapel.vonMin) * DP_JE_MINUTE },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('schedule.stapelLabel', { count: stapel.entries.length })}
        onPress={onUmschalten}
        style={[styles.kachel, styles.stapelKachel, { borderColor: colors.border }]}
      >
        <Text style={{ color: colors.text, fontWeight: '700' }}>
          {t('schedule.stapelUmfang', { count: stapel.entries.length })}
        </Text>
      </Pressable>
    </View>
  );
}

/** Requirement „Abschalten der proportionalen Zeitachse": kompakte Liste ohne Lückendarstellung. */
function KompakteListe({
  termine,
  konflikte,
  jetztSek,
  onOeffne,
}: {
  termine: readonly PlanEntry[];
  konflikte: Konflikte;
  jetztSek: number;
  onOeffne: (id: string) => void;
}) {
  return (
    <View style={styles.liste}>
      {termine.map((entry) => (
        <TerminKachel
          key={entry.id}
          entry={entry}
          konflikte={konflikte}
          jetztSek={jetztSek}
          laeuft={false}
          onOeffne={onOeffne}
        />
      ))}
    </View>
  );
}

/**
 * Ein Termin im Plan. Trägt alle Kennzeichnungen, die die Anforderungen
 * verlangen — eigen, deaktiviert, gruppenfremd, Prüfung, Konflikthinweis und
 * angenommener Konflikt —, jede zusätzlich zur Farbe als Text oder Symbol
 * (UX-F-070). Die Beschriftungsfarbe kommt aus `farbe.ts` und hält damit den
 * Mindestkontrast 4,5:1 ein (UX-N-010). Ein deaktivierter Termin
 * (`istAktiv`, Requirement „Wirkung eines deaktivierten Termins") bleibt an
 * seinem Platz, wird aber zusätzlich zur Zurücknahme über Text erkennbar.
 */
export function TerminKachel({
  entry,
  konflikte,
  jetztSek,
  laeuft,
  onOeffne,
}: {
  entry: PlanEntry;
  konflikte: Konflikte;
  jetztSek: number;
  laeuft: boolean;
  onOeffne: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const textfarbe = textfarbeFuerHintergrund(entry.color);
  const deaktiviert = !istAktiv(entry, jetztSek);

  const kennzeichen: string[] = [];
  if (entry.kind === 'eigen') kennzeichen.push(t('schedule.kennzeichenEigen'));
  if (deaktiviert) kennzeichen.push(t('schedule.kennzeichenDeaktiviert'));
  if (!entry.gruppenzugehoerig) kennzeichen.push(t('schedule.kennzeichenGruppenfremd'));
  if (entry.istPruefung) kennzeichen.push(t('schedule.kennzeichenPruefung'));
  if (konflikte.hinweisIds.has(entry.id)) kennzeichen.push(t('schedule.konfliktHinweis'));
  if (konflikte.angenommenIds.has(entry.id)) kennzeichen.push(t('schedule.konfliktAngenommen'));
  if (laeuft) kennzeichen.push(t('schedule.laeuftGerade'));

  const zeitraum = `${formatZeit(entry.timeBeginMin)}–${formatZeit(entry.timeEndMin)}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[zeitraum, titelVon(entry), ...kennzeichen].join(' · ')}
      onPress={() => onOeffne(entry.id)}
      style={[
        styles.kachel,
        { backgroundColor: entry.color },
        entry.istPruefung && [styles.kachelPruefung, { borderLeftColor: textfarbe }],
        laeuft && { borderColor: colors.text, borderWidth: 3 },
        deaktiviert && styles.kachelDeaktiviert,
      ]}
    >
      <Text style={[styles.kachelZeit, { color: textfarbe }]} numberOfLines={1}>
        {zeitraum}
      </Text>
      <Text style={[styles.kachelTitel, { color: textfarbe }]} numberOfLines={2}>
        {titelVon(entry)}
      </Text>
      {entry.kind === 'offiziell' ? (
        <Text style={[styles.kachelZeile, { color: textfarbe }]} numberOfLines={1}>
          {`${entry.courseType} · ${entry.roomId}`}
        </Text>
      ) : null}
      {kennzeichen.length > 0 ? (
        <Text style={[styles.kachelZeile, { color: textfarbe }]} numberOfLines={2}>
          {kennzeichen.join(' · ')}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inhalt: { flex: 1, gap: 12 },
  tagBereich: { flex: 1 },
  tagBereichInhalt: { flexGrow: 1 },
  banner: { padding: 12, borderRadius: 8, gap: 8 },
  bannerAktionen: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  jetzt: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, padding: 10, gap: 12 },
  jetztSpalte: { flex: 1 },
  wochenkopf: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blaettern: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  wochenText: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  hinweisFlaeche: { flexGrow: 0, paddingVertical: 32 },
  achse: { position: 'relative', marginTop: 4 },
  abschnitt: { position: 'absolute', left: 0, right: 0 },
  stundenlinie: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  luecke: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminPlatz: { position: 'absolute', paddingRight: 4 },
  stapelKachel: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  uhrzeitMarke: { position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1 },
  liste: { gap: 8 },
  kachel: { flex: 1, minHeight: 44, borderRadius: 8, padding: 8, gap: 2, justifyContent: 'flex-start' },
  kachelPruefung: { borderLeftWidth: 6 },
  // Requirement „Wirkung eines deaktivierten Termins": zurückgenommen dargestellt,
  // die Bedeutung trägt zusätzlich das Textkennzeichen (nie allein die Opazität).
  kachelDeaktiviert: { opacity: 0.55 },
  kachelZeit: { fontSize: 12, fontWeight: '600' },
  kachelTitel: { fontSize: 14, fontWeight: '700' },
  kachelZeile: { fontSize: 12 },
});
