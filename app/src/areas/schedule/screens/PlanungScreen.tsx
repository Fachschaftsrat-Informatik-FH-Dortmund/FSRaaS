import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation, usePreventRemove, type NavigationAction } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { useStudiengaenge, useTermineFuerEndpunkte } from '../api';
import { useEinrichtung } from '../einrichtung';
import { farbeFuerVeranstaltung } from '../farbe';
import { gruppenzugehoerig } from '../groupMatch';
import { pruefeKandidatGegenZwischenstand } from '../konflikt';
import { baueModulliste, type Modul } from '../kursbaum';
import { registriereePlanungAktion } from '../planungAktion';
import {
  bestimmeStatus,
  ermittlePlanungsstand,
  terminEntsprichtEintrag,
  terminSchluessel,
  vorbelegteSlots,
  type VeranstaltungsartStand,
} from '../planungsstand';
import { useScheduleEntries } from '../planStore';
import type { OfficialPlanEntry, OfficialTermin, PlanEntry, Weekday } from '../typen';
import { planEintraegeFuerModul } from './CourseSelectionScreen';

// Requirements „Planungsmodus mit Wochentagsgliederung" bis „Zweckbestimmung
// eigener Termine" (design.md): der Bildschirm, der die Kandidaten der
// gewählten Module (`kursbaum.baueModulliste`) auf Veranstaltungsart und
// Gruppen-Slot herunterbricht. Fachlogik liegt vollständig in
// `planungsstand.ts`/`konflikt.ts` — dieser Bildschirm verdrahtet sie nur.
//
// Der Zwischenstand (Entscheidung 6) lebt ausschließlich im Bildschirmzustand
// (`useState`), nie in `planStore`: `sessionEntscheidungen` sind neu gewählte,
// noch ungesicherte Termine mit bereits fertigen, dauerhaften Kennungen — erst
// beim Sichern werden sie unverändert in den Plan geschrieben.

const WOCHENTAGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function neueId(): string {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function baueSessionEintrag(slot: OfficialTermin, status: PlanEntry['status']): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    id: neueId(),
    status,
    color: farbeFuerVeranstaltung(slot.courseId || slot.name),
    weekday: slot.weekday,
    timeBeginMin: slot.timeBeginMin,
    timeEndMin: slot.timeEndMin,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: slot.gueltigVon,
    gueltigBis: slot.gueltigBis,
    courseId: slot.courseId,
    name: slot.name,
    courseType: slot.courseType,
    lecturerName: slot.lecturerName,
    studentSet: slot.studentSet,
    roomId: slot.roomId,
  };
}

function formatZeit(minutenSeitMitternacht: number): string {
  const stunden = Math.floor(minutenSeitMitternacht / 60);
  const minuten = minutenSeitMitternacht % 60;
  return `${String(stunden).padStart(2, '0')}:${String(minuten).padStart(2, '0')}`;
}

