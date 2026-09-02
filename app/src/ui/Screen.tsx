import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/**
 * Grundgerüst jeder Bildschirmkomponente: sicherer Randbereich und
 * themenabhängiger Hintergrund an genau einer Stelle, statt in jedem Screen
 * wiederholt.
 */
export function Screen({
  children,
  scroll = false,
  center = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
}) {
  const { colors } = useTheme();
  const content = [styles.content, center && styles.center];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {scroll ? (
        <ScrollView style={styles.flex} contentContainerStyle={content}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 16, gap: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
