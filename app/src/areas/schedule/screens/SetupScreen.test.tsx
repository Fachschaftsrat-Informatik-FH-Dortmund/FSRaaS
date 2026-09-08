import { TextInput } from 'react-native';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { SetupScreen } from './SetupScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let mockEinrichtung: any;
const mockEndpunktUmschalten = jest.fn();
const mockSetGruppenkennung = jest.fn();
const mockVorschlagSetzen = jest.fn();
const mockVorschlagBestaetigen = jest.fn();
const mockVorschlagVerwerfen = jest.fn();

let mockMatrikelnummer: string | null;
const mockSetMatrikelnummer = jest.fn();

jest.mock('../einrichtung', () => ({
  GRUPPENKENNUNG_MUSTER: /^[A-Z][0-9]+$/,
  useEinrichtung: () => ({
    einrichtung: mockEinrichtung,
    loaded: true,
    endpunktUmschalten: mockEndpunktUmschalten,
    setGruppenkennung: mockSetGruppenkennung,
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
  useTermineFuerEndpunkte: () => mockTermineQuery,
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

// Kurzausschnitt des Bestands vom 2026-09-08 — ein Endpunkt je Gruppe genügt,
// die vollständige Zuordnung ist in `endpunkte.test.ts` geprüft.
const STUDIENGAENGE = [
  { name: 'Bachelor Informatik (StgPO 2019), VR Praktische Inf.', sname: 'INPBPI', grades: ['2', '4', '6'], po: '2019' },
  { name: 'Blockwoche 1 (13.04.-17.04.2026)', sname: 'Blockwoche1', grades: ['0'], po: null },
  { name: 'Tutorien', sname: 'TUPB', grades: ['0'], po: null },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockEinrichtung = { endpunkte: [], gruppenkennung: null, gruppenkennungVorschlag: null };
  mockMatrikelnummer = null;
  mockStudiengaengeHook = {
    studiengaenge: STUDIENGAENGE,
    istRueckfall: false,
    query: qr(STUDIENGAENGE),
    rueckfallQuery: qr(undefined, { isPending: false }),
  };
  mockTermineQuery = { termine: [], alleGeladen: true, isPending: false, isError: false, isFetching: false, refetch: jest.fn() };
  mockErmittelnHook = { isPending: false, isError: false, isSuccess: false, data: undefined };
});

afterEach(cleanup);

const renderScreen = () =>
  render(
    <ThemeProvider>
      <SetupScreen />
    </ThemeProvider>,
  );

describe('Auswahl der Endpunkte des Lehrangebots', () => {
  it('Erstmalige Einrichtung: bietet die über INT-001 gelieferten Endpunkte gegliedert an, ohne nach einem Fachsemester zu fragen', () => {
    renderScreen();
    expect(screen.getByText('Bachelor Informatik (StgPO 2019), VR Praktische Inf.')).toBeTruthy();
    expect(screen.getByText('Blockwoche 1 (13.04.-17.04.2026)')).toBeTruthy();
    // „Tutorien" erscheint doppelt: als Gruppenüberschrift und als Endpunktname (TUPB).
    expect(screen.getAllByText('Tutorien')).toHaveLength(2);
    expect(screen.queryByText(/Fachsemester/)).toBeNull();
  });

  it('Mehrere Endpunkte gewählt: schaltet jeden angetippten Endpunkt gleichrangig um', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Bachelor Informatik (StgPO 2019), VR Praktische Inf.'));
    fireEvent.press(screen.getByLabelText('Blockwoche 1 (13.04.-17.04.2026)'));
    fireEvent.press(screen.getByLabelText('Tutorien'));
    expect(mockEndpunktUmschalten).toHaveBeenNthCalledWith(1, 'INPBPI');
    expect(mockEndpunktUmschalten).toHaveBeenNthCalledWith(2, 'Blockwoche1');
    expect(mockEndpunktUmschalten).toHaveBeenNthCalledWith(3, 'TUPB');
  });

  it('Endpunkt wieder abgewählt: schaltet nur den angetippten Endpunkt um, ohne planStore zu berühren', () => {
    mockEinrichtung.endpunkte = ['INPBPI', 'TUPB'];
    renderScreen();
    fireEvent.press(screen.getByLabelText('Tutorien'));
    expect(mockEndpunktUmschalten).toHaveBeenCalledWith('TUPB');
    expect(mockEndpunktUmschalten).toHaveBeenCalledTimes(1);
  });
});

describe('Freitextsuche in der Endpunktauswahl', () => {
  it('zeigt nur den passenden Endpunkt, sobald ein Suchtext eingegeben wird', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Suche nach Klar- oder Kurzname'), 'INPBPI');
    expect(screen.getByText('Bachelor Informatik (StgPO 2019), VR Praktische Inf.')).toBeTruthy();
    expect(screen.queryByText('Tutorien')).toBeNull();
  });
});

describe('Gruppenkennung ohne Matrikelnummer', () => {
  beforeEach(() => {
    mockEinrichtung.endpunkte = ['INPBPI'];
  });

  it('Einrichtung ohne Matrikelnummer: schließt die Einrichtung durch Eingabe der vollständigen Kennung in das Textfeld ab', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Gruppenkennung manuell eingeben'), 'C8');
    expect(mockSetGruppenkennung).toHaveBeenCalledWith('C8');
    expect(mockMatrikelnummer).toBeNull();
  });

  it('Voreingestellter Weg: die Matrikelnummer steht an erster Stelle, das manuelle Feld unmittelbar darunter — kein Umschalter', () => {
    renderScreen();
    const eingabefelder = screen.UNSAFE_getAllByType(TextInput).map((n) => n.props.accessibilityLabel);
    const posMatrikelnummer = eingabefelder.indexOf('Matrikelnummer');
    const posManuell = eingabefelder.indexOf('Gruppenkennung manuell eingeben');
    expect(posMatrikelnummer).toBeGreaterThan(-1);
    expect(posManuell).toBe(posMatrikelnummer + 1); // unmittelbar darunter, kein Umschalter dazwischen
    expect(screen.queryByLabelText('Über Matrikelnummer')).toBeNull(); // kein Tab-Umschalter im Baum
    expect(screen.queryByLabelText('Manuell')).toBeNull();
  });

  it('Kleinschreibung eingegeben: übernimmt "c8" als "C8", ohne die Eingabe zurückzuweisen', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Gruppenkennung manuell eingeben'), 'c8');
    expect(mockSetGruppenkennung).toHaveBeenCalledWith('C8');
  });

  it('benennt die fehlende Zahl bei einer unvollständigen Eingabe', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Gruppenkennung manuell eingeben'), 'C');
    expect(screen.getByText(/Unvollständig/)).toBeTruthy();
    expect(mockSetGruppenkennung).not.toHaveBeenCalledWith('C');
  });

  it('lässt sich ohne jede Matrikelnummer und ohne Gruppenkennung fortsetzen, sobald ein Endpunkt gewählt ist', () => {
    renderScreen();
    const knopf = screen.getByLabelText('Weiter zur Kursauswahl');
    expect(knopf.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('verhindert das Fortsetzen, solange kein Endpunkt gewählt ist', () => {
    mockEinrichtung.endpunkte = [];
    renderScreen();
    const knopf = screen.getByLabelText('Weiter zur Kursauswahl');
    expect(knopf.props.accessibilityState?.disabled).toBe(true);
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

describe('SCHED-F-690 Ermittlung der Gruppenkennung aus der Matrikelnummer', () => {
  beforeEach(() => {
    mockEinrichtung.endpunkte = ['INPBPI'];
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
    expect(screen.getByLabelText('Gruppenkennung manuell eingeben')).toBeTruthy();
  });
});

describe('SCHED-F-700 Ermittelte Gruppenkennung erst nach Bestätigung übernehmen', () => {
  beforeEach(() => {
    mockEinrichtung.endpunkte = ['INPBPI'];
    mockEinrichtung.gruppenkennungVorschlag = 'O7';
  });

  it('übernimmt den Vorschlag erst nach ausdrücklicher Bestätigung', () => {
    renderScreen();
    expect(screen.getByText(/Gefunden: O7/)).toBeTruthy();
    expect(mockSetGruppenkennung).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Übernehmen'));
    expect(mockVorschlagBestaetigen).toHaveBeenCalled();
  });

  it('verwirft eine abgelehnte Kennung, ohne den Modus zu wechseln (es gibt keinen mehr)', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Das bin nicht ich'));
    expect(mockVorschlagVerwerfen).toHaveBeenCalled();
  });
});

describe('Rückmeldung während der Eingabe der Gruppenkennung', () => {
  it('zeigt „0 von N Terminen" als gültiges Ergebnis, kein Fehler', () => {
    mockEinrichtung.endpunkte = ['INPBPI'];
    mockEinrichtung.gruppenkennung = 'Z';
    mockTermineQuery = { termine: [{ studentSet: 'A' }, { studentSet: 'B' }], alleGeladen: true, isPending: false, isError: false, isFetching: false, refetch: jest.fn() };
    renderScreen();
    expect(screen.getByText('0 von 2 Terminen betreffen dich')).toBeTruthy();
  });

  it('zählt die tatsächlich eingeschlossenen Termine', () => {
    mockEinrichtung.endpunkte = ['INPBPI'];
    mockEinrichtung.gruppenkennung = 'A';
    mockTermineQuery = {
      termine: [{ studentSet: 'A' }, { studentSet: 'B' }, { studentSet: '*' }],
      alleGeladen: true,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: jest.fn(),
    };
    renderScreen();
    expect(screen.getByText('2 von 3 Terminen betreffen dich')).toBeTruthy();
  });
});
