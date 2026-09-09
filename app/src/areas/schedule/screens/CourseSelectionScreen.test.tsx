import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { __resetModulauswahlAktionForTest } from '../modulauswahlAktion';
import { ModulauswahlVerwerfenZugang } from '../ui/ModulauswahlVerwerfenZugang';
import { CourseSelectionScreen } from './CourseSelectionScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let mockEinrichtung: any;
let mockEntries: any[];
const mockEntfernen = jest.fn();

jest.mock('../einrichtung', () => ({
  useEinrichtung: () => ({ einrichtung: mockEinrichtung, loaded: true }),
}));

jest.mock('../planStore', () => ({
  useScheduleEntries: () => ({ entries: mockEntries, loaded: true, entfernen: mockEntfernen }),
}));

let mockStudiengaenge: { sname: string; name: string; grades: string[]; po: string | null }[];
let mockTermineQuery: any;

jest.mock('../api', () => ({
  useStudiengaenge: () => ({ studiengaenge: mockStudiengaenge }),
  useTermineFuerEndpunkte: () => mockTermineQuery,
}));

const termin = (over: Record<string, unknown>) => ({
  courseId: '43051',
  name: 'Softwaretechnik 1',
  courseType: 'V',
  lecturerName: 'Prof. Beispiel',
  studentSet: '*',
  roomId: 'A.2.02',
  weekday: 'Mon',
  timeBeginMin: 480,
  timeEndMin: 570,
  gueltigVon: null,
  gueltigBis: null,
  grade: '2',
  ...over,
});

const SOFTWARETECHNIK_V = termin({});
const SOFTWARETECHNIK_UE = termin({ courseType: 'Ü', studentSet: 'C-D' });
const TUTORIUM = termin({
  courseId: '99001',
  name: 'Tutorium Mathematik',
  lecturerName: 'Tutor Beispiel',
  grade: '0',
});

function perEndpunkt() {
  return [
    { sname: 'INPBPI', name: 'Bachelor Informatik (StgPO 2019)', termine: [SOFTWARETECHNIK_V, SOFTWARETECHNIK_UE] },
    { sname: 'TUPB', name: 'Tutorien', termine: [TUTORIUM] },
  ];
}

beforeEach(() => {
  jest.clearAllMocks();
  __resetModulauswahlAktionForTest();
  mockEinrichtung = { endpunkte: ['INPBPI', 'TUPB'], gruppenkennung: 'C8', gruppenkennungVorschlag: null };
  mockEntries = [];
  mockStudiengaenge = [
    { sname: 'INPBPI', name: 'Bachelor Informatik (StgPO 2019)', grades: ['2', '4', '6'], po: '2019' },
    { sname: 'TUPB', name: 'Tutorien', grades: ['0'], po: null },
  ];
  mockTermineQuery = {
    termine: [SOFTWARETECHNIK_V, SOFTWARETECHNIK_UE, TUTORIUM],
    perEndpunkt: perEndpunkt(),
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
      <CourseSelectionScreen />
      <ModulauswahlVerwerfenZugang />
    </ThemeProvider>,
  );
}

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
    courseId: '43051',
    name: 'Softwaretechnik 1',
    courseType: 'V',
    lecturerName: 'Prof. Beispiel',
    studentSet: '*',
    roomId: 'A.2.02',
    ...over,
  };
}

describe('Gliederung des Auswahlbestands', () => {
  it('Auswahlbestand öffnen: zeigt zunächst die Module zur Auswahl, ohne Veranstaltungsarten oder Gruppen-Slots', () => {
    renderScreen();
    expect(screen.getByText('Softwaretechnik 1')).toBeTruthy();
    expect(screen.getByText('Tutorium Mathematik')).toBeTruthy();
    expect(screen.queryByLabelText('V übernehmen')).toBeNull();
    expect(screen.queryByLabelText(/Mo.*C-D/)).toBeNull();
  });
});

describe('Modulauswahl ohne Veranstaltungsart und Gruppen-Slot', () => {
  it('Modul angekreuzt: führt es als Kandidat für die Planung, ohne eine Veranstaltungsart oder einen Gruppen-Slot zu erfragen', () => {
    renderScreen();
    const zeile = screen.getByLabelText('Softwaretechnik 1');
    expect(zeile.props.accessibilityState.checked).toBe(false);

    fireEvent.press(zeile);
    expect(screen.getByLabelText('Softwaretechnik 1').props.accessibilityState.checked).toBe(true);
    expect(screen.queryByLabelText('V übernehmen')).toBeNull();
    expect(screen.queryByLabelText('Übernehmen')).toBeNull();
  });

  it('gliedert die Module nach Fachsemester bzw. Endpunktname als Abschnitt', () => {
    renderScreen();
    // Jeder Abschnittstitel erscheint doppelt: als Chip der Abschnittsnavigation und als Überschrift.
    expect(screen.getAllByText('Fachsemester 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tutorien').length).toBeGreaterThan(0); // Abschnittsüberschrift für TUPB (kein Fachsemester)
  });

  it('bietet kein eigenständiges Fachsemester-Filterelement — die Abschnittsgliederung ist die einzige Navigation', () => {
    renderScreen();
    expect(screen.queryByText('Alle Fachsemester')).toBeNull();
    expect(screen.queryByText('Filter zurücksetzen')).toBeNull();
  });
});

