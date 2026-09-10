import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { writeJson } from '@/storage/kv';
import { ThemeProvider } from '@/theme';
import { SCHEDULE_NEUTRAL } from '@/theme/tokens';
import { anzeigeFarbe } from '../farbe';
import { __resetAnsichtEinstellungenForTest } from '../ansichtEinstellungen';
import { __resetPlanungAktionForTest } from '../planungAktion';
import { PlanungSpeichernZugang } from '../ui/PlanungSpeichernZugang';
import { PlanungScreen } from './PlanungScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

const mockDispatch = jest.fn();
let letztePreventRemove: { verhindern: boolean; callback: (e: { data: { action: unknown } }) => void } | null = null;
jest.mock('expo-router/react-navigation', () => ({
  useNavigation: () => ({ dispatch: mockDispatch }),
  usePreventRemove: (verhindern: boolean, callback: (e: { data: { action: unknown } }) => void) => {
    letztePreventRemove = { verhindern, callback };
  },
}));

// Change `planungsmodus-sichern-absturz`, design.md Entscheidung 1: der
// Mitschnitt hält fest, womit `PlanungScreen` die Kopfzeilen-Aktion anmeldet.
// Das echte Modulverhalten bleibt erhalten — `usePlanungAktion` und
// `__resetPlanungAktionForTest` arbeiten weiter auf demselben Zustand.
const mockRegistrierungen: (unknown | null)[] = [];
jest.mock('../planungAktion', () => {
  const echt = jest.requireActual('../planungAktion');
  return {
    ...echt,
    registriereePlanungAktion: (aktion: unknown | null) => {
      mockRegistrierungen.push(aktion);
      return echt.registriereePlanungAktion(aktion);
    },
  };
});

let mockEinrichtung: { endpunkte: string[]; gruppenkennung: string | null };
let mockEntries: any[];
const mockMehrereUebernehmen = jest.fn();

jest.mock('../einrichtung', () => ({
  useEinrichtung: () => ({ einrichtung: mockEinrichtung, loaded: true }),
}));

jest.mock('../planStore', () => ({
  useScheduleEntries: () => ({ entries: mockEntries, loaded: true, mehrereUebernehmen: mockMehrereUebernehmen }),
}));

let mockStudiengaenge: { sname: string; name: string; grades: string[]; po: string | null }[];
let mockTermineQuery: any;

jest.mock('../api', () => ({
  useStudiengaenge: () => ({ studiengaenge: mockStudiengaenge }),
  useTermineFuerEndpunkte: () => mockTermineQuery,
}));

function termin(over: Record<string, unknown>) {
  return {
    courseId: 'INF999',
    name: 'Mathematik für Informatik 3',
    courseType: 'V',
    lecturerName: 'Prof. Beispiel',
    studentSet: '*',
    roomId: 'A.1.01',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gueltigVon: null,
    gueltigBis: null,
    grade: '2',
    ...over,
  };
}

// Modul „Mathematik für Informatik 3": V hat genau einen Slot (wird
// vorbelegt), Ü hat zwei Slots — einer passt zur Gruppenkennung C8.
const MATHE3_V = termin({});
const MATHE3_UE_FREMD = termin({
  courseType: 'Ü',
  studentSet: 'A-B',
  weekday: 'Tue',
  timeBeginMin: 600,
  timeEndMin: 690,
});
const MATHE3_UE_EIGEN = termin({
  courseType: 'Ü',
  studentSet: 'C5-E',
  weekday: 'Tue',
  timeBeginMin: 720,
  timeEndMin: 810,
});
const MODUL_KEY = 'INF999|2';

