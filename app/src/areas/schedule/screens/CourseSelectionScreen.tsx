import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { gcTime, staleTime } from '@/cache/ttl';
import { useTheme } from '@/theme';
import { AppButton, MessageView, SegmentedControl } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates, type QueryLike } from '@/ui/state/AsyncStates';
import { ladeTermine, useTermine } from '../api';
import { useEinrichtung } from '../einrichtung';
import { farbeFuerVeranstaltung } from '../farbe';
import { baueKursbaum, type Kurs, type KursArt } from '../kursbaum';
import { filtereKurse } from '../kurssuche';
import { useScheduleEntries } from '../planStore';
import type { CourseType, OfficialPlanEntry, OfficialTermin, PlanEntry, PlanEntryStatus } from '../typen';

// Kursauswahl-Bildschirm (Etappe 2b, Roadmap-Schritt 5): dreistufig
// Veranstaltung → Veranstaltungsart → Gruppen-Slot, aufgebaut auf
// `kursbaum.ts`/`kurssuche.ts` (SCHED-F-600/610/620/630/140/248). Der zur
// eigenen Gruppenkennung passende Slot ist vorgewählt, aber nicht erzwungen
// (SCHED-F-250/260) — die Auswahl wird erst mit „Übernehmen" über
// `planStore.ts` in den Plan geschrieben (SCHED-F-245); Farben kommen aus
// `farbe.ts` (SCHED-F-660). Auswahlreihenfolge je Veranstaltungsart entscheidet
// über den Status: der zuerst gewählte Slot wird „fest", jeder weitere
// gleichzeitig übernommene „vorgemerkt" (SCHED-F-620, Erläuterung Abschnitt 3
// des Auftrags).

const ALLE_FACHSEMESTER = 'alle';

function slotSchluessel(kursKey: string, courseType: CourseType, termin: OfficialTermin): string {
  return `${kursKey}::${courseType}::${termin.weekday}::${termin.timeBeginMin}::${termin.studentSet}`;
}

function vorhandenerEintrag(entries: readonly PlanEntry[], termin: OfficialTermin): OfficialPlanEntry | undefined {
  return entries.find(
    (e): e is OfficialPlanEntry =>
      e.kind === 'offiziell' &&
      e.courseId === termin.courseId &&
      e.courseType === termin.courseType &&
      e.weekday === termin.weekday &&
      e.timeBeginMin === termin.timeBeginMin &&
      e.studentSet === termin.studentSet,
  );
}

