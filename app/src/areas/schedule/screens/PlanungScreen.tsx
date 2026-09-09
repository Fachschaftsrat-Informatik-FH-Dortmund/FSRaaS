import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation, usePreventRemove, type NavigationAction } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { useReducedMotion } from '@/ui/reducedMotion';
import { useStudiengaenge, useTermineFuerEndpunkte } from '../api';
import { useEinrichtung } from '../einrichtung';
import { farbeFuerVeranstaltung } from '../farbe';
import { gruppenzugehoerig } from '../groupMatch';
import { pruefeKandidatGegenZwischenstand } from '../konflikt';
import { baueModulliste, type Modul } from '../kursbaum';
import { registriereePlanungAktion } from '../planungAktion';
import {
  ermittlePlanungsstand,
  terminEntsprichtEintrag,
  terminSchluessel,
  vorbelegteSlots,
  type VeranstaltungsartStand,
} from '../planungsstand';
import { useScheduleEntries } from '../planStore';
import type { OfficialPlanEntry, OfficialTermin, PlanEntry, Weekday } from '../typen';
import { WochentagsLeiste } from '../ui/WochentagsLeiste';
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
//
// Der Planungsmodus kennt den Status „vorgemerkt"/„fest" nicht mehr — er
// entfällt mit dem Requirement gleichen Namens (Issue #62, 2026-09-08): jeder
// hinzugefügte Termin ist gleichrangig hinzugefügt (Requirement „Mehrere
// Gruppen-Slots übernehmen"), ein deaktivierter Termin erscheint hier wie
// jeder andere hinzugefügte (Requirement „Wirkung eines deaktivierten
// Termins").

const WOCHENTAGE: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HERVORHEBUNG_DAUER_MS = 1500;

