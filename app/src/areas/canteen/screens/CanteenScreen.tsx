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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { useConsent } from '@/consent/ConsentProvider';
import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import {
  useMensen,
  useOeffnungsangaben,
  useSpeisepläne,
  type Gericht,
  type Mensa,
  type Oeffnungsangaben,
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
import { AnkerListe } from '@/ui/AnkerListe';
import { wischRichtung } from '../gesten';
import {
  ausgabezeitFuer,
  istGeoeffnet,
  oeffnungszeitFuer,
  schliessungFuer,
} from '../oeffnungszeiten';
import { isoHeute, naechsterTag } from '../tageswahl';

// MENSA: Tages-Speiseplan als eine über die gewählten Mensen zusammengefasste
// Gerichtsliste (MENSA-F-012 ff.). Abschnitte und Gerichte-Reihenfolge folgen
// dem aktiven Sortier-/Gruppierpreset (`sortierung.ts` / `sortierPreset.ts`,
// Requirements „Wahl der Gruppierung" ff.); die maßgebliche Mensa bleibt an die
// Auswahlreihenfolge gebunden. Blättern über die Datumsauswahl (MENSA-F-045) und
// Wischen (MENSA-F-046), begrenzt auf heute und Folgetage (MENSA-F-042),
// geschlossene Wochenendtage übersprungen (Requirement „Überspringen
// geschlossener Wochenendtage"). Herunterziehen lädt neu (MENSA-F-240). Der
// Stern-Merker (MENSA-F-080, in der Spec entfallen) bleibt bewusst bis
// Roadmap-Schritt 9 im Code — siehe canteen/spec.md „Umsetzungsstand".

export function CanteenScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { ids, loaded } = useCanteenSelection();
  const { mensen } = useMensen();
  const [datum, setDatum] = useState(isoHeute);

  useEffect(() => {
    void nachholenBeimAppStart();
  }, []);

  // Öffnungsangaben je gewählter Mensa (Requirement „Öffnungszeiten je Mensa und
  // Wochentag"): ein Abruf je Mensa, unabhängig vom angezeigten Tag — die Antwort
  // trägt Wochenplan, Vorausschau und Schließtage in einem. Sie steht hier oben,
  // weil das Überspringen geschlossener Wochenendtage sie braucht, und wird an die
  // Liste weitergegeben, statt dort ein zweites Mal abgerufen zu werden.
  const oeffnungsQueries = useOeffnungsangaben(ids);
  const oeffnungVon = new Map(ids.map((id, i) => [id, oeffnungsQueries[i]?.data]));

  // Maßgeblich für das Überspringen eines Wochenendtages ist die Öffnungsangabe,
  // nicht das Vorliegen eines Speiseplans: der Speiseplan führt grundsätzlich
  // keine Wochenendtage. Weil die Öffnungsangaben Wochenplan und Vorausschau in
  // einem tragen, ist dafür kein Vorabruf benachbarter Tage nötig.
  const eineGeoeffnet = (tag: string): boolean | undefined => {
    let bekannt = false;
    for (const id of ids) {
      const offen = istGeoeffnet(oeffnungVon.get(id), tag);
      if (offen === undefined) continue;
      bekannt = true;
      if (offen) return true;
    }
    return bekannt ? false : undefined;
  };

  const blaettern = (richtung: -1 | 1) => {
    const ziel = naechsterTag(datum, richtung, eineGeoeffnet);
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

      <MensaListe
        ids={ids}
        datum={datum}
        mensen={mensen}
        oeffnungVon={oeffnungVon}
        onBlaettern={blaettern}
      />
    </Screen>
  );
}

/** Öffnungsangaben je Mensa-Kennung; `undefined` = noch nicht geladen. */
type OeffnungKarte = Map<string, Oeffnungsangaben | undefined>;

