import { useMemo } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { logError } from '@/errors/AppError';
import { useTheme } from '@/theme';
import { MessageView, RadioList } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { KRITERIEN, VOREINSTELLUNGS_REIHENFOLGE, type Kriterium, type Voreinstellung } from '../planungskriterien';
import {
  ABSTAND_MAX_MIN,
  ABSTAND_SCHRITT_MIN,
  STANDARD_ZEITFENSTER,
  usePlanungsEinstellungen,
  VORBEREITUNG_MAX_MIN,
  VORBEREITUNG_SCHRITT_MIN,
  voreinstellungAus,
  ZEITFENSTER_FRUEHESTENS_MIN,
  ZEITFENSTER_SCHRITT_MIN,
  ZEITFENSTER_SPAETESTENS_MIN,
} from '../planungseinstellungen';
import type { CourseType } from '../typen';

// Planungseinstellungen (Change `planungsmodus-voreinstellungen-anpinnen`,
// design.md Entscheidungen 7 und 8; Change `planungsmodus-rangfolge-frei`,
// design.md Entscheidungen 1 bis 4): Voreinstellung und frei sortierbare
// Kriterienrangfolge (Requirement „Kriterienrangfolge für die Planung"),
// bevorzugtes Zeitfenster, Pflicht-Veranstaltungen, Vorbereitungszeiten
// (Requirement „Vorbereitungszeit je Veranstaltungsart") und Mindestabstand
// Vorlesung–Übung. Werte über Schritt-Schaltflächen statt Freitext — es gibt
// nichts zu parsen. Umordnen über Auf- und Ab-Schaltflächen statt Ziehen.

/** Die beobachteten Veranstaltungsarten (`typen.ts`); eine künftige erhält stets den allgemeinen Wert. */
const ARTEN: readonly CourseType[] = ['V', 'Ü', 'ÜPP', 'P', 'SV', 'T', 'PR', 'S'];

/** Kein Eintrag der Voreinstellungsliste: die Rangfolge weicht von jeder Voreinstellung ab. */
const EIGENE = 'eigene' as const;

