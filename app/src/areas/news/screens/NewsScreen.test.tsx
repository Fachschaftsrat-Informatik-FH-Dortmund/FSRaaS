import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import { ThemeProvider } from '@/theme';
import { _zuruecksetzenFuerTests } from '../angepinnt';
import type { Meldung } from '../api';
import { NewsDetailScreen } from './NewsDetailScreen';
import { NewsScreen } from './NewsScreen';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

const mockOnline = jest.fn(() => true);
jest.mock('@/state/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));

let mockQuery: Record<string, unknown>;
jest.mock('../api', () => ({ useMeldungen: () => mockQuery }));

const meldung = (id: string, tag: number, extra: Partial<Meldung> = {}): Meldung => ({
  id,
  titel: `Titel ${id}`,
  text: `Langer Text ${id}`,
  veroeffentlichtAm: `2026-11-${String(tag).padStart(2, '0')}T13:45:00`,
  klassifizierung: 'fsr-news',
  quelle: 'FSR FB4',
  ...extra,
});

function mockQ(data: unknown, over: Record<string, unknown> = {}) {
  return {
    data,
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    isRefetching: false,
    isRefetchError: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(),
    ...over,
  };
}

beforeEach(async () => {
  jest.clearAllMocks();
  _zuruecksetzenFuerTests();
  await AsyncStorage.clear();
  mockOnline.mockReturnValue(true);
  mockParams = {};
  mockQuery = mockQ({ meldungen: [meldung('neu', 20), meldung('alt', 3)], zurueckgezogen: [] });
});
afterEach(cleanup);

const renderMit = (el: React.ReactElement) => render(<ThemeProvider>{el}</ThemeProvider>);

describe('Laden und Anzeige aktueller Meldungen', () => {
  it('Meldungen laden: absteigend chronologisch mit Zeitpunkt im 24-Stunden-Format', () => {
    renderMit(<NewsScreen />);
    const titel = screen.getAllByRole('header').map((h) => h.props.children);
    expect(titel.indexOf('Titel neu')).toBeLessThan(titel.indexOf('Titel alt'));
    expect(screen.getByText('20.11.2026, 13:45')).toBeTruthy();
  });

  it('Meldung ohne lesbaren Zeitstempel bleibt sichtbar und zeigt „unbekannt"', () => {
    mockQuery = mockQ({ meldungen: [meldung('x', 1, { veroeffentlichtAm: null })], zurueckgezogen: [] });
    renderMit(<NewsScreen />);
    expect(screen.getByText('Titel x')).toBeTruthy();
    expect(screen.getByText('Zeitpunkt unbekannt')).toBeTruthy();
  });

  it('Leerzustand nennt den nächsten Schritt', () => {
    mockQuery = mockQ({ meldungen: [], zurueckgezogen: [] });
    renderMit(<NewsScreen />);
    expect(screen.getByText('Keine aktuellen Meldungen')).toBeTruthy();
    expect(screen.getByText(/Zum Aktualisieren nach unten ziehen/)).toBeTruthy();
  });
});

describe('Fehlermeldung bei nicht erreichbarem News-Dienst', () => {
  it('Dienst nicht erreichbar: Fehlermeldung mit Wiederholen', () => {
    mockQuery = mockQ(undefined, {
      isError: true,
      error: new AppError({ kind: 'server', message: 'error.server', status: 503, retryable: true }),
    });
    renderMit(<NewsScreen />);
    fireEvent.press(screen.getByText('Erneut versuchen'));
    expect(mockQuery.refetch).toHaveBeenCalled();
  });

  it('Aktualisieren schlägt fehl: Bestand bleibt sichtbar, Hinweis mit Wiederholen', () => {
    mockQuery = mockQ({ meldungen: [meldung('a', 1)], zurueckgezogen: [] }, { isError: true, isRefetchError: true });
    renderMit(<NewsScreen />);
    expect(screen.getByText('Titel a')).toBeTruthy();
    expect(screen.getByText(/Aktualisieren fehlgeschlagen/)).toBeTruthy();
    fireEvent.press(screen.getByText('Erneut versuchen'));
    expect(mockQuery.refetch).toHaveBeenCalled();
  });
});

describe('Klassifizierung jeder Meldung', () => {
  it('Klassifizierung sichtbar: jede Meldung trägt ihr Textlabel', () => {
    renderMit(<NewsScreen />);
    expect(screen.getAllByText(/FSR-News/)).toHaveLength(2);
  });
});

describe('Nachladen älterer Meldungen', () => {
  it('Ans Ende der Liste blättern lädt die nächste Seite', () => {
    mockQuery = mockQ({ meldungen: [meldung('a', 1)], zurueckgezogen: [] }, { hasNextPage: true });
    renderMit(<NewsScreen />);
    fireEvent(screen.getByTestId('meldungsliste'), 'onEndReached');
    expect(mockQuery.fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('bietet zusätzlich einen sichtbaren Weg zum Nachladen', () => {
    mockQuery = mockQ({ meldungen: [meldung('a', 1)], zurueckgezogen: [] }, { hasNextPage: true });
    renderMit(<NewsScreen />);
    fireEvent.press(screen.getByText('Ältere Meldungen laden'));
    expect(mockQuery.fetchNextPage).toHaveBeenCalled();
  });

  it('fehlgeschlagenes Nachladen: Hinweis mit Wiederholen, kein automatischer Neuversuch beim Blättern', () => {
    mockQuery = mockQ(
      { meldungen: [meldung('a', 1)], zurueckgezogen: [] },
      { hasNextPage: true, isError: true, isFetchNextPageError: true },
    );
    renderMit(<NewsScreen />);
    fireEvent(screen.getByTestId('meldungsliste'), 'onEndReached');
    expect(mockQuery.fetchNextPage).not.toHaveBeenCalled();
    expect(screen.getByText(/Ältere Meldungen konnten nicht geladen werden/)).toBeTruthy();
    fireEvent.press(screen.getByText('Erneut versuchen'));
    expect(mockQuery.fetchNextPage).toHaveBeenCalled();
  });

  it('vollständig geladener Bestand wird als solcher gekennzeichnet', () => {
    renderMit(<NewsScreen />);
    expect(screen.getByText('Keine älteren Meldungen')).toBeTruthy();
  });
});

describe('Anpinnen und Ablösen einzelner Meldungen', () => {
  it('Meldung anpinnen: erscheint oben unter „Angepinnt" und lässt sich lösen', async () => {
    renderMit(<NewsScreen />);
    fireEvent.press(screen.getByLabelText('Meldung „Titel alt“ anpinnen'));
    await waitFor(() => expect(screen.getByText('Angepinnt')).toBeTruthy());

    const titel = screen.getAllByRole('header').map((h) => h.props.children);
    expect(titel.indexOf('Titel alt')).toBeLessThan(titel.indexOf('Titel neu'));

    fireEvent.press(screen.getByLabelText('Angepinnte Meldung „Titel alt“ lösen'));
    await waitFor(() => expect(screen.queryByText('Angepinnt')).toBeNull());
  });
});

describe('Entfernen zurückgezogener Meldungen aus der Liste', () => {
  it('Angepinnte Meldung wird zurückgezogen: Kennzeichnung statt kommentarlosem Verschwinden', async () => {
    renderMit(<NewsScreen />);
    fireEvent.press(screen.getByLabelText('Meldung „Titel alt“ anpinnen'));
    await waitFor(() => expect(screen.getByText('Angepinnt')).toBeTruthy());

    // Nächster Abruf: Meldung fehlt, ihre Kennung steht unter `zurueckgezogen`.
    mockQuery = mockQ({ meldungen: [meldung('neu', 20)], zurueckgezogen: ['alt'] });
    screen.rerender(
      <ThemeProvider>
        <NewsScreen />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByText('⊘ Zurückgezogen')).toBeTruthy());
    expect(screen.getByText('Titel alt')).toBeTruthy();
    expect(screen.queryByText('Langer Text alt')).toBeNull();
  });
});

describe('Detailansicht einer Meldung', () => {
  it('Meldung öffnen: Antippen führt zur Detailansicht', () => {
    renderMit(<NewsScreen />);
    fireEvent.press(screen.getByText('Titel neu'));
    expect(mockPush).toHaveBeenCalledWith('/news/neu');
  });

  it('zeigt vollständigen Text, Klassifizierung, Quelle und Zeitpunkt', () => {
    const lang = 'Absatz. '.repeat(80).trim();
    mockQuery = mockQ({ meldungen: [meldung('neu', 20, { text: lang })], zurueckgezogen: [] });
    mockParams = { meldungId: 'neu' };
    renderMit(<NewsDetailScreen />);
    expect(screen.getByText(lang)).toBeTruthy();
    expect(screen.getByText(/FSR-News/)).toBeTruthy();
    expect(screen.getByText('Quelle: FSR FB4')).toBeTruthy();
    expect(screen.getByText('20.11.2026, 13:45')).toBeTruthy();
  });

  it('Anpinnen aus der Detailansicht: danach oben in der Liste', async () => {
    mockParams = { meldungId: 'alt' };
    const detail = renderMit(<NewsDetailScreen />);
    fireEvent.press(screen.getByLabelText('Meldung „Titel alt“ anpinnen'));
    await waitFor(() => expect(screen.getByLabelText('Angepinnte Meldung „Titel alt“ lösen')).toBeTruthy());
    detail.unmount();

    renderMit(<NewsScreen />);
    await waitFor(() => expect(screen.getByText('Angepinnt')).toBeTruthy());
    const titel = screen.getAllByRole('header').map((h) => h.props.children);
    expect(titel.indexOf('Titel alt')).toBeLessThan(titel.indexOf('Titel neu'));
  });

  it('Meldung nicht mehr verfügbar: Hinweis mit Weg zurück', () => {
    mockParams = { meldungId: 'gibtsnicht' };
    renderMit(<NewsDetailScreen />);
    expect(screen.getByText('Meldung nicht verfügbar')).toBeTruthy();
    act(() => fireEvent.press(screen.getByText('Zur Übersicht')));
    expect(mockBack).toHaveBeenCalled();
  });
});
