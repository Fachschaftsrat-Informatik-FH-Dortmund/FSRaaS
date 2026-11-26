import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { SCHREIBVORGAENGE } from '@/state/schreibvorgaenge';
import { leseWarteschlange, registriereSchreibvorgaenge } from '@/state/schreibwarteschlange';
import { ThemeProvider } from '@/theme';
import type { Raum, RaumStatus } from '../api';
import { uhrzeit } from '../zeitraum';
import { RoomFinderScreen } from './RoomFinderScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

const mockOnline = jest.fn(() => true);
jest.mock('@/state/useOnlineStatus', () => ({ useOnlineStatus: () => mockOnline() }));

const STUNDE = 60 * 60_000;
const jetzt = Date.now();
const inStunden = (h: number) => new Date(jetzt + h * STUNDE).toISOString();

function mockQ<T>(data: T, over: Record<string, unknown> = {}) {
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

let mockRaeume: RaumStatus[];
let mockKuratiert: Raum[];
let mockAbgerufenAm: string;
const mockUebersichtAufrufe: (string | undefined)[] = [];

jest.mock('../api', () => ({
  useRaumuebersicht: (zeitpunkt?: string) => {
    mockUebersichtAufrufe.push(zeitpunkt);
    return mockQ({ raeume: mockRaeume, standAlter: { abgerufenAm: mockAbgerufenAm, quelleErreichbar: true } });
  },
  useKuratierteRaeume: () => mockQ(mockKuratiert),
}));

const datenbanken: RaumStatus = {
  roomId: 'A.E.01',
  zustand: 'belegt',
  groesse: 'gross',
  ekeyZugaenglich: true,
  besetztMeldungen: 0,
  aktuellerTermin: {
    roomId: 'A.E.01',
    beginn: inStunden(-0.5),
    ende: inStunden(1),
    bezeichnung: 'Datenbanken',
    art: 'lehrveranstaltung',
    note: 'Bitte Laptop mitbringen',
  },
};
const freiKuratiert: RaumStatus = {
  roomId: 'C.E.40',
  zustand: 'frei',
  groesse: 'klein',
  ekeyZugaenglich: true,
  besetztMeldungen: 0,
  naechsterTermin: { roomId: 'C.E.40', beginn: inStunden(5), ende: inStunden(6), bezeichnung: 'Später' },
};
const freiNichtKuratiert: RaumStatus = { roomId: 'Z.9.99', zustand: 'frei', besetztMeldungen: 0 };

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  onlineManager.setOnline(true);
  client = new QueryClient();
  registriereSchreibvorgaenge(client, SCHREIBVORGAENGE);
  client.mount();
  mockUebersichtAufrufe.length = 0;
  mockOnline.mockReturnValue(true);
  mockRaeume = [datenbanken, freiKuratiert, freiNichtKuratiert];
  mockKuratiert = [
    { roomId: 'A.E.01', groesse: 'gross', ekeyZugaenglich: true, schliesszeit: null },
    { roomId: 'C.E.40', groesse: 'klein', ekeyZugaenglich: true, schliesszeit: null },
  ];
  mockAbgerufenAm = new Date(jetzt - 10 * 60_000).toISOString();
});
afterEach(() => {
  cleanup();
  client.unmount();
  client.clear();
  onlineManager.setOnline(true);
});

function renderScreen() {
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <RoomFinderScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('Wechsel zwischen den drei Sichten', () => {
  it('Sicht wechseln: alle drei Sichten im Raum-Bereich, ohne zu einem anderen Tab zu navigieren', () => {
    renderScreen();
    expect(screen.getByText('C.E.40')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    expect(screen.getByLabelText('Raumkennung suchen')).toBeTruthy();
    expect(screen.getByText('Z.9.99')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'Läuft gerade' }));
    expect(screen.getByText('Datenbanken')).toBeTruthy();

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('Raumsuche offline nicht verfügbar', () => {
  it('Raumsuche ohne Netz: Kennzeichnung statt veralteter Ergebnisse', () => {
    mockOnline.mockReturnValue(false);
    renderScreen();
    expect(screen.getByText('Raumsuche offline nicht verfügbar')).toBeTruthy();
    expect(screen.queryByText('C.E.40')).toBeNull();
  });
});

describe('Suche nach freien Räumen', () => {
  it('zeigt freie Räume der kuratierten Liste mit „frei bis"', () => {
    renderScreen();
    expect(screen.getByText('C.E.40')).toBeTruthy();
    expect(screen.getByText(`frei bis ${uhrzeit(new Date(inStunden(5)))}`)).toBeTruthy();
    // belegt bzw. nicht kuratiert:
    expect(screen.queryByText('A.E.01')).toBeNull();
    expect(screen.queryByText('Z.9.99')).toBeNull();
  });

  it('Kein freier Raum im Zeitraum: Hinweis und Angebot eines späteren Zeitfensters', () => {
    mockRaeume = [datenbanken];
    renderScreen();
    expect(screen.getByText('Keine freien Räume gefunden')).toBeTruthy();
    const vorher = mockUebersichtAufrufe.at(-1)!;
    fireEvent.press(screen.getByRole('button', { name: 'Eine Stunde später suchen' }));
    const nachher = mockUebersichtAufrufe.at(-1)!;
    expect(Date.parse(nachher) - Date.parse(vorher)).toBe(STUNDE);
  });

  it('Nach Größenklasse filtern: nur Räume dieser Größenklasse', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'mittel' }));
    expect(screen.queryByText('C.E.40')).toBeNull();
    expect(screen.getByRole('button', { name: 'Filter zurücksetzen' })).toBeTruthy();
  });
});

