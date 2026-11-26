import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MeldungInhalt, MeldungKarte } from '@/areas/news/ui/MeldungBausteine';
import { AppError, logError } from '@/errors/AppError';
import { useOnlineStatus } from '@/state/useOnlineStatus';
import { useTheme } from '@/theme';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AdminGate } from '../ui/AdminGate';
import { useMeldungsentwurf, type Meldungsentwurf } from '../api';

// Editor und Vorschau einer Meldung (Requirements „Meldungsredaktion für
// FSR-News", „Vorschau vor Veröffentlichung", „Ablehnung bei gleichzeitiger
// Änderung einer Meldung", „Entfernen zurückgezogener Meldungen aus der Liste").
//
// Veröffentlichen — und bei einer veröffentlichten Meldung das Übernehmen von
// Änderungen — geht nur aus der Vorschau, die dieselben Bausteine wie der
// News-Tab zeigt. Die Eingabe bleibt bei jedem Fehler stehen (Capability `admin`,
// „Fehlerfälle"); Fehler erscheinen im Bildschirm, weil `Alert` im Web-Export
// nicht angezeigt wird (design.md D8).

const FEHLERTEXT: Record<string, string> = {
  titel_leer: 'admin.meldungen.titelLeer',
  text_leer: 'admin.meldungen.textLeer',
  titel_zu_lang: 'admin.meldungen.titelZuLang',
  text_zu_lang: 'admin.meldungen.textZuLang',
  meldung_unbekannt: 'admin.meldungen.unbekannt',
};

type Modus = 'bearbeiten' | 'vorschau';

export function MeldungEditorScreen() {
  const params = useLocalSearchParams<{ entwurfId?: string }>();
  const id = params.entwurfId && params.entwurfId !== 'neu' ? params.entwurfId : null;
  return (
    <AdminGate>
      <Editor id={id} />
    </AdminGate>
  );
}

