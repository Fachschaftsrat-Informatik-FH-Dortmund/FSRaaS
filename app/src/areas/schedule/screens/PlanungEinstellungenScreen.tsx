import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { MessageView, RadioList } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { VOREINSTELLUNGS_REIHENFOLGE, type Voreinstellung } from '../planungskriterien';
import {
  ABSTAND_MAX_MIN,
  ABSTAND_SCHRITT_MIN,
  usePlanungsEinstellungen,
  VORBEREITUNG_MAX_MIN,
  VORBEREITUNG_SCHRITT_MIN,
} from '../planungseinstellungen';
import type { CourseType } from '../typen';

// Planungseinstellungen (Change `planungsmodus-voreinstellungen-anpinnen`,
// design.md Entscheidung 7): Voreinstellung (Requirement „Kriterienrangfolge
// für die Planung"), Vorbereitungszeiten (Requirement „Vorbereitungszeit je
// Veranstaltungsart") und Mindestabstand Vorlesung–Übung. Werte über
// Schritt-Schaltflächen statt Freitext — es gibt nichts zu parsen.

/** Die beobachteten Veranstaltungsarten (`typen.ts`); eine künftige erhält stets den allgemeinen Wert. */
const ARTEN: readonly CourseType[] = ['V', 'Ü', 'ÜPP', 'P', 'SV', 'T', 'PR', 'S'];

export function PlanungEinstellungenScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    einstellungen,
    loaded,
    voreinstellungSetzen,
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

  return (
    <Screen scroll>
      <Text accessibilityRole="header" style={[styles.ueberschrift, { color: colors.text }]}>
        {t('schedule.planungVoreinstellungTitel')}
      </Text>
      <Text style={[styles.erklaerung, { color: colors.textMuted }]}>{t('schedule.planungVoreinstellungHinweis')}</Text>
      <RadioList<Voreinstellung>
        label={t('schedule.planungVoreinstellungTitel')}
        value={einstellungen.voreinstellung}
        onChange={voreinstellungSetzen}
        options={VOREINSTELLUNGS_REIHENFOLGE.map((v) => ({
          value: v,
          label: `${t(`schedule.planungVoreinstellung.${v}`)} — ${t(`schedule.planungVoreinstellungReihenfolge.${v}`)}`,
        }))}
      />

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
  erklaerung: { fontSize: 13, marginBottom: 8 },
  artBlock: { borderBottomWidth: StyleSheet.hairlineWidth },
  artSchalter: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  schrittZeile: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8 },
  schritt: { width: 44, height: 44, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  wert: { minWidth: 72, textAlign: 'center' },
});
