import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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
import { ermittleJetztStatus } from '../jetzt';
import { ermittleKonflikte, type Konflikte } from '../konflikt';
import { useScheduleEntries } from '../planStore';
import { useSemesterstand } from '../semesterstand';
import { erkenneSemesterwechsel } from '../semesterwechsel';
import type { DaySlot, PlanEntry, Weekday } from '../typen';
import { spanneDerWoche } from '../zeitachse';
import { isoDatumVon, leerGrund, termineDerWoche, termineDesTages } from '../wochenansicht';
import { belegungsvorschauJeTag, sichtbareWochentage } from '../wochentage';
import {
  datumFuerWochentag,
  verschiebeWoche,
  wocheAusserhalbVorlesungszeit,
  wochenanfang,
  wochentagVonDatum,
  zielWochentagBeimOeffnen,
} from '../wochenrechnung';

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
  const {
    einstellungen,
    loaded: einstellungenGeladen,
    filter,
    toggleZeitachse,
    toggleGruppenfremdeAusblenden,
    toggleAlleAnzeigen,
  } = useAnsichtEinstellungen();
  const { zuletztBetrachtet, loaded: standGeladen, merkeStand } = useAnsichtsstand();
  const vorlesungszeit = useVorlesungszeit();

  const jetzt = useJetzt();
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
      ? zielWochentagBeimOeffnen(heutigerWochentag, (tag) =>
          termineDesTages(entries, laufendeWoche, tag, filter).length > 0,
        )
      : heutigerWochentag;
    setStand(
      anfangsAnsicht(einstellungen.sprungZuHeute, zuletztBetrachtet, {
        wochenanfang: laufendeWoche,
        wochentag: zielTag,
      }),
    );
  }, [
    allesGeladen,
    stand,
    einstellungen.sprungZuHeute,
    zuletztBetrachtet,
    heutigerWochentag,
    laufendeWoche,
    entries,
    filter,
  ]);

  function wechsleStand(next: Ansichtsstand) {
    setStand(next);
    merkeStand(next);
  }

  const wocheTermine = useMemo(
    () => (stand ? termineDerWoche(entries, stand.wochenanfang, filter, ALLE_WOCHENTAGE) : []),
    [entries, stand, filter],
  );

  // Requirement „Wochentagsleiste mit bedarfsweisem Samstag": Samstag und
  // Sonntag nur, wenn dort ein sichtbarer Termin liegt.
  const wochentage = useMemo(
    () => sichtbareWochentage((tag) => wocheTermine.some((e) => e.weekday === tag)),
    [wocheTermine],
  );
  const belegung = useMemo(
    () => belegungsvorschauJeTag(wocheTermine, wochentage),
    [wocheTermine, wochentage],
  );

  const tagesTermine = useMemo(
    () => (stand ? termineDesTages(entries, stand.wochenanfang, stand.wochentag, filter) : []),
    [entries, stand, filter],
  );
  const konflikte = useMemo(() => ermittleKonflikte(tagesTermine), [tagesTermine]);
  const spanne = useMemo(() => spanneDerWoche(wocheTermine), [wocheTermine]);

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
    <Screen scroll tight hideScrollbar>
      <EinrichtungHeaderLink />
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
                    ? termineDesTages(entries, laufendeWoche, heutigerWochentag, filter)
                    : []
                }
                jetztMin={jetzt.getHours() * MINUTEN_JE_STUNDE + jetzt.getMinutes()}
              />

              <Wochenkopf
                stand={stand}
                laufendeWoche={laufendeWoche}
                onWechsel={wechsleStand}
              />

              <Wochentagsleiste
                stand={stand}
                wochentage={wochentage}
                belegung={belegung}
                heutigerWochentag={stand.wochenanfang === laufendeWoche ? heutigerWochentag : null}
                onWaehle={(wochentag) => wechsleStand({ ...stand, wochentag })}
              />

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
                <LeererTag
                  grund={leerGrund(entries, stand.wochenanfang, stand.wochentag, filter)}
                  onFilterAbschalten={toggleAlleAnzeigen}
                />
              ) : einstellungen.zeitachse ? (
                <Zeitachse
                  slots={layoutTag(tagesTermine, spanne.vonMin, spanne.bisMin)}
                  spanne={spanne}
                  konflikte={konflikte}
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
                  onOeffne={(id) => router.push({ pathname: '/detail', params: { id } })}
                />
              )}

              <Filterleiste
                zeitachse={einstellungen.zeitachse}
                gruppenfremdeAusblenden={einstellungen.gruppenfremdeAusblenden}
                alleAnzeigen={einstellungen.alleAnzeigen}
                onZeitachse={toggleZeitachse}
                onGruppenfremde={toggleGruppenfremdeAusblenden}
                onAlleAnzeigen={toggleAlleAnzeigen}
              />
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
 * Requirement „Dauerhafter Zugang zur Einrichtung": ein jederzeit sichtbares
 * Kopfzeilen-Element, unabhängig davon, ob bereits ein persönlicher Plan
 * besteht — anders als die Leerzustände und der Semesterwechsel-Hinweis, die
 * nur unter bestimmten Bedingungen zur Einrichtung führen.
 */
