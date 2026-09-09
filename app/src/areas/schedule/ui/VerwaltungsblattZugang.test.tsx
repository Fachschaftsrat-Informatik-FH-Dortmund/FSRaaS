import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { writeJson } from '@/storage/kv';
import { ThemeProvider } from '@/theme';
import { __resetAnsichtEinstellungenForTest, readAnsichtEinstellungen } from '../ansichtEinstellungen';
import { __resetEinrichtungForTest, readEinrichtung } from '../einrichtung';
import { __resetScheduleEntriesForTest, readScheduleEntries } from '../planStore';
import type { CustomPlanEntry, OfficialPlanEntry } from '../typen';
import { VerwaltungsblattZugang } from './VerwaltungsblattZugang';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));

function offiziell(over: Partial<OfficialPlanEntry> & { id: string }): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    deaktiviertBis: null,
    color: '#1E88E5',
    weekday: 'Wed',
    timeBeginMin: 480,
    timeEndMin: 570,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    courseId: '43051',
    name: 'Analysis',
    courseType: 'V',
    lecturerName: 'Prof. Beispiel',
    studentSet: '*',
    roomId: 'A.2.02',
    ...over,
  };
}

function eigen(over: Partial<CustomPlanEntry> & { id: string }): CustomPlanEntry {
  return {
    kind: 'eigen',
    deaktiviertBis: null,
    color: '#43A047',
    weekday: 'Wed',
    timeBeginMin: 840,
    timeEndMin: 900,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    title: 'Lerngruppe',
    wiederkehrend: true,
    ...over,
  };
}

async function seed() {
  await AsyncStorage.clear();
  await writeJson('scheduleEntries', [offiziell({ id: 'a' }), eigen({ id: 'e' })]);
  await writeJson('scheduleSetup', { endpunkte: ['INPBPI'], gruppenkennung: 'C8', gruppenkennungVorschlag: null });
  await writeJson('scheduleViewSettings', { zeitachse: true, sprungZuHeute: true });
  __resetScheduleEntriesForTest();
  __resetEinrichtungForTest();
  __resetAnsichtEinstellungenForTest();
}

async function oeffnen() {
  render(
    <ThemeProvider>
      <VerwaltungsblattZugang />
    </ThemeProvider>,
  );
  fireEvent.press(screen.getByLabelText('Ansicht und Verwaltung'));
  await waitFor(() => expect(screen.getByText('Ansicht und Verwaltung')).toBeTruthy());
}

beforeEach(async () => {
  jest.clearAllMocks();
  await seed();
});

afterEach(cleanup);

describe('Ansichts- und Verwaltungsblatt in der Kopfzeile', () => {
  it('Einstellungen erreichen', async () => {
    await oeffnen();

    expect(screen.getByLabelText('Proportionale Zeitachse')).toBeTruthy();
    expect(screen.getByLabelText('Beim Öffnen zum aktuellen Wochentag springen')).toBeTruthy();
    expect(screen.getByText('Stundenplan leeren')).toBeTruthy();
    expect(screen.getByText('Stundenplan zurücksetzen')).toBeTruthy();
    // Requirement „Dauerhafter Zugang zur Einrichtung": eigener, vom
    // Verwaltungsblatt getrennter Bedienweg (`EinrichtungHeaderZugang`) —
    // dieses Blatt führt ihn bewusst nicht.
    expect(screen.queryByText('Einrichtung bearbeiten')).toBeNull();
  });

  it('Sprung zu heute umschalten', async () => {
    await oeffnen();

    fireEvent(screen.getByLabelText('Beim Öffnen zum aktuellen Wochentag springen'), 'valueChange', false);
    await waitFor(async () => expect((await readAnsichtEinstellungen()).sprungZuHeute).toBe(false));
  });
});

describe('Nutzeraktion „Stundenplan leeren"', () => {
  it('Plan leeren, Einrichtung behalten', async () => {
    await oeffnen();
    fireEvent.press(screen.getByText('Stundenplan leeren'));
    fireEvent.press(screen.getByText('Leeren'));

    await waitFor(async () => expect(await readScheduleEntries()).toEqual([expect.objectContaining({ id: 'e' })]));
    expect((await readEinrichtung()).endpunkte).toEqual(['INPBPI']);
  });

  it('Eigene Termine behalten', async () => {
    await oeffnen();
    fireEvent.press(screen.getByText('Stundenplan leeren'));
    fireEvent.press(screen.getByText('Leeren'));

    const entries = await readScheduleEntries();
    expect(entries.some((e) => e.id === 'e')).toBe(true);
    expect(entries.some((e) => e.id === 'a')).toBe(false);
  });

  it('Eigene Termine mitentfernen', async () => {
    await oeffnen();
    fireEvent.press(screen.getByText('Stundenplan leeren'));
    fireEvent(screen.getByLabelText('Auch selbst angelegte Termine entfernen'), 'valueChange', true);
    fireEvent.press(screen.getByText('Leeren'));

    await waitFor(async () => expect(await readScheduleEntries()).toEqual([]));
  });
});

describe('Nutzeraktion „Stundenplan zurücksetzen"', () => {
  it('Zurücksetzen', async () => {
    await oeffnen();
    fireEvent.press(screen.getByText('Stundenplan zurücksetzen'));
    fireEvent(screen.getByLabelText('Auch selbst angelegte Termine entfernen'), 'valueChange', true);
    fireEvent.press(screen.getByText('Zurücksetzen'));

    await waitFor(async () => expect(await readScheduleEntries()).toEqual([]));
    expect((await readEinrichtung()).endpunkte).toEqual([]);
  });

  it('Andere Bereiche unberührt', async () => {
    await writeJson('canteenSelection', { mensaId: 'm1' });
    await oeffnen();
    fireEvent.press(screen.getByText('Stundenplan zurücksetzen'));
    fireEvent.press(screen.getByText('Zurücksetzen'));

    await waitFor(async () => expect((await readEinrichtung()).endpunkte).toEqual([]));
    expect(await AsyncStorage.getItem('fb4:canteenSelection')).not.toBeNull();
  });
});
