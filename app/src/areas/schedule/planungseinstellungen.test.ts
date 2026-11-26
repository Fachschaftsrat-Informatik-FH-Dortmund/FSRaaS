import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { writeJson } from '@/storage/kv';
import {
  __resetPlanungsEinstellungenForTest,
  kriteriumUmschalten,
  kriteriumVerschieben,
  parameterAus,
  rangfolgeAus,
  readPlanungsEinstellungen,
  STANDARD_PLANUNG,
  usePlanungsEinstellungen,
  voreinstellungAus,
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
    expect(voreinstellungAus(await readPlanungsEinstellungen())).toBe('vorbereitungszeit');
  });

  it('Rangfolge selbst ändern: Verschieben und Abschalten wirken auf die Reihung, die Voreinstellung gilt dann als eigene Rangfolge', async () => {
    const { result } = renderHook(() => usePlanungsEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.kriteriumBewegen('anwesenheitszeit', -1));
    expect(rangfolgeAus(result.current.einstellungen)).toEqual(['anwesenheitszeit', 'uniTage']);
    expect(voreinstellungAus(result.current.einstellungen)).toBeNull();

    act(() => result.current.kriteriumSchalten('uniTage'));
    expect(rangfolgeAus(result.current.einstellungen)).toEqual(['anwesenheitszeit']);
    // Genau die Rangfolge von „Zeit an der Uni" — sie wird wieder als diese Voreinstellung erkannt.
    expect(voreinstellungAus(result.current.einstellungen)).toBe('zeitAnDerUni');

    act(() => result.current.kriteriumSchalten('abwechslung'));
    expect((await readPlanungsEinstellungen()).rangfolge).toEqual(['anwesenheitszeit', 'abwechslung']);
  });

  it('ein eingeschaltetes Kriterium kommt ans Ende, am Rand verschiebt sich nichts', () => {
    expect(kriteriumUmschalten(['uniTage'], 'zeitfenster')).toEqual(['uniTage', 'zeitfenster']);
    expect(kriteriumVerschieben(['uniTage', 'zeitfenster'], 'uniTage', -1)).toEqual(['uniTage', 'zeitfenster']);
    expect(kriteriumVerschieben(['uniTage', 'zeitfenster'], 'zeitfenster', 1)).toEqual(['uniTage', 'zeitfenster']);
    expect(kriteriumVerschieben(['uniTage', 'zeitfenster'], 'abwechslung', 1)).toEqual(['uniTage', 'zeitfenster']);
  });

  it('übernimmt einen gespeicherten Bestand aus dem ersten Zug über seine Voreinstellung', async () => {
    await writeJson('schedulePlanungSettings', { voreinstellung: 'ausgeglicheneWoche' });
    expect((await readPlanungsEinstellungen()).rangfolge).toEqual(['gleichmaessigeWoche']);
  });

  it('verwirft unbekannte und doppelte Kriterien einzeln und protokolliert das', async () => {
    await writeJson('schedulePlanungSettings', { rangfolge: ['abwechslung', 'gibtsnicht', 'abwechslung', 'uniTage'] });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect((await readPlanungsEinstellungen()).rangfolge).toEqual(['abwechslung', 'uniTage']);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('Bevorzugtes Zeitfenster festlegen', () => {
  it('Zeitfenster festlegen: das System übernimmt es für die Planung, ein ungültiges Fenster nicht', async () => {
    const { result } = renderHook(() => usePlanungsEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(parameterAus(result.current.einstellungen).zeitfenster).toBeNull();

    act(() => result.current.zeitfensterSetzen({ vonMin: 540, bisMin: 960 }));
    expect(parameterAus(result.current.einstellungen).zeitfenster).toEqual({ vonMin: 540, bisMin: 960 });

    act(() => result.current.zeitfensterSetzen({ vonMin: 960, bisMin: 960 }));
    expect(result.current.einstellungen.zeitfenster).toEqual({ vonMin: 540, bisMin: 960 });

    act(() => result.current.zeitfensterSetzen(null));
    expect((await readPlanungsEinstellungen()).zeitfenster).toBeNull();
  });
});

describe('Kandidat als Pflicht markieren', () => {
  it('markiert ein Modul als Pflicht und nimmt die Markierung wieder zurück', async () => {
    const { result } = renderHook(() => usePlanungsEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.pflichtUmschalten('M1|2'));
    expect((await readPlanungsEinstellungen()).pflichtModule).toEqual(['M1|2']);
    act(() => result.current.pflichtUmschalten('M1|2'));
    expect(result.current.einstellungen.pflichtModule).toEqual([]);
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
      zeitfenster: { vonMin: 900, bisMin: 600 },
      pflichtModule: 'M1',
      zeitachse: 'ja',
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(await readPlanungsEinstellungen()).toEqual({
      rangfolge: STANDARD_PLANUNG.rangfolge,
      vorbereitungAllgemeinMin: 45,
      vorbereitungJeArt: { Ü: 30 },
      abstandVorlesungUebungMin: STANDARD_PLANUNG.abstandVorlesungUebungMin,
      zeitfenster: null,
      pflichtModule: [],
      zeitachse: false,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('Zeitachse im Planungsmodus', () => {
  it('Darstellung bleibt erhalten: die Wahl der Zeitachse wird gespeichert', async () => {
    const { result } = renderHook(() => usePlanungsEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.einstellungen.zeitachse).toBe(false);
    act(() => result.current.zeitachseUmschalten());
    expect((await readPlanungsEinstellungen()).zeitachse).toBe(true);
  });
});

describe('Persistente Schlüssel-Wert-Ablage für Einstellungen', () => {
  it('eine vor dem Ladeende geschriebene Änderung wird vom Laden nicht überschrieben', async () => {
    await writeJson('schedulePlanungSettings', { zeitachse: false });
    const { result } = renderHook(() => usePlanungsEinstellungen());
    act(() => result.current.zeitachseUmschalten());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.einstellungen.zeitachse).toBe(true);
  });
});
