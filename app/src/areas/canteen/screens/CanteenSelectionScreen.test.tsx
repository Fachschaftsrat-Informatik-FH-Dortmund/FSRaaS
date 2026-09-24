import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { CanteenSelectionScreen } from './CanteenSelectionScreen';

let mockMensen: any;
let mockSelection: any;
const toggle = jest.fn();
const move = jest.fn();
const mockBack = jest.fn();

jest.mock('../api', () => ({ useMensen: () => mockMensen }));
jest.mock('../selection', () => ({ useCanteenSelection: () => mockSelection }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }) }));

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

describe('Standortangaben der Mensa', () => {
  it('bietet Anschrift, Beschreibung und Kartenverweis an, wenn die Quelle alle drei führt', () => {
    mockMensen = {
      ...mockMensen,
      mensen: [
        {
          ...mensa('Mensa', 'Hauptmensa', 10),
          anschrift: 'Emil-Figge-Straße 42, 44227 Dortmund',
          beschreibung: 'Größte Mensa am Campus',
          kartenUrl: 'https://example.org/karte/hauptmensa',
        },
        mensa('Sued', 'Mensa Süd', 20),
        mensa('Kostbar', 'Kostbar', 30),
      ],
    };
    renderScreen();
    expect(screen.getByText('Größte Mensa am Campus')).toBeTruthy();
    expect(screen.getByText('Emil-Figge-Straße 42, 44227 Dortmund')).toBeTruthy();
    expect(screen.getByText('Karte öffnen')).toBeTruthy();
  });

  it('lässt bei fehlender Anschrift allein diese entfallen und zeigt die übrigen Angaben weiterhin', () => {
    mockMensen = {
      ...mockMensen,
      mensen: [
        {
          ...mensa('Mensa', 'Hauptmensa', 10),
          beschreibung: 'Größte Mensa am Campus',
          kartenUrl: 'https://example.org/karte/hauptmensa',
        },
        mensa('Sued', 'Mensa Süd', 20),
        mensa('Kostbar', 'Kostbar', 30),
      ],
    };
    renderScreen();
    expect(screen.getByText('Größte Mensa am Campus')).toBeTruthy();
    expect(screen.getByText('Karte öffnen')).toBeTruthy();
  });
});

describe('MENSA-F-020 Rückkehr zum Speiseplan nach der Auswahl', () => {
  it('zeigt bei mindestens einer gewählten Mensa eine „Fertig"-Schaltfläche zurück zum Plan', () => {
    renderScreen();
    fireEvent.press(screen.getByText('Fertig'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('blendet „Fertig" aus, solange keine Mensa gewählt ist', () => {
    mockSelection = { ids: [], loaded: true, toggle, move };
    renderScreen();
    expect(screen.queryByText('Fertig')).toBeNull();
  });
});
