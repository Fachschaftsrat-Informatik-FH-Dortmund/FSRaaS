import { StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  useSchreibwarteschlange,
  versucheErneut,
  verwirf,
  type WarteschlangenEintrag,
} from '@/state/schreibwarteschlange';
import { useTheme } from '@/theme';
import { AppButton } from './primitives';

// Sichtbarer Status der Offline-Schreib-Warteschlange (Capability
// `data-and-storage`, Requirements „Status der Offline-Warteschlange einsehbar"
// und „Manuelle Entscheidung bei dauerhaft fehlgeschlagenem Schreibvorgang").
// Generisch: Der einbindende Bereich nennt seine Arten und beschreibt jeden
// Eintrag in eigenen Worten. Ohne Einträge zeigt der Baustein nichts.

export function SchreibwarteschlangeStatus({
  arten,
  beschreibe,
}: {
  arten: readonly string[];
  beschreibe: (eintrag: WarteschlangenEintrag) => string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const client = useQueryClient();
  const eintraege = useSchreibwarteschlange(arten);
  if (eintraege.length === 0) return null;

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={t('warteschlange.titel')}
      style={[styles.kasten, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <Text style={[styles.titel, { color: colors.text }]}>{t('warteschlange.titel')}</Text>
      {eintraege.map((e) => (
        <View key={e.mutationId} style={styles.eintrag}>
          <Text style={{ color: colors.text }}>
            {`${t(`warteschlange.symbol.${e.zustand}`)} ${beschreibe(e)} · ${t(`warteschlange.zustand.${e.zustand}`)}`}
          </Text>
          {e.zustand === 'fehlgeschlagen' ? (
            <>
              <Text style={{ color: colors.textMuted }}>{t('warteschlange.fehlgeschlagenHinweis')}</Text>
              <View style={styles.reihe}>
                <AppButton
                  variant="secondary"
                  label={t('warteschlange.erneutVersuchen')}
                  onPress={() => versucheErneut(client, e)}
                />
                <AppButton
                  variant="destructive"
                  label={t('warteschlange.verwerfen')}
                  onPress={() => verwirf(client, e)}
                />
              </View>
            </>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  kasten: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8, marginBottom: 12 },
  titel: { fontSize: 15, fontWeight: '700' },
  eintrag: { gap: 4 },
  reihe: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
