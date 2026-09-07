import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { useConsent } from '@/consent/ConsentProvider';
import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import {
  apiSprache,
  speiseplanQueryOptions,
  useMensen,
  useSpeisepläne,
  type Gericht,
  type Mensa,
} from '../api';
import { konsolidiere, type KonsolidiertesGericht } from '../consolidate';
import { useFavorites } from '../favorites';
import { useGerichtFilter } from '../filter';
import { useSortierGruppierung } from '../sortierPreset';
import { wendeAn, type SortierKontext } from '../sortierung';
import {
  benachrichtigungBerechtigungAnfragen,
  benachrichtigungErlaubt,
} from '../notifications';
import { preisFuer, preisText } from '../preise';
import { usePriceGroup, type PriceGroup } from '../priceGroup';
import {
  fuehreLieblingsgerichtAbgleichAus,
  lieblingsgerichtAbgleichRegistrieren,
  nachholenBeimAppStart,
} from '../registerBackgroundTask';
import { useCanteenSelection } from '../selection';
import { AnkerListe } from '../ui/AnkerListe';
import { wischRichtung } from '../gesten';
import { isoHeute, naechsterTag, verschiebe } from '../tageswahl';

// MENSA: Tages-Speiseplan als eine über die gewählten Mensen zusammengefasste
// Gerichtsliste (MENSA-F-012 ff.). Abschnitte und Gerichte-Reihenfolge folgen
// dem aktiven Sortier-/Gruppierpreset (`sortierung.ts` / `sortierPreset.ts`,
// Requirements „Wahl der Gruppierung" ff.); die maßgebliche Mensa bleibt an die
// Auswahlreihenfolge gebunden. Blättern über die Datumsauswahl (MENSA-F-045) und
// Wischen (MENSA-F-046), begrenzt auf heute und Folgetage (MENSA-F-042),
// Wochenenden ohne Angebot übersprungen (MENSA-F-044). Herunterziehen lädt neu
// (MENSA-F-240). Der Stern-Merker (MENSA-F-080, in der Spec entfallen) bleibt
// bewusst bis Roadmap-Schritt 9 im Code — siehe canteen/spec.md „Umsetzungsstand".

