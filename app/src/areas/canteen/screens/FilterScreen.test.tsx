import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { FilterScreen } from './FilterScreen';

let mockVerzeichnisse: any;
const mockToggle = jest.fn();
const mockSetzeMehrere = jest.fn();
let mockCodes: string[];

const mockToggleCo2 = jest.fn();
let mockCo2Ausschluss: string[];

const mockErhoehen = jest.fn();
const mockSenken = jest.fn();
let mockLimit: number | null;

jest.mock('../api', () => ({
  useMensaVerzeichnisse: () => mockVerzeichnisse,
}));
jest.mock('../intolerances', () => ({
  useIntolerances: () => ({
    codes: mockCodes,
    loaded: true,
    toggle: mockToggle,
    setzeMehrere: mockSetzeMehrere,
    clear: jest.fn(),
  }),
}));
jest.mock('../dietPreference', () => ({
  useDietPreference: () => ({
    prefs: { nurZeigen: [], ausschluss: [], co2Ausschluss: mockCo2Ausschluss },
    loaded: true,
    toggleNurZeigen: jest.fn(),
    toggleAusschluss: jest.fn(),
    toggleCo2Ausschluss: mockToggleCo2,
    clear: jest.fn(),
  }),
}));
jest.mock('../priceGroup', () => ({
  usePriceGroup: () => ({ group: 'student', loaded: true, setGroup: jest.fn() }),
}));
jest.mock('../priceLimit', () => ({
  PREIS_MIN: 1,
  PREIS_MAX: 10,
  usePriceLimit: () => ({
    limit: mockLimit,
    loaded: true,
    erhoehen: mockErhoehen,
    senken: mockSenken,
    clear: jest.fn(),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCodes = [];
  mockCo2Ausschluss = [];
  mockLimit = null;
  // Zuschnitt der Legende von INT-020: `zusatzstoffe` traegt Zusatzstoffe UND
  // Allergene (ADR 0016), `allergene` allein die Allergene als Teilmenge.
  mockVerzeichnisse = {
    data: {
      kategorien: [],
      zusatzstoffe: [
        { id: '2', bezeichnung: 'mit Konservierungsstoffen' },
        { id: '20a', bezeichnung: 'Weizen' },
        { id: '20b', bezeichnung: 'Roggen' },
        { id: '26', bezeichnung: 'Milch inkl. Lactose' },
      ],
      allergene: [
        { id: '20a', bezeichnung: 'Weizen' },
        { id: '20b', bezeichnung: 'Roggen' },
        { id: '26', bezeichnung: 'Milch inkl. Lactose' },
      ],
      kennzeichnungen: [{ id: '1', bezeichnung: 'vegan' }],
      co2Klassen: [
        { id: 'A', bezeichnung: 'Klimateller (beste CO₂-Klasse)' },
        { id: 'E', bezeichnung: 'CO₂-Klasse E' },
      ],
    },
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(),
  };
});
afterEach(cleanup);

const renderScreen = () =>
  render(
    <ThemeProvider>
      <FilterScreen />
    </ThemeProvider>,
  );

describe('MENSA-F-175 Hinweis auf die ausschließlich lokale Verarbeitung', () => {
  it('zeigt den Hinweis am Seitenende', async () => {
    renderScreen();
    await waitFor(() =>
      expect(
        screen.getByText(/ausschließlich auf diesem Gerät verarbeitet und nie an das Backend/),
      ).toBeTruthy(),
    );
  });
});

describe('MENSA-F-180 Auswahl von Zusatzstoff-/Allergenkennzeichnungen', () => {
  it('listet die Kennzeichnungen aus dem Verzeichnis und schaltet eine um', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Weizen')).toBeTruthy());
    fireEvent(screen.getByLabelText('Weizen'), 'valueChange', true);
    expect(mockToggle).toHaveBeenCalledWith('20a');
  });
});

describe('MENSA-F-235 Preisfilter', () => {
  it('zeigt ohne Limit „Kein Limit" und erhöht/senkt den Höchstpreis', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Kein Limit')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Höchstpreis erhöhen'));
    expect(mockErhoehen).toHaveBeenCalled();
  });

  it('zeigt einen gesetzten Höchstpreis an', async () => {
    mockLimit = 4.5;
    renderScreen();
    await waitFor(() => expect(screen.getByText('höchstens 4,50 €')).toBeTruthy());
  });
});

describe('MENSA-F-270 Bündelung der Filterabschnitte', () => {
  it('zeigt Preis, Lebensstil, Ausschluss und Unverträglichkeiten in einer Ansicht', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Lebensstil – nur diese zeigen')).toBeTruthy());
    expect(screen.getByText('Preis')).toBeTruthy();
    expect(screen.getByText('Ausschließen')).toBeTruthy();
    expect(screen.getByText('Allergene')).toBeTruthy();
    expect(screen.getByText('Zusatzstoffe')).toBeTruthy();
  });
});