function formatZeit(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Die Kandidaten der laufenden Planung, vom Planungsmodus als Routenparameter
 * mitgegeben (`[[Modulschlüssel, Name], …]`). Ohne Parameter — oder bei einem
 * unlesbaren — entfällt der Pflicht-Abschnitt; ein unlesbarer wird
 * protokolliert (SEC-F-060).
 */
function leseKandidaten(roh: string | undefined): { key: string; name: string }[] {
  if (!roh) return [];
  try {
    const liste: unknown = JSON.parse(roh);
    if (!Array.isArray(liste)) throw new Error('kandidaten ist keine Liste');
    return liste
      .filter((e): e is [string, string] => Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'string')
      .map(([key, name]) => ({ key, name }));
  } catch (error) {
    logError('planungseinstellungen.kandidaten', error);
    return [];
  }
}

export function PlanungEinstellungenScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ kandidaten?: string }>();
  const kandidaten = useMemo(() => leseKandidaten(params.kandidaten), [params.kandidaten]);
  const {
    einstellungen,
    loaded,
    voreinstellungSetzen,
    kriteriumSchalten,
    kriteriumBewegen,
    zeitfensterSetzen,
    pflichtUmschalten,
    vorbereitungAllgemeinSetzen,
    vorbereitungFuerArtSetzen,
    abstandVorlesungUebungSetzen,
  } = usePlanungsEinstellungen();

  if (!loaded) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  const minuten = (wert: number) => t('schedule.planungMinuten', { count: wert });
  const abstandText = (wert: number) =>
    wert === 0 ? t('schedule.planungAbstandDirekt') : t('schedule.planungStunden', { count: wert / 60 });
  const kriteriumName = (k: Kriterium) => t(`schedule.planungKriterium.${k}`);
  const rangfolge = einstellungen.rangfolge;
  const abgeschaltet = KRITERIEN.filter((k) => !rangfolge.includes(k));
  const voreinstellung = voreinstellungAus(einstellungen);
  const zeitfenster = einstellungen.zeitfenster;

  function bewegen(k: Kriterium, richtung: -1 | 1) {
    const stelle = rangfolge.indexOf(k) + 1 + richtung;
    kriteriumBewegen(k, richtung);
    // Change `planungsmodus-rangfolge-frei`, design.md Entscheidung 2: die neue
    // Stelle ansagen — der Fokus bleibt auf der Schaltfläche, die Zeile ist
    // darunter weggerückt.
    AccessibilityInfo.announceForAccessibility(
      t('schedule.planungKriteriumNeueStelle', { kriterium: kriteriumName(k), stelle }),
    );
  }

  return (
    <Screen scroll>
      <Text accessibilityRole="header" style={[styles.ueberschrift, { color: colors.text }]}>
        {t('schedule.planungVoreinstellungTitel')}
      </Text>
      <Text style={[styles.erklaerung, { color: colors.textMuted }]}>{t('schedule.planungVoreinstellungHinweis')}</Text>
      <RadioList<Voreinstellung | typeof EIGENE>
        label={t('schedule.planungVoreinstellungTitel')}
        value={voreinstellung ?? EIGENE}
        onChange={(v) => {
          if (v !== EIGENE) voreinstellungSetzen(v);
        }}
        options={VOREINSTELLUNGS_REIHENFOLGE.map((v) => ({
          value: v,
          label: `${t(`schedule.planungVoreinstellung.${v}`)} — ${t(`schedule.planungVoreinstellungReihenfolge.${v}`)}`,
        }))}
      />
      {voreinstellung === null ? (
        <Text style={[styles.erklaerung, { color: colors.textMuted }]}>{t('schedule.planungRangfolgeEigene')}</Text>
      ) : null}

      {/* Requirement „Kriterienrangfolge für die Planung", Szenario „Rangfolge
       * selbst ändern" (Change `planungsmodus-rangfolge-frei`). */}
      <Text accessibilityRole="header" style={[styles.ueberschrift, { color: colors.text }]}>
        {t('schedule.planungRangfolgeTitel')}
      </Text>
      <Text style={[styles.erklaerung, { color: colors.textMuted }]}>{t('schedule.planungRangfolgeHinweis')}</Text>
      {rangfolge.length === 0 ? (
        <Text style={[styles.erklaerung, { color: colors.text }]}>{t('schedule.planungRangfolgeLeer')}</Text>
      ) : null}
      {rangfolge.map((k, index) => (
        <KriteriumZeile
          key={k}
          name={kriteriumName(k)}
          stelle={index + 1}
          an
          onSchalten={() => kriteriumSchalten(k)}
          onHoch={index > 0 ? () => bewegen(k, -1) : null}
          onRunter={index < rangfolge.length - 1 ? () => bewegen(k, 1) : null}
        />
      ))}
      {abgeschaltet.length > 0 ? (
        <Text style={[styles.unterueberschrift, { color: colors.textMuted }]}>
          {t('schedule.planungRangfolgeAbgeschaltet')}
        </Text>
      ) : null}
      {abgeschaltet.map((k) => (
        <KriteriumZeile
          key={k}
          name={kriteriumName(k)}
          stelle={null}
          an={false}
          onSchalten={() => kriteriumSchalten(k)}
          onHoch={null}
          onRunter={null}
        />
      ))}

      {/* Requirements „Bevorzugtes Zeitfenster festlegen" und „Kennzeichnung
       * außerhalb des Zeitfensters" (design.md, Entscheidung 3). */}
      <Text accessibilityRole="header" style={[styles.ueberschrift, { color: colors.text }]}>
        {t('schedule.planungZeitfensterTitel')}
      </Text>
      <Text style={[styles.erklaerung, { color: colors.textMuted }]}>{t('schedule.planungZeitfensterHinweis')}</Text>
      <Schalter
        label={t('schedule.planungZeitfensterFestlegen')}
        an={zeitfenster !== null}
        onPress={() => zeitfensterSetzen(zeitfenster === null ? STANDARD_ZEITFENSTER : null)}
      />
      {zeitfenster !== null ? (
        <>
          <Schrittwahl
            label={t('schedule.planungZeitfensterBeginn')}
            wertText={formatZeit(zeitfenster.vonMin)}
            kannWeniger={zeitfenster.vonMin > ZEITFENSTER_FRUEHESTENS_MIN}
            kannMehr={zeitfenster.vonMin + ZEITFENSTER_SCHRITT_MIN < zeitfenster.bisMin}
            onWeniger={() => zeitfensterSetzen({ ...zeitfenster, vonMin: zeitfenster.vonMin - ZEITFENSTER_SCHRITT_MIN })}
            onMehr={() => zeitfensterSetzen({ ...zeitfenster, vonMin: zeitfenster.vonMin + ZEITFENSTER_SCHRITT_MIN })}
          />
          <Schrittwahl
            label={t('schedule.planungZeitfensterEnde')}
            wertText={formatZeit(zeitfenster.bisMin)}
            kannWeniger={zeitfenster.bisMin - ZEITFENSTER_SCHRITT_MIN > zeitfenster.vonMin}
            kannMehr={zeitfenster.bisMin < ZEITFENSTER_SPAETESTENS_MIN}
            onWeniger={() => zeitfensterSetzen({ ...zeitfenster, bisMin: zeitfenster.bisMin - ZEITFENSTER_SCHRITT_MIN })}
            onMehr={() => zeitfensterSetzen({ ...zeitfenster, bisMin: zeitfenster.bisMin + ZEITFENSTER_SCHRITT_MIN })}
          />
          {!rangfolge.includes('zeitfenster') ? (
            <Text style={[styles.erklaerung, { color: colors.textMuted }]}>
              {t('schedule.planungZeitfensterNurKennzeichnung')}
            </Text>
          ) : null}
        </>
      ) : null}

      {/* Requirement „Kandidat als Pflicht markieren" (Change
       * `planungsmodus-voreinstellungen-anpinnen`, design.md Entscheidung 8). */}
      {kandidaten.length > 0 ? (
        <>
          <Text accessibilityRole="header" style={[styles.ueberschrift, { color: colors.text }]}>
            {t('schedule.planungPflichtTitel')}
          </Text>
          <Text style={[styles.erklaerung, { color: colors.textMuted }]}>{t('schedule.planungPflichtHinweis')}</Text>
          {kandidaten.map((k) => (
            <Schalter
              key={k.key}
              label={k.name}
              a11yLabel={t('schedule.planungPflichtSchalter', { modul: k.name })}
              an={einstellungen.pflichtModule.includes(k.key)}
              onPress={() => pflichtUmschalten(k.key)}
            />
          ))}
        </>
      ) : null}

      <Text accessibilityRole="header" style={[styles.ueberschrift, { color: colors.text }]}>
        {t('schedule.planungVorbereitungTitel')}
      </Text>
      <Text style={[styles.erklaerung, { color: colors.textMuted }]}>{t('schedule.planungVorbereitungHinweis')}</Text>
      <Schrittwahl
        label={t('schedule.planungVorbereitungAllgemein')}
        wertText={minuten(einstellungen.vorbereitungAllgemeinMin)}
        kannWeniger={einstellungen.vorbereitungAllgemeinMin > 0}
        kannMehr={einstellungen.vorbereitungAllgemeinMin < VORBEREITUNG_MAX_MIN}
        onWeniger={() => vorbereitungAllgemeinSetzen(einstellungen.vorbereitungAllgemeinMin - VORBEREITUNG_SCHRITT_MIN)}
        onMehr={() => vorbereitungAllgemeinSetzen(einstellungen.vorbereitungAllgemeinMin + VORBEREITUNG_SCHRITT_MIN)}
      />
      {ARTEN.map((art) => {
        const eigen = einstellungen.vorbereitungJeArt[art];
        const wert = eigen ?? einstellungen.vorbereitungAllgemeinMin;
        const artName = t(`schedule.planungArt.${art}`);
        return (
          <View key={art} style={[styles.artBlock, { borderColor: colors.border }]}>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: eigen !== undefined }}
              accessibilityLabel={t('schedule.planungVorbereitungAbweichend', { art: artName })}
              onPress={() => vorbereitungFuerArtSetzen(art, eigen === undefined ? wert : null)}
              style={styles.artSchalter}
            >
              <Text style={{ color: eigen !== undefined ? colors.accent : colors.border, fontSize: 18, width: 24 }}>
                {eigen !== undefined ? '☑' : '☐'}
              </Text>
              <Text style={{ color: colors.text, flex: 1 }}>{artName}</Text>
              {eigen === undefined ? (
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {t('schedule.planungVorbereitungWieAllgemein', { wert: minuten(wert) })}
                </Text>
              ) : null}
            </Pressable>
            {eigen !== undefined ? (
              <Schrittwahl
                label={artName}
                wertText={minuten(eigen)}
                kannWeniger={eigen > 0}
                kannMehr={eigen < VORBEREITUNG_MAX_MIN}
                onWeniger={() => vorbereitungFuerArtSetzen(art, eigen - VORBEREITUNG_SCHRITT_MIN)}
                onMehr={() => vorbereitungFuerArtSetzen(art, eigen + VORBEREITUNG_SCHRITT_MIN)}
              />
            ) : null}
          </View>
        );
      })}

      <Text accessibilityRole="header" style={[styles.ueberschrift, { color: colors.text }]}>
        {t('schedule.planungAbstandTitel')}
      </Text>
      <Text style={[styles.erklaerung, { color: colors.textMuted }]}>{t('schedule.planungAbstandHinweis')}</Text>
      <Schrittwahl
        label={t('schedule.planungAbstandTitel')}
        wertText={abstandText(einstellungen.abstandVorlesungUebungMin)}
        kannWeniger={einstellungen.abstandVorlesungUebungMin > 0}
        kannMehr={einstellungen.abstandVorlesungUebungMin < ABSTAND_MAX_MIN}
        onWeniger={() => abstandVorlesungUebungSetzen(einstellungen.abstandVorlesungUebungMin - ABSTAND_SCHRITT_MIN)}
        onMehr={() => abstandVorlesungUebungSetzen(einstellungen.abstandVorlesungUebungMin + ABSTAND_SCHRITT_MIN)}
      />
    </Screen>
  );
}

