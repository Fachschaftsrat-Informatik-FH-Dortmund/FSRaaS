import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { writeJson } from '@/storage/kv';
import { __resetScheduleEntriesForTest, einmaligerGueltigkeitszeitraum, readScheduleEntries, useScheduleEntries } from './planStore';
import type { CustomPlanEntry } from './typen';

function eigenerTermin(überschreibung: Partial<CustomPlanEntry> = {}): CustomPlanEntry {
  return {
    kind: 'eigen',
    id: 'e1',
    deaktiviertBis: null,
    color: '#1E88E5',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    title: 'Lerngruppe',
    wiederkehrend: true,
    ...überschreibung,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetScheduleEntriesForTest();
});

describe('DATA-F-010 der Stundenplan wird ausschließlich lokal persistiert', () => {
  it('legt einen Eintrag an, ändert ihn und entfernt ihn wieder, persistiert dabei', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin()));
    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(await readScheduleEntries()).toHaveLength(1);

    act(() => result.current.aktualisieren('e1', { title: 'Geänderter Titel' } as Partial<CustomPlanEntry>));
    await waitFor(() =>
      expect((result.current.entries[0] as CustomPlanEntry).title).toBe('Geänderter Titel'),
    );

    act(() => result.current.entfernen('e1'));
    await waitFor(() => expect(result.current.entries).toHaveLength(0));
    expect(await readScheduleEntries()).toHaveLength(0);
  });

  it('teilt den Stand über alle Hook-Instanzen', async () => {
    const a = renderHook(() => useScheduleEntries());
    const b = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(b.result.current.loaded).toBe(true));

    act(() => a.result.current.hinzufuegen(eigenerTermin()));
    await waitFor(() => expect(b.result.current.entries).toHaveLength(1));
  });
});

describe('Deaktivieren eines Termins', () => {
  it('deaktiviert einen Termin dauerhaft, bis die Deaktivierung zurückgenommen wird', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin()));
    await waitFor(() => expect(result.current.entries[0]!.deaktiviertBis).toBeNull());

    act(() => result.current.deaktivierungSetzen('e1', 'dauerhaft'));
    await waitFor(() => expect(result.current.entries[0]!.deaktiviertBis).toBe('dauerhaft'));
  });

  it('deaktiviert einen Termin nur für das nächste Vorkommen (Unix-Sekunden-Zeitpunkt)', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin()));
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    act(() => result.current.deaktivierungSetzen('e1', 1_760_000_000));
    await waitFor(() => expect(result.current.entries[0]!.deaktiviertBis).toBe(1_760_000_000));
  });

  it('nimmt eine Deaktivierung verlustfrei zurück', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin({ deaktiviertBis: 'dauerhaft', title: 'Lerngruppe' })));
    await waitFor(() => expect(result.current.entries[0]!.deaktiviertBis).toBe('dauerhaft'));

    act(() => result.current.deaktivierungSetzen('e1', null));
    await waitFor(() => expect(result.current.entries[0]!.deaktiviertBis).toBeNull());
    expect((result.current.entries[0] as CustomPlanEntry).title).toBe('Lerngruppe');
  });
});

// design.md, Entscheidung 2 (verworfen im Prüfprotokoll 2026-09-09): eine
// Überführung von `status: 'fest' | 'vorgemerkt'` zu `deaktiviertBis` war
// vorgesehen, um Geräte mit einem Bestand alter Gestalt verlustfrei
// mitzunehmen. Entschieden: kein Gerät hält noch diesen Stand — die
// Überführung entfällt ersatzlos. Ein Eintrag alter Gestalt durchläuft damit
// denselben Weg wie jeder andere schema-fremde Eintrag (DATA-F-020): einzeln
// verworfen, protokolliert, der übrige Bestand bleibt erhalten.
describe('Entfall der Terminstatus-Überführung', () => {
  it('verwirft einen gespeicherten Eintrag alter Gestalt (status statt deaktiviertBis), statt ihn zu überführen', async () => {
    const alteGestalt = { ...eigenerTermin(), status: 'vorgemerkt' };
    delete (alteGestalt as Record<string, unknown>).deaktiviertBis;
    await writeJson('scheduleEntries', [alteGestalt]);
    __resetScheduleEntriesForTest();

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.entries).toHaveLength(0);
    expect(result.current.verworfeneEintraegeAnzahl).toBe(1);
    errorSpy.mockRestore();
  });
});

