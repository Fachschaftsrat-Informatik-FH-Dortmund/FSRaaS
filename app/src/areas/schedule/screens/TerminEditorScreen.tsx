import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton, MessageView, RadioList } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { farbeFuerVeranstaltung } from '../farbe';
import { einmaligerGueltigkeitszeitraum, useScheduleEntries } from '../planStore';
import type { CustomPlanEntry, Weekday } from '../typen';

// Editor für eigene Termine (Requirements „Anlegen eigener Termine",
// „Zusatzangaben beim Anlegen eigener Termine", „Wiederkehrend oder einmalig
// bei eigenen Terminen", „Eigenen Termin als Prüfung kennzeichnen"). Anlegen
// und Bearbeiten teilen sich diesen Bildschirm: Die Felder sind identisch, und
// zwei getrennte Bildschirme liefen bei jeder Feldänderung auseinander
// (design.md, Entscheidung 5). Ob bearbeitet wird, entscheidet der
// Routenparameter `id`.
//
// Geschrieben wird ausschließlich über `planStore.ts` (DATA-F-010), und erst
// nach der Prüfung aller Pflichtangaben: Ein unvollständiger Eintrag darf den
// gespeicherten Bestand nicht unlesbar machen.

const WOCHENTAGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MINUTEN_JE_STUNDE = 60;

/** `"HH:MM"` als Minuten seit Mitternacht, oder `null` bei unlesbarer Eingabe. */
export function parseUhrzeit(text: string): number | null {
  const treffer = /^([0-9]{1,2}):([0-9]{2})$/.exec(text.trim());
  if (!treffer) return null;
  const stunden = Number(treffer[1]);
  const minuten = Number(treffer[2]);
  if (stunden > 23 || minuten > 59) return null;
  return stunden * MINUTEN_JE_STUNDE + minuten;
}

/**
 * `"TT.MM.JJJJ"` als Unix-Sekunden zur Mittagszeit, oder `null` bei unlesbarer
 * Eingabe. Deutsche Datumskonvention unabhängig von der Oberflächensprache
 * (NFR-F-120); die Mittagszeit macht den Vergleich mit `gueltigVon`/`gueltigBis`
 * unempfindlich gegenüber Zeitzonen-Randfällen.
 */
export function parseDatum(text: string): number | null {
  const treffer = /^([0-9]{1,2})\.([0-9]{1,2})\.([0-9]{4})$/.exec(text.trim());
  if (!treffer) return null;
  const tag = Number(treffer[1]);
  const monat = Number(treffer[2]);
  const jahr = Number(treffer[3]);
  const datum = new Date(jahr, monat - 1, tag, 12, 0, 0);
  if (datum.getFullYear() !== jahr || datum.getMonth() !== monat - 1 || datum.getDate() !== tag) {
    return null;
  }
  return Math.floor(datum.getTime() / 1000);
}

function formatZeit(minutenSeitMitternacht: number): string {
  const stunden = Math.floor(minutenSeitMitternacht / MINUTEN_JE_STUNDE);
  const minuten = minutenSeitMitternacht % MINUTEN_JE_STUNDE;
  return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
}

function formatDatum(unixSekunden: number): string {
  const datum = new Date(unixSekunden * 1000);
  return `${String(datum.getDate()).padStart(2, '0')}.${String(datum.getMonth() + 1).padStart(2, '0')}.${datum.getFullYear()}`;
}

