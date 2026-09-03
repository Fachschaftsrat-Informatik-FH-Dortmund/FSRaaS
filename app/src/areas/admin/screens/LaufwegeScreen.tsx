import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppError } from '@/errors/AppError';
import { useTheme } from '@/theme';
import { AppButton } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useAdminApi, type Laufweg } from '../api';

// ADMIN-F-090 / ADMIN-F-100: Laufwege zwischen Raumkennungen pflegen. Eine
// Raumkennung, die nicht in den Raumdaten vorkommt, wird nach dem Speichern
// benannt, aber nicht abgelehnt.

export function LaufwegeScreen() {
  const { t } = useTranslation();
  const { laufwege, laufwegeSpeichern } = useAdminApi();

  return (
    <Screen scroll>
      <AsyncStates
        query={laufwege}
        isEmpty={() => false}
        emptyNextStep={t('admin.laufwege.emptyNextStep')}
      >
        {({ wege, etag }) => <Editor initial={wege} etag={etag} speichern={laufwegeSpeichern} />}
      </AsyncStates>
    </Screen>
  );
}

function leererWeg(): Laufweg {
  return { vonRoomId: '', nachRoomId: '', gewicht: 1 };
}

function Editor({
  initial,
  etag,
  speichern,
}: {
  initial: Laufweg[];
  etag: string;
  speichern: ReturnType<typeof useAdminApi>['laufwegeSpeichern'];
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [zeilen, setZeilen] = useState<Laufweg[]>(initial);
  const [unbekannt, setUnbekannt] = useState<string[]>([]);

  useEffect(() => {
    setZeilen(initial);
  }, [initial]);

  const setZeile = (i: number, patch: Partial<Laufweg>) =>
    setZeilen((prev) => prev.map((z, k) => (k === i ? { ...z, ...patch } : z)));

  async function absenden() {
    try {
      const ergebnis = await speichern.mutateAsync({
        wege: zeilen.filter((z) => z.vonRoomId && z.nachRoomId),
        etag,
      });
      setUnbekannt(ergebnis.unbekannteRaeume);
    } catch (error) {
      const err = AppError.from(error);
      Alert.alert(
        t(
          err.code === 'laufweg_selbstbezug'
            ? 'admin.laufwege.selfRef'
            : err.status === 412
              ? 'admin.stale'
              : 'admin.saveError',
        ),
      );
    }
  }

  return (
    <View style={styles.wrap}>
      {zeilen.map((z, i) => (
        <View key={i} style={[styles.zeile, { borderColor: colors.border }]}>
          <Feld
            label={t('admin.laufwege.from')}
            value={z.vonRoomId}
            onChange={(v) => setZeile(i, { vonRoomId: v })}
          />
          <Feld
            label={t('admin.laufwege.to')}
            value={z.nachRoomId}
            onChange={(v) => setZeile(i, { nachRoomId: v })}
          />
          <Feld
            label={t('admin.laufwege.weight')}
            value={String(z.gewicht)}
            keyboard="numeric"
            onChange={(v) => setZeile(i, { gewicht: Number(v.replace(',', '.')) || 0 })}
          />
          <AppButton
            label={t('admin.laufwege.remove')}
            variant="destructive"
            onPress={() => setZeilen((prev) => prev.filter((_, k) => k !== i))}
          />
        </View>
      ))}

      <AppButton
        label={t('admin.laufwege.add')}
        variant="secondary"
        onPress={() => setZeilen((prev) => [...prev, leererWeg()])}
      />

      {unbekannt.length > 0 ? (
        <Text style={[styles.warn, { color: colors.danger }]}>
          {t('admin.laufwege.unknownRooms', { rooms: unbekannt.join(', ') })}
        </Text>
      ) : null}

      <AppButton label={t('admin.save')} onPress={absenden} disabled={speichern.isPending} />
    </View>
  );
}

function Feld({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: 'numeric';
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.feld}>
      <Text style={[styles.feldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        autoCapitalize="characters"
        keyboardType={keyboard === 'numeric' ? 'numeric' : 'default'}
        accessibilityLabel={label}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  zeile: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  feld: { gap: 4 },
  feldLabel: { fontSize: 13 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  warn: { fontSize: 14 },
});
