import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { __resetPriceLimitForTest, readPriceLimit, usePriceLimit } from './priceLimit';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetPriceLimitForTest();
});

describe('MENSA-F-235 Preisfilter (Höchstpreis)', () => {
  it('beginnt ohne Limit, erhöht und senkt in Schritten und persistiert gerätelokal', async () => {
    const { result } = renderHook(() => usePriceLimit());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.limit).toBeNull();

    act(() => result.current.erhoehen()); // → 1,00 (PREIS_MIN)
    await waitFor(() => expect(result.current.limit).toBe(1));
    act(() => result.current.erhoehen()); // → 1,50
    await waitFor(() => expect(result.current.limit).toBe(1.5));
    expect(await readPriceLimit()).toBe(1.5);

    act(() => result.current.senken()); // → 1,00
    act(() => result.current.senken()); // < PREIS_MIN → null
    await waitFor(() => expect(result.current.limit).toBeNull());
  });

  it('deckelt bei PREIS_MAX', async () => {
    const { result } = renderHook(() => usePriceLimit());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    for (let i = 0; i < 40; i++) act(() => result.current.erhoehen());
    await waitFor(() => expect(result.current.limit).toBe(10));
  });
});

describe('MENSA-F-275 Preisfilter wird nie an eine externe Schnittstelle übertragen', () => {
  it('das Modul spricht ausschließlich mit dem lokalen Schlüssel-Wert-Speicher', () => {
    const quelle = readFileSync(join(__dirname, 'priceLimit.ts'), 'utf8');
    expect(quelle).not.toMatch(/@\/net\/client|from '\.\/api'|fetch\(/);
    expect(quelle).toMatch(/@\/storage\/kv/);
  });
});