describe('Getrennte Abschnitte für Allergene und Zusatzstoffe im Filtermenü', () => {
  it('bietet Allergene und Zusatzstoffe in zwei getrennten Abschnitten an', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Allergene')).toBeTruthy());
    expect(screen.getByText('Zusatzstoffe')).toBeTruthy();
    // Jeder Eintrag steht genau einmal — die Allergene nicht zusätzlich im
    // Zusatzstoff-Abschnitt, obwohl `zusatzstoffe` sie mitführt.
    expect(screen.getAllByLabelText('Weizen')).toHaveLength(1);
    expect(screen.getAllByLabelText('mit Konservierungsstoffen')).toHaveLength(1);
  });

  it('übernimmt eine vor der Trennung gespeicherte Auswahl unverändert in den jeweiligen Abschnitt', async () => {
    // Auswahl, wie sie ein Stand vor der Trennung hinterlassen hat: ein
    // Allergen und ein Zusatzstoff in einer gemeinsamen Liste von Schlüsseln.
    mockCodes = ['20a', '2'];
    renderScreen();
    await waitFor(() => expect(screen.getByText('Allergene')).toBeTruthy());

    const allergene = screen.getByTestId('abschnitt-allergene');
    const zusatzstoffe = screen.getByTestId('abschnitt-zusatzstoffe');
    expect(within(allergene).getByLabelText('Weizen').props.value).toBe(true);
    expect(within(zusatzstoffe).getByLabelText('mit Konservierungsstoffen').props.value).toBe(true);
    // Nicht Gewähltes bleibt ungewählt.
    expect(within(allergene).getByLabelText('Roggen').props.value).toBe(false);
  });

  it('führt ohne Allergen-Verzeichnis weiter einen gemeinsamen Abschnitt', async () => {
    // Backend-Stand vor der Trennung: kein `allergene`. Allergene als
    // Zusatzstoffe auszuweisen wäre eine falsche Aussage.
    mockVerzeichnisse.data = { ...mockVerzeichnisse.data, allergene: undefined };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Unverträglichkeiten')).toBeTruthy());
    expect(screen.queryByText('Allergene')).toBeNull();
  });
});

describe('Sammelschalter für zusammengehörige Allergengruppen', () => {
  it('setzt mit dem Sammelschalter alle Unterschlüssel der Gruppe gemeinsam', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByLabelText('Alle Glutenarten')).toBeTruthy());
    fireEvent(screen.getByLabelText('Alle Glutenarten'), 'valueChange', true);
    expect(mockSetzeMehrere).toHaveBeenCalledWith(['20a', '20b'], true);
  });

  it('löscht mit ihm alle Unterschlüssel gemeinsam und zeigt ihn als gesetzt, wenn alle gewählt sind', async () => {
    mockCodes = ['20a', '20b'];
    renderScreen();
    const sammel = await screen.findByLabelText('Alle Glutenarten');
    expect(sammel.props.value).toBe(true);
    fireEvent(sammel, 'valueChange', false);
    expect(mockSetzeMehrere).toHaveBeenCalledWith(['20a', '20b'], false);
  });

  it('lässt den einzelnen Unterschlüssel daneben wählbar', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByLabelText('Roggen')).toBeTruthy());
    fireEvent(screen.getByLabelText('Roggen'), 'valueChange', true);
    expect(mockToggle).toHaveBeenCalledWith('20b');
    expect(mockSetzeMehrere).not.toHaveBeenCalled();
  });

  it('bietet keinen Sammelschalter für ein ungegliedertes Allergen', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByLabelText('Milch inkl. Lactose')).toBeTruthy());
    expect(screen.queryByLabelText('Alle Untergruppen von 26')).toBeNull();
  });
});

describe('Ausschluss nach Kennzeichnung — CO₂-Klassen im Filtermenü', () => {
  it('bietet die CO₂-Klassen der Quelle als eigenen Ausschluss-Abschnitt an', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('CO₂-Klassen ausschließen')).toBeTruthy());
    fireEvent(screen.getByLabelText('CO₂-Klasse E'), 'valueChange', true);
    expect(mockToggleCo2).toHaveBeenCalledWith('E');
  });

  it('lässt den Abschnitt aus, solange das Backend keine CO₂-Klassen liefert', async () => {
    mockVerzeichnisse.data = { ...mockVerzeichnisse.data, co2Klassen: undefined };
    renderScreen();
    await waitFor(() => expect(screen.getByText('Ausschließen')).toBeTruthy());
    expect(screen.queryByText('CO₂-Klassen ausschließen')).toBeNull();
  });
});
