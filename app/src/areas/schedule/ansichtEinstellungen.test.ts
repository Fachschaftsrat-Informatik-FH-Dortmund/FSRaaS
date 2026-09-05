import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  __resetAnsichtEinstellungenForTest,
  readAnsichtEinstellungen,
  useAnsichtEinstellungen,
} from './ansichtEinstellungen';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetAnsichtEinstellungenForTest();
});

describe('SCHED-F-530 proportionale Zeitachse gegen kompakte Liste abschaltbar', () => {
  it('beginnt mit aktiver Zeitachse und lässt sich abschalten und wieder einschalten', async () => {
    const { result } = renderHook(() => useAnsichtEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.einstellungen.zeitachse).toBe(true);

    act(() => result.current.toggleZeitachse());
    await waitFor(() => expect(result.current.einstellungen.zeitachse).toBe(false));
    expect(await readAnsichtEinstellungen()).toMatchObject({ zeitachse: false });

    act(() => result.current.toggleZeitachse());
    await waitFor(() => expect(result.current.einstellungen.zeitachse).toBe(true));
  });
});

describe('SCHED-F-145 Schalter zum Ausblenden gruppenfremder Termine', () => {
  it('beginnt ausgeschaltet (gruppenfremde Termine bleiben sichtbar, SCHED-F-140) und lässt sich umschalten', async () => {
    const { result } = renderHook(() => useAnsichtEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.einstellungen.gruppenfremdeAusblenden).toBe(false);

    act(() => result.current.toggleGruppenfremdeAusblenden());
    await waitFor(() => expect(result.current.einstellungen.gruppenfremdeAusblenden).toBe(true));
  });
});

describe('SCHED-F-150 Sprung zum aktuellen Wochentag beim Öffnen', () => {
  it('beginnt aktiv und lässt sich abschalten, persistiert das', async () => {
    const { result } = renderHook(() => useAnsichtEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.einstellungen.sprungZuHeute).toBe(true);

    act(() => result.current.toggleSprungZuHeute());
    await waitFor(() => expect(result.current.einstellungen.sprungZuHeute).toBe(false));
    expect(await readAnsichtEinstellungen()).toMatchObject({ sprungZuHeute: false });
  });
});