function neueId(): string {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function baueSessionEintrag(slot: OfficialTermin): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    id: neueId(),
    deaktiviertBis: null,
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
  const params = useLocalSearchParams<{ module?: string }>();
  const jetztSek = Math.floor(Date.now() / 1000);

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
  // Requirement „Bewusste Übernahme trotz Konflikt": zusätzliche
  // `akzeptierteKonflikte`-Nennungen für bereits gespeicherte Einträge,
  // gesammelt bis zum Sichern (design.md, Entscheidung 6 — nichts wirkt vorher).
  const [gespeicherteAktualisierungen, setGespeicherteAktualisierungen] = useState<Record<string, string[]>>({});
  const [aktiverWochentag, setAktiverWochentag] = useState<Weekday>('Mon');
  const [hervorgehoben, setHervorgehoben] = useState<string | null>(null);
  const [gesichert, setGesichert] = useState(false);
  const [verwerfenBestaetigen, setVerwerfenBestaetigen] = useState(false);
  const seedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const zeilenPositionen = useRef<Map<string, number>>(new Map());
  const scrollZielRef = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();

  const allesGeladen = einrichtungGeladen && planGeladen && termineQuery.alleGeladen;

  // Requirement „Vorbelegung eindeutiger Veranstaltungen": einmalig beim Öffnen.
  useEffect(() => {
    if (seedRef.current || !allesGeladen || relevanteModule.length === 0) return;
    seedRef.current = true;
    const vorbelegbar = vorbelegteSlots(relevanteModule).filter(
      (slot) => !gespeicherterPlanRelevant.some((e) => terminEntsprichtEintrag(slot, e)),
    );
    if (vorbelegbar.length > 0) setSessionEntscheidungen(vorbelegbar.map((slot) => baueSessionEintrag(slot)));
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

  const verwerfeZwischenstand = useCallback(() => {
    setSessionEntscheidungen([]);
    setEntfernteIds(new Set());
    setGespeicherteAktualisierungen({});
  }, []);

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
    verwerfeZwischenstand();
    setGesichert(true);
  }, [sessionEntscheidungen, entfernteIds, gespeicherteAktualisierungen, gespeichertSichtbar, mehrereUebernehmen, verwerfeZwischenstand]);

  // Requirement „Ausdrückliches Sichern der Planung": Sichern muss den
  // Zustandslauf abschließen, bevor navigiert wird — sonst fängt die
  // Rückfrage „ungesicherte Änderungen" (unten) die eigene Sicherung ab
  // (design.md, Entscheidung 13).
  useEffect(() => {
    if (!gesichert) return;
    router.replace('/');
  }, [gesichert, router]);

  // Requirement „Ausdrückliches Sichern der Planung": Speichern-Symbol in der
  // Kopfzeile (außerhalb dieses Komponentenbaums, `_layout.tsx"). Requirement
  // „Verwerfen der Auswahl im Planungsmodus": zweites Symbol daneben.
  useEffect(() => {
    registriereePlanungAktion({
      hatUngesicherteAenderungen,
      sichern,
      verwerfen: () => setVerwerfenBestaetigen(true),
    });
    return () => registriereePlanungAktion(null);
  }, [hatUngesicherteAenderungen, sichern]);

  // Requirement „Rückfrage beim Verlassen mit ungesicherten Änderungen".
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(null);
  usePreventRemove(hatUngesicherteAenderungen && !gesichert, ({ data }) => {
    setPendingAction(data.action);
  });

  function verlassenSichern() {
    sichern();
    if (pendingAction) navigation.dispatch(pendingAction);
    setPendingAction(null);
  }
  function verlassenVerwerfen() {
    verwerfeZwischenstand();
    if (pendingAction) navigation.dispatch(pendingAction);
    setPendingAction(null);
  }
  function verlassenAbbrechen() {
    setPendingAction(null);
  }

  function terminUmschalten(_modul: Modul, slot: OfficialTermin) {
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

    const neu = baueSessionEintrag(slot);

    // Requirement „Bewusste Übernahme trotz Konflikt": eine Wahl trotz
    // erkannter Kollision bleibt möglich (kein Ausblenden, kein Verhindern,
    // Requirement „Kennzeichnung des Planungsstands je Veranstaltung") und
    // wird dauerhaft beidseitig als angenommener Konflikt festgehalten. Ein
    // deaktivierter Termin des gesicherten Plans zählt dabei nicht als
    // Kollisionspartner (Requirement „Konfliktprüfung paralleler Termine").
    const kollidierende = zwischenstand.filter(
      (e) =>
        e.weekday === slot.weekday &&
        e.timeBeginMin < slot.timeEndMin &&
        slot.timeBeginMin < e.timeEndMin &&
        (e.kind !== 'offiziell' || e.deaktiviertBis === null),
    );
    if (kollidierende.length > 0) {
      neu.akzeptierteKonflikte = kollidierende.map((e) => e.id);
      const sessionIds = new Set(sessionEntscheidungen.map((e) => e.id));
      setSessionEntscheidungen((bisher) =>
        bisher.map((e) =>
          kollidierende.some((k) => k.id === e.id)
            ? { ...e, akzeptierteKonflikte: [...new Set([...e.akzeptierteKonflikte, neu.id])] }
            : e,
        ),
      );
      const gespeicherteGegenparte = kollidierende.filter((e) => !sessionIds.has(e.id));
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

    setSessionEntscheidungen((bisher) => [...bisher, neu]);
  }

  // Requirement „Leiste der ausstehenden Veranstaltungen": Sprung mit
  // kurzzeitiger Hervorhebung und Scrollen ins Sichtfeld (design.md,
  // Entscheidung 10).
  function springeZu(slot: OfficialTermin) {
    const ziel = terminSchluessel(slot);
    setAktiverWochentag(slot.weekday);
    scrollZielRef.current = ziel;
    setHervorgehoben(ziel);
    const position = zeilenPositionen.current.get(ziel);
    if (position !== undefined) {
      scrollRef.current?.scrollTo({ y: position, animated: !reducedMotion });
    }
  }

  // Requirement „Hervorhebung nach dem Sprung": kehrt von selbst in den
  // Normalzustand zurück.
  useEffect(() => {
    if (hervorgehoben === null) return;
    const timer = setTimeout(() => setHervorgehoben(null), HERVORHEBUNG_DAUER_MS);
    return () => clearTimeout(timer);
  }, [hervorgehoben]);

  function zeileGelayoutet(schluessel: string, y: number) {
    zeilenPositionen.current.set(schluessel, y);
    if (scrollZielRef.current === schluessel) {
      scrollRef.current?.scrollTo({ y, animated: !reducedMotion });
      scrollZielRef.current = null;
    }
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
      <WochentagsLeiste
        aktiverWochentag={aktiverWochentag}
        onWaehle={setAktiverWochentag}
        eintraege={WOCHENTAGE.map((tag) => ({
          wochentag: tag,
          accessibilityLabel: t(`schedule.weekdayLang.${tag}`),
          inhalt: <PlanungTagEintrag tag={tag} aktiv={tag === aktiverWochentag} />,
        }))}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.liste}>
        {zeilenDesTages.length === 0 ? (
          <MessageView symbol="—" title={t('schedule.planungTagLeerTitel')} style={styles.tagLeer} />
        ) : (
          zeilenDesTages.map(({ modul, termin }) => (
            <TerminZeile
              key={terminSchluessel(termin)}
              modul={modul}
              termin={termin}
              gewaehlt={zwischenstand.some((e) => terminEntsprichtEintrag(termin, e))}
              stand={planungsstand.find((s) => s.modulKey === modul.key && s.art === termin.courseType)}
              eigeneGruppe={gruppenzugehoerig(einrichtung.gruppenkennung, termin.studentSet)}
              konfliktstufe={pruefeKandidatGegenZwischenstand(
                termin,
                zwischenstand.filter((e) => !terminEntsprichtEintrag(termin, e)),
                jetztSek,
              )}
              hervorgehoben={hervorgehoben === terminSchluessel(termin)}
              onLayout={(y) => zeileGelayoutet(terminSchluessel(termin), y)}
              onUmschalten={() => terminUmschalten(modul, termin)}
            />
          ))
        )}
      </ScrollView>

      <AusstehendLeiste
        ausstehend={ausstehend}
        zwischenstand={zwischenstand}
        jetztSek={jetztSek}
        gruppenkennung={einrichtung.gruppenkennung}
        onSpringeZu={springeZu}
        onAnlegen={() =>
          router.push({ pathname: '/termin', params: { wochentag: aktiverWochentag, planung: '1' } })
        }
      />

      {verwerfenBestaetigen ? (
        <VerwerfenBestaetigung
          onBestaetigen={() => {
            verwerfeZwischenstand();
            setVerwerfenBestaetigen(false);
          }}
          onAbbrechen={() => setVerwerfenBestaetigen(false)}
        />
      ) : null}

      {pendingAction ? (
        <VerlassenBestaetigung
          onSichern={verlassenSichern}
          onVerwerfen={verlassenVerwerfen}
          onAbbrechen={verlassenAbbrechen}
        />
      ) : null}
    </Screen>
  );
}

