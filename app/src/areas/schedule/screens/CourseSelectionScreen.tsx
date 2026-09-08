import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AnkerListe } from '@/ui/AnkerListe';
import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import { useStudiengaenge, useTermineFuerEndpunkte } from '../api';
import { useEinrichtung } from '../einrichtung';
import { baueModulliste, type Modul, type ModulAbschnitt } from '../kursbaum';
import { filtereModulAbschnitte } from '../kurssuche';
import { useScheduleEntries } from '../planStore';
import type { OfficialPlanEntry, OfficialTermin, PlanEntry } from '../typen';

// Modulauswahl (Requirement „Modulauswahl ohne Veranstaltungsart und Gruppen-
// Slot"): reine Ankreuzliste, die nur beantwortet „welche Module belege ich".
// Aufgebaut auf `kursbaum.baueModulliste`/`kurssuche.filtereModulAbschnitte`,
// Abschnittsnavigation über `AnkerListe` (design.md, Entscheidung 5) — die
// einzige Fachsemester-Navigation, kein zusätzliches Filterelement
// (Requirement „Gliederung der Modulauswahl nach Fachsemester"). Die
// Modulauswahl schreibt noch nichts in den persönlichen Plan (design.md,
// Non-Goal) — sie sammelt Kandidaten; welche Veranstaltungsart und welcher
// Gruppen-Slot gilt, entscheidet der Planungsmodus (eigener Change). Ein
// bereits vorhandener Planeintrag zu einem Modul zeigt es dennoch angekreuzt
// (Requirement „Abwahl eines Moduls mit vorhandenen Planeinträgen").

export function planEintraegeFuerModul(entries: readonly PlanEntry[], modul: Modul): OfficialPlanEntry[] {
  return entries.filter(
    (e): e is OfficialPlanEntry =>
      e.kind === 'offiziell' && (modul.courseId !== '' ? e.courseId === modul.courseId : e.name === modul.name),
  );
}

function abschnittSchluessel(kennung: ModulAbschnitt['kennung']): string {
  return kennung.art === 'fachsemester' ? `fachsemester:${kennung.grade}` : `endpunkt:${kennung.name}`;
}