function offiziellerEintrag(over: Record<string, unknown>) {
  return {
    id: 'bestehend-1',
    kind: 'offiziell',
    deaktiviertBis: null,
    color: '#1E88E5',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    courseId: 'INF999',
    name: 'Mathematik für Informatik 3',
    courseType: 'V',
    lecturerName: 'Prof. Beispiel',
    studentSet: '*',
    roomId: 'A.1.01',
    ...over,
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  __resetAnsichtEinstellungenForTest();
  __resetPlanungAktionForTest();
  mockRegistrierungen.length = 0;
  letztePreventRemove = null;
  mockParams = { module: MODUL_KEY };
  mockEinrichtung = { endpunkte: ['INPBPI'], gruppenkennung: 'C8' };
  mockEntries = [];
  mockStudiengaenge = [{ sname: 'INPBPI', name: 'Bachelor Informatik', grades: ['2'], po: '2019' }];
  mockTermineQuery = {
    termine: [MATHE3_V, MATHE3_UE_FREMD, MATHE3_UE_EIGEN],
    perEndpunkt: [{ sname: 'INPBPI', name: 'Bachelor Informatik', termine: [MATHE3_V, MATHE3_UE_FREMD, MATHE3_UE_EIGEN] }],
    alleGeladen: true,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
  };
});

afterEach(cleanup);

function renderScreen() {
  return render(
    <ThemeProvider>
      <PlanungScreen />
      <PlanungSpeichernZugang />
    </ThemeProvider>,
  );
}

describe('Wege und Übergänge: kein doppelter Zugang zur Modulauswahl', () => {
  it('bietet keinen Verweis „Zur Modulauswahl" mehr — die Modulauswahl bleibt über den Zurück-Weg der Kopfzeile erreichbar', () => {
    renderScreen();
    expect(screen.queryByLabelText('Zur Modulauswahl')).toBeNull();
    expect(screen.queryByText('Zur Modulauswahl')).toBeNull();
  });
});

describe('Planungsmodus mit Wochentagsgliederung', () => {
  it('zeigt die Termine der gewählten Module nach Wochentagen gegliedert, je Wochentag aufsteigend nach Beginnzeit', () => {
    renderScreen();

    // Montag ist zunächst aktiv: die Vorlesung (V) liegt dort.
    expect(screen.getByText(/08:00–09:30/)).toBeTruthy();
    expect(screen.queryByText(/10:00–11:30/)).toBeNull();

    fireEvent.press(screen.getByLabelText('Dienstag'));
    const zeit1 = screen.getByText(/10:00–11:30/);
    const zeit2 = screen.getByText(/12:00–13:30/);
    expect(zeit1).toBeTruthy();
    expect(zeit2).toBeTruthy();
  });

  it('bleibt bei bestehendem Plan erneut erreichbar, ohne dass die Modulauswahl wiederholt werden muss', () => {
    mockParams = {}; // kein Routenparameter — wie bei einem erneuten Aufruf
    mockEntries = [offiziellerEintrag({})];
    renderScreen();

    expect(screen.getAllByText(/Mathematik für Informatik 3/).length).toBeGreaterThan(0);
  });
});

describe('Hervorhebung der eigenen Gruppe im Planungsmodus', () => {
  it('hebt einen Termin der eigenen Gruppe hervor, zusätzlich zur Farbe über Text', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));

    expect(screen.getByText(/Eigene Gruppe/)).toBeTruthy();
  });

  it('zeigt einen gruppenfremden Termin weiterhin und lässt seine Wahl zu', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));

    const fremderTermin = screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/);
    expect(fremderTermin).toBeTruthy();
    fireEvent.press(fremderTermin);
    expect(fremderTermin.props.accessibilityState.checked).toBe(true);
  });
});

