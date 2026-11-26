import { useRef } from 'react';
import {
  AccessibilityInfo, Modal, Platform, StyleSheet, Text, View, findNodeHandle,
} from 'react-native';

import { useTheme } from '@/theme';
import { AppButton } from './primitives';
import { useReducedMotion } from './reducedMotion';

// Requirement „Bestätigungsdialoge als Pop-up" (Capability `ux-and-theming`):
// Jede Rückfrage, die vor einer Aktion eine Entscheidung verlangt, erscheint
// über der Ansicht — nie als Abschnitt im Seiteninhalt. Gestaltung und
// Begründung: openspec/changes/bestaetigung-als-popup/design.md.
//
// Die Primitive enthält keine eigene Zeichenkette; Frage und Beschriftungen
// übergibt die aufrufende Ansicht aus ihren i18n-Schlüsseln.

export type ConfirmDialogAction = {
  label: string;
  onPress: () => void;
  /** Wie {@link AppButton}; eine zerstörende Aktion ist `destructive`, nie `primary`. */
  variant?: 'primary' | 'secondary' | 'destructive';
};

export function ConfirmDialog({
  visible,
  title,
  message,
  actions,
  onDismiss,
}: {
  visible: boolean;
  title?: string;
  message: string;
  /** In der angezeigten Reihenfolge, untereinander. */
  actions: ConfirmDialogAction[];
  /**
   * Schließen ohne Antwort (Zurück-Taste, Escape). Die Ansicht behandelt es als
   * Abbruch. Ein Tipp auf den Hintergrund schließt bewusst nicht (design.md,
   * Entscheidung 3).
   */
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const kopfRef = useRef<Text>(null);

  // Vorlesefokus auf die Frage (bzw. den Titel), sobald der Dialog steht
  // (design.md, Entscheidung 5). Im Web führt `Modal` den Fokus selbst.
  function fokusSetzen() {
    if (Platform.OS === 'web') return;
    const tag = kopfRef.current ? findNodeHandle(kopfRef.current) : null;
    if (tag !== null) AccessibilityInfo.setAccessibilityFocus(tag);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onDismiss}
      onShow={fokusSetzen}
      statusBarTranslucent
    >
      {/*
        Der Hintergrund fängt Berührungen ab, damit der auslösende Bedienweg
        während der Rückfrage nicht erneut auslösbar ist; er ist für den
        Vorleser ausgeblendet.
      */}
      <View
        testID="confirm-dialog-backdrop"
        style={[styles.hintergrund, { backgroundColor: colors.scrim }]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        onStartShouldSetResponder={() => true}
      />
      <View style={styles.mitte} pointerEvents="box-none">
        <View
          accessibilityViewIsModal
          style={[styles.karte, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {title ? (
            <Text ref={kopfRef} accessibilityRole="header" style={[styles.titel, { color: colors.text }]}>
              {title}
            </Text>
          ) : null}
          <Text
            ref={title ? undefined : kopfRef}
            accessibilityRole={title ? undefined : 'header'}
            style={[title ? styles.frage : styles.titel, { color: colors.text }]}
          >
            {message}
          </Text>
          <View style={styles.aktionen}>
            {actions.map((aktion) => (
              <AppButton
                key={aktion.label}
                label={aktion.label}
                variant={aktion.variant ?? 'secondary'}
                onPress={aktion.onPress}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hintergrund: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  mitte: { flex: 1, justifyContent: 'center', padding: 24 },
  karte: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    gap: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  titel: { fontSize: 17, fontWeight: '600' },
  frage: { fontSize: 16 },
  aktionen: { gap: 10, marginTop: 4 },
});
