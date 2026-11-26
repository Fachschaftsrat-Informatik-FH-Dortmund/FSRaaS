import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import { ThemeProvider } from '@/theme';
import type { Meldungsentwurf } from '../api';
import { MeldungEditorScreen } from './MeldungEditorScreen';
import { MeldungenScreen } from './MeldungenScreen';

const mockPush = jest.fn();
const mockSetParams = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, setParams: mockSetParams, back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
  Redirect: () => null,
}));

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ status: 'signed-in', roles: ['fsr-redaktion'] }),
}));

const mockOnline = jest.fn(() => true);
jest.mock('@/state/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));

const entwurf = (over: Partial<Meldungsentwurf> = {}): Meldungsentwurf => ({
  id: '11111111-1111-1111-1111-111111111111',
  titel: 'Sommerfest',
  text: 'Am Freitag im Innenhof.',
  zustand: 'entwurf',
  klassifizierung: 'fsr-news',
  quelle: 'FSR FB4',
  veroeffentlichtAm: null,
  geaendertAm: '2026-11-20T10:00:00Z',
  etag: '"e1"',
  ...over,
});

const query = (data: unknown, over: Record<string, unknown> = {}) => ({
  data,
  isPending: false,
  isError: false,
  isFetching: false,
  isStale: false,
  error: null,
  dataUpdatedAt: Date.now(),
  refetch: jest.fn(),
  ...over,
});

const mockApi = {
  liste: query([] as Meldungsentwurf[]),
  einzeln: query(undefined),
  anlegen: jest.fn(),
  aendern: jest.fn(),
  veroeffentlichen: jest.fn(),
  zurueckziehen: jest.fn(),
};
jest.mock('../api', () => ({
  useMeldungenRedaktion: () => mockApi.liste,
  useMeldungsentwurf: () => ({
    query: mockApi.einzeln,
    anlegen: mockApi.anlegen,
    aendern: mockApi.aendern,
    veroeffentlichen: mockApi.veroeffentlichen,
    zurueckziehen: mockApi.zurueckziehen,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockOnline.mockReturnValue(true);
  mockParams = { entwurfId: 'neu' };
  mockApi.liste = query([]);
  mockApi.einzeln = query(undefined);
});
afterEach(cleanup);

const renderMit = (el: React.ReactElement) => render(<ThemeProvider>{el}</ThemeProvider>);

function eingeben(titel: string, text: string) {
  fireEvent.changeText(screen.getByLabelText('Titel'), titel);
  fireEvent.changeText(screen.getByLabelText('Text'), text);
}

describe('Meldungsredaktion für FSR-News', () => {
  it('listet Meldungen nach Zustand gruppiert und bietet „Neue Meldung"', () => {
    mockApi.liste = query([
      entwurf({ id: 'a', titel: 'Entwurf A' }),
      entwurf({ id: 'b', titel: 'Live B', zustand: 'veroeffentlicht' }),
      entwurf({ id: 'c', titel: 'Weg C', zustand: 'zurueckgezogen' }),
    ]);
    renderMit(<MeldungenScreen />);
    expect(screen.getByText('Entwürfe')).toBeTruthy();
    expect(screen.getByText('Veröffentlicht')).toBeTruthy();
    expect(screen.getByText('Zurückgezogen')).toBeTruthy();
    fireEvent.press(screen.getByText('Live B'));
    expect(mockPush).toHaveBeenCalledWith('/more/admin/meldungen/b');
    fireEvent.press(screen.getByText('Neue Meldung'));
    expect(mockPush).toHaveBeenCalledWith('/more/admin/meldungen/neu');
  });

  it('Leerzustand nennt den nächsten Schritt', () => {
    renderMit(<MeldungenScreen />);
    expect(screen.getByText(/über „Neue Meldung“ die erste anlegen/)).toBeTruthy();
  });

  it('Meldung anlegen: als Entwurf speichern sendet Titel und Text', async () => {
    mockApi.anlegen.mockResolvedValue(entwurf());
    renderMit(<MeldungEditorScreen />);
    eingeben('  Sommerfest ', 'Am Freitag im Innenhof.');
    fireEvent.press(screen.getByText('Als Entwurf speichern'));
    await waitFor(() =>
      expect(mockApi.anlegen).toHaveBeenCalledWith({ titel: 'Sommerfest', text: 'Am Freitag im Innenhof.' }),
    );
    await waitFor(() => expect(screen.getByText('Gespeichert.')).toBeTruthy());
    expect(mockSetParams).toHaveBeenCalledWith({ entwurfId: entwurf().id });
  });

  it('Leerer Titel: Hinweis auf die fehlende Pflichtangabe, keine Vorschau', () => {
    renderMit(<MeldungEditorScreen />);
    eingeben('   ', 'Text');
    fireEvent.press(screen.getByText('Vorschau'));
    expect(screen.getByText(/Bitte einen Titel eingeben/)).toBeTruthy();
    expect(screen.queryByText('In der Liste')).toBeNull();
  });

  it('Pflichtangabe vom Server abgewiesen: Hinweis, Eingabe bleibt', async () => {
    mockApi.anlegen.mockRejectedValue(
      new AppError({ kind: 'server', code: 'titel_zu_lang', message: 'x', status: 400, retryable: false }),
    );
    renderMit(<MeldungEditorScreen />);
    eingeben('Titel', 'Text');
    fireEvent.press(screen.getByText('Als Entwurf speichern'));
    await waitFor(() => expect(screen.getByText(/Der Titel ist zu lang/)).toBeTruthy());
    expect(screen.getByDisplayValue('Titel')).toBeTruthy();
  });

  it('Veröffentlichte Meldung korrigieren: kein Entwurfsspeichern, Übernahme nur über die Vorschau', async () => {
    mockParams = { entwurfId: entwurf().id };
    const live = entwurf({ zustand: 'veroeffentlicht', veroeffentlichtAm: '2026-11-20T10:00:00Z' });
    mockApi.einzeln = query(live);
    mockApi.veroeffentlichen.mockResolvedValue({ ...live, text: 'Korrigiert', etag: '"e2"' });
    renderMit(<MeldungEditorScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Sommerfest')).toBeTruthy());
    expect(screen.queryByText('Als Entwurf speichern')).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Text'), 'Korrigiert');
    fireEvent.press(screen.getByText('Vorschau'));
    fireEvent.press(screen.getByText('Änderungen veröffentlichen'));
    await waitFor(() =>
      expect(mockApi.veroeffentlichen).toHaveBeenCalledWith(live, { titel: 'Sommerfest', text: 'Korrigiert' }),
    );
  });
});

describe('Vorschau vor Veröffentlichung', () => {
  it('Vorschau vor dem Veröffentlichen: Veröffentlichen ist erst in der Vorschau erreichbar', async () => {
    mockApi.veroeffentlichen.mockResolvedValue(entwurf({ zustand: 'veroeffentlicht' }));
    renderMit(<MeldungEditorScreen />);
    eingeben('Sommerfest', 'Am Freitag im Innenhof.');
    expect(screen.queryByText('Veröffentlichen')).toBeNull();

    fireEvent.press(screen.getByText('Vorschau'));
    // Dieselben Bausteine wie im News-Tab: Listenkarte und Detailansicht.
    expect(screen.getByText('In der Liste')).toBeTruthy();
    expect(screen.getByText('In der Detailansicht')).toBeTruthy();
    expect(screen.getAllByText('Sommerfest')).toHaveLength(2);
    expect(screen.getAllByText(/FSR-News/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Quelle: FSR FB4')).toBeTruthy();

    fireEvent.press(screen.getByText('Veröffentlichen'));
    await waitFor(() =>
      expect(mockApi.veroeffentlichen).toHaveBeenCalledWith(null, {
        titel: 'Sommerfest',
        text: 'Am Freitag im Innenhof.',
      }),
    );
    await waitFor(() => expect(screen.getByText('Veröffentlicht.')).toBeTruthy());
  });

  it('Vorschau vor dem Übernehmen einer Korrektur: ohne Änderung nichts zu übernehmen', async () => {
    mockParams = { entwurfId: entwurf().id };
    mockApi.einzeln = query(entwurf({ zustand: 'veroeffentlicht', veroeffentlichtAm: '2026-11-20T10:00:00Z' }));
    renderMit(<MeldungEditorScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Sommerfest')).toBeTruthy());
    fireEvent.press(screen.getByText('Vorschau'));
    expect(screen.getByLabelText('Änderungen veröffentlichen').props.accessibilityState.disabled).toBe(true);
  });
});

describe('Ablehnung bei gleichzeitiger Änderung einer Meldung', () => {
  it('Zweiter Speichervorgang: Hinweis, Eingabe bleibt, neuerer Stand lässt sich laden', async () => {
    mockParams = { entwurfId: entwurf().id };
    const neuer = entwurf({ titel: 'Von jemand anderem', etag: '"e9"' });
    mockApi.einzeln = query(entwurf(), { refetch: jest.fn().mockResolvedValue({ data: neuer }) });
    mockApi.aendern.mockRejectedValue(
      new AppError({ kind: 'server', code: 'stand_veraltet', message: 'x', status: 412, retryable: false }),
    );
    renderMit(<MeldungEditorScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Sommerfest')).toBeTruthy());

    fireEvent.changeText(screen.getByLabelText('Titel'), 'Meine Fassung');
    fireEvent.press(screen.getByText('Als Entwurf speichern'));
    await waitFor(() => expect(screen.getByText(/zwischenzeitlich von jemand anderem geändert/)).toBeTruthy());
    expect(screen.getByDisplayValue('Meine Fassung')).toBeTruthy();

    fireEvent.press(screen.getByText('Neueren Stand laden'));
    await waitFor(() => expect(screen.getByDisplayValue('Von jemand anderem')).toBeTruthy());
  });

  it('Veröffentlichen eines überholten Stands: Hinweis statt Veröffentlichung', async () => {
    mockParams = { entwurfId: entwurf().id };
    mockApi.einzeln = query(entwurf());
    mockApi.veroeffentlichen.mockRejectedValue(
      new AppError({ kind: 'server', code: 'stand_veraltet', message: 'x', status: 412, retryable: false }),
    );
    renderMit(<MeldungEditorScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Sommerfest')).toBeTruthy());
    fireEvent.press(screen.getByText('Vorschau'));
    fireEvent.press(screen.getByText('Veröffentlichen'));
    await waitFor(() => expect(screen.getByText(/zwischenzeitlich von jemand anderem geändert/)).toBeTruthy());
    expect(screen.queryByText('Veröffentlicht.')).toBeNull();
  });
});

describe('Entfernen zurückgezogener Meldungen aus der Liste', () => {
  it('Zurückziehen nur nach Bestätigung', async () => {
    mockParams = { entwurfId: entwurf().id };
    const live = entwurf({ zustand: 'veroeffentlicht', veroeffentlichtAm: '2026-11-20T10:00:00Z' });
    mockApi.einzeln = query(live);
    mockApi.zurueckziehen.mockResolvedValue({ ...live, zustand: 'zurueckgezogen' });
    renderMit(<MeldungEditorScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('Sommerfest')).toBeTruthy());

    fireEvent.press(screen.getByText('Zurückziehen'));
    expect(mockApi.zurueckziehen).not.toHaveBeenCalled();
    expect(screen.getByText(/zurückziehen\? Die Meldung verschwindet aus der App/)).toBeTruthy();

    const knoepfe = screen.getAllByText('Zurückziehen');
    fireEvent.press(knoepfe[knoepfe.length - 1]!);
    await waitFor(() => expect(mockApi.zurueckziehen).toHaveBeenCalledWith(live));
    await waitFor(() => expect(screen.getByText('Zurückgezogen.')).toBeTruthy());
  });
});

describe('Offline-Verhalten der Redaktion', () => {
  it('ohne Netz: gekennzeichnet, Schaltflächen gesperrt, Eingabe bleibt möglich', () => {
    mockOnline.mockReturnValue(false);
    renderMit(<MeldungEditorScreen />);
    expect(screen.getByText(/Ohne Verbindung kann nicht gespeichert werden/)).toBeTruthy();
    expect(screen.getByLabelText('Vorschau').props.accessibilityState.disabled).toBe(true);
    eingeben('Titel', 'Text');
    expect(screen.getByDisplayValue('Titel')).toBeTruthy();
  });
});