function VerwerfenBestaetigung({
  onBestaetigen,
  onAbbrechen,
}: {
  onBestaetigen: () => void;
  onAbbrechen: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.verlassenBestaetigung, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>{t('schedule.planungVerwerfenFrage')}</Text>
      <View style={styles.verlassenAktionen}>
        <AppButton variant="destructive" label={t('schedule.planungVerwerfenBestaetigen')} onPress={onBestaetigen} />
        <AppButton variant="secondary" label={t('common.cancel')} onPress={onAbbrechen} />
      </View>
    </View>
  );
}

function VerlassenBestaetigung({
  onSichern,
  onVerwerfen,
  onAbbrechen,
}: {
  onSichern: () => void;
  onVerwerfen: () => void;
  onAbbrechen: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.verlassenBestaetigung, { borderColor: colors.border, backgroundColor: colors.background }]}>
      <Text style={{ color: colors.text }}>{t('schedule.planungVerlassenFrage')}</Text>
      <View style={styles.verlassenAktionen}>
        <AppButton label={t('schedule.planungVerlassenSichern')} onPress={onSichern} />
        <AppButton variant="destructive" label={t('schedule.planungVerlassenVerwerfen')} onPress={onVerwerfen} />
        <AppButton variant="secondary" label={t('schedule.planungVerlassenZurueck')} onPress={onAbbrechen} />
      </View>
    </View>
  );
}

function PlanungTagEintrag({ tag, aktiv }: { tag: Weekday; aktiv: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Text style={{ color: aktiv ? colors.onAccent : colors.text, fontWeight: '600' }}>
      {t(`schedule.weekday.${tag}`)}
    </Text>
  );
}

