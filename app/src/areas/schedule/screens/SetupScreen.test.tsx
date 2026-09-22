import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { SetupScreen } from './SetupScreen';
import { __leseWeiterAktionForTest, __resetWeiterAktionForTest } from '../weiterAktion';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let mockEinrichtung: any;
const mockEndpunktUmschalten = jest.fn();

jest.mock('../einrichtung', () => ({
  GRUPPENKENNUNG_MUSTER: /^[A-Z][0-9]+$/,
  useEinrichtung: () => ({
    einrichtung: mockEinrichtung,
    loaded: true,
    endpunktUmschalten: mockEndpunktUmschalten,
  }),
}));

let mockStudiengaengeHook: any;

jest.mock('../api', () => ({
  useStudiengaenge: () => mockStudiengaengeHook,
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
  __resetWeiterAktionForTest();
  mockEinrichtung = { endpunkte: [], gruppenkennung: null, gruppenkennungVorschlag: null };
  mockStudiengaengeHook = {
    studiengaenge: STUDIENGAENGE,
    istRueckfall: false,
    query: qr(STUDIENGAENGE),
    rueckfallQuery: qr(undefined, { isPending: false }),
  };
});

afterEach(cleanup);

const renderScreen = () =>
  render(
    <ThemeProvider>
      <SetupScreen />
    </ThemeProvider>,
  );

// Der Weiter-Bedienweg sitzt in der Kopfzeile (`_layout.tsx`), also außerhalb
// des Bildschirms. Hier wird geprüft, was der Bildschirm anmeldet; dass das
// Kopfzeilen-Symbol daran hängt, prüft `WeiterZugang.test.tsx`.
const weiterAktion = __leseWeiterAktionForTest;

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
  it('Suche nach Kurzname: zeigt nur den passenden Endpunkt, sobald ein Suchtext eingegeben wird', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Endpunkt suchen'), 'INPBPI');
    expect(screen.getByText('Bachelor Informatik (StgPO 2019), VR Praktische Inf.')).toBeTruthy();
    expect(screen.queryByText('Tutorien')).toBeNull();
  });

  it('Beschriftung bei gefülltem Feld: die Beschriftung bleibt sichtbar, wenn bereits Text eingegeben ist', () => {
    renderScreen();
    // Als eigenes Textelement über dem Feld, nicht nur als Platzhalter darin.
    expect(screen.getByText('Endpunkt suchen')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Endpunkt suchen'), 'INPBPI');
    expect(screen.getByText('Endpunkt suchen')).toBeTruthy();
  });
});

describe('Eigener Schritt für die Gruppenkennung nach der Modulauswahl', () => {
  it('Einrichtung ohne Gruppenkennung: die Einrichtung verlangt dort keine Gruppenkennung', () => {
    mockEinrichtung.endpunkte = ['INPBPI'];
    renderScreen();
    expect(screen.queryByLabelText('Gruppenkennung manuell eingeben')).toBeNull();
    expect(screen.queryByLabelText('Matrikelnummer')).toBeNull();
    expect(screen.queryByText(/Gruppenkennung/)).toBeNull();
  });
});

describe('Weiterführender Bedienweg in der Kopfzeile', () => {
  it('Nächster Schritt in der Einrichtung: meldet den Weg mit mindestens einem gewählten Endpunkt freigegeben an', () => {
    mockEinrichtung.endpunkte = ['INPBPI'];
    renderScreen();
    const aktion = weiterAktion();
    expect(aktion?.freigegeben).toBe(true);
    aktion?.weiter();
    expect(mockRouter.push).toHaveBeenCalledWith('/kurse');
  });

  it('bleibt zurückgenommen und führt nicht weiter, solange kein Endpunkt gewählt ist', () => {
    mockEinrichtung.endpunkte = [];
    renderScreen();
    const aktion = weiterAktion();
    expect(aktion?.freigegeben).toBe(false);
    aktion?.weiter();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('führt den Weg nicht mehr am Seitenende, sondern allein in der Kopfzeile', () => {
    mockEinrichtung.endpunkte = ['INPBPI'];
    renderScreen();
    expect(screen.queryByLabelText('Weiter zur Kursauswahl')).toBeNull();
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
