import { render, screen, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppButton, MessageView } from './primitives';

// Gemeinsame Bedienelemente: einheitliche Fehler- und Ladeanzeige über alle
// Ansichten (UX-F-130 / UX-F-140), Mindestgröße 44×44 dp (UX-N-020) und
// Bedeutung nie allein über Farbe (UX-F-070).

describe('UX-N-020 Mindestgröße für Bedienelemente 44×44 dp', () => {
  it('AppButton hält die Mindesthöhe und -breite ein', () => {
    render(<AppButton label="Weiter" onPress={() => {}} />);
    const flat = StyleSheet.flatten(screen.getByRole('button', { name: 'Weiter' }).props.style);
    expect(flat.minHeight).toBe(44);
    expect(flat.minWidth).toBe(44);
  });
});

describe('UX-F-140 Einheitliche Ladeanzeige über alle Ansichten', () => {
  it('MessageView im busy-Zustand zeigt eine mit dem Titel beschriftete Ladeanzeige', () => {
    render(<MessageView busy title="Wird geladen …" />);
    // Eine einzige, mit dem Titel benannte Ladeanzeige — dieselbe Affordanz,
    // die AsyncStates für den Ladezustand rendert.
    expect(screen.getByLabelText('Wird geladen …')).toBeTruthy();
    expect(screen.getByText('Wird geladen …')).toBeTruthy();
  });
});

describe('UX-F-130 Einheitliche Fehleranzeige über alle Ansichten', () => {
  it('MessageView stellt Fehler mit Symbol, Titel, Text und Aktion in fester Struktur dar', () => {
    const onPress = jest.fn();
    render(
      <MessageView
        symbol="⚠"
        title="Etwas ist schiefgelaufen"
        body="Bitte später erneut versuchen."
        action={<AppButton label="Erneut versuchen" onPress={onPress} />}
      />,
    );
    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeTruthy();
    expect(screen.getByText('Bitte später erneut versuchen.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('UX-F-070 Bedeutung nicht allein über Farbe', () => {
  it('der Zustand ist als Klartext erkennbar, das dekorative Symbol ist für die Barrierefreiheit ausgeblendet', () => {
    render(<MessageView symbol="⊘" title="Keine Verbindung" />);
    expect(screen.getByText('Keine Verbindung')).toBeTruthy();
    const symbol = screen.getByText('⊘', { includeHiddenElements: true });
    expect(symbol.props.importantForAccessibility).toBe('no');
  });

  it('AppButton benennt seinen deaktivierten Zustand für die Barrierefreiheit statt nur visuell', () => {
    render(<AppButton label="Senden" onPress={() => {}} disabled />);
    const button = screen.getByRole('button', { name: 'Senden' });
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });
});