function erzeugeEintragId(termin: OfficialTermin): string {
  const basis = termin.courseId || termin.name;
  return `${basis}-${termin.courseType}-${termin.weekday}-${termin.timeBeginMin}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function baueEintrag(
  termin: OfficialTermin,
  gruppenzugehoerig: boolean,
  color: string,
  status: PlanEntryStatus,
): OfficialPlanEntry {
  return {
    id: erzeugeEintragId(termin),
    kind: 'offiziell',
    status,
    color,
    weekday: termin.weekday,
    timeBeginMin: termin.timeBeginMin,
    timeEndMin: termin.timeEndMin,
    gruppenzugehoerig,
    abweichendeGruppe: !gruppenzugehoerig, // SCHED-F-260
    akzeptierterKonflikt: false,
    istPruefung: false,
    gueltigVon: termin.gueltigVon,
    gueltigBis: termin.gueltigBis,
    courseId: termin.courseId,
    name: termin.name,
    courseType: termin.courseType,
    lecturerName: termin.lecturerName,
    studentSet: termin.studentSet,
    roomId: termin.roomId,
  };
}

function formatZeit(minutenSeitMitternacht: number): string {
  const stunden = Math.floor(minutenSeitMitternacht / 60);
  const minuten = minutenSeitMitternacht % 60;
  return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
}

function formatZeitraum(termin: OfficialTermin, t: TFunction): string {
  const tag = t(`schedule.weekday.${termin.weekday}`);
  return `${tag} ${formatZeit(termin.timeBeginMin)}–${formatZeit(termin.timeEndMin)}`;
}

export function CourseSelectionScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  const { einrichtung, loaded: einrichtungGeladen } = useEinrichtung();
  const { entries, loaded: planGeladen, hinzufuegen } = useScheduleEntries();

  const hauptQuery = useTermine(einrichtung.sname ?? undefined, einrichtung.grade ?? undefined);
  const zusatzQueries = useQueries({
    queries: einrichtung.zusatzFachsemester.map((grade) => ({
      queryKey: ['stundenplanTermine', einrichtung.sname, grade] as const,
      queryFn: () => ladeTermine(einrichtung.sname!, grade),
      enabled: Boolean(einrichtung.sname),
      staleTime: staleTime('stundenplanTermine'),
      gcTime: gcTime('stundenplanTermine'),
    })),
  });

  const alleQueries = [hauptQuery, ...zusatzQueries];
  const alleGeladen = alleQueries.every((q) => q.data !== undefined);
  const termine = alleQueries.flatMap((q) => q.data ?? []);

  const aggregat: QueryLike<OfficialTermin[]> = {
    data: alleGeladen ? termine : undefined,
    isPending: alleQueries.some((q) => q.isPending),
    isError: hauptQuery.isError,
    isFetching: alleQueries.some((q) => q.isFetching),
    isStale: hauptQuery.isStale,
    error: hauptQuery.error,
    dataUpdatedAt: hauptQuery.dataUpdatedAt,
    refetch: () => {
      for (const q of alleQueries) void q.refetch();
    },
  };

  const kurse = useMemo(
    () => baueKursbaum(termine, einrichtung.gruppenkennung),
    [termine, einrichtung.gruppenkennung],
  );

  const [suchtext, setSuchtext] = useState('');
  const [aktiveTypen, setAktiveTypen] = useState<CourseType[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string | undefined>(undefined);
  const [geoeffnet, setGeoeffnet] = useState<Record<string, boolean>>({});
  const [auswahl, setAuswahl] = useState<string[]>([]);
  const [letzteUebernahme, setLetzteUebernahme] = useState<number | null>(null);
  const seedRef = useRef(false);

  // SCHED-F-250/260: Vorwahl des zur Gruppenkennung passenden Slots (bzw. des
  // bereits übernommenen), einmalig sobald der Auswahlbestand vorliegt — „nicht
  // erzwungen", da die Nutzerin jeden Slot per Tap um- oder abwählen kann,
  // bevor „Übernehmen" tatsächlich in den Plan schreibt.
  useEffect(() => {
    if (seedRef.current || kurse.length === 0) return;
    seedRef.current = true;
    setAuswahl((bisher) => {
      const next = [...bisher];
      for (const kurs of kurse) {
        for (const art of kurs.arten) {
          const keys = art.slots.map((s) => slotSchluessel(kurs.key, art.courseType, s.termin));
          if (keys.some((k) => next.includes(k))) continue;
          const bestehenderSlot = art.slots.find((s) => vorhandenerEintrag(entries, s.termin));
          const zielSlot = bestehenderSlot ?? art.slots.find((s) => s.gruppenzugehoerig);
          if (zielSlot) next.push(slotSchluessel(kurs.key, art.courseType, zielSlot.termin));
        }
      }
      return next;
    });
  }, [kurse, entries]);

  if (!einrichtungGeladen || !planGeladen) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (!einrichtung.sname || !einrichtung.grade) {
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

  const vorhandeneArten = Array.from(new Set(kurse.flatMap((k) => k.arten.map((a) => a.courseType))));
  const fachsemesterOptionen = [einrichtung.grade, ...einrichtung.zusatzFachsemester];

  function toggleArtFilter(art: CourseType) {
    setAktiveTypen((bisher) => (bisher.includes(art) ? bisher.filter((a) => a !== art) : [...bisher, art]));
  }

  const filterAktiv = suchtext.trim() !== '' || aktiveTypen.length > 0 || gradeFilter !== undefined;
  const gefiltert = filtereKurse(kurse, {
    text: suchtext,
    courseTypes: aktiveTypen.length > 0 ? aktiveTypen : undefined,
    grade: gradeFilter,
  });

  function artAktiv(kurs: Kurs, art: KursArt): boolean {
    return art.slots.some((s) => auswahl.includes(slotSchluessel(kurs.key, art.courseType, s.termin)));
  }

  function artUmschalten(kurs: Kurs, art: KursArt, aktiv: boolean) {
    const keys = art.slots.map((s) => slotSchluessel(kurs.key, art.courseType, s.termin));
    setAuswahl((bisher) => {
      if (!aktiv) return bisher.filter((k) => !keys.includes(k));
      if (keys.some((k) => bisher.includes(k))) return bisher;
      const eigenerSlot = art.slots.find((s) => s.gruppenzugehoerig);
      return eigenerSlot ? [...bisher, slotSchluessel(kurs.key, art.courseType, eigenerSlot.termin)] : bisher;
    });
  }

  function slotUmschalten(key: string) {
    setAuswahl((bisher) => (bisher.includes(key) ? bisher.filter((k) => k !== key) : [...bisher, key]));
  }

  function uebernehmen() {
    let anzahl = 0;
    for (const kurs of kurse) {
      const farbe = farbeFuerVeranstaltung(kurs.key);
      for (const art of kurs.arten) {
        const keys = art.slots.map((s) => slotSchluessel(kurs.key, art.courseType, s.termin));
        const gewaehlteInReihenfolge = auswahl.filter((k) => keys.includes(k));
        let ersterVergeben = false;
        for (const key of gewaehlteInReihenfolge) {
          const slot = art.slots.find((s) => slotSchluessel(kurs.key, art.courseType, s.termin) === key);
          if (!slot) continue;
          if (vorhandenerEintrag(entries, slot.termin)) {
            ersterVergeben = true;
            continue;
          }
          const status: PlanEntryStatus = ersterVergeben ? 'vorgemerkt' : 'fest';
          hinzufuegen(baueEintrag(slot.termin, slot.gruppenzugehoerig, farbe, status));
          ersterVergeben = true;
          anzahl++;
        }
      }
    }
    setLetzteUebernahme(anzahl);
  }

  const ausgewaehlteAnzahl = auswahl.length;

  return (
    <Screen scroll tight hideScrollbar>
      <TextInput
        accessibilityLabel={t('schedule.kurseSuchePlatzhalter')}
        placeholder={t('schedule.kurseSuchePlatzhalter')}
        value={suchtext}
        onChangeText={setSuchtext}
        style={[styles.suche, { borderColor: colors.border, color: colors.text }]}
      />

      {vorhandeneArten.length > 0 ? (
        <View style={styles.filterZeile}>
          {vorhandeneArten.map((art) => {
            const aktiv = aktiveTypen.includes(art);
            return (
              <Pressable
                key={art}
                accessibilityRole="button"
                accessibilityState={{ selected: aktiv }}
                accessibilityLabel={art}
                onPress={() => toggleArtFilter(art)}
                style={[styles.chip, { borderColor: colors.border }, aktiv && { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: aktiv ? colors.onAccent : colors.text, fontWeight: '600' }}>{art}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {fachsemesterOptionen.length > 1 ? (
        <SegmentedControl
          label={t('schedule.kurseFachsemesterLabel')}
          value={gradeFilter ?? ALLE_FACHSEMESTER}
          onChange={(v) => setGradeFilter(v === ALLE_FACHSEMESTER ? undefined : v)}
          options={[
            { value: ALLE_FACHSEMESTER, label: t('schedule.kurseFilterAlle') },
            ...fachsemesterOptionen.map((g) => ({ value: g, label: t('schedule.fachsemesterOption', { grade: g }) })),
          ]}
        />
      ) : null}

      {filterAktiv ? (
        <AppButton
          variant="secondary"
          label={t('schedule.kurseFilterZuruecksetzen')}
          onPress={() => {
            setSuchtext('');
            setAktiveTypen([]);
            setGradeFilter(undefined);
          }}
        />
      ) : null}

      <AsyncStates<OfficialTermin[]>
        query={aggregat}
        isEmpty={() => gefiltert.length === 0}
        emptyTitle={t('schedule.kurseLeerTitel')}
        emptyNextStep={t('schedule.kurseLeerHinweis')}
      >
        {() => (
          <View style={styles.liste}>
            {gefiltert.map((kurs) => (
              <View key={kurs.key} style={[styles.kurs, { borderColor: colors.border }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !!geoeffnet[kurs.key] }}
                  onPress={() => setGeoeffnet((b) => ({ ...b, [kurs.key]: !b[kurs.key] }))}
                  style={styles.kursKopf}
                >
                  <Text style={[styles.kursName, { color: colors.text }]}>
                    {`${geoeffnet[kurs.key] ? '▾' : '▸'} ${kurs.name}`}
                  </Text>
                  {kurs.courseId ? (
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {t('schedule.kurseModul', { modul: kurs.courseId })}
                    </Text>
                  ) : null}
                </Pressable>

                {geoeffnet[kurs.key]
                  ? kurs.arten.map((art) => (
                      <View key={art.courseType} style={styles.art}>
                        <View style={styles.artKopf}>
                          <Switch
                            value={artAktiv(kurs, art)}
                            onValueChange={(aktiv) => artUmschalten(kurs, art, aktiv)}
                            accessibilityLabel={t('schedule.kurseArtUebernehmen', { art: art.courseType })}
                          />
                          <Text style={{ color: colors.text, fontWeight: '600' }}>{art.courseType}</Text>
                        </View>

                        {artAktiv(kurs, art)
                          ? art.slots.map((slot) => {
                              const key = slotSchluessel(kurs.key, art.courseType, slot.termin);
                              const ausgewaehlt = auswahl.includes(key);
                              const gruppe =
                                slot.termin.studentSet === '*'
                                  ? t('schedule.kurseGruppeAlle')
                                  : slot.termin.studentSet;
                              const gruppenHinweis = einrichtung.gruppenkennung
                                ? slot.gruppenzugehoerig
                                  ? ` (${t('schedule.kurseGruppeDeine')})`
                                  : ` – ${t('schedule.kurseGruppeFremd')}`
                                : '';
                              return (
                                <Pressable
                                  key={key}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: ausgewaehlt }}
                                  accessibilityLabel={`${formatZeitraum(slot.termin, t)} ${gruppe}`}
                                  onPress={() => slotUmschalten(key)}
                                  style={styles.slot}
                                >
                                  <Text style={{ color: colors.accent, fontSize: 16 }}>
                                    {ausgewaehlt ? '●' : '○'}
                                  </Text>
                                  <View style={styles.slotText}>
                                    <Text style={{ color: colors.text }}>
                                      {`${formatZeitraum(slot.termin, t)} · ${gruppe}${gruppenHinweis}`}
                                    </Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                      {`${slot.termin.lecturerName} · ${slot.termin.roomId}`}
                                    </Text>
                                  </View>
                                </Pressable>
                              );
                            })
                          : null}
                      </View>
                    ))
                  : null}
              </View>
            ))}
          </View>
        )}
      </AsyncStates>

      {letzteUebernahme !== null ? (
        <View style={[styles.hinweis, { backgroundColor: colors.banner }]}>
          <Text style={{ color: colors.onBanner }}>
            {t('schedule.kurseUebernommenHinweis', { count: letzteUebernahme })}
          </Text>
        </View>
      ) : null}

      <AppButton
        label={t('schedule.kurseUebernehmen')}
        onPress={uebernehmen}
        disabled={ausgewaehlteAnzahl === 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  suche: { minHeight: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  filterZeile: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { minHeight: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  liste: { gap: 12, marginTop: 8 },
  kurs: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 6 },
  kursKopf: { minHeight: 44, justifyContent: 'center' },
  kursName: { fontSize: 15, fontWeight: '600' },
  art: { gap: 4, paddingLeft: 8 },
  artKopf: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingLeft: 12 },
  slotText: { flex: 1 },
  hinweis: { padding: 10, borderRadius: 8, marginTop: 10 },
});