describe('SCHED-F-247 Farbe eines einzelnen Termins ändern', () => {
  it('überschreibt die Farbe eines einzelnen Eintrags, ohne andere zu verändern', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'a', color: '#1E88E5' })));
    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'b', color: '#43A047' })));
    await waitFor(() => expect(result.current.entries).toHaveLength(2));

    act(() => result.current.farbeSetzen('a', '#D81B60'));
    await waitFor(() => expect(result.current.entries.find((e) => e.id === 'a')!.color).toBe('#D81B60'));
    expect(result.current.entries.find((e) => e.id === 'b')!.color).toBe('#43A047');
  });
});

describe('DATA-F-020 inkonsistenter gespeicherter Bestand wird nicht kommentarlos gelöscht', () => {
  it('behält gültige Einträge und verwirft nur die ungültigen, mit Protokoll und Zähler', async () => {
    await writeJson('scheduleEntries', [
      eigenerTermin({ id: 'gueltig' }),
      { id: 'kaputt' }, // fehlt fast alles
      'ganz-falscher-typ',
    ]);
    __resetScheduleEntriesForTest();

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]!.id).toBe('gueltig');
    expect(result.current.verworfeneEintraegeAnzahl).toBe(2);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('verwirft den Bestand nicht, wenn der gespeicherte Wert überhaupt keine Liste ist', async () => {
    await writeJson('scheduleEntries', { irgendwas: true });
    __resetScheduleEntriesForTest();

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.entries).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('überspringt einen Eintrag mit unlesbarem Konfliktfeld einzeln und behält den Rest', async () => {
    await writeJson('scheduleEntries', [
      eigenerTermin({ id: 'gueltig' }),
      { ...eigenerTermin({ id: 'kaputtesKonfliktfeld' }), akzeptierteKonflikte: true },
      { ...eigenerTermin({ id: 'keineKennungen' }), akzeptierteKonflikte: [1, 2] },
    ]);
    __resetScheduleEntriesForTest();

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]!.id).toBe('gueltig');
    expect(result.current.verworfeneEintraegeAnzahl).toBe(2);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('verwirft einen eigenen Eintrag ohne das Feld wiederkehrend als ungültig (SCHED-F-730)', async () => {
    const ohneWiederkehrend: Record<string, unknown> = { ...eigenerTermin() };
    delete ohneWiederkehrend.wiederkehrend;
    await writeJson('scheduleEntries', [ohneWiederkehrend]);
    __resetScheduleEntriesForTest();

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    expect(result.current.entries).toEqual([]);
    expect(result.current.verworfeneEintraegeAnzahl).toBe(1);
    errorSpy.mockRestore();
  });
});

describe('SCHED-F-730 eigener Eintrag: wöchentlich wiederkehrend oder einmalig an einem Datum', () => {
  it('speichert und lädt einen wöchentlich wiederkehrenden eigenen Eintrag', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'lerngruppe', wiederkehrend: true })));
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    const geladen = await readScheduleEntries();
    expect((geladen[0] as CustomPlanEntry).wiederkehrend).toBe(true);
  });

  it('speichert einen einmaligen eigenen Eintrag mit gleichem gueltigVon und gueltigBis', async () => {
    const datum = 1_760_000_000; // beliebiger fester Unix-Sekunden-Zeitpunkt
    const { gueltigVon, gueltigBis } = einmaligerGueltigkeitszeitraum(datum);
    expect(gueltigVon).toBe(datum);
    expect(gueltigBis).toBe(datum);

    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() =>
      result.current.hinzufuegen(
        eigenerTermin({ id: 'beratung', wiederkehrend: false, gueltigVon, gueltigBis, title: 'Beratungstermin' }),
      ),
    );
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    const geladen = (await readScheduleEntries())[0] as CustomPlanEntry;
    expect(geladen.wiederkehrend).toBe(false);
    expect(geladen.gueltigVon).toBe(geladen.gueltigBis);
  });

  it('unterscheidet einen einmaligen von einem wiederkehrenden Eintrag anhand des Felds wiederkehrend', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'a', wiederkehrend: true })));
    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'b', wiederkehrend: false })));
    await waitFor(() => expect(result.current.entries).toHaveLength(2));

    const a = result.current.entries.find((e) => e.id === 'a') as CustomPlanEntry;
    const b = result.current.entries.find((e) => e.id === 'b') as CustomPlanEntry;
    expect(a.wiederkehrend).toBe(true);
    expect(b.wiederkehrend).toBe(false);
  });
});

