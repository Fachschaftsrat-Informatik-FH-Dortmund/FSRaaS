import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { writeJson } from '@/storage/kv';
import { ThemeProvider } from '@/theme';
import { kontrastZuHintergrund, textfarbeFuerHintergrund } from '../farbe';
import { __resetScheduleEntriesForTest, readScheduleEntries } from '../planStore';
import type { CustomPlanEntry, OfficialPlanEntry, PlanEntry } from '../typen';
import { TerminDetailScreen } from './TerminDetailScreen';
import RouteDetail from '../../../../app/(tabs)/(schedule)/detail';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

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
    studentSet: 'C-D',
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

async function seed(entries: PlanEntry[], id: string) {
  await AsyncStorage.clear();
  await writeJson('scheduleEntries', entries);
  __resetScheduleEntriesForTest();
  mockParams = { id };
}

async function zeige() {
  render(
    <ThemeProvider>
      <TerminDetailScreen />
    </ThemeProvider>,
  );
  await waitFor(() => expect(screen.queryByText('Wird geladen …')).toBeNull());
}

beforeEach(() => jest.clearAllMocks());
afterEach(cleanup);

describe('Anzeige der Termindetails', () => {
  it('zeigt zu einem offiziellen Termin Art, Zeitraum, Bezeichnung, Gruppe, lehrende Person und Raum', async () => {
    await seed([offiziell({ id: 'analysis' })], 'analysis');
    await zeige();

    expect(screen.getByText('Veranstaltungsart')).toBeTruthy();
    expect(screen.getByText('V')).toBeTruthy();
    expect(screen.getAllByText('Analysis').length).toBeGreaterThan(0);
    expect(screen.getByText('C-D')).toBeTruthy();
    expect(screen.getByText('Prof. Beispiel')).toBeTruthy();
    expect(screen.getByText('A.2.02')).toBeTruthy();
    expect(screen.getAllByText('Mi 08:00–09:30').length).toBeGreaterThan(0);
  });

  it('zeigt zu einem eigenen Termin dessen Angaben samt Herkunft und Wiederholung', async () => {
    await seed([eigen({ id: 'lern', roomId: 'B.114', lecturerName: 'Wir selbst' })], 'lern');
    await zeige();

    expect(screen.getAllByText('Lerngruppe').length).toBeGreaterThan(0);
    expect(screen.getByText('Eigener Termin')).toBeTruthy();
    expect(screen.getByText('B.114')).toBeTruthy();
    expect(screen.getByText('Wir selbst')).toBeTruthy();
    expect(screen.getByText('Wöchentlich wiederkehrend')).toBeTruthy();
  });
});

describe('Farbwahl je Termin', () => {
  it('übernimmt die gewählte Farbe abweichend von der automatischen Zuweisung', async () => {
    await seed([eigen({ id: 'lern' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByLabelText('Farbe #8E24AA wählen'));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert[0]!.color).toBe('#8E24AA');
    });
  });

  it('beschriftet den Termin mit ausreichendem Kontrast zur gewählten Farbe', async () => {
    await seed([eigen({ id: 'lern', color: '#FB8C00' })], 'lern');
    await zeige();

    const textfarbe = textfarbeFuerHintergrund('#FB8C00');
    expect(kontrastZuHintergrund(textfarbe, '#FB8C00')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Deaktivieren eines Termins', () => {
  it('deaktiviert einen Termin dauerhaft über den sichtbaren Bedienweg', async () => {
    await seed([eigen({ id: 'lern' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByText('Dauerhaft deaktivieren'));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert[0]!.deaktiviertBis).toBe('dauerhaft');
    });
  });

  it('deaktiviert einen Termin nur für das nächste Vorkommen', async () => {
    await seed([eigen({ id: 'lern' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByText('Nur dieses Vorkommen deaktivieren'));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(typeof gespeichert[0]!.deaktiviertBis).toBe('number');
    });
  });

  it('nimmt eine Deaktivierung verlustfrei zurück', async () => {
    await seed([eigen({ id: 'lern', deaktiviertBis: 'dauerhaft' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByText('Deaktivierung zurücknehmen'));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert[0]!.deaktiviertBis).toBeNull();
    });
  });
});

describe('Bearbeiten und Löschen eigener Termine über sichtbaren Weg', () => {
  it('bietet zu einem eigenen Termin einen sichtbaren Weg zum Bearbeiten', async () => {
    await seed([eigen({ id: 'lern' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByLabelText('Termin bearbeiten'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/termin', params: { id: 'lern' } });
  });

  it('löscht erst nach einer Rückfrage und kehrt danach zurück', async () => {
    await seed([eigen({ id: 'lern' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByLabelText('Termin löschen'));
    expect(screen.getByText('Diesen Termin wirklich aus deinem Plan löschen?')).toBeTruthy();
    expect(await readScheduleEntries()).toHaveLength(1);

    fireEvent.press(screen.getByLabelText('Endgültig löschen'));

    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(0));
    expect(mockBack).toHaveBeenCalled();
  });

  it('nimmt die Rückfrage zurück, ohne zu löschen', async () => {
    await seed([eigen({ id: 'lern' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByLabelText('Termin löschen'));
    fireEvent.press(screen.getByLabelText('Abbrechen'));

    await waitFor(() =>
      expect(screen.queryByText('Diesen Termin wirklich aus deinem Plan löschen?')).toBeNull(),
    );
    expect(await readScheduleEntries()).toHaveLength(1);
  });
});

describe('Bewusste Übernahme trotz Konflikt', () => {
  it('nimmt eine Überschneidung über den Bedienweg an und kennzeichnet danach beide Termine', async () => {
    await seed(
      [
        eigen({ id: 'a', title: 'Lerngruppe', timeBeginMin: 480, timeEndMin: 600 }),
        eigen({ id: 'b', title: 'Sport', timeBeginMin: 540, timeEndMin: 660 }),
      ],
      'a',
    );
    await zeige();

    expect(screen.getByText('Überschneidung mit Sport')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Konflikt annehmen'));

    await waitFor(() => expect(screen.getByText('Angenommene Überschneidung mit Sport')).toBeTruthy());
    const gespeichert = await readScheduleEntries();
    expect(gespeichert.map((e) => e.akzeptierteKonflikte)).toEqual([['b'], ['a']]);
  });
});

describe('Routendatei der Termindetails', () => {
  it('ist ein reines Re-Export des Bildschirms (SHELL-F-050)', () => {
    expect(RouteDetail).toBe(TerminDetailScreen);
  });
});
