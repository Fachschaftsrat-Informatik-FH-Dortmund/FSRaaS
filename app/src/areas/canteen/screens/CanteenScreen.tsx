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
import { oeffnungszeitFuer } from '../oeffnungszeiten';
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
    naechsteOeffnung: ergebnisse[i]?.data?.naechsteOeffnung ?? null,
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
  proMensa: { mensaId: string; gerichte: Gericht[]; naechsteOeffnung: string | null }[];
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
  const nurEineMensa = ids.length === 1;
  // Wiedereröffnungshinweis (Requirement „Wiedereröffnungshinweis an der
  // geschlossenen Mensa"): das Backend liefert `naechsteOeffnung` je Mensa
  // bereits mit dem Tages-Speiseplan (api.ts, SpeiseplanStore.TagAsync).
  const naechsteOeffnungVon = useMemo(
    () => new Map(proMensa.map((p) => [p.mensaId, p.naechsteOeffnung])),
    [proMensa],
  );

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
  const mensaGruppierung = struktur.gruppierungAktiv && preset.gruppierung === 'mensa';
  const hatGerichte = struktur.abschnitte.some((a) => a.gerichte.length > 0);

  // Ernährungsfilter je Abschnitt auswerten (MENSA-F-190/F-200) und den
  // Anzeigezustand jedes Abschnitts nach der Tabelle in design.md D3 bestimmen:
  // ein leerer Gerichte-Abschnitt wird bei Mensa-Gruppierung zum
  // Filter-Hinweis-Abschnitt, sonst entfällt er; ein geschlossener Abschnitt
  // bleibt immer erhalten. Die reine Sortierlogik erfährt nichts von Filtern.
  let ausgeblendet = 0;
  const angezeigte: {
    id: string;
    titel: string | null;
    art: 'gerichte' | 'geschlossen' | 'gefiltert';
    gerichte: KonsolidiertesGericht[];
  }[] = [];
  for (const a of struktur.abschnitte) {
    if (a.zustand === 'geschlossen') {
      angezeigte.push({ id: a.id, titel: a.titel, art: 'geschlossen', gerichte: [] });
      continue;
    }
    const sichtbar = a.gerichte.filter((e) => !betroffen(e.massgeblich));
    ausgeblendet += a.gerichte.length - sichtbar.length;
    if (sichtbar.length > 0) {
      angezeigte.push({ id: a.id, titel: a.titel, art: 'gerichte', gerichte: sichtbar });
    } else if (mensaGruppierung) {
      angezeigte.push({ id: a.id, titel: a.titel, art: 'gefiltert', gerichte: [] });
    }
  }

  const sichtbareIds = new Set(angezeigte.map((a) => a.id));
  const mehrereAbschnitte = angezeigte.length > 1;
  // Chip-Leiste (Requirement „Chip-Leiste zeigt Gruppen der aktiven Gruppierung"):
  // die Gruppen der aktiven Gruppierung in Gruppenreihenfolge; ohne Gruppierung
  // keine Chips. Bei Mensa-Gruppierung führt jede gewählte Mensa einen Abschnitt
  // — mit Angebot, Geschlossen- oder Filter-Hinweis —, ihr Chip ist damit stets
  // auswählbar; nicht auswählbar bleibt nur eine Gruppe ohne eigenen Abschnitt,
  // was künftig allein die Kategorie-Gruppierung betrifft (Requirement „Nicht
  // auswählbare Chips ohne sichtbaren Abschnitt").
  const chips = !struktur.gruppierungAktiv
    ? []
    : mensaGruppierung
      ? struktur.abschnitte.map((a) => ({
          id: a.id,
          titel: nameVon(a.id),
          deaktiviert: !sichtbareIds.has(a.id),
        }))
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

  // Öffnungszeit-Zeilen und Geschlossen-Zeilen erscheinen im Fußbereich nur noch,
  // wenn die Gruppierung nicht „nach Mensa" ist — bei Mensa-Gruppierung tragen
  // die Abschnittsüberschriften die Öffnungszeit und die geschlossenen Abschnitte
  // den Geschlossen-Hinweis (design.md D5, Requirements „Öffnungszeit an der
  // Mensa-Abschnittsüberschrift" / „Geschlossen-Hinweis für Mensa ohne Angebot").
  // Führt am Tag keine gewählte Mensa ein Angebot, entstehen gar keine
  // Abschnitte (design.md D4, Leerzustand „Heute kein Angebot") — dann trägt der
  // Fußbereich den vollen Kontext, unabhängig von der Gruppierung.
  // Für eine Mensa ohne Angebot am Tag ohnehin keine Öffnungszeit (MENSA-F-290).
  const mensaAbschnitteAktiv = mensaGruppierung && hatGerichte;
  const oeffnungszeilen = mensaAbschnitteAktiv
    ? []
    : proMensa
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
      {ausgeblendet > 0 ? (
        <Text style={[styles.fussZeile, { color: colors.textMuted }]}>
          {t('mensa.ausgeblendet', { count: ausgeblendet })}
        </Text>
      ) : null}
      {!mensaAbschnitteAktiv
        ? geschlossene.map((id) => (
            <Text key={id} style={[styles.fussZeile, { color: colors.textMuted }]}>
              {t('mensa.geschlossenHeute', { mensa: nameVon(id) })}
            </Text>
          ))
        : null}
      <View style={styles.fussAktion}>
        <AlleMensenKnopf datum={datum} />
      </View>
    </View>
  );

  const refreshControl = (
    <RefreshControl refreshing={aktualisiertGerade} onRefresh={onAktualisieren} />
  );

  // Alle Gerichte durch den Filter ausgeblendet und kein Abschnitt bleibt stehen
  // — eigener Leerzustand (Abschnitt 7). Bei Mensa-Gruppierung tritt dieser Fall
  // nicht ein: dort behält jede Mensa mit Angebot ihren Abschnitt als
  // Filter-Hinweis (design.md D3).
  if (hatGerichte && angezeigte.length === 0 && ausgeblendet > 0) {
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

  // Keine der gewählten Mensen führt ein Angebot: der querschnittliche
  // Leerzustand „Heute kein Angebot" (Capability `architecture`), nicht eine
  // Liste aus lauter Geschlossen-Abschnitten (design.md D4).
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
      abschnitte={angezeigte.map((abschnitt) => {
        // Öffnungszeit an der Überschrift nur bei Mensa-Gruppierung und nur für
        // eine Mensa mit Angebot bzw. vollständig gefilterte Mensa — nie für eine
        // geschlossene (design.md D5, Requirement „Keine Öffnungszeit für Mensa
        // ohne Angebot"). Die Abschnitts-Kennung ist bei Mensa-Gruppierung die
        // Mensa-Kennung.
        const zeit =
          mensaGruppierung && abschnitt.art !== 'geschlossen'
            ? oeffnungszeitFuer(
                mensen.find((m) => m.id === abschnitt.id),
                datum,
              )
            : null;
        // Überschrift: bei Mensa-Gruppierung immer (auch bei nur einem Abschnitt,
        // D6); sonst wie bisher nur bei mehreren Abschnitten mit Titel.
        const zeigeKopf = mensaGruppierung
          ? true
          : struktur.gruppierungAktiv && mehrereAbschnitte && abschnitt.titel != null;
        const kopfName = mensaGruppierung ? nameVon(abschnitt.id) : abschnitt.titel;
        const wieder =
          abschnitt.art === 'geschlossen' ? (naechsteOeffnungVon.get(abschnitt.id) ?? null) : null;
        return {
          id: abschnitt.id,
          inhalt: (
            <View style={styles.sektion}>
              {zeigeKopf && kopfName != null ? (
                <View style={styles.sektionKopf}>
                  <Text style={[styles.sektionTitel, { color: colors.text }]}>{kopfName}</Text>
                  {zeit ? (
                    <Text
                      style={[
                        styles.oeffnungPille,
                        { color: colors.text, backgroundColor: colors.surface },
                      ]}
                    >
                      {t('mensa.oeffnungszeit', { zeit })}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {abschnitt.art === 'geschlossen' ? (
                <Text style={[styles.hinweisZeile, { color: colors.textMuted }]}>
                  {t('mensa.geschlossenHeute', { mensa: nameVon(abschnitt.id) })}
                  {wieder != null ? ` ${formatWiedereroeffnung(wieder, datum, t)}` : ''}
                </Text>
              ) : null}
              {abschnitt.art === 'gefiltert' ? (
                <Text style={[styles.hinweisZeile, { color: colors.textMuted }]}>
                  {t('mensa.mensaGefiltert')}
                </Text>
              ) : null}
              {abschnitt.gerichte.map((g) => (
                <GerichtKarte
                  key={g.schluessel}
                  eintrag={g}
                  zeigeAnbieter={mensaGruppierung ? g.anbieter.length > 1 : !nurEineMensa}
                  nameVon={nameVon}
                  group={group}
                  favorit={favorites.has(g.schluessel)}
                  onStern={() => void markiere(g)}
                />
              ))}
            </View>
          ),
        };
      })}
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

function formatDatum(datum: string, t: TFunction): string {
  const [y, m, d] = datum.split('-').map(Number);
  const wd = new Date(y!, m! - 1, d!).getDay();
  return `${t(`mensa.weekday.${wd}`)}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

/**
 * Wiedereröffnungshinweis (Requirement „Wiedereröffnungshinweis an der
 * geschlossenen Mensa", design.md D3): der Wochentag des ermittelten Tages,
 * ergänzt um das Datum in Kurzform, wenn der Tag mehr als sechs Tage vom
 * angezeigten Tag entfernt liegt — sonst wäre „Montag" mit dem nächsten oder
 * übernächsten Montag zu verwechseln.
 */
function formatWiedereroeffnung(naechsteOeffnung: string, datum: string, t: TFunction): string {
  const [y, m, d] = naechsteOeffnung.split('-').map(Number);
  const wd = new Date(y!, m! - 1, d!).getDay();
  const basis = t('mensa.wiederGeoeffnet', { tag: t(`mensa.weekday.${wd}`) });
  if (tageDifferenz(datum, naechsteOeffnung) <= 6) return basis;
  const kurzdatum = `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
  return `${basis} ${t('mensa.wiederGeoeffnetDatum', { datum: kurzdatum })}`;
}

/** Anzahl ganzer Tage zwischen zwei ISO-Datumsangaben (`bis` − `von`). */
function tageDifferenz(von: string, bis: string): number {
  const [y1, m1, d1] = von.split('-').map(Number);
  const [y2, m2, d2] = bis.split('-').map(Number);
  const t1 = Date.UTC(y1!, m1! - 1, d1!);
  const t2 = Date.UTC(y2!, m2! - 1, d2!);
  return Math.round((t2 - t1) / 86_400_000);
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
  // Kopfzeile je Abschnitt: Name und Öffnungszeit-Angabe in einer Zeile, die auf
  // schmalen Geräten umbricht, statt den Namen abzuschneiden (design.md D5).
  sektionKopf: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  sektionTitel: { fontSize: 17, fontWeight: '700' },
  // Zurückgenommen über Schriftgröße und Pille, nicht über blassen Text:
  // `colors.text` auf `colors.surface` hält den Mindestkontrast 4,5:1 (D5).
  oeffnungPille: {
    fontSize: 12,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  hinweisZeile: { fontSize: 13 },
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
