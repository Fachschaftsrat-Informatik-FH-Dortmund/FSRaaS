import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '@/theme';
import { SCHEDULE_NEUTRAL } from '@/theme/tokens';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { useAnsichtEinstellungen } from '../ansichtEinstellungen';
import { farbeFuerVeranstaltung } from '../farbe';
import { einmaligerGueltigkeitszeitraum, useScheduleEntries } from '../planStore';
import type { CustomPlanEntry, Weekday } from '../typen';

// Editor für eigene Termine (Requirements „Anlegen eigener Termine",
// „Zusatzangaben beim Anlegen eigener Termine", „Wiederkehrend oder einmalig
// bei eigenen Terminen", „Eigenen Termin als Prüfung kennzeichnen",
// „Erfassung von Uhrzeit und Datum über systemeigene Auswahl"). Anlegen und
// Bearbeiten teilen sich diesen Bildschirm: Die Felder sind identisch, und
// zwei getrennte Bildschirme liefen bei jeder Feldänderung auseinander
// (design.md, Entscheidung 5). Ob bearbeitet wird, entscheidet der
// Routenparameter `id`.
//
// Uhrzeit, Datum und Wochentag kommen über die systemeigene Auswahl
// (`@react-native-community/datetimepicker`, `@react-native-picker/picker")
// statt über Freitext — eine unzulässige Uhrzeit oder ein ungültiges Datum
// kann dadurch gar nicht erst entstehen. Geschrieben wird ausschließlich über
// `planStore.ts` (DATA-F-010), und erst nach der Prüfung aller
// Pflichtangaben: Ein unvollständiger Eintrag darf den gespeicherten Bestand
// nicht unlesbar machen.

const WOCHENTAGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MINUTEN_JE_STUNDE = 60;

function formatZeit(minutenSeitMitternacht: number): string {
  const stunden = Math.floor(minutenSeitMitternacht / MINUTEN_JE_STUNDE);
  const minuten = minutenSeitMitternacht % MINUTEN_JE_STUNDE;
  return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
}

function formatDatum(unixSekunden: number): string {
  const datum = new Date(unixSekunden * 1000);
  return `${String(datum.getDate()).padStart(2, '0')}.${String(datum.getMonth() + 1).padStart(2, '0')}.${datum.getFullYear()}`;
}

/** Minuten seit Mitternacht als `Date` mit beliebigem Kalendertag — nur die Uhrzeit zählt (Vorgabewert für die Zeitauswahl). */
function zeitZuDate(minutenSeitMitternacht: number): Date {
  const datum = new Date(2000, 0, 1);
  datum.setHours(Math.floor(minutenSeitMitternacht / MINUTEN_JE_STUNDE), minutenSeitMitternacht % MINUTEN_JE_STUNDE, 0, 0);
  return datum;
}

function dateZuZeitMin(datum: Date): number {
  return datum.getHours() * MINUTEN_JE_STUNDE + datum.getMinutes();
}

/** Unix-Sekunden (Mittagszeit) als `Date` — Vorgabewert für die Datumsauswahl. */
function unixZuDate(unixSekunden: number): Date {
  return new Date(unixSekunden * 1000);
}

/** `Date` (nur Kalendertag zählt) als Unix-Sekunden zur Mittagszeit — unempfindlich gegenüber Zeitzonen-Randfällen. */
function dateZuUnixMittag(datum: Date): number {
  return Math.floor(new Date(datum.getFullYear(), datum.getMonth(), datum.getDate(), 12, 0, 0).getTime() / 1000);
}