function EinrichtungHeaderLink() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('schedule.einrichtungBearbeiten')}
      onPress={() => router.push('/einrichtung')}
      style={styles.einrichtungLink}
    >
      <Text style={{ color: colors.accent, fontWeight: '600' }}>{t('schedule.einrichtungBearbeiten')}</Text>
    </Pressable>
  );
}

/**
 * Requirement „Hinweis bei Semesterwechsel": Die aktuell über INT-001
 * gelieferte Endpunktliste wird gegen den zuletzt gesehenen Stand gehalten.
 * Ohne gewählte Endpunkte gibt es nichts abzugleichen.
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

/** Requirement „Anzeige des laufenden und nächsten Termins" — eigene Anzeige über dem Plan. */
function JetztAnzeige({ termine, jetztMin }: { termine: readonly PlanEntry[]; jetztMin: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const status = ermittleJetztStatus(termine, jetztMin);
  if (!status.laufend && !status.naechster) return null;

  return (
    <View style={[styles.jetzt, { borderColor: colors.border }]} accessibilityLiveRegion="polite">
      {status.laufend ? (
        <Text style={{ color: colors.text, fontWeight: '600' }}>
          {t('schedule.jetztLaufend', {
            titel: titelVon(status.laufend),
            minuten: status.laufendVerbleibendMin,
          })}
        </Text>
      ) : null}
      {status.naechster ? (
        <Text style={{ color: colors.textMuted }}>
          {t('schedule.jetztNaechster', {
            titel: titelVon(status.naechster),
            minuten: status.naechsterInMin,
          })}
        </Text>
      ) : null}
    </View>
  );
}

/** Requirement „Blättern über Wochengrenzen" samt sichtbarem Rückweg zur laufenden Woche. */
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

      <Text style={[styles.wochenText, { color: colors.text }]}>{bereich}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('schedule.wocheNaechste')}
        onPress={() => onWechsel({ ...stand, wochenanfang: verschiebeWoche(stand.wochenanfang, 1) })}
        style={styles.blaettern}
      >
        <Text style={{ color: colors.accent, fontSize: 18 }}>›</Text>
      </Pressable>

      {stand.wochenanfang !== laufendeWoche ? (
        <AppButton
          variant="secondary"
          label={t('schedule.wocheAktuell')}
          onPress={() => onWechsel({ ...stand, wochenanfang: laufendeWoche })}
        />
      ) : null}
    </View>
  );
}

/**
 * Requirements „Wochentagsleiste mit bedarfsweisem Samstag", „Belegungsvorschau
 * je Tag" und „Kalenderdatum je Wochentag".
 */
