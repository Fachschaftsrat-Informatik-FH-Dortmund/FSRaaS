import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { FilterScreen } from './FilterScreen';

let mockVerzeichnisse: any;
const mockToggle = jest.fn();
let mockCodes: string[];

const mockErhoehen = jest.fn();
const mockSenken = jest.fn();
let mockLimit: number | null;

jest.mock('../api', () => ({
  useMensaVerzeichnisse: () => mockVerzeichnisse,
}));
jest.mock('../intolerances', () => ({
  useIntolerances: () => ({ codes: mockCodes, loaded: true, toggle: mockToggle, clear: jest.fn() }),
}));
jest.mock('../dietPreference', () => ({
  useDietPreference: () => ({
    prefs: { nurZeigen: [], ausschluss: [] },
    loaded: true,
    toggleNurZeigen: jest.fn(),
    toggleAusschluss: jest.fn(),
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
  mockLimit = null;
  mockVerzeichnisse = {
    data: {
      kategorien: [],
      zusatzstoffe: [
        { id: '2', bezeichnung: 'mit Konservierungsstoffen' },
        { id: '20a', bezeichnung: 'Weizen' },
      ],
      kennzeichnungen: [{ id: '1', bezeichnung: 'vegan' }],
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
    expect(screen.getByText('Unverträglichkeiten')).toBeTruthy();
  });
});
