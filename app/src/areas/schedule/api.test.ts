import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';

import { api, unwrap } from '@/net/client';
import { holeGruppenkennungZuMatrikelnummer, holeStudiengaenge, holeTermine } from './fbwsClient';
import { ermittleGruppenkennung, useGruppenkennungErmitteln, useStudiengaenge, useTermine, useWahlpflichtTermine } from './api';

jest.mock('./fbwsClient', () => ({
  holeStudiengaenge: jest.fn(),
  holeTermine: jest.fn(),
  holeGruppenkennungZuMatrikelnummer: jest.fn(),
}));

jest.mock('@/net/client', () => ({
  api: { GET: jest.fn(), POST: jest.fn() },
  unwrap: jest.fn((r: { data?: unknown; error?: unknown }) => {
    if (r.error !== undefined) throw new Error('fehler');
    return r.data;
  }),
}));

// Die Hooks in api.ts setzen `gcTime` aus `@/cache/ttl` (für Studiengänge und
// Termine ein Tag bzw. `Math.max(staleTime, 7 Tage)` real). TanStack Query
// plant dafür bei jeder Query/Mutation einen echten `setTimeout` über die
// volle Dauer, sobald sie keine Beobachter mehr hat (`scheduleGc`,
// `@tanstack/query-core`) — ohne `.unref()`. Das ist die Ursache von „A
// worker process has failed to exit gracefully", die seit Etappe 2a auftritt
// (Vorbild für die Abhilfe: `canteen/screens/CanteenScreen.test.tsx`, das
// `cleanup()` und `client.clear()` je Test aufruft statt sich auf
// automatisches Aufräumen zu verlassen). Gefundene Ursache der SCHED-F-690-
// Ergänzung: `defaultOptions.queries.gcTime` deckt **keine** Mutationen ab —
// `useMutation` (SCHED-F-690) braucht dafür den eigenen Namensraum
// `defaultOptions.mutations`, sonst bleibt ihr Standard-`gcTime` real
// eingeplant. `@/cache/ttl` wird zusätzlich auf sehr kurze Werte gemockt,
// damit erst gar kein langlebiger Timer für Queries entsteht.
jest.mock('@/cache/ttl', () => ({
  staleTime: () => 0,
  gcTime: () => 0,
}));

const clients: QueryClient[] = [];

afterEach(() => {
  cleanup();
  for (const client of clients) client.clear();
  clients.length = 0;
});

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  clients.push(client);
  return function TestWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

