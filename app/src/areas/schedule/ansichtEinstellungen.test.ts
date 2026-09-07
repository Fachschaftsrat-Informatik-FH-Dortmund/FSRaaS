import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  __resetAnsichtEinstellungenForTest,
  __resetAnsichtsstandForTest,
  anfangsAnsicht,
  readAnsichtEinstellungen,
  useAnsichtEinstellungen,
  useAnsichtsstand,
} from './ansichtEinstellungen';

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetAnsichtEinstellungenForTest();
  __resetAnsichtsstandForTest();
});

describe('SCHED-F-530 proportionale Zeitachse gegen kompakte Liste abschaltbar', () => {
  it('beginnt mit aktiver Zeitachse und lässt sich abschalten und wieder einschalten', async () => {
    const { result } = renderHook(() => useAnsichtEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.einstellungen.zeitachse).toBe(true);

    act(() => result.current.toggleZeitachse());
    await waitFor(() => expect(result.current.einstellungen.zeitachse).toBe(false));
    expect(await readAnsichtEinstellungen()).toMatchObject({ zeitachse: false });

    act(() => result.current.toggleZeitachse());
    await waitFor(() => expect(result.current.einstellungen.zeitachse).toBe(true));
  });
});

describe('SCHED-F-145 Schalter zum Ausblenden gruppenfremder Termine', () => {
  it('beginnt ausgeschaltet (gruppenfremde Termine bleiben sichtbar, SCHED-F-140) und lässt sich umschalten', async () => {
    const { result } = renderHook(() => useAnsichtEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.einstellungen.gruppenfremdeAusblenden).toBe(false);

    act(() => result.current.toggleGruppenfremdeAusblenden());
    await waitFor(() => expect(result.current.einstellungen.gruppenfremdeAusblenden).toBe(true));
  });
});

describe('SCHED-F-150 Sprung zum aktuellen Wochentag beim Öffnen', () => {
  it('beginnt aktiv und lässt sich abschalten, persistiert das', async () => {
    const { result } = renderHook(() => useAnsichtEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.einstellungen.sprungZuHeute).toBe(true);

    act(() => result.current.toggleSprungZuHeute());
    await waitFor(() => expect(result.current.einstellungen.sprungZuHeute).toBe(false));
    expect(await readAnsichtEinstellungen()).toMatchObject({ sprungZuHeute: false });
  });
});

describe('Schalter zum Abschalten aller Filter', () => {
  it('übergeht die gesetzten Filter, solange der Schalter aktiv ist', async () => {
    const { result } = renderHook(() => useAnsichtEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggleGruppenfremdeAusblenden());
    await waitFor(() => expect(result.current.einstellungen.gruppenfremdeAusblenden).toBe(true));
    expect(result.current.filter).toEqual({
      gruppenfremdeAusblenden: true,
      gueltigkeitszeitraumPruefen: true,
    });

    act(() => result.current.toggleAlleAnzeigen());
    await waitFor(() => expect(result.current.einstellungen.alleAnzeigen).toBe(true));
    expect(result.current.filter).toEqual({
      gruppenfremdeAusblenden: false,
      gueltigkeitszeitraumPruefen: false,
    });
  });

  it('lässt die zuvor gesetzten Filtereinstellungen nach dem Zurücknehmen unverändert weiterwirken', async () => {
    const { result } = renderHook(() => useAnsichtEinstellungen());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => result.current.toggleGruppenfremdeAusblenden());
    await waitFor(() => expect(result.current.einstellungen.gruppenfremdeAusblenden).toBe(true));

    act(() => result.current.toggleAlleAnzeigen());
    await waitFor(() => expect(result.current.einstellungen.alleAnzeigen).toBe(true));
    // Der gespeicherte Wert bleibt unangetastet, er wird nur übergangen.
    expect(result.current.einstellungen.gruppenfremdeAusblenden).toBe(true);
    expect(await readAnsichtEinstellungen()).toMatchObject({ gruppenfremdeAusblenden: true });

    act(() => result.current.toggleAlleAnzeigen());
    await waitFor(() => expect(result.current.einstellungen.alleAnzeigen).toBe(false));
    expect(result.current.filter).toEqual({
      gruppenfremdeAusblenden: true,
      gueltigkeitszeitraumPruefen: true,
    });
  });
});

describe('Sprung zum aktuellen Wochentag', () => {
  const heute = { wochenanfang: '2026-09-07', wochentag: 'Wed' } as const;
  const zuvor = { wochenanfang: '2026-08-31', wochentag: 'Fri' } as const;

  it('zeigt bei aktivierter Einstellung den aktuellen Wochentag', () => {
    expect(anfangsAnsicht(true, zuvor, heute)).toEqual(heute);
  });

  it('kehrt bei abgeschalteter Einstellung zur zuletzt betrachteten Woche und deren Wochentag zurück', () => {
    expect(anfangsAnsicht(false, zuvor, heute)).toEqual(zuvor);
  });

  it('zeigt bei abgeschalteter Einstellung ohne vorherigen Stand die laufende Woche und den aktuellen Wochentag', () => {
    expect(anfangsAnsicht(false, null, heute)).toEqual(heute);
  });

  it('merkt sich den betrachteten Stand über den Speicher hinweg', async () => {
    const { result } = renderHook(() => useAnsichtsstand());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.zuletztBetrachtet).toBeNull();

    act(() => result.current.merkeStand(zuvor));
    await waitFor(() => expect(result.current.zuletztBetrachtet).toEqual(zuvor));

    __resetAnsichtsstandForTest();
    const neu = renderHook(() => useAnsichtsstand());
    await waitFor(() => expect(neu.result.current.loaded).toBe(true));
    expect(neu.result.current.zuletztBetrachtet).toEqual(zuvor);
  });
});
