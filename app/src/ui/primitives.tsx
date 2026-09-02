import type { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, View,
  type PressableProps, type StyleProp, type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';

// Wiederkehrende Bedienelemente in einheitlicher Gestaltung (UX-F-130/F-140).
// Bedienelemente halten die Mindestgröße 44×44 dp ein (UX-N-020). Farben kommen
// ausschließlich aus dem Farbsystem (UX-F-010), nie als feste Hex-Werte.

const HIT = 44;

/**
 * `primary` ist die einzige hervorgehobene Variante (Akzentfläche). Eine
 * zerstörende Aktion nutzt `destructive` (Warnfarbe als Text, ohne Akzentfläche)
 * und ist damit nie die hervorgehobene Primäraktion (UX-F-180 / UX-F-185).
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  ...rest
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
} & Omit<PressableProps, 'onPress' | 'children' | 'style'>) {
  const { colors } = useTheme();
  const highlighted = variant === 'primary';
  const textColor = highlighted
    ? colors.onAccent
    : variant === 'destructive'
      ? colors.danger
      : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        highlighted
          ? { backgroundColor: colors.accent }
          : { borderWidth: 1, borderColor: variant === 'destructive' ? colors.danger : colors.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Auswahl aus wenigen sich ausschließenden Optionen (z. B. Erscheinungsbild,
 * Sprache). Die aktive Option ist zusätzlich zur Farbe durch ihren
 * Barrierefreiheits-Zustand `selected` und ein vorangestelltes Häkchen
 * erkennbar (UX-F-070); jede Option ist ≥ 44 dp hoch (UX-N-020).
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.segmentGroup, { borderColor: colors.border }]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              { borderColor: colors.border },
              active && { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? colors.onAccent : colors.text },
              ]}
            >
              {active ? '✓ ' : ''}
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Wie {@link SegmentedControl}, aber als senkrechte Liste — für mehr Optionen,
 * als nebeneinander lesbar sind (z. B. Wahl der Startansicht). Aktive Option
 * zusätzlich zur Farbe durch `selected` und ein Häkchen erkennbar (UX-F-070),
 * jede Zeile ≥ 44 dp (UX-N-020).
 */
export function RadioList<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.radioGroup}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.radioRow, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.radioMark, { color: active ? colors.accent : colors.border }]}>
              {active ? '●' : '○'}
            </Text>
            <Text style={[styles.radioLabel, { color: colors.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
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
  const { colors } = useTheme();
  return (
    <View
      style={[styles.message, { backgroundColor: colors.background }, style]}
      accessibilityLiveRegion="polite"
    >
      {busy ? (
        <ActivityIndicator accessibilityLabel={title} color={colors.accent} />
      ) : symbol ? (
        <Text
          style={styles.symbol}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {symbol}
        </Text>
      ) : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {body ? <Text style={[styles.body, { color: colors.textMuted }]}>{body}</Text> : null}
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
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  segmentGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: HIT,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  segmentText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  radioGroup: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'transparent' },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  radioMark: { fontSize: 16, width: 20, textAlign: 'center' },
  radioLabel: { fontSize: 16, flex: 1 },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  symbol: { fontSize: 32 },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 15, textAlign: 'center' },
  action: { marginTop: 12 },
});
