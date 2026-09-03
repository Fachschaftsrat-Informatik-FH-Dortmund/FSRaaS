import { useEffect, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppError } from '@/errors/AppError';
import { useTheme } from '@/theme';
import { AppButton, SegmentedControl } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { AdminGate } from '../ui/AdminGate';
import { useAdminApi, type Stammdaten } from '../api';

// ADMIN-F-180 / ADMIN-F-190: Mensa-, Raum- und Links-Liste sowie Semestertermine
// und Ticket-Bildausschnitt anlegen, ändern und entfernen. Gespeichert wird der
// Bestand als Ganzes, abgesichert gegen gleichzeitige Bearbeitung über den Stand
// (ADMIN-F-200). Öffnungszeiten und Speiseplan-URL der Mensen folgen mit dem
// MENSA-Schnitt (Roadmap-Schritt 4).

type Mensa = Stammdaten['mensen'][number];
type Raum = Stammdaten['raeume'][number];
type Link = Stammdaten['links'][number];
type Raumgroesse = Raum['groesse'];

const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const istDatumOderLeer = (v?: string) => !v || DATUM.test(v);

export function StammdatenScreen() {
  const { t } = useTranslation();
  const { stammdaten, stammdatenSpeichern } = useAdminApi();

  return (
    <AdminGate>
      <Screen scroll>
        <AsyncStates query={stammdaten} isEmpty={() => false} emptyNextStep={t('admin.stammdaten.emptyNextStep')}>
          {({ daten, etag }) => <Editor daten={daten} etag={etag} speichern={stammdatenSpeichern} />}
        </AsyncStates>
      </Screen>
    </AdminGate>
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

  const setMensa = (i: number, patch: Partial<Mensa>) =>
    setEntwurf((d) => ({ ...d, mensen: d.mensen.map((m, k) => (k === i ? { ...m, ...patch } : m)) }));
  const setRaum = (i: number, patch: Partial<Raum>) =>
    setEntwurf((d) => ({ ...d, raeume: d.raeume.map((r, k) => (k === i ? { ...r, ...patch } : r)) }));
  const setLink = (i: number, patch: Partial<Link>) =>
    setEntwurf((d) => ({ ...d, links: d.links.map((l, k) => (k === i ? { ...l, ...patch } : l)) }));
  const setTermin = (patch: Partial<Stammdaten['semestertermine']>) =>
    setEntwurf((d) => ({ ...d, semestertermine: { ...d.semestertermine, ...patch } }));
  const setAusschnitt = (patch: Partial<NonNullable<Stammdaten['ticketBildausschnitt']>>) =>
    setEntwurf((d) => ({
      ...d,
      ticketBildausschnitt: { links: 0, oben: 0, rechts: 0, unten: 0, ...d.ticketBildausschnitt, ...patch },
    }));

  const setStandardMensa = (i: number) =>
    setEntwurf((d) => ({
      ...d,
      mensen: d.mensen.map((m, k) => ({ ...m, standardAuswahl: k === i ? !m.standardAuswahl : false })),
    }));

  async function speichernJetzt() {
    const termine = entwurf.semestertermine;
    if (
      ![
        termine.semesterBeginn,
        termine.semesterEnde,
        termine.naechsterWinterSemesterBeginn,
        termine.naechsterSommerSemesterBeginn,
      ].every(istDatumOderLeer)
    ) {
      Alert.alert(t('admin.stammdaten.dateError'));
      return;
    }
    try {
      await speichern.mutateAsync({ daten: entwurf, etag });
      Alert.alert(t('admin.saved'));
    } catch (error) {
      const err = AppError.from(error);
      Alert.alert(t(err.status === 412 ? 'admin.staleReloaded' : 'admin.saveError'));
    }
  }

  const ausschnitt = entwurf.ticketBildausschnitt ?? { links: 0, oben: 0, rechts: 0, unten: 0 };

  return (
    <View style={styles.wrap}>
      <Abschnitt titel={t('admin.stammdaten.mensen')}>
        {entwurf.mensen.map((m, i) => (
          <View key={`mensa-${i}`} style={[styles.karte, { borderColor: colors.border }]}>
            <Feld label={t('admin.stammdaten.mensaId')} value={m.id} onChange={(v) => setMensa(i, { id: v })} />
            <Feld label={t('admin.stammdaten.name')} value={m.name} onChange={(v) => setMensa(i, { name: v })} />
            <Feld
              label={t('admin.stammdaten.quelleId')}
              value={m.quelleId ?? ''}
              onChange={(v) => setMensa(i, { quelleId: v || undefined })}
            />
            <Feld
              label={t('admin.stammdaten.order')}
              value={String(m.reihenfolge)}
              keyboard
              onChange={(v) => setMensa(i, { reihenfolge: ganzzahl(v) })}
            />
            <SchalterZeile
              label={t('admin.stammdaten.default')}
              value={m.standardAuswahl}
              onChange={() => setStandardMensa(i)}
            />
            <AppButton
              label={t('admin.stammdaten.remove')}
              variant="destructive"
              onPress={() => setEntwurf((d) => ({ ...d, mensen: d.mensen.filter((_, k) => k !== i) }))}
            />
          </View>
        ))}
        <AppButton
          label={t('admin.stammdaten.addMensa')}
          variant="secondary"
          onPress={() =>
            setEntwurf((d) => ({
              ...d,
              mensen: [...d.mensen, { id: '', name: '', standardAuswahl: false, reihenfolge: d.mensen.length * 10 + 10 }],
            }))
          }
        />
      </Abschnitt>

      <Abschnitt titel={t('admin.stammdaten.raeume')}>
        {entwurf.raeume.map((r, i) => (
          <View key={`raum-${i}`} style={[styles.karte, { borderColor: colors.border }]}>
            <Feld
              label={t('admin.stammdaten.roomId')}
              value={r.roomId}
              onChange={(v) => setRaum(i, { roomId: v })}
            />
            <SegmentedControl<Raumgroesse>
              label={t('admin.stammdaten.size')}
              value={r.groesse}
              onChange={(v) => setRaum(i, { groesse: v })}
              options={[
                { value: 'klein', label: t('admin.stammdaten.sizeKlein') },
                { value: 'mittel', label: t('admin.stammdaten.sizeMittel') },
                { value: 'gross', label: t('admin.stammdaten.sizeGross') },
              ]}
            />
            <SchalterZeile
              label={t('admin.stammdaten.ekey')}
              value={r.ekeyZugaenglich}
              onChange={(v) => setRaum(i, { ekeyZugaenglich: v })}
            />
            <Feld
              label={t('admin.stammdaten.schliesszeit')}
              value={r.schliesszeit ?? ''}
              onChange={(v) => setRaum(i, { schliesszeit: v || null })}
            />
            <AppButton
              label={t('admin.stammdaten.remove')}
              variant="destructive"
              onPress={() => setEntwurf((d) => ({ ...d, raeume: d.raeume.filter((_, k) => k !== i) }))}
            />
          </View>
        ))}
        <AppButton
          label={t('admin.stammdaten.addRaum')}
          variant="secondary"
          onPress={() =>
            setEntwurf((d) => ({
              ...d,
              raeume: [...d.raeume, { roomId: '', groesse: 'mittel', ekeyZugaenglich: false }],
            }))
          }
        />
      </Abschnitt>

      <Abschnitt titel={t('admin.stammdaten.links')}>
        {entwurf.links.map((l, i) => (
          <View key={`link-${i}`} style={[styles.karte, { borderColor: colors.border }]}>
            <Feld label={t('admin.stammdaten.name')} value={l.bezeichnung} onChange={(v) => setLink(i, { bezeichnung: v })} />
            <Feld label="URL" value={l.url} onChange={(v) => setLink(i, { url: v })} />
            <Feld
              label={t('admin.stammdaten.group')}
              value={l.gruppe ?? ''}
              onChange={(v) => setLink(i, { gruppe: v || undefined })}
            />
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
          onPress={() =>
            setEntwurf((d) => ({
              ...d,
              links: [...d.links, { bezeichnung: '', url: '', reihenfolge: d.links.length * 10 + 10 }],
            }))
          }
        />
      </Abschnitt>

      <Abschnitt titel={t('admin.stammdaten.semester')}>
        <Feld
          label={t('admin.stammdaten.semesterBeginn')}
          value={entwurf.semestertermine.semesterBeginn ?? ''}
          onChange={(v) => setTermin({ semesterBeginn: v || undefined })}
        />
        <Feld
          label={t('admin.stammdaten.semesterEnde')}
          value={entwurf.semestertermine.semesterEnde ?? ''}
          onChange={(v) => setTermin({ semesterEnde: v || undefined })}
        />
        <Feld
          label={t('admin.stammdaten.semesterWinter')}
          value={entwurf.semestertermine.naechsterWinterSemesterBeginn ?? ''}
          onChange={(v) => setTermin({ naechsterWinterSemesterBeginn: v || undefined })}
        />
        <Feld
          label={t('admin.stammdaten.semesterSommer')}
          value={entwurf.semestertermine.naechsterSommerSemesterBeginn ?? ''}
          onChange={(v) => setTermin({ naechsterSommerSemesterBeginn: v || undefined })}
        />
      </Abschnitt>

      <Abschnitt titel={t('admin.stammdaten.ticket')}>
        <Feld
          label={t('admin.stammdaten.ticketLinks')}
          value={String(ausschnitt.links)}
          keyboard
          onChange={(v) => setAusschnitt({ links: ganzzahl(v) })}
        />
        <Feld
          label={t('admin.stammdaten.ticketOben')}
          value={String(ausschnitt.oben)}
          keyboard
          onChange={(v) => setAusschnitt({ oben: ganzzahl(v) })}
        />
        <Feld
          label={t('admin.stammdaten.ticketRechts')}
          value={String(ausschnitt.rechts)}
          keyboard
          onChange={(v) => setAusschnitt({ rechts: ganzzahl(v) })}
        />
        <Feld
          label={t('admin.stammdaten.ticketUnten')}
          value={String(ausschnitt.unten)}
          keyboard
          onChange={(v) => setAusschnitt({ unten: ganzzahl(v) })}
        />
      </Abschnitt>

      <AppButton label={t('admin.save')} onPress={speichernJetzt} disabled={speichern.isPending} />
    </View>
  );
}

function ganzzahl(v: string): number {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
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
