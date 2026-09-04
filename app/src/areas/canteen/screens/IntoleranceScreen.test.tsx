import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { IntoleranceScreen } from './IntoleranceScreen';

let mockVerzeichnisse: any;
const mockToggle = jest.fn();
let mockCodes: string[];

jest.mock('../api', () => ({
  useMensaVerzeichnisse: () => mockVerzeichnisse,
}));
jest.mock('../intolerances', () => ({
  useIntolerances: () => ({ codes: mockCodes, loaded: true, toggle: mockToggle, clear: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCodes = [];
  mockVerzeichnisse = {
    data: {
      kategorien: [],
      zusatzstoffe: [
        { id: '2', bezeichnung: 'mit Konservierungsstoffen' },
        { id: '20a', bezeichnung: 'Weizen' },
      ],
      kennzeichnungen: [],
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
      <IntoleranceScreen />
    </ThemeProvider>,
  );

describe('MENSA-F-175 Hinweis auf die ausschließlich lokale Verarbeitung', () => {
  it('zeigt den Hinweis, bevor eine Auswahl getroffen wird', async () => {
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
