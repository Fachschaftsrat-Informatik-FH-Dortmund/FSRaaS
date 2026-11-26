import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Meldung } from './api';
import {
  _zuruecksetzenFuerTests, abgleichen, angepinnteLesen, ordnen, umschalten, useAngepinnt,
  type AngepinnteMeldung,
} from './angepinnt';

const meldung = (id: string, tag: number, extra: Partial<Meldung> = {}): Meldung => ({
  id,
  titel: `Titel ${id}`,
  text: `Text ${id}`,
  veroeffentlichtAm: `2026-11-${String(tag).padStart(2, '0')}T10:00:00Z`,
  klassifizierung: 'fsr-news',
  quelle: 'FSR FB4',
  ...extra,
});

beforeEach(async () => {
  _zuruecksetzenFuerTests();
  await AsyncStorage.clear();
});

describe('Anpinnen und Ablösen einzelner Meldungen', () => {
  it('Meldung anpinnen: markiert sie und bietet denselben Weg zum Ablösen', async () => {
    const { result } = renderHook(() => useAngepinnt());
    const m = meldung('a', 1);

    act(() => result.current.umschalten(m));
    await waitFor(() => expect(result.current.istAngepinnt('a')).toBe(true));

    act(() => result.current.umschalten(m));
    await waitFor(() => expect(result.current.istAngepinnt('a')).toBe(false));
  });

  it('Anpinnen ist in einer zweiten Ansicht sofort sichtbar (Liste und Detail teilen den Stand)', async () => {
    const liste = renderHook(() => useAngepinnt());
    const detail = renderHook(() => useAngepinnt());
    act(() => detail.result.current.umschalten(meldung('a', 1)));
    await waitFor(() => expect(liste.result.current.istAngepinnt('a')).toBe(true));
  });
});

describe('Dauerhafte Anzeige angepinnter Meldungen', () => {
  it('Angepinnte Meldung nach Neustart: weiterhin oberhalb der übrigen, unabhängig vom Alter', async () => {
    const alt = meldung('alt', 1);
    const first = renderHook(() => useAngepinnt());
    act(() => first.result.current.umschalten(alt));
    await waitFor(async () => expect(await angepinnteLesen()).toHaveLength(1));

    // Neustart: Speicher bleibt, Prozesszustand nicht.
    _zuruecksetzenFuerTests();
    const second = renderHook(() => useAngepinnt());
    await waitFor(() => expect(second.result.current.istAngepinnt('alt')).toBe(true));

    // Die alte Meldung liegt auf keiner geladenen Seite mehr und steht trotzdem oben.
    const geladen = [meldung('neu1', 20), meldung('neu2', 19)];
    const { angepinnt, uebrige } = ordnen(geladen, second.result.current.pins);
    expect(angepinnt.map((p) => p.meldung.id)).toEqual(['alt']);
    expect(uebrige.map((m) => m.id)).toEqual(['neu1', 'neu2']);
  });

  it('eine angepinnte Meldung erscheint nicht zusätzlich unter den übrigen', () => {
    const m = meldung('a', 5);
    const pins = umschalten([], m);
    const { angepinnt, uebrige } = ordnen([meldung('b', 6), m], pins);
    expect(angepinnt.map((p) => p.meldung.id)).toEqual(['a']);
    expect(uebrige.map((x) => x.id)).toEqual(['b']);
  });

  it('ordnet angepinnte und übrige absteigend chronologisch, unlesbare Zeitpunkte zuletzt', () => {
    const pins = umschalten(umschalten([], meldung('p1', 2)), meldung('p2', 9));
    const { angepinnt, uebrige } = ordnen(
      [meldung('x', 3), meldung('y', 10), meldung('z', 1, { veroeffentlichtAm: null })],
      pins,
    );
    expect(angepinnt.map((p) => p.meldung.id)).toEqual(['p2', 'p1']);
    expect(uebrige.map((m) => m.id)).toEqual(['y', 'x', 'z']);
  });

  it('frischt die Kopie auf, wenn die Meldung in einer geladenen Seite korrigiert erscheint', () => {
    const pins = umschalten([], meldung('a', 1, { text: 'Tippfeler' }));
    const neu = abgleichen(pins, [meldung('a', 1, { text: 'Tippfehler' })], []);
    expect(neu[0]!.meldung.text).toBe('Tippfehler');
  });

  it('liefert dieselbe Referenz, wenn sich nichts ändert', () => {
    const pins = umschalten([], meldung('a', 1));
    expect(abgleichen(pins, [meldung('a', 1)], [])).toBe(pins);
    expect(abgleichen(pins, [], [])).toBe(pins);
  });
});

describe('Entfernen zurückgezogener Meldungen aus der Liste', () => {
  it('Angepinnte Meldung wird zurückgezogen: Verweis bleibt, als zurückgezogen gekennzeichnet', () => {
    const pins = umschalten([], meldung('a', 1));
    const neu = abgleichen(pins, [meldung('b', 2)], ['a']);
    expect(neu).toHaveLength(1);
    expect(neu[0]!.zurueckgezogen).toBe(true);
  });

  it('eine erneut veröffentlichte Meldung verliert die Kennzeichnung wieder', () => {
    const pins: AngepinnteMeldung[] = [
      { meldung: meldung('a', 1), angepinntAm: '2026-11-01T00:00:00Z', zurueckgezogen: true },
    ];
    const neu = abgleichen(pins, [meldung('a', 3)], []);
    expect(neu[0]!.zurueckgezogen).toBe(false);
    expect(neu[0]!.meldung.veroeffentlichtAm).toBe(meldung('a', 3).veroeffentlichtAm);
  });

  it('Gekennzeichneten Verweis ablösen: verschwindet aus der Liste', async () => {
    const { result } = renderHook(() => useAngepinnt());
    act(() => result.current.umschalten(meldung('a', 1)));
    await waitFor(() => expect(result.current.pins).toHaveLength(1));
    act(() => result.current.abgleichen([], ['a']));
    await waitFor(() => expect(result.current.pins[0]!.zurueckgezogen).toBe(true));

    act(() => result.current.loesen('a'));
    await waitFor(() => expect(result.current.pins).toHaveLength(0));
  });
});
