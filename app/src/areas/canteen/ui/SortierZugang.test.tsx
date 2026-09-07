import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { SortierZugang } from './SortierZugang';
import { FilterZugang } from './FilterZugang';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../intolerances', () => ({ useIntolerances: () => ({ codes: [] }) }));
jest.mock('../dietPreference', () => ({
  useDietPreference: () => ({ prefs: { nurZeigen: [], ausschluss: [] } }),
}));
jest.mock('../priceLimit', () => ({ usePriceLimit: () => ({ limit: null }) }));

beforeEach(() => jest.clearAllMocks());
afterEach(cleanup);

describe('Zugang zur Sortier-/Gruppierauswahl', () => {
  it('rendert neben dem Filterzugang', async () => {
    render(
      <ThemeProvider>
        <SortierZugang />
        <FilterZugang />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByLabelText('Sortierung und Gruppierung öffnen')).toBeTruthy());
    expect(screen.getByLabelText('Filter öffnen')).toBeTruthy();
  });

  it('öffnet die Sortier-/Gruppierauswahl', () => {
    render(
      <ThemeProvider>
        <SortierZugang />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByLabelText('Sortierung und Gruppierung öffnen'));
    expect(mockPush).toHaveBeenCalledWith('/canteen/sortierung');
  });
});
