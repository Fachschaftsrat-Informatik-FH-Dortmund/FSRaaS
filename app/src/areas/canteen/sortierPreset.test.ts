import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { __resetSortierPresetForTest, useSortierGruppierung } from './sortierPreset';
import type { Kombination } from './sortierung';

const KEY_PRESETS = 'fb4:canteenSortPresets';
const KEY_ACTIVE = 'fb4:canteenSortActive';

const kombiPreis: Kombination = {
  gruppierung: 'keine',
  gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
};

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetSortierPresetForTest();
});

async function ladeHook() {
  const hook = renderHook(() => useSortierGruppierung());
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

describe('Voreingestelltes Preset', () => {
  it('fällt ohne gespeicherte aktive ID auf „Mensa, günstigstes zuerst" zurück', async () => {
    const { result } = await ladeHook();
    expect(result.current.aktiv.id).toBe('mensa-guenstigstes');
    expect(result.current.presets).toEqual([]);
  });

  it('fällt bei einer aktiven ID, die auf ein gelöschtes eigenes Preset zeigt, auf die Voreinstellung zurück', async () => {
    await AsyncStorage.setItem(KEY_ACTIVE, JSON.stringify('eigen-weg'));
    const { result } = await ladeHook();
    expect(result.current.aktiv.id).toBe('mensa-guenstigstes');
  });
});

describe('sortierPreset verwirft nur den beschädigten Eintrag beim Laden', () => {
  it('lädt gültige eigene Presets und lässt einen mit unbekanntem Kriterium weg', async () => {
    await AsyncStorage.setItem(
      KEY_PRESETS,
      JSON.stringify([
        { id: 'gut', name: 'Gut', kombination: kombiPreis },
        { id: 'kaputt', name: 'Kaputt', kombination: { gruppierung: 'keine', gerichteSortierung: { kriterium: 'entfernung', richtung: 'auf' } } },
        { id: 'auch-gut', name: 'Auch gut', kombination: { gruppierung: 'mensa', gruppenreihenfolge: { kriterium: 'alphabetisch', richtung: 'ab' }, gerichteSortierung: { kriterium: 'bezeichnung', richtung: 'auf' } } },
      ]),
    );
    const { result } = await ladeHook();
    expect(result.current.presets.map((p) => p.id)).toEqual(['gut', 'auch-gut']);
  });
});

describe('Speichern eines eigenen Presets', () => {
  it('legt die aktuelle Kombination unter einem Namen als wählbares Preset an und hält sie über einen Neustart', async () => {
    const { result } = await ladeHook();
    await act(async () => {
      result.current.speichereEigenes('Mein Preset', kombiPreis);
    });
    await waitFor(() => expect(result.current.presets).toHaveLength(1));
    expect(result.current.presets[0]!.name).toBe('Mein Preset');

    // Simulierter Neustart: Modulzustand zurücksetzen und neu laden.
    __resetSortierPresetForTest();
    const wieder = await ladeHook();
    expect(wieder.result.current.presets.map((p) => p.name)).toEqual(['Mein Preset']);
  });
});

describe('Umbenennen und Löschen eigener Presets', () => {
  it('benennt ein eigenes Preset um und löscht es', async () => {
    const { result } = await ladeHook();
    let id = '';
    await act(async () => {
      id = result.current.speichereEigenes('Alt', kombiPreis);
    });
    await waitFor(() => expect(result.current.presets).toHaveLength(1));

    await act(async () => result.current.benenneUm(id, 'Neu'));
    await waitFor(() => expect(result.current.presets[0]!.name).toBe('Neu'));

    await act(async () => result.current.loesche(id));
    await waitFor(() => expect(result.current.presets).toHaveLength(0));
  });

  it('lässt Umbenennen und Löschen für eine vordefinierte ID wirkungslos', async () => {
    const { result } = await ladeHook();
    await act(async () => {
      result.current.speichereEigenes('Eigen', kombiPreis);
    });
    await waitFor(() => expect(result.current.presets).toHaveLength(1));

    await act(async () => result.current.benenneUm('mensa-guenstigstes', 'Umbenannt'));
    await act(async () => result.current.loesche('preis'));
    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0]!.name).toBe('Eigen');
  });
});

describe('Merken des zuletzt gewählten Presets', () => {
  it('stellt nach einer Wahl und simuliertem Neustart dasselbe Preset wieder her', async () => {
    const { result } = await ladeHook();
    await act(async () => result.current.waehle('preis'));
    await waitFor(() => expect(result.current.aktiv.id).toBe('preis'));
    expect(JSON.parse((await AsyncStorage.getItem(KEY_ACTIVE))!)).toBe('preis');

    __resetSortierPresetForTest();
    const wieder = await ladeHook();
    expect(wieder.result.current.aktiv.id).toBe('preis');
  });

  it('stellt auch ein gewähltes eigenes Preset wieder her', async () => {
    const { result } = await ladeHook();
    let id = '';
    await act(async () => {
      id = result.current.speichereEigenes('Eigen', kombiPreis);
    });
    await waitFor(() => expect(result.current.presets).toHaveLength(1));
    await act(async () => result.current.waehle(id));
    await waitFor(() => expect(result.current.aktiv.id).toBe(id));

    __resetSortierPresetForTest();
    const wieder = await ladeHook();
    expect(wieder.result.current.aktiv.id).toBe(id);
    expect(wieder.result.current.aktiv.eigen).toBe(true);
  });
});
