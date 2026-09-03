import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { CanteenSelectionScreen } from './CanteenSelectionScreen';

let mockMensen: any;
let mockSelection: any;
const toggle = jest.fn();
const move = jest.fn();

jest.mock('../api', () => ({ useMensen: () => mockMensen }));
jest.mock('../selection', () => ({ useCanteenSelection: () => mockSelection }));

const mensa = (id: string, name: string, reihenfolge: number) => ({
  id,
  name,
  standardAuswahl: false,
  reihenfolge,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockMensen = {
    mensen: [mensa('Mensa', 'Hauptmensa', 10), mensa('Sued', 'Mensa Süd', 20), mensa('Kostbar', 'Kostbar', 30)],
    istAusgangsbestand: false,
    query: {},
  };
  mockSelection = { ids: ['Sued', 'Mensa'], loaded: true, toggle, move };
});

const renderScreen = () => render(<ThemeProvider><CanteenSelectionScreen /></ThemeProvider>);

describe('MENSA-F-020 Auswahl der angezeigten Mensen aus der Backend-Liste', () => {
  it('trennt gewählte von weiteren Mensen und schaltet beim Umlegen um', () => {
    renderScreen();
    expect(screen.getByText('Gewählte Mensen')).toBeTruthy();
    expect(screen.getByText('Weitere Mensen')).toBeTruthy();
    expect(screen.getByText('Kostbar')).toBeTruthy();

    fireEvent(screen.getAllByLabelText('Kostbar')[0], 'valueChange', true);
    expect(toggle).toHaveBeenCalledWith('Kostbar');
  });
});

describe('MENSA-F-025 Reihenfolge der gewählten Mensen', () => {
  it('bietet Verschiebe-Schaltflächen und ruft move mit der Richtung auf', () => {
    renderScreen();
    // Zweite gewählte Mensa (Hauptmensa) nach oben — die erste Schaltfläche ist
    // für die oberste Mensa deaktiviert.
    fireEvent.press(screen.getAllByLabelText('Nach oben')[1]);
    expect(move).toHaveBeenCalledWith('Mensa', -1);
  });
});

describe('MENSA-F-075 Hinweis auf den Ausgangsbestand', () => {
  it('zeigt den Hinweis, wenn die Liste aus dem Anwendungspaket stammt', () => {
    mockMensen = { ...mockMensen, istAusgangsbestand: true };
    renderScreen();
    expect(screen.getByText(/Ausgangsbestand/)).toBeTruthy();
  });
});
