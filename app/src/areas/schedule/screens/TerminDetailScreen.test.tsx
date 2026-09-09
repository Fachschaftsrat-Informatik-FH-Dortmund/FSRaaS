import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { writeJson } from '@/storage/kv';
import { ThemeProvider } from '@/theme';
import type { Modul } from '../kursbaum';
import { farbeFuerVeranstaltung, kontrastZuHintergrund, textfarbeFuerHintergrund } from '../farbe';
import { __resetScheduleEntriesForTest, readScheduleEntries } from '../planStore';
import { ermittlePlanungsstand } from '../planungsstand';
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

// Requirement „Farbwahl je Termin", Szenario „Geltungsbereich erfragen": wie
// in `PlanungScreen.test.tsx` wird `usePreventRemove` durch einen Ersatz
// ausgetauscht, der den Callback festhält, statt einen echten
// Navigationskontext vorauszusetzen.
const mockDispatch = jest.fn();
let letztePreventRemove: { verhindern: boolean; callback: (e: { data: { action: unknown } }) => void } | null = null;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ dispatch: mockDispatch }),
  usePreventRemove: (verhindern: boolean, callback: (e: { data: { action: unknown } }) => void) => {
    letztePreventRemove = { verhindern, callback };
  },
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

beforeEach(() => {
  jest.clearAllMocks();
  letztePreventRemove = null;
});
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
  it('Farbe ändern: übernimmt die gewählte Farbe abweichend von der automatischen Zuweisung', async () => {
    await seed([eigen({ id: 'lern' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByLabelText('Farbe #8E24AA wählen'));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert[0]!.color).toBe('#8E24AA');
    });
    // Ein eigener Termin kennt kein Modul — keine Rückfrage beim Verlassen.
    expect(letztePreventRemove!.verhindern).toBe(false);
  });

  it('beschriftet den Termin mit ausreichendem Kontrast zur gewählten Farbe', async () => {
    await seed([eigen({ id: 'lern', color: '#FB8C00' })], 'lern');
    await zeige();

    const textfarbe = textfarbeFuerHintergrund('#FB8C00');
    expect(kontrastZuHintergrund(textfarbe, '#FB8C00')).toBeGreaterThanOrEqual(4.5);
  });

  it('Geltungsbereich erfragen: fragt vor dem Verlassen nach Modul oder Einzeltermin und wendet die Wahl an', async () => {
    await seed(
      [
        offiziell({ id: 'v', courseId: 'INF999', name: 'Mathematik 3', courseType: 'V' }),
        offiziell({
          id: 'ue',
          courseId: 'INF999',
          name: 'Mathematik 3',
          courseType: 'Ü',
          weekday: 'Tue',
          color: '#43A047',
        }),
      ],
      'v',
    );
    await zeige();

    fireEvent.press(screen.getByLabelText('Farbe #8E24AA wählen'));
    expect(letztePreventRemove!.verhindern).toBe(true);

    act(() => letztePreventRemove!.callback({ data: { action: { type: 'POP' } } }));
    expect(
      screen.getByText(
        'Soll die neue Farbe für alle Veranstaltungen dieses Moduls gelten oder nur für diesen Termin?',
      ),
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Für alle Veranstaltungen des Moduls'));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert.every((e) => e.color === '#8E24AA')).toBe(true);
    });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'POP' });
  });

  it('Geltungsbereich erfragen: „Nur für diesen Termin" lässt die übrigen Veranstaltungen des Moduls unverändert', async () => {
    await seed(
      [
        offiziell({ id: 'v', courseId: 'INF999', name: 'Mathematik 3', courseType: 'V' }),
        offiziell({
          id: 'ue',
          courseId: 'INF999',
          name: 'Mathematik 3',
          courseType: 'Ü',
          weekday: 'Tue',
          color: '#43A047',
        }),
      ],
      'v',
    );
    await zeige();

    fireEvent.press(screen.getByLabelText('Farbe #8E24AA wählen'));
    act(() => letztePreventRemove!.callback({ data: { action: { type: 'POP' } } }));
    fireEvent.press(screen.getByText('Nur für diesen Termin'));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert.find((e) => e.id === 'v')!.color).toBe('#8E24AA');
      expect(gespeichert.find((e) => e.id === 'ue')!.color).toBe('#43A047');
    });
  });

  it('Zurück zur Automatik: „keine Farbe" setzt wieder die automatisch vergebene Farbe', async () => {
    await seed([eigen({ id: 'lern', title: 'Lerngruppe', color: '#FB8C00' })], 'lern');
    await zeige();

    fireEvent.press(screen.getByLabelText('Keine Farbe (automatische Zuweisung)'));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert[0]!.color).toBe(farbeFuerVeranstaltung('Lerngruppe'));
    });
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