export function CanteenScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sprache = apiSprache(i18n.language);
  const { ids, loaded } = useCanteenSelection();
  const { mensen } = useMensen();
  const [datum, setDatum] = useState(isoHeute);

  useEffect(() => {
    void nachholenBeimAppStart();
  }, []);

  // Nachbartage vorab laden, damit das Überspringen leerer Wochenenden
  // (MENSA-F-044) gegen echten Bestand entscheidet statt „unbekannt".
  useEffect(() => {
    if (ids.length === 0) return;
    for (const tag of [verschiebe(datum, 1), verschiebe(datum, 2)]) {
      for (const id of ids) {
        void queryClient.prefetchQuery(speiseplanQueryOptions(id, tag, sprache));
      }
    }
  }, [datum, ids, sprache, queryClient]);

  const hatAngebot = (tag: string): boolean | undefined => {
    let bekannt = false;
    for (const id of ids) {
      const daten = queryClient.getQueryData<{ gerichte: Gericht[] }>([
        'speiseplan',
        id,
        tag,
        sprache,
      ]);
      if (daten === undefined) continue;
      bekannt = true;
      if (daten.gerichte.length > 0) return true;
    }
    return bekannt ? false : undefined;
  };

  const blaettern = (richtung: -1 | 1) => {
    const ziel = naechsterTag(datum, richtung, hatAngebot);
    if (ziel) setDatum(ziel);
  };

  if (!loaded) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (ids.length === 0) {
    return (
      <Screen center>
        <MessageView
          symbol="—"
          title={t('mensa.keineMensaTitel')}
          body={t('mensa.keineMensaHinweis')}
          action={
            <View style={styles.leerAktionen}>
              <AppButton
                label={t('mensa.mensenWaehlen')}
                onPress={() => router.push('/canteen/auswahl')}
              />
              <AppButton
                variant="secondary"
                label={t('mensa.alleMensenAnzeigen')}
                onPress={() => router.push(`/canteen/alle?datum=${datum}`)}
              />
            </View>
          }
        />
      </Screen>
    );
  }

  const amAnfang = datum <= isoHeute();

  return (
    <Screen tight>
      {/* MENSA-F-280: Datumsauswahl mittig; der Filterzugang sitzt in der
          Kopfzeile (app/(tabs)/canteen/_layout.tsx), nicht hier. */}
      <View style={styles.kopf}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mensa.tagZurueck')}
          accessibilityState={{ disabled: amAnfang }}
          disabled={amAnfang}
          onPress={() => blaettern(-1)}
          style={styles.pfeil}
        >
          <Text style={[styles.pfeilGlyph, { color: amAnfang ? colors.border : colors.text }]}>◀</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={amAnfang ? formatDatum(datum, t) : t('mensa.zuHeuteHinweis')}
          accessibilityState={{ disabled: amAnfang }}
          disabled={amAnfang}
          onPress={() => setDatum(isoHeute())}
          style={styles.datumFeld}
        >
          <Text style={[styles.datum, { color: colors.text }]}>{formatDatum(datum, t)}</Text>
          {!amAnfang ? (
            <Text style={[styles.zuHeute, { color: colors.accent }]}>{t('mensa.zuHeute')}</Text>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mensa.tagVor')}
          onPress={() => blaettern(1)}
          style={styles.pfeil}
        >
          <Text style={[styles.pfeilGlyph, { color: colors.text }]}>▶</Text>
        </Pressable>
      </View>

      <MensaListe ids={ids} datum={datum} mensen={mensen} onBlaettern={blaettern} />
    </Screen>
  );
}

function MensaListe({
  ids,
  datum,
  mensen,
  onBlaettern,
}: {
  ids: string[];
  datum: string;
  mensen: Mensa[];
  onBlaettern: (richtung: -1 | 1) => void;
}) {
  const { t } = useTranslation();
  const ergebnisse = useSpeisepläne(ids, datum);

  const proMensa = ids.map((id, i) => ({
    mensaId: id,
    gerichte: ergebnisse[i]?.data?.gerichte ?? [],
  }));

  const irgendwasGeladen = ergebnisse.some((r) => r.data !== undefined);
  const aktualisierteMs = ergebnisse
    .filter((r) => r.data !== undefined && r.dataUpdatedAt > 0)
    .map((r) => r.dataUpdatedAt);

  const aggregat: QueryLike<{ proMensa: typeof proMensa }> = {
    data: irgendwasGeladen ? { proMensa } : undefined,
    isPending: ergebnisse.every((r) => r.isPending),
    isError: ergebnisse.every((r) => r.isError) && !irgendwasGeladen,
    isFetching: ergebnisse.some((r) => r.isFetching),
    isStale: ergebnisse.some((r) => r.isStale),
    error: ergebnisse.find((r) => r.isError)?.error ?? null,
    dataUpdatedAt: aktualisierteMs.length > 0 ? Math.min(...aktualisierteMs) : 0,
    refetch: () => Promise.all(ergebnisse.map((r) => r.refetch())),
  };

  return (
    <AsyncStates
      query={aggregat}
      isEmpty={() => false}
      emptyNextStep={t('mensa.keinAngebotHinweis')}
    >
      {(data) => (
        <GerichtListe
          proMensa={data.proMensa}
          datum={datum}
          mensen={mensen}
          onBlaettern={onBlaettern}
          onAktualisieren={() => void aggregat.refetch()}
          aktualisiertGerade={aggregat.isFetching}
        />
      )}
    </AsyncStates>
  );
}

function GerichtListe({
  proMensa,
  datum,
  mensen,
  onBlaettern,
  onAktualisieren,
  aktualisiertGerade,
}: {
  proMensa: { mensaId: string; gerichte: Gericht[] }[];
  datum: string;
  mensen: Mensa[];
  onBlaettern: (richtung: -1 | 1) => void;
  onAktualisieren: () => void;
  aktualisiertGerade: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const favorites = useFavorites();
  const consent = useConsent();
  const { group } = usePriceGroup();
  const { betroffen } = useGerichtFilter();
  const { aktiv: preset } = useSortierGruppierung();

  const nameVon = useMemo(() => {
    const map = new Map(mensen.map((m) => [m.id, m.name]));
    return (id: string) => map.get(id) ?? id;
  }, [mensen]);

  const konsolidierung = useMemo(() => konsolidiere(proMensa), [proMensa]);
  const geschlossene = konsolidierung.geschlossene;
  const ids = proMensa.map((p) => p.mensaId);

  // Sortier-/Gruppiermodell (Requirements „Wahl der Gruppierung" ff.): die
  // Abschnitte folgen dem aktiven Preset statt der festen Mensa-Gliederung. Die
  // maßgebliche Mensa bleibt an die Auswahlreihenfolge gebunden. Der
  // Bewertungs-Resolver liefert bis Roadmap-Schritt 9 immer `undefined` (D4).
  const kontext: SortierKontext = {
    preisGruppe: group,
    mensaReihenfolge: ids,
    mensaName: nameVon,
    sprache: i18n.language,
    bewertung: () => undefined,
  };
  const struktur = wendeAn(preset, konsolidierung, kontext);
  const hatGerichte = struktur.abschnitte.some((a) => a.gerichte.length > 0);

  // Ernährungsfilter (MENSA-F-190/F-200): betroffene Gerichte ausblenden, zählen.
  const gefiltert = (() => {
    let ausgeblendet = 0;
    const abschnitte = struktur.abschnitte
      .map((a) => {
        const sichtbar = a.gerichte.filter((e) => !betroffen(e.massgeblich));
        ausgeblendet += a.gerichte.length - sichtbar.length;
        return { ...a, gerichte: sichtbar };
      })
      .filter((a) => a.gerichte.length > 0);
    return { abschnitte, ausgeblendet };
  })();

  const sichtbareIds = new Set(gefiltert.abschnitte.map((a) => a.id));
  const mehrereAbschnitte = gefiltert.abschnitte.length > 1;
  // Chip-Leiste (Requirement „Chip-Leiste zeigt Gruppen der aktiven Gruppierung"):
  // die Gruppen der aktiven Gruppierung in Gruppenreihenfolge; ohne Gruppierung
  // keine Chips. Eine Gruppe ohne sichtbaren Abschnitt — geschlossen oder ganz
  // weggefiltert — ist nicht auswählbar (Requirement „Nicht auswählbare Chips …").
  const chips = !struktur.gruppierungAktiv
    ? []
    : preset.gruppierung === 'mensa'
      ? [
          ...struktur.abschnitte.map((a) => ({
            id: a.id,
            titel: nameVon(a.id),
            deaktiviert: !sichtbareIds.has(a.id),
          })),
          ...ids
            .filter((id) => !struktur.abschnitte.some((a) => a.id === id))
            .map((id) => ({ id, titel: nameVon(id), deaktiviert: true })),
        ]
      : struktur.abschnitte.map((a) => ({
          id: a.id,
          titel: a.titel ?? t('mensa.sammelgruppe'),
          deaktiviert: !sichtbareIds.has(a.id),
        }));

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        const richtung = wischRichtung(g.dx);
        if (richtung !== 0) onBlaettern(richtung);
      },
    }),
  ).current;

  // MENSA-F-290: für eine Mensa ohne Angebot am Tag keine Öffnungszeit-Zeile —
  // sie steht dann allein im Geschlossen-Hinweis (MENSA-F-049).
  const oeffnungszeilen = proMensa
    .filter((p) => !geschlossene.includes(p.mensaId))
    .map((p) => {
      const zeit = oeffnungszeitFuer(
        mensen.find((m) => m.id === p.mensaId),
        datum,
      );
      return zeit ? t('mensa.oeffnungszeitMensa', { mensa: nameVon(p.mensaId), zeit }) : null;
    })
    .filter((z): z is string => z !== null);

  const fuss = (
    <View style={styles.fuss}>
      {oeffnungszeilen.map((z) => (
        <Text key={z} style={[styles.fussZeile, { color: colors.textMuted }]}>
          {z}
        </Text>
      ))}
      {gefiltert.ausgeblendet > 0 ? (
        <Text style={[styles.fussZeile, { color: colors.textMuted }]}>
          {t('mensa.ausgeblendet', { count: gefiltert.ausgeblendet })}
        </Text>
      ) : null}
      {geschlossene.map((id) => (
        <Text key={id} style={[styles.fussZeile, { color: colors.textMuted }]}>
          {t('mensa.geschlossenHeute', { mensa: nameVon(id) })}
        </Text>
      ))}
      <View style={styles.fussAktion}>
        <AlleMensenKnopf datum={datum} />
      </View>
    </View>
  );

  const refreshControl = (
    <RefreshControl refreshing={aktualisiertGerade} onRefresh={onAktualisieren} />
  );

  // Alle Gerichte durch den Filter ausgeblendet — eigener Leerzustand (Abschnitt 7).
  if (hatGerichte && gefiltert.abschnitte.length === 0 && gefiltert.ausgeblendet > 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.liste}
        refreshControl={refreshControl}
        {...swipe.panHandlers}
      >
        <MessageView
          symbol="⚗"
          title={t('mensa.alleAusgeblendetTitel')}
          body={t('mensa.alleAusgeblendetHinweis')}
        />
        {fuss}
      </ScrollView>
    );
  }

  // Keine der gewählten Mensen führt ein Angebot.
  if (!hatGerichte) {
    return (
      <ScrollView
        contentContainerStyle={styles.liste}
        refreshControl={refreshControl}
        {...swipe.panHandlers}
      >
        <MessageView
          symbol="—"
          title={t('mensa.keinAngebotTitel')}
          body={t('mensa.keinAngebotHinweis')}
        />
        {fuss}
      </ScrollView>
    );
  }

  async function markiere(gericht: KonsolidiertesGericht) {
    if (!consent.personalDataAllowed) {
      Alert.alert(t('consent.requiredTitle'), t('consent.requiredBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('consent.reviewNow'), onPress: () => void consent.accept() },
      ]);
      return;
    }

    const wirdMarkiert = !favorites.has(gericht.schluessel);
    favorites.toggle({
      schluessel: gericht.schluessel,
      bezeichnung: gericht.massgeblich.bezeichnung,
    });

    if (wirdMarkiert) {
      const schonErlaubt = await benachrichtigungErlaubt();
      const erlaubt = schonErlaubt || (await benachrichtigungBerechtigungAnfragen());
      if (!erlaubt) {
        Alert.alert(t('mensa.benachrichtigungAusTitel'), t('mensa.benachrichtigungAusHinweis'));
      } else {
        await lieblingsgerichtAbgleichRegistrieren();
        void fuehreLieblingsgerichtAbgleichAus();
      }
    }
  }

  return (
    <AnkerListe
      chips={chips}
      contentContainerStyle={styles.liste}
      scrollProps={{
        refreshControl,
        showsVerticalScrollIndicator: false,
        ...swipe.panHandlers,
      }}
      fuss={fuss}
      abschnitte={gefiltert.abschnitte.map((abschnitt) => ({
        id: abschnitt.id,
        inhalt: (
          <View style={styles.sektion}>
            {struktur.gruppierungAktiv && mehrereAbschnitte && abschnitt.titel ? (
              <Text style={[styles.sektionTitel, { color: colors.text }]}>{abschnitt.titel}</Text>
            ) : null}
            {abschnitt.gerichte.map((g) => (
              <GerichtKarte
                key={g.schluessel}
                eintrag={g}
                zeigeAnbieter={g.anbieter.length > 1}
                nameVon={nameVon}
                group={group}
                favorit={favorites.has(g.schluessel)}
                onStern={() => void markiere(g)}
              />
            ))}
          </View>
        ),
      }))}
    />
  );
}

