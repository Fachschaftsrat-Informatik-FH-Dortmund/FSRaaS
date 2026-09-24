import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { __resetDietPreferenceForTest, readDietPreference, useDietPreference } from './dietPreference';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetDietPreferenceForTest();
});

describe('MENSA-F-250 / F-260 Lebensstil-Vorgabe und Ausschluss', () => {
  it('nimmt Kennzeichnungen auf, hält Vorgabe und Ausschluss getrennt und persistiert', async () => {
    const { result } = renderHook(() => useDietPreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggleNurZeigen('vegan'));
    act(() => result.current.toggleAusschluss('schwein'));
    await waitFor(() => expect(result.current.prefs.nurZeigen).toEqual(['vegan']));
    expect(result.current.prefs.ausschluss).toEqual(['schwein']);
    expect(await readDietPreference()).toEqual({
      nurZeigen: ['vegan'],
      ausschluss: ['schwein'],
      co2Ausschluss: [],
    });
  });

  it('verschiebt eine Kennzeichnung von der Vorgabe in den Ausschluss statt sie doppelt zu führen', async () => {
    const { result } = renderHook(() => useDietPreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggleNurZeigen('vegan'));
    act(() => result.current.toggleAusschluss('vegan'));
    await waitFor(() => expect(result.current.prefs.ausschluss).toEqual(['vegan']));
    expect(result.current.prefs.nurZeigen).toEqual([]);

    act(() => result.current.clear());
    await waitFor(() =>
      expect(result.current.prefs).toEqual({ nurZeigen: [], ausschluss: [], co2Ausschluss: [] }),
    );
  });
});

describe('Ausschluss nach Kennzeichnung — CO₂-Klassen', () => {
  it('nimmt CO₂-Klassen als eigene Ausschlussliste auf und persistiert sie', async () => {
    const { result } = renderHook(() => useDietPreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggleCo2Ausschluss('E'));
    await waitFor(() => expect(result.current.prefs.co2Ausschluss).toEqual(['E']));
    expect((await readDietPreference()).co2Ausschluss).toEqual(['E']);

    act(() => result.current.toggleCo2Ausschluss('E'));
    await waitFor(() => expect(result.current.prefs.co2Ausschluss).toEqual([]));
  });

  it('lässt Lebensstil-Vorgabe und Kennzeichnungs-Ausschluss unberührt', async () => {
    const { result } = renderHook(() => useDietPreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggleNurZeigen('vegan'));
    act(() => result.current.toggleCo2Ausschluss('E'));
    await waitFor(() => expect(result.current.prefs.co2Ausschluss).toEqual(['E']));
    expect(result.current.prefs.nurZeigen).toEqual(['vegan']);
  });

  it('übernimmt einen vor der Aufnahme der CO₂-Klassen gespeicherten Stand unverändert', async () => {
    await AsyncStorage.setItem(
      'fb4:dishDietPreference',
      JSON.stringify({ nurZeigen: ['vegan'], ausschluss: ['schwein'] }),
    );
    const { result } = renderHook(() => useDietPreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.prefs).toEqual({
      nurZeigen: ['vegan'],
      ausschluss: ['schwein'],
      co2Ausschluss: [],
    });
  });
});

describe('MENSA-F-275 Lebensstil-Vorgabe wird nie an eine externe Schnittstelle übertragen', () => {
  it('das Modul spricht ausschließlich mit dem lokalen Schlüssel-Wert-Speicher', () => {
    const quelle = readFileSync(join(__dirname, 'dietPreference.ts'), 'utf8');
    expect(quelle).not.toMatch(/@\/net\/client|from '\.\/api'|fetch\(/);
    expect(quelle).toMatch(/@\/storage\/kv/);
  });
});