describe('Freitextsuche im Auswahlbestand', () => {
  it('zeigt bei fehlendem Treffer den Leerzustand mit Filterhinweis', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Suche nach Bezeichnung, Modulnummer oder Lehrperson'), 'Nichts davon');
    expect(screen.getByText('Keine Treffer')).toBeTruthy();
    expect(screen.queryByText('Softwaretechnik 1')).toBeNull();
  });

  it('findet ein Modul über einen Teil der Bezeichnung', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Suche nach Bezeichnung, Modulnummer oder Lehrperson'), 'software');
    expect(screen.getByText('Softwaretechnik 1')).toBeTruthy();
    expect(screen.queryByText('Tutorium Mathematik')).toBeNull();
  });
});

describe('Abwahl eines Moduls mit vorhandenen Planeinträgen', () => {
  it('Modul mit Planeinträgen abgewählt: erfragt, ob die Termine mit entfernt werden sollen, vorbelegt auf „nein"', () => {
    mockEntries = [offiziellerEintrag({ id: 'bestehend-1' })];
    renderScreen();

    fireEvent.press(screen.getByLabelText('Softwaretechnik 1'));
    expect(screen.getByText(/stehen bereits Termine/)).toBeTruthy();
    // Vorbelegt auf „nein": ohne weiteres Zutun bleibt der Eintrag unangetastet.
    expect(mockEntfernen).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Softwaretechnik 1').props.accessibilityState.checked).toBe(true);
  });

  it('Termine sollen bleiben: bestätigt die Abwahl ohne Entfernen, die Termine bleiben im Plan erhalten', () => {
    mockEntries = [offiziellerEintrag({ id: 'bestehend-1' })];
    renderScreen();

    fireEvent.press(screen.getByLabelText('Softwaretechnik 1'));
    fireEvent.press(screen.getByText('Nein, nur abwählen'));

    expect(mockEntfernen).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Softwaretechnik 1').props.accessibilityState.checked).toBe(false);
  });

  it('entfernt die Termine, wenn dem ausdrücklich zugestimmt wird', () => {
    mockEntries = [offiziellerEintrag({ id: 'bestehend-1' })];
    renderScreen();

    fireEvent.press(screen.getByLabelText('Softwaretechnik 1'));
    fireEvent.press(screen.getByText('Ja, Termine entfernen'));

    expect(mockEntfernen).toHaveBeenCalledWith('bestehend-1');
  });

  it('Modul ohne Planeinträge abgewählt: entfällt die Rückfrage, die Abwahl wirkt unmittelbar', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Softwaretechnik 1')); // ankreuzen
    fireEvent.press(screen.getByLabelText('Softwaretechnik 1')); // wieder abwählen — keine Planeinträge vorhanden

    expect(screen.queryByText(/stehen bereits Termine/)).toBeNull();
    expect(screen.getByLabelText('Softwaretechnik 1').props.accessibilityState.checked).toBe(false);
  });
});

describe('Verwerfen der Modulauswahl', () => {
  it('nimmt nach Bestätigung sämtliche Modulhaken auf einmal zurück', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Softwaretechnik 1'));
    fireEvent.press(screen.getByLabelText('Tutorium Mathematik'));

    fireEvent.press(screen.getByLabelText('Auswahl verwerfen'));
    fireEvent.press(screen.getByText('Verwerfen'));

    expect(screen.getByLabelText('Softwaretechnik 1').props.accessibilityState.checked).toBe(false);
    expect(screen.getByLabelText('Tutorium Mathematik').props.accessibilityState.checked).toBe(false);
  });

  it('fragt bei verworfenen Modulen mit Planeinträgen nach deren Verbleib, wie die Abwahl eines einzelnen Moduls', () => {
    mockEntries = [offiziellerEintrag({ id: 'bestehend-1' })];
    renderScreen();
    fireEvent.press(screen.getByLabelText('Softwaretechnik 1'));

    fireEvent.press(screen.getByLabelText('Auswahl verwerfen'));
    fireEvent.press(screen.getByText('Verwerfen'));

    expect(screen.getByText(/stehen bereits Termine/)).toBeTruthy();
    fireEvent.press(screen.getByText('Ja, Termine entfernen'));
    expect(mockEntfernen).toHaveBeenCalledWith('bestehend-1');
  });
});

describe('Kein Bedienweg ohne gewählte Endpunkte', () => {
  it('bietet einen Bedienweg zur Einrichtung an, statt eine leere Liste zu zeigen', () => {
    mockEinrichtung = { endpunkte: [], gruppenkennung: null, gruppenkennungVorschlag: null };
    renderScreen();
    expect(screen.getByText('Noch keine Einrichtung')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Einrichtung öffnen'));
    expect(mockRouter.push).toHaveBeenCalledWith('/einrichtung');
  });
});