function GerichtKarte({
  eintrag,
  zeigeAnbieter,
  nameVon,
  group,
  favorit,
  onStern,
}: {
  eintrag: KonsolidiertesGericht;
  zeigeAnbieter: boolean;
  nameVon: (id: string) => string;
  group: PriceGroup;
  favorit: boolean;
  onStern: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const g = eintrag.massgeblich;

  return (
    <View
      style={[
        styles.karte,
        { borderColor: colors.border },
        favorit && { backgroundColor: colors.surface },
      ]}
    >
      <View style={styles.kartekopf}>
        <Text style={[styles.bezeichnung, { color: colors.text }]}>{g.bezeichnung}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: favorit }}
          accessibilityLabel={favorit ? t('mensa.lieblingEntfernen') : t('mensa.lieblingMarkieren')}
          onPress={onStern}
          style={styles.stern}
        >
          <Text style={{ color: favorit ? colors.accent : colors.textMuted, fontSize: 20 }}>
            {favorit ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      {zeigeAnbieter ? (
        <Text style={[styles.anbieter, { color: colors.textMuted }]}>
          {t('mensa.angebotIn', { mensen: eintrag.anbieter.map(nameVon).join(', ') })}
        </Text>
      ) : null}

      {g.kennzeichnungen && g.kennzeichnungen.length > 0 ? (
        <Text style={[styles.kennzeichnungen, { color: colors.textMuted }]}>
          {g.kennzeichnungen.join(' · ')}
        </Text>
      ) : null}

      <Text style={[styles.preise, { color: colors.text }]}>
        {t('mensa.preisEinzeln', {
          gruppe: t(`priceGroup.${group}`),
          preis: preisText(preisFuer(g, group)),
        })}
      </Text>

      {g.zusatzstoffe && g.zusatzstoffe.length > 0 ? (
        <Text style={[styles.zusatzstoffe, { color: colors.textMuted }]}>
          {t('mensa.zusatzstoffe', { liste: g.zusatzstoffe.join(', ') })}
        </Text>
      ) : null}
    </View>
  );
}