/**
 * Eine Zeile der Kriterienrangfolge (Change `planungsmodus-rangfolge-frei`,
 * design.md Entscheidung 2): Schalter zum Ein- und Abschalten, Stelle als
 * Zahl, Auf- und Ab-Schaltflächen je 44 dp. Am Rand ist die betreffende
 * Schaltfläche sichtbar gesperrt statt ausgeblendet, damit die Zeilen nicht
 * gegeneinander verrutschen.
 */
function KriteriumZeile({
  name,
  stelle,
  an,
  onSchalten,
  onHoch,
  onRunter,
}: {
  name: string;
  stelle: number | null;
  an: boolean;
  onSchalten: () => void;
  onHoch: (() => void) | null;
  onRunter: (() => void) | null;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const pfeil = (symbol: 'arrow-up' | 'arrow-down', a11y: string, onPress: (() => void) | null) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: onPress === null }}
      disabled={onPress === null}
      onPress={onPress ?? undefined}
      style={[styles.schritt, { borderColor: colors.border, opacity: onPress === null ? 0.3 : 1 }]}
    >
      <Ionicons name={symbol} size={20} color={colors.accent} />
    </Pressable>
  );
  return (
    <View style={[styles.kriteriumZeile, { borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: an }}
        accessibilityLabel={
          stelle === null ? t('schedule.planungKriteriumSchalten', { kriterium: name }) : t('schedule.planungKriteriumStelle', { kriterium: name, stelle })
        }
        onPress={onSchalten}
        style={styles.kriteriumSchalter}
      >
        <Text style={{ color: an ? colors.accent : colors.border, fontSize: 18, width: 24 }}>{an ? '☑' : '☐'}</Text>
        <Text style={{ color: an ? colors.text : colors.textMuted, flex: 1 }}>
          {stelle === null ? name : `${stelle}. ${name}`}
        </Text>
      </Pressable>
      {an ? (
        <>
          {pfeil('arrow-up', t('schedule.planungKriteriumHoch', { kriterium: name }), onHoch)}
          {pfeil('arrow-down', t('schedule.planungKriteriumRunter', { kriterium: name }), onRunter)}
        </>
      ) : null}
    </View>
  );
}

