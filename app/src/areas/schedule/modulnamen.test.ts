import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { writeJson } from '@/storage/kv';
import {
  __resetModulnamenForTest,
  kachelTitel,
  modulSchluesselVon,
  readModulnamen,
  useModulnamen,
} from './modulnamen';
import type { CustomPlanEntry, OfficialPlanEntry } from './typen';

function offiziell(überschreibung: Partial<OfficialPlanEntry> = {}): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    id: 'o1',
    courseId: 'AUD',
    name: 'Algorithmen und Datenstrukturen',
    courseType: 'V',
    lecturerName: 'Prof. Beispiel',
    studentSet: '*',
    roomId: 'C.1.01',
    deaktiviertBis: null,
    color: '#1E88E5',
    weekday: 'Mon',
    timeBeginMin: 480,
    timeEndMin: 570,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    gueltigVon: null,
    gueltigBis: null,
    ...überschreibung,
  };
}

function eigen(überschreibung: Partial<CustomPlanEntry> = {}): CustomPlanEntry {
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
    gueltigVon: null,
    gueltigBis: null,
    title: 'Lerngruppe',
    wiederkehrend: true,
    ...überschreibung,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetModulnamenForTest();
});

describe('Eigener Name je Modul', () => {
  it('Modul umbenennen: alle Termine des Moduls tragen den Namen, auch andere Veranstaltungsarten', async () => {
    const { result } = renderHook(() => useModulnamen());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setzen('AUD', 'AuD'));
    await waitFor(() => expect(result.current.namen).toEqual({ AUD: 'AuD' }));

    const vorlesung = offiziell({ id: 'v', courseType: 'V' });
    const uebung = offiziell({ id: 'u', courseType: 'Ü', name: 'Algorithmen und Datenstrukturen Übung' });
    const praktikum = offiziell({ id: 'p', courseType: 'P' });
    for (const termin of [vorlesung, uebung, praktikum]) {
      expect(kachelTitel(termin, result.current.namen)).toBe('AuD');
    }
    expect(await readModulnamen()).toEqual({ AUD: 'AuD' });
  });

  it('Später hinzukommender Termin: ein danach aufgenommener Termin desselben Moduls trägt den Namen', async () => {
    const { result } = renderHook(() => useModulnamen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.setzen('AUD', 'AuD'));

    // Ein neuer Eintrag mit eigener Kennung, der beim Umbenennen noch nicht im Plan stand.
    const spaeter = offiziell({ id: 'neu-nach-umbenennen', courseType: 'Ü', weekday: 'Thu' });
    await waitFor(() => expect(kachelTitel(spaeter, result.current.namen)).toBe('AuD'));
  });

  it('Eigenen Namen entfernen: danach erscheint wieder die offizielle Bezeichnung', async () => {
    const { result } = renderHook(() => useModulnamen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.setzen('AUD', 'AuD'));
    await waitFor(() => expect(result.current.namen).toEqual({ AUD: 'AuD' }));

    act(() => result.current.entfernen('AUD'));
    await waitFor(() => expect(result.current.namen).toEqual({}));
    expect(kachelTitel(offiziell(), result.current.namen)).toBe('Algorithmen und Datenstrukturen');
    expect(await readModulnamen()).toEqual({});
  });

  it('speichert den Namen getrimmt, auf die Höchstlänge begrenzt und nie leer', async () => {
    const { result } = renderHook(() => useModulnamen());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.setzen('AUD', '   '));
    expect(result.current.namen).toEqual({});

    act(() => result.current.setzen('AUD', `  ${'x'.repeat(50)}  `));
    await waitFor(() => expect(result.current.namen.AUD).toBe('x'.repeat(40)));
  });

  it('identifiziert ein Modul über courseId, ersatzweise den offiziellen Namen; eigene Termine gehören keinem an', () => {
    expect(modulSchluesselVon(offiziell())).toBe('AUD');
    expect(modulSchluesselVon(offiziell({ courseId: ' ' }))).toBe('Algorithmen und Datenstrukturen');
    expect(modulSchluesselVon(eigen())).toBeNull();
    expect(kachelTitel(eigen({ title: 'AUD' }), { AUD: 'AuD' })).toBe('AUD');
  });

  it('wirkt nicht auf andere Module', () => {
    expect(kachelTitel(offiziell({ courseId: 'MATHE1', name: 'Mathematik 1' }), { AUD: 'AuD' })).toBe(
      'Mathematik 1',
    );
  });

  it('verwirft einen ungültigen gespeicherten Eintrag einzeln und behält den Rest (DATA-F-020)', async () => {
    await writeJson('scheduleModuleNames', { AUD: 'AuD', KAPUTT: 42, LEER: '  ' });
    __resetModulnamenForTest();

    const { result } = renderHook(() => useModulnamen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.namen).toEqual({ AUD: 'AuD' });
  });
});
