import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { FilterZugang } from './FilterZugang';

const mockPush = jest.fn();
let mockCodes: string[];
let mockPrefs: { nurZeigen: string[]; ausschluss: string[] };
let mockLimit: number | null;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../intolerances', () => ({ useIntolerances: () => ({ codes: mockCodes }) }));
jest.mock('../dietPreference', () => ({ useDietPreference: () => ({ prefs: mockPrefs }) }));
jest.mock('../priceLimit', () => ({ usePriceLimit: () => ({ limit: mockLimit }) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockCodes = [];
  mockPrefs = { nurZeigen: [], ausschluss: [] };
  mockLimit = null;
});
afterEach(cleanup);

const renderZugang = () =>
  render(
    <ThemeProvider>
      <FilterZugang />
    </ThemeProvider>,
  );

describe('MENSA-F-170 Zugang zum Filtermenü', () => {
  it('öffnet den Filterbildschirm', async () => {
    renderZugang();
    await waitFor(() => expect(screen.getByLabelText('Filter öffnen')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Filter öffnen'));
    expect(mockPush).toHaveBeenCalledWith('/canteen/filter');
  });

  it('hebt sich hervor, sobald ein Filter aktiv ist (auch nur der Preis)', () => {
    mockLimit = 4;
    renderZugang();
    expect(screen.getByLabelText('Filter öffnen').props.accessibilityState.selected).toBe(true);
  });
});