describe('Gültigkeitszeitraum je Eintrag änderbar', () => {
  function waehleDatum(testId: string, jahr: number, monat: number, tag: number) {
    fireEvent(screen.getByTestId(testId), 'change', { type: 'set' }, new Date(jahr, monat - 1, tag));
  }

  it('Zeitraum eines offiziellen Termins einschränken: gilt danach nur innerhalb dieses Zeitraums', async () => {
    await seed([offiziell({ id: 'analysis' })], 'analysis');
    await zeige();

    fireEvent.press(screen.getByLabelText('Gültig ab'));
    waehleDatum('gueltig-von-picker', 2026, 10, 1);
    fireEvent.press(screen.getByLabelText('Gültig bis'));
    waehleDatum('gueltig-bis-picker', 2026, 12, 20);

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert[0]!.gueltigVon).not.toBeNull();
      expect(gespeichert[0]!.gueltigBis).not.toBeNull();
    });
  });

  it('Offenes Ende: ein gesetzter Beginn ohne Ende gilt ab dem Beginn ohne Enddatum', async () => {
    await seed([offiziell({ id: 'analysis' })], 'analysis');
    await zeige();

    fireEvent.press(screen.getByLabelText('Gültig ab'));
    waehleDatum('gueltig-von-picker', 2026, 10, 1);

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert[0]!.gueltigVon).not.toBeNull();
      expect(gespeichert[0]!.gueltigBis).toBeNull();
    });
  });

  it('Ende vor Beginn: weist die Eingabe zurück und behält den bisherigen Zeitraum', async () => {
    const von = Math.floor(new Date(2026, 9, 1, 12, 0, 0).getTime() / 1000);
    const bis = Math.floor(new Date(2026, 11, 20, 12, 0, 0).getTime() / 1000);
    await seed([offiziell({ id: 'analysis', gueltigVon: von, gueltigBis: bis })], 'analysis');
    await zeige();

    fireEvent.press(screen.getByLabelText('Gültig ab'));
    waehleDatum('gueltig-von-picker', 2027, 1, 1); // liegt nach dem gesetzten Ende

    expect(screen.getByText('Das Ende darf nicht vor dem Beginn liegen.')).toBeTruthy();
    const gespeichert = await readScheduleEntries();
    expect(gespeichert[0]!.gueltigVon).toBe(von);
    expect(gespeichert[0]!.gueltigBis).toBe(bis);
  });

  it('Eigener Termin auf einen Tag begrenzt: führt ihn als einmalig', async () => {
    await seed([eigen({ id: 'lern', wiederkehrend: true, gueltigVon: null, gueltigBis: null })], 'lern');
    await zeige();

    fireEvent.press(screen.getByLabelText('Gültig ab'));
    waehleDatum('gueltig-von-picker', 2026, 10, 5);
    fireEvent.press(screen.getByLabelText('Gültig bis'));
    waehleDatum('gueltig-bis-picker', 2026, 10, 5);

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect(gespeichert[0]!.gueltigVon).toBe(gespeichert[0]!.gueltigBis);
      expect((gespeichert[0] as CustomPlanEntry).wiederkehrend).toBe(false);
    });
  });
});

