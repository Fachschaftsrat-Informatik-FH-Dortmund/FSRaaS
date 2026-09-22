import { useEffect as mockUseEffect } from 'react';
import { renderHook, act } from '@testing-library/react-native';

import {
  __leseWeiterAktionForTest,
  __resetWeiterAktionForTest,
  meldeWeiterAktionAb,
  navigiereNachAbmeldung,
  registriereWeiterAktion,
  useWeiterAktion,
  useWeiterAktionAnmelden,
} from './weiterAktion';

// `useFocusEffect` (expo-router) verhält sich hier wie `useEffect`: Ohne echten
// Navigations-Stapel gibt es keinen Fokuswechsel zu simulieren — der Bildschirm
// ist beim Rendern schlicht fokussiert. Gleiche Vertretung wie in den
// Bildschirmtests.
jest.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => mockUseEffect(effect, [effect]),
}));

// Marke eines anmeldenden Bildschirms; im Betrieb ein `useRef`-Objekt.
const marke = () => ({});

beforeEach(() => {
  jest.clearAllMocks();
  __resetWeiterAktionForTest();
});

describe('Weiterführender Bedienweg in der Kopfzeile', () => {
  it('liefert null, solange kein Bildschirm einen Weiter-Weg angemeldet hat', () => {
    const { result } = renderHook(() => useWeiterAktion());
    expect(result.current).toBeNull();
  });

  it('gibt die angemeldete Aktion an die Kopfzeile weiter', () => {
    const weiter = jest.fn();
    const { result } = renderHook(() => useWeiterAktion());

    act(() => registriereWeiterAktion(marke(), { freigegeben: true, weiter }));

    expect(result.current?.freigegeben).toBe(true);
    result.current?.weiter();
    expect(weiter).toHaveBeenCalledTimes(1);
  });

  it('ersetzt die Aktion, wenn ein anderer Bildschirm anmeldet', () => {
    const ersteAktion = jest.fn();
    const zweiteAktion = jest.fn();
    const { result } = renderHook(() => useWeiterAktion());

    act(() => registriereWeiterAktion(marke(), { freigegeben: false, weiter: ersteAktion }));
    act(() => registriereWeiterAktion(marke(), { freigegeben: true, weiter: zweiteAktion }));

    expect(result.current?.freigegeben).toBe(true);
    result.current?.weiter();
    expect(ersteAktion).not.toHaveBeenCalled();
    expect(zweiteAktion).toHaveBeenCalledTimes(1);
  });

  it('liefert nach dem Abmelden wieder null', () => {
    const eigene = marke();
    const { result } = renderHook(() => useWeiterAktion());

    act(() => registriereWeiterAktion(eigene, { freigegeben: true, weiter: jest.fn() }));
    act(() => meldeWeiterAktionAb(eigene));

    expect(result.current).toBeNull();
  });
});

// Change `weiter-bedienweg-absturzschutz`, design.md Entscheidung 1: Beim
// Vorwärtsnavigieren meldet der nachfolgende Bildschirm an, bevor der vorige
// den Fokus verliert. Ohne Besitzermarke löschte dessen Aufräumschritt den
// frischen Eintrag — genau der Befund „Weiter-Symbol verwaist", den der
// vorangegangene Change beheben sollte.
describe('Besitzermarke am gemeinsamen Register', () => {
  it('ein nachträglich abmeldender Vorgänger löscht den Eintrag des Nachfolgers nicht', () => {
    const vorgaenger = marke();
    const nachfolger = marke();
    const nachfolgerWeiter = jest.fn();
    const { result } = renderHook(() => useWeiterAktion());

    act(() => registriereWeiterAktion(vorgaenger, { freigegeben: false, weiter: jest.fn() }));
    act(() => registriereWeiterAktion(nachfolger, { freigegeben: true, weiter: nachfolgerWeiter }));
    // Blur des Vorgängers — läuft erst jetzt, nach der Anmeldung des Nachfolgers.
    act(() => meldeWeiterAktionAb(vorgaenger));

    expect(result.current?.freigegeben).toBe(true);
    result.current?.weiter();
    expect(nachfolgerWeiter).toHaveBeenCalledTimes(1);
  });

  it('benachrichtigt die Kopfzeile nicht, wenn ein Fremder abmeldet', () => {
    const eigentuemer = marke();
    let renderZaehler = 0;
    const { result } = renderHook(() => {
      renderZaehler += 1;
      return useWeiterAktion();
    });

    act(() => registriereWeiterAktion(eigentuemer, { freigegeben: true, weiter: jest.fn() }));
    const nachAnmeldung = renderZaehler;

    act(() => meldeWeiterAktionAb(marke()));

    expect(renderZaehler).toBe(nachAnmeldung);
    expect(result.current?.freigegeben).toBe(true);
  });
});