export function CourseSelectionScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const { einrichtung, loaded: einrichtungGeladen } = useEinrichtung();
  const { entries, loaded: planGeladen, entfernen } = useScheduleEntries();
  const { studiengaenge } = useStudiengaenge();

  const gewaehlteEndpunkte = useMemo(
    () =>
      studiengaenge
        .filter((s) => einrichtung.endpunkte.includes(s.sname))
        .map((s) => ({ sname: s.sname, name: s.name })),
    [studiengaenge, einrichtung.endpunkte],
  );
  const termineQuery = useTermineFuerEndpunkte(gewaehlteEndpunkte);

  const abschnitte = useMemo(() => baueModulliste(termineQuery.perEndpunkt), [termineQuery.perEndpunkt]);

  const aggregat: QueryLike<OfficialTermin[]> = {
    data: termineQuery.alleGeladen ? termineQuery.termine : undefined,
    isPending: termineQuery.isPending,
    isError: termineQuery.isError,
    isFetching: termineQuery.isFetching,
    isStale: false,
    error: undefined,
    dataUpdatedAt: Date.now(),
    refetch: termineQuery.refetch,
  };

  const [suchtext, setSuchtext] = useState('');
  const [auswahl, setAuswahl] = useState<string[]>([]);
  const [bestaetigungFuer, setBestaetigungFuer] = useState<string | null>(null);
  const seedRef = useRef(false);

  // Ein Modul, zu dem bereits Planeinträge stehen (aus einem früheren Stand
  // oder vom Planungsmodus), erscheint ohne Zutun angekreuzt — einmalig,
  // sobald der Auswahlbestand vorliegt.
  useEffect(() => {
    if (seedRef.current || abschnitte.length === 0) return;
    seedRef.current = true;
    const vorbelegt = abschnitte
      .flatMap((a) => a.module)
      .filter((m) => planEintraegeFuerModul(entries, m).length > 0)
      .map((m) => m.key);
    if (vorbelegt.length > 0) setAuswahl(vorbelegt);
  }, [abschnitte, entries]);

  if (!einrichtungGeladen || !planGeladen) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (einrichtung.endpunkte.length === 0) {
    return (
      <Screen center>
        <MessageView
          symbol="—"
          title={t('schedule.kurseKeineEinrichtungTitel')}
          body={t('schedule.kurseKeineEinrichtungHinweis')}
          action={<AppButton label={t('schedule.einrichtungOeffnen')} onPress={() => router.push('/einrichtung')} />}
        />
      </Screen>
    );
  }

  const gefiltert = filtereModulAbschnitte(abschnitte, { text: suchtext });

  function modulUmschalten(modul: Modul) {
    const aktuell = auswahl.includes(modul.key);
    if (!aktuell) {
      setAuswahl((bisher) => [...bisher, modul.key]);
      return;
    }
    const betroffene = planEintraegeFuerModul(entries, modul);
    if (betroffene.length === 0) {
      setAuswahl((bisher) => bisher.filter((k) => k !== modul.key));
      return;
    }
    setBestaetigungFuer(modul.key); // Requirement „Abwahl eines Moduls mit vorhandenen Planeinträgen", vorbelegt auf „nein"
  }

  function abwahlBestaetigen(modul: Modul, terminEntfernen: boolean) {
    setAuswahl((bisher) => bisher.filter((k) => k !== modul.key));
    if (terminEntfernen) {
      for (const eintrag of planEintraegeFuerModul(entries, modul)) entfernen(eintrag.id);
    }
    setBestaetigungFuer(null);
  }

  return (
    <Screen tight>
      <TextInput
        accessibilityLabel={t('schedule.kurseSuchePlatzhalter')}
        placeholder={t('schedule.kurseSuchePlatzhalter')}
        value={suchtext}
        onChangeText={setSuchtext}
        style={[styles.suche, { borderColor: colors.border, color: colors.text }]}
      />

      <AsyncStates<OfficialTermin[]>
        query={aggregat}
        isEmpty={() => gefiltert.length === 0}
        emptyTitle={t('schedule.kurseLeerTitel')}
        emptyNextStep={t('schedule.kurseLeerHinweis')}
      >
        {() => (
          <AnkerListe
            chips={gefiltert.map((a) => ({
              id: abschnittSchluessel(a.kennung),
              titel: a.kennung.art === 'fachsemester' ? t('schedule.fachsemesterOption', { grade: a.kennung.grade }) : a.kennung.name,
            }))}
            abschnitte={gefiltert.map((a) => ({
              id: abschnittSchluessel(a.kennung),
              inhalt: (
                <View style={styles.abschnitt}>
                  <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>
                    {a.kennung.art === 'fachsemester'
                      ? t('schedule.fachsemesterOption', { grade: a.kennung.grade })
                      : a.kennung.name}
                  </Text>
                  {a.module.map((modul) => (
                    <ModulZeile
                      key={modul.key}
                      modul={modul}
                      gewaehlt={auswahl.includes(modul.key)}
                      bestaetigungOffen={bestaetigungFuer === modul.key}
                      onUmschalten={() => modulUmschalten(modul)}
                      onBestaetigen={(entfernenAuch) => abwahlBestaetigen(modul, entfernenAuch)}
                    />
                  ))}
                </View>
              ),
            }))}
            contentContainerStyle={styles.liste}
            fuss={
              auswahl.length > 0 ? (
                <View style={styles.weiterZurPlanung}>
                  <AppButton
                    label={t('schedule.weiterZurPlanung')}
                    onPress={() => router.push({ pathname: '/planung', params: { module: auswahl.join(',') } })}
                  />
                </View>
              ) : undefined
            }
          />
        )}
      </AsyncStates>
    </Screen>
  );
}

function ModulZeile({
  modul,
  gewaehlt,
  bestaetigungOffen,
  onUmschalten,
  onBestaetigen,
}: {
  modul: Modul;
  gewaehlt: boolean;
  bestaetigungOffen: boolean;
  onUmschalten: () => void;
  onBestaetigen: (terminEntfernen: boolean) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: gewaehlt }}
        accessibilityLabel={modul.name}
        onPress={onUmschalten}
        style={[styles.zeile, { borderBottomColor: colors.border }]}
      >
        <Text style={{ color: gewaehlt ? colors.accent : colors.border, fontSize: 18, width: 24 }}>
          {gewaehlt ? '☑' : '☐'}
        </Text>
        <View style={styles.zeileText}>
          <Text style={{ color: colors.text }}>{modul.name}</Text>
          {modul.courseId ? (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('schedule.kurseModul', { modul: modul.courseId })}</Text>
          ) : null}
        </View>
      </Pressable>

      {bestaetigungOffen ? (
        <View style={[styles.bestaetigung, { borderColor: colors.border }]}>
          <Text style={{ color: colors.text }}>{t('schedule.modulAbwahlFrage')}</Text>
          <View style={styles.bestaetigungAktionen}>
            <AppButton label={t('schedule.modulAbwahlBehalten')} onPress={() => onBestaetigen(false)} />
            <AppButton
              variant="destructive"
              label={t('schedule.modulAbwahlEntfernen')}
              onPress={() => onBestaetigen(true)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  suche: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, marginBottom: 10 },
  liste: { paddingBottom: 24 },
  abschnitt: { gap: 4, marginBottom: 16 },
  abschnittTitel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  zeileText: { flex: 1 },
  bestaetigung: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 10, marginVertical: 6 },
  bestaetigungAktionen: { flexDirection: 'row', gap: 10 },
  weiterZurPlanung: { marginTop: 12 },
});
