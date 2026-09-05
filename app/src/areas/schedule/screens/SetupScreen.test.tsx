import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { SetupScreen } from './SetupScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let mockEinrichtung: any;
const mockSetStudiengangUndFachsemester = jest.fn();
const mockSetFachsemester = jest.fn();
const mockSetGruppenkennung = jest.fn();
const mockZusatzHinzufuegen = jest.fn();
const mockZusatzEntfernen = jest.fn();
const mockVorschlagSetzen = jest.fn();
const mockVorschlagBestaetigen = jest.fn();
const mockVorschlagVerwerfen = jest.fn();

let mockMatrikelnummer: string | null;
const mockSetMatrikelnummer = jest.fn();

jest.mock('../einrichtung', () => ({
  GRUPPENKENNUNG_MUSTER: /^[A-Z][0-9]*$/,
  useEinrichtung: () => ({
    einrichtung: mockEinrichtung,
    loaded: true,
    setStudiengangUndFachsemester: mockSetStudiengangUndFachsemester,
    setFachsemester: mockSetFachsemester,
    setGruppenkennung: mockSetGruppenkennung,
    zusatzFachsemesterHinzufuegen: mockZusatzHinzufuegen,
    zusatzFachsemesterEntfernen: mockZusatzEntfernen,
    gruppenkennungVorschlagSetzen: mockVorschlagSetzen,
    gruppenkennungVorschlagBestaetigen: mockVorschlagBestaetigen,
    gruppenkennungVorschlagVerwerfen: mockVorschlagVerwerfen,
  }),
  useMatrikelnummer: () => ({
    matrikelnummer: mockMatrikelnummer,
    loaded: true,
    setMatrikelnummer: mockSetMatrikelnummer,
  }),
}));

let mockStudiengaengeHook: any;
let mockTermineQuery: any;
let mockErmittelnHook: any;
const mockErmittelnMutate = jest.fn();

jest.mock('../api', () => ({
  useStudiengaenge: () => mockStudiengaengeHook,
  useTermine: () => mockTermineQuery,
  useGruppenkennungErmitteln: () => ({ mutate: mockErmittelnMutate, ...mockErmittelnHook }),
}));

function qr(data: unknown, over: Partial<Record<string, unknown>> = {}) {
  return {
    data,
    isPending: false,
    isError: false,
    isSuccess: data !== undefined,
    isFetching: false,
    isStale: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(),
    ...over,
  };
}

const STUDIENGAENGE = [
  { name: 'Praktische Informatik', sname: 'INPBPI', grades: ['1', '2', '3'] },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockEinrichtung = {
    sname: null,
    grade: null,
    gruppenkennung: null,
    zusatzFachsemester: [],
    gruppenkennungVorschlag: null,
  };
  mockMatrikelnummer = null;
  mockStudiengaengeHook = {
    studiengaenge: STUDIENGAENGE,
    istRueckfall: false,
    query: qr(STUDIENGAENGE),
    rueckfallQuery: qr(undefined, { isPending: false }),
  };
  mockTermineQuery = qr(undefined);
  mockErmittelnHook = { isPending: false, isError: false, isSuccess: false, data: undefined };
});

afterEach(cleanup);

const renderScreen = () =>
  render(
    <ThemeProvider>
      <SetupScreen />
    </ThemeProvider>,
  );

describe('SCHED-F-020 Auswahl von Studiengang und Fachsemester', () => {
  it('übernimmt bei der Studiengangswahl automatisch dessen erstes Fachsemester', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Praktische Informatik'));
    expect(mockSetStudiengangUndFachsemester).toHaveBeenCalledWith('INPBPI', '1');
  });

  it('setzt bei der Fachsemesterwahl das gewählte Fachsemester', () => {
    mockEinrichtung.sname = 'INPBPI';
    // grade bewusst noch nicht gesetzt: der Abschnitt „weitere Fachsemester"
    // (SCHED-F-640) erscheint erst danach und würde sonst ebenfalls
    // „Fachsemester 2" anbieten.
    renderScreen();
    fireEvent.press(screen.getByText('Fachsemester 2'));
    expect(mockSetFachsemester).toHaveBeenCalledWith('2');
  });
});

describe('SCHED-F-254 Rückfallliste mit sichtbarem Altershinweis', () => {
  it('zeigt einen Hinweis mit dem Alter der Rückfallliste, wenn INT-001 nicht erreichbar ist', () => {
    mockStudiengaengeHook = {
      studiengaenge: STUDIENGAENGE,
      istRueckfall: true,
      query: qr(undefined, { isError: true, isSuccess: false }),
      rueckfallQuery: qr(STUDIENGAENGE, { dataUpdatedAt: Date.now() }),
    };
    renderScreen();
    expect(screen.getByText(/Rückfallliste/)).toBeTruthy();
    expect(screen.getByText(/Stand/)).toBeTruthy();
  });
});

describe('SCHED-F-640 Weitere Fachsemester zusätzlich abrufen', () => {
  it('bietet die übrigen Fachsemester des Studiengangs als Schalter an', () => {
    mockEinrichtung.sname = 'INPBPI';
    mockEinrichtung.grade = '1';
    renderScreen();
    fireEvent(screen.getByLabelText('Fachsemester 2 zusätzlich laden'), 'valueChange', true);
    expect(mockZusatzHinzufuegen).toHaveBeenCalledWith('2');
  });

  it('entfernt ein bereits hinzugefügtes zusätzliches Fachsemester wieder', () => {
    mockEinrichtung.sname = 'INPBPI';
    mockEinrichtung.grade = '1';
    mockEinrichtung.zusatzFachsemester = ['2'];
    renderScreen();
    fireEvent(screen.getByLabelText('Fachsemester 2 zusätzlich laden'), 'valueChange', false);
    expect(mockZusatzEntfernen).toHaveBeenCalledWith('2');
  });
});

