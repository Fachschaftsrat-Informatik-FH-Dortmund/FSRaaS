import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  __resetEinrichtungForTest,
  __resetMatrikelnummerForTest,
  GRUPPENKENNUNG_MUSTER,
  readEinrichtung,
  useEinrichtung,
  useMatrikelnummer,
} from './einrichtung';

// Platzhalter-Matrikelnummer, keine echte (Testregel im Auftrag).
const PLATZHALTER_MATRIKELNUMMER = '7654321';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetEinrichtungForTest();
  __resetMatrikelnummerForTest();
});

describe('Auswahl der Endpunkte des Lehrangebots', () => {
  it('wählt einen Endpunkt und persistiert das', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.endpunktUmschalten('INPBPI'));
    await waitFor(() => expect(result.current.einrichtung.endpunkte).toEqual(['INPBPI']));

    expect(await readEinrichtung()).toMatchObject({ endpunkte: ['INPBPI'] });
  });

  it('Mehrere Endpunkte gewählt: nimmt weitere Endpunkte gleichrangig hinzu', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.endpunktUmschalten('INPBPI'));
    act(() => result.current.endpunktUmschalten('Blockwoche1'));
    act(() => result.current.endpunktUmschalten('TUPB'));
    await waitFor(() => expect(result.current.einrichtung.endpunkte).toEqual(['INPBPI', 'Blockwoche1', 'TUPB']));
  });

  it('Endpunkt wieder abgewählt: entfernt genau diesen Endpunkt aus der Auswahl', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.endpunktUmschalten('INPBPI'));
    act(() => result.current.endpunktUmschalten('TUPB'));
    await waitFor(() => expect(result.current.einrichtung.endpunkte).toEqual(['INPBPI', 'TUPB']));

    act(() => result.current.endpunktUmschalten('INPBPI'));
    await waitFor(() => expect(result.current.einrichtung.endpunkte).toEqual(['TUPB']));
  });

  it('teilt den Stand über alle Hook-Instanzen', async () => {
    const a = renderHook(() => useEinrichtung());
    const b = renderHook(() => useEinrichtung());
    await waitFor(() => expect(b.result.current.loaded).toBe(true));

    act(() => a.result.current.endpunktUmschalten('INPBPI'));
    await waitFor(() => expect(b.result.current.einrichtung.endpunkte).toEqual(['INPBPI']));
  });
});

describe('Migration des gerätelokalen Stands', () => {
  it('überführt einen gespeicherten Stand alter Gestalt (sname/grade/zusatzFachsemester) verlustfrei in endpunkte', async () => {
    await AsyncStorage.setItem(
      'fb4:scheduleSetup',
      JSON.stringify({
        sname: 'INPBPI',
        grade: '2',
        zusatzFachsemester: ['4'],
        gruppenkennung: 'C8',
      }),
    );

    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.einrichtung.endpunkte).toEqual(['INPBPI']);
    expect(result.current.einrichtung.gruppenkennung).toBe('C8');
  });

  it('liest einen bereits in neuer Gestalt gespeicherten Stand unverändert', async () => {
    await AsyncStorage.setItem(
      'fb4:scheduleSetup',
      JSON.stringify({ endpunkte: ['INPBPI', 'Blockwoche1'], gruppenkennung: 'C8', gruppenkennungVorschlag: null }),
    );

    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.einrichtung.endpunkte).toEqual(['INPBPI', 'Blockwoche1']);
  });
});

describe('SCHED-F-040 Eingabe einer Gruppenkennung nach dem Muster ^[A-Z][0-9]*$', () => {
  it('speichert eine gültige Gruppenkennung großgeschrieben', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setGruppenkennung('c8'));
    await waitFor(() => expect(result.current.einrichtung.gruppenkennung).toBe('C8'));
    expect(GRUPPENKENNUNG_MUSTER.test(result.current.einrichtung.gruppenkennung!)).toBe(true);
  });

  it('entfernt die Gruppenkennung wieder mit null', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setGruppenkennung('C8'));
    await waitFor(() => expect(result.current.einrichtung.gruppenkennung).toBe('C8'));
    act(() => result.current.setGruppenkennung(null));
    await waitFor(() => expect(result.current.einrichtung.gruppenkennung).toBeNull());
  });
});

describe('SCHED-F-720 Gruppenkennung ohne Matrikelnummer: manuelle Angabe verlangt Buchstabe und Zahl', () => {
  it('weist eine Gruppenkennung aus nur einem Buchstaben zurück', () => {
    expect(GRUPPENKENNUNG_MUSTER.test('C')).toBe(false);
    expect(GRUPPENKENNUNG_MUSTER.test('H')).toBe(false);
  });

  it('nimmt eine Gruppenkennung mit Zahl an', () => {
    expect(GRUPPENKENNUNG_MUSTER.test('O7')).toBe(true);
    expect(GRUPPENKENNUNG_MUSTER.test('C8')).toBe(true);
  });

  it('lehnt eine Kennung ohne führenden Buchstaben weiterhin ab', () => {
    expect(GRUPPENKENNUNG_MUSTER.test('8')).toBe(false);
    expect(GRUPPENKENNUNG_MUSTER.test('')).toBe(false);
  });

  it('speichert eine vollständige Gruppenkennung über den Hook', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setGruppenkennung('c8'));
    await waitFor(() => expect(result.current.einrichtung.gruppenkennung).toBe('C8'));
  });

  it('lässt die Einrichtung vollständig ohne Angabe einer Matrikelnummer abschließen', async () => {
    const einrichtung = renderHook(() => useEinrichtung());
    await waitFor(() => expect(einrichtung.result.current.loaded).toBe(true));
    act(() => einrichtung.result.current.endpunktUmschalten('INPBPI'));
    act(() => einrichtung.result.current.setGruppenkennung('C8'));
    await waitFor(() => expect(einrichtung.result.current.einrichtung.gruppenkennung).toBe('C8'));

    const matrikelnummer = renderHook(() => useMatrikelnummer());
    expect(matrikelnummer.result.current.matrikelnummer).toBeNull();
  });
});