function Wochentagsleiste({
  stand,
  wochentage,
  belegung,
  heutigerWochentag,
  onWaehle,
}: {
  stand: Ansichtsstand;
  wochentage: readonly Weekday[];
  belegung: readonly { wochentag: Weekday; anzahl: number }[];
  heutigerWochentag: Weekday | null;
  onWaehle: (wochentag: Weekday) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leiste}>
      {wochentage.map((wochentag) => {
        const datum = datumFuerWochentag(stand.wochenanfang, wochentag);
        const anzahl = belegung.find((b) => b.wochentag === wochentag)?.anzahl ?? 0;
        const aktiv = wochentag === stand.wochentag;
        return (
          <Pressable
            key={wochentag}
            accessibilityRole="tab"
            accessibilityState={{ selected: aktiv }}
            accessibilityLabel={`${t(`schedule.weekday.${wochentag}`)} ${formatTagesdatum(datum)} · ${t(
              'schedule.belegung',
              { count: anzahl },
            )}`}
            onPress={() => onWaehle(wochentag)}
            style={[
              styles.tagChip,
              { borderColor: colors.border },
              aktiv && styles.tagChipAktiv,
              aktiv && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            <Text style={{ color: aktiv ? colors.onAccent : colors.text, fontWeight: '600' }}>
              {`${heutigerWochentag === wochentag ? '• ' : ''}${t(`schedule.weekday.${wochentag}`)}`}
            </Text>
            <Text style={{ color: aktiv ? colors.onAccent : colors.textMuted, fontSize: 12 }}>
              {formatTagesdatum(datum)}
            </Text>
            <Text style={{ color: aktiv ? colors.onAccent : colors.textMuted, fontSize: 12 }}>
              {t('schedule.belegung', { count: anzahl })}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Requirement „Leerer Tag bei wirksamem Filter": nennt den Filter, der den Tag geleert hat. */
function LeererTag({
  grund,
  onFilterAbschalten,
}: {
  grund: ReturnType<typeof leerGrund>;
  onFilterAbschalten: () => void;
}) {
  const { t } = useTranslation();
  const text =
    grund === 'gruppenfilter'
      ? t('schedule.tagLeerGruppenfilter')
      : grund === 'gueltigkeitszeitraum'
        ? t('schedule.tagLeerZeitraum')
        : t('schedule.tagLeerOhneTermine');

  return (
    <MessageView
      symbol="—"
      title={t('schedule.tagLeerTitel')}
      body={text}
      style={styles.hinweisFlaeche}
      action={
        grund === 'ohneTermine' ? undefined : (
          <AppButton
            variant="secondary"
            label={t('schedule.filterAlleAnzeigenAktion')}
            onPress={onFilterAbschalten}
          />
        )
      }
    />
  );
}

/**
 * Requirements „Proportionale Zeitachse", „Nebeneinanderdarstellung
 * überschneidender Termine" und „Hervorhebung des laufenden Termins und der
 * aktuellen Uhrzeit". Die Slots kommen unverändert aus `dayLayout.layoutTag`;
 * hier wird allein auf Pixel umgerechnet.
 */
function Zeitachse({
  slots,
  spanne,
  konflikte,
  jetztMin,
  onOeffne,
}: {
  slots: readonly DaySlot[];
  spanne: { vonMin: number; bisMin: number };
  konflikte: Konflikte;
  jetztMin: number | null;
  onOeffne: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const hoehe = (spanne.bisMin - spanne.vonMin) * DP_JE_MINUTE;
  const uhrzeitSichtbar = jetztMin !== null && jetztMin >= spanne.vonMin && jetztMin <= spanne.bisMin;

  return (
    <View style={[styles.achse, { height: hoehe }]}>
      {slots.map((slot, index) =>
        slot.art === 'luecke' ? (
          <View
            key={`luecke-${index}`}
            accessibilityRole="text"
            accessibilityLabel={t('schedule.lueckeLabel', {
              dauer: dauerText(slot.bisMin - slot.vonMin, t),
              von: formatZeit(slot.vonMin),
              bis: formatZeit(slot.bisMin),
            })}
            style={[
              styles.luecke,
              {
                top: (slot.vonMin - spanne.vonMin) * DP_JE_MINUTE,
                height: (slot.bisMin - slot.vonMin) * DP_JE_MINUTE,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>
              {t('schedule.luecke', { dauer: dauerText(slot.bisMin - slot.vonMin, t) })}
            </Text>
          </View>
        ) : (
          <View
            key={slot.entry.id}
            style={[
              styles.terminPlatz,
              {
                top: (slot.entry.timeBeginMin - spanne.vonMin) * DP_JE_MINUTE,
                height: (slot.entry.timeEndMin - slot.entry.timeBeginMin) * DP_JE_MINUTE,
                left: `${(slot.spalte / slot.spalten) * 100}%`,
                width: `${(1 / slot.spalten) * 100}%`,
              },
            ]}
          >
            <TerminKachel
              entry={slot.entry}
              konflikte={konflikte}
              laeuft={
                jetztMin !== null &&
                slot.entry.timeBeginMin <= jetztMin &&
                jetztMin < slot.entry.timeEndMin
              }
              onOeffne={onOeffne}
            />
          </View>
        ),
      )}

      {uhrzeitSichtbar ? (
        <View
          accessibilityRole="text"
          accessibilityLabel={t('schedule.aktuelleUhrzeit', { zeit: formatZeit(jetztMin!) })}
          style={[
            styles.uhrzeitMarke,
            { top: (jetztMin! - spanne.vonMin) * DP_JE_MINUTE, backgroundColor: colors.danger },
          ]}
        />
      ) : null}
    </View>
  );
}

/** Requirement „Abschalten der proportionalen Zeitachse": kompakte Liste ohne Lückendarstellung. */
function KompakteListe({
  termine,
  konflikte,
  onOeffne,
}: {
  termine: readonly PlanEntry[];
  konflikte: Konflikte;
  onOeffne: (id: string) => void;
}) {
  return (
    <View style={styles.liste}>
      {termine.map((entry) => (
        <TerminKachel key={entry.id} entry={entry} konflikte={konflikte} laeuft={false} onOeffne={onOeffne} />
      ))}
    </View>
  );
}

/**
 * Ein Termin im Plan. Trägt alle Kennzeichnungen, die die Anforderungen
 * verlangen — eigen, vorgemerkt, gruppenfremd, Prüfung, Konflikthinweis und
 * angenommener Konflikt —, jede zusätzlich zur Farbe als Text oder Symbol
 * (UX-F-070). Die Beschriftungsfarbe kommt aus `farbe.ts` und hält damit den
 * Mindestkontrast 4,5:1 ein (UX-N-010).
 */
export function TerminKachel({
  entry,
  konflikte,
  laeuft,
  onOeffne,
}: {
  entry: PlanEntry;
  konflikte: Konflikte;
  laeuft: boolean;
  onOeffne: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const textfarbe = textfarbeFuerHintergrund(entry.color);

  const kennzeichen: string[] = [];
  if (entry.kind === 'eigen') kennzeichen.push(t('schedule.kennzeichenEigen'));
  if (entry.status === 'vorgemerkt') kennzeichen.push(t('schedule.kennzeichenVorgemerkt'));
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

/** Die Schalter der Wochenansicht, einschließlich „alle Filter abschalten". */
function Filterleiste({
  zeitachse,
  gruppenfremdeAusblenden,
  alleAnzeigen,
  onZeitachse,
  onGruppenfremde,
  onAlleAnzeigen,
}: {
  zeitachse: boolean;
  gruppenfremdeAusblenden: boolean;
  alleAnzeigen: boolean;
  onZeitachse: () => void;
  onGruppenfremde: () => void;
  onAlleAnzeigen: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.filter, { borderColor: colors.border }]}>
      <SchalterZeile
        label={t('schedule.filterAlleAnzeigen')}
        wert={alleAnzeigen}
        onChange={onAlleAnzeigen}
        hinweis={alleAnzeigen ? t('schedule.filterAlleAnzeigenAktiv') : undefined}
      />
      <SchalterZeile
        label={t('schedule.filterGruppenfremdeAusblenden')}
        wert={gruppenfremdeAusblenden}
        onChange={onGruppenfremde}
      />
      <SchalterZeile label={t('schedule.filterZeitachse')} wert={zeitachse} onChange={onZeitachse} />
    </View>
  );
}

function SchalterZeile({
  label,
  wert,
  onChange,
  hinweis,
}: {
  label: string;
  wert: boolean;
  onChange: () => void;
  hinweis?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.schalterZeile}>
      <View style={styles.schalterText}>
        <Text style={{ color: colors.text }}>{label}</Text>
        {hinweis ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>{hinweis}</Text> : null}
      </View>
      <Switch accessibilityLabel={label} value={wert} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  inhalt: { gap: 12 },
  einrichtungLink: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  banner: { padding: 12, borderRadius: 8, gap: 8 },
  bannerAktionen: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  jetzt: { borderWidth: 1, borderRadius: 8, padding: 10, gap: 2 },
  wochenkopf: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blaettern: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  wochenText: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  leiste: { gap: 8, paddingVertical: 4 },
  tagChip: {
    minWidth: 64,
    minHeight: 60,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // UX-F-070: Der gewählte Tag ist zusätzlich zur Farbfläche an der dickeren
  // unteren Kante erkennbar — die Auswahl hängt nicht allein an der Farbe.
  tagChipAktiv: { borderBottomWidth: 4 },
  hinweisFlaeche: { flexGrow: 0, paddingVertical: 32 },
  achse: { position: 'relative', marginTop: 4 },
  luecke: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminPlatz: { position: 'absolute', paddingRight: 4 },
  uhrzeitMarke: { position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1 },
  liste: { gap: 8 },
  kachel: { flex: 1, minHeight: 44, borderRadius: 8, padding: 8, gap: 2, justifyContent: 'flex-start' },
  kachelPruefung: { borderLeftWidth: 6 },
  kachelZeit: { fontSize: 12, fontWeight: '600' },
  kachelTitel: { fontSize: 14, fontWeight: '700' },
  kachelZeile: { fontSize: 12 },
  filter: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 },
  schalterZeile: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 },
  schalterText: { flex: 1 },
});
