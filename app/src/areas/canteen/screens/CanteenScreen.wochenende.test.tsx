import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { CanteenScreen } from './CanteenScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));

const mockMensen = [
  {
    id: 'Mensa',
    name: 'Hauptmensa',
    standardAuswahl: true,
    reihenfolge: 10,
    oeffnungszeiten: ['11:30 - 14:45', 'a', 'b', 'c', 'd'],
  },
];

let mockSelection: any;
let mockPlaene: Record<string, any>;

jest.mock('../selection', () => ({ useCanteenSelection: () => mockSelection }));
jest.mock('../favorites', () => ({
  useFavorites: () => ({ list: [], has: () => false, toggle: jest.fn() }),
}));
jest.mock('../priceGroup', () => ({
  usePriceGroup: () => ({ group: 'student', loaded: true, setGroup: jest.fn() }),
}));
jest.mock('../intolerances', () => ({
  useIntolerances: () => ({ codes: [], loaded: true, toggle: jest.fn(), clear: jest.fn() }),
}));
jest.mock('../priceLimit', () => ({
  PREIS_MIN: 1,
  PREIS_MAX: 10,
  usePriceLimit: () => ({
    limit: null,
    loaded: true,
    erhoehen: jest.fn(),
    senken: jest.fn(),
    clear: jest.fn(),
  }),
}));
jest.mock('../api', () => ({
  apiSprache: () => 'de',
  speiseplanQueryOptions: (id: string, datum: string) => ({
    queryKey: ['speiseplan', id, datum, 'de'],
    queryFn: async () => ({ gerichte: [], standAlter: {} }),
  }),
  useMensen: () => ({ mensen: mockMensen, istAusgangsbestand: false, query: {} }),
  useMensaVerzeichnisse: () => ({
    data: { kategorien: [], zusatzstoffe: [], kennzeichnungen: [] },
  }),
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

function qr(gerichte: unknown[]) {
  return {
    data: { gerichte, standAlter: { abgerufenAm: new Date().toISOString() } },
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(() => Promise.resolve()),
  };
}

const leer = () => qr([]);

let client: QueryClient;

// `CanteenScreen.test.tsx` hält die Uhr auf einem Montag fest und kann deshalb
// nicht mitbenutzt werden: Hier ist gerade der Wochenendtag der Prüfgegenstand.
// 2026-09-05 ist ein Samstag, 2026-09-06 ein Sonntag, 2026-09-07 ein Montag.
//
// Festgehalten wird ausschließlich `Date`. Alle Zeitgeber bleiben echt, damit
// `waitFor` und TanStack Query unverändert arbeiten.
const SAMSTAG = new Date(2026, 8, 5, 12, 0, 0);

beforeAll(() => {
  jest.useFakeTimers({
    now: SAMSTAG,
    doNotFake: [
      'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
      'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask',
      'performance', 'requestAnimationFrame', 'cancelAnimationFrame',
      'requestIdleCallback', 'cancelIdleCallback', 'hrtime',
    ],
  });
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSelection = { ids: ['Mensa'], loaded: true, toggle: jest.fn(), move: jest.fn() };
  // Keine gewählte Mensa führt an diesem Wochenende ein Angebot.
  mockPlaene = { Mensa: qr([]) };
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

describe('Aktueller Tag als Ausgangspunkt der Tagesauswahl', () => {
  it('zeigt an einem angebotsfreien Samstag den Samstag mit dem Leerzustand „kein Angebot"', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Heute kein Angebot')).toBeTruthy());
    expect(screen.getByText('Samstag, 05.09.2026')).toBeTruthy();
    expect(screen.getByText('Hauptmensa hat an diesem Tag geschlossen.')).toBeTruthy();

    // Der aktuelle Tag ist die Untergrenze: kein „Tag zurück".
    const zurueck = screen.getByLabelText('Vorheriger Tag');
    expect(zurueck.props.accessibilityState.disabled).toBe(true);
  });
});

describe('Überspringen angebotsfreier Wochenendtage: der aktuelle Tag ist ausgenommen', () => {
  it('blättert vom angebotsfreien Samstag auf den Montag und wieder zurück auf den Samstag', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Samstag, 05.09.2026')).toBeTruthy());

    // Vorwärts: der angebotsfreie Sonntag wird übersprungen.
    fireEvent.press(screen.getByLabelText('Nächster Tag'));
    await waitFor(() => expect(screen.getByText('Montag, 07.09.2026')).toBeTruthy());

    // Zurück: der Sonntag wird wieder übersprungen, der aktuelle Samstag nicht.
    const zurueck = screen.getByLabelText('Vorheriger Tag');
    expect(zurueck.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(zurueck);
    await waitFor(() => expect(screen.getByText('Samstag, 05.09.2026')).toBeTruthy());
  });
});
