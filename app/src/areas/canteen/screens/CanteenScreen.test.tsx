import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RefreshControl } from 'react-native';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import { ThemeProvider } from '@/theme';
import { CanteenScreen } from './CanteenScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

let mockSelection: any;
let mockPlaene: Record<string, any>;
let mockVerzeichnisse: any;
let mockGroup: 'student' | 'staff' | 'guest';
let mockCodes: string[];
let mockHas: jest.Mock;
const mockToggle = jest.fn();

const mockMensen = [
  {
    id: 'Mensa',
    name: 'Hauptmensa',
    standardAuswahl: true,
    reihenfolge: 10,
    oeffnungszeiten: ['11:30 - 14:45', 'a', 'b', 'c', 'd'],
  },
  { id: 'Sued', name: 'Mensa Süd', standardAuswahl: false, reihenfolge: 20 },
];

jest.mock('../selection', () => ({ useCanteenSelection: () => mockSelection }));
jest.mock('../favorites', () => ({
  useFavorites: () => ({ list: [], has: mockHas, toggle: mockToggle }),
}));
jest.mock('../priceGroup', () => ({
  usePriceGroup: () => ({ group: mockGroup, loaded: true, setGroup: jest.fn() }),
}));
jest.mock('../intolerances', () => ({
  useIntolerances: () => ({ codes: mockCodes, loaded: true, toggle: jest.fn(), clear: jest.fn() }),
}));
jest.mock('../api', () => ({
  apiSprache: () => 'de',
  speiseplanQueryOptions: (id: string, datum: string) => ({
    queryKey: ['speiseplan', id, datum, 'de'],
    queryFn: async () => ({ gerichte: [], standAlter: {} }),
  }),
  useMensen: () => ({ mensen: mockMensen, istAusgangsbestand: false, query: {} }),
  useMensaVerzeichnisse: () => mockVerzeichnisse,
  useSpeisepläne: (ids: string[]) => ids.map((id) => mockPlaene[id] ?? leer()),
}));
jest.mock('../registerBackgroundTask', () => ({
  nachholenBeimAppStart: jest.fn(() => Promise.resolve()),
  lieblingsgerichtAbgleichRegistrieren: jest.fn(() => Promise.resolve()),
  fuehreLieblingsgerichtAbgleichAus: jest.fn(() => Promise.resolve(0)),
}));
jest.mock('../notifications', () => ({
  benachrichtigungErlaubt: jest.fn(() => Promise.resolve(true)),
  benachrichtigungBerechtigungAnfragen: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('@/consent/ConsentProvider', () => ({
  useConsent: () => ({ personalDataAllowed: true, accept: jest.fn() }),
}));

const gericht = (over: Partial<Record<string, unknown>> = {}) => ({
  schluessel: 'bolognese',
  kategorie: 'Menü 1',
  bezeichnung: 'Bolognese',
  preisStudierende: 3.3,
  preisMitarbeitende: 5.4,
  preisGaeste: 6.5,
  zusatzstoffe: ['Weizen'],
  kennzeichnungen: ['Vegan'],
  ...over,
});

function qr(gerichte: unknown[] | undefined, over: Partial<Record<string, unknown>> = {}) {
  return {
    data:
      gerichte === undefined
        ? undefined
        : { gerichte, standAlter: { abgerufenAm: new Date().toISOString() } },
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(() => Promise.resolve()),
    ...over,
  };
}

const leer = () => qr([]);

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  mockHas = jest.fn(() => false);
  mockSelection = { ids: ['Mensa'], loaded: true, toggle: jest.fn(), move: jest.fn() };
  mockPlaene = { Mensa: qr([gericht()]) };
  mockVerzeichnisse = { data: { kategorien: [], zusatzstoffe: [], kennzeichnungen: [] } };
  mockGroup = 'student';
  mockCodes = [];
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: Infinity } },
  });
});

afterEach(() => {
  cleanup();
  client.clear();
  client.unmount();
});

function renderScreen() {
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <CanteenScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('MENSA-F-020 Leerzustand ohne gewählte Mensa verweist auf die Auswahl', () => {
  it('zeigt den Hinweis und Schaltflächen für Auswahl und Alle-Mensen-Ansicht', () => {
    mockSelection = { ids: [], loaded: true, toggle: jest.fn(), move: jest.fn() };
    renderScreen();
    expect(screen.getByText('Noch keine Mensa gewählt')).toBeTruthy();
    expect(screen.getByText('Mensen auswählen')).toBeTruthy();
    expect(screen.getByText('Alle Mensen anzeigen')).toBeTruthy();
  });
});

describe('MENSA-F-010 / MENSA-F-030 / MENSA-F-220 Gerichte des Tages mit dem Preis der eigenen Preisgruppe', () => {
  it('zeigt Bezeichnung, Kennzeichnung, genau einen Preis und Zusatzstoffe', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getByText('Vegan')).toBeTruthy();
    expect(screen.getByText('Studierende 3,30 €')).toBeTruthy();
    expect(screen.queryByText(/Gäste 6,50/)).toBeNull();
    expect(screen.getByText(/Zusatzstoffe: Weizen/)).toBeTruthy();
  });

  it('zeigt für Mitarbeitende den Mitarbeitenden-Preis', async () => {
    mockGroup = 'staff';
    renderScreen();
    await waitFor(() => expect(screen.getByText('Mitarbeitende 5,40 €')).toBeTruthy());
  });
});