describe('Wiederkehrend aus dem Zeitraum ableiten', () => {
  it('führt einen eigenen Termin über mehrere Tage weiterhin als wiederkehrend', async () => {
    await seed([eigen({ id: 'lern', wiederkehrend: false, gueltigVon: 1000, gueltigBis: 1000 })], 'lern');
    await zeige();

    fireEvent.press(screen.getByLabelText('Gültig bis'));
    fireEvent(screen.getByTestId('gueltig-bis-picker'), 'change', { type: 'set' }, new Date(2026, 9, 20));

    await waitFor(async () => {
      const gespeichert = await readScheduleEntries();
      expect((gespeichert[0] as CustomPlanEntry).wiederkehrend).toBe(true);
    });
  });
});

describe('Unterscheidung von Entfernen und Löschen im Termindetail', () => {
  it('Offiziellen Termin aus dem Plan nehmen: ohne Bestätigung, nicht zerstörend gestaltet', async () => {
    await seed([offiziell({ id: 'analysis' })], 'analysis');
    await zeige();

    expect(screen.queryByLabelText('Termin löschen')).toBeNull();
    fireEvent.press(screen.getByLabelText('Aus meinem Plan nehmen'));

    expect(screen.queryByText('Diesen Termin wirklich aus deinem Plan löschen?')).toBeNull();
    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(0));
    expect(mockBack).toHaveBeenCalled();
  });

  it('Eigenen Termin löschen: zerstörend gestaltet, mit Bestätigung', async () => {
    await seed([eigen({ id: 'lern' })], 'lern');
    await zeige();

    expect(screen.queryByLabelText('Aus meinem Plan nehmen')).toBeNull();
    fireEvent.press(screen.getByLabelText('Termin löschen'));
    expect(screen.getByText('Diesen Termin wirklich aus deinem Plan löschen?')).toBeTruthy();
    expect(await readScheduleEntries()).toHaveLength(1);

    fireEvent.press(screen.getByLabelText('Endgültig löschen'));
    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(0));
  });

  it('Entfernter offizieller Termin bleibt auffindbar: Planungsmodus führt seine Veranstaltungsart als nicht eingeplant', async () => {
    const slot = {
      courseId: 'INF999',
      name: 'Mathematik für Informatik 3',
      courseType: 'V' as const,
      lecturerName: 'Prof. Beispiel',
      studentSet: '*',
      roomId: 'A.1.01',
      weekday: 'Mon' as const,
      timeBeginMin: 480,
      timeEndMin: 570,
      gueltigVon: null,
      gueltigBis: null,
    };
    const modul: Modul = { key: 'INF999|', courseId: 'INF999', name: slot.name, termine: [slot] };
    const eintrag = offiziell({
      id: 'mathe3-v',
      courseId: slot.courseId,
      name: slot.name,
      courseType: slot.courseType,
      studentSet: slot.studentSet,
      roomId: slot.roomId,
      weekday: slot.weekday,
      timeBeginMin: slot.timeBeginMin,
      timeEndMin: slot.timeEndMin,
    });

    // Vor dem Entfernen: die Veranstaltungsart gilt als gewählt.
    expect(ermittlePlanungsstand([modul], [eintrag])[0]!.stand).toBe('gewaehlt');

    await seed([eintrag], 'mathe3-v');
    await zeige();
    fireEvent.press(screen.getByLabelText('Aus meinem Plan nehmen'));
    await waitFor(async () => expect(await readScheduleEntries()).toHaveLength(0));

    // Danach: kein Planeintrag mehr trägt den Slot — die Veranstaltungsart
    // ist wieder als „nicht eingeplant" auffindbar (`planungZeileNichtEingeplant`).
    const nachher = await readScheduleEntries();
    expect(ermittlePlanungsstand([modul], nachher)[0]!.stand).not.toBe('gewaehlt');
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