describe('SCHED-F-720 Manuelle Gruppenkennung: Buchstabe verpflichtend, Zahl freiwillig', () => {
  beforeEach(() => {
    mockEinrichtung.sname = 'INPBPI';
    mockEinrichtung.grade = '1';
  });

  it('setzt beim Antippen eines Buchstabens die Gruppenkennung ohne Zahl', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Manuell'));
    fireEvent.press(screen.getByLabelText('C'));
    expect(mockSetGruppenkennung).toHaveBeenCalledWith('C');
  });

  it('ergänzt die freiwillige Zahl um den bereits gewählten Buchstaben', () => {
    mockEinrichtung.gruppenkennung = 'C';
    renderScreen();
    fireEvent.press(screen.getByText('Manuell'));
    fireEvent.changeText(screen.getByLabelText('Zahl (freiwillig)'), '8');
    expect(mockSetGruppenkennung).toHaveBeenCalledWith('C8');
  });

  it('lässt sich ohne jede Matrikelnummer und ohne Gruppenkennung vollständig abschließen', () => {
    renderScreen();
    const knopf = screen.getByLabelText('Weiter zur Kursauswahl');
    expect(knopf.props.accessibilityState?.disabled).toBeFalsy();
  });
});

describe('SCHED-F-690 Ermittlung der Gruppenkennung aus der Matrikelnummer', () => {
  beforeEach(() => {
    mockEinrichtung.sname = 'INPBPI';
    mockEinrichtung.grade = '1';
    mockMatrikelnummer = '1234567';
  });

  it('ruft die Ermittlung auf und legt eine gefundene Kennung als Vorschlag ab', () => {
    mockErmittelnMutate.mockImplementation((_wert, opts) => opts.onSuccess('O7'));
    renderScreen();
    fireEvent.press(screen.getByText('Gruppenkennung ermitteln'));
    expect(mockErmittelnMutate).toHaveBeenCalledWith('1234567', expect.any(Object));
    expect(mockVorschlagSetzen).toHaveBeenCalledWith('O7');
  });

  it('zeigt einen ruhigen Hinweis, wenn keine Kennung hinterlegt ist, statt eines Fehlers', () => {
    mockErmittelnHook = { isPending: false, isError: false, isSuccess: true, data: null };
    renderScreen();
    expect(screen.getByText(/keine Gruppe hinterlegt/)).toBeTruthy();
  });

  it('bietet bei einem Abruffehler eine Wiederholen-Option an, die manuelle Angabe bleibt möglich', () => {
    mockErmittelnHook = { isPending: false, isError: true, isSuccess: false, data: undefined };
    renderScreen();
    expect(screen.getByText('Die Gruppenkennung konnte nicht ermittelt werden.')).toBeTruthy();
    expect(screen.getByText('Erneut versuchen')).toBeTruthy();
    expect(screen.getByText('Manuell')).toBeTruthy();
  });
});

describe('SCHED-F-700 Ermittelte Gruppenkennung erst nach Bestätigung übernehmen', () => {
  beforeEach(() => {
    mockEinrichtung.sname = 'INPBPI';
    mockEinrichtung.grade = '1';
    mockEinrichtung.gruppenkennungVorschlag = 'O7';
  });

  it('übernimmt den Vorschlag erst nach ausdrücklicher Bestätigung', () => {
    renderScreen();
    expect(screen.getByText(/Gefunden: O7/)).toBeTruthy();
    expect(mockSetGruppenkennung).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Übernehmen'));
    expect(mockVorschlagBestaetigen).toHaveBeenCalled();
  });

  it('verwirft eine abgelehnte Kennung und wechselt zur manuellen Eingabe', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Das bin nicht ich'));
    expect(mockVorschlagVerwerfen).toHaveBeenCalled();
    expect(screen.getByLabelText('C')).toBeTruthy();
  });
});

describe('SCHED-F-650 Rückmeldung, wie viele Termine des Auswahlbestands die Kennung einschließt', () => {
  it('zeigt „0 von N Terminen" als gültiges Ergebnis, kein Fehler', () => {
    mockEinrichtung.sname = 'INPBPI';
    mockEinrichtung.grade = '1';
    mockEinrichtung.gruppenkennung = 'Z';
    mockTermineQuery = qr([{ studentSet: 'A' }, { studentSet: 'B' }]);
    renderScreen();
    expect(screen.getByText('0 von 2 Terminen betreffen dich')).toBeTruthy();
  });

  it('zählt die tatsächlich eingeschlossenen Termine', () => {
    mockEinrichtung.sname = 'INPBPI';
    mockEinrichtung.grade = '1';
    mockEinrichtung.gruppenkennung = 'A';
    mockTermineQuery = qr([{ studentSet: 'A' }, { studentSet: 'B' }, { studentSet: '*' }]);
    renderScreen();
    expect(screen.getByText('2 von 3 Terminen betreffen dich')).toBeTruthy();
  });
});