describe('Bewusste Übernahme trotz Konflikt', () => {
  it('hält die Annahme an beiden Seiten des Paars fest', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'a' })));
    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'b', timeBeginMin: 540, timeEndMin: 630 })));
    await waitFor(() => expect(result.current.entries).toHaveLength(2));

    act(() => result.current.konfliktAnnehmen('a', 'b'));
    await waitFor(() => expect(result.current.entries[0]!.akzeptierteKonflikte).toEqual(['b']));
    expect(result.current.entries[1]!.akzeptierteKonflikte).toEqual(['a']);

    const geladen = await readScheduleEntries();
    expect(geladen.map((e) => e.akzeptierteKonflikte)).toEqual([['b'], ['a']]);
  });

  it('hält die Annahme bei zwei gleichzeitigen Kollisionen je Paar einzeln fest', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    // Der übernommene Termin „neu" kollidiert mit „a" und mit „b".
    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'a', timeBeginMin: 480, timeEndMin: 540 })));
    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'b', timeBeginMin: 540, timeEndMin: 600 })));
    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'neu', timeBeginMin: 480, timeEndMin: 600 })));
    await waitFor(() => expect(result.current.entries).toHaveLength(3));

    act(() => result.current.konfliktAnnehmen('neu', 'a'));
    act(() => result.current.konfliktAnnehmen('neu', 'b'));

    await waitFor(() => expect(result.current.entries[2]!.akzeptierteKonflikte).toEqual(['a', 'b']));
    expect(result.current.entries[0]!.akzeptierteKonflikte).toEqual(['neu']);
    expect(result.current.entries[1]!.akzeptierteKonflikte).toEqual(['neu']);
  });

  it('entfernt beim Löschen eines Termins die Nennungen auf ihn aus den übrigen Einträgen', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'a' })));
    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'b', timeBeginMin: 540, timeEndMin: 630 })));
    await waitFor(() => expect(result.current.entries).toHaveLength(2));
    act(() => result.current.konfliktAnnehmen('a', 'b'));
    await waitFor(() => expect(result.current.entries[0]!.akzeptierteKonflikte).toEqual(['b']));

    act(() => result.current.entfernen('b'));
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    expect(result.current.entries[0]!.akzeptierteKonflikte).toEqual([]);
    const geladen = await readScheduleEntries();
    expect(geladen.some((e) => e.akzeptierteKonflikte.includes('b'))).toBe(false);
  });
});

describe('Ausdrückliches Sichern der Planung', () => {
  it('übernimmt Neuanlagen, Entfernungen und Aktualisierungen in einem gemeinsamen Schreibvorgang', async () => {
    const { result } = renderHook(() => useScheduleEntries());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'bestehend' })));
    act(() => result.current.hinzufuegen(eigenerTermin({ id: 'abzuwaehlen', timeBeginMin: 540, timeEndMin: 630 })));
    await waitFor(() => expect(result.current.entries).toHaveLength(2));

    act(() =>
      result.current.mehrereUebernehmen(
        [eigenerTermin({ id: 'neu', timeBeginMin: 660, timeEndMin: 750 })],
        ['abzuwaehlen'],
        [{ id: 'bestehend', patch: { akzeptierteKonflikte: ['neu'] } }],
      ),
    );

    await waitFor(() => expect(result.current.entries.map((e) => e.id).sort()).toEqual(['bestehend', 'neu']));
    expect(result.current.entries.find((e) => e.id === 'bestehend')!.akzeptierteKonflikte).toEqual(['neu']);
    expect(await readScheduleEntries()).toHaveLength(2);
  });
});
