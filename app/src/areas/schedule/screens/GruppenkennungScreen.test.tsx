import { TextInput } from 'react-native';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { GruppenkennungScreen } from './GruppenkennungScreen';
import { __leseWeiterAktionForTest, __resetWeiterAktionForTest } from '../weiterAktion';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
let mockParams: { module?: string };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

let mockEinrichtung: any;
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

const STUDIENGAENGE = [
  { name: 'Bachelor Informatik (StgPO 2019), VR Praktische Inf.', sname: 'INPBPI', grades: ['2', '4', '6'], po: '2019' },
];

/** Rohtermin im Zuschnitt von INT-002, so weit `baueModulliste` ihn braucht. */
function termin(over: Partial<Record<string, unknown>> = {}) {
  return {
    courseId: '46813',
    name: 'Informationssicherheit',
    courseType: 'V',
    grade: '4',
    studentSet: 'A',
    lecturerName: 'Muster',
    roomId: 'B.1.01',
    weekday: 'Tue',
    timeBeginMin: 600,
    timeEndMin: 690,
    gueltigVon: null,
    gueltigBis: null,
    ...over,
  };
}

function termineQueryMit(termine: unknown[]) {
  return {
    termine,
    perEndpunkt: [{ sname: 'INPBPI', name: STUDIENGAENGE[0]!.name, termine }],
    alleGeladen: true,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  __resetWeiterAktionForTest();
  mockParams = {};
  mockEinrichtung = { endpunkte: ['INPBPI'], gruppenkennung: null, gruppenkennungVorschlag: null };
  mockMatrikelnummer = null;
  mockStudiengaengeHook = { studiengaenge: STUDIENGAENGE, istRueckfall: false };
  mockTermineQuery = termineQueryMit([]);
  mockErmittelnHook = { isPending: false, isError: false, isSuccess: false, data: undefined };
});

afterEach(cleanup);

const renderScreen = () =>
  render(
    <ThemeProvider>
      <GruppenkennungScreen />
    </ThemeProvider>,
  );

// Der Weiter-Bedienweg sitzt in der Kopfzeile (`_layout.tsx`), also außerhalb
// des Bildschirms. Hier wird geprüft, was der Bildschirm anmeldet; dass das
// Kopfzeilen-Symbol daran hängt, prüft `WeiterZugang.test.tsx`.
const weiterAktion = __leseWeiterAktionForTest;

describe('Gruppenkennung ohne Matrikelnummer', () => {
  it('Einrichtung ohne Matrikelnummer: schließt den Schritt durch Eingabe der vollständigen Kennung in das Textfeld ab', () => {
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
});

describe('Gruppenkennung verpflichtend vor dem Planungsmodus', () => {
  it('Weitergehen ohne Kennung: verwehrt den Übergang und benennt die fehlende Angabe', () => {
    renderScreen();
    const aktion = weiterAktion();
    expect(aktion?.freigegeben).toBe(false);

    act(() => aktion?.weiter());

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(screen.getByText(/Ohne Gruppenkennung geht es nicht weiter/)).toBeTruthy();
  });

  it('führt mit gesetzter Kennung in den Planungsmodus und reicht die gewählten Module weiter', () => {
    mockEinrichtung.gruppenkennung = 'C8';
    mockParams = { module: '46813|4,46884|2' };
    renderScreen();

    weiterAktion()?.weiter();

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/planung',
      params: { module: '46813|4,46884|2' },
    });
  });

  it('Kennung ersetzen statt entfernen: bietet keinen Bedienweg zum ersatzlosen Entfernen', () => {
    mockEinrichtung.gruppenkennung = 'C8';
    renderScreen();
    expect(screen.queryByLabelText('Entfernen')).toBeNull();
    expect(screen.queryByText('Entfernen')).toBeNull();
  });

  it('Kennung ersetzen statt entfernen: ein leer geräumtes Feld lässt den gespeicherten Stand stehen', () => {
    mockEinrichtung.gruppenkennung = 'C8';
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Gruppenkennung manuell eingeben'), '');
    expect(mockSetGruppenkennung).not.toHaveBeenCalled();
  });
});

describe('Rückmeldung während der Eingabe der Gruppenkennung', () => {
  it('Eingabe ohne Treffer: meldet „0 von N Terminen" als gültiges Ergebnis, kein Fehler', () => {
    mockEinrichtung.gruppenkennung = 'Z9';
    mockParams = { module: '46813|4' };
    mockTermineQuery = termineQueryMit([
      termin({ studentSet: 'A' }),
      termin({ studentSet: 'B', courseType: 'Ü' }),
    ]);
    renderScreen();
    expect(screen.getByText('0 von 2 Terminen betreffen dich')).toBeTruthy();
  });

  it('Nicht gewählte Module zählen nicht mit: die Rückmeldung bezieht sich allein auf die gewählten Module', () => {
    mockEinrichtung.gruppenkennung = 'A1';
    mockParams = { module: '46813|4' };
    mockTermineQuery = termineQueryMit([
      termin({ studentSet: 'A' }),
      termin({ studentSet: 'B', courseType: 'Ü' }),
      // Ein Termin eines nicht gewählten Moduls — zählt weder eingeschlossen
      // noch zur Gesamtzahl.
      termin({ courseId: '46884', name: 'Servicemanagement', studentSet: 'A', grade: '2' }),
    ]);
    renderScreen();
    expect(screen.getByText('1 von 2 Terminen betreffen dich')).toBeTruthy();
  });

  it('lässt die Rückmeldung entfallen, wenn keine Module mitgegeben wurden', () => {
    mockEinrichtung.gruppenkennung = 'A1';
    mockParams = {};
    mockTermineQuery = termineQueryMit([termin({ studentSet: 'A' })]);
    renderScreen();
    expect(screen.queryByText(/Terminen betreffen dich/)).toBeNull();
  });
});

describe('SCHED-F-690 Ermittlung der Gruppenkennung aus der Matrikelnummer', () => {
  beforeEach(() => {
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
