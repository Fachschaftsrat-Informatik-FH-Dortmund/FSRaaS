import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { __resetPlanungsEinstellungenForTest, readPlanungsEinstellungen } from '../planungseinstellungen';
import { PlanungEinstellungenScreen } from './PlanungEinstellungenScreen';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetPlanungsEinstellungenForTest();
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
      'Zeit an der Uni',
      'Fahrten zur Uni',
      'Ausgeglichene Woche',
      'Abstand zwischen Lerneinheiten',
      'Vorbereitungszeit —',
    ]) {
      expect(screen.getByLabelText(new RegExp(`^${name}`))).toBeTruthy();
    }
    expect(
      screen.getByLabelText('Fahrten zur Uni — wenigste Uni-Tage, dann kürzeste Anwesenheit').props.accessibilityState,
    ).toMatchObject({ selected: true });

    fireEvent.press(screen.getByLabelText(/^Ausgeglichene Woche/));
    await waitFor(async () => expect((await readPlanungsEinstellungen()).voreinstellung).toBe('ausgeglicheneWoche'));
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