function Schalter({
  label,
  a11yLabel,
  an,
  onPress,
}: {
  label: string;
  a11yLabel?: string;
  an: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: an }}
      accessibilityLabel={a11yLabel ?? label}
      onPress={onPress}
      style={styles.artSchalter}
    >
      <Text style={{ color: an ? colors.accent : colors.border, fontSize: 18, width: 24 }}>{an ? '☑' : '☐'}</Text>
      <Text style={{ color: colors.text, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}

function Schrittwahl({
  label,
  wertText,
  kannWeniger,
  kannMehr,
  onWeniger,
  onMehr,
}: {
  label: string;
  wertText: string;
  kannWeniger: boolean;
  kannMehr: boolean;
  onWeniger: () => void;
  onMehr: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const knopf = (zeichen: string, a11y: string, aktiv: boolean, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !aktiv }}
      disabled={!aktiv}
      onPress={onPress}
      style={[styles.schritt, { borderColor: colors.border, opacity: aktiv ? 1 : 0.4 }]}
    >
      <Text style={{ color: colors.accent, fontSize: 20, fontWeight: '700' }}>{zeichen}</Text>
    </Pressable>
  );
  return (
    <View style={styles.schrittZeile}>
      <Text style={{ color: colors.text, flex: 1 }}>{label}</Text>
      {knopf('−', t('schedule.planungWeniger', { label }), kannWeniger, onWeniger)}
      <Text accessibilityLiveRegion="polite" style={[styles.wert, { color: colors.text }]}>
        {wertText}
      </Text>
      {knopf('+', t('schedule.planungMehr', { label }), kannMehr, onMehr)}
    </View>
  );
}

const styles = StyleSheet.create({
  ueberschrift: { fontSize: 17, fontWeight: '700', marginTop: 16 },
  unterueberschrift: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  erklaerung: { fontSize: 13, marginBottom: 8 },
  artBlock: { borderBottomWidth: StyleSheet.hairlineWidth },
  artSchalter: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  kriteriumZeile: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  kriteriumSchalter: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  schrittZeile: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8 },
  schritt: { width: 44, height: 44, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  wert: { minWidth: 72, textAlign: 'center' },
});