const rohTermin = {
  name: 'Algorithmen und Datenstrukturen',
  courseId: '42012',
  courseType: 'V',
  studentSet: '*',
  weekday: 'Mon',
  timeBegin: '800',
  timeEnd: '930',
  lecturerName: 'Beispiel',
  roomId: 'A.1.01',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SCHED-F-030 Terminabruf für ein Studiengang/Fachsemester-Paar', () => {
  it('ruft INT-002 über fbwsClient ab und liefert normalisierte Termine', async () => {
    (holeTermine as jest.Mock).mockResolvedValue([rohTermin]);

    const { result } = renderHook(() => useTermine('INPBPI', '2'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(holeTermine).toHaveBeenCalledWith('INPBPI', '2');
    expect(result.current.data).toEqual([
      expect.objectContaining({ courseId: '42012', timeBeginMin: 480, timeEndMin: 570 }),
    ]);
  });

  it('ruft nicht ab, solange Studiengang oder Fachsemester fehlen', () => {
    const { result } = renderHook(() => useTermine(undefined, undefined), { wrapper: wrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(holeTermine).not.toHaveBeenCalled();
  });
});

describe('SCHED-F-400 Wahlpflicht-Sammelkategorie', () => {
  it('ruft INT-002 mit sname=WFPB und grade=* ab', async () => {
    (holeTermine as jest.Mock).mockResolvedValue([rohTermin]);

    const { result } = renderHook(() => useWahlpflichtTermine(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(holeTermine).toHaveBeenCalledWith('WFPB', '*');
    expect(result.current.data).toHaveLength(1);
  });
});

describe('SCHED-F-254 Rückfall auf die Backend-Liste, falls INT-001 nicht erreichbar ist', () => {
  it('liefert die FBWS-Liste, wenn INT-001 erreichbar ist, ohne die Rückfallliste abzurufen', async () => {
    (holeStudiengaenge as jest.Mock).mockResolvedValue([{ name: 'Praktische Informatik', sname: 'INPBPI', grades: ['2'] }]);

    const { result } = renderHook(() => useStudiengaenge(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    expect(result.current.studiengaenge).toEqual([{ name: 'Praktische Informatik', sname: 'INPBPI', grades: ['2'] }]);
    expect(result.current.istRueckfall).toBe(false);
    expect(api.GET).not.toHaveBeenCalled();
  });

  it('weicht auf GET /stundenplan/studiengaenge aus, wenn INT-001 fehlschlägt', async () => {
    (holeStudiengaenge as jest.Mock).mockRejectedValue(new Error('FBWS nicht erreichbar'));
    (api.GET as jest.Mock).mockResolvedValue({
      data: [{ kurzname: 'INPBPI', name: 'Praktische Informatik', fachsemester: [2, 4] }],
    });

    const { result } = renderHook(() => useStudiengaenge(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.istRueckfall).toBe(true));

    expect(api.GET).toHaveBeenCalledWith('/stundenplan/studiengaenge');
    expect(result.current.studiengaenge).toEqual([
      { name: 'Praktische Informatik', sname: 'INPBPI', grades: ['2', '4'] },
    ]);
    expect(unwrap).toHaveBeenCalled();
  });
});

// Platzhalter-Matrikelnummer, keine echte (siehe Testregel im Auftrag).
const PLATZHALTER_MATRIKELNUMMER = '1234567';

describe('SCHED-F-690 Ermittlung der Gruppenkennung aus der Matrikelnummer über INT-019', () => {
  it('ruft holeGruppenkennungZuMatrikelnummer über die Mutation auf und liefert die Kennung', async () => {
    (holeGruppenkennungZuMatrikelnummer as jest.Mock).mockResolvedValue('O7');

    const { result } = renderHook(() => useGruppenkennungErmitteln(), { wrapper: wrapper() });
    result.current.mutate(PLATZHALTER_MATRIKELNUMMER);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(holeGruppenkennungZuMatrikelnummer).toHaveBeenCalledWith(PLATZHALTER_MATRIKELNUMMER);
    expect(result.current.data).toBe('O7');
  });

  it('liefert über die reaktionslose Funktion ermittleGruppenkennung dasselbe Ergebnis ohne React', async () => {
    (holeGruppenkennungZuMatrikelnummer as jest.Mock).mockResolvedValue('B3');
    await expect(ermittleGruppenkennung(PLATZHALTER_MATRIKELNUMMER)).resolves.toBe('B3');
  });

  it('liefert null, wenn INT-019 keine Kennung hinterlegt hat (fhDoStudentSet: false)', async () => {
    (holeGruppenkennungZuMatrikelnummer as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useGruppenkennungErmitteln(), { wrapper: wrapper() });
    result.current.mutate(PLATZHALTER_MATRIKELNUMMER);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });
});

describe('SCHED-F-710 Matrikelnummer geht an kein anderes Ziel als INT-019', () => {
  it('ruft beim Ermitteln der Gruppenkennung nie den Client des eigenen Backends auf', async () => {
    (holeGruppenkennungZuMatrikelnummer as jest.Mock).mockResolvedValue('C8');

    await ermittleGruppenkennung(PLATZHALTER_MATRIKELNUMMER);

    // Nachweis statt Behauptung: der einzige Abruf lief über fbwsClient
    // (INT-019); der Client des eigenen Backends (API-F-100) wurde dabei kein
    // einziges Mal aufgerufen — insbesondere nie mit der Matrikelnummer.
    expect(api.GET).not.toHaveBeenCalled();
    expect(api.POST).not.toHaveBeenCalled();
  });
});