function neueId(): string {
  return `eigen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TerminEditorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; wochentag?: string; planung?: string }>();
  const { entries, loaded } = useScheduleEntries();

  const bestand = entries.find((e): e is CustomPlanEntry => e.id === params.id && e.kind === 'eigen');
  const vorgabeWochentag = WOCHENTAGE.includes(params.wochentag as Weekday)
    ? (params.wochentag as Weekday)
    : 'Mon';
  // Requirement „Wiederkehrend oder einmalig bei eigenen Terminen", Szenario
  // „Eintrag aus dem Planungsmodus": stets wöchentlich, auf dem sichtbaren
  // Wochentag — weder Wochentag noch Wiederholung sind dort wählbar
  // (design.md, Entscheidung 12).
  const ausPlanungsmodus = params.planung === '1';

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

  return <Formular bestand={bestand} vorgabeWochentag={vorgabeWochentag} ausPlanungsmodus={ausPlanungsmodus} />;
}

type OffenerPicker = 'beginn' | 'ende' | 'datum' | null;

function Formular({
  bestand,
  vorgabeWochentag,
  ausPlanungsmodus,
}: {
  bestand: CustomPlanEntry | undefined;
  vorgabeWochentag: Weekday;
  ausPlanungsmodus: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { hinzufuegen, aktualisieren } = useScheduleEntries();
  const { einstellungen: ansichtEinstellungen } = useAnsichtEinstellungen();

  const [titel, setTitel] = useState(bestand?.title ?? '');
  const [wochentag, setWochentag] = useState<Weekday>(bestand?.weekday ?? vorgabeWochentag);
  const [beginn, setBeginn] = useState(zeitZuDate(bestand?.timeBeginMin ?? 480));
  const [ende, setEnde] = useState(zeitZuDate(bestand?.timeEndMin ?? 570));
  const [raum, setRaum] = useState(bestand?.roomId ?? '');
  const [lehrperson, setLehrperson] = useState(bestand?.lecturerName ?? '');
  const [wiederkehrend, setWiederkehrend] = useState(ausPlanungsmodus ? true : (bestand?.wiederkehrend ?? true));
  const [datum, setDatum] = useState(
    bestand && !bestand.wiederkehrend && bestand.gueltigVon !== null ? unixZuDate(bestand.gueltigVon) : new Date(),
  );
  const [istPruefung, setIstPruefung] = useState(bestand?.istPruefung ?? false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [offenerPicker, setOffenerPicker] = useState<OffenerPicker>(null);

  /** Prüft alle Pflichtangaben, bevor geschrieben wird — Fehler werden benannt, nicht verschluckt. */
  function pruefeUndSpeichere() {
    if (titel.trim() === '') {
      setFehler(t('schedule.terminFehlerTitel'));
      return;
    }
    const beginnMin = dateZuZeitMin(beginn);
    const endeMin = dateZuZeitMin(ende);
    if (endeMin <= beginnMin) {
      setFehler(t('schedule.terminFehlerReihenfolge'));
      return;
    }

    let gueltigVon: number | null = null;
    let gueltigBis: number | null = null;
    if (!wiederkehrend) {
      ({ gueltigVon, gueltigBis } = einmaligerGueltigkeitszeitraum(dateZuUnixMittag(datum)));
    }

    const felder = {
      deaktiviertBis: bestand?.deaktiviertBis ?? null,
      // Requirement „Farbwahl je Termin": ein bestehender Termin behält seine
      // Farbe, ein neuer bekommt die automatisch vergebene. Ob sie angezeigt
      // oder durch die neutrale Fläche ersetzt wird, entscheidet erst die
      // Darstellung (`anzeigeFarbe`, `farbe.ts`) — so bleibt das Abschalten
      // der Automatik umkehrbar.
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

      {ausPlanungsmodus ? null : (
        <View style={styles.feld}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>{t('schedule.terminWochentagLabel')}</Text>
          <Picker
            testID="wochentag-picker"
            accessibilityLabel={t('schedule.terminWochentagLabel')}
            selectedValue={wochentag}
            onValueChange={(value) => setWochentag(value as Weekday)}
          >
            {WOCHENTAGE.map((tag) => (
              <Picker.Item key={tag} label={t(`schedule.weekdayLang.${tag}`)} value={tag} />
            ))}
          </Picker>
        </View>
      )}

      <AuswahlFeld
        label={t('schedule.terminBeginnLabel')}
        wert={formatZeit(dateZuZeitMin(beginn))}
        onPress={() => setOffenerPicker('beginn')}
      />
      {offenerPicker === 'beginn' ? (
        <DateTimePicker
          testID="beginn-picker"
          value={beginn}
          mode="time"
          is24Hour
          onChange={(_event, gewaehlt) => {
            setOffenerPicker(null);
            if (gewaehlt) setBeginn(gewaehlt);
          }}
        />
      ) : null}

      <AuswahlFeld
        label={t('schedule.terminEndeLabel')}
        wert={formatZeit(dateZuZeitMin(ende))}
        onPress={() => setOffenerPicker('ende')}
      />
      {offenerPicker === 'ende' ? (
        <DateTimePicker
          testID="ende-picker"
          value={ende}
          mode="time"
          is24Hour
          onChange={(_event, gewaehlt) => {
            setOffenerPicker(null);
            if (gewaehlt) setEnde(gewaehlt);
          }}
        />
      ) : null}

      <Feld label={t('schedule.terminRaumLabel')} wert={raum} onChange={setRaum} />
      <Feld label={t('schedule.terminLehrpersonLabel')} wert={lehrperson} onChange={setLehrperson} />

      {ausPlanungsmodus ? null : (
        <SchalterZeile
          label={t('schedule.terminWiederkehrendLabel')}
          wert={wiederkehrend}
          onChange={setWiederkehrend}
        />
      )}
      {!wiederkehrend ? (
        <>
          <AuswahlFeld
            label={t('schedule.terminDatumLabel')}
            wert={formatDatum(dateZuUnixMittag(datum))}
            onPress={() => setOffenerPicker('datum')}
          />
          {offenerPicker === 'datum' ? (
            <DateTimePicker
              testID="datum-picker"
              value={datum}
              mode="date"
              onChange={(_event, gewaehlt) => {
                setOffenerPicker(null);
                if (gewaehlt) setDatum(gewaehlt);
              }}
            />
          ) : null}
        </>
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
}: {
  label: string;
  wert: string;
  onChange: (wert: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.feld}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={wert}
        onChangeText={onChange}
        style={[styles.eingabe, { borderColor: colors.border, color: colors.text }]}
      />
    </View>
  );
}

/** Zeigt den aktuellen Wert und öffnet auf Antippen die systemeigene Auswahl (Zeit oder Datum). */
function AuswahlFeld({ label, wert, onPress }: { label: string; wert: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.feld}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.eingabe, styles.auswahlFeld, { borderColor: colors.border }]}
      >
        <Text style={{ color: colors.text, fontSize: 16 }}>{wert}</Text>
      </Pressable>
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
  auswahlFeld: { justifyContent: 'center' },
  schalterZeile: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 12 },
});