function TerminZeile({
  modul,
  termin,
  gewaehlt,
  stand,
  eigeneGruppe,
  konfliktstufe,
  hervorgehoben,
  onLayout,
  onUmschalten,
}: {
  modul: Modul;
  termin: OfficialTermin;
  gewaehlt: boolean;
  stand: VeranstaltungsartStand | undefined;
  eigeneGruppe: boolean;
  konfliktstufe: 'konfliktfrei' | 'konflikt';
  hervorgehoben: boolean;
  onLayout: (y: number) => void;
  onUmschalten: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Requirement „Unterscheidung abgeleiteter Angaben von Quelldaten": eigene,
  // abgesetzte dritte Zeile mit vorangestelltem Symbol für die Schlüsse der
  // App — getrennt von Zeit, Bezeichnung, Art, Raum und lehrender Person, die
  // unverändert aus INT-002 stammen (design.md, Entscheidung 11).
  const abgeleitet: string[] = [];
  if (!gewaehlt && stand && stand.stand !== 'gewaehlt') abgeleitet.push(t('schedule.planungZeileNichtEingeplant'));
  if (stand && stand.stand === 'gewaehlt' && stand.gewaehlteSlots.length > 1) {
    abgeleitet.push(t('schedule.planungZeileZugewiesen', { count: stand.gewaehlteSlots.length }));
  }
  if (!gewaehlt && konfliktstufe === 'konflikt') abgeleitet.push(t('schedule.planungZeileKonflikt'));
  if (eigeneGruppe) abgeleitet.push(t('schedule.planungEigeneGruppe'));
  if (gewaehlt) abgeleitet.push(t('schedule.planungGewaehlt'));

  return (
    <View
      testID={`zeile-${terminSchluessel(termin)}`}
      onLayout={(e) => onLayout(e.nativeEvent.layout.y)}
      style={[
        styles.zeile,
        { borderColor: colors.border },
        eigeneGruppe && { backgroundColor: `${colors.accent}22` },
        // Requirement „Kennzeichnung gewählter Termine im Planungsmodus": eine
        // farbige Umrandung der gesamten Zeile, zusätzlich zum Symbol.
        gewaehlt && { borderColor: colors.accent, borderWidth: 2 },
        hervorgehoben && { borderColor: colors.text, borderWidth: 3 },
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
            {/* Requirement „Lehrende Person in der Terminzeile des Planungsmodus" */}
            {[termin.courseType, termin.roomId, termin.lecturerName || null].filter(Boolean).join(' · ')}
          </Text>
          {abgeleitet.length > 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{`ⓘ ${abgeleitet.join(' · ')}`}</Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function AusstehendLeiste({
  ausstehend,
  zwischenstand,
  jetztSek,
  gruppenkennung,
  onSpringeZu,
  onAnlegen,
}: {
  ausstehend: readonly VeranstaltungsartStand[];
  zwischenstand: readonly PlanEntry[];
  jetztSek: number;
  gruppenkennung: string | null;
  onSpringeZu: (slot: OfficialTermin) => void;
  onAnlegen: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.leiste, { borderColor: colors.border }]}>
      {/* Requirement „Leiste der ausstehenden Veranstaltungen": „+" als fester
       * erster Eintrag links, außerhalb des scrollenden Inhalts. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('schedule.planungAusstehendAnlegen')}
        onPress={onAnlegen}
        style={[styles.ausstehendPlus, { borderColor: colors.border }]}
      >
        <Text style={{ color: colors.accent, fontSize: 20, fontWeight: '700' }}>+</Text>
      </Pressable>

      {ausstehend.length === 0 ? (
        <View style={styles.ausstehendInhalt} accessibilityLiveRegion="polite">
          <Text style={{ color: colors.textMuted }}>{t('schedule.planungNichtsAusstehend')}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.ausstehendScroll}
          contentContainerStyle={styles.leisteInhalt}
        >
          {ausstehend.map((stand) => {
            // Requirement „Leiste der ausstehenden Veranstaltungen": Sprungziel
            // ist der erste Slot der eigenen Gruppe, sonst der erste Slot der
            // Liste (design.md, Entscheidung 10) — Prüfprotokoll 2026-09-09.
            const zielSlot =
              stand.slots.find((slot) => gruppenzugehoerig(gruppenkennung, slot.studentSet)) ?? stand.slots[0]!;
            // Requirement „Hinweis bei fehlender konfliktfreier Option": keine
            // der Optionen dieser Veranstaltungsart wäre gerade konfliktfrei
            // wählbar. Das Symbol trägt die Bedeutung zusätzlich als Text im
            // `accessibilityLabel` (design.md, Entscheidung 9).
            const keineKonfliktfreieOption = stand.slots.every(
              (slot) => pruefeKandidatGegenZwischenstand(slot, zwischenstand, jetztSek) === 'konflikt',
            );
            const label = [
              `${stand.modulName} ${stand.art}`,
              keineKonfliktfreieOption ? t('schedule.planungKeineKonfliktfreieOption') : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <Pressable
                key={`${stand.modulKey}|${stand.art}`}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => onSpringeZu(zielSlot)}
                style={[styles.ausstehendChip, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.text, fontSize: 13 }}>{`${stand.modulName} ${stand.art}`}</Text>
                {keineKonfliktfreieOption ? <Text style={{ color: colors.danger, fontSize: 13 }}>⚠</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  liste: { gap: 8, paddingVertical: 8 },
  tagLeer: { paddingVertical: 24 },
  zeile: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, minHeight: 44 },
  zeileInhalt: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8 },
  zeileText: { flex: 1, gap: 2 },
  // Requirement „Leiste der ausstehenden Veranstaltungen": feste Höhe,
  // unabhängig von Wochentag und Inhalt.
  leiste: { height: 68, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'stretch' },
  ausstehendPlus: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  ausstehendScroll: { flex: 1 },
  ausstehendInhalt: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 },
  leisteInhalt: { gap: 8, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center' },
  ausstehendChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  verlassenBestaetigung: { position: 'absolute', left: 12, right: 12, bottom: 12, borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  verlassenAktionen: { gap: 8, flexDirection: 'row', flexWrap: 'wrap' },
});