describe('MENSA-F-012 / MENSA-F-014 zusammengefasste Liste über die gewählten Mensen', () => {
  it('führt ein an beiden Mensen angebotenes Gericht einmal und nennt beide Mensen', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = { Mensa: qr([gericht()]), Sued: qr([gericht()]) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getAllByText('Bolognese')).toHaveLength(1);
    expect(screen.getByText('Angeboten in: Hauptmensa, Mensa Süd')).toBeTruthy();
  });
});

describe('MENSA-F-018 maßgebliche Mensa bestimmt die angezeigten Angaben', () => {
  it('wechselt den Preis, wenn die aktive Mensa gewechselt wird', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Mensa: qr([gericht({ preisStudierende: 3.3 })]),
      Sued: qr([gericht({ preisStudierende: 9.9 })]),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Studierende 3,30 €')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Mensa Süd'));
    await waitFor(() => expect(screen.getByText('Studierende 9,90 €')).toBeTruthy());
  });
});

describe('MENSA-F-045 Blättern zu benachbarten Tagen', () => {
  it('ein Tastendruck auf „Nächster Tag" ändert das angezeigte Datum', async () => {
    renderScreen();
    const vorher = screen.getByText(/\d{2}\.\d{2}\.\d{4}/).props.children;
    fireEvent.press(screen.getByLabelText('Nächster Tag'));
    await waitFor(() =>
      expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}/).props.children).not.toEqual(vorher),
    );
  });

  it('„Tag zurück" ist am heutigen Tag nicht auslösbar (MENSA-F-042)', async () => {
    renderScreen();
    const zurueck = await screen.findByLabelText('Vorheriger Tag');
    expect(zurueck.props.accessibilityState.disabled).toBe(true);
  });
});

describe('MENSA-F-049 geschlossene Mensa am Seitenende', () => {
  it('weist eine gewählte Mensa ohne Angebot als geschlossen aus', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = { Mensa: qr([gericht()]), Sued: qr([]) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getByText('Mensa Süd hat an diesem Tag geschlossen.')).toBeTruthy();
  });
});

describe('MENSA-F-120 Handlung „Alle Mensen anzeigen" am Seitenende', () => {
  it('stellt die Handlung bereit und öffnet die Alle-Mensen-Ansicht', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    fireEvent.press(screen.getByText('Alle Mensen anzeigen'));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/canteen/alle'));
  });
});

describe('MENSA-F-170 Zugang zu den Unverträglichkeiten oben rechts', () => {
  it('öffnet den Unverträglichkeiten-Bildschirm', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Unverträglichkeiten festlegen'));
    expect(mockRouter.push).toHaveBeenCalledWith('/canteen/unvertraeglichkeiten');
  });
});

describe('MENSA-F-190 / MENSA-F-200 Unverträglichkeiten-Filter blendet Gerichte aus und zählt sie', () => {
  it('blendet ein betroffenes Gericht aus und nennt die Anzahl am Seitenende', async () => {
    mockPlaene = {
      Mensa: qr([
        gericht(),
        gericht({ schluessel: 'fisch', bezeichnung: 'Fischfilet', zusatzstoffe: ['Fisch'] }),
      ]),
    };
    mockVerzeichnisse = {
      data: { kategorien: [], zusatzstoffe: [{ id: 'D', bezeichnung: 'Fisch' }], kennzeichnungen: [] },
    };
    mockCodes = ['D'];
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.queryByText('Fischfilet')).toBeNull();
    expect(screen.getByText('1 Gericht wegen deiner Unverträglichkeiten ausgeblendet')).toBeTruthy();
  });

  it('ohne festgelegte Unverträglichkeit verhält sich die Liste unverändert', async () => {
    mockPlaene = {
      Mensa: qr([
        gericht(),
        gericht({ schluessel: 'fisch', bezeichnung: 'Fischfilet', zusatzstoffe: ['Fisch'] }),
      ]),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Fischfilet')).toBeTruthy());
    expect(screen.queryByText(/ausgeblendet/)).toBeNull();
  });
});

describe('MENSA-F-240 Herunterziehen lädt die Tagespläne neu', () => {
  it('löst beim Herunterziehen einen erneuten Abruf aus', async () => {
    const refetch = jest.fn(() => Promise.resolve());
    mockPlaene = { Mensa: qr([gericht()], { refetch }) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    const control = screen.UNSAFE_getByType(RefreshControl);
    fireEvent(control, 'refresh');
    expect(refetch).toHaveBeenCalled();
  });
});

describe('MENSA-F-060 sichtbare Fehlermeldung statt stiller Leeransicht', () => {
  it('zeigt bei einem Ladefehler ohne Zwischenspeicher eine Fehlermeldung mit Wiederholen', async () => {
    mockPlaene = {
      Mensa: qr(undefined, {
        isError: true,
        error: new AppError({ kind: 'server', message: 'error.server', status: 500, retryable: true }),
      }),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Etwas ist schiefgelaufen')).toBeTruthy());
    expect(screen.getByText('Erneut versuchen')).toBeTruthy();
  });
});

describe('MENSA-F-080 / Abschnitt 7 Lieblingsgericht markieren und Hervorhebung', () => {
  it('der Stern schaltet die Markierung um', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Als Lieblingsgericht markieren'));
    expect(mockToggle).toHaveBeenCalledWith({ schluessel: 'bolognese', bezeichnung: 'Bolognese' });
  });
});