describe('Leiste der ausstehenden Veranstaltungen', () => {
  it('nennt eine an einem anderen Wochentag liegende, noch nicht eingeplante Veranstaltung beim Namen und springt dorthin', () => {
    renderScreen();

    expect(screen.getByLabelText('Mathematik für Informatik 3 Ü')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Mathematik für Informatik 3 Ü'));

    expect(screen.getByLabelText('Dienstag').props.accessibilityState.selected).toBe(true);
  });

  // Requirement „Leiste der ausstehenden Veranstaltungen": Sprungziel ist der
  // erste Slot der eigenen Gruppe, sonst der erste Slot der Liste
  // (design.md, Entscheidung 10) — Prüfprotokoll 2026-09-09. MATHE3_UE_EIGEN
  // (`C5-E`, passt zu Gruppenkennung `C8`) steht in `termine` NACH
  // MATHE3_UE_FREMD — die reine Eingabereihenfolge träfe den falschen Slot.
  it('springt zum ersten Slot der eigenen Gruppe, nicht zum ersten Slot der Liste', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Mathematik für Informatik 3 Ü'));

    const zeile = () => StyleSheet.flatten(screen.getByTestId(/^zeile-INF999\|Ü\|Tue\|720\|810/).props.style);
    expect(zeile().borderWidth).toBe(3);
  });

  it('hebt das Sprungziel kurzzeitig hervor und kehrt danach von selbst in den Normalzustand zurück', async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Mathematik für Informatik 3 Ü'));

    const zeile = () => StyleSheet.flatten(screen.getByTestId(/^zeile-INF999\|Ü\|Tue\|720\|810/).props.style);
    expect(zeile().borderWidth).toBe(3);

    await waitFor(() => expect(zeile().borderWidth).not.toBe(3), { timeout: 3000 });
  });

  it('springt zum ersten Slot der Liste, wenn keiner der eigenen Gruppe zuzuordnen ist', () => {
    mockEinrichtung = { endpunkte: ['INPBPI'], gruppenkennung: 'Z9' };
    renderScreen();
    fireEvent.press(screen.getByLabelText('Mathematik für Informatik 3 Ü'));

    const zeile = () => StyleSheet.flatten(screen.getByTestId(/^zeile-INF999\|Ü\|Tue\|600\|690/).props.style);
    expect(zeile().borderWidth).toBe(3);
  });

  it('meldet, dass nichts mehr aussteht, sobald jede Veranstaltungsart mindestens einen Termin trägt', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));

    expect(screen.getByText('Nichts steht mehr aus')).toBeTruthy();
  });
});

describe('Ausdrückliches Sichern der Planung', () => {
  it('lässt den persönlichen Plan vor dem Sichern unverändert und weist die Änderung als ungesichert aus', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));

    expect(mockMehrereUebernehmen).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Planung sichern — ungesicherte Änderungen vorhanden')).toBeTruthy();
  });

  it('übernimmt beim Sichern sämtliche getroffenen Entscheidungen gemeinsam in den persönlichen Plan', async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));

    fireEvent.press(screen.getByLabelText('Planung sichern — ungesicherte Änderungen vorhanden'));

    expect(mockMehrereUebernehmen).toHaveBeenCalledTimes(1);
    const [hinzuzufuegen] = mockMehrereUebernehmen.mock.calls[0]!;
    // Die vorbelegte Vorlesung (Montag) UND die frisch gewählte Übung (Dienstag)
    // wirken gemeinsam in einem Schreibvorgang.
    expect(hinzuzufuegen).toHaveLength(2);
    // Requirement „Ausdrückliches Sichern der Planung": nach dem Sichern
    // wechselt das System in die Wochenansicht — seit Change
    // `planungsmodus-sichern-absturz` (design.md Entscheidung 2) einen Frame
    // später, damit die Kopfzeilen-Mutation vor der Fragment-Transaktion
    // abgeschlossen ist.
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
  });

  // Change `planungsmodus-sichern-absturz`, design.md Entscheidung 1: auf
  // Android stürzte die App nach dem Sichern ab, weil dieser Bildschirm die
  // Kopfzeilen-Aktion erneut anmeldete, während die Navigation aus dem
  // `(schedule)`-Stack heraus bereits lief.
  it('meldet die Kopfzeilen-Aktion beim Sichern ab und registriert sie danach nicht erneut', async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));
    expect(screen.getByLabelText('Planung sichern — ungesicherte Änderungen vorhanden')).toBeTruthy();

    mockRegistrierungen.length = 0;
    fireEvent.press(screen.getByLabelText('Planung sichern — ungesicherte Änderungen vorhanden'));

    // Ab hier verändert der Bildschirm die Kopfzeile nur noch ein einziges Mal:
    // hin zu `null`. Keine weitere Anmeldung einer Aktion.
    expect(mockRegistrierungen.length).toBeGreaterThan(0);
    expect(mockRegistrierungen.every((aktion) => aktion === null)).toBe(true);
    expect(screen.queryByLabelText('Auswahl verwerfen')).toBeNull();
    expect(screen.queryByLabelText('Planung sichern')).toBeNull();

    // Auch über den Frame-Versatz der Navigation hinaus bleibt es dabei.
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(mockRegistrierungen.every((aktion) => aktion === null)).toBe(true);
    expect(screen.queryByLabelText('Auswahl verwerfen')).toBeNull();
  });

  it('weist ohne jede Änderung keine ungesicherten Änderungen aus', () => {
    // Beide Veranstaltungsarten sind bereits gespeichert — nichts ist vorzubelegen.
    mockEntries = [
      offiziellerEintrag({ id: 'v', courseType: 'V', weekday: 'Mon', timeBeginMin: 480, timeEndMin: 570 }),
      offiziellerEintrag({
        id: 'ue',
        courseType: 'Ü',
        weekday: 'Tue',
        timeBeginMin: 720,
        timeEndMin: 810,
        studentSet: 'C5-E',
      }),
    ];
    renderScreen();

    expect(screen.getByLabelText('Planung sichern')).toBeTruthy();
    expect(screen.queryByLabelText('Planung sichern — ungesicherte Änderungen vorhanden')).toBeNull();
  });
});

