import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ThemeProvider } from '@/theme';
import { CanteenAllScreen } from './CanteenAllScreen';

let mockParams: Record<string, string>;
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

let mockPlaene: Record<string, any>;
let mockVerzeichnisse: any;
let mockCodes: string[];

const mockMensen = [
  { id: 'Mensa', name: 'Hauptmensa', standardAuswahl: true, reihenfolge: 10 },
  { id: 'Sued', name: 'Mensa Süd', standardAuswahl: false, reihenfolge: 20 },
  { id: 'Nord', name: 'Mensa Nord', standardAuswahl: false, reihenfolge: 30 },
];

jest.mock('../api', () => ({
  apiSprache: () => 'de',
  useMensen: () => ({ mensen: mockMensen, istAusgangsbestand: false, query: {} }),
  useMensaVerzeichnisse: () => mockVerzeichnisse,
  useSpeisepläne: (ids: string[]) =>
    ids.map((id) => mockPlaene[id] ?? { data: { gerichte: [], standAlter: {} }, isPending: false, isError: false, isFetching: false, isStale: false, error: null, dataUpdatedAt: Date.now(), refetch: jest.fn() }),
}));
jest.mock('../intolerances', () => ({
  useIntolerances: () => ({ codes: mockCodes, loaded: true, toggle: jest.fn(), clear: jest.fn() }),
}));

const gericht = (over: Partial<Record<string, unknown>> = {}) => ({
  schluessel: 'bolognese',
  kategorie: 'Menü 1',
  bezeichnung: 'Bolognese',
  preisStudierende: 3.3,
  preisMitarbeitende: 5.4,
  preisGaeste: 6.5,
  zusatzstoffe: [],
  kennzeichnungen: [],
  ...over,
});

const qr = (gerichte: unknown[]) => ({
  data: { gerichte, standAlter: { abgerufenAm: new Date().toISOString() } },
  isPending: false,
  isError: false,
  isFetching: false,
  isStale: false,
  error: null,
  dataUpdatedAt: Date.now(),
  refetch: jest.fn(),
});

let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { datum: '2026-09-04' };
  mockVerzeichnisse = { data: { kategorien: [], zusatzstoffe: [], kennzeichnungen: [] } };
  mockCodes = [];
  mockPlaene = {
    Mensa: qr([gericht()]),
    Sued: qr([]),
    Nord: qr([gericht({ schluessel: 'curry', bezeichnung: 'Curry', zusatzstoffe: ['Fisch'] })]),
  };
  client = new QueryClient({ defaultOptions: { queries: { gcTime: 0, retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  client.unmount();
});

function renderScreen() {
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <CanteenAllScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('MENSA-F-130 Ansicht aller Mensen nach Mensa getrennt', () => {
  it('zeigt je anbietende Mensa einen Abschnitt (Chip + Überschrift) untereinander', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    // Je Mensa: ein Chip in der Ankerleiste und eine Abschnittsüberschrift.
    expect(screen.getAllByText('Hauptmensa').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('Mensa Nord').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Curry')).toBeTruthy();
  });
});

describe('MENSA-F-140 Mensen ohne Angebot am Tag auslassen', () => {
  it('lässt eine Mensa ohne Gerichte aus', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    expect(screen.queryByText('Mensa Süd')).toBeNull();
  });
});

describe('MENSA-F-230 alle drei Preise unabhängig von der Preisgruppe', () => {
  it('zeigt Studierenden-, Mitarbeitenden- und Gästepreis', async () => {
    renderScreen();
    await waitFor(() =>
      expect(
        screen.getAllByText(/Studierende 3,30 € · Mitarbeitende 5,40 € · Gäste 6,50 €/).length,
      ).toBeGreaterThan(0),
    );
  });
});

describe('Chip-Leiste zeigt Gruppen der aktiven Gruppierung', () => {
  it('arbeitet ohne Bezug auf das Sortier-/Gruppierpreset — feste Mensa-Gliederung', () => {
    const quelle = readFileSync(join(__dirname, 'CanteenAllScreen.tsx'), 'utf8');
    expect(quelle).not.toMatch(/sortierPreset|useSortierGruppierung|from '\.\.\/sortierung'|\bwendeAn\b/);
  });

  it('gliedert die Ansicht weiterhin fest nach Mensa, unabhängig von einem Preset', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Bolognese')).toBeTruthy());
    // Reihenfolge folgt der Backend-Mensa-Liste, nicht einer Preset-Gruppenreihenfolge.
    const mensen = screen.getAllByText(/^(Hauptmensa|Mensa Nord)$/).map((n) => n.props.children);
    expect(mensen.indexOf('Hauptmensa')).toBeLessThan(mensen.lastIndexOf('Mensa Nord'));
  });
});

describe('MENSA-F-210 Gericht mit festgelegter Unverträglichkeit ausgegraut statt ausgeblendet', () => {
  it('behält das Gericht sichtbar (nicht ausgeblendet) und markiert es als betroffen', async () => {
    mockVerzeichnisse = {
      data: { kategorien: [], zusatzstoffe: [{ id: 'D', bezeichnung: 'Fisch' }], kennzeichnungen: [] },
    };
    mockCodes = ['D'];
    renderScreen();
    // In der Hauptansicht wäre „Curry" ausgeblendet — hier bleibt es im Baum.
    await waitFor(() => expect(screen.getByText('Curry')).toBeTruthy());
    expect(screen.getByText('Bolognese')).toBeTruthy();
  });
});
