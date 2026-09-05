import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { CourseSelectionScreen } from './CourseSelectionScreen';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let mockEinrichtung: any;
let mockEntries: any[];
const mockHinzufuegen = jest.fn();

jest.mock('../einrichtung', () => ({
  useEinrichtung: () => ({ einrichtung: mockEinrichtung, loaded: true }),
}));

jest.mock('../planStore', () => ({
  useScheduleEntries: () => ({ entries: mockEntries, loaded: true, hinzufuegen: mockHinzufuegen }),
}));

let mockHauptQuery: any;
jest.mock('../api', () => ({
  useTermine: () => mockHauptQuery,
  ladeTermine: jest.fn(() => Promise.resolve([])),
}));

// Beispielbestand angelehnt an das Mockup aus dem Auftrag: eine Veranstaltung
// mit Vorlesung (alle Gruppen), Praktikum (drei Gruppen-Slots) und Übung
// (eine Gruppe).
const termin = (over: Record<string, unknown>) => ({
  courseId: '43051',
  name: 'Softwaretechnik 1',
  lecturerName: 'Prof. Beispiel',
  roomId: 'A.2.02',
  gueltigVon: null,
  gueltigBis: null,
  ...over,
});

const V = termin({ courseType: 'V', studentSet: '*', weekday: 'Mon', timeBeginMin: 480, timeEndMin: 570, roomId: 'A.2.02' });
const P_CD = termin({ courseType: 'P', studentSet: 'C-D', weekday: 'Tue', timeBeginMin: 840, timeEndMin: 900, roomId: 'B.114' });
const P_AB = termin({ courseType: 'P', studentSet: 'A-B', weekday: 'Mon', timeBeginMin: 840, timeEndMin: 900, roomId: 'B.114' });
const P_EF = termin({ courseType: 'P', studentSet: 'E-F', weekday: 'Wed', timeBeginMin: 615, timeEndMin: 675, roomId: 'B.116' });
const UE_CD = termin({ courseType: 'Ü', studentSet: 'C-D', weekday: 'Thu', timeBeginMin: 675, timeEndMin: 735, roomId: 'A.114' });

let client: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  mockEinrichtung = { sname: 'INPBPI', grade: '2', gruppenkennung: 'C8', zusatzFachsemester: [] };
  mockEntries = [];
  mockHauptQuery = {
    data: [V, P_CD, P_AB, P_EF, UE_CD],
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(),
  };
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

afterEach(() => {
  cleanup();
  client.clear();
});

