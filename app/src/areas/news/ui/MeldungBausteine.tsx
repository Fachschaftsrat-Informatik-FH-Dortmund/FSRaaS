import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import type { Klassifizierung, Meldung } from '../api';
import { zeitstempel } from '../zeitstempel';

// Darstellung einer Meldung, gemeinsam genutzt vom News-Tab und von der
// Vorschau der Redaktion (Requirement „Vorschau vor Veröffentlichung"): Die
// Vorschau bindet genau diese Bausteine ein, keine Nachbildung (design.md D6).
// Klassifizierung mit Symbol und Text, nie über Farbe allein (NEWS-F-080, UX-F-070).

const SYMBOL: Record<Klassifizierung, string> = {
  'fsr-news': '📣',
  'fb-aktuelles': '🏛',
  'event-erinnerung': '📅',
};

export function KlassifizierungLabel({ klassifizierung }: { klassifizierung: Klassifizierung }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Text style={[styles.label, { color: colors.textMuted }]}>
      <Text importantForAccessibility="no" accessibilityElementsHidden>
        {SYMBOL[klassifizierung]}{' '}
      </Text>
      {t(`news.klassifizierung.${klassifizierung}`)}
    </Text>
  );
}

/** Zeitpunkt im 24-Stunden-Format oder „unbekannt" (NEWS-F-020). */
export function Zeitpunkt({ roh }: { roh: string | null | undefined }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Text style={[styles.label, { color: colors.textMuted }]}>
      {zeitstempel(roh) ?? t('news.zeitUnbekannt')}
    </Text>
  );
}

function Kopf({ meldung }: { meldung: Meldung }) {
  return (
    <View style={styles.kopf}>
      <KlassifizierungLabel klassifizierung={meldung.klassifizierung} />
      <Zeitpunkt roh={meldung.veroeffentlichtAm} />
    </View>
  );
}

/** Sichtbarer Bedienweg zum Anpinnen und Ablösen (NEWS-F-040: nicht nur per Geste). */
export function PinSchalter({
  angepinnt,
  titel,
  onPress,
}: {
  angepinnt: boolean;
  titel: string;
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(angepinnt ? 'news.loesenA11y' : 'news.anpinnenA11y', { titel })}
      accessibilityState={{ selected: angepinnt, disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.pin, { borderColor: colors.border }, pressed && styles.gedrueckt]}
    >
      <Text style={[styles.pinText, { color: colors.text }]}>
        {angepinnt ? `📌 ${t('news.loesen')}` : t('news.anpinnen')}
      </Text>
    </Pressable>
  );
}

/** Listeneintrag mit gekürztem Text (Requirement „Laden und Anzeige aktueller Meldungen"). */
export function MeldungKarte({
  meldung,
  angepinnt = false,
  onOeffnen,
  onPin,
}: {
  meldung: Meldung;
  angepinnt?: boolean;
  onOeffnen?: () => void;
  onPin?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.karte, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={t('news.oeffnenHinweis')}
        disabled={!onOeffnen}
        onPress={onOeffnen}
        style={({ pressed }) => [styles.inhalt, pressed && styles.gedrueckt]}
      >
        <Kopf meldung={meldung} />
        <Text style={[styles.titel, { color: colors.text }]} accessibilityRole="header">
          {meldung.titel}
        </Text>
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>
          {meldung.text}
        </Text>
      </Pressable>
      <View style={styles.aktionen}>
        <PinSchalter angepinnt={angepinnt} titel={meldung.titel} onPress={onPin} />
      </View>
    </View>
  );
}

/**
 * Angepinnter Verweis auf eine zurückgezogene Meldung: nur noch der Titel, mit
 * Kennzeichnung und Weg zum Ablösen (Requirement „Entfernen zurückgezogener
 * Meldungen aus der Liste").
 */
export function ZurueckgezogeneKarte({ titel, onLoesen }: { titel: string; onLoesen: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.karte, { borderColor: colors.border }]}>
      <View style={styles.inhalt}>
        <Text style={[styles.label, { color: colors.danger }]}>⊘ {t('news.zurueckgezogen')}</Text>
        <Text style={[styles.titel, styles.durchgestrichen, { color: colors.textMuted }]}>{titel}</Text>
        <Text style={[styles.text, { color: colors.textMuted }]}>{t('news.zurueckgezogenHinweis')}</Text>
      </View>
      <View style={styles.aktionen}>
        <PinSchalter angepinnt titel={titel} onPress={onLoesen} />
      </View>
    </View>
  );
}

/** Vollständige Meldung (Requirement „Detailansicht einer Meldung"). */
export function MeldungInhalt({ meldung }: { meldung: Meldung }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.detail}>
      <Kopf meldung={meldung} />
      <Text style={[styles.detailTitel, { color: colors.text }]} accessibilityRole="header">
        {meldung.titel}
      </Text>
      {meldung.quelle ? (
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {t('news.quelle', { quelle: meldung.quelle })}
        </Text>
      ) : null}
      <Text style={[styles.detailText, { color: colors.text }]} selectable>
        {meldung.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  karte: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, overflow: 'hidden' },
  inhalt: { padding: 12, gap: 4 },
  kopf: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  label: { fontSize: 13 },
  titel: { fontSize: 17, fontWeight: '600' },
  text: { fontSize: 15, lineHeight: 21 },
  durchgestrichen: { textDecorationLine: 'line-through' },
  aktionen: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12, paddingBottom: 10 },
  pin: {
    minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  pinText: { fontSize: 15 },
  gedrueckt: { opacity: 0.6 },
  detail: { gap: 8 },
  detailTitel: { fontSize: 22, fontWeight: '700' },
  detailText: { fontSize: 16, lineHeight: 24, marginTop: 8 },
});
