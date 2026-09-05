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
    expect(await readDietPreference()).toEqual({ nurZeigen: ['vegan'], ausschluss: ['schwein'] });
  });

  it('verschiebt eine Kennzeichnung von der Vorgabe in den Ausschluss statt sie doppelt zu führen', async () => {
    const { result } = renderHook(() => useDietPreference());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggleNurZeigen('vegan'));
    act(() => result.current.toggleAusschluss('vegan'));
    await waitFor(() => expect(result.current.prefs.ausschluss).toEqual(['vegan']));
    expect(result.current.prefs.nurZeigen).toEqual([]);

    act(() => result.current.clear());
    await waitFor(() => expect(result.current.prefs).toEqual({ nurZeigen: [], ausschluss: [] }));
  });
});

describe('MENSA-F-275 Lebensstil-Vorgabe wird nie an eine externe Schnittstelle übertragen', () => {
  it('das Modul spricht ausschließlich mit dem lokalen Schlüssel-Wert-Speicher', () => {
    const quelle = readFileSync(join(__dirname, 'dietPreference.ts'), 'utf8');
    expect(quelle).not.toMatch(/@\/net\/client|from '\.\/api'|fetch\(/);
    expect(quelle).toMatch(/@\/storage\/kv/);
  });
});