export function PlanungScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ module?: string }>();

  const { einrichtung, loaded: einrichtungGeladen } = useEinrichtung();
  const { entries, loaded: planGeladen, mehrereUebernehmen } = useScheduleEntries();
  const { studiengaenge } = useStudiengaenge();

  const gewaehlteEndpunkte = useMemo(
    () =>
      studiengaenge
        .filter((s) => einrichtung.endpunkte.includes(s.sname))
        .map((s) => ({ sname: s.sname, name: s.name })),
    [studiengaenge, einrichtung.endpunkte],
  );
  const termineQuery = useTermineFuerEndpunkte(gewaehlteEndpunkte);

  const alleModule = useMemo(
    () => baueModulliste(termineQuery.perEndpunkt).flatMap((a) => a.module),
    [termineQuery.perEndpunkt],
  );

  // Requirement „Erneuter Aufruf": Module, die entweder frisch aus der
  // Kursauswahl mitgegeben wurden (`module`-Routenparameter) oder bereits
  // Planeinträge tragen, bleiben erreichbar — ohne die Modulauswahl zu wiederholen.
  const routeModulKeys = useMemo(
    () => (params.module ? params.module.split(',').filter((k) => k !== '') : []),
    [params.module],
  );
  const relevanteModule = useMemo(
    () => alleModule.filter((m) => routeModulKeys.includes(m.key) || planEintraegeFuerModul(entries, m).length > 0),
    [alleModule, routeModulKeys, entries],
  );
  const gespeicherterPlanRelevant = useMemo(
    () => relevanteModule.flatMap((m) => planEintraegeFuerModul(entries, m)),
    [relevanteModule, entries],
  );

  const [sessionEntscheidungen, setSessionEntscheidungen] = useState<OfficialPlanEntry[]>([]);
  const [entfernteIds, setEntfernteIds] = useState<ReadonlySet<string>>(new Set());
  const [festeSchluesselJeArt, setFesteSchluesselJeArt] = useState<Record<string, string>>({});
  // Requirement „Bewusste Übernahme trotz Konflikt": zusätzliche
  // `akzeptierteKonflikte`-Nennungen für bereits gespeicherte Einträge,
  // gesammelt bis zum Sichern (design.md, Entscheidung 6 — nichts wirkt vorher).
  const [gespeicherteAktualisierungen, setGespeicherteAktualisierungen] = useState<Record<string, string[]>>({});
  const [aktiverWochentag, setAktiverWochentag] = useState<Weekday>('Mon');
  const [hervorgehoben, setHervorgehoben] = useState<string | null>(null);
  const seedRef = useRef(false);

  const allesGeladen = einrichtungGeladen && planGeladen && termineQuery.alleGeladen;

  // Requirement „Vorbelegung eindeutiger Veranstaltungen": einmalig beim Öffnen.
  useEffect(() => {
    if (seedRef.current || !allesGeladen || relevanteModule.length === 0) return;
    seedRef.current = true;
    const vorbelegbar = vorbelegteSlots(relevanteModule).filter(
      (slot) => !gespeicherterPlanRelevant.some((e) => terminEntsprichtEintrag(slot, e)),
    );
    if (vorbelegbar.length > 0) setSessionEntscheidungen(vorbelegbar.map((slot) => baueSessionEintrag(slot, 'fest')));
  }, [allesGeladen, relevanteModule, gespeicherterPlanRelevant]);

  const gespeichertSichtbar = useMemo(
    () => gespeicherterPlanRelevant.filter((e) => !entfernteIds.has(e.id)),
    [gespeicherterPlanRelevant, entfernteIds],
  );
  const zwischenstand = useMemo(
    () => [...gespeichertSichtbar, ...sessionEntscheidungen],
    [gespeichertSichtbar, sessionEntscheidungen],
  );
  const planungsstand = useMemo(
    () => ermittlePlanungsstand(relevanteModule, zwischenstand),
    [relevanteModule, zwischenstand],
  );

  const hatUngesicherteAenderungen = sessionEntscheidungen.length > 0 || entfernteIds.size > 0;

  const sichern = useCallback(() => {
    const aktualisierungen = Object.entries(gespeicherteAktualisierungen).map(([id, zusaetzlich]) => ({
      id,
      patch: {
        akzeptierteKonflikte: [
          ...new Set([...(gespeichertSichtbar.find((e) => e.id === id)?.akzeptierteKonflikte ?? []), ...zusaetzlich]),
        ],
      },
    }));
    mehrereUebernehmen(sessionEntscheidungen, [...entfernteIds], aktualisierungen);
    setSessionEntscheidungen([]);
    setEntfernteIds(new Set());
    setFesteSchluesselJeArt({});
    setGespeicherteAktualisierungen({});
  }, [sessionEntscheidungen, entfernteIds, gespeicherteAktualisierungen, gespeichertSichtbar, mehrereUebernehmen]);

  // Requirement „Ausdrückliches Sichern der Planung": Speichern-Symbol in der
  // Kopfzeile (außerhalb dieses Komponentenbaums, `_layout.tsx`).
  useEffect(() => {
    registriereePlanungAktion({ hatUngesicherteAenderungen, sichern });
    return () => registriereePlanungAktion(null);
  }, [hatUngesicherteAenderungen, sichern]);

  // Requirement „Rückfrage beim Verlassen mit ungesicherten Änderungen".
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(null);
  usePreventRemove(hatUngesicherteAenderungen, ({ data }) => {
    setPendingAction(data.action);
  });

  function verlassenSichern() {
    sichern();
    if (pendingAction) navigation.dispatch(pendingAction);
    setPendingAction(null);
  }
  function verlassenVerwerfen() {
    setSessionEntscheidungen([]);
    setEntfernteIds(new Set());
    setGespeicherteAktualisierungen({});
    if (pendingAction) navigation.dispatch(pendingAction);
    setPendingAction(null);
  }
  function verlassenAbbrechen() {
    setPendingAction(null);
  }

  function terminUmschalten(modul: Modul, slot: OfficialTermin) {
    const gespeicherterTreffer = gespeichertSichtbar.find((e) => terminEntsprichtEintrag(slot, e));
    if (gespeicherterTreffer) {
      setEntfernteIds((bisher) => new Set([...bisher, gespeicherterTreffer.id]));
      return;
    }
    const sessionTreffer = sessionEntscheidungen.find((e) => terminEntsprichtEintrag(slot, e));
    if (sessionTreffer) {
      setSessionEntscheidungen((bisher) => bisher.filter((e) => e.id !== sessionTreffer.id));
      return;
    }

    const artSchluessel = `${modul.key}|${slot.courseType}`;
    const bereitsGespeicherteAnzahl = gespeichertSichtbar.filter(
      (e) => e.courseId === modul.courseId && e.courseType === slot.courseType,
    ).length;
    const neueSessionSlotsFuerArt = [
      ...sessionEntscheidungen.filter((e) => e.courseId === modul.courseId && e.courseType === slot.courseType),
      slot,
    ];
    const status = bestimmeStatus(
      bereitsGespeicherteAnzahl,
      neueSessionSlotsFuerArt,
      slot,
      festeSchluesselJeArt[artSchluessel],
    );
    const neu = baueSessionEintrag(slot, status);

    // Requirement „Bewusste Übernahme trotz Konflikt": eine Wahl trotz
    // erkannter Kollision bleibt möglich (kein Ausblenden, kein Verhindern,
    // Requirement „Kennzeichnung des Planungsstands je Veranstaltung") und
    // wird dauerhaft beidseitig als angenommener Konflikt festgehalten.
    if (status === 'fest') {
      const kollidierendeFeste = zwischenstand.filter(
        (e) =>
          e.status === 'fest' &&
          e.weekday === slot.weekday &&
          e.timeBeginMin < slot.timeEndMin &&
          slot.timeBeginMin < e.timeEndMin,
      );
      if (kollidierendeFeste.length > 0) {
        neu.akzeptierteKonflikte = kollidierendeFeste.map((e) => e.id);
        const sessionIds = new Set(sessionEntscheidungen.map((e) => e.id));
        setSessionEntscheidungen((bisher) =>
          bisher.map((e) =>
            kollidierendeFeste.some((k) => k.id === e.id)
              ? { ...e, akzeptierteKonflikte: [...new Set([...e.akzeptierteKonflikte, neu.id])] }
              : e,
          ),
        );
        const gespeicherteGegenparte = kollidierendeFeste.filter((e) => !sessionIds.has(e.id));
        if (gespeicherteGegenparte.length > 0) {
          setGespeicherteAktualisierungen((bisher) => {
            const naechster = { ...bisher };
            for (const e of gespeicherteGegenparte) {
              naechster[e.id] = [...new Set([...(naechster[e.id] ?? []), neu.id])];
            }
            return naechster;
          });
        }
      }
    }

    setSessionEntscheidungen((bisher) => [...bisher, neu]);
  }

  /** Requirement „Mehrere Gruppen-Slots übernehmen": legt fest, welcher von mehreren neu gewählten Slots „fest" ist. */
  function alsFestBestimmen(modul: Modul, slot: OfficialTermin) {
    const artSchluessel = `${modul.key}|${slot.courseType}`;
    const zielSchluessel = terminSchluessel(slot);
    setFesteSchluesselJeArt((bisher) => ({ ...bisher, [artSchluessel]: zielSchluessel }));
    setSessionEntscheidungen((bisher) =>
      bisher.map((e) =>
        e.courseId === modul.courseId && e.courseType === slot.courseType
          ? { ...e, status: terminSchluessel(e) === zielSchluessel ? 'fest' : 'vorgemerkt' }
          : e,
      ),
    );
  }

  function springeZu(slot: OfficialTermin) {
    setAktiverWochentag(slot.weekday);
    setHervorgehoben(terminSchluessel(slot));
  }

  if (!allesGeladen) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (relevanteModule.length === 0) {
    return (
      <Screen center>
        <MessageView
          symbol="—"
          title={t('schedule.planungLeerTitel')}
          body={t('schedule.planungLeerHinweis')}
          action={<AppButton label={t('schedule.weiterZurKursauswahl')} onPress={() => router.push('/kurse')} />}
        />
      </Screen>
    );
  }

  const zeilen = relevanteModule.flatMap((modul) => modul.termine.map((termin) => ({ modul, termin })));
  const zeilenDesTages = zeilen
    .filter((z) => z.termin.weekday === aktiverWochentag)
    .sort((a, b) => a.termin.timeBeginMin - b.termin.timeBeginMin);

  const ausstehend = planungsstand.filter((s) => s.stand !== 'gewaehlt');

  return (
    <Screen tight>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('schedule.planungZurKursauswahl')}
        onPress={() => router.push('/kurse')}
        style={styles.kursauswahlLink}
      >
        <Text style={{ color: colors.accent, fontWeight: '600' }}>{t('schedule.planungZurKursauswahl')}</Text>
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {WOCHENTAGE.map((tag) => {
          const aktiv = tag === aktiverWochentag;
          return (
            <Pressable
              key={tag}
              accessibilityRole="tab"
              accessibilityState={{ selected: aktiv }}
              accessibilityLabel={t(`schedule.weekdayLang.${tag}`)}
              onPress={() => setAktiverWochentag(tag)}
              style={[
                styles.tab,
                { borderColor: colors.border },
                aktiv && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
            >
              <Text style={{ color: aktiv ? colors.onAccent : colors.text, fontWeight: '600' }}>
                {t(`schedule.weekday.${tag}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.liste}>
        {zeilenDesTages.length === 0 ? (
          <MessageView symbol="—" title={t('schedule.planungTagLeerTitel')} style={styles.tagLeer} />
        ) : (
          zeilenDesTages.map(({ modul, termin }) => (
            <TerminZeile
              key={terminSchluessel(termin)}
              modul={modul}
              termin={termin}
              gewaehlt={zwischenstand.some((e) => terminEntsprichtEintrag(termin, e))}
              status={zwischenstand.find((e) => terminEntsprichtEintrag(termin, e))?.status ?? null}
              stand={planungsstand.find((s) => s.modulKey === modul.key && s.art === termin.courseType)}
              eigeneGruppe={gruppenzugehoerig(einrichtung.gruppenkennung, termin.studentSet)}
              konfliktstufe={pruefeKandidatGegenZwischenstand(
                termin,
                zwischenstand.filter((e) => !terminEntsprichtEintrag(termin, e)),
              )}
              hervorgehoben={hervorgehoben === terminSchluessel(termin)}
              onUmschalten={() => terminUmschalten(modul, termin)}
              onAlsFestBestimmen={() => alsFestBestimmen(modul, termin)}
            />
          ))
        )}
      </ScrollView>

      <AusstehendLeiste ausstehend={ausstehend} zwischenstand={zwischenstand} onSpringeZu={springeZu} />

      <AppButton
        variant="secondary"
        label={t('schedule.terminAnlegen')}
        onPress={() => router.push({ pathname: '/termin', params: { wochentag: aktiverWochentag } })}
      />

      {pendingAction ? (
        <View style={[styles.verlassenBestaetigung, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={{ color: colors.text }}>{t('schedule.planungVerlassenFrage')}</Text>
          <View style={styles.verlassenAktionen}>
            <AppButton label={t('schedule.planungVerlassenSichern')} onPress={verlassenSichern} />
            <AppButton
              variant="destructive"
              label={t('schedule.planungVerlassenVerwerfen')}
              onPress={verlassenVerwerfen}
            />
            <AppButton
              variant="secondary"
              label={t('schedule.planungVerlassenZurueck')}
              onPress={verlassenAbbrechen}
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function TerminZeile({
  modul,
  termin,
  gewaehlt,
  status,
  stand,
  eigeneGruppe,
  konfliktstufe,
  hervorgehoben,
  onUmschalten,
  onAlsFestBestimmen,
}: {
  modul: Modul;
  termin: OfficialTermin;
  gewaehlt: boolean;
  status: PlanEntry['status'] | null;
  stand: VeranstaltungsartStand | undefined;
  eigeneGruppe: boolean;
  konfliktstufe: 'konfliktfrei' | 'konflikt' | 'vorgemerkterKonflikt';
  hervorgehoben: boolean;
  onUmschalten: () => void;
  onAlsFestBestimmen: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const kennzeichen: string[] = [];
  if (!gewaehlt && stand && stand.stand !== 'gewaehlt') kennzeichen.push(t('schedule.planungZeileNichtEingeplant'));
  if (stand && stand.stand === 'gewaehlt' && stand.gewaehlteSlots.length > 1) {
    kennzeichen.push(t('schedule.planungZeileZugewiesen', { count: stand.gewaehlteSlots.length }));
  }
  if (!gewaehlt && konfliktstufe === 'konflikt') kennzeichen.push(t('schedule.planungZeileKonflikt'));
  if (!gewaehlt && konfliktstufe === 'vorgemerkterKonflikt') {
    kennzeichen.push(t('schedule.planungZeileVorgemerkterKonflikt'));
  }
  if (eigeneGruppe) kennzeichen.push(t('schedule.planungEigeneGruppe'));
  if (gewaehlt && status === 'vorgemerkt') kennzeichen.push(t('schedule.kennzeichenVorgemerkt'));

  return (
    <View
      style={[
        styles.zeile,
        { borderColor: colors.border },
        hervorgehoben && { borderColor: colors.accent, borderWidth: 2 },
      ]}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: gewaehlt }}
        accessibilityLabel={`${formatZeit(termin.timeBeginMin)}–${formatZeit(termin.timeEndMin)} ${modul.name} ${termin.courseType}`}
        onPress={onUmschalten}
        style={styles.zeileInhalt}
      >
        <Text style={{ color: gewaehlt ? colors.accent : colors.border, fontSize: 18, width: 24 }}>
          {gewaehlt ? '☑' : '☐'}
        </Text>
        <View style={styles.zeileText}>
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {`${formatZeit(termin.timeBeginMin)}–${formatZeit(termin.timeEndMin)} · ${modul.name}`}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {`${termin.courseType} · ${termin.roomId}`}
          </Text>
          {kennzeichen.length > 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{kennzeichen.join(' · ')}</Text>
          ) : null}
        </View>
      </Pressable>
      {gewaehlt && status === 'vorgemerkt' ? (
        <Pressable accessibilityRole="button" onPress={onAlsFestBestimmen} style={styles.alsFest}>
          <Text style={{ color: colors.accent, fontSize: 12 }}>{t('schedule.planungAlsFestFestlegen')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AusstehendLeiste({
  ausstehend,
  zwischenstand,
  onSpringeZu,
}: {
  ausstehend: readonly VeranstaltungsartStand[];
  zwischenstand: readonly PlanEntry[];
  onSpringeZu: (slot: OfficialTermin) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (ausstehend.length === 0) {
    return (
      <View
        style={[styles.leisteRahmen, styles.leisteInhalt, { borderColor: colors.border }]}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: colors.textMuted }}>{t('schedule.planungNichtsAusstehend')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.leisteRahmen, { borderColor: colors.border }]}
      contentContainerStyle={styles.leisteInhalt}
    >
      {ausstehend.map((stand) => {
        const ersterSlot = stand.slots[0]!;
        // Requirement „Hinweis bei fehlender konfliktfreier Option": keine der
        // Optionen dieser Veranstaltungsart wäre gerade konfliktfrei wählbar.
        const keineKonfliktfreieOption = stand.slots.every(
          (slot) => pruefeKandidatGegenZwischenstand(slot, zwischenstand) === 'konflikt',
        );
        return (
          <Pressable
            key={`${stand.modulKey}|${stand.art}`}
            accessibilityRole="button"
            accessibilityLabel={`${stand.modulName} ${stand.art}`}
            onPress={() => onSpringeZu(ersterSlot)}
            style={[styles.ausstehendChip, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontSize: 13 }}>{`${stand.modulName} ${stand.art}`}</Text>
            {keineKonfliktfreieOption ? (
              <Text style={{ color: colors.danger, fontSize: 11 }}>
                {t('schedule.planungKeineKonfliktfreieOption')}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kursauswahlLink: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  tabs: { gap: 8, paddingVertical: 4 },
  tab: { minWidth: 48, minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  liste: { gap: 8, paddingVertical: 8 },
  tagLeer: { paddingVertical: 24 },
  zeile: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, minHeight: 44 },
  zeileInhalt: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 },
  zeileText: { flex: 1, gap: 2 },
  alsFest: { paddingHorizontal: 10, minHeight: 44, justifyContent: 'center' },
  // ScrollView-Kinderlayout (flexDirection/gap/alignItems) muss über
  // contentContainerStyle laufen, nicht über style (sonst Warning
  // "ScrollView child layout must be applied through the contentContainerStyle
  // prop") — daher getrennt von der Rahmenoptik der Leiste.
  leisteRahmen: { minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth },
  leisteInhalt: { flexDirection: 'row', gap: 8, paddingVertical: 8, alignItems: 'center' },
  ausstehendChip: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
    justifyContent: 'center',
  },
  verlassenBestaetigung: { position: 'absolute', left: 12, right: 12, bottom: 12, borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  verlassenAktionen: { gap: 8 },
});
