import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { useGruppenkennungErmitteln, useStudiengaenge, useTermineFuerEndpunkte } from '../api';
import { GRUPPENKENNUNG_MUSTER, useEinrichtung, useMatrikelnummer } from '../einrichtung';
import { zaehleGruppenTreffer } from '../groupMatch';
import { baueModulliste } from '../kursbaum';
import { registriereWeiterAktion } from '../weiterAktion';

// Schritt zur Gruppenkennung (Requirement „Eigener Schritt für die
// Gruppenkennung nach der Modulauswahl"): der eigene Bildschirm zwischen
// Modulauswahl und Planungsmodus, aus `SetupScreen` herausgelöst (design.md,
// Entscheidung 1). Er trägt beide Wege — die Ermittlung über die
// Matrikelnummer (INT-019) an erster Stelle und das manuelle Textfeld
// unmittelbar darunter, ohne Umschalter (Requirement „Gruppenkennung ohne
// Matrikelnummer").
//
// Requirement „Gruppenkennung verpflichtend vor dem Planungsmodus": Es gibt
// keinen Bedienweg mehr, der eine gesetzte Kennung ersatzlos entfernt. Ein leer
// geräumtes Eingabefeld lässt den gespeicherten Stand stehen; allein
// „Stundenplan zurücksetzen" im Verwaltungsblatt entfernt ihn.
//
// Keine Speicherung der Matrikelnummer: Sie wird ausschließlich über
// `useMatrikelnummer` im Arbeitsspeicher gehalten, überlebt keinen Neustart und
// geht an kein Ziel außer INT-019.