function AlleMensenKnopf({ datum }: { datum: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <AppButton
      variant="secondary"
      label={t('mensa.alleMensenAnzeigen')}
      onPress={() => router.push(`/canteen/alle?datum=${datum}`)}
    />
  );
}

// -------------------------------------------------------------------- Helfer

function oeffnungszeitFuer(mensa: Mensa | undefined, datum: string): string | null {
  const zeiten = mensa?.oeffnungszeiten;
  if (!zeiten || zeiten.length < 5) return null;
  const [y, m, d] = datum.split('-').map(Number);
  const wochentag = new Date(y!, m! - 1, d!).getDay();
  if (wochentag === 0 || wochentag === 6) return null;
  return zeiten[wochentag - 1] ?? null;
}

function formatDatum(datum: string, t: TFunction): string {
  const [y, m, d] = datum.split('-').map(Number);
  const wd = new Date(y!, m! - 1, d!).getDay();
  return `${t(`mensa.weekday.${wd}`)}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

const styles = StyleSheet.create({
  kopf: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pfeil: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pfeilGlyph: { fontSize: 18 },
  datumFeld: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  datum: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  zuHeute: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  leerAktionen: { gap: 8 },
  liste: { gap: 16, paddingBottom: 24 },
  sektion: { gap: 10 },
  sektionTitel: { fontSize: 17, fontWeight: '700' },
  karte: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  kartekopf: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  bezeichnung: { fontSize: 15, fontWeight: '600', flex: 1 },
  stern: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  anbieter: { fontSize: 13 },
  kennzeichnungen: { fontSize: 13 },
  preise: { fontSize: 14 },
  zusatzstoffe: { fontSize: 12 },
  fuss: { gap: 6, paddingTop: 4 },
  fussZeile: { fontSize: 13 },
  fussAktion: { marginTop: 8 },
});
