import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { __resetIntolerancesForTest, readIntolerances, useIntolerances } from './intolerances';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetIntolerancesForTest();
});

describe('MENSA-F-180 Festlegen eigener Unverträglichkeiten', () => {
  it('nimmt Kennzeichnungen auf, entfernt sie und persistiert gerätelokal', async () => {
    const { result } = renderHook(() => useIntolerances());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggle('20a'));
    act(() => result.current.toggle('2'));
    await waitFor(() => expect(result.current.codes).toEqual(['20a', '2']));
    expect(await readIntolerances()).toEqual(['20a', '2']);

    act(() => result.current.toggle('20a'));
    await waitFor(() => expect(result.current.codes).toEqual(['2']));

    act(() => result.current.clear());
    await waitFor(() => expect(result.current.codes).toEqual([]));
  });
});

describe('MENSA-F-215 Unverträglichkeiten werden nie an eine externe Schnittstelle übertragen', () => {
  it('das Modul spricht ausschließlich mit dem lokalen Schlüssel-Wert-Speicher, nicht mit dem API-Client', () => {
    const quelle = readFileSync(join(__dirname, 'intolerances.ts'), 'utf8');
    // Kein Import des Netz-/API-Clients, kein fetch, kein Backend-Aufruf.
    expect(quelle).not.toMatch(/@\/net\/client|from '\.\/api'|fetch\(/);
    expect(quelle).toMatch(/@\/storage\/kv/);
  });
});
