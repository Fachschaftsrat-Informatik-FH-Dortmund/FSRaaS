import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation, usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { useTheme } from '@/theme';
import { SCHEDULE_NEUTRAL } from '@/theme/tokens';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { useReducedMotion } from '@/ui/reducedMotion';
import { useStudiengaenge, useTermineFuerEndpunkte } from '../api';
import { useAnsichtEinstellungen, type AnsichtEinstellungen, type Hervorhebung } from '../ansichtEinstellungen';
import { useEinrichtung } from '../einrichtung';
import { farbeFuerVeranstaltung } from '../farbe';
import { gruppenzugehoerig } from '../groupMatch';
import { pruefeKandidatGegenZwischenstand } from '../konflikt';
import { baueModulliste, type Modul } from '../kursbaum';
import { registriereePlanungAktion } from '../planungAktion';
import {
  parameterAus,
  rangfolgeAus,
  usePlanungsEinstellungen,
  voreinstellungAus,
  type Zeitfenster,
} from '../planungseinstellungen';
import { einteilungNachGruppe, erzeugeVorschlag, type ReihenErgebnis } from '../planungsvorschlag';
import { groessteSpaltenzahl, legePlanungsTagAus } from '../planungZeitachse';
import {
  ermittlePlanungsstand,
  planEintraegeFuerModul,
  terminEntsprichtEintrag,
  terminSchluessel,
  vorbelegteSlots,
  zeilenStand,
  type VeranstaltungsartStand,
  type ZeilenStand,
} from '../planungsstand';
import { useScheduleEntries } from '../planStore';
import type { OfficialPlanEntry, OfficialTermin, PlanEntry, Weekday } from '../typen';
import { WochentagsLeiste } from '../ui/WochentagsLeiste';

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
/** Change `planungsmodus-zeitachse`, design.md Entscheidung 2: Maßstab wie in der Wochenansicht. */
const DP_JE_MINUTE = 1.5;
/** Ebenda, Entscheidung 3: darunter wird die Achse breiter statt die Kachel schmaler. */
const MIN_SPALTENBREITE = 120;

function neueId(): string {
  return `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Requirement „Farbwahl je Termin": ein neuer Eintrag erhält
 * ein neu angelegter Termin eine neutrale Platzhalterfarbe statt der
 * automatisch berechneten — bereits gesetzte Farben bleiben davon unberührt,
 * da diese Funktion nur beim Anlegen greift (`ansichtEinstellungen.ts`).
 */
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

/**
 * Kennung einer Zeile des Planungsmodus: der Rohtermin (`terminSchluessel`)
 * im Kontext seines Moduls. Derselbe Rohtermin kann in zwei gewählten Modulen
 * stehen (Change `planungsmodus-mehrfachauswahl-defekt`, design.md
 * Entscheidungen 2 und 3) — erst der Modulschlüssel macht React-Schlüssel und
 * Sprungziel eindeutig.
 */
function zeilenKennung(modulKey: string, termin: OfficialTermin): string {
  return `${terminSchluessel(termin)}#${modulKey}`;
}

