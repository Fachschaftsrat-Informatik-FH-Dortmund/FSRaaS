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

  it('führt Allergene und Zusatzstoffe in einer Liste von Schlüsseln, obwohl das Menü sie getrennt anbietet', async () => {
    // Die Trennung im Filtermenü ist eine Frage der Darstellung: die Schlüssel
    // der Quelle bleiben dieselben, eine vor der Trennung gespeicherte Auswahl
    // gilt unverändert weiter und braucht keine Umschreibung.
    await AsyncStorage.setItem('fb4:dishIntolerances', JSON.stringify(['20a', '2']));
    const { result } = renderHook(() => useIntolerances());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.codes).toEqual(['20a', '2']);
  });

  it('setzt und löscht mit dem Sammelschalter alle Unterschlüssel einer Gruppe gemeinsam', async () => {
    const { result } = renderHook(() => useIntolerances());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setzeMehrere(['20a', '20b', '20c'], true));
    await waitFor(() => expect(result.current.codes).toEqual(['20a', '20b', '20c']));
    expect(await readIntolerances()).toEqual(['20a', '20b', '20c']);

    // Ein einzelner Unterschlüssel bleibt daneben wählbar und wird vom
    // Sammelschalter nicht doppelt aufgenommen.
    act(() => result.current.setzeMehrere(['20a', '20b', '20c'], true));
    await waitFor(() => expect(result.current.codes).toEqual(['20a', '20b', '20c']));

    act(() => result.current.setzeMehrere(['20a', '20b', '20c'], false));
    await waitFor(() => expect(result.current.codes).toEqual([]));
  });

  it('lässt eine Auswahl außerhalb der Gruppe unberührt', async () => {
    const { result } = renderHook(() => useIntolerances());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggle('26'));
    act(() => result.current.setzeMehrere(['20a', '20b'], true));
    await waitFor(() => expect(result.current.codes).toEqual(['26', '20a', '20b']));

    act(() => result.current.setzeMehrere(['20a', '20b'], false));
    await waitFor(() => expect(result.current.codes).toEqual(['26']));
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
