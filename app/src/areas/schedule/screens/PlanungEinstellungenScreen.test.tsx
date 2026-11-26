import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { ThemeProvider } from '@/theme';
import { __resetPlanungsEinstellungenForTest, readPlanungsEinstellungen, voreinstellungAus } from '../planungseinstellungen';
import { PlanungEinstellungenScreen } from './PlanungEinstellungenScreen';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams,
}));

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetPlanungsEinstellungenForTest();
  mockParams = {};
});

afterEach(cleanup);

async function renderScreen() {
  render(
    <ThemeProvider>
      <PlanungEinstellungenScreen />
    </ThemeProvider>,
  );
  await waitFor(() => expect(screen.getByText('Voreinstellung')).toBeTruthy());
}

describe('Kriterienrangfolge für die Planung', () => {
  it('Voreinstellung wählen: bietet die fünf Voreinstellungen samt Reihenfolge an und speichert die Wahl', async () => {
    await renderScreen();
    for (const name of [
      'Zeit an der Uni —',
      'Fahrten zur Uni —',
      'Ausgeglichene Woche —',
      'Abstand zwischen Lerneinheiten —',
      'Vorbereitungszeit —',
    ]) {
      expect(screen.getByLabelText(new RegExp(`^${name}`))).toBeTruthy();
    }
    expect(
      screen.getByLabelText('Fahrten zur Uni — wenigste Uni-Tage, dann kürzeste Anwesenheit').props.accessibilityState,
    ).toMatchObject({ selected: true });

    fireEvent.press(screen.getByLabelText(/^Ausgeglichene Woche/));
    await waitFor(async () => expect(voreinstellungAus(await readPlanungsEinstellungen())).toBe('ausgeglicheneWoche'));
  });

  it('Rangfolge selbst ändern: ein Kriterium lässt sich ohne Ziehen über eine Schaltfläche nach oben verschieben', async () => {
    const ansage = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
    await renderScreen();
    expect(screen.getByText('1. Uni-Tage')).toBeTruthy();
    expect(screen.getByText('2. Anwesenheitszeit')).toBeTruthy();
    // Am Rand ist die Schaltfläche sichtbar gesperrt.
    expect(screen.getByLabelText('Uni-Tage nach oben').props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.press(screen.getByLabelText('Anwesenheitszeit nach oben'));
    expect(screen.getByText('1. Anwesenheitszeit')).toBeTruthy();
    expect(screen.getByText('2. Uni-Tage')).toBeTruthy();
    expect(ansage).toHaveBeenCalledWith('Anwesenheitszeit steht jetzt an Stelle 1');
    // Keine Voreinstellung passt mehr: keine ist gewählt, ein Hinweis nennt die eigene Rangfolge.
    expect(
      screen.getByLabelText('Fahrten zur Uni — wenigste Uni-Tage, dann kürzeste Anwesenheit').props.accessibilityState,
    ).toMatchObject({ selected: false });
    expect(screen.getByText(/eigene Rangfolge eingestellt/)).toBeTruthy();
    await waitFor(async () =>
      expect((await readPlanungsEinstellungen()).rangfolge).toEqual(['anwesenheitszeit', 'uniTage']),
    );
    ansage.mockRestore();
  });

  it('Rangfolge selbst ändern: ein Kriterium lässt sich abschalten und wieder einschalten, es kommt dann ans Ende', async () => {
    await renderScreen();
    fireEvent.press(screen.getByLabelText('Uni-Tage, Stelle 1, verwenden'));
    expect(screen.getByText('1. Anwesenheitszeit')).toBeTruthy();
    expect(screen.getByLabelText('Uni-Tage verwenden').props.accessibilityState).toMatchObject({ checked: false });

    fireEvent.press(screen.getByLabelText('Abwechslung verwenden'));
    expect(screen.getByText('2. Abwechslung')).toBeTruthy();
    await waitFor(async () =>
      expect((await readPlanungsEinstellungen()).rangfolge).toEqual(['anwesenheitszeit', 'abwechslung']),
    );
  });

  it('weist darauf hin, wenn alle Kriterien abgeschaltet sind', async () => {
    await renderScreen();
    fireEvent.press(screen.getByLabelText('Uni-Tage, Stelle 1, verwenden'));
    fireEvent.press(screen.getByLabelText('Anwesenheitszeit, Stelle 1, verwenden'));
    expect(screen.getByText(/Alle Kriterien sind abgeschaltet/)).toBeTruthy();
  });
});

describe('Bevorzugtes Zeitfenster festlegen', () => {
  it('Zeitfenster festlegen: früheste Beginnzeit und späteste Endzeit lassen sich einstellen', async () => {
    await renderScreen();
    fireEvent.press(screen.getByLabelText('Zeitfenster festlegen'));
    expect(screen.getByText('08:00')).toBeTruthy();
    expect(screen.getByText('18:00')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Früheste Beginnzeit erhöhen'));
    fireEvent.press(screen.getByLabelText('Späteste Endzeit verringern'));
    expect(screen.getByText('08:30')).toBeTruthy();
    expect(screen.getByText('17:30')).toBeTruthy();
    // Das Kriterium ist abgeschaltet: das Fenster wirkt nur als Kennzeichnung.
    expect(screen.getByText(/werden nur gekennzeichnet/)).toBeTruthy();
    await waitFor(async () =>
      expect((await readPlanungsEinstellungen()).zeitfenster).toEqual({ vonMin: 510, bisMin: 1050 }),
    );
  });
});

describe('Kandidat als Pflicht markieren', () => {
  it('Kandidat als Pflicht markieren: die Kandidaten der laufenden Planung lassen sich als Pflicht markieren', async () => {
    mockParams = { kandidaten: JSON.stringify([['M1|2', 'Mathematik'], ['M2|2', 'Informatik']]) };
    await renderScreen();
    expect(screen.getByText('Pflicht-Veranstaltungen')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Informatik ist Pflicht'));
    expect(screen.getByLabelText('Informatik ist Pflicht').props.accessibilityState).toMatchObject({ checked: true });
    await waitFor(async () => expect((await readPlanungsEinstellungen()).pflichtModule).toEqual(['M2|2']));
  });

  it('ohne Kandidaten entfällt der Abschnitt, ein unlesbarer Parameter wird protokolliert', async () => {
    mockParams = { kandidaten: 'kein json' };
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await renderScreen();
    expect(screen.queryByText('Pflicht-Veranstaltungen')).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('Vorbereitungszeit je Veranstaltungsart', () => {
  it('Abweichender Wert für eine Veranstaltungsart: Praktikum bekommt einen eigenen Wert, die übrigen bleiben beim allgemeinen', async () => {
    await renderScreen();
    expect(screen.getAllByText('wie allgemein (30 Minuten)').length).toBe(8);

    fireEvent.press(screen.getByLabelText('Eigener Wert für Praktikum (P)'));
    fireEvent.press(screen.getByLabelText('Praktikum (P) erhöhen'));
    expect(screen.getByText('45 Minuten')).toBeTruthy();
    expect(screen.getAllByText('wie allgemein (30 Minuten)').length).toBe(7);

    await waitFor(async () => expect((await readPlanungsEinstellungen()).vorbereitungJeArt).toEqual({ P: 45 }));
  });

  it('der allgemeine Wert lässt sich nicht unter null senken', async () => {
    await renderScreen();
    fireEvent.press(screen.getByLabelText('Allgemein verringern'));
    fireEvent.press(screen.getByLabelText('Allgemein verringern'));
    expect(screen.getByLabelText('Allgemein verringern').props.accessibilityState).toMatchObject({ disabled: true });
    await waitFor(async () => expect((await readPlanungsEinstellungen()).vorbereitungAllgemeinMin).toBe(0));
  });

  it('stellt den Mindestabstand Vorlesung–Übung in Stunden ein', async () => {
    await renderScreen();
    expect(screen.getByText('direkt danach')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Abstand Vorlesung–Übung erhöhen'));
    expect(screen.getByText('1 Stunde')).toBeTruthy();
  });
});
