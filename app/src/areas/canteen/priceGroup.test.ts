import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { __resetPriceGroupForTest, readPriceGroup, usePriceGroup } from './priceGroup';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetPriceGroupForTest();
});

describe('SET-F-190 Voreinstellung Studierende, solange keine Wahl getroffen ist', () => {
  it('liefert ohne gespeicherte Wahl „student"', async () => {
    const { result } = renderHook(() => usePriceGroup());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.group).toBe('student');
  });
});

describe('SET-F-180 Wahl der eigenen Preisgruppe', () => {
  it('übernimmt die Wahl und persistiert sie gerätelokal', async () => {
    const { result } = renderHook(() => usePriceGroup());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setGroup('staff'));
    await waitFor(() => expect(result.current.group).toBe('staff'));

    expect(await readPriceGroup()).toBe('staff');
  });

  it('teilt den Stand über alle Hook-Instanzen (Mensaplan sieht die Wahl aus den Einstellungen)', async () => {
    const einstellungen = renderHook(() => usePriceGroup());
    const mensaplan = renderHook(() => usePriceGroup());
    await waitFor(() => expect(mensaplan.result.current.loaded).toBe(true));

    act(() => einstellungen.result.current.setGroup('guest'));
    await waitFor(() => expect(mensaplan.result.current.group).toBe('guest'));
  });
});