describe('SCHED-F-700 eine per Matrikelnummer ermittelte Gruppenkennung wird erst nach Bestätigung übernommen', () => {
  it('legt eine ermittelte Kennung zunächst nur als Vorschlag ab, ohne die gespeicherte Gruppenkennung zu ändern', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.gruppenkennungVorschlagSetzen('O7'));
    await waitFor(() => expect(result.current.einrichtung.gruppenkennungVorschlag).toBe('O7'));
    expect(result.current.einrichtung.gruppenkennung).toBeNull();
  });

  it('übernimmt den Vorschlag erst nach ausdrücklicher Bestätigung', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.gruppenkennungVorschlagSetzen('B3'));
    await waitFor(() => expect(result.current.einrichtung.gruppenkennungVorschlag).toBe('B3'));

    act(() => result.current.gruppenkennungVorschlagBestaetigen());
    await waitFor(() => expect(result.current.einrichtung.gruppenkennung).toBe('B3'));
    expect(result.current.einrichtung.gruppenkennungVorschlag).toBeNull();
  });

  it('verwirft einen abgelehnten Vorschlag, ohne die gespeicherte Gruppenkennung zu ändern', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setGruppenkennung('C8'));
    await waitFor(() => expect(result.current.einrichtung.gruppenkennung).toBe('C8'));

    act(() => result.current.gruppenkennungVorschlagSetzen('A9'));
    await waitFor(() => expect(result.current.einrichtung.gruppenkennungVorschlag).toBe('A9'));

    act(() => result.current.gruppenkennungVorschlagVerwerfen());
    await waitFor(() => expect(result.current.einrichtung.gruppenkennungVorschlag).toBeNull());
    expect(result.current.einrichtung.gruppenkennung).toBe('C8');
  });
});

describe('Keine Speicherung der Matrikelnummer', () => {
  it('hält sie für die Dauer der Eingabe, schreibt sie aber nirgends auf die Platte', async () => {
    const { result } = renderHook(() => useMatrikelnummer());

    act(() => result.current.setMatrikelnummer(PLATZHALTER_MATRIKELNUMMER));
    await waitFor(() => expect(result.current.matrikelnummer).toBe(PLATZHALTER_MATRIKELNUMMER));

    // Nachweis statt Behauptung: kein Schlüssel des Speichers trägt sie.
    const schluessel = await AsyncStorage.getAllKeys();
    const werte = await AsyncStorage.multiGet(schluessel);
    for (const [, wert] of werte) {
      expect(wert ?? '').not.toContain(PLATZHALTER_MATRIKELNUMMER);
    }
  });

  it('überlebt keinen Neustart — nach dem Zurücksetzen des Moduls ist sie fort', async () => {
    const erst = renderHook(() => useMatrikelnummer());
    act(() => erst.result.current.setMatrikelnummer(PLATZHALTER_MATRIKELNUMMER));
    await waitFor(() => expect(erst.result.current.matrikelnummer).toBe(PLATZHALTER_MATRIKELNUMMER));

    __resetMatrikelnummerForTest(); // entspricht einem App-Neustart
    const danach = renderHook(() => useMatrikelnummer());
    expect(danach.result.current.matrikelnummer).toBeNull();
  });

  it('entfernt die Matrikelnummer wieder mit null', async () => {
    const { result } = renderHook(() => useMatrikelnummer());

    act(() => result.current.setMatrikelnummer(PLATZHALTER_MATRIKELNUMMER));
    await waitFor(() => expect(result.current.matrikelnummer).toBe(PLATZHALTER_MATRIKELNUMMER));

    act(() => result.current.setMatrikelnummer(null));
    await waitFor(() => expect(result.current.matrikelnummer).toBeNull());
  });

  it('hinterlässt sie auch nicht im übrigen scheduleSetup-Bestand', async () => {
    const matrikelnummer = renderHook(() => useMatrikelnummer());
    act(() => matrikelnummer.result.current.setMatrikelnummer(PLATZHALTER_MATRIKELNUMMER));
    await waitFor(() => expect(matrikelnummer.result.current.matrikelnummer).toBe(PLATZHALTER_MATRIKELNUMMER));

    const einrichtung = renderHook(() => useEinrichtung());
    await waitFor(() => expect(einrichtung.result.current.loaded).toBe(true));
    act(() => einrichtung.result.current.endpunktUmschalten('INPBPI'));
    await waitFor(() => expect(einrichtung.result.current.einrichtung.endpunkte).toEqual(['INPBPI']));

    const roh = await AsyncStorage.getItem('fb4:scheduleSetup');
    expect(roh).not.toBeNull();
    expect(roh!).not.toContain(PLATZHALTER_MATRIKELNUMMER);
  });
});
