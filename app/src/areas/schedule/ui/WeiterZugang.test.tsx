import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { WeiterZugang } from './WeiterZugang';
import { ModulauswahlVerwerfenZugang } from './ModulauswahlVerwerfenZugang';
import { __resetWeiterAktionForTest, registriereWeiterAktion } from '../weiterAktion';
import { __resetModulauswahlAktionForTest, registriereModulauswahlAktion } from '../modulauswahlAktion';

beforeEach(() => {
  jest.clearAllMocks();
  __resetWeiterAktionForTest();
  __resetModulauswahlAktionForTest();
});

function renderZugang() {
  return render(
    <ThemeProvider>
      <WeiterZugang />
    </ThemeProvider>,
  );
}

describe('Weiterführender Bedienweg in der Kopfzeile', () => {
  it('zeigt nichts an, solange kein Bildschirm mit Weiter-Weg geöffnet ist', () => {
    renderZugang();
    expect(screen.queryByLabelText('Weiter zum nächsten Schritt')).toBeNull();
  });

  it('bietet den Weg als Symbol an, sobald ein Bildschirm ihn anmeldet', () => {
    const weiter = jest.fn();
    renderZugang();
    act(() => registriereWeiterAktion({ freigegeben: true, weiter }));

    const zugang = screen.getByLabelText('Weiter zum nächsten Schritt');
    expect(zugang.props.accessibilityState?.disabled).toBe(false);
    expect(screen.getByText('arrow-forward')).toBeTruthy();

    fireEvent.press(zugang);
    expect(weiter).toHaveBeenCalledTimes(1);
  });

  it('bleibt ohne Freigabe bedienbar, damit der Bildschirm die fehlende Angabe benennen kann', () => {
    const weiter = jest.fn();
    renderZugang();
    act(() => registriereWeiterAktion({ freigegeben: false, weiter }));

    const zugang = screen.getByLabelText('Weiter zum nächsten Schritt');
    // Der zurückgenommene Zustand steht im accessibilityState, nicht allein in
    // der Farbe (UX-F-070) — der Druck erreicht den Bildschirm trotzdem.
    expect(zugang.props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(zugang);
    expect(weiter).toHaveBeenCalledTimes(1);
  });
});

describe('Symbol für das Zurücksetzen der Auswahl', () => {
  it('Zurücksetzen in der Kopfzeile: trägt ein Symbol, das das Zurücksetzen bezeichnet', () => {
    render(
      <ThemeProvider>
        <ModulauswahlVerwerfenZugang />
      </ThemeProvider>,
    );
    act(() => registriereModulauswahlAktion({ verwerfen: jest.fn() }));

    expect(screen.getByLabelText('Auswahl verwerfen')).toBeTruthy();
    expect(screen.getByText('refresh')).toBeTruthy();
    // Nicht mehr das Kreuz, das ein Schließen bezeichnet.
    expect(screen.queryByText('close')).toBeNull();
  });

  it('unterscheidet sich vom Symbol des weiterführenden Wegs, der daneben steht', () => {
    render(
      <ThemeProvider>
        <ModulauswahlVerwerfenZugang />
        <WeiterZugang />
      </ThemeProvider>,
    );
    act(() => {
      registriereModulauswahlAktion({ verwerfen: jest.fn() });
      registriereWeiterAktion({ freigegeben: true, weiter: jest.fn() });
    });

    expect(screen.getByText('refresh')).toBeTruthy();
    expect(screen.getByText('arrow-forward')).toBeTruthy();
  });
});
