import { fireEvent, render, screen } from '@testing-library/react-native';
import { Modal, StyleSheet } from 'react-native';

import { ConfirmDialog } from './ConfirmDialog';

// Requirement „Bestätigungsdialoge als Pop-up" (Capability `ux-and-theming`).
// Die gemeinsame Primitive trägt die Festlegung für alle Ansichten; die
// umgestellten Ansichten prüfen nur noch, dass sie diese Primitive nutzen.

function rendere(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const bestaetigen = jest.fn();
  const abbrechen = jest.fn();
  const onDismiss = jest.fn();
  render(
    <ConfirmDialog
      visible
      message="Termin löschen?"
      actions={[
        { label: 'Löschen', variant: 'destructive', onPress: bestaetigen },
        { label: 'Abbrechen', onPress: abbrechen },
      ]}
      onDismiss={onDismiss}
      {...overrides}
    />,
  );
  return { bestaetigen, abbrechen, onDismiss };
}

describe('Bestätigungsdialoge als Pop-up', () => {
  it('Rückfrage vor einer zerstörenden Aktion: erscheint als Pop-up über der Ansicht', () => {
    const { bestaetigen } = rendere();
    const modal = screen.UNSAFE_getByType(Modal);
    expect(modal.props.visible).toBe(true);
    expect(modal.props.transparent).toBe(true);
    // Frage und Aktionen liegen im Modal, nicht im Seiteninhalt.
    expect(screen.getByRole('header', { name: 'Termin löschen?' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Löschen' }));
    expect(bestaetigen).toHaveBeenCalledTimes(1);
  });

  it('Rückfrage ohne zerstörende Wirkung: erscheint ebenfalls als Pop-up', () => {
    const modul = jest.fn();
    render(
      <ConfirmDialog
        visible
        message="Für alle Termine des Moduls übernehmen?"
        actions={[
          { label: 'Alle Termine des Moduls', variant: 'primary', onPress: modul },
          { label: 'Nur dieser Termin', onPress: () => {} },
        ]}
        onDismiss={() => {}}
      />,
    );
    expect(screen.UNSAFE_getByType(Modal).props.visible).toBe(true);
    fireEvent.press(screen.getByRole('button', { name: 'Alle Termine des Moduls' }));
    expect(modul).toHaveBeenCalledTimes(1);
  });

  it('Auslösender Bedienweg während der Rückfrage: der Hintergrund fängt Berührungen ab, ohne etwas zu entscheiden', () => {
    const { bestaetigen, abbrechen, onDismiss } = rendere();
    const hintergrund = screen.getByTestId('confirm-dialog-backdrop', { includeHiddenElements: true });
    // Der Hintergrund deckt die gesamte Ansicht ab und übernimmt jede Berührung.
    expect(StyleSheet.flatten(hintergrund.props.style)).toMatchObject({ position: 'absolute', top: 0, bottom: 0 });
    expect(hintergrund.props.onStartShouldSetResponder()).toBe(true);
    expect(bestaetigen).not.toHaveBeenCalled();
    expect(abbrechen).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('Zurück-Taste schließt den Dialog als Abbruch', () => {
    const { onDismiss, bestaetigen } = rendere();
    screen.UNSAFE_getByType(Modal).props.onRequestClose();
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(bestaetigen).not.toHaveBeenCalled();
  });

  it('ist nicht sichtbar, solange keine Rückfrage offen steht', () => {
    rendere({ visible: false });
    expect(screen.queryByText('Termin löschen?')).toBeNull();
  });

  it('mit Titel: der Titel ist Überschrift, die Frage folgt als Text', () => {
    rendere({ title: 'Plan leeren' });
    expect(screen.getByRole('header', { name: 'Plan leeren' })).toBeTruthy();
    expect(screen.getByText('Termin löschen?')).toBeTruthy();
  });
});
