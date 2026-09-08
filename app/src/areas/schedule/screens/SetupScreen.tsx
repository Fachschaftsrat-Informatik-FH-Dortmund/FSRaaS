import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import { describeAge } from '@/ui/state/dataAge';
import { useGruppenkennungErmitteln, useStudiengaenge, useTermineFuerEndpunkte, type FbwsStudiengang } from '../api';
import { filtereEndpunktGruppen, gruppiereEndpunkte, type EndpunktGruppe } from '../endpunkte';
import { GRUPPENKENNUNG_MUSTER, useEinrichtung, useMatrikelnummer } from '../einrichtung';
import { zaehleGruppenTreffer } from '../groupMatch';

// Einrichtungs-Bildschirm des Stundenplans (Roadmap-Schritt 5, Etappe
// „Einrichtung"): Mehrfachauswahl der Endpunkte des Lehrangebots
// (Requirement „Auswahl der Endpunkte des Lehrangebots"), gegliedert und
// durchsuchbar (Requirements „Gruppierung …", „Auffangkorb …",
// „Freitextsuche in der Endpunktauswahl"), sowie die Gruppenkennung als
// einzelnes Textfeld (Requirement „Gruppenkennung ohne Matrikelnummer") —
// voreingestellt über die Matrikelnummer (SCHED-F-690/F-700), das manuelle
// Feld unmittelbar darunter statt hinter einem Umschalter. Die Fachlogik
// liegt in `einrichtung.ts`, `api.ts`, `endpunkte.ts` und `groupMatch.ts` —
// dieser Bildschirm bindet sie nur an. Keine Speicherung der Matrikelnummer:
// Sie wird ausschließlich über `useMatrikelnummer` im Arbeitsspeicher
// gehalten, überlebt keinen Neustart und geht an kein Ziel außer INT-019.