// Requirement „Farbwahl je Termin": Farbautomatik abschaltbar. Ein im
// Planungsmodus gewählter Termin speichert seit dem Prüfprotokoll vom
// 2026-09-09 (Abschnitt 3) immer die automatisch vergebene Farbe; die neutrale
// Fläche entsteht erst in der Darstellung, damit das Abschalten umkehrbar
// bleibt und auch einen bestehenden Plan erfasst.
describe('Farbautomatik im Planungsmodus', () => {
  it('speichert auch bei abgeschalteter Farbautomatik die automatische Farbe, damit das Wiedereinschalten wirkt', async () => {
    await writeJson('scheduleViewSettings', { zeitachse: true, sprungZuHeute: true, farbautomatik: false });
    __resetAnsichtEinstellungenForTest();
    renderScreen();
    // Die Ansichtseinstellungen laden asynchron (`ansichtEinstellungen.ts`) —
    // ein Makrotask-Umlauf lässt alle anstehenden Mikrotasks zuvor abarbeiten.
    await act(async () => {
      await new Promise((resolve) => setImmediate(resolve));
    });
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));

    fireEvent.press(screen.getByLabelText('Planung sichern — ungesicherte Änderungen vorhanden'));

    await waitFor(() => expect(mockMehrereUebernehmen).toHaveBeenCalledTimes(1));
    const [hinzuzufuegen] = mockMehrereUebernehmen.mock.calls[0]!;
    const ue = hinzuzufuegen.find((e: { courseType: string }) => e.courseType === 'Ü');
    expect(ue.color).not.toBe(SCHEDULE_NEUTRAL);
    expect(ue.farbeVonNutzer).not.toBe(true);
    expect(anzeigeFarbe(ue, false)).toBe(SCHEDULE_NEUTRAL);
    expect(anzeigeFarbe(ue, true)).toBe(ue.color);
  });
});

describe('Rückfrage beim Verlassen mit ungesicherten Änderungen', () => {
  it('fragt beim Verlassen mit ungesicherten Änderungen nach und bietet Sichern, Verwerfen und Zurückkehren an', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));

    expect(letztePreventRemove!.verhindern).toBe(true);
    act(() => letztePreventRemove!.callback({ data: { action: { type: 'POP' } } }));

    expect(screen.getByText('Es gibt ungesicherte Änderungen. Was möchtest du tun?')).toBeTruthy();
    expect(screen.getByText('Sichern')).toBeTruthy();
    expect(screen.getByText('Verwerfen')).toBeTruthy();
    expect(screen.getByText('Zurück zur Bearbeitung')).toBeTruthy();
  });

  it('verlässt den Planungsmodus ohne Rückfrage, wenn nichts geändert wurde', () => {
    mockEntries = [
      offiziellerEintrag({ id: 'v', courseType: 'V' }),
      offiziellerEintrag({ id: 'ue', courseType: 'Ü', weekday: 'Tue', timeBeginMin: 720, timeEndMin: 810, studentSet: 'C5-E' }),
    ];
    renderScreen();

    expect(letztePreventRemove!.verhindern).toBe(false);
  });

  it('bleibt bei „Zurück zur Bearbeitung" im Planungsmodus mit sämtlichen ungesicherten Änderungen erhalten', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));
    act(() => letztePreventRemove!.callback({ data: { action: { type: 'POP' } } }));

    fireEvent.press(screen.getByText('Zurück zur Bearbeitung'));

    expect(screen.queryByText('Es gibt ungesicherte Änderungen. Was möchtest du tun?')).toBeNull();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/).props.accessibilityState.checked).toBe(
      true,
    );
  });
});

