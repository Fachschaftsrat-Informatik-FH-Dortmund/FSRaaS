import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { writeJson } from '@/storage/kv';
import {
  __resetPlanungsEinstellungenForTest,
  parameterAus,
  rangfolgeAus,
  readPlanungsEinstellungen,
  STANDARD_PLANUNG,
  usePlanungsEinstellungen,
} from './planungseinstellungen';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetPlanungsEinstellungenForTest();
});

describe('Kriterienrangfolge für die Planung', () => {
  it('Voreinstellung wählen: die Rangfolge folgt der gewählten Voreinstellung und bleibt gespeichert', async () => {
    const { result } = renderHook(() => usePlanungsEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(rangfolgeAus(result.current.einstellungen)).toEqual(['uniTage', 'anwesenheitszeit']);

    act(() => result.current.voreinstellungSetzen('vorbereitungszeit'));
    expect(rangfolgeAus(result.current.einstellungen)).toEqual(['vorbereitungszeit', 'abstandVorlesungUebung']);
    expect((await readPlanungsEinstellungen()).voreinstellung).toBe('vorbereitungszeit');
  });
});

describe('Vorbereitungszeit je Veranstaltungsart', () => {
  it('Abweichender Wert für eine Veranstaltungsart: gilt nur für diese Art, zurücknehmbar', async () => {
    const { result } = renderHook(() => usePlanungsEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.vorbereitungAllgemeinSetzen(15));
    act(() => result.current.vorbereitungFuerArtSetzen('P', 60));
    expect(parameterAus(result.current.einstellungen)).toMatchObject({
      vorbereitungAllgemeinMin: 15,
      vorbereitungJeArt: { P: 60 },
    });

    act(() => result.current.vorbereitungFuerArtSetzen('P', null));
    expect(result.current.einstellungen.vorbereitungJeArt).toEqual({});
  });

  it('begrenzt Werte auf den zulässigen Bereich', async () => {
    const { result } = renderHook(() => usePlanungsEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.vorbereitungAllgemeinSetzen(-15));
    expect(result.current.einstellungen.vorbereitungAllgemeinMin).toBe(0);
  });

  it('fällt bei unlesbaren gespeicherten Werten feldweise auf die Vorgabe zurück und protokolliert das', async () => {
    await writeJson('schedulePlanungSettings', {
      voreinstellung: 'gibtsnicht',
      vorbereitungAllgemeinMin: 45,
      vorbereitungJeArt: { P: 'viel', Ü: 30 },
      abstandVorlesungUebungMin: 'x',
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(await readPlanungsEinstellungen()).toEqual({
      voreinstellung: STANDARD_PLANUNG.voreinstellung,
      vorbereitungAllgemeinMin: 45,
      vorbereitungJeArt: { Ü: 30 },
      abstandVorlesungUebungMin: STANDARD_PLANUNG.abstandVorlesungUebungMin,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