function Editor({ id }: { id: string | null }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const online = useOnlineStatus();
  const { query, aendern, anlegen, veroeffentlichen, zurueckziehen } = useMeldungsentwurf(id);

  const [basis, setBasis] = useState<Meldungsentwurf | null>(null);
  const [titel, setTitel] = useState('');
  const [text, setText] = useState('');
  const [modus, setModus] = useState<Modus>('bearbeiten');
  const [fehler, setFehler] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [veraltet, setVeraltet] = useState(false);
  const [beschaeftigt, setBeschaeftigt] = useState(false);
  const [rueckfrage, setRueckfrage] = useState(false);

  // Formular einmalig aus dem Serverstand füllen; spätere Abrufe überschreiben
  // die Eingabe nicht (sie wird erst mit „Neueren Stand laden" ersetzt).
  // Während des Renderns statt in einem Effekt: React verwirft dann den
  // unvollständigen Durchlauf, statt erst ein leeres Formular zu zeigen.
  if (query.data && basis === null) {
    setBasis(query.data);
    setTitel(query.data.titel);
    setText(query.data.text);
  }

  function uebernehmen(m: Meldungsentwurf) {
    setBasis(m);
    setTitel(m.titel);
    setText(m.text);
  }

  if (id !== null && basis === null) {
    if (query.isError) {
      const err = AppError.from(query.error);
      return (
        <Screen center>
          <MessageView
            symbol="⚠"
            title={t(err.status === 404 ? 'admin.meldungen.unbekannt' : 'states.errorTitle')}
            action={<AppButton label={t('common.retry')} variant="secondary" onPress={() => void query.refetch()} />}
          />
        </Screen>
      );
    }
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  const eingabe = { titel: titel.trim(), text: text.trim() };
  const veroeffentlicht = basis?.zustand === 'veroeffentlicht';
  const geaendert = !basis || basis.titel !== eingabe.titel || basis.text !== eingabe.text;
  const gesperrt = !online || beschaeftigt;

  async function ausfuehren(handlung: () => Promise<Meldungsentwurf>, erfolg: string | null) {
    setFehler(null);
    setHinweis(null);
    setBeschaeftigt(true);
    try {
      const neu = await handlung();
      const neuAngelegt = !basis;
      uebernehmen(neu);
      setVeraltet(false);
      setHinweis(erfolg);
      // Neue Meldung: Adresse auf die vergebene Kennung umstellen. Der Editor
      // bleibt dabei bestehen, die Eingabe und der Hinweis ebenso.
      if (neuAngelegt) router.setParams({ entwurfId: neu.id });
      return true;
    } catch (error) {
      const err = AppError.from(error);
      logError('admin.meldung', err);
      if (err.status === 412) setVeraltet(true);
      else setFehler(FEHLERTEXT[err.code ?? ''] ?? (err.kind === 'offline' ? 'admin.meldungen.offline' : 'admin.saveError'));
      return false;
    } finally {
      setBeschaeftigt(false);
    }
  }

  function pflichtangabenPruefen(): boolean {
    if (!eingabe.titel) {
      setFehler('admin.meldungen.titelLeer');
      return false;
    }
    if (!eingabe.text) {
      setFehler('admin.meldungen.textLeer');
      return false;
    }
    return true;
  }

  const entwurfSpeichern = () => {
    if (!pflichtangabenPruefen()) return;
    void ausfuehren(() => (basis ? aendern(basis, eingabe) : anlegen(eingabe)), 'admin.saved');
  };

  const zurVorschau = () => {
    if (!pflichtangabenPruefen()) return;
    setFehler(null);
    setHinweis(null);
    setModus('vorschau');
  };

  const ausVorschauVeroeffentlichen = async () => {
    const ok = await ausfuehren(() => veroeffentlichen(basis, eingabe), 'admin.meldungen.veroeffentlicht');
    if (ok) setModus('bearbeiten');
  };

  const neuerenStandLaden = async () => {
    const neu = await query.refetch();
    if (neu.data) {
      uebernehmen(neu.data);
      setVeraltet(false);
      setModus('bearbeiten');
    } else {
      setFehler('admin.saveError');
    }
  };

  const meldungsVorschau = {
    id: basis?.id ?? 'vorschau',
    titel: eingabe.titel,
    text: eingabe.text,
    // Unveröffentlicht: Zeitpunkt der Veröffentlichung wäre „jetzt".
    veroeffentlichtAm: veroeffentlicht ? (basis?.veroeffentlichtAm ?? null) : new Date().toISOString(),
    klassifizierung: basis?.klassifizierung ?? 'fsr-news',
    quelle: basis?.quelle ?? 'FSR FB4',
  } as const;

  const veroeffentlichenLabel = veroeffentlicht
    ? 'admin.meldungen.aenderungenVeroeffentlichen'
    : basis?.zustand === 'zurueckgezogen'
      ? 'admin.meldungen.erneutVeroeffentlichen'
      : 'admin.meldungen.veroeffentlichen';

  return (
    <Screen scroll>
      {basis ? (
        <Text style={[styles.zustand, { color: colors.textMuted }]}>
          {t(`admin.meldungen.zustandHinweis.${basis.zustand}`)}
        </Text>
      ) : null}

      {!online ? <Meldung text={t('admin.meldungen.offline')} /> : null}
      {veraltet ? (
        <View style={[styles.box, { borderColor: colors.danger }]} accessibilityLiveRegion="polite">
          <Text style={[styles.boxText, { color: colors.text }]}>⚠ {t('admin.meldungen.veraltet')}</Text>
          <AppButton
            label={t('admin.meldungen.neuerenStandLaden')}
            variant="secondary"
            disabled={gesperrt}
            onPress={() => void neuerenStandLaden()}
          />
        </View>
      ) : null}
      {fehler ? <Meldung text={t(fehler)} fehler /> : null}
      {hinweis ? <Meldung text={t(hinweis)} /> : null}

      {modus === 'bearbeiten' ? (
        <View style={styles.formular}>
          <Feld label={t('admin.meldungen.titel')} value={titel} onChange={setTitel} maxLength={200} />
          <Feld label={t('admin.meldungen.text')} value={text} onChange={setText} mehrzeilig maxLength={20000} />
          <View style={styles.knoepfe}>
            <AppButton label={t('admin.meldungen.vorschau')} onPress={zurVorschau} disabled={gesperrt} />
            {!veroeffentlicht ? (
              <AppButton
                label={t('admin.meldungen.alsEntwurfSpeichern')}
                variant="secondary"
                onPress={entwurfSpeichern}
                disabled={gesperrt || (basis !== null && !geaendert)}
              />
            ) : null}
            {veroeffentlicht ? (
              <AppButton
                label={t('admin.meldungen.zurueckziehen')}
                variant="destructive"
                onPress={() => setRueckfrage(true)}
                disabled={gesperrt}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.vorschau}>
          <Text style={[styles.zustand, { color: colors.textMuted }]}>{t('admin.meldungen.vorschauHinweis')}</Text>
          <Text style={[styles.abschnitt, { color: colors.textMuted }]} accessibilityRole="header">
            {t('admin.meldungen.vorschauListe')}
          </Text>
          <MeldungKarte meldung={meldungsVorschau} />
          <Text style={[styles.abschnitt, { color: colors.textMuted }]} accessibilityRole="header">
            {t('admin.meldungen.vorschauDetail')}
          </Text>
          <View style={[styles.detailRahmen, { borderColor: colors.border }]}>
            <MeldungInhalt meldung={meldungsVorschau} />
          </View>
          <View style={styles.knoepfe}>
            <AppButton
              label={t(veroeffentlichenLabel)}
              onPress={() => void ausVorschauVeroeffentlichen()}
              disabled={gesperrt || (veroeffentlicht && !geaendert)}
            />
            <AppButton
              label={t('admin.meldungen.zurueckZurBearbeitung')}
              variant="secondary"
              onPress={() => setModus('bearbeiten')}
            />
          </View>
        </View>
      )}

      <ConfirmDialog
        visible={rueckfrage}
        message={t('admin.meldungen.zurueckziehenFrage', { titel: basis?.titel ?? '' })}
        actions={[
          {
            label: t('admin.meldungen.zurueckziehen'),
            variant: 'destructive',
            onPress: () => {
              setRueckfrage(false);
              if (basis) void ausfuehren(() => zurueckziehen(basis), 'admin.meldungen.zurueckgezogen');
            },
          },
          { label: t('common.cancel'), variant: 'secondary', onPress: () => setRueckfrage(false) },
        ]}
        onDismiss={() => setRueckfrage(false)}
      />
    </Screen>
  );
}

function Meldung({ text, fehler = false }: { text: string; fehler?: boolean }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[styles.meldung, { color: fehler ? colors.danger : colors.text }]}
      accessibilityLiveRegion="polite"
    >
      {fehler ? '⚠ ' : ''}
      {text}
    </Text>
  );
}

function Feld({
  label,
  value,
  onChange,
  mehrzeilig = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mehrzeilig?: boolean;
  maxLength: number;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.feld}>
      <Text style={[styles.feldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        multiline={mehrzeilig}
        maxLength={maxLength}
        textAlignVertical={mehrzeilig ? 'top' : 'center'}
        style={[
          styles.input,
          mehrzeilig && styles.mehrzeilig,
          { color: colors.text, borderColor: colors.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  zustand: { fontSize: 14 },
  box: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  boxText: { fontSize: 14 },
  meldung: { fontSize: 14 },
  formular: { gap: 12 },
  feld: { gap: 4 },
  feldLabel: { fontSize: 13 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 },
  mehrzeilig: { minHeight: 200 },
  knoepfe: { gap: 8, alignItems: 'flex-start' },
  vorschau: { gap: 10 },
  abschnitt: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginTop: 6 },
  detailRahmen: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, padding: 12 },
});