// Requirement „Kennzeichnung des Planungsstands je Veranstaltung", Prüfung
// gegen Aufgabe 5.4: Der stille Fehlschlag der bisherigen Kursauswahl
// (`artUmschalten` wählte wortlos keinen Slot, wenn keiner zur Gruppenkennung
// passte) kann hier nicht mehr auftreten — der Planungsmodus fragt nie nach
// der Gruppenkennung ab, sondern zeigt jede Veranstaltungsart mit all ihren
// Slots, gleich ob einer zur Kennung passt oder nicht.
describe('Kennzeichnung des Planungsstands je Veranstaltung', () => {
  it('eine Veranstaltungsart ohne zur Gruppenkennung passenden Slot erscheint sichtbar als offen, nicht stillschweigend unverändert', () => {
    mockEinrichtung = { endpunkte: ['INPBPI'], gruppenkennung: 'X9' }; // passt zu keinem der Ü-Slots
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));

    const fremd = screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/);
    const eigen = screen.getByLabelText(/12:00–13:30 Mathematik für Informatik 3 Ü/);
    expect(fremd.props.accessibilityState.checked).toBe(false);
    expect(eigen.props.accessibilityState.checked).toBe(false);
    expect(screen.getByLabelText('Mathematik für Informatik 3 Ü')).toBeTruthy(); // Leiste der Ausstehenden
  });
});

describe('Zweckbestimmung eigener Termine', () => {
  it('bietet den Bedienweg zum Anlegen eigener Termine im Planungsmodus über die Leiste der Ausstehenden an', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Eigenen Termin anlegen'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/termin',
      params: { wochentag: 'Mon', planung: '1' },
    });
  });

  it('bietet genau einen Bedienweg zum Anlegen — keinen zweiten Knopf unter der Terminliste', () => {
    renderScreen();
    expect(screen.getAllByLabelText('Eigenen Termin anlegen')).toHaveLength(1);
  });
});

describe('Verwerfen der Auswahl im Planungsmodus', () => {
  it('setzt den Zwischenstand nach Bestätigung auf den gesicherten Plan zurück', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));
    expect(screen.getByLabelText('Planung sichern — ungesicherte Änderungen vorhanden')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Auswahl verwerfen'));
    fireEvent.press(screen.getByText('Verwerfen'));

    expect(screen.getByLabelText('Planung sichern')).toBeTruthy();
    expect(mockMehrereUebernehmen).not.toHaveBeenCalled();
  });

  it('bricht das Verwerfen ab und behält alle Entscheidungen', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));

    fireEvent.press(screen.getByLabelText('Auswahl verwerfen'));
    fireEvent.press(screen.getByText('Abbrechen'));

    expect(screen.getByLabelText('Planung sichern — ungesicherte Änderungen vorhanden')).toBeTruthy();
    expect(
      screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/).props.accessibilityState.checked,
    ).toBe(true);
  });

  it('lässt den gesicherten Plan beim Verwerfen unberührt', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));

    fireEvent.press(screen.getByLabelText('Auswahl verwerfen'));
    fireEvent.press(screen.getByText('Verwerfen'));

    expect(mockMehrereUebernehmen).not.toHaveBeenCalled();
  });
});

describe('Kennzeichnung gewählter Termine im Planungsmodus', () => {
  it('zeigt einen gewählten Termin mit dem Auswahlsymbol', () => {
    renderScreen();
    const gewaehlt = screen.getByLabelText(/08:00–09:30/);
    expect(gewaehlt.props.accessibilityState.checked).toBe(true);
  });

  it('zeigt einen nicht gewählten Termin ohne das Auswahlsymbol', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    const nichtGewaehlt = screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/);
    expect(nichtGewaehlt.props.accessibilityState.checked).toBe(false);
  });
});