describe('E-Key-Zugänglichkeit kennzeichnen', () => {
  it('E-Key-Kennzeichen sichtbar beim freien Raum', () => {
    renderScreen();
    expect(screen.getByText('Größe: klein · 🔑 mit E-Key zugänglich')).toBeTruthy();
  });
});

describe('Übersicht aller Räume mit Belegungszustand', () => {
  it('Übersicht zeigt alle Raumplan-Räume, auch außerhalb der kuratierten Liste', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    for (const id of ['A.E.01', 'C.E.40', 'Z.9.99']) expect(screen.getByText(id)).toBeTruthy();
    expect(screen.getAllByText('● belegt')).toHaveLength(1);
    expect(screen.getAllByText('○ frei')).toHaveLength(2);
  });
});

describe('Laufende Veranstaltung bei belegtem Raum', () => {
  it('Belegter Raum mit laufender Veranstaltung: Bezeichnung und Endzeitpunkt', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    expect(screen.getByText(`Datenbanken · bis ${uhrzeit(new Date(inStunden(1)))}`)).toBeTruthy();
  });
});

describe('Freizeitpunkt bei freiem Raum in der Übersicht', () => {
  it('Freier Raum in der Übersicht: bis wann er frei ist', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    expect(screen.getByText(`frei bis ${uhrzeit(new Date(inStunden(5)))}`)).toBeTruthy();
    expect(screen.getByText('frei, kein weiterer Termin bekannt')).toBeTruthy();
  });
});

describe('Größenklasse und E-Key-Kennzeichen in der Übersicht', () => {
  it('Kuratierter Raum mit, nicht kuratierter Raum ohne Merkmale und ohne Fehler', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    expect(screen.getByText('Größe: groß · 🔑 mit E-Key zugänglich')).toBeTruthy();
    expect(screen.getByText('Größe: klein · 🔑 mit E-Key zugänglich')).toBeTruthy();
    expect(screen.getAllByText(/^Größe:/)).toHaveLength(2);
  });
});

describe('Freitextfeld eines Raumplan-Termins anzeigen', () => {
  it('Termin mit gesetztem Freitextfeld: Inhalt unverändert angezeigt', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    expect(screen.getByText('Hinweis: Bitte Laptop mitbringen')).toBeTruthy();
  });
});

describe('Übersicht nach Belegungszustand einschränken', () => {
  it('Übersicht ohne passenden Raum: Hinweis mit Weg, den Filter zurückzusetzen', () => {
    mockRaeume = [freiKuratiert];
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    fireEvent.press(screen.getByRole('radio', { name: 'belegt' }));
    expect(screen.getByText('Kein Raum im gewählten Zustand')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Filter zurücksetzen' }));
    expect(screen.getByText('C.E.40')).toBeTruthy();
  });
});

describe('Suche nach Raumkennung in der Übersicht', () => {
  it('Raumkennung in der Übersicht suchen: passende Räume', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    fireEvent.changeText(screen.getByLabelText('Raumkennung suchen'), 'c.e');
    expect(screen.getByText('C.E.40')).toBeTruthy();
    expect(screen.queryByText('A.E.01')).toBeNull();
  });
});