export function GruppenkennungScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ module?: string }>();

  const {
    einrichtung,
    loaded: einrichtungGeladen,
    setGruppenkennung,
    gruppenkennungVorschlagSetzen,
    gruppenkennungVorschlagBestaetigen,
    gruppenkennungVorschlagVerwerfen,
  } = useEinrichtung();
  const { matrikelnummer, loaded: matrikelnummerGeladen, setMatrikelnummer } = useMatrikelnummer();
  const ermitteln = useGruppenkennungErmitteln();
  const { studiengaenge } = useStudiengaenge();

  // Requirement „Gruppenkennung ohne Matrikelnummer": einzelnes Textfeld statt
  // Buchstabengitter. Der Entwurf wird lokal gehalten und erst gespeichert,
  // wenn er dem verbindlichen Muster entspricht — eine unvollständige Eingabe
  // (Buchstabe ohne Zahl) bleibt sichtbar, ohne als Gruppenkennung zu gelten.
  const [entwurf, setEntwurf] = useState(() => einrichtung.gruppenkennung ?? '');
  const [fehlendeAngabe, setFehlendeAngabe] = useState(false);
  const gespeicherteKennung = einrichtung.gruppenkennung;

  useEffect(() => {
    setEntwurf(gespeicherteKennung ?? '');
    if (gespeicherteKennung) setFehlendeAngabe(false);
  }, [gespeicherteKennung]);

  // Die in der Modulauswahl angekreuzten Module reisen als Routenparameter mit
  // (design.md, Entscheidung 3) und werden unverändert an den Planungsmodus
  // weitergereicht.
  const modulSchluessel = useMemo(
    () => (params.module ? params.module.split(',').filter((k) => k !== '') : []),
    [params.module],
  );

  const gewaehlteEndpunkte = useMemo(
    () =>
      studiengaenge
        .filter((s) => einrichtung.endpunkte.includes(s.sname))
        .map((s) => ({ sname: s.sname, name: s.name })),
    [studiengaenge, einrichtung.endpunkte],
  );
  const termineQuery = useTermineFuerEndpunkte(gewaehlteEndpunkte);

  // Requirement „Rückmeldung während der Eingabe der Gruppenkennung": Die
  // Bezugsmenge sind allein die Termine der gewählten Module (design.md,
  // Entscheidung 8) — Termine nicht gewählter Module des Auswahlbestands zählen
  // weder zu den eingeschlossenen noch zur Gesamtzahl.
  const termineDerGewaehltenModule = useMemo(
    () =>
      baueModulliste(termineQuery.perEndpunkt)
        .flatMap((abschnitt) => abschnitt.module)
        .filter((modul) => modulSchluessel.includes(modul.key))
        .flatMap((modul) => modul.termine),
    [termineQuery.perEndpunkt, modulSchluessel],
  );

  // Ohne Kennung gibt es nichts zurückzumelden, ohne gewählte Module keine
  // Bezugsmenge: Der Schritt kann über den Zugang zur Einrichtung auch ohne
  // Modulauswahl erreicht werden (nachträgliche Änderung). Dann entfällt die
  // Rückmeldung, statt auf den gesamten Auswahlbestand auszuweichen — genau die
  // Zahl, die dieser Change abschafft (design.md, Entscheidung 8).
  const kandidat = einrichtung.gruppenkennungVorschlag ?? einrichtung.gruppenkennung;
  const treffer = useMemo(
    () =>
      kandidat && modulSchluessel.length > 0
        ? zaehleGruppenTreffer(kandidat, termineDerGewaehltenModule)
        : null,
    [kandidat, modulSchluessel, termineDerGewaehltenModule],
  );

  // Requirement „Weiterführender Bedienweg in der Kopfzeile": Der Weg in den
  // Planungsmodus sitzt in der Kopfzeile (`weiterAktion.ts`, außerhalb dieses
  // Komponentenbaums). Ohne gesetzte Kennung navigiert er nicht, sondern
  // benennt die fehlende Angabe (Requirement „Gruppenkennung verpflichtend vor
  // dem Planungsmodus", Szenario „Weitergehen ohne Kennung") — eine wortlos
  // abgeblendete Schaltfläche verwehrte zwar, benennte aber nichts.
  useEffect(() => {
    registriereWeiterAktion({
      freigegeben: gespeicherteKennung !== null,
      weiter: () => {
        if (gespeicherteKennung === null) {
          setFehlendeAngabe(true);
          return;
        }
        router.push({ pathname: '/planung', params: { module: modulSchluessel.join(',') } });
      },
    });
    return () => registriereWeiterAktion(null);
  }, [gespeicherteKennung, modulSchluessel, router]);

  if (!einrichtungGeladen || !matrikelnummerGeladen) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  function matrikelnummerErmitteln() {
    if (!matrikelnummer) return;
    ermitteln.mutate(matrikelnummer, {
      onSuccess: (kennungGefunden) => {
        if (kennungGefunden) gruppenkennungVorschlagSetzen(kennungGefunden);
      },
    });
  }

  function aendereGruppenkennungEntwurf(text: string) {
    const bereinigt = text.toUpperCase();
    setEntwurf(bereinigt);
    // Ein leeres Feld speichert nichts und löscht nichts (Requirement
    // „Gruppenkennung verpflichtend vor dem Planungsmodus", Szenario „Kennung
    // ersetzen statt entfernen").
    if (GRUPPENKENNUNG_MUSTER.test(bereinigt)) {
      setGruppenkennung(bereinigt);
      setFehlendeAngabe(false);
    }
  }

  const unvollstaendig = entwurf !== '' && !GRUPPENKENNUNG_MUSTER.test(entwurf);

  return (
    <Screen scroll tight hideScrollbar>
      <View style={styles.abschnitt}>
        <Text style={[styles.hinweisKlein, { color: colors.textMuted }]}>
          {t('schedule.gruppenkennungSchrittHinweis')}
        </Text>

        <Text style={[styles.zeileText, { color: colors.text }]}>
          {einrichtung.gruppenkennung
            ? t('schedule.gruppenkennungAktuelleAnzeige', { kennung: einrichtung.gruppenkennung })
            : t('schedule.gruppenkennungKeine')}
        </Text>

        {fehlendeAngabe ? (
          <Text style={[styles.hinweisKlein, { color: colors.danger }]} accessibilityLiveRegion="polite">
            {t('schedule.gruppenkennungFehlt')}
          </Text>
        ) : null}
      </View>

      {/* Requirement „Voreingestellter Weg": Matrikelnummer zuerst, das
          manuelle Feld unmittelbar darunter — kein Umschalter zwischen
          beiden Wegen. */}
      <View style={styles.abschnitt}>
        <Text style={[styles.hinweisKlein, { color: colors.textMuted }]}>{t('schedule.matrikelnummerLabel')}</Text>
        <TextInput
          accessibilityLabel={t('schedule.matrikelnummerLabel')}
          placeholder={t('schedule.matrikelnummerLabel')}
          keyboardType="number-pad"
          value={matrikelnummer ?? ''}
          onChangeText={setMatrikelnummer}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
        <AppButton
          label={t('schedule.matrikelnummerErmitteln')}
          onPress={matrikelnummerErmitteln}
          disabled={!matrikelnummer || ermitteln.isPending}
          variant="secondary"
        />

        {ermitteln.isPending ? (
          <Text style={{ color: colors.textMuted }}>{t('schedule.matrikelnummerLaedt')}</Text>
        ) : null}

        {ermitteln.isError ? (
          <View style={styles.abschnitt}>
            <Text style={{ color: colors.danger }}>{t('schedule.matrikelnummerFehler')}</Text>
            <AppButton variant="secondary" label={t('common.retry')} onPress={matrikelnummerErmitteln} />
          </View>
        ) : null}

        {ermitteln.isSuccess && ermitteln.data === null && !einrichtung.gruppenkennungVorschlag ? (
          <Text style={{ color: colors.textMuted }}>{t('schedule.matrikelnummerNichtGefunden')}</Text>
        ) : null}

        {einrichtung.gruppenkennungVorschlag ? (
          <View style={[styles.vorschlag, { borderColor: colors.accent }]}>
            <Text style={{ color: colors.text }}>
              {t('schedule.vorschlagText', { kennung: einrichtung.gruppenkennungVorschlag })}
            </Text>
            <View style={styles.vorschlagAktionen}>
              <AppButton label={t('schedule.vorschlagUebernehmen')} onPress={gruppenkennungVorschlagBestaetigen} />
              <AppButton
                variant="secondary"
                label={t('schedule.vorschlagAblehnen')}
                onPress={gruppenkennungVorschlagVerwerfen}
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.abschnitt}>
        <Text style={[styles.hinweisKlein, { color: colors.textMuted }]}>
          {t('schedule.gruppenkennungManuellLabel')}
        </Text>
        <TextInput
          accessibilityLabel={t('schedule.gruppenkennungManuellLabel')}
          placeholder="C8"
          autoCapitalize="characters"
          autoCorrect={false}
          value={entwurf}
          onChangeText={aendereGruppenkennungEntwurf}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
        />
        {unvollstaendig ? (
          <Text style={[styles.hinweisKlein, { color: colors.danger }]}>
            {t('schedule.gruppenkennungZahlFehlt')}
          </Text>
        ) : null}
      </View>

      {treffer && termineQuery.alleGeladen ? (
        <Text style={[styles.hinweisKlein, { color: colors.textMuted }]} accessibilityLiveRegion="polite">
          {t('schedule.treffer', { eingeschlossen: treffer.eingeschlossen, gesamt: treffer.gesamt })}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  abschnitt: { gap: 10, marginBottom: 8 },
  hinweisKlein: { fontSize: 13 },
  zeileText: { fontSize: 15, flex: 1 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  vorschlag: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  vorschlagAktionen: { flexDirection: 'row', gap: 10 },
});
