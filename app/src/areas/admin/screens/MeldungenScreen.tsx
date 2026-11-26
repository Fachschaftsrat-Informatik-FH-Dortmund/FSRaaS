import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { zeitstempel } from '@/areas/news/zeitstempel';
import { useTheme } from '@/theme';
import { AppButton } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { AdminGate } from '../ui/AdminGate';
import { useMeldungenRedaktion, type Meldungsentwurf } from '../api';

// Requirement „Meldungsredaktion für FSR-News": alle Meldungen der Redaktion,
// nach Zustand gruppiert, mit dem Weg zur neuen Meldung. Derselbe Bildschirm in
// App und Weboberfläche (ADMIN-F-030).

const GRUPPEN = ['entwurf', 'veroeffentlicht', 'zurueckgezogen'] as const;

export function MeldungenScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useMeldungenRedaktion();
  const neu = () => router.push('/more/admin/meldungen/neu');

  return (
    <AdminGate>
      <Screen scroll>
        <View style={styles.kopf}>
          <AppButton label={t('admin.meldungen.neu')} onPress={neu} />
        </View>
        <AsyncStates
          query={query}
          isEmpty={(d) => d.length === 0}
          emptyTitle={t('admin.meldungen.leerTitel')}
          emptyNextStep={t('admin.meldungen.leerHinweis')}
        >
          {(liste) => (
            <View style={styles.gruppen}>
              {GRUPPEN.map((zustand) => {
                const eintraege = liste.filter((m) => m.zustand === zustand);
                if (eintraege.length === 0) return null;
                return (
                  <Gruppe
                    key={zustand}
                    titel={t(`admin.meldungen.gruppe.${zustand}`)}
                    eintraege={eintraege}
                    onOeffnen={(m) => router.push(`/more/admin/meldungen/${m.id}`)}
                  />
                );
              })}
            </View>
          )}
        </AsyncStates>
      </Screen>
    </AdminGate>
  );
}

function Gruppe({
  titel,
  eintraege,
  onOeffnen,
}: {
  titel: string;
  eintraege: Meldungsentwurf[];
  onOeffnen: (m: Meldungsentwurf) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.gruppe}>
      <Text style={[styles.gruppeTitel, { color: colors.textMuted }]} accessibilityRole="header">
        {titel}
      </Text>
      {eintraege.map((m) => (
        <Pressable
          key={m.id}
          accessibilityRole="link"
          onPress={() => onOeffnen(m)}
          style={({ pressed }) => [
            styles.zeile,
            { borderBottomColor: colors.border },
            pressed && styles.gedrueckt,
          ]}
        >
          <Text style={[styles.zeileTitel, { color: colors.text }]}>{m.titel}</Text>
          <Text style={[styles.zeileInfo, { color: colors.textMuted }]}>
            {t('admin.meldungen.geaendert', { zeit: zeitstempel(m.geaendertAm) ?? '—' })}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  kopf: { alignItems: 'flex-start' },
  gruppen: { gap: 20 },
  gruppe: { gap: 0 },
  gruppeTitel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  zeile: { minHeight: 44, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  zeileTitel: { fontSize: 17 },
  zeileInfo: { fontSize: 13 },
  gedrueckt: { opacity: 0.6 },
});
