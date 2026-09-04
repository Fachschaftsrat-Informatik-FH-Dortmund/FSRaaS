import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { __resetSelectionForTest, readSelection, useCanteenSelection } from './selection';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetSelectionForTest();
});

describe('MENSA-F-020 Auswahl einer oder mehrerer Mensen', () => {
  it('nimmt Mensen in die Auswahl auf und entfernt sie wieder', async () => {
    const { result } = renderHook(() => useCanteenSelection());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggle('Mensa'));
    act(() => result.current.toggle('Sued'));
    await waitFor(() => expect(result.current.ids).toEqual(['Mensa', 'Sued']));

    act(() => result.current.toggle('Mensa'));
    await waitFor(() => expect(result.current.ids).toEqual(['Sued']));
  });
});

describe('MENSA-F-025 Festlegen der Anzeigereihenfolge', () => {
  it('verschiebt eine Mensa in der Reihenfolge und persistiert das', async () => {
    const { result } = renderHook(() => useCanteenSelection());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggle('A'));
    act(() => result.current.toggle('B'));
    act(() => result.current.toggle('C'));
    await waitFor(() => expect(result.current.ids).toEqual(['A', 'B', 'C']));

    act(() => result.current.move('C', -1));
    await waitFor(() => expect(result.current.ids).toEqual(['A', 'C', 'B']));

    expect(await readSelection()).toEqual(['A', 'C', 'B']);
  });

  it('teilt den Stand über alle Hook-Instanzen (Mensaplan sieht die Auswahl des Auswahl-Bildschirms)', async () => {
    const auswahlBildschirm = renderHook(() => useCanteenSelection());
    const mensaplan = renderHook(() => useCanteenSelection());
    await waitFor(() => expect(mensaplan.result.current.loaded).toBe(true));

    act(() => auswahlBildschirm.result.current.toggle('Mensa'));

    await waitFor(() => expect(mensaplan.result.current.ids).toEqual(['Mensa']));
  });

  it('ignoriert eine Verschiebung über die Ränder hinaus', async () => {
    const { result } = renderHook(() => useCanteenSelection());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.toggle('A'));
    await waitFor(() => expect(result.current.ids).toEqual(['A']));

    act(() => result.current.move('A', -1));
    expect(result.current.ids).toEqual(['A']);
  });
});