describe('Tagesbelegung aus Übersicht oder laufenden Veranstaltungen öffnen', () => {
  it('Raum aus der Übersicht auswählen: öffnet dessen Tagesbelegung', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    fireEvent.press(screen.getByRole('button', { name: 'Belegung von Z.9.99 anzeigen' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/rooms/raum/[roomId]', params: { roomId: 'Z.9.99' } });
  });

  it('Raum aus den laufenden Veranstaltungen auswählen', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Läuft gerade' }));
    fireEvent.press(screen.getByRole('button', { name: 'Belegung von A.E.01 anzeigen' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/rooms/raum/[roomId]', params: { roomId: 'A.E.01' } });
  });
});

describe('Belegung eines gewählten Raums anzeigen', () => {
  it('Raum per Kennung wählen: die Eingabe öffnet die Tagesbelegung genau dieser Kennung', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    fireEvent.changeText(screen.getByLabelText('Raumkennung suchen'), ' x.0.00 ');
    fireEvent.press(screen.getByRole('button', { name: 'Belegung anzeigen' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/rooms/raum/[roomId]', params: { roomId: 'X.0.00' } });
  });
});

describe('Ansicht laufender Veranstaltungen', () => {
  it('Keine laufende Veranstaltung: Hinweis', () => {
    mockRaeume = [freiKuratiert];
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Läuft gerade' }));
    expect(screen.getByText('Gerade findet keine erfasste Veranstaltung statt')).toBeTruthy();
  });
});

describe('Raum, Bezeichnung und Endzeitpunkt je laufender Veranstaltung', () => {
  it('Laufende Veranstaltung mit Details', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Läuft gerade' }));
    expect(screen.getByText('Datenbanken')).toBeTruthy();
    expect(screen.getByText(`bis ${uhrzeit(new Date(inStunden(1)))}`)).toBeTruthy();
    expect(screen.getByText('A.E.01')).toBeTruthy();
  });
});

describe('Alter eines veralteten Raumplan-Stands anzeigen', () => {
  it('Veralteter Zwischenspeicher: Alter sichtbar in Übersicht und laufenden Veranstaltungen', () => {
    mockAbgerufenAm = new Date(jetzt - 3 * STUNDE).toISOString();
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    expect(screen.getByText(/Der Raumplan ist nicht auf dem aktuellen Stand/)).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'Läuft gerade' }));
    expect(screen.getByText(/Der Raumplan ist nicht auf dem aktuellen Stand/)).toBeTruthy();
  });

  it('Aktueller Zwischenspeicher: kein Hinweis', () => {
    renderScreen();
    expect(screen.queryByText(/nicht auf dem aktuellen Stand/)).toBeNull();
  });
});

describe('Besetzt-Meldung zusätzlich in der Übersicht anzeigen', () => {
  it('Gültige Besetzt-Meldung in der Übersicht: zusätzlich zum offiziellen Zustand', () => {
    mockRaeume = [datenbanken, { ...freiKuratiert, besetztMeldungen: 2 }, freiNichtKuratiert];
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));

    expect(screen.getByText('⚑ 2× als besetzt gemeldet (letzte 90 Minuten)')).toBeTruthy();
    // Der offizielle Zustand bleibt „frei"; die Meldung ersetzt ihn nicht.
    expect(screen.getAllByText('○ frei')).toHaveLength(2);
  });

  it('ohne gültige Meldung keine Zusatzzeile', () => {
    renderScreen();
    fireEvent.press(screen.getByRole('radio', { name: 'Übersicht' }));
    expect(screen.queryByText(/als besetzt gemeldet/)).toBeNull();
  });
});

describe('Anzahl der Besetzt-Meldungen anzeigen', () => {
  it('auch in der Freie-Raum-Suche je Raum', () => {
    mockRaeume = [datenbanken, { ...freiKuratiert, besetztMeldungen: 1 }, freiNichtKuratiert];
    renderScreen();
    expect(screen.getByText('C.E.40')).toBeTruthy();
    expect(screen.getByText('⚑ 1× als besetzt gemeldet (letzte 90 Minuten)')).toBeTruthy();
  });
});

describe('Raum als besetzt melden', () => {
  it('Besetzt-Meldung offline: per Raumkennung in die Warteschlange, obwohl die Raumsuche nicht verfügbar ist', async () => {
    mockOnline.mockReturnValue(false);
    onlineManager.setOnline(false);
    renderScreen();
    expect(screen.getByText('Raumsuche offline nicht verfügbar')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Raumkennung für die Besetzt-Meldung'), 'c.e.40');
    fireEvent.press(screen.getByRole('button', { name: 'Als besetzt melden' }));

    expect(await screen.findByText('⏸ Besetzt-Meldung für C.E.40 · wartet auf Verbindung')).toBeTruthy();
    expect(leseWarteschlange(client)).toEqual([
      expect.objectContaining({ art: 'besetztMeldung', auftrag: expect.objectContaining({ nutzdaten: { roomId: 'C.E.40' } }) }),
    ]);
  });
});
