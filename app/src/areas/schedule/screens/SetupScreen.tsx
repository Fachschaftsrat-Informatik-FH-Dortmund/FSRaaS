import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton, MessageView, RadioList } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import { describeAge } from '@/ui/state/dataAge';
import { useGruppenkennungErmitteln, useStudiengaenge, useTermine, type FbwsStudiengang } from '../api';
import { GRUPPENKENNUNG_MUSTER, useEinrichtung, useMatrikelnummer } from '../einrichtung';
import { zaehleGruppenTreffer } from '../groupMatch';

// Einrichtungs-Bildschirm des Stundenplans (Etappe 2b, Roadmap-Schritt 5):
// Studiengang/Fachsemester (SCHED-F-020), Gruppenkennung (SCHED-F-040/F-720)
// auf zwei gleichwertigen Wegen — über die Matrikelnummer (SCHED-F-690/F-700)
// oder manuell über eine Buchstabenauswahl —, weitere Fachsemester
// (SCHED-F-640) und die Rückmeldung, wie viele Termine eine Kennung einschließt
// (SCHED-F-650). Die gesamte Fachlogik liegt bereits in `einrichtung.ts`,
// `api.ts` und `groupMatch.ts` — dieser Bildschirm bindet sie nur an.
// SCHED-F-710: Die Matrikelnummer wird ausschließlich über `useMatrikelnummer`
// (lokaler Speicher) gehalten und nie an das eigene Backend übertragen.

const BUCHSTABEN = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

type GruppenkennungModus = 'matrikelnummer' | 'manuell';

function splitKennung(kennung: string | null): { buchstabe: string; zahl: string } {
  if (!kennung) return { buchstabe: '', zahl: '' };
  const treffer = GRUPPENKENNUNG_MUSTER.exec(kennung);
  if (!treffer) return { buchstabe: '', zahl: '' };
  return { buchstabe: treffer[0]!.charAt(0), zahl: kennung.slice(1) };
}

