import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { readFavorites, useFavorites } from './favorites';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('MENSA-F-080 Lieblingsgericht markieren und Markierung aufheben', () => {
  it('markiert und entmarkiert ein Gericht über seinen Schlüssel', async () => {
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.list).toEqual([]));

    act(() => result.current.toggle({ schluessel: 'currywurst', bezeichnung: 'Currywurst' }));
    await waitFor(() => expect(result.current.has('currywurst')).toBe(true));

    act(() => result.current.toggle({ schluessel: 'currywurst', bezeichnung: 'Currywurst' }));
    await waitFor(() => expect(result.current.has('currywurst')).toBe(false));
  });
});

describe('MENSA-F-090 Wiedererkennung über den normalisierten Schlüssel, unabhängig vom Tag', () => {
  it('bleibt nach einem simulierten Offline-Neustart erhalten und trifft trotz wechselnder roher Bezeichnung', async () => {
    const first = renderHook(() => useFavorites());
    await waitFor(() => expect(first.result.current.list).toEqual([]));
    act(() =>
      first.result.current.toggle({ schluessel: 'bolognese | spaghetti', bezeichnung: 'Bolognese | Spaghetti' }),
    );
    await waitFor(() => expect(first.result.current.has('bolognese | spaghetti')).toBe(true));

    // Neustart: frischer Hook, derselbe Speicher.
    const persisted = await readFavorites();
    expect(persisted).toEqual([{ schluessel: 'bolognese | spaghetti', letzteBezeichnung: 'Bolognese | Spaghetti' }]);

    const second = renderHook(() => useFavorites());
    await waitFor(() => expect(second.result.current.has('bolognese | spaghetti')).toBe(true));
  });
});
