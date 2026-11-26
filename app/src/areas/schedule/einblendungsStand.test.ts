import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { __resetEinblendungsStandForTest, useEinblendungsStand } from './einblendungsStand';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetEinblendungsStandForTest();
});

describe('Einblendung nur für die laufende Sitzung', () => {
  it('beginnt mit beiden Schaltern abgeschaltet', () => {
    const { result } = renderHook(() => useEinblendungsStand());
    expect(result.current.stand).toEqual({ alternativen: false, alle: false });
    expect(result.current.aktiv).toBe(false);
  });

  it('App-Start nach eingeschalteter Einblendung: schreibt nichts in den Gerätespeicher und beginnt danach wieder aus', async () => {
    const { result } = renderHook(() => useEinblendungsStand());
    act(() => result.current.toggleAlternativen());
    act(() => result.current.toggleAlle());
    expect(result.current.stand).toEqual({ alternativen: true, alle: true });

    expect(await AsyncStorage.getAllKeys()).toEqual([]);

    // Ein App-Start setzt den Modulzustand zurück; aus dem Speicher kommt nichts.
    __resetEinblendungsStandForTest();
    const neu = renderHook(() => useEinblendungsStand());
    expect(neu.result.current.stand).toEqual({ alternativen: false, alle: false });
  });

  it('Ansichtswechsel während der Sitzung: der Stand bleibt über neue Ansichten hinweg erhalten', () => {
    const erste = renderHook(() => useEinblendungsStand());
    act(() => erste.result.current.toggleAlternativen());
    erste.unmount();

    const zweite = renderHook(() => useEinblendungsStand());
    expect(zweite.result.current.stand.alternativen).toBe(true);
    expect(zweite.result.current.aktiv).toBe(true);
  });

  it('schaltet über „alle abschalten" beide Einblendungen zugleich ab', () => {
    const { result } = renderHook(() => useEinblendungsStand());
    act(() => result.current.toggleAlternativen());
    act(() => result.current.toggleAlle());

    act(() => result.current.alleAbschalten());
    expect(result.current.stand).toEqual({ alternativen: false, alle: false });
  });
});
