import { renderHook, act } from '@testing-library/react-native';

import { __resetWeiterAktionForTest, registriereWeiterAktion, useWeiterAktion } from './weiterAktion';

describe('Weiterführender Bedienweg in der Kopfzeile', () => {
  beforeEach(() => __resetWeiterAktionForTest());

  it('liefert null, solange kein Bildschirm einen Weiter-Weg angemeldet hat', () => {
    const { result } = renderHook(() => useWeiterAktion());
    expect(result.current).toBeNull();
  });

  it('gibt die angemeldete Aktion an die Kopfzeile weiter', () => {
    const weiter = jest.fn();
    const { result } = renderHook(() => useWeiterAktion());

    act(() => registriereWeiterAktion({ freigegeben: true, weiter }));

    expect(result.current?.freigegeben).toBe(true);
    result.current?.weiter();
    expect(weiter).toHaveBeenCalledTimes(1);
  });

  it('ersetzt die Aktion, wenn ein anderer Bildschirm anmeldet', () => {
    const ersteAktion = jest.fn();
    const zweiteAktion = jest.fn();
    const { result } = renderHook(() => useWeiterAktion());

    act(() => registriereWeiterAktion({ freigegeben: false, weiter: ersteAktion }));
    act(() => registriereWeiterAktion({ freigegeben: true, weiter: zweiteAktion }));

    expect(result.current?.freigegeben).toBe(true);
    result.current?.weiter();
    expect(ersteAktion).not.toHaveBeenCalled();
    expect(zweiteAktion).toHaveBeenCalledTimes(1);
  });

  it('liefert nach dem Abmelden wieder null', () => {
    const { result } = renderHook(() => useWeiterAktion());

    act(() => registriereWeiterAktion({ freigegeben: true, weiter: jest.fn() }));
    act(() => registriereWeiterAktion(null));

    expect(result.current).toBeNull();
  });
});
