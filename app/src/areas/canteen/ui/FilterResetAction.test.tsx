import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { FilterResetAction } from './FilterResetAction';

const mockIntoleranceClear = jest.fn();
const mockDietClear = jest.fn();
const mockPriceClear = jest.fn();
let mockCodes: string[];
let mockPrefs: { nurZeigen: string[]; ausschluss: string[] };
let mockLimit: number | null;

jest.mock('../intolerances', () => ({
  useIntolerances: () => ({ codes: mockCodes, clear: mockIntoleranceClear }),
}));
jest.mock('../dietPreference', () => ({
  useDietPreference: () => ({ prefs: mockPrefs, clear: mockDietClear }),
}));
jest.mock('../priceLimit', () => ({
  usePriceLimit: () => ({ limit: mockLimit, clear: mockPriceClear }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCodes = [];
  mockPrefs = { nurZeigen: [], ausschluss: [] };
  mockLimit = null;
});
afterEach(cleanup);

const renderAction = () =>
  render(
    <ThemeProvider>
      <FilterResetAction />
    </ThemeProvider>,
  );

describe('MENSA-F-270 „Alle Filter entfernen" oben rechts', () => {
  it('ist ohne gesetzte Vorgabe sichtbar, aber nicht auslösbar', () => {
    renderAction();
    const knopf = screen.getByLabelText('Alle Filter entfernen');
    expect(knopf.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(knopf);
    expect(mockIntoleranceClear).not.toHaveBeenCalled();
  });

  it('leert bei gesetzter Vorgabe Unverträglichkeiten, Diät-Vorgabe und Preisfilter', () => {
    mockPrefs = { nurZeigen: ['vegan'], ausschluss: [] };
    renderAction();
    fireEvent.press(screen.getByLabelText('Alle Filter entfernen'));
    expect(mockDietClear).toHaveBeenCalled();
    expect(mockIntoleranceClear).toHaveBeenCalled();
    expect(mockPriceClear).toHaveBeenCalled();
  });

  it('ist schon bei gesetztem Preisfilter allein auslösbar', () => {
    mockLimit = 4;
    renderAction();
    const knopf = screen.getByLabelText('Alle Filter entfernen');
    expect(knopf.props.accessibilityState.disabled).toBe(false);
  });
});