function MensaListe({
  ids,
  datum,
  mensen,
  oeffnungVon,
  onBlaettern,
}: {
  ids: string[];
  datum: string;
  mensen: Mensa[];
  oeffnungVon: OeffnungKarte;
  onBlaettern: (richtung: -1 | 1) => void;
}) {
  const { t } = useTranslation();
  const ergebnisse = useSpeisepläne(ids, datum);

  // `geoeffnet` entscheidet über den Zustand einer Mensa ohne Gericht — geschlossen
  // oder geöffnet ohne Speiseplan (Requirements „Geschlossen-Hinweis für
  // geschlossene Mensa" / „Hinweis für geöffnete Mensa ohne Speiseplan").
  const proMensa = ids.map((id, i) => ({
    mensaId: id,
    gerichte: ergebnisse[i]?.data?.gerichte ?? [],
    naechsteOeffnung: ergebnisse[i]?.data?.naechsteOeffnung ?? null,
    geoeffnet: istGeoeffnet(oeffnungVon.get(id), datum),
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
          oeffnungVon={oeffnungVon}
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
  oeffnungVon,
  onBlaettern,
  onAktualisieren,
  aktualisiertGerade,
}: {
  proMensa: {
    mensaId: string;
    gerichte: Gericht[];
    naechsteOeffnung: string | null;
    geoeffnet: boolean | undefined;
  }[];
  datum: string;
  mensen: Mensa[];
  oeffnungVon: OeffnungKarte;
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
  const ohneSpeiseplan = konsolidierung.ohneSpeiseplan;
  const ids = proMensa.map((p) => p.mensaId);
  const nurEineMensa = ids.length === 1;
  // Wiedereröffnungshinweis (Requirement „Wiedereröffnungshinweis an der
  // geschlossenen Mensa"): das Backend ermittelt `naechsteOeffnung` je Mensa aus
  // Öffnungsvorschau und Schließtagen und liefert sie mit dem Tages-Speiseplan
  // (api.ts, MensaQuelle.NaechsteOeffnung) — nicht mehr aus einem
  // Speiseplan-Bestand, dessen Horizont je Mensa schwankte.
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
    art: 'gerichte' | 'geschlossen' | 'ohneSpeiseplan' | 'gefiltert';
    gerichte: KonsolidiertesGericht[];
  }[] = [];
  for (const a of struktur.abschnitte) {
    if (a.zustand === 'geschlossen' || a.zustand === 'ohneSpeiseplan') {
      angezeigte.push({ id: a.id, titel: a.titel, art: a.zustand, gerichte: [] });
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
  // — mit Angebot, mit Geschlossen-Hinweis, mit dem Hinweis auf den fehlenden
  // Speiseplan oder mit Filter-Hinweis —, ihr Chip ist damit stets auswählbar;
  // nicht auswählbar bleibt nur eine Gruppe ohne eigenen Abschnitt, was allein
  // die Kategorie-Gruppierung betrifft (Requirement „Nicht auswählbare Chips
  // ohne sichtbaren Abschnitt").
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

  /**
   * Öffnungszeit-Zeile einer Mensa für den Fußbereich, mit der Ausgabezeit, wo die
   * Quelle eine abweichende führt (Requirement „Ausweis der Ausgabezeit bei
   * abweichender Öffnungszeit"). `null`, wenn die Mensa am Tag geschlossen ist
   * oder die Quelle keine Zeit führt.
   */
  const oeffnungZeile = (id: string): string | null => {
    const zeit = oeffnungszeitFuer(oeffnungVon.get(id), datum);
    if (!zeit) return null;
    const ausgabe = ausgabezeitFuer(oeffnungVon.get(id), datum);
    const mensa = nameVon(id);
    return ausgabe
      ? t('mensa.oeffnungszeitMensaMitAusgabe', { mensa, zeit, ausgabe })
      : t('mensa.oeffnungszeitMensa', { mensa, zeit });
  };

  /**
   * Geschlossen-Hinweis samt Grund, Zeitraum und Wiedereröffnungstag — wortgleich,
   * ob er im Abschnitt der Mensa steht (Gruppierung „nach Mensa") oder am
   * Listenende (Requirements „Geschlossen-Hinweis für geschlossene Mensa",
   * „Grund und Zeitraum einer Schließung", „Wiedereröffnungshinweis an der
   * geschlossenen Mensa").
   */
  const geschlossenText = (id: string): string => {
    const teile = [t('mensa.geschlossenHeute', { mensa: nameVon(id) })];
    const schliessung = schliessungFuer(oeffnungVon.get(id), datum);
    if (schliessung) {
      const { grund, bis } = schliessung;
      const datumKurz = bis != null ? kurzdatum(bis) : null;
      if (grund != null && datumKurz != null) {
        teile.push(t('mensa.schliessungGrundBis', { grund, datum: datumKurz }));
      } else if (grund != null) {
        teile.push(t('mensa.schliessungGrund', { grund }));
      } else if (datumKurz != null) {
        teile.push(t('mensa.schliessungBis', { datum: datumKurz }));
      }
    }
    const wieder = naechsteOeffnungVon.get(id) ?? null;
    if (wieder != null) teile.push(formatWiedereroeffnung(wieder, datum, t));
    return teile.join(' ');
  };

  // Öffnungszeit-, Geschlossen- und „kein Speiseplan"-Zeilen erscheinen im
  // Fußbereich nur, wenn die Gruppierung nicht „nach Mensa" ist — bei
  // Mensa-Gruppierung tragen die Abschnittsüberschriften die Öffnungszeit und die
  // Abschnitte selbst die Hinweise (design.md D5, Requirements „Öffnungszeit an
  // der Mensa-Abschnittsüberschrift" / „Geschlossen-Hinweis für geschlossene
  // Mensa" / „Hinweis für geöffnete Mensa ohne Speiseplan"). Führt am Tag keine
  // gewählte Mensa ein Angebot, entstehen gar keine Abschnitte (design.md D4,
  // Leerzustand „Heute kein Angebot") — dann trägt der Fußbereich den vollen
  // Kontext, unabhängig von der Gruppierung. Für eine geschlossene Mensa
  // erscheint keine Öffnungszeit (Requirement „Keine Öffnungszeit für
  // geschlossene Mensa"); für eine geöffnete ohne Speiseplan erscheint sie.
  const mensaAbschnitteAktiv = mensaGruppierung && hatGerichte;
  const oeffnungszeilen = mensaAbschnitteAktiv
    ? []
    : proMensa
        .filter((p) => !geschlossene.includes(p.mensaId))
        .map((p) => oeffnungZeile(p.mensaId))
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
              {geschlossenText(id)}
            </Text>
          ))
        : null}
      {!mensaAbschnitteAktiv
        ? ohneSpeiseplan.map((id) => (
            <Text key={id} style={[styles.fussZeile, { color: colors.textMuted }]}>
              {t('mensa.keinSpeiseplanMensa', { mensa: nameVon(id) })}
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
        // eine Mensa, die die Schnittstelle nicht als geschlossen führt — also
        // auch für eine geöffnete ohne Speiseplan und für eine vollständig
        // gefilterte, nie für eine geschlossene (design.md D5, Requirements
        // „Keine Öffnungszeit für geschlossene Mensa" / „Öffnungszeit an der
        // Mensa-Abschnittsüberschrift"). Die Abschnitts-Kennung ist bei
        // Mensa-Gruppierung die Mensa-Kennung.
        const zeit =
          mensaGruppierung && abschnitt.art !== 'geschlossen'
            ? oeffnungszeitFuer(oeffnungVon.get(abschnitt.id), datum)
            : null;
        // Ausgabezeit nur, wo die Quelle eine von der Öffnungszeit abweichende
        // führt (Requirement „Ausweis der Ausgabezeit bei abweichender
        // Öffnungszeit").
        const ausgabe = zeit ? ausgabezeitFuer(oeffnungVon.get(abschnitt.id), datum) : null;
        // Überschrift: bei Mensa-Gruppierung immer (auch bei nur einem Abschnitt,
        // D6); sonst wie bisher nur bei mehreren Abschnitten mit Titel.
        const zeigeKopf = mensaGruppierung
          ? true
          : struktur.gruppierungAktiv && mehrereAbschnitte && abschnitt.titel != null;
        const kopfName = mensaGruppierung ? nameVon(abschnitt.id) : abschnitt.titel;
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
                  {ausgabe ? (
                    <Text
                      style={[
                        styles.oeffnungPille,
                        { color: colors.text, backgroundColor: colors.surface },
                      ]}
                    >
                      {t('mensa.ausgabezeit', { zeit: ausgabe })}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              {abschnitt.art === 'geschlossen' ? (
                <Text style={[styles.hinweisZeile, { color: colors.textMuted }]}>
                  {geschlossenText(abschnitt.id)}
                </Text>
              ) : null}
              {abschnitt.art === 'ohneSpeiseplan' ? (
                <Text style={[styles.hinweisZeile, { color: colors.textMuted }]}>
                  {t('mensa.keinSpeiseplan')}
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

  // Gerichtsbezeichnung nach Komponenten gegliedert (Requirement
  // „Gerichtsbezeichnung nach Komponenten gegliedert"): die erste Komponente ist
  // der Name, die weiteren sind Beiwerk. `komponenten` fehlt bei älteren Ständen
  // nicht — die Quelle liefert sie immer —, ein Fallback auf `bezeichnung` hält
  // die Anzeige aber auch dann aufrecht, wenn sie doch einmal ausbleibt.
  const komponenten = g.komponenten && g.komponenten.length > 0 ? g.komponenten : [g.bezeichnung];
  const [name, ...beiwerk] = komponenten;

  // Allergene und Zusatzstoffe unterscheidbar ausweisen (Requirement
  // „Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe"):
  // `zusatzstoffe` behält seine bisherige, umfassende Bedeutung (ADR 0016), also
  // werden die Allergene für die eigene Zeile herausgerechnet, statt sie doppelt
  // zu zeigen.
  const allergene = g.allergene ?? [];
  const nurZusatzstoffe = (g.zusatzstoffe ?? []).filter((z) => !allergene.includes(z));

  // CO₂-Klasse und Klimateller-Abzeichen (Requirement „Anzeige der CO₂-Klasse am
  // Gericht"): allein die Klasse `A` gilt als Klimateller (design.md, api-contract).
  const KLIMATELLER_KLASSE = 'A';

  return (
    <View
      style={[
        styles.karte,
        { borderColor: colors.border },
        favorit && { backgroundColor: colors.surface },
      ]}
    >
      <View style={styles.kartekopf}>
        <View style={styles.bezeichnungSpalte}>
          <Text style={[styles.bezeichnung, { color: colors.text }]}>{name}</Text>
          {beiwerk.length > 0 ? (
            <Text style={[styles.beiwerk, { color: colors.textMuted }]}>{beiwerk.join(', ')}</Text>
          ) : null}
        </View>
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

      {g.co2Klasse ? (
        <View style={styles.co2Zeile}>
          <Text style={[styles.co2, { color: colors.textMuted }]}>
            {t('mensa.co2Klasse', { klasse: g.co2Klasse })}
          </Text>
          {g.co2Klasse === KLIMATELLER_KLASSE ? (
            <Text
              style={[styles.klimateller, { color: colors.text, backgroundColor: colors.surface }]}
            >
              {t('mensa.klimateller')}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.preise, { color: colors.text }]}>
        {t('mensa.preisEinzeln', {
          gruppe: t(`priceGroup.${group}`),
          preis: preisText(preisFuer(g, group)),
        })}
      </Text>

      {allergene.length > 0 ? (
        <Text style={[styles.allergene, { color: colors.textMuted }]}>
          {t('mensa.allergene', { liste: allergene.join(', ') })}
        </Text>
      ) : null}

      {nurZusatzstoffe.length > 0 ? (
        <Text style={[styles.zusatzstoffe, { color: colors.textMuted }]}>
          {t('mensa.zusatzstoffe', { liste: nurZusatzstoffe.join(', ') })}
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
  return `${basis} ${t('mensa.wiederGeoeffnetDatum', { datum: kurzdatum(naechsteOeffnung) })}`;
}

/** ISO-Datum als Tag und Monat (`04.10.`) — das Jahr trägt keine Auskunft hinzu. */
function kurzdatum(isoDatum: string): string {
  const [, m, d] = isoDatum.split('-');
  return `${d}.${m}.`;
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
  bezeichnungSpalte: { flex: 1, gap: 2 },
  bezeichnung: { fontSize: 15, fontWeight: '600' },
  beiwerk: { fontSize: 13 },
  stern: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  anbieter: { fontSize: 13 },
  kennzeichnungen: { fontSize: 13 },
  co2Zeile: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  co2: { fontSize: 12 },
  klimateller: {
    fontSize: 11,
    fontWeight: '600',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  preise: { fontSize: 14 },
  allergene: { fontSize: 12 },
  zusatzstoffe: { fontSize: 12 },
  fuss: { gap: 6, paddingTop: 4 },
  fussZeile: { fontSize: 13 },
  fussAktion: { marginTop: 8 },
});