function renderScreen() {
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <CourseSelectionScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

function oeffneKurs() {
  fireEvent.press(screen.getByText(/Softwaretechnik 1/));
}

describe('SCHED-F-600 Gliederung Veranstaltung → Veranstaltungsart → Gruppen-Slot', () => {
  it('zeigt die Veranstaltung zunächst eingeklappt und öffnet Veranstaltungsarten per Tap', () => {
    renderScreen();
    expect(screen.getByText(/Softwaretechnik 1/)).toBeTruthy();
    expect(screen.queryByLabelText('V übernehmen')).toBeNull();

    oeffneKurs();
    expect(screen.getByLabelText('V übernehmen')).toBeTruthy();
    expect(screen.getByLabelText('P übernehmen')).toBeTruthy();
    expect(screen.getByLabelText('Ü übernehmen')).toBeTruthy();
  });
});

describe('SCHED-F-248 Anzeige von Veranstaltungsart, Zeitraum, Gruppe, Lehrperson und Raum', () => {
  it('zeigt zu einem Gruppen-Slot Zeitraum, Gruppenangabe, Lehrperson und Raum', () => {
    renderScreen();
    oeffneKurs();
    expect(screen.getByLabelText('Di 14:00–15:00 C-D')).toBeTruthy();
    // P_CD und P_AB teilen sich denselben Raum (B.114) — die Zeile ist daher
    // über den vollständigen Text aus Zeitraum, Gruppe und Lehrperson/Raum zu
    // identifizieren, nicht über den Raum allein.
    expect(screen.getByText(/Di 14:00–15:00 · C-D/)).toBeTruthy();
    expect(screen.getAllByText('Prof. Beispiel · B.114').length).toBeGreaterThan(0);
  });
});

describe('SCHED-F-140 / SCHED-F-250 Gruppenfremde Slots bleiben sichtbar und gekennzeichnet', () => {
  it('kennzeichnet den eigenen Slot als „deine Gruppe" und andere als „andere Gruppe", statt sie zu entfernen', () => {
    renderScreen();
    oeffneKurs();
    // P_CD (Di) und UE_CD (Do) sind beide die eigene Gruppe — der Zeitraum
    // grenzt ein, welcher Slot gemeint ist.
    expect(screen.getByText(/Di 14:00–15:00 · C-D \(deine Gruppe\)/)).toBeTruthy();
    expect(screen.getByText(/Do 11:15–12:15 · C-D \(deine Gruppe\)/)).toBeTruthy();
    expect(screen.getByLabelText('Mo 14:00–15:00 A-B')).toBeTruthy();
    expect(screen.getByText(/Mo 14:00–15:00 · A-B.*andere Gruppe/)).toBeTruthy();
  });
});

describe('SCHED-F-610 Einzelne Veranstaltungsarten abwählen, ohne die Veranstaltung zu verlieren', () => {
  it('blendet nach dem Abschalten einer Art deren Slots aus, die Veranstaltung bleibt bestehen', () => {
    renderScreen();
    oeffneKurs();
    expect(screen.getByLabelText('Do 11:15–12:15 C-D')).toBeTruthy();

    fireEvent(screen.getByLabelText('Ü übernehmen'), 'valueChange', false);

    expect(screen.queryByLabelText('Do 11:15–12:15 C-D')).toBeNull();
    expect(screen.getByText(/Softwaretechnik 1/)).toBeTruthy();
    expect(screen.getByLabelText('P übernehmen')).toBeTruthy();
  });
});

describe('SCHED-F-620 Mehrere Gruppen-Slots derselben Veranstaltung gleichzeitig übernehmen', () => {
  it('übernimmt den zuerst gewählten Slot als „fest" und einen zusätzlich gewählten als „vorgemerkt"', () => {
    renderScreen();
    oeffneKurs();

    // C-D ist als eigene Gruppe vorgewählt; zusätzlich A-B antippen (SCHED-F-620).
    fireEvent.press(screen.getByLabelText('Mo 14:00–15:00 A-B'));
    fireEvent.press(screen.getByLabelText('Übernehmen'));

    const pEintraege = mockHinzufuegen.mock.calls.map((c) => c[0]).filter((e: any) => e.courseType === 'P');
    expect(pEintraege).toHaveLength(2);
    expect(pEintraege.find((e: any) => e.studentSet === 'C-D').status).toBe('fest');
    expect(pEintraege.find((e: any) => e.studentSet === 'A-B').status).toBe('vorgemerkt');
  });
});

describe('SCHED-F-260 Übernommener Termin einer anderen Gruppe bleibt offiziell, aber gekennzeichnet', () => {
  it('markiert einen übernommenen fremden Gruppen-Slot als abweichende Gruppe', () => {
    renderScreen();
    oeffneKurs();

    fireEvent.press(screen.getByLabelText('Mo 14:00–15:00 A-B'));
    fireEvent.press(screen.getByLabelText('Übernehmen'));

    const abEintrag = mockHinzufuegen.mock.calls
      .map((c) => c[0])
      .find((e: any) => e.studentSet === 'A-B');
    expect(abEintrag.kind).toBe('offiziell');
    expect(abEintrag.abweichendeGruppe).toBe(true);
    expect(abEintrag.gruppenzugehoerig).toBe(false);
  });
});

describe('SCHED-F-245 Auswahl, welche Veranstaltungen/-arten/-Slots übernommen werden', () => {
  it('übernimmt nur, was ausgewählt ist — eine abgewählte Veranstaltungsart bleibt draußen', () => {
    renderScreen();
    oeffneKurs();

    fireEvent(screen.getByLabelText('V übernehmen'), 'valueChange', false);
    fireEvent.press(screen.getByLabelText('Übernehmen'));

    const arten = mockHinzufuegen.mock.calls.map((c) => c[0].courseType);
    expect(arten).not.toContain('V');
    expect(arten).toContain('P');
    expect(arten).toContain('Ü');
  });
});

describe('SCHED-F-630 Freitextsuche über Bezeichnung, Modulnummer und lehrende Person', () => {
  it('zeigt bei fehlendem Treffer den Leerzustand mit Filterhinweis', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Suche nach Bezeichnung, Modulnummer oder Lehrperson'), 'Nichts davon');
    expect(screen.getByText('Keine Treffer')).toBeTruthy();
    expect(screen.queryByText(/Softwaretechnik 1/)).toBeNull();
  });

  it('findet die Veranstaltung über einen Teil der Bezeichnung', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText('Suche nach Bezeichnung, Modulnummer oder Lehrperson'), 'software');
    expect(screen.getByText(/Softwaretechnik 1/)).toBeTruthy();
  });
});
