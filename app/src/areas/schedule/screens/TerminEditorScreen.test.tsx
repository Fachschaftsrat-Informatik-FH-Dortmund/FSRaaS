import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { writeJson } from '@/storage/kv';
import { ThemeProvider } from '@/theme';
import { __resetScheduleEntriesForTest, readScheduleEntries } from '../planStore';
import type { CustomPlanEntry, PlanEntry } from '../typen';
import { TerminEditorScreen } from './TerminEditorScreen';
import RouteTermin from '../../../../app/(tabs)/(schedule)/termin';

const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

function eigen(over: Partial<CustomPlanEntry> & { id: string }): CustomPlanEntry {
  return {
    kind: 'eigen',
    status: 'fest',
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

async function seed(entries: PlanEntry[], params: Record<string, string> = {}) {
  await AsyncStorage.clear();
  await writeJson('scheduleEntries', entries);
  __resetScheduleEntriesForTest();
  mockParams = params;
}

async function zeige() {
  render(
    <ThemeProvider>
      <TerminEditorScreen />
    </ThemeProvider>,
  );
  await waitFor(() => expect(screen.queryByText('Wird geladen …')).toBeNull());
}

function fuelle(felder: Record<string, string>) {
  for (const [label, wert] of Object.entries(felder)) {
    fireEvent.changeText(screen.getByLabelText(label), wert);
  }
}

/** Öffnet die Zeit-/Datumsauswahl über das zugehörige Anzeigefeld und löst die Wahl über den nativen Picker-Ersatz aus (`jest.setup.js`). */
function waehleZeit(label: string, testId: string, stunden: number, minuten: number) {
  fireEvent.press(screen.getByLabelText(label));
  const datum = new Date(2000, 0, 1, stunden, minuten);
  fireEvent(screen.getByTestId(testId), 'change', { type: 'set' }, datum);
}

function waehleDatum(jahr: number, monat: number, tag: number) {
  fireEvent.press(screen.getByLabelText('Datum'));
  fireEvent(screen.getByTestId('datum-picker'), 'change', { type: 'set' }, new Date(jahr, monat - 1, tag));
}

beforeEach(() => jest.clearAllMocks());
afterEach(cleanup);

describe('Anlegen eigener Termine', () => {
  it('legt einen Termin mit Titel, Wochentag, Beginn- und Endzeit im Plan an', async () => {
    await seed([]);
    await zeige();

    fuelle({ Titel: 'Lerngruppe' });
    fireEvent(screen.getByTestId('wochentag-picker'), 'valueChange', 'Thu');
    waehleZeit('Beginn', 'beginn-picker', 14, 0);
    waehleZeit('Ende', 'ende-picker', 15, 30);
    fireEvent.press(screen.getByLabelText('Termin anlegen'));

    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(1));
    const [eintrag] = (await readScheduleEntries()) as CustomPlanEntry[];
    expect(eintrag).toMatchObject({
      kind: 'eigen',
      title: 'Lerngruppe',
      weekday: 'Thu',
      timeBeginMin: 840,
      timeEndMin: 930,
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('schreibt nichts und benennt den Fehler, wenn Pflichtangaben fehlen', async () => {
    await seed([]);
    await zeige();

    fireEvent.press(screen.getByLabelText('Termin anlegen'));
    expect(screen.getByText('Bitte gib einen Titel an.')).toBeTruthy();

    fuelle({ Titel: 'Lerngruppe' });
    waehleZeit('Beginn', 'beginn-picker', 15, 0);
    waehleZeit('Ende', 'ende-picker', 14, 0);
    fireEvent.press(screen.getByLabelText('Termin anlegen'));
    expect(screen.getByText('Das Ende muss nach dem Beginn liegen.')).toBeTruthy();

    expect(await readScheduleEntries()).toHaveLength(0);
    expect(mockBack).not.toHaveBeenCalled();
  });
});

describe('Zusatzangaben beim Anlegen eigener Termine', () => {
  it('speichert Raum und lehrende Person am Termin', async () => {
    await seed([]);
    await zeige();

    fuelle({
      Titel: 'Lerngruppe',
      'Raum (optional)': 'B.114',
      'Lehrende Person (optional)': 'Tutorin',
    });
    fireEvent.press(screen.getByLabelText('Termin anlegen'));

    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(1));
    const [eintrag] = (await readScheduleEntries()) as CustomPlanEntry[];
    expect(eintrag).toMatchObject({ roomId: 'B.114', lecturerName: 'Tutorin' });
  });
});

describe('Wiederkehrend oder einmalig bei eigenen Terminen', () => {
  it('legt einen wöchentlich wiederkehrenden Eintrag ohne Gültigkeitsgrenzen an', async () => {
    await seed([]);
    await zeige();

    fuelle({ Titel: 'Lerngruppe' });
    fireEvent.press(screen.getByLabelText('Termin anlegen'));

    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(1));
    const [eintrag] = (await readScheduleEntries()) as CustomPlanEntry[];
    expect(eintrag).toMatchObject({ wiederkehrend: true, gueltigVon: null, gueltigBis: null });
  });

  it('legt einen einmaligen Eintrag mit Gültigkeitsgrenzen auf demselben Datum an', async () => {
    await seed([]);
    await zeige();

    fuelle({ Titel: 'Klausur' });
    fireEvent(screen.getByLabelText('Wöchentlich wiederkehrend'), 'valueChange', false);
    waehleDatum(2026, 11, 24);
    fireEvent.press(screen.getByLabelText('Termin anlegen'));

    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(1));
    const [eintrag] = (await readScheduleEntries()) as CustomPlanEntry[];
    const erwartet = Math.floor(new Date(2026, 10, 24, 12, 0, 0).getTime() / 1000);
    expect(eintrag).toMatchObject({ wiederkehrend: false, gueltigVon: erwartet, gueltigBis: erwartet });
  });
});

describe('Eigenen Termin als Prüfung kennzeichnen', () => {
  it('führt einen als Prüfung markierten Termin als Prüfung', async () => {
    await seed([]);
    await zeige();

    fuelle({ Titel: 'Klausur Analysis' });
    fireEvent(screen.getByLabelText('Dieser Termin ist eine Prüfung'), 'valueChange', true);
    fireEvent.press(screen.getByLabelText('Termin anlegen'));

    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(1));
    expect((await readScheduleEntries())[0]!.istPruefung).toBe(true);
  });
});

describe('Bearbeiten und Löschen eigener Termine über sichtbaren Weg', () => {
  it('bearbeitet einen bestehenden Termin im selben Bildschirm', async () => {
    await seed([eigen({ id: 'lern' })], { id: 'lern' });
    await zeige();

    expect(screen.getByLabelText('Titel').props.value).toBe('Lerngruppe');
    fuelle({ Titel: 'Lerngruppe neu' });
    waehleZeit('Ende', 'ende-picker', 15, 0);
    fireEvent.press(screen.getByLabelText('Änderungen speichern'));

    await waitFor(async () => {
      const gespeichert = (await readScheduleEntries()) as CustomPlanEntry[];
      expect(gespeichert).toHaveLength(1);
      expect(gespeichert[0]!.title).toBe('Lerngruppe neu');
      expect(gespeichert[0]!.timeEndMin).toBe(900);
    });
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('Erfassung von Uhrzeit und Datum über systemeigene Auswahl', () => {
  it('erfasst die Beginnzeit über die systemeigene Zeitauswahl, sodass eine unzulässige Uhrzeit nicht entstehen kann', async () => {
    await seed([]);
    await zeige();

    // Vor dem Antippen ist die Auswahl geschlossen — kein Freitextfeld mehr.
    expect(screen.queryByTestId('beginn-picker')).toBeNull();

    fuelle({ Titel: 'Lerngruppe' });
    waehleZeit('Beginn', 'beginn-picker', 9, 15);
    fireEvent.press(screen.getByLabelText('Termin anlegen'));

    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(1));
    const [eintrag] = (await readScheduleEntries()) as CustomPlanEntry[];
    expect(eintrag!.timeBeginMin).toBe(9 * 60 + 15);
  });

  it('erfasst das Datum eines einmaligen Termins über die systemeigene Datumsauswahl', async () => {
    await seed([]);
    await zeige();

    fuelle({ Titel: 'Klausur' });
    fireEvent(screen.getByLabelText('Wöchentlich wiederkehrend'), 'valueChange', false);
    expect(screen.queryByTestId('datum-picker')).toBeNull();

    waehleDatum(2027, 2, 3);
    fireEvent.press(screen.getByLabelText('Termin anlegen'));

    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(1));
    const [eintrag] = (await readScheduleEntries()) as CustomPlanEntry[];
    const erwartet = Math.floor(new Date(2027, 1, 3, 12, 0, 0).getTime() / 1000);
    expect(eintrag!.gueltigVon).toBe(erwartet);
  });
});

describe('Routendatei des Termin-Editors', () => {
  it('ist ein reines Re-Export des Bildschirms (SHELL-F-050)', () => {
    expect(RouteTermin).toBe(TerminEditorScreen);
  });
});
