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
let mockLimit: number | null;
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
  {
    id: 'Sued',
    name: 'Mensa Süd',
    standardAuswahl: false,
    reihenfolge: 20,
    oeffnungszeiten: ['12:00 - 14:00', 'a', 'b', 'c', 'd'],
  },
];

let mockPreset: any;
const mockPresetSpies = {
  waehle: jest.fn(),
  stelleEin: jest.fn(),
  speichereEigenes: jest.fn(),
  benenneUm: jest.fn(),
  loesche: jest.fn(),
};
jest.mock('../sortierPreset', () => ({
  useSortierGruppierung: () => ({
    aktiv: mockPreset,
    istEntwurf: false,
    presets: [],
    loaded: true,
    ...mockPresetSpies,
  }),
}));

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
jest.mock('../priceLimit', () => ({
  PREIS_MIN: 1,
  PREIS_MAX: 10,
  usePriceLimit: () => ({ limit: mockLimit, loaded: true, erhoehen: jest.fn(), senken: jest.fn(), clear: jest.fn() }),
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

// Der Bildschirm leitet den angezeigten Tag aus `isoHeute()` ab, und
// `oeffnungszeitFuer` liefert an Samstagen und Sonntagen bewusst keine
// Öffnungszeit (MENSA-F-042). Ohne feste Uhr hingen die Erwartungen dieser
// Datei am Wochentag des Testlaufs: an Wochenenden rot, sonst grün.
//
// Festgehalten wird ausschließlich `Date`. Alle Zeitgeber bleiben echt, damit
// `waitFor` und TanStack Query unverändert arbeiten.
const MONTAG = new Date(2026, 8, 7, 12, 0, 0);

beforeAll(() => {
  jest.useFakeTimers({
    now: MONTAG,
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
  mockHas = jest.fn(() => false);
  mockSelection = { ids: ['Mensa'], loaded: true, toggle: jest.fn(), move: jest.fn() };
  mockPlaene = { Mensa: qr([gericht()]) };
  mockVerzeichnisse = { data: { kategorien: [], zusatzstoffe: [], kennzeichnungen: [] } };
  mockGroup = 'student';
  mockCodes = [];
  mockLimit = null;
  // Voreinstellung „Mensa, günstigstes zuerst": nach Mensa gegliedert,
  // Auswahlreihenfolge, Gerichte aufsteigend nach Preis.
  mockPreset = {
    id: 'mensa-guenstigstes',
    eigen: false,
    gruppierung: 'mensa',
    gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
    gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
  };
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

describe('MENSA-F-013 Gliederung primär nach Mensa-Auswahlreihenfolge', () => {
  it('zeigt je gewählter Mensa einen Abschnitt mit Überschrift in Auswahlreihenfolge', async () => {
    mockSelection = { ids: ['Sued', 'Mensa'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Sued: qr([gericht({ schluessel: 'curry', bezeichnung: 'Curry' })]),
      Mensa: qr([gericht()]),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Curry')).toBeTruthy());

    // Abschnittsüberschrift zusätzlich zum Chip → je Mensa zweimal im Baum.
    expect(screen.getAllByText('Mensa Süd').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Hauptmensa').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Curry')).toBeTruthy();
    expect(screen.getByText('Bolognese')).toBeTruthy();
  });
});

describe('MENSA-F-018 / MENSA-F-025 Abschnitt je Mensa, Angaben der Abschnitts-Mensa', () => {
  it('zeigt je Abschnitt den Preis der eigenen Mensa; der Mensa-Wechsel verschiebt kein Gericht', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Mensa: qr([gericht({ preisStudierende: 3.3 })]),
      Sued: qr([gericht({ schluessel: 'curry', bezeichnung: 'Curry', preisStudierende: 9.9 })]),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    // Bolognese im Hauptmensa-Abschnitt (3,30), Curry im Süd-Abschnitt (9,90) — beide gleichzeitig.
    expect(screen.getByText('Studierende 3,30 €')).toBeTruthy();
    expect(screen.getByText('Studierende 9,90 €')).toBeTruthy();

    // Aktive Mensa wechseln ändert die Preise/Positionen nicht.
    fireEvent.press(screen.getByLabelText('Mensa Süd'));
    await waitFor(() => expect(screen.getByText('Studierende 9,90 €')).toBeTruthy());
    expect(screen.getByText('Studierende 3,30 €')).toBeTruthy();
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

  it('MENSA-F-043 „Zu heute" stellt die Tagesauswahl auf den aktuellen Tag zurück', async () => {
    renderScreen();
    const heute = screen.getByText(/\d{2}\.\d{2}\.\d{4}/).props.children;
    expect(screen.queryByText('Zurücksetzen')).toBeNull();

    fireEvent.press(screen.getByLabelText('Nächster Tag'));
    await waitFor(() =>
      expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}/).props.children).not.toEqual(heute),
    );

    fireEvent.press(screen.getByText('Zurücksetzen'));
    await waitFor(() =>
      expect(screen.getByText(/\d{2}\.\d{2}\.\d{4}/).props.children).toEqual(heute),
    );
    expect(screen.queryByText('Zurücksetzen')).toBeNull();
  });

  it('„Tag zurück" ist am heutigen Tag nicht auslösbar (MENSA-F-042)', async () => {
    renderScreen();
    const zurueck = await screen.findByLabelText('Vorheriger Tag');
    expect(zurueck.props.accessibilityState.disabled).toBe(true);
  });
});

describe('Geschlossen-Hinweis für Mensa ohne Angebot', () => {
  it('zeigt den Geschlossen-Hinweis bei Mensa-Gruppierung in ihrem Abschnitt unter der Mensa-Überschrift', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = { Mensa: qr([gericht()]), Sued: qr([]) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    // Chip und Abschnittsüberschrift tragen beide den Namen.
    expect(screen.getAllByText('Mensa Süd').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Mensa Süd hat an diesem Tag geschlossen\./)).toBeTruthy();
  });

  it('zeigt sie ohne Mensa-Gruppierung am Ende der Gerichtsliste', async () => {
    mockPreset = {
      id: 'preis',
      eigen: false,
      gruppierung: 'keine',
      gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
    };
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = { Mensa: qr([gericht()]), Sued: qr([]) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getByText('Mensa Süd hat an diesem Tag geschlossen.')).toBeTruthy();
  });
});

describe('Keine Öffnungszeit für Mensa ohne Angebot', () => {
  it('zeigt bei Mensa-Gruppierung an ihrer Abschnittsüberschrift keine Öffnungszeit', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = { Mensa: qr([gericht()]), Sued: qr([]) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.queryByText(/Geöffnet 12:00/)).toBeNull(); // Süd-Öffnungszeit
    expect(screen.getByText(/Geöffnet 11:30/)).toBeTruthy(); // Hauptmensa mit Angebot weiterhin
  });

  it('zeigt ohne Mensa-Gruppierung keine Öffnungszeit-Zeile am Listenende', async () => {
    mockPreset = {
      id: 'preis',
      eigen: false,
      gruppierung: 'keine',
      gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
    };
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = { Mensa: qr([gericht()]), Sued: qr([]) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.queryByText(/Mensa Süd: geöffnet/)).toBeNull();
    expect(screen.getByText(/Hauptmensa: geöffnet/)).toBeTruthy();
  });
});

describe('Nicht auswählbare Chips ohne sichtbaren Abschnitt', () => {
  it('stellt bei Gruppierung „nach Kategorie" den Chip einer vollständig weggefilterten Kategorie als nicht auswählbar dar', async () => {
    mockPreset = {
      id: 'eigen-kat',
      eigen: true,
      gruppierung: 'kategorie',
      gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
      gerichteSortierung: { kriterium: 'quelle', richtung: 'auf' },
    };
    mockSelection = { ids: ['Mensa'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Mensa: qr([
        gericht({ schluessel: 'a', bezeichnung: 'Auflauf', kategorie: 'Wok', preisStudierende: 3.3 }),
        gericht({ schluessel: 'teuer', bezeichnung: 'Steak', kategorie: 'Aktion', preisStudierende: 9.9 }),
      ]),
    };
    mockLimit = 5;
    renderScreen();
    await waitFor(() => expect(screen.getByText('Auflauf')).toBeTruthy());
    const aktion = screen.getByLabelText('Aktion (an diesem Tag geschlossen)');
    expect(aktion.props.accessibilityState.disabled).toBe(true);
  });

  it('lässt bei Mensa-Gruppierung den Chip einer geschlossenen Mensa auswählbar, er führt zu ihrem Abschnitt mit dem Geschlossen-Hinweis', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = { Mensa: qr([gericht()]), Sued: qr([]) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    const chip = screen.getByLabelText('Mensa Süd');
    expect(chip.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(chip);
    expect(screen.getByText(/Mensa Süd hat an diesem Tag geschlossen\./)).toBeTruthy();
  });
});

describe('Hinweis bei vollständig gefilterter Mensa', () => {
  it('führt den Abschnitt einer Mensa fort, deren Gerichte alle durch die Filtervorgaben ausgeblendet sind, mit einem eigenen, vom Geschlossen-Hinweis unterscheidbaren Hinweis', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Mensa: qr([gericht({ preisStudierende: 9.9 })]),
      Sued: qr([gericht({ schluessel: 'curry', bezeichnung: 'Curry', preisStudierende: 2.2 })]),
    };
    mockLimit = 5;
    renderScreen();
    await waitFor(() => expect(screen.getByText('Curry')).toBeTruthy());
    // Chip und Abschnittsüberschrift — der Abschnitt bleibt bestehen.
    expect(screen.getAllByText('Hauptmensa').length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText('Alle Gerichte dieser Mensa sind durch deine Filter ausgeblendet.'),
    ).toBeTruthy();
    expect(screen.queryByText(/hat an diesem Tag geschlossen/)).toBeNull();
  });
});

describe('Öffnungszeit an der Mensa-Abschnittsüberschrift', () => {
  it('zeigt bei Mensa-Gruppierung die Öffnungszeit an der Abschnittsüberschrift, nicht am Listenende', async () => {
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Mensa: qr([gericht()]),
      Sued: qr([gericht({ schluessel: 'curry', bezeichnung: 'Curry' })]),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getByText('Geöffnet 11:30 - 14:45')).toBeTruthy();
    expect(screen.queryByText(/Hauptmensa: geöffnet/)).toBeNull();
  });

  it('zeigt die Abschnittsüberschrift mit Öffnungszeit auch bei nur einer gewählten Mensa', async () => {
    renderScreen(); // Standard-Auswahl: nur „Mensa".
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getByText('Hauptmensa')).toBeTruthy();
    expect(screen.getByText('Geöffnet 11:30 - 14:45')).toBeTruthy();
  });

  it('zeigt ohne Mensa-Gruppierung die Öffnungszeiten am Ende der Gerichtsliste', async () => {
    mockPreset = {
      id: 'preis',
      eigen: false,
      gruppierung: 'keine',
      gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getByText(/Hauptmensa: geöffnet/)).toBeTruthy();
    expect(screen.queryByText('Geöffnet 11:30 - 14:45')).toBeNull();
  });
});

describe('Ausweis der anbietenden Mensa ohne Mensa-Gliederung', () => {
  it('nennt bei „keine Gruppierung" die Mensa eines Gerichts, das nur an einer von mehreren gewählten Mensen angeboten wird', async () => {
    mockPreset = {
      id: 'preis',
      eigen: false,
      gruppierung: 'keine',
      gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
    };
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = { Mensa: qr([gericht()]), Sued: qr([]) };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getByText('Angeboten in: Hauptmensa')).toBeTruthy();
  });

  it('nennt bei Gruppierung „nach Kategorie" an jedem Gericht die anbietende(n) Mensa/Mensen', async () => {
    mockPreset = {
      id: 'eigen-kat',
      eigen: true,
      gruppierung: 'kategorie',
      gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
      gerichteSortierung: { kriterium: 'quelle', richtung: 'auf' },
    };
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Mensa: qr([gericht({ schluessel: 'a', bezeichnung: 'Auflauf', kategorie: 'Wok' })]),
      Sued: qr([gericht({ schluessel: 'b', bezeichnung: 'Brot', kategorie: 'Aktion' })]),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Auflauf')).toBeTruthy());
    expect(screen.getByText('Angeboten in: Hauptmensa')).toBeTruthy();
    expect(screen.getByText('Angeboten in: Mensa Süd')).toBeTruthy();
  });

  it('nennt keine Mensa, wenn insgesamt nur eine Mensa gewählt ist', async () => {
    mockPreset = {
      id: 'preis',
      eigen: false,
      gruppierung: 'keine',
      gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
    };
    renderScreen(); // Standard-Auswahl: nur „Mensa".
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.queryByText(/Angeboten in/)).toBeNull();
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

describe('MENSA-F-280 Zugang zum Ernährungsfilter auf Titelhöhe', () => {
  it('rendert den Filterzugang nicht mehr in der Datumszeile des Bildschirms', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    // Der Zugang sitzt jetzt in der Kopfzeile (headerRight, siehe FilterZugang.test.tsx).
    expect(screen.queryByLabelText('Ernährungsfilter öffnen')).toBeNull();
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
    expect(screen.getByText('1 Gericht wegen deiner Filter ausgeblendet')).toBeTruthy();
  });

  it('MENSA-F-235 blendet Gerichte über dem Höchstpreis aus und zählt sie', async () => {
    mockPlaene = {
      Mensa: qr([
        gericht({ preisStudierende: 3.3 }),
        gericht({ schluessel: 'teuer', bezeichnung: 'Steak', preisStudierende: 9.9 }),
      ]),
    };
    mockLimit = 4;
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.queryByText('Steak')).toBeNull();
    expect(screen.getByText('1 Gericht wegen deiner Filter ausgeblendet')).toBeTruthy();
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

describe('Chip-Leiste zeigt Gruppen der aktiven Gruppierung', () => {
  it('blendet ohne Gruppierung (Preset „Preis") die Chip-Leiste und die Abschnittsüberschriften aus und sortiert nach Preis', async () => {
    mockPreset = {
      id: 'preis',
      eigen: false,
      gruppierung: 'keine',
      gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
    };
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Mensa: qr([gericht({ schluessel: 'teuer', bezeichnung: 'Steak', preisStudierende: 9.9 })]),
      Sued: qr([gericht({ schluessel: 'billig', bezeichnung: 'Suppe', preisStudierende: 2.2 })]),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Suppe')).toBeTruthy());

    // Keine Mensa-Abschnittsüberschriften mehr (nur der Chip wäre doppelt).
    expect(screen.queryByText('Hauptmensa')).toBeNull();
    expect(screen.queryByText('Mensa Süd')).toBeNull();

    // Reihenfolge im Baum: günstigeres Gericht zuerst (aufsteigend nach Preis).
    const namen = screen.getAllByText(/^(Suppe|Steak)$/).map((n) => n.props.children);
    expect(namen).toEqual(['Suppe', 'Steak']);
    expect(screen.getByText('Studierende 2,20 €')).toBeTruthy();
  });

  it('zeigt bei Gruppierung „nach Kategorie" Kategorie-Chips statt Mensa-Chips', async () => {
    mockPreset = {
      id: 'eigen-kat',
      eigen: true,
      gruppierung: 'kategorie',
      gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
      gerichteSortierung: { kriterium: 'quelle', richtung: 'auf' },
    };
    mockSelection = { ids: ['Mensa', 'Sued'], loaded: true, toggle: jest.fn(), move: jest.fn() };
    mockPlaene = {
      Mensa: qr([gericht({ schluessel: 'a', bezeichnung: 'Auflauf', kategorie: 'Wok' })]),
      Sued: qr([gericht({ schluessel: 'b', bezeichnung: 'Brot', kategorie: 'Aktion' })]),
    };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Auflauf')).toBeTruthy());
    // Kategorie-Namen erscheinen als Chip und als Abschnittsüberschrift.
    expect(screen.getAllByText('Wok').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Aktion').length).toBeGreaterThanOrEqual(2);
    // Mensa-Namen tauchen nicht mehr als Chips/Überschriften auf.
    expect(screen.queryByText('Hauptmensa')).toBeNull();
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
