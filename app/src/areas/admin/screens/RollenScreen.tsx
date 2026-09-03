import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppError } from '@/errors/AppError';
import { useTheme } from '@/theme';
import { AppButton } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useAdminApi, type Rollenzuweisung } from '../api';

type Rolle = 'fsr-redaktion' | 'moderation';

// ADMIN-F-070: Zuweisen und Entziehen der Rollen FSR-Redaktion und Moderation.
// Führendes System ist Authentik (INT-012); ist dessen Verwaltungs-API nicht
// erreichbar, meldet das Backend 503 — hier als eigener Hinweis, nicht als
// allgemeiner Fehler (ADMIN Abschnitt 9).

export function RollenScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { rollen, rollenSpeichern } = useAdminApi();
  const [neuKonto, setNeuKonto] = useState('');

  if (rollen.isError) {
    const err = AppError.from(rollen.error);
    if (err.code === 'authentik_nicht_verfuegbar') {
      return (
        <Screen center>
          <Text style={[styles.hinweis, { color: colors.textMuted }]}>{t('admin.roles.unavailable')}</Text>
        </Screen>
      );
    }
  }

  async function speichern(kontoId: string, rollenNeu: Rolle[]) {
    try {
      await rollenSpeichern.mutateAsync({ kontoId, rollen: rollenNeu });
    } catch (error) {
      const err = AppError.from(error);
      Alert.alert(t(err.code === 'letzte_redaktion' ? 'admin.roles.lastRedaktion' : 'admin.saveError'));
    }
  }

  return (
    <Screen scroll>
      <AsyncStates
        query={rollen}
        isEmpty={(list) => list.length === 0}
        emptyNextStep={t('admin.roles.emptyNextStep')}
      >
        {(list) => (
          <View style={styles.list}>
            {list.map((z) => (
              <Zeile key={z.kontoId} zuweisung={z} onSpeichern={speichern} />
            ))}
            <View style={styles.addBox}>
              <Text style={[styles.addLabel, { color: colors.text }]}>{t('admin.roles.addLabel')}</Text>
              <TextInput
                value={neuKonto}
                onChangeText={setNeuKonto}
                autoCapitalize="none"
                placeholder={t('admin.roles.addPlaceholder')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                accessibilityLabel={t('admin.roles.addLabel')}
              />
              <AppButton
                label={t('admin.roles.addRedaktion')}
                onPress={() => {
                  if (neuKonto.trim()) void speichern(neuKonto.trim(), ['fsr-redaktion']);
                  setNeuKonto('');
                }}
                disabled={!neuKonto.trim()}
              />
            </View>
          </View>
        )}
      </AsyncStates>
    </Screen>
  );
}

function Zeile({
  zuweisung,
  onSpeichern,
}: {
  zuweisung: Rollenzuweisung;
  onSpeichern: (kontoId: string, rollen: Rolle[]) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [rollenState, setRollenState] = useState<Rolle[]>(zuweisung.rollen as Rolle[]);

  const toggle = (r: Rolle) =>
    setRollenState((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const geaendert =
    [...rollenState].sort().join(',') !== [...(zuweisung.rollen as Rolle[])].sort().join(',');

  return (
    <View style={[styles.zeile, { borderBottomColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.text }]}>
        {zuweisung.anzeigename ?? zuweisung.kontoId}
      </Text>
      <View style={styles.toggles}>
        {(['fsr-redaktion', 'moderation'] as Rolle[]).map((r) => {
          const an = rollenState.includes(r);
          return (
            <AppButton
              key={r}
              label={`${an ? '✓ ' : ''}${t(`admin.roles.${r === 'fsr-redaktion' ? 'redaktion' : 'moderation'}`)}`}
              variant={an ? 'primary' : 'secondary'}
              onPress={() => toggle(r)}
            />
          );
        })}
      </View>
      {geaendert ? (
        <AppButton
          label={t('admin.roles.save')}
          onPress={() => onSpeichern(zuweisung.kontoId, rollenState)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  zeile: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  name: { fontSize: 16, fontWeight: '600' },
  toggles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hinweis: { fontSize: 15, textAlign: 'center' },
  addBox: { marginTop: 24, gap: 8 },
  addLabel: { fontSize: 15, fontWeight: '600' },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
});
