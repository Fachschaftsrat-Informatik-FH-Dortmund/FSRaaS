import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { SortierGruppierScreen } from './SortierGruppierScreen';
import { VORDEFINIERTE_PRESETS, type AufgeloestesPreset, type EigenesPreset } from '../sortierung';

const mockSpies = {
  waehle: jest.fn(),
  stelleEin: jest.fn(),
  speichereEigenes: jest.fn(),
  benenneUm: jest.fn(),
  loesche: jest.fn(),
};
let mockAktiv: AufgeloestesPreset;
let mockPresets: EigenesPreset[];
let mockEntwurf: boolean;

jest.mock('../sortierPreset', () => ({
  useSortierGruppierung: () => ({
    aktiv: mockAktiv,
    istEntwurf: mockEntwurf,
    presets: mockPresets,
    loaded: true,
    ...mockSpies,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAktiv = VORDEFINIERTE_PRESETS.find((p) => p.id === 'mensa-guenstigstes')!;
  mockPresets = [];
  mockEntwurf = false;
});
afterEach(cleanup);

const renderScreen = () =>
  render(
    <ThemeProvider>
      <SortierGruppierScreen />
    </ThemeProvider>,
  );

describe('Wahl der Gerichte-Sortierung', () => {
  it('bietet Kriterium und Richtung in zwei getrennten Auswahlfeldern an', async () => {
    renderScreen();
    const kriterium = await screen.findByLabelText('Sortierung der Gerichte');
    const richtung = screen.getByLabelText('Sortierung der Gerichte · Richtung');
    expect(within(kriterium).getByLabelText('Preis')).toBeTruthy();
    expect(within(richtung).getByLabelText('aufsteigend')).toBeTruthy();
    expect(within(richtung).getByLabelText('absteigend')).toBeTruthy();
  });

  it('meldet eine geänderte Richtung an die Zusammenstellung', async () => {
    renderScreen();
    const richtung = await screen.findByLabelText('Sortierung der Gerichte · Richtung');
    fireEvent.press(within(richtung).getByLabelText('absteigend'));
    expect(mockSpies.stelleEin).toHaveBeenCalledWith(
      expect.objectContaining({ gerichteSortierung: { kriterium: 'preis', richtung: 'ab' } }),
    );
  });
});

describe('Wahl der Gruppierung', () => {
  it('übernimmt eine gewählte Gruppierung in die Zusammenstellung', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByLabelText('keine Gruppierung')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('keine Gruppierung'));
    expect(mockSpies.stelleEin).toHaveBeenCalledWith(
      expect.objectContaining({ gruppierung: 'keine' }),
    );
  });
});

describe('Vordefinierte Presets', () => {
  it('zeigt alle vier vordefinierten Presets zur direkten Anwahl', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByLabelText('Preset Mensa, günstigstes zuerst')).toBeTruthy());
    for (const name of ['Mensa, eigene Bewertung', 'Mensa, Community-Bewertung', 'Preis']) {
      expect(screen.getByLabelText(`Preset ${name}`)).toBeTruthy();
    }
    fireEvent.press(screen.getByLabelText('Preset Preis'));
    expect(mockSpies.waehle).toHaveBeenCalledWith('preis');
  });
});

describe('Umbenennen und Löschen eigener Presets', () => {
  it('bietet einem vordefinierten Preset keine Umbenennen- oder Löschen-Handlung', async () => {
    mockPresets = [
      {
        id: 'eigen-1',
        name: 'Mein Preset',
        kombination: { gruppierung: 'keine', gerichteSortierung: { kriterium: 'preis', richtung: 'auf' } },
      },
    ];
    renderScreen();
    await waitFor(() => expect(screen.getByText('Mein Preset')).toBeTruthy());
    expect(screen.getByLabelText('Umbenennen – Mein Preset')).toBeTruthy();
    expect(screen.getByLabelText('Löschen – Mein Preset')).toBeTruthy();
    expect(screen.queryByLabelText('Umbenennen – Mensa, günstigstes zuerst')).toBeNull();
    expect(screen.queryByLabelText('Löschen – Preis')).toBeNull();
  });

  it('speichert eine eigene Zusammenstellung unter einem Namen', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByLabelText('Name des Presets')).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText('Name des Presets'), 'Abendessen');
    fireEvent.press(screen.getByLabelText('Als eigenes Preset speichern'));
    expect(mockSpies.speichereEigenes).toHaveBeenCalledWith('Abendessen', expect.objectContaining({ gruppierung: 'mensa' }));
  });
});