export function SetupScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const {
    einrichtung,
    loaded: einrichtungGeladen,
    endpunktUmschalten,
    setGruppenkennung,
    gruppenkennungVorschlagSetzen,
    gruppenkennungVorschlagBestaetigen,
    gruppenkennungVorschlagVerwerfen,
  } = useEinrichtung();
  const { matrikelnummer, loaded: matrikelnummerGeladen, setMatrikelnummer } = useMatrikelnummer();

  const { studiengaenge, istRueckfall, query: primaer, rueckfallQuery: rueckfall } = useStudiengaenge();
  const geladen = primaer.isSuccess || rueckfall.isSuccess;
  const studiengaengeQuery: QueryLike<FbwsStudiengang[]> = {
    data: geladen ? studiengaenge : undefined,
    isPending: primaer.isPending || (primaer.isError && rueckfall.isPending),
    isError: primaer.isError && rueckfall.isError,
    isFetching: primaer.isFetching || rueckfall.isFetching,
    isStale: primaer.isStale,
    error: rueckfall.isError ? rueckfall.error : primaer.error,
    dataUpdatedAt: istRueckfall ? rueckfall.dataUpdatedAt : primaer.dataUpdatedAt,
    refetch: () => {
      void primaer.refetch();
      if (primaer.isError) void rueckfall.refetch();
    },
  };

  const ermitteln = useGruppenkennungErmitteln();
  const [suchtext, setSuchtext] = useState('');

  // Requirement „Gruppenkennung ohne Matrikelnummer": einzelnes Textfeld statt
  // Buchstabengitter. Der Entwurf wird lokal gehalten und erst gespeichert,
  // wenn er dem verbindlichen Muster entspricht — eine unvollständige Eingabe
  // (Buchstabe ohne Zahl) bleibt sichtbar, ohne als Gruppenkennung zu gelten.
  const [entwurf, setEntwurf] = useState(() => einrichtung.gruppenkennung ?? '');
  const gespeicherteKennung = einrichtung.gruppenkennung;

  useEffect(() => {
    setEntwurf(gespeicherteKennung ?? '');
  }, [gespeicherteKennung]);

  const gewaehlteEndpunkte = useMemo(
    () =>
      studiengaenge
        .filter((s) => einrichtung.endpunkte.includes(s.sname))
        .map((s) => ({ sname: s.sname, name: s.name })),
    [studiengaenge, einrichtung.endpunkte],
  );
  const termineQuery = useTermineFuerEndpunkte(gewaehlteEndpunkte);
  const kandidat = einrichtung.gruppenkennungVorschlag ?? einrichtung.gruppenkennung;
  const treffer = useMemo(
    () => zaehleGruppenTreffer(kandidat, termineQuery.termine),
    [kandidat, termineQuery.termine],
  );

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
    if (bereinigt === '') {
      setGruppenkennung(null);
      return;
    }
    if (GRUPPENKENNUNG_MUSTER.test(bereinigt)) setGruppenkennung(bereinigt);
  }
  const unvollstaendig = entwurf !== '' && !GRUPPENKENNUNG_MUSTER.test(entwurf);

  return (
    <Screen scroll tight hideScrollbar>
      <AsyncStates<FbwsStudiengang[]>
        query={studiengaengeQuery}
        isEmpty={(d) => d.length === 0}
        emptyNextStep={t('schedule.studiengaengeLeerHinweis')}
      >
        {(liste) => {
          const gruppen = gruppiereEndpunkte(liste);
          const gefiltert = filtereEndpunktGruppen(gruppen, suchtext);
          return (
            <View style={styles.abschnitt}>
              {istRueckfall ? (
                <View style={[styles.hinweis, { backgroundColor: colors.banner }]}>
                  <Text style={[styles.hinweisText, { color: colors.onBanner }]}>
                    {`${t('schedule.rueckfallHinweis')} — ${t('dataAge.prefix')} ${t(
                      describeAge(rueckfall.dataUpdatedAt).key,
                      { count: describeAge(rueckfall.dataUpdatedAt).count },
                    )}`}
                  </Text>
                </View>
              ) : null}

              <TextInput
                accessibilityLabel={t('schedule.endpunkteSuchePlatzhalter')}
                placeholder={t('schedule.endpunkteSuchePlatzhalter')}
                value={suchtext}
                onChangeText={setSuchtext}
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              />

              <EndpunktListe
                gruppen={gefiltert}
                gewaehlt={einrichtung.endpunkte}
                onUmschalten={endpunktUmschalten}
              />
            </View>
          );
        }}
      </AsyncStates>

      {einrichtung.endpunkte.length > 0 ? (
        <View style={styles.abschnitt}>
          <Text style={[styles.titel, { color: colors.textMuted }]}>{t('schedule.gruppenkennungTitel')}</Text>

          <View style={styles.aktuelleZeile}>
            <Text style={[styles.zeileText, { color: colors.text }]}>
              {einrichtung.gruppenkennung
                ? t('schedule.gruppenkennungAktuelleAnzeige', { kennung: einrichtung.gruppenkennung })
                : t('schedule.gruppenkennungKeine')}
            </Text>
            {einrichtung.gruppenkennung ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('schedule.gruppenkennungEntfernen')}
                onPress={() => setGruppenkennung(null)}
              >
                <Text style={{ color: colors.danger }}>{t('schedule.gruppenkennungEntfernen')}</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Requirement „Voreingestellter Weg": Matrikelnummer zuerst, das
              manuelle Feld unmittelbar darunter — kein Umschalter zwischen
              beiden Wegen. */}
          <View style={styles.abschnitt}>
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

          {termineQuery.alleGeladen ? (
            <Text style={[styles.hinweisKlein, { color: colors.textMuted }]}>
              {t('schedule.treffer', { eingeschlossen: treffer.eingeschlossen, gesamt: treffer.gesamt })}
            </Text>
          ) : null}
        </View>
      ) : null}

      <AppButton
        label={t('schedule.weiterZurKursauswahl')}
        onPress={() => router.push('/kurse')}
        disabled={einrichtung.endpunkte.length === 0}
      />
    </Screen>
  );
}

/** Requirements „Gruppierung der Endpunkte in der Auswahl" und „Auswahl der Endpunkte des Lehrangebots": Gruppenüberschriften mit Mehrfachauswahl. */
function EndpunktListe({
  gruppen,
  gewaehlt,
  onUmschalten,
}: {
  gruppen: readonly EndpunktGruppe[];
  gewaehlt: readonly string[];
  onUmschalten: (sname: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.abschnitt}>
      {gruppen.map((gruppe) => (
        <View key={gruppe.schluessel} style={styles.abschnitt}>
          <Text style={[styles.titel, { color: colors.textMuted }]}>
            {t(`schedule.endpunktGruppe.${gruppe.schluessel}`)}
          </Text>
          {gruppe.eintraege.map((eintrag) => {
            const aktiv = gewaehlt.includes(eintrag.sname);
            return (
              <Pressable
                key={eintrag.sname}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: aktiv }}
                accessibilityLabel={eintrag.name}
                onPress={() => onUmschalten(eintrag.sname)}
                style={[styles.zeile, { borderBottomColor: colors.border }]}
              >
                <Text style={{ color: aktiv ? colors.accent : colors.border, fontSize: 18, width: 24 }}>
                  {aktiv ? '☑' : '☐'}
                </Text>
                <Text style={[styles.zeileText, { color: colors.text }]}>{eintrag.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  abschnitt: { gap: 10, marginBottom: 8 },
  titel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  hinweis: { padding: 10, borderRadius: 8 },
  hinweisText: { fontSize: 13 },
  hinweisKlein: { fontSize: 13 },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  zeileText: { fontSize: 15, flex: 1 },
  aktuelleZeile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  vorschlag: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  vorschlagAktionen: { flexDirection: 'row', gap: 10 },
});
