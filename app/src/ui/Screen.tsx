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
  tight = false,
  hideScrollbar = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  /** Vertikalen Rollbalken ausblenden — bei Listen mit umrandeten Karten, wo er sonst über den Rand läuft. */
  hideScrollbar?: boolean;
  /**
   * Für Ansichten mit eigener Kopfzeile direkt darüber (Stack-Header): kein
   * zusätzlicher oberer Sicherheitsabstand — den trägt bereits die Kopfzeile,
   * sonst entsteht ein Leerband unter dem Titel — und weniger Abstand nach oben.
   */
  tight?: boolean;
}) {
  const { colors } = useTheme();
  const content = [styles.content, tight && styles.tight, center && styles.center];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={tight ? ['left', 'right'] : ['top', 'left', 'right']}
    >
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={content}
          showsVerticalScrollIndicator={!hideScrollbar}
        >
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
  tight: { paddingTop: 8, gap: 10 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
