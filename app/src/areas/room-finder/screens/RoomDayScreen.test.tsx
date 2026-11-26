import AsyncStorage from '@react-native-async-storage/async-storage';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import { api } from '@/net/client';
import { SCHREIBVORGAENGE } from '@/state/schreibvorgaenge';
import { leseWarteschlange, registriereSchreibvorgaenge } from '@/state/schreibwarteschlange';
import { ThemeProvider } from '@/theme';
import { uhrzeit } from '../zeitraum';
import { RoomDayScreen } from './RoomDayScreen';

let mockParams: Record<string, string>;
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
}));

const mockOnline = jest.fn(() => true);
jest.mock('@/state/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));

// Fester Bezugspunkt am Vormittag, damit Termine um „jetzt" nie über Mitternacht
// reichen und die Tests nicht von der Tageszeit abhängen.
const jetzt = new Date(2026, 10, 26, 10, 0).getTime();
beforeAll(() => {
  jest.useFakeTimers({ now: jetzt, advanceTimers: true });
});
afterAll(() => {
  jest.useRealTimers();
});
const iso = (minuten: number) => new Date(jetzt + minuten * 60_000).toISOString();

let mockQuery: Record<string, unknown>;
let mockUebersicht: Record<string, unknown>;
const mockBelegungAufrufe: [string, string][] = [];
jest.mock('../api', () => ({
  useRaumbelegung: (roomId: string, datum: string) => {
    mockBelegungAufrufe.push([roomId, datum]);
    return mockQuery;
  },
  useRaumuebersicht: () => mockUebersicht,
}));

function mockQ(data: unknown, over: Record<string, unknown> = {}) {
  return {
    data,
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    error: null,
    dataUpdatedAt: jetzt,
    refetch: jest.fn(),
    ...over,
  };
}

const standAlter = { abgerufenAm: new Date(jetzt).toISOString(), quelleErreichbar: true };

let client: QueryClient;

beforeEach(async () => {
  await AsyncStorage.clear();
  onlineManager.setOnline(true);
  client = new QueryClient();
  registriereSchreibvorgaenge(client, SCHREIBVORGAENGE);
  client.mount();
  mockBelegungAufrufe.length = 0;
  mockOnline.mockReturnValue(true);
  mockParams = { roomId: 'c.e.44' };
  mockQuery = mockQ({
    termine: [
      { roomId: 'C.E.44', beginn: iso(-30), ende: iso(60), bezeichnung: 'Datenbanken', art: 'lehrveranstaltung', note: 'Raum getauscht' },
      { roomId: 'C.E.44', beginn: iso(120), ende: iso(180), bezeichnung: 'Prüfung 42012 Programmieren', art: 'pruefung' },
    ],
    standAlter,
  });
  mockUebersicht = mockQ({
    raeume: [{ roomId: 'C.E.44', zustand: 'belegt', besetztMeldungen: 0 }],
    standAlter,
  });
});
afterEach(() => {
  cleanup();
  client.unmount();
  client.clear();
  onlineManager.setOnline(true);
  jest.restoreAllMocks();
});

function renderScreen() {
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <RoomDayScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Belegung eines gewählten Raums anzeigen', () => {
  it('Raum per Kennung wählen: Belegung für den aktuellen Tag', () => {
    renderScreen();
    const heute = new Date(jetzt);
    const tag = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, '0')}-${String(heute.getDate()).padStart(2, '0')}`;
    expect(mockBelegungAufrufe.at(-1)).toEqual(['C.E.44', tag]);
    expect(screen.getByText('C.E.44 heute')).toBeTruthy();
    expect(screen.getByText('Datenbanken')).toBeTruthy();
    expect(
      screen.getByText(`${uhrzeit(new Date(iso(-30)))}–${uhrzeit(new Date(iso(60)))} · läuft gerade`),
    ).toBeTruthy();
    expect(screen.getByText('Prüfung')).toBeTruthy();
  });

  it('Unbekannte Raumkennung: Hinweis „Raum unbekannt", keine Fehlermeldung eines technischen Ausfalls', () => {
    mockQuery = mockQ(undefined, {
      isError: true,
      error: new AppError({ kind: 'notFound', code: 'raum_unbekannt', message: 'x', status: 404, retryable: false }),
    });
    renderScreen();
    expect(screen.getByText('Raum unbekannt')).toBeTruthy();
    expect(screen.queryByText('Etwas ist schiefgelaufen')).toBeNull();
  });

  it('Tag ohne Termine: Leerhinweis mit nächstem Schritt', () => {
    mockQuery = mockQ({ termine: [], standAlter });
    renderScreen();
    expect(screen.getByText('Heute keine Termine')).toBeTruthy();
  });
});

describe('Freitextfeld eines Raumplan-Termins anzeigen', () => {
  it('in der Tagesbelegung', () => {
    renderScreen();
    expect(screen.getByText('Hinweis: Raum getauscht')).toBeTruthy();
  });
});

describe('Raumsuche offline nicht verfügbar', () => {
  it('auch die Tagesbelegung ist ohne Netz als nicht verfügbar gekennzeichnet', () => {
    mockOnline.mockReturnValue(false);
    renderScreen();
    expect(screen.getByText('Raumsuche offline nicht verfügbar')).toBeTruthy();
    expect(screen.queryByText('Datenbanken')).toBeNull();
  });
});

type PostOptionen = { params: { header: Record<string, string> } };

function antwortVon(status: number, data?: unknown) {
  return { data, error: undefined, response: new Response(null, { status }) } as never;
}

function postQuittiert(gueltigBis: string, merke?: (id: string) => void) {
  return jest.spyOn(api, 'POST').mockImplementation((async (_pfad: string, optionen: PostOptionen) => {
    const meldungId = optionen.params.header['Idempotency-Key'] ?? '';
    merke?.(meldungId);
    return antwortVon(202, { meldungId, gueltigBis });
  }) as never);
}

async function warteKurz() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('Raum als besetzt melden', () => {
  it('Besetzt-Meldung offline: in die Offline-Warteschlange eingereiht statt verworfen', async () => {
    mockOnline.mockReturnValue(false);
    onlineManager.setOnline(false);
    const post = jest.spyOn(api, 'POST');
    renderScreen();

    expect(screen.getByText('Raumsuche offline nicht verfügbar')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Als besetzt melden' }));

    expect(await screen.findByText('Deine Meldung wird übertragen, sobald eine Verbindung besteht.')).toBeTruthy();
    expect(leseWarteschlange(client)).toEqual([
      expect.objectContaining({
        art: 'besetztMeldung',
        zustand: 'wartend',
        auftrag: expect.objectContaining({ nutzdaten: { roomId: 'C.E.44' } }),
      }),
    ]);
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText('⏸ Besetzt-Meldung für C.E.44 · wartet auf Verbindung')).toBeTruthy();
  });

  it('online: mit Idempotenz-Schlüssel und Auslösezeitpunkt gesendet, danach als eigene Meldung sichtbar', async () => {
    const gueltigBis = iso(90);
    const post = postQuittiert(gueltigBis);
    renderScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Als besetzt melden' }));

    expect(
      await screen.findByText(`Du hast diesen Raum als besetzt gemeldet (gültig bis ${uhrzeit(new Date(gueltigBis))}).`),
    ).toBeTruthy();
    expect(post).toHaveBeenCalledWith('/raeume/{roomId}/besetzt-meldungen', {
      params: { path: { roomId: 'C.E.44' }, header: { 'Idempotency-Key': expect.stringMatching(/^[0-9a-f-]{36}$/) } },
      body: { gemeldetAm: expect.any(String) },
    });
    expect(screen.queryByRole('button', { name: 'Als besetzt melden' })).toBeNull();
  });
});

describe('Besetzt-Meldung zurückziehen', () => {
  it('Eigene Meldung zurückziehen: Rücknahme mit derselben Kennung gesendet', async () => {
    let meldungId = '';
    postQuittiert(iso(90), (id) => {
      meldungId = id;
    });
    const loeschen = jest.spyOn(api, 'DELETE').mockImplementation((async () => antwortVon(204)) as never);
    renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Als besetzt melden' }));
    await screen.findByRole('button', { name: 'Meldung zurückziehen' });

    fireEvent.press(screen.getByRole('button', { name: 'Meldung zurückziehen' }));

    expect(await screen.findByRole('button', { name: 'Als besetzt melden' })).toBeTruthy();
    await warteKurz();
    expect(loeschen).toHaveBeenCalledWith('/raeume/{roomId}/besetzt-meldungen/{meldungId}', {
      params: { path: { roomId: 'C.E.44', meldungId } },
    });
  });

  it('noch nicht übertragene Meldung: aus der Warteschlange genommen, nichts gesendet', async () => {
    mockOnline.mockReturnValue(false);
    onlineManager.setOnline(false);
    const post = jest.spyOn(api, 'POST');
    const loeschen = jest.spyOn(api, 'DELETE');
    renderScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Als besetzt melden' }));
    await screen.findByText('Deine Meldung wird übertragen, sobald eine Verbindung besteht.');

    fireEvent.press(screen.getByRole('button', { name: 'Meldung zurückziehen' }));

    expect(await screen.findByRole('button', { name: 'Als besetzt melden' })).toBeTruthy();
    expect(leseWarteschlange(client)).toEqual([]);
    await act(async () => {
      onlineManager.setOnline(true);
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(post).not.toHaveBeenCalled();
    expect(loeschen).not.toHaveBeenCalled();
  });
});

describe('Anzahl der Besetzt-Meldungen anzeigen', () => {
  it('Besetzt-Meldung erhöht die Anzeige: Anzahl gültiger Meldungen des Raums sichtbar', () => {
    mockUebersicht = mockQ({ raeume: [{ roomId: 'C.E.44', zustand: 'frei', besetztMeldungen: 2 }], standAlter });
    renderScreen();
    expect(screen.getByText('⚑ 2× als besetzt gemeldet (letzte 90 Minuten)')).toBeTruthy();
  });

  it('ohne gültige Meldung ein ausdrücklicher Hinweis', () => {
    renderScreen();
    expect(screen.getByText('Keine Besetzt-Meldung in den letzten 90 Minuten')).toBeTruthy();
  });
});