export function SetupScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const {
    einrichtung,
    loaded: einrichtungGeladen,
    setStudiengangUndFachsemester,
    setFachsemester,
    setGruppenkennung,
    zusatzFachsemesterHinzufuegen,
    zusatzFachsemesterEntfernen,
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
  const [modus, setModus] = useState<GruppenkennungModus>('matrikelnummer');

  const termineQuery = useTermine(einrichtung.sname ?? undefined, einrichtung.grade ?? undefined);
  const kandidat = einrichtung.gruppenkennungVorschlag ?? einrichtung.gruppenkennung;
  const treffer = useMemo(
    () => zaehleGruppenTreffer(kandidat, termineQuery.data ?? []),
    [kandidat, termineQuery.data],
  );

  if (!einrichtungGeladen || !matrikelnummerGeladen) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  const gewaehlterStudiengang = studiengaenge.find((s) => s.sname === einrichtung.sname);

  function matrikelnummerErmitteln() {
    if (!matrikelnummer) return;
    ermitteln.mutate(matrikelnummer, {
      onSuccess: (kennungGefunden) => {
        if (kennungGefunden) gruppenkennungVorschlagSetzen(kennungGefunden);
      },
    });
  }

  const { buchstabe, zahl } = splitKennung(einrichtung.gruppenkennung);

  function waehleBuchstabe(b: string) {
    if (buchstabe === b) {
      setGruppenkennung(null);
      return;
    }
    setGruppenkennung(b + zahl);
  }

  function aendereZahl(text: string) {
    if (!buchstabe) return;
    setGruppenkennung(buchstabe + text.replace(/[^0-9]/g, ''));
  }

  return (
    <Screen scroll tight hideScrollbar>
      <AsyncStates<FbwsStudiengang[]>
        query={studiengaengeQuery}
        isEmpty={(d) => d.length === 0}
        emptyNextStep={t('schedule.studiengaengeLeerHinweis')}
      >
        {(liste) => (
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

            <RadioList
              label={t('schedule.studiengangLabel')}
              options={liste.map((s) => ({ value: s.sname, label: s.name }))}
              value={einrichtung.sname ?? ''}
              onChange={(sname) => {
                const gewaehlt = liste.find((s) => s.sname === sname);
                setStudiengangUndFachsemester(sname, gewaehlt?.grades[0] ?? '');
              }}
            />

            {gewaehlterStudiengang ? (
              <RadioList
                label={t('schedule.fachsemesterLabel')}
                options={gewaehlterStudiengang.grades.map((g) => ({
                  value: g,
                  label: t('schedule.fachsemesterOption', { grade: g }),
                }))}
                value={einrichtung.grade ?? ''}
                onChange={setFachsemester}
              />
            ) : null}

            {gewaehlterStudiengang && einrichtung.grade ? (
              <View style={styles.abschnitt}>
                <Text style={[styles.titel, { color: colors.textMuted }]}>
                  {t('schedule.zusatzFachsemesterTitel')}
                </Text>
                <Text style={[styles.hinweisKlein, { color: colors.textMuted }]}>
                  {t('schedule.zusatzFachsemesterHinweis')}
                </Text>
                {gewaehlterStudiengang.grades
                  .filter((g) => g !== einrichtung.grade)
                  .map((g) => (
                    <View key={g} style={[styles.zeile, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.zeileText, { color: colors.text }]}>
                        {t('schedule.fachsemesterOption', { grade: g })}
                      </Text>
                      <Switch
                        value={einrichtung.zusatzFachsemester.includes(g)}
                        onValueChange={(aktiv) =>
                          aktiv ? zusatzFachsemesterHinzufuegen(g) : zusatzFachsemesterEntfernen(g)
                        }
                        accessibilityLabel={t('schedule.zusatzFachsemesterSchalterLabel', { grade: g })}
                      />
                    </View>
                  ))}
              </View>
            ) : null}
          </View>
        )}
      </AsyncStates>

      {einrichtung.sname && einrichtung.grade ? (
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

          <View style={[styles.modusZeile, { borderColor: colors.border }]}>
            <ModusKnopf
              aktiv={modus === 'matrikelnummer'}
              label={t('schedule.modusMatrikelnummer')}
              onPress={() => setModus('matrikelnummer')}
            />
            <ModusKnopf
              aktiv={modus === 'manuell'}
              label={t('schedule.modusManuell')}
              onPress={() => setModus('manuell')}
            />
          </View>

          {modus === 'matrikelnummer' ? (
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
                  <AppButton
                    variant="secondary"
                    label={t('common.retry')}
                    onPress={matrikelnummerErmitteln}
                  />
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
                    <AppButton
                      label={t('schedule.vorschlagUebernehmen')}
                      onPress={gruppenkennungVorschlagBestaetigen}
                    />
                    <AppButton
                      variant="secondary"
                      label={t('schedule.vorschlagAblehnen')}
                      onPress={() => {
                        gruppenkennungVorschlagVerwerfen();
                        setModus('manuell');
                      }}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.abschnitt}>
              <Text style={[styles.hinweisKlein, { color: colors.textMuted }]}>{t('schedule.buchstabeLabel')}</Text>
              <View
                accessibilityRole="radiogroup"
                accessibilityLabel={t('schedule.buchstabeLabel')}
                style={styles.buchstabenGrid}
              >
                {BUCHSTABEN.map((b) => {
                  const aktiv = buchstabe === b;
                  return (
                    <Pressable
                      key={b}
                      accessibilityRole="radio"
                      accessibilityLabel={b}
                      accessibilityState={{ selected: aktiv }}
                      onPress={() => waehleBuchstabe(b)}
                      style={[
                        styles.buchstabe,
                        { borderColor: colors.border },
                        aktiv && { backgroundColor: colors.accent },
                      ]}
                    >
                      <Text style={{ color: aktiv ? colors.onAccent : colors.text, fontWeight: '600' }}>
                        {b}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {buchstabe ? (
                <TextInput
                  accessibilityLabel={t('schedule.zahlLabel')}
                  placeholder={t('schedule.zahlLabel')}
                  keyboardType="number-pad"
                  value={zahl}
                  onChangeText={aendereZahl}
                  style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                />
              ) : null}
            </View>
          )}

          {termineQuery.data !== undefined ? (
            <Text style={[styles.hinweisKlein, { color: colors.textMuted }]}>
              {t('schedule.treffer', { eingeschlossen: treffer.eingeschlossen, gesamt: treffer.gesamt })}
            </Text>
          ) : null}
        </View>
      ) : null}

      <AppButton
        label={t('schedule.weiterZurKursauswahl')}
        onPress={() => router.push('/kurse')}
        disabled={!einrichtung.sname || !einrichtung.grade}
      />
    </Screen>
  );
}

function ModusKnopf({ aktiv, label, onPress }: { aktiv: boolean; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: aktiv }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.modusKnopf, aktiv && { backgroundColor: colors.accent }]}
    >
      <Text style={{ color: aktiv ? colors.onAccent : colors.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
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
    justifyContent: 'space-between',
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  zeileText: { fontSize: 15, flex: 1 },
  aktuelleZeile: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  modusZeile: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  modusKnopf: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  buchstabenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  buchstabe: { width: 40, height: 40, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  vorschlag: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  vorschlagAktionen: { flexDirection: 'row', gap: 10 },
});
