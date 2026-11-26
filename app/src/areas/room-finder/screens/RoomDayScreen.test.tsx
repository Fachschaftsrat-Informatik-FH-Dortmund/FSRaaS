import { cleanup, render, screen } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import { ThemeProvider } from '@/theme';
import { uhrzeit } from '../zeitraum';
import { RoomDayScreen } from './RoomDayScreen';

let mockParams: Record<string, string>;
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
}));

const mockOnline = jest.fn(() => true);
jest.mock('@/state/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));

const jetzt = Date.now();
const iso = (minuten: number) => new Date(jetzt + minuten * 60_000).toISOString();

let mockQuery: Record<string, unknown>;
const mockBelegungAufrufe: [string, string][] = [];
jest.mock('../api', () => ({
  useRaumbelegung: (roomId: string, datum: string) => {
    mockBelegungAufrufe.push([roomId, datum]);
    return mockQuery;
  },
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

beforeEach(() => {
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
});
afterEach(cleanup);

function renderScreen() {
  return render(
    <ThemeProvider>
      <RoomDayScreen />
    </ThemeProvider>,
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
