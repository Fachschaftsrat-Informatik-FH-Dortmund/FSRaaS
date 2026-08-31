import type { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, View,
  type PressableProps, type StyleProp, type ViewStyle,
} from 'react-native';

// Wiederkehrende Bedienelemente in einheitlicher Gestaltung (UX-F-130/F-140).
// Bedienelemente halten die Mindestgröße 44×44 dp ein (UX-N-020).

const HIT = 44;

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  ...rest
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
} & Omit<PressableProps, 'onPress' | 'children' | 'style'>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      {...rest}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && styles.buttonTextSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Einheitliche ganzflächige Meldung für Lade-, Leer-, Fehler- und Offline-
 * Zustände sowie das Zustimmungs-Gate. Das führende Symbol trägt die Bedeutung
 * zusätzlich zur Farbe (UX-F-070); Farbe allein wird nicht verwendet.
 */
export function MessageView({
  symbol,
  title,
  body,
  action,
  busy,
  style,
}: {
  symbol?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.message, style]} accessibilityLiveRegion="polite">
      {busy ? (
        <ActivityIndicator accessibilityLabel={title} />
      ) : symbol ? (
        <Text style={styles.symbol} accessibilityElementsHidden importantForAccessibility="no">
          {symbol}
        </Text>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: HIT,
    minWidth: HIT,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: '#FF6600' },
  buttonSecondary: { borderWidth: 1, borderColor: '#8A8A8E' },
  buttonPressed: { opacity: 0.7 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: '#1C1C1E' },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  symbol: { fontSize: 32 },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 15, textAlign: 'center', opacity: 0.8 },
  action: { marginTop: 12 },
});