// Change `weiter-bedienweg-absturzschutz`, design.md Entscheidung 2: dieselbe
// Trennung wie beim Sichern im Planungsmodus — die Kopfzeilen-Mutation ist
// committet, bevor die Fragment-Transaktion der Navigation beginnt.
describe('Navigation einen Frame nach dem Abmelden', () => {
  it('räumt den Eintrag sofort ab und navigiert erst im nächsten Frame', () => {
    const rahmen: (() => void)[] = [];
    jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation(((cb: FrameRequestCallback) => {
        rahmen.push(() => cb(0));
        return 0;
      }) as typeof requestAnimationFrame);

    const navigiere = jest.fn();
    act(() => registriereWeiterAktion(marke(), { freigegeben: true, weiter: jest.fn() }));

    act(() => navigiereNachAbmeldung(navigiere));

    // Kopfzeile ist bereits leer, die Navigation steht noch aus.
    expect(__leseWeiterAktionForTest()).toBeNull();
    expect(navigiere).not.toHaveBeenCalled();

    act(() => rahmen.forEach((f) => f()));
    expect(navigiere).toHaveBeenCalledTimes(1);
  });

  it('navigiert auch dann, wenn nichts angemeldet ist', () => {
    const rahmen: (() => void)[] = [];
    jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation(((cb: FrameRequestCallback) => {
        rahmen.push(() => cb(0));
        return 0;
      }) as typeof requestAnimationFrame);

    const navigiere = jest.fn();
    act(() => navigiereNachAbmeldung(navigiere));
    act(() => rahmen.forEach((f) => f()));

    expect(navigiere).toHaveBeenCalledTimes(1);
  });
});

// Change `weiter-bedienweg-absturzschutz`, design.md Entscheidung 3: derselbe
// An-/Abmeldeablauf für alle drei Bildschirme, einmal statt dreimal.
describe('Gemeinsame Anmeldung des Bedienwegs', () => {
  it('meldet den Weg beim Fokussieren an und beim Verlassen wieder ab', () => {
    const weiter = jest.fn();
    const { unmount } = renderHook(() => useWeiterAktionAnmelden(true, weiter));

    expect(__leseWeiterAktionForTest()?.freigegeben).toBe(true);
    __leseWeiterAktionForTest()?.weiter();
    expect(weiter).toHaveBeenCalledTimes(1);

    unmount();
    expect(__leseWeiterAktionForTest()).toBeNull();
  });

  it('meldet bei geänderter Freigabe erneut an', () => {
    const weiter = jest.fn();
    const { rerender } = renderHook(({ frei }: { frei: boolean }) => useWeiterAktionAnmelden(frei, weiter), {
      initialProps: { frei: false },
    });

    expect(__leseWeiterAktionForTest()?.freigegeben).toBe(false);
    rerender({ frei: true });
    expect(__leseWeiterAktionForTest()?.freigegeben).toBe(true);
  });

  it('lässt den Eintrag eines zweiten Bildschirms stehen, wenn der erste danach verlassen wird', () => {
    const ersterWeiter = jest.fn();
    const zweiterWeiter = jest.fn();
    const erster = renderHook(() => useWeiterAktionAnmelden(false, ersterWeiter));
    renderHook(() => useWeiterAktionAnmelden(true, zweiterWeiter));

    // Der erste Bildschirm bleibt im Stapel stehen und verliert erst jetzt den Fokus.
    erster.unmount();

    expect(__leseWeiterAktionForTest()?.freigegeben).toBe(true);
    __leseWeiterAktionForTest()?.weiter();
    expect(zweiterWeiter).toHaveBeenCalledTimes(1);
    expect(ersterWeiter).not.toHaveBeenCalled();
  });
});