describe('Lehrende Person in der Terminzeile des Planungsmodus', () => {
  it('zeigt die lehrende Person eines Termins in der Terminzeile', () => {
    renderScreen();
    expect(screen.getByText(/Prof\. Beispiel/)).toBeTruthy();
  });

  it('lässt die Angabe ohne Platzhalter aus, wenn keine lehrende Person geführt wird', () => {
    mockTermineQuery = {
      ...mockTermineQuery,
      perEndpunkt: [
        {
          sname: 'INPBPI',
          name: 'Bachelor Informatik',
          termine: [{ ...MATHE3_V, lecturerName: '' }, MATHE3_UE_FREMD, MATHE3_UE_EIGEN],
        },
      ],
    };
    renderScreen();
    expect(screen.queryByText('undefined')).toBeNull();
  });
});

describe('Hinweis bei fehlender konfliktfreier Option', () => {
  it('teilt mit, wenn für eine Veranstaltungsart kein konfliktfreier Termin existiert, statt sie auszublenden', () => {
    // Ein fester Termin belegt bereits beide Zeiten der Übung.
    mockEntries = [
      offiziellerEintrag({ id: 'v', courseType: 'V' }),
      offiziellerEintrag({
        id: 'blockiert',
        courseType: 'PR',
        weekday: 'Tue',
        timeBeginMin: 600,
        timeEndMin: 900,
        studentSet: '*',
      }),
    ];
    renderScreen();

    // Symbol mit erhaltenem accessibilityLabel statt Fließtext (design.md, Entscheidung 9).
    expect(screen.getByLabelText(/Kein konfliktfreier Termin verfügbar/)).toBeTruthy();
    // Die Termine bleiben trotzdem sichtbar und wählbar.
    fireEvent.press(screen.getByLabelText('Dienstag'));
    expect(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/)).toBeTruthy();
  });
});

describe('Unterscheidung abgeleiteter Angaben von Quelldaten', () => {
  it('führt die Schlüsse der App (noch nicht eingeplant, eigene Gruppe) in einer abgesetzten Zeile mit vorangestelltem Symbol', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));

    expect(screen.getByText(/^ⓘ .*Eigene Gruppe/)).toBeTruthy();
  });
});

describe('Wochentagsleiste über die volle Bildschirmbreite', () => {
  it('stellt fünf Wochentage gleich breit dar, ohne waagerechtes Blättern', () => {
    renderScreen();
    for (const tag of ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']) {
      const eintrag = screen.getByLabelText(tag);
      expect(StyleSheet.flatten(eintrag.props.style).flex).toBe(1);
    }
  });
});

describe('Deaktivierter Termin im Planungsmodus', () => {
  it('führt einen deaktivierten Termin als hinzugefügt und zeigt den deaktivierten Zustand nicht an', () => {
    mockEntries = [offiziellerEintrag({ deaktiviertBis: 'dauerhaft' })];
    renderScreen();

    const zeile = screen.getByLabelText(/08:00–09:30/);
    expect(zeile.props.accessibilityState.checked).toBe(true);
    expect(screen.queryByText(/Deaktiviert/)).toBeNull();
  });
});

describe('Bewusste Übernahme trotz Konflikt', () => {
  it('übernimmt einen Termin trotz erkannter Kollision und kennzeichnet ihn dauerhaft als angenommenen Konflikt', () => {
    mockEntries = [
      offiziellerEintrag({
        id: 'kollidierend',
        courseType: 'PR',
        weekday: 'Tue',
        timeBeginMin: 660,
        timeEndMin: 750,
        studentSet: '*',
      }),
    ];
    renderScreen();
    fireEvent.press(screen.getByLabelText('Dienstag'));
    fireEvent.press(screen.getByLabelText(/10:00–11:30 Mathematik für Informatik 3 Ü/));

    fireEvent.press(screen.getByLabelText('Planung sichern — ungesicherte Änderungen vorhanden'));

    const [hinzuzufuegen, , aktualisierungen] = mockMehrereUebernehmen.mock.calls[0]!;
    const neuerEintrag = hinzuzufuegen.find((e: any) => e.courseType === 'Ü');
    expect(neuerEintrag.akzeptierteKonflikte).toContain('kollidierend');
    const aktualisierungFuerBestehenden = aktualisierungen.find((a: any) => a.id === 'kollidierend');
    expect(aktualisierungFuerBestehenden.patch.akzeptierteKonflikte).toContain(neuerEintrag.id);
  });
});
