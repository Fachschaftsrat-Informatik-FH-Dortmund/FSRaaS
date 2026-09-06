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

describe('SCHED-F-020 Auswahl von Studiengang und Fachsemester', () => {
  it('speichert Studiengang und Fachsemester gemeinsam und persistiert das', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setStudiengangUndFachsemester('INPBPI', '2'));
    await waitFor(() => expect(result.current.einrichtung.sname).toBe('INPBPI'));
    expect(result.current.einrichtung.grade).toBe('2');

    expect(await readEinrichtung()).toMatchObject({ sname: 'INPBPI', grade: '2' });
  });

  it('teilt den Stand über alle Hook-Instanzen', async () => {
    const a = renderHook(() => useEinrichtung());
    const b = renderHook(() => useEinrichtung());
    await waitFor(() => expect(b.result.current.loaded).toBe(true));

    act(() => a.result.current.setStudiengangUndFachsemester('INPBPI', '4'));
    await waitFor(() => expect(b.result.current.einrichtung.grade).toBe('4'));
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

describe('SCHED-F-640 zusätzlich abgerufene Fachsemester desselben Studiengangs', () => {
  it('nimmt ein weiteres Fachsemester auf und entfernt es wieder', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setStudiengangUndFachsemester('INPBPI', '2'));
    act(() => result.current.zusatzFachsemesterHinzufuegen('4'));
    await waitFor(() => expect(result.current.einrichtung.zusatzFachsemester).toEqual(['4']));

    act(() => result.current.zusatzFachsemesterEntfernen('4'));
    await waitFor(() => expect(result.current.einrichtung.zusatzFachsemester).toEqual([]));
  });

  it('führt ein Fachsemester nicht doppelt, wenn es erneut hinzugefügt wird', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.zusatzFachsemesterHinzufuegen('4'));
    act(() => result.current.zusatzFachsemesterHinzufuegen('4'));
    await waitFor(() => expect(result.current.einrichtung.zusatzFachsemester).toEqual(['4']));
  });

  it('verwirft die Zusatzsemester, wenn ein anderer Studiengang gewählt wird', async () => {
    const { result } = renderHook(() => useEinrichtung());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setStudiengangUndFachsemester('INPBPI', '2'));
    act(() => result.current.zusatzFachsemesterHinzufuegen('4'));
    await waitFor(() => expect(result.current.einrichtung.zusatzFachsemester).toEqual(['4']));

    act(() => result.current.setStudiengangUndFachsemester('INPBTI', '2'));
    await waitFor(() => expect(result.current.einrichtung.zusatzFachsemester).toEqual([]));
  });
});

describe('SCHED-F-720 Gruppenkennung ohne Matrikelnummer: manuelle Angabe verlangt Buchstabe und Zahl', () => {
  it('weist eine Gruppenkennung aus nur einem Buchstaben zurück', () => {
    // Umkehr der Festlegung vom 2026-09-04: Fünf der 21 real vorkommenden
    // studentSet-Werte tragen eine Zahl an einer Bereichsgrenze, an der sie
    // mitentscheidet (C5-E, M5-P, J-M4, H5-J, F-H4).
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
    act(() => einrichtung.result.current.setStudiengangUndFachsemester('INPBPI', '2'));
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

  it('löscht einen vor dem 2026-09-06 gespeicherten Altbestand beim ersten Zugriff', async () => {
    await AsyncStorage.setItem('fb4:scheduleMatrikelnummer', JSON.stringify(PLATZHALTER_MATRIKELNUMMER));

    renderHook(() => useMatrikelnummer());

    await waitFor(async () => {
      expect(await AsyncStorage.getItem('fb4:scheduleMatrikelnummer')).toBeNull();
    });
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
    act(() => einrichtung.result.current.setStudiengangUndFachsemester('INPBPI', '2'));
    await waitFor(() => expect(einrichtung.result.current.einrichtung.sname).toBe('INPBPI'));

    const roh = await AsyncStorage.getItem('fb4:scheduleSetup');
    expect(roh).not.toBeNull();
    expect(roh!).not.toContain(PLATZHALTER_MATRIKELNUMMER);
  });
});