function dauerText(minuten: number, t: TFunction): string {
  const stunden = Math.floor(minuten / 60);
  const rest = minuten % 60;
  if (stunden === 0) return t('schedule.dauerMinuten', { count: rest });
  if (rest === 0) return t('schedule.dauerStunden', { count: stunden });
  return t('schedule.dauerStundenMinuten', { stunden, minuten: rest });
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
  const { einstellungen: ansichtEinstellungen, toggleHervorhebung } = useAnsichtEinstellungen();
  // Die Planungseinstellungen gehen erst beim Auslösen des Vorschlags ein;
  // bis sie geladen sind, gelten ihre Vorgaben — kein eigener Ladezustand.
  const { einstellungen: planungsEinstellungen, zeitachseUmschalten } = usePlanungsEinstellungen();

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
  // Requirement „Anpinnen eines Termins": geänderte Pins bereits gespeicherter
  // Einträge, gesammelt bis zum Sichern wie die Konfliktannahmen (Change
  // `planungsmodus-voreinstellungen-anpinnen`, design.md Entscheidung 6).
  const [anpinnAenderungen, setAnpinnAenderungen] = useState<Record<string, boolean>>({});
  // Requirement „Automatischer Planungsvorschlag", Szenario „Nicht angepinnter
  // Termin wird umgelegt": vom Vorschlag gesetzte Termine (`terminSchluessel`),
  // ausgewiesen bis zum Verlassen oder Verwerfen.
  const [vorschlagMarken, setVorschlagMarken] = useState<ReadonlySet<string>>(new Set());
  const [vorschlagHinweis, setVorschlagHinweis] = useState<{ text: string; zuEinstellungen: boolean } | null>(null);
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
    // Derselbe Rohtermin kann als einziger Slot seiner Art in mehreren Modulen
    // stehen — er wird nur einmal vorbelegt (Change
    // `planungsmodus-mehrfachauswahl-defekt`, design.md Entscheidung 3).
    const vorbelegbar = vorbelegteSlots(relevanteModule).filter(
      (slot, index, alle) =>
        !gespeicherterPlanRelevant.some((e) => terminEntsprichtEintrag(slot, e)) &&
        alle.findIndex((s) => terminSchluessel(s) === terminSchluessel(slot)) === index,
    );
    if (vorbelegbar.length > 0) {
      setSessionEntscheidungen(vorbelegbar.map((slot) => baueSessionEintrag(slot)));
    }
  }, [allesGeladen, relevanteModule, gespeicherterPlanRelevant, ansichtEinstellungen.farbautomatik]);

  const gespeichertSichtbar = useMemo(
    () =>
      gespeicherterPlanRelevant
        .filter((e) => !entfernteIds.has(e.id))
        .map((e) => (e.id in anpinnAenderungen ? { ...e, angepinnt: anpinnAenderungen[e.id] } : e)),
    [gespeicherterPlanRelevant, entfernteIds, anpinnAenderungen],
  );
  const zwischenstand = useMemo(
    () => [...gespeichertSichtbar, ...sessionEntscheidungen],
    [gespeichertSichtbar, sessionEntscheidungen],
  );
  const planungsstand = useMemo(
    () => ermittlePlanungsstand(relevanteModule, zwischenstand),
    [relevanteModule, zwischenstand],
  );

  const hatUngesicherteAenderungen =
    sessionEntscheidungen.length > 0 || entfernteIds.size > 0 || Object.keys(anpinnAenderungen).length > 0;

  const verwerfeZwischenstand = useCallback(() => {
    setSessionEntscheidungen([]);
    setEntfernteIds(new Set());
    setGespeicherteAktualisierungen({});
    setAnpinnAenderungen({});
    setVorschlagMarken(new Set());
  }, []);

  const sichern = useCallback(() => {
    const patches = new Map<string, Partial<PlanEntry>>();
    for (const [id, zusaetzlich] of Object.entries(gespeicherteAktualisierungen)) {
      patches.set(id, {
        akzeptierteKonflikte: [
          ...new Set([...(gespeichertSichtbar.find((e) => e.id === id)?.akzeptierteKonflikte ?? []), ...zusaetzlich]),
        ],
      });
    }
    for (const [id, angepinnt] of Object.entries(anpinnAenderungen)) {
      if (entfernteIds.has(id)) continue;
      patches.set(id, { ...patches.get(id), angepinnt });
    }
    const aktualisierungen = [...patches].map(([id, patch]) => ({ id, patch }));
    mehrereUebernehmen(sessionEntscheidungen, [...entfernteIds], aktualisierungen);
    verwerfeZwischenstand();
    setGesichert(true);
  }, [
    sessionEntscheidungen,
    entfernteIds,
    gespeicherteAktualisierungen,
    anpinnAenderungen,
    gespeichertSichtbar,
    mehrereUebernehmen,
    verwerfeZwischenstand,
  ]);

  // Requirement „Ausdrückliches Sichern der Planung": Sichern muss den
  // Zustandslauf abschließen, bevor navigiert wird — sonst fängt die
  // Rückfrage „ungesicherte Änderungen" (unten) die eigene Sicherung ab
  // (design.md, Entscheidung 13).
  //
  // Requirement „Kein Rückweg in den Planungsmodus nach dem Sichern" (Change
  // `planungsmodus-anzeige`, design.md Entscheidung 6): `dismissTo` räumt den
  // Stapel bis zur vorhandenen Wochenansicht ab. `replace` legte eine zweite
  // Wochenansicht über Modulauswahl und Gruppenkennung — mit Zurück-Pfeil.
  //
  // Der Navigationsaufruf selbst liegt einen Frame hinter dem Zustandslauf
  // (Change `planungsmodus-sichern-absturz`, design.md Entscheidung 2): so ist
  // das Abmelden der Kopfzeilen-Aktion (unten) vollständig committet, bevor
  // react-native-screens auf Android die Fragment-Transaktion beginnt. Ohne
  // diesen Versatz treffen beide nativen Mutationen aufeinander
  // (`IllegalStateException: ScreenStackFragment added into a fragment manager
  // for a different fragment`).
  useEffect(() => {
    if (!gesichert) return;
    requestAnimationFrame(() => router.dismissTo('/'));
  }, [gesichert, router]);

  // Requirement „Ausdrückliches Sichern der Planung": Speichern-Symbol in der
  // Kopfzeile (außerhalb dieses Komponentenbaums, `_layout.tsx"). Requirement
  // „Verwerfen der Auswahl im Planungsmodus": zweites Symbol daneben.
  //
  // Nach dem Sichern wird die Kopfzeilen-Aktion einmalig abgemeldet und nicht
  // wieder registriert (Change `planungsmodus-sichern-absturz`, design.md
  // Entscheidung 1) — auch nicht beim späteren Unmount. Sonst mutiert dieser
  // Effekt die Kopfzeile erneut, während der Bildschirm bereits verlassen wird.
  useEffect(() => {
    if (gesichert) {
      registriereePlanungAktion(null);
      return undefined;
    }
    registriereePlanungAktion({
      hatUngesicherteAenderungen,
      sichern,
      verwerfen: () => setVerwerfenBestaetigen(true),
    });
    return () => registriereePlanungAktion(null);
  }, [gesichert, hatUngesicherteAenderungen, sichern]);

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

  // Requirement „Anpinnen eines Termins": schaltet den Pin des gewählten
  // Eintrags zu diesem Termin um. Ein Sitzungseintrag trägt ihn sofort, ein
  // gespeicherter erst mit dem Sichern.
  function pinUmschalten(slot: OfficialTermin) {
    const sessionTreffer = sessionEntscheidungen.find((e) => terminEntsprichtEintrag(slot, e));
    if (sessionTreffer) {
      setSessionEntscheidungen((bisher) =>
        bisher.map((e) => (e.id === sessionTreffer.id ? { ...e, angepinnt: e.angepinnt !== true } : e)),
      );
      return;
    }
    const gespeicherterTreffer = gespeichertSichtbar.find((e) => terminEntsprichtEintrag(slot, e));
    if (!gespeicherterTreffer) return;
    const urspruenglich = gespeicherterPlanRelevant.find((e) => e.id === gespeicherterTreffer.id)?.angepinnt === true;
    const neu = gespeicherterTreffer.angepinnt !== true;
    setAnpinnAenderungen((bisher) => {
      const naechste = { ...bisher };
      if (neu === urspruenglich) delete naechste[gespeicherterTreffer.id];
      else naechste[gespeicherterTreffer.id] = neu;
      return naechste;
    });
  }

  /**
   * Requirements „Automatischer Planungsvorschlag" und „Rücknahme einer
   * übernommenen Optimierung" (design.md, Entscheidung 4): überträgt das
   * Ergebnis in den Zwischenstand. Termine, die bleiben, behalten ihren
   * Eintrag samt Kennung, Farbe und Pin; nichts wirkt vor dem Sichern.
   */
  function wendeErgebnisAn(ergebnisse: readonly ReihenErgebnis[], markieren: boolean): number {
    let session = [...sessionEntscheidungen];
    const entfernt = new Set(entfernteIds);
    const marken = new Set(markieren ? vorschlagMarken : []);
    let geaendert = 0;
    for (const r of ergebnisse) {
      if (!r.geaendert) continue;
      geaendert++;
      const nachherSchluessel = new Set(r.nachher.map(terminSchluessel));
      for (const t of r.vorher) {
        if (nachherSchluessel.has(terminSchluessel(t))) continue;
        for (const e of gespeicherterPlanRelevant) if (terminEntsprichtEintrag(t, e)) entfernt.add(e.id);
        session = session.filter((e) => !terminEntsprichtEintrag(t, e));
        marken.delete(terminSchluessel(t));
      }
      for (const t of r.nachher) {
        const gespeichert = gespeicherterPlanRelevant.find((e) => terminEntsprichtEintrag(t, e));
        if (gespeichert) {
          entfernt.delete(gespeichert.id);
        } else if (!session.some((e) => terminEntsprichtEintrag(t, e))) {
          session.push(baueSessionEintrag(t));
        }
        if (markieren && !r.vorher.some((v) => terminSchluessel(v) === terminSchluessel(t))) {
          marken.add(terminSchluessel(t));
        }
      }
    }
    setSessionEntscheidungen(session);
    setEntfernteIds(entfernt);
    setVorschlagMarken(marken);
    return geaendert;
  }

  function planungsEingabe() {
    const relevanteIds = new Set(gespeicherterPlanRelevant.map((e) => e.id));
    return {
      module: relevanteModule,
      zwischenstand,
      umgebung: entries.filter((e) => !relevanteIds.has(e.id)),
      gruppenkennung: einrichtung.gruppenkennung ?? '',
      jetztSek,
    };
  }

  function vorschlagErzeugen() {
    const ergebnisse = erzeugeVorschlag({
      ...planungsEingabe(),
      rangfolge: rangfolgeAus(planungsEinstellungen),
      parameter: parameterAus(planungsEinstellungen),
      pflichtModule: new Set(planungsEinstellungen.pflichtModule),
    });
    const geaendert = wendeErgebnisAn(ergebnisse, true);
    // Szenario „Keine konfliktfreie Konstellation": die beteiligten
    // Veranstaltungen benennen und auf die „Pflicht"-Markierung als Weg zum
    // Vorrang hinweisen (design.md, Entscheidung 8) — samt Bedienweg dorthin.
    const konflikte = ergebnisse.filter((r) => r.konfliktMit.length > 0);
    if (konflikte.length > 0) {
      const liste = konflikte
        .map((r) => `${r.reihe.modulName} ${r.reihe.art} ↔ ${r.konfliktMit.join(', ')}`)
        .join('\n');
      setVorschlagHinweis({ text: t('schedule.planungVorschlagKonflikt', { liste }), zuEinstellungen: true });
    } else if (geaendert === 0) {
      setVorschlagHinweis({ text: t('schedule.planungVorschlagUnveraendert'), zuEinstellungen: false });
    }
  }

  function nachGruppeEinteilen() {
    const geaendert = wendeErgebnisAn(einteilungNachGruppe(planungsEingabe()), false);
    if (geaendert === 0) {
      setVorschlagHinweis({ text: t('schedule.planungNachGruppeUnveraendert'), zuEinstellungen: false });
    }
  }

  // Requirement „Kandidat als Pflicht markieren": die Planungseinstellungen
  // erhalten die Kandidaten der laufenden Planung, um sie als Pflicht
  // markierbar zu machen (design.md, Entscheidung 8).
  function einstellungenOeffnen() {
    router.push({
      pathname: '/planung-einstellungen',
      params: { kandidaten: JSON.stringify(relevanteModule.map((m) => [m.key, m.name])) },
    });
  }

  // Requirement „Leiste der ausstehenden Veranstaltungen": Sprung mit
  // kurzzeitiger Hervorhebung und Scrollen ins Sichtfeld (design.md,
  // Entscheidung 10).
  function springeZu(modulKey: string, slot: OfficialTermin) {
    const ziel = zeilenKennung(modulKey, slot);
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

  // Requirement „Gruppenkennung verpflichtend vor dem Planungsmodus"
  // (design.md, Entscheidung 6.2): Der reguläre Weg führt über den Schritt zur
  // Gruppenkennung, ein Tiefeneinsprung kann ihn aber überspringen. Die Prüfung
  // steht deshalb am Bildschirm selbst und nicht allein am Bedienweg dorthin.
  if (einrichtung.gruppenkennung === null) {
    return (
      <Screen center>
        <MessageView
          symbol="—"
          title={t('schedule.gruppenkennungFehltTitel')}
          body={t('schedule.gruppenkennungFehlt')}
          action={
            <AppButton
              label={t('schedule.gruppenkennungFestlegen')}
              onPress={() => router.push({ pathname: '/gruppenkennung', params: { module: routeModulKeys.join(',') } })}
            />
          }
        />
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

  // Ab hier steht die Gruppenkennung fest (Wächter oben): als eigene Bindung
  // festgehalten, damit die Verengung auch in den Rückrufen des JSX gilt.
  const gruppenkennung: string = einrichtung.gruppenkennung;

  const zeilen = relevanteModule.flatMap((modul) => modul.termine.map((termin) => ({ modul, termin })));
  const zeilenDesTages = zeilen
    .filter((z) => z.termin.weekday === aktiverWochentag)
    .sort((a, b) => a.termin.timeBeginMin - b.termin.timeBeginMin);

  const ausstehend = planungsstand.filter((s) => s.stand !== 'gewaehlt');

  // Gemeinsame Zustände einer Zeile für Liste und Zeitachse (Change
  // `planungsmodus-zeitachse`, design.md Entscheidung 4: dieselben
  // Kennzeichnungen in beiden Darstellungen).
  function zeilenZustand(modul: Modul, termin: OfficialTermin): ZeilenZustand {
    const kennung = zeilenKennung(modul.key, termin);
    const gewaehlt = zwischenstand.some((e) => terminEntsprichtEintrag(termin, e));
    return {
      kennung,
      gewaehlt,
      angepinnt: zwischenstand.some((e) => terminEntsprichtEintrag(termin, e) && e.angepinnt === true),
      eigeneGruppe: gruppenzugehoerig(gruppenkennung, termin.studentSet),
      konfliktstufe: pruefeKandidatGegenZwischenstand(
        termin,
        zwischenstand.filter((e) => !terminEntsprichtEintrag(termin, e)),
        jetztSek,
      ),
      hervorgehoben: hervorgehoben === kennung,
    };
  }
  // Change `planungsmodus-rangfolge-frei`, design.md Entscheidung 1: eine
  // eigene Rangfolge trägt keinen Voreinstellungsnamen.
  const voreinstellung = voreinstellungAus(planungsEinstellungen);
  const voreinstellungsName =
    voreinstellung === null
      ? t('schedule.planungVoreinstellungEigene')
      : t(`schedule.planungVoreinstellung.${voreinstellung}`);

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

      <HervorhebungsSchalter einstellungen={ansichtEinstellungen} onUmschalten={toggleHervorhebung} />

      <Werkzeugzeile
        voreinstellung={voreinstellungsName}
        onEinstellungen={einstellungenOeffnen}
        onVorschlag={vorschlagErzeugen}
        onNachGruppe={nachGruppeEinteilen}
        zeitachse={planungsEinstellungen.zeitachse}
        onZeitachse={zeitachseUmschalten}
      />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.liste}>
        {zeilenDesTages.length === 0 ? (
          <MessageView symbol="—" title={t('schedule.planungTagLeerTitel')} style={styles.tagLeer} />
        ) : planungsEinstellungen.zeitachse ? (
          // Requirement „Zeitachse im Planungsmodus" (Change `planungsmodus-zeitachse`).
          <PlanungsZeitachse
            zeilen={zeilenDesTages}
            zustand={zeilenZustand}
            gruppenkennung={gruppenkennung}
            einstellungen={ansichtEinstellungen}
            onPosition={zeileGelayoutet}
            onUmschalten={terminUmschalten}
          />
        ) : (
          zeilenDesTages.map(({ modul, termin }) => {
            const zustand = zeilenZustand(modul, termin);
            return (
              <TerminZeile
                key={zustand.kennung}
                modul={modul}
                termin={termin}
                gewaehlt={zustand.gewaehlt}
                angepinnt={zustand.angepinnt}
                vomVorschlag={vorschlagMarken.has(terminSchluessel(termin))}
                onPinUmschalten={() => pinUmschalten(termin)}
                stand={planungsstand.find((s) => s.modulKey === modul.key && s.art === termin.courseType)}
                gruppenkennung={gruppenkennung}
                eigeneGruppe={zustand.eigeneGruppe}
                einstellungen={ansichtEinstellungen}
                zeitfenster={planungsEinstellungen.zeitfenster}
                konfliktstufe={zustand.konfliktstufe}
                hervorgehoben={zustand.hervorgehoben}
                onLayout={(y) => zeileGelayoutet(zustand.kennung, y)}
                onUmschalten={() => terminUmschalten(modul, termin)}
              />
            );
          })
        )}
      </ScrollView>

      <AusstehendLeiste
        ausstehend={ausstehend}
        zwischenstand={zwischenstand}
        jetztSek={jetztSek}
        gruppenkennung={gruppenkennung}
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

      {vorschlagHinweis !== null ? (
        <ConfirmDialog
          visible
          message={vorschlagHinweis.text}
          actions={[
            { label: t('schedule.planungHinweisVerstanden'), variant: 'primary', onPress: () => setVorschlagHinweis(null) },
            ...(vorschlagHinweis.zuEinstellungen
              ? [
                  {
                    label: t('schedule.planungZuEinstellungen'),
                    onPress: () => {
                      setVorschlagHinweis(null);
                      einstellungenOeffnen();
                    },
                  },
                ]
              : []),
          ]}
          onDismiss={() => setVorschlagHinweis(null)}
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

// Requirement „Bestätigungsdialoge als Pop-up": beide Rückfragen erscheinen
// über der Ansicht (und damit auch über dem Kopfzeilen-Bedienweg, der sie
// ausgelöst hat). Schließen ohne Antwort gilt als Abbruch.
function VerwerfenBestaetigung({
  onBestaetigen,
  onAbbrechen,
}: {
  onBestaetigen: () => void;
  onAbbrechen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ConfirmDialog
      visible
      message={t('schedule.planungVerwerfenFrage')}
      actions={[
        { label: t('schedule.planungVerwerfenBestaetigen'), variant: 'destructive', onPress: onBestaetigen },
        { label: t('common.cancel'), onPress: onAbbrechen },
      ]}
      onDismiss={onAbbrechen}
    />
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
  return (
    <ConfirmDialog
      visible
      message={t('schedule.planungVerlassenFrage')}
      actions={[
        { label: t('schedule.planungVerlassenSichern'), variant: 'primary', onPress: onSichern },
        { label: t('schedule.planungVerlassenVerwerfen'), variant: 'destructive', onPress: onVerwerfen },
        { label: t('schedule.planungVerlassenZurueck'), onPress: onAbbrechen },
      ]}
      onDismiss={onAbbrechen}
    />
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

const HERVORHEBUNGEN: readonly { schluessel: Hervorhebung; label: string }[] = [
  { schluessel: 'hervorhebungEigeneGruppe', label: 'schedule.planungHervorhebungEigeneGruppe' },
  { schluessel: 'hervorhebungKonflikte', label: 'schedule.planungHervorhebungKonflikte' },
  { schluessel: 'hervorhebungEingeplant', label: 'schedule.planungHervorhebungEingeplant' },
];

/**
 * Requirement „Einstellbare farbliche Hervorhebung im Planungsmodus" (Change
 * `planungsmodus-anzeige`, design.md Entscheidung 4): drei umschaltbare
 * Plaketten unter der Wochentagsleiste. Der Zustand steht zusätzlich zur Farbe
 * im Symbol (Kästchen gefüllt/leer) und im `accessibilityState`.
 */
function HervorhebungsSchalter({
  einstellungen,
  onUmschalten,
}: {
  einstellungen: AnsichtEinstellungen;
  onUmschalten: (welche: Hervorhebung) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.schalterZeile}>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('schedule.planungHervorhebungTitel')}</Text>
      {HERVORHEBUNGEN.map(({ schluessel, label }) => {
        const an = einstellungen[schluessel];
        return (
          <Pressable
            key={schluessel}
            accessibilityRole="switch"
            accessibilityState={{ checked: an }}
            accessibilityLabel={t(label)}
            onPress={() => onUmschalten(schluessel)}
            style={[
              styles.schalter,
              { borderColor: an ? colors.accent : colors.border, backgroundColor: an ? `${colors.accent}22` : undefined },
            ]}
          >
            <Ionicons name={an ? 'checkbox' : 'square-outline'} size={16} color={an ? colors.accent : colors.textMuted} />
            <Text style={{ color: colors.text, fontSize: 13 }}>{t(label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Change `planungsmodus-voreinstellungen-anpinnen`, design.md Entscheidung 7:
 * Werkzeugzeile mit der gewählten Voreinstellung (führt zu den
 * Planungseinstellungen), dem Vorschlag und der Rücknahme als sichtbarem
 * Bedienweg (Requirement „Rücknahme einer übernommenen Optimierung").
 */
function Werkzeugzeile({
  voreinstellung,
  onEinstellungen,
  onVorschlag,
  onNachGruppe,
  zeitachse,
  onZeitachse,
}: {
  voreinstellung: string;
  onEinstellungen: () => void;
  onVorschlag: () => void;
  onNachGruppe: () => void;
  zeitachse: boolean;
  onZeitachse: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const knopf = (symbol: 'options-outline' | 'sparkles-outline' | 'people-outline', label: string, a11y: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={[styles.werkzeug, { borderColor: colors.border }]}
    >
      <Ionicons name={symbol} size={16} color={colors.accent} />
      <Text numberOfLines={1} style={{ color: colors.text, fontSize: 13, flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
  return (
    <View style={styles.werkzeugZeile}>
      {knopf(
        'options-outline',
        voreinstellung,
        t('schedule.planungEinstellungenOeffnen', { voreinstellung }),
        onEinstellungen,
      )}
      {knopf('sparkles-outline', t('schedule.planungVorschlag'), t('schedule.planungVorschlag'), onVorschlag)}
      {knopf('people-outline', t('schedule.planungNachGruppe'), t('schedule.planungNachGruppe'), onNachGruppe)}
      {/* Requirement „Zeitachse im Planungsmodus": Umschalter am Ende der
       * Zeile (Change `planungsmodus-zeitachse`, design.md Entscheidung 5).
       * Das Symbol zeigt die jeweils andere Darstellung. */}
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: zeitachse }}
        accessibilityLabel={t('schedule.planungZeitachse')}
        onPress={onZeitachse}
        style={[styles.zeitachseSchalter, { borderColor: zeitachse ? colors.accent : colors.border }]}
      >
        <Ionicons name={zeitachse ? 'list-outline' : 'time-outline'} size={20} color={colors.accent} />
      </Pressable>
    </View>
  );
}

const STAND_SYMBOL = {
  eingeplant: 'checkmark-circle',
  mehrfach: 'checkmark-done-circle',
  anderweitig: 'swap-horizontal',
  offen: 'ellipse-outline',
} as const satisfies Record<ZeilenStand['art'], string>;

function useStandText(): (stand: ZeilenStand) => string {
  const { t } = useTranslation();
  return (stand) => {
    switch (stand.art) {
      case 'eingeplant':
        return t('schedule.planungStandEingeplant');
      case 'mehrfach':
        return t('schedule.planungStandMehrfach', { count: stand.anzahl });
      case 'anderweitig':
        return t('schedule.planungStandAnderweitig', { count: stand.anzahl });
      case 'offen':
        return t('schedule.planungStandOffen');
    }
  };
}

function TerminZeile({
  modul,
  termin,
  gewaehlt,
  angepinnt,
  vomVorschlag,
  onPinUmschalten,
  stand,
  gruppenkennung,
  eigeneGruppe,
  einstellungen,
  zeitfenster,
  konfliktstufe,
  hervorgehoben,
  onLayout,
  onUmschalten,
}: {
  modul: Modul;
  termin: OfficialTermin;
  gewaehlt: boolean;
  angepinnt: boolean;
  vomVorschlag: boolean;
  onPinUmschalten: () => void;
  stand: VeranstaltungsartStand | undefined;
  gruppenkennung: string;
  eigeneGruppe: boolean;
  einstellungen: AnsichtEinstellungen;
  zeitfenster: Zeitfenster | null;
  konfliktstufe: 'konfliktfrei' | 'konflikt';
  hervorgehoben: boolean;
  onLayout: (y: number) => void;
  onUmschalten: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const standText = useStandText();

  // Requirement „Kennzeichnung des Planungsstands je Veranstaltungsreihe"
  // (design.md Entscheidungen 1 und 2): jede Zeile trägt immer genau einen
  // Stand aus Symbol und Text — die Zeile verliert beim Wählen keine Zeile
  // und verrutscht nicht (Issue #123).
  const zStand = zeilenStand(stand, gewaehlt);
  const konflikt = !gewaehlt && konfliktstufe === 'konflikt';
  const standFarbe = gewaehlt ? colors.accent : colors.textMuted;
  const zeitraum = `${formatZeit(termin.timeBeginMin)}–${formatZeit(termin.timeEndMin)}`;
  // Requirement „Kennzeichnung außerhalb des Zeitfensters": nur Kennzeichnung,
  // die Zeile bleibt wählbar.
  const ausserhalbZeitfenster =
    zeitfenster !== null && (termin.timeBeginMin < zeitfenster.vonMin || termin.timeEndMin > zeitfenster.bisMin);

  // Requirement „Anzeige der zugewiesenen Gruppenkennungen im Planungsmodus"
  // (design.md Entscheidung 3).
  const rohKennung = termin.studentSet === '*' ? t('schedule.planungAlleGruppen') : termin.studentSet;
  const rohIstEigene = termin.studentSet.toUpperCase() === gruppenkennung.toUpperCase();

  // Requirement „Einstellbare farbliche Hervorhebung im Planungsmodus":
  // Konflikt hat Vorrang vor der eigenen Gruppe; „eingeplant" blendet die
  // anderweitig erledigten Zeilen ab. Keine Wirkung ändert die Zeilenhöhe.
  const hintergrund =
    konflikt && einstellungen.hervorhebungKonflikte
      ? `${colors.danger}22`
      : eigeneGruppe && einstellungen.hervorhebungEigeneGruppe
        ? `${colors.accent}22`
        : undefined;
  const abgeblendet = einstellungen.hervorhebungEingeplant && zStand.art === 'anderweitig';

  return (
    <View
      testID={`zeile-${zeilenKennung(modul.key, termin)}`}
      onLayout={(e) => onLayout(e.nativeEvent.layout.y)}
      style={[
        styles.zeile,
        // Requirement „Kennzeichnung gewählter Termine im Planungsmodus": eine
        // farbige Umrandung der gesamten Zeile, zusätzlich zum Symbol. Die
        // Breite ist immer 2 dp, nur die Farbe wechselt (Issue #123).
        { borderColor: gewaehlt ? colors.accent : colors.border, backgroundColor: hintergrund },
        abgeblendet && styles.zeileAbgeblendet,
        hervorgehoben && { borderColor: colors.text, borderWidth: 3 },
      ]}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: gewaehlt }}
        accessibilityLabel={`${zeitraum} ${termin.name} ${termin.courseType}`}
        onPress={onUmschalten}
        style={styles.zeileInhalt}
      >
        <Text style={{ color: gewaehlt ? colors.accent : colors.border, fontSize: 18, width: 24 }}>
          {gewaehlt ? '☑' : '☐'}
        </Text>
        <View style={styles.zeileText}>
          {/* Requirement „Unveränderte Modulnamen im Planungsmodus" (design.md
           * Entscheidung 5): Name des Termins, nicht der zusammengeführte. */}
          <Text style={{ color: colors.text, fontWeight: '600' }}>{`${zeitraum} · ${termin.name}`}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {/* Requirement „Lehrende Person in der Terminzeile des Planungsmodus" */}
            {[termin.courseType, termin.roomId, termin.lecturerName || null].filter(Boolean).join(' · ')}
          </Text>
          <View style={styles.kennungen}>
            <Text
              accessibilityLabel={
                rohIstEigene ? t('schedule.planungEigeneGruppeKennung', { kennung: rohKennung }) : rohKennung
              }
              style={[
                styles.kennung,
                { color: colors.text, borderColor: rohIstEigene ? colors.text : colors.border },
                rohIstEigene && styles.kennungEigene,
              ]}
            >
              {rohKennung}
            </Text>
            {eigeneGruppe && !rohIstEigene ? (
              <Text
                accessibilityLabel={t('schedule.planungEigeneGruppeKennung', { kennung: gruppenkennung })}
                style={[styles.kennung, styles.kennungEigene, { color: colors.text, borderColor: colors.text }]}
              >
                {gruppenkennung}
              </Text>
            ) : null}
          </View>
          {/* Requirement „Unterscheidung abgeleiteter Angaben von Quelldaten":
           * die Schlüsse der App in einer eigenen, abgesetzten Zeile. */}
          <View style={styles.standZeile}>
            <Ionicons name={STAND_SYMBOL[zStand.art]} size={14} color={standFarbe} />
            <Text style={{ color: standFarbe, fontSize: 12 }}>{standText(zStand)}</Text>
            {konflikt ? (
              <Text
                style={{ color: einstellungen.hervorhebungKonflikte ? colors.danger : colors.textMuted, fontSize: 12 }}
              >
                {`· ⚠ ${t('schedule.planungZeileKonflikt')}`}
              </Text>
            ) : null}
            {/* Requirement „Automatischer Planungsvorschlag": umgelegte und neu
             * gesetzte Termine weist das System aus. */}
            {ausserhalbZeitfenster ? (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {`· ◷ ${t('schedule.planungZeileAusserhalbZeitfenster')}`}
              </Text>
            ) : null}
            {gewaehlt && vomVorschlag ? (
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{`· ${t('schedule.planungVomVorschlag')}`}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
      {/* Requirement „Anpinnen eines Termins": nur an gewählten Zeilen; die
       * Fläche ist immer reserviert, damit die Zeile beim Wählen nicht
       * verrutscht (Issue #123). */}
      <View style={styles.pinFlaeche}>
        {gewaehlt ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: angepinnt }}
            accessibilityLabel={t('schedule.planungAnpinnen')}
            onPress={onPinUmschalten}
            style={styles.pin}
          >
            <Ionicons name={angepinnt ? 'pin' : 'pin-outline'} size={20} color={angepinnt ? colors.accent : colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface ZeilenZustand {
  kennung: string;
  gewaehlt: boolean;
  angepinnt: boolean;
  eigeneGruppe: boolean;
  konfliktstufe: 'konfliktfrei' | 'konflikt';
  hervorgehoben: boolean;
}

/**
 * Requirement „Zeitachse im Planungsmodus" (Change `planungsmodus-zeitachse`,
 * design.md Entscheidungen 2 bis 4 und 6): die Zeilen des Tages auf einer
 * proportionalen Achse, Überschneidungen nebeneinander. Reicht die Breite
 * nicht für die größte Spaltenzahl, wird die Achse breiter und lässt sich
 * seitlich verschieben, statt Kacheln zu stauchen oder zu verbergen.
 */
function PlanungsZeitachse({
  zeilen,
  zustand,
  gruppenkennung,
  einstellungen,
  onPosition,
  onUmschalten,
}: {
  zeilen: readonly { modul: Modul; termin: OfficialTermin }[];
  zustand: (modul: Modul, termin: OfficialTermin) => ZeilenZustand;
  gruppenkennung: string;
  einstellungen: AnsichtEinstellungen;
  onPosition: (kennung: string, y: number) => void;
  onUmschalten: (modul: Modul, termin: OfficialTermin) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [breite, setBreite] = useState(0);

  const abschnitte = legePlanungsTagAus(
    zeilen.map((zeile) => ({ zeile, timeBeginMin: zeile.termin.timeBeginMin, timeEndMin: zeile.termin.timeEndMin })),
  );
  const inhaltBreite = Math.max(breite, groessteSpaltenzahl(abschnitte) * MIN_SPALTENBREITE);

  const gelegt: { abschnitt: (typeof abschnitte)[number]; top: number }[] = [];
  let cursor = 0;
  for (const abschnitt of abschnitte) {
    gelegt.push({ abschnitt, top: cursor });
    cursor += abschnitt.hoeheMin * DP_JE_MINUTE;
  }

  return (
    <View testID="planung-zeitachse" onLayout={(e) => setBreite(e.nativeEvent.layout.width)}>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ width: inhaltBreite }}>
        <View style={{ width: inhaltBreite, height: cursor }}>
          {gelegt.map(({ abschnitt, top }, index) => {
            if (abschnitt.art === 'luecke') {
              if (abschnitt.kurz) return null;
              const dauer = dauerText(abschnitt.echteDauerMin, t);
              return (
                <View
                  key={`luecke-${index}`}
                  accessibilityRole="text"
                  accessibilityLabel={t('schedule.lueckeLabel', {
                    dauer,
                    von: formatZeit(abschnitt.vonMin),
                    bis: formatZeit(abschnitt.bisMin),
                  })}
                  style={[styles.achsenLuecke, { top, height: abschnitt.hoeheMin * DP_JE_MINUTE }]}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{t('schedule.luecke', { dauer })}</Text>
                </View>
              );
            }
            return abschnitt.elemente.map(({ element, spalte, spalten, ueberschneidungen }) => {
              const { modul, termin } = element.zeile;
              const z = zustand(modul, termin);
              const kachelTop = top + (termin.timeBeginMin - abschnitt.vonMin) * DP_JE_MINUTE;
              const spaltenBreite = inhaltBreite / spalten;
              return (
                <View
                  key={z.kennung}
                  testID={`platz-${z.kennung}`}
                  onLayout={() => onPosition(z.kennung, kachelTop)}
                  style={[
                    styles.kachelPlatz,
                    {
                      top: kachelTop,
                      height: (termin.timeEndMin - termin.timeBeginMin) * DP_JE_MINUTE,
                      left: spalte * spaltenBreite,
                      width: spaltenBreite,
                    },
                  ]}
                >
                  <PlanungsKachel
                    termin={termin}
                    zustand={z}
                    ueberschneidungen={ueberschneidungen}
                    gruppenkennung={gruppenkennung}
                    einstellungen={einstellungen}
                    onUmschalten={() => onUmschalten(modul, termin)}
                  />
                </View>
              );
            });
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function PlanungsKachel({
  termin,
  zustand,
  ueberschneidungen,
  gruppenkennung,
  einstellungen,
  onUmschalten,
}: {
  termin: OfficialTermin;
  zustand: ZeilenZustand;
  ueberschneidungen: number;
  gruppenkennung: string;
  einstellungen: AnsichtEinstellungen;
  onUmschalten: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const zeitraum = `${formatZeit(termin.timeBeginMin)}–${formatZeit(termin.timeEndMin)}`;
  const konflikt = !zustand.gewaehlt && zustand.konfliktstufe === 'konflikt';
  const kennung = termin.studentSet === '*' ? t('schedule.planungAlleGruppen') : termin.studentSet;
  const hintergrund =
    konflikt && einstellungen.hervorhebungKonflikte
      ? `${colors.danger}22`
      : zustand.eigeneGruppe && einstellungen.hervorhebungEigeneGruppe
        ? `${colors.accent}22`
        : colors.surface;
  // Design.md Entscheidung 4: dieselbe Beschriftung wie die Listenzeile,
  // ergänzt um die Zahl der Überschneidungen und die Kennzeichnungen.
  const label = [
    `${zeitraum} ${termin.name} ${termin.courseType}`,
    ueberschneidungen > 0 ? t('schedule.planungUeberschneidetSich', { count: ueberschneidungen }) : null,
    konflikt ? t('schedule.planungZeileKonflikt') : null,
    zustand.angepinnt ? t('schedule.planungAngepinnt') : null,
    zustand.eigeneGruppe ? t('schedule.planungEigeneGruppeKennung', { kennung: gruppenkennung }) : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      testID={`kachel-${zustand.kennung}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: zustand.gewaehlt }}
      accessibilityLabel={label}
      onPress={onUmschalten}
      style={[
        styles.kachel,
        { borderColor: zustand.gewaehlt ? colors.accent : colors.border, backgroundColor: hintergrund },
        zustand.hervorgehoben && { borderColor: colors.text, borderWidth: 3 },
      ]}
    >
      <View style={styles.kachelKopf}>
        <Text style={{ color: zustand.gewaehlt ? colors.accent : colors.border, fontSize: 14 }}>
          {zustand.gewaehlt ? '☑' : '☐'}
        </Text>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600', flexShrink: 1 }}>{zeitraum}</Text>
        {konflikt ? <Text style={{ color: colors.danger, fontSize: 12 }}>⚠</Text> : null}
        {zustand.angepinnt ? <Ionicons name="pin" size={12} color={colors.accent} /> : null}
      </View>
      <Text numberOfLines={2} style={{ color: colors.text, fontSize: 12 }}>
        {termin.name}
      </Text>
      <Text numberOfLines={1} style={{ color: colors.textMuted, fontSize: 11 }}>
        {`${termin.courseType} · ${kennung}`}
      </Text>
    </Pressable>
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
  gruppenkennung: string;
  onSpringeZu: (modulKey: string, slot: OfficialTermin) => void;
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
                onPress={() => onSpringeZu(stand.modulKey, zielSlot)}
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
  zeile: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 10, minHeight: 44 },
  zeileAbgeblendet: { opacity: 0.55 },
  kennungen: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  kennung: { fontSize: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, paddingHorizontal: 4 },
  kennungEigene: { fontWeight: '700', borderWidth: 1.5 },
  standZeile: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  schalterZeile: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingVertical: 6 },
  schalter: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
  },
  werkzeugZeile: { flexDirection: 'row', gap: 6, paddingBottom: 6 },
  werkzeug: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  zeitachseSchalter: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  achsenLuecke: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  kachelPlatz: { position: 'absolute', padding: 2 },
  kachel: { flex: 1, borderWidth: 2, borderRadius: 8, padding: 4, gap: 2, overflow: 'hidden' },
  kachelKopf: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pinFlaeche: { width: 44, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  pin: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
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
});
