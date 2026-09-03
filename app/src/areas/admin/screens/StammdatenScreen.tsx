import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppError } from '@/errors/AppError';
import { useTheme } from '@/theme';
import { AppButton } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useAdminApi, type Stammdaten } from '../api';

// ADMIN-F-180 / ADMIN-F-190: Mensa-, Raum- und Links-Liste sowie Semestertermine
// und Ticket-Bildausschnitt pflegen. Gespeichert wird der Bestand als Ganzes,
// abgesichert gegen gleichzeitige Bearbeitung über den Stand (ADMIN-F-200).

export function StammdatenScreen() {
  const { t } = useTranslation();
  const { stammdaten, stammdatenSpeichern } = useAdminApi();

  return (
    <Screen scroll>
      <AsyncStates query={stammdaten} isEmpty={() => false} emptyNextStep={t('admin.stammdaten.emptyNextStep')}>
        {({ daten, etag }) => <Editor daten={daten} etag={etag} speichern={stammdatenSpeichern} />}
      </AsyncStates>
    </Screen>
  );
}

function Editor({
  daten,
  etag,
  speichern,
}: {
  daten: Stammdaten;
  etag: string;
  speichern: ReturnType<typeof useAdminApi>['stammdatenSpeichern'];
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [entwurf, setEntwurf] = useState<Stammdaten>(daten);

  useEffect(() => {
    setEntwurf(daten);
  }, [daten]);

  const setMensa = (i: number, patch: Partial<Stammdaten['mensen'][number]>) =>
    setEntwurf((d) => ({ ...d, mensen: d.mensen.map((m, k) => (k === i ? { ...m, ...patch } : m)) }));
  const setLink = (i: number, patch: Partial<Stammdaten['links'][number]>) =>
    setEntwurf((d) => ({ ...d, links: d.links.map((l, k) => (k === i ? { ...l, ...patch } : l)) }));

  async function speichernJetzt() {
    try {
      await speichern.mutateAsync({ daten: entwurf, etag });
      Alert.alert(t('admin.saved'));
    } catch (error) {
      const err = AppError.from(error);
      Alert.alert(t(err.status === 412 ? 'admin.stale' : 'admin.saveError'));
    }
  }

  return (
    <View style={styles.wrap}>
      <Abschnitt titel={t('admin.stammdaten.mensen')}>
        {entwurf.mensen.map((m, i) => (
          <View key={m.id || i} style={[styles.karte, { borderColor: colors.border }]}>
            <Feld label={t('admin.stammdaten.name')} value={m.name} onChange={(v) => setMensa(i, { name: v })} />
            <Feld
              label={t('admin.stammdaten.order')}
              value={String(m.reihenfolge)}
              keyboard
              onChange={(v) => setMensa(i, { reihenfolge: Number(v) || 0 })}
            />
            <SchalterZeile
              label={t('admin.stammdaten.default')}
              value={m.standardAuswahl}
              onChange={(v) => setEntwurf((d) => ({
                ...d,
                mensen: d.mensen.map((x, k) => ({ ...x, standardAuswahl: k === i ? v : v ? false : x.standardAuswahl })),
              }))}
            />
            <AppButton
              label={t('admin.stammdaten.remove')}
              variant="destructive"
              onPress={() => setEntwurf((d) => ({ ...d, mensen: d.mensen.filter((_, k) => k !== i) }))}
            />
          </View>
        ))}
      </Abschnitt>

      <Abschnitt titel={t('admin.stammdaten.links')}>
        {entwurf.links.map((l, i) => (
          <View key={i} style={[styles.karte, { borderColor: colors.border }]}>
            <Feld label={t('admin.stammdaten.name')} value={l.bezeichnung} onChange={(v) => setLink(i, { bezeichnung: v })} />
            <Feld label="URL" value={l.url} onChange={(v) => setLink(i, { url: v })} />
            <AppButton
              label={t('admin.stammdaten.remove')}
              variant="destructive"
              onPress={() => setEntwurf((d) => ({ ...d, links: d.links.filter((_, k) => k !== i) }))}
            />
          </View>
        ))}
        <AppButton
          label={t('admin.stammdaten.addLink')}
          variant="secondary"
          onPress={() => setEntwurf((d) => ({ ...d, links: [...d.links, { bezeichnung: '', url: '', reihenfolge: d.links.length * 10 }] }))}
        />
      </Abschnitt>

      <Abschnitt titel={t('admin.stammdaten.semester')}>
        <Feld
          label={t('admin.stammdaten.semesterBeginn')}
          value={entwurf.semestertermine.semesterBeginn ?? ''}
          onChange={(v) => setEntwurf((d) => ({ ...d, semestertermine: { ...d.semestertermine, semesterBeginn: v || undefined } }))}
        />
        <Feld
          label={t('admin.stammdaten.semesterEnde')}
          value={entwurf.semestertermine.semesterEnde ?? ''}
          onChange={(v) => setEntwurf((d) => ({ ...d, semestertermine: { ...d.semestertermine, semesterEnde: v || undefined } }))}
        />
      </Abschnitt>

      <AppButton label={t('admin.save')} onPress={speichernJetzt} disabled={speichern.isPending} />
    </View>
  );
}

function Abschnitt({ titel, children }: { titel: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.abschnitt}>
      <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>{titel}</Text>
      {children}
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
  keyboard?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.feld}>
      <Text style={[styles.feldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ? 'numeric' : 'default'}
        accessibilityLabel={label}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
    </View>
  );
}

function SchalterZeile({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.schalter}>
      <Text style={[styles.feldLabel, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  abschnitt: { gap: 8 },
  abschnittTitel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  karte: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  feld: { gap: 4 },
  feldLabel: { fontSize: 13 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  schalter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
});