function neueId(): string {
  return `eigen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TerminEditorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; wochentag?: string }>();
  const { entries, loaded } = useScheduleEntries();

  const bestand = entries.find((e): e is CustomPlanEntry => e.id === params.id && e.kind === 'eigen');
  const vorgabeWochentag = WOCHENTAGE.includes(params.wochentag as Weekday)
    ? (params.wochentag as Weekday)
    : 'Mon';

  // Das Formular wird erst gebaut, wenn der gespeicherte Bestand vorliegt —
  // sonst stünden seine Felder mit den Anfangswerten eines leeren Eintrags da
  // und übernähmen den nachgeladenen Termin nicht mehr.
  if (!loaded) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (params.id && !bestand) {
    return (
      <Screen center>
        <MessageView
          symbol="—"
          title={t('schedule.detailFehltTitel')}
          body={t('schedule.detailFehltHinweis')}
          action={<AppButton label={t('common.back')} onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  return <Formular bestand={bestand} vorgabeWochentag={vorgabeWochentag} />;
}

function Formular({
  bestand,
  vorgabeWochentag,
}: {
  bestand: CustomPlanEntry | undefined;
  vorgabeWochentag: Weekday;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { hinzufuegen, aktualisieren } = useScheduleEntries();

  const [titel, setTitel] = useState(bestand?.title ?? '');
  const [wochentag, setWochentag] = useState<Weekday>(bestand?.weekday ?? vorgabeWochentag);
  const [beginn, setBeginn] = useState(bestand ? formatZeit(bestand.timeBeginMin) : '');
  const [ende, setEnde] = useState(bestand ? formatZeit(bestand.timeEndMin) : '');
  const [raum, setRaum] = useState(bestand?.roomId ?? '');
  const [lehrperson, setLehrperson] = useState(bestand?.lecturerName ?? '');
  const [wiederkehrend, setWiederkehrend] = useState(bestand?.wiederkehrend ?? true);
  const [datum, setDatum] = useState(
    bestand && !bestand.wiederkehrend && bestand.gueltigVon !== null
      ? formatDatum(bestand.gueltigVon)
      : '',
  );
  const [istPruefung, setIstPruefung] = useState(bestand?.istPruefung ?? false);
  const [fehler, setFehler] = useState<string | null>(null);

  /** Prüft alle Pflichtangaben, bevor geschrieben wird — Fehler werden benannt, nicht verschluckt. */
  function pruefeUndSpeichere() {
    if (titel.trim() === '') {
      setFehler(t('schedule.terminFehlerTitel'));
      return;
    }
    const beginnMin = parseUhrzeit(beginn);
    const endeMin = parseUhrzeit(ende);
    if (beginnMin === null || endeMin === null) {
      setFehler(t('schedule.terminFehlerZeit'));
      return;
    }
    if (endeMin <= beginnMin) {
      setFehler(t('schedule.terminFehlerReihenfolge'));
      return;
    }

    let gueltigVon: number | null = null;
    let gueltigBis: number | null = null;
    if (!wiederkehrend) {
      const zeitpunkt = parseDatum(datum);
      if (zeitpunkt === null) {
        setFehler(t('schedule.terminFehlerDatum'));
        return;
      }
      ({ gueltigVon, gueltigBis } = einmaligerGueltigkeitszeitraum(zeitpunkt));
    }

    const felder = {
      status: bestand?.status ?? ('fest' as const),
      color: bestand?.color ?? farbeFuerVeranstaltung(titel.trim()),
      weekday: wochentag,
      timeBeginMin: beginnMin,
      timeEndMin: endeMin,
      gruppenzugehoerig: true,
      abweichendeGruppe: false,
      akzeptierteKonflikte: bestand?.akzeptierteKonflikte ?? [],
      istPruefung,
      gueltigVon,
      gueltigBis,
      title: titel.trim(),
      roomId: raum.trim() === '' ? undefined : raum.trim(),
      lecturerName: lehrperson.trim() === '' ? undefined : lehrperson.trim(),
      wiederkehrend,
    };

    if (bestand) {
      aktualisieren(bestand.id, felder);
    } else {
      hinzufuegen({ id: neueId(), kind: 'eigen', ...felder });
    }
    setFehler(null);
    router.back();
  }

  return (
    <Screen scroll tight hideScrollbar>
      <Feld label={t('schedule.terminTitelLabel')} wert={titel} onChange={setTitel} />

      <RadioList<Weekday>
        label={t('schedule.terminWochentagLabel')}
        value={wochentag}
        onChange={setWochentag}
        options={WOCHENTAGE.map((tag) => ({ value: tag, label: t(`schedule.weekdayLang.${tag}`) }))}
      />

      <Feld
        label={t('schedule.terminBeginnLabel')}
        wert={beginn}
        onChange={setBeginn}
        platzhalter="08:00"
      />
      <Feld label={t('schedule.terminEndeLabel')} wert={ende} onChange={setEnde} platzhalter="09:30" />

      <Feld label={t('schedule.terminRaumLabel')} wert={raum} onChange={setRaum} />
      <Feld label={t('schedule.terminLehrpersonLabel')} wert={lehrperson} onChange={setLehrperson} />

      <SchalterZeile
        label={t('schedule.terminWiederkehrendLabel')}
        wert={wiederkehrend}
        onChange={setWiederkehrend}
      />
      {!wiederkehrend ? (
        <Feld
          label={t('schedule.terminDatumLabel')}
          wert={datum}
          onChange={setDatum}
          platzhalter="24.11.2026"
        />
      ) : null}

      <SchalterZeile
        label={t('schedule.terminPruefungLabel')}
        wert={istPruefung}
        onChange={setIstPruefung}
      />

      {fehler ? (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.danger }}>
          {fehler}
        </Text>
      ) : null}

      <AppButton
        label={bestand ? t('schedule.terminSpeichern') : t('schedule.terminAnlegenBestaetigen')}
        onPress={pruefeUndSpeichere}
      />
    </Screen>
  );
}

function Feld({
  label,
  wert,
  onChange,
  platzhalter,
}: {
  label: string;
  wert: string;
  onChange: (wert: string) => void;
  platzhalter?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.feld}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={platzhalter}
        placeholderTextColor={colors.textMuted}
        value={wert}
        onChangeText={onChange}
        style={[styles.eingabe, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );
}

function SchalterZeile({
  label,
  wert,
  onChange,
}: {
  label: string;
  wert: boolean;
  onChange: (wert: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.schalterZeile}>
      <Text style={{ color: colors.text, flex: 1 }}>{label}</Text>
      <Switch accessibilityLabel={label} value={wert} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  feld: { gap: 4 },
  eingabe: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  schalterZeile: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 },
});
