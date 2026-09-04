import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import { ThemeProvider } from '@/theme';
import { CanteenScreen } from './CanteenScreen';

let mockSelection: any;
let mockSpeiseplan: any;
let mockHas: jest.Mock;
const mockToggle = jest.fn();

jest.mock('../selection', () => ({ useCanteenSelection: () => mockSelection }));
jest.mock('../favorites', () => ({ useFavorites: () => ({ list: [], has: mockHas, toggle: mockToggle }) }));
jest.mock('../api', () => ({
  useMensen: () => ({
    mensen: [
      { id: 'Mensa', name: 'Hauptmensa', standardAuswahl: true, reihenfolge: 10, oeffnungszeiten: ['11:30 - 14:45', 'a', 'b', 'c', 'd'] },
      { id: 'Sued', name: 'Mensa Süd', standardAuswahl: false, reihenfolge: 20 },
    ],
    istAusgangsbestand: false,
    query: {},
  }),
  useSpeiseplan: () => mockSpeiseplan,
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

function query(over: Partial<Record<string, unknown>> = {}) {
  return {
    data: { gerichte: [gericht()], standAlter: { abgerufenAm: new Date().toISOString() } },
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(),
    ...over,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockHas = jest.fn(() => false);
  mockSelection = { ids: ['Mensa'], loaded: true, toggle: jest.fn(), move: jest.fn() };
  mockSpeiseplan = query();
});

const renderScreen = () => render(<ThemeProvider><CanteenScreen /></ThemeProvider>);

describe('MENSA-F-020 Leerzustand ohne gewählte Mensa verweist auf die Auswahl', () => {
  it('zeigt den Hinweis und eine Schaltfläche zur Mensenauswahl', () => {
    mockSelection = { ids: [], loaded: true, toggle: jest.fn(), move: jest.fn() };
    renderScreen();
    expect(screen.getByText('Noch keine Mensa gewählt')).toBeTruthy();
    expect(screen.getByText('Mensen auswählen')).toBeTruthy();
  });
});

describe('MENSA-F-010 / MENSA-F-030 Gerichte des Tages mit vollständigen Preisen', () => {
  it('zeigt Bezeichnung, Kennzeichnung, Preise und Zusatzstoffe', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.getByText('Vegan')).toBeTruthy();
    expect(screen.getByText(/3,30 €/)).toBeTruthy();
    expect(screen.getByText(/Zusatzstoffe: Weizen/)).toBeTruthy();
  });
});

describe('MENSA-F-040 Beilagen getrennt und ans Ende gestellt', () => {
  it('sortiert die Beilagen-Gruppe hinter die Hauptspeisen', async () => {
    mockSpeiseplan = query({
      data: {
        gerichte: [
          gericht({ schluessel: 'pommes', kategorie: 'Beilagen', bezeichnung: 'Pommes' }),
          gericht(),
        ],
        standAlter: { abgerufenAm: new Date().toISOString() },
      },
    });
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    const titel = screen.getAllByText(/Menü 1|Beilagen/).map((n) => n.props.children);
    expect(titel).toEqual(['Menü 1', 'Beilagen']);
  });
});

describe('MENSA-F-160 Gerichte ohne Quell-Kategorie', () => {
  it('zeigt alle Gerichte in einer Gruppe ohne Kategorieüberschrift und ohne Platzhalter', async () => {
    mockSpeiseplan = query({
      data: {
        gerichte: [
          gericht({ schluessel: 'pasta', kategorie: '', bezeichnung: 'Pasta Pesto' }),
          gericht({ schluessel: 'pizza', kategorie: '', bezeichnung: 'Pizza Margherita' }),
        ],
        standAlter: { abgerufenAm: new Date().toISOString() },
      },
    });
    renderScreen();
    await waitFor(() => expect(screen.getByText('Pasta Pesto')).toBeTruthy());
    expect(screen.getByText('Pizza Margherita')).toBeTruthy();
    // Weder der em-dash-Platzhalter noch ein leerer Kategorietitel taucht auf.
    expect(screen.queryByText('—')).toBeNull();
  });

  it('stellt die kategorielose Gruppe hinter benannte Kategorien und vor Beilagen', async () => {
    mockSpeiseplan = query({
      data: {
        gerichte: [
          gericht({ schluessel: 'ohne', kategorie: '', bezeichnung: 'Ohne Kategorie' }),
          gericht({ schluessel: 'menue', kategorie: 'Menü 1', bezeichnung: 'Menü-Gericht' }),
          gericht({ schluessel: 'pommes', kategorie: 'Beilagen', bezeichnung: 'Pommes' }),
        ],
        standAlter: { abgerufenAm: new Date().toISOString() },
      },
    });
    renderScreen();
    await waitFor(() => expect(screen.getByText('Menü-Gericht')).toBeTruthy());
    const reihenfolge = screen
      .getAllByText(/Menü-Gericht|Ohne Kategorie|Pommes/)
      .map((n) => n.props.children);
    expect(reihenfolge).toEqual(['Menü-Gericht', 'Ohne Kategorie', 'Pommes']);
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
});

describe('MENSA-F-060 sichtbare Fehlermeldung statt stiller Leeransicht', () => {
  it('zeigt bei einem Ladefehler ohne Zwischenspeicher eine Fehlermeldung mit Wiederholen', async () => {
    mockSpeiseplan = query({
      data: undefined,
      isError: true,
      error: new AppError({ kind: 'server', message: 'error.server', status: 500, retryable: true }),
    });
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
