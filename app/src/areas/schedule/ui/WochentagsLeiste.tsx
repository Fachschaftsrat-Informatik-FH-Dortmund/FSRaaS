import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import type { Weekday } from '../typen';

// Requirement „Wochentagsleiste über die volle Bildschirmbreite": gemeinsame
// Komponente für Wochenansicht und Planungsmodus (design.md, Entscheidung 8).
// `flexDirection: 'row'` mit `flex: 1` je Eintrag statt eines waagerechten
// Scrolls — die Breite verteilt sich gleichmäßig auf die dargestellten Tage,
// unabhängig von ihrer Zahl. Der Inhalt eines Eintrags ist je Bildschirm
// verschieden (`inhalt`), Aufteilung und Mindesthöhe von 44 dp sind es nicht.

export interface WochentagsLeisteEintrag {
  wochentag: Weekday;
  /** Zugängliche Beschriftung des gesamten Eintrags (Requirement „Beschriftung für Bildschirmvorleser"). */
  accessibilityLabel: string;
  inhalt: React.ReactNode;
}

export function WochentagsLeiste({
  eintraege,
  aktiverWochentag,
  onWaehle,
}: {
  eintraege: readonly WochentagsLeisteEintrag[];
  aktiverWochentag: Weekday;
  onWaehle: (wochentag: Weekday) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.leiste}>
      {eintraege.map(({ wochentag, accessibilityLabel, inhalt }) => {
        const aktiv = wochentag === aktiverWochentag;
        return (
          <Pressable
            key={wochentag}
            accessibilityRole="tab"
            accessibilityState={{ selected: aktiv }}
            accessibilityLabel={accessibilityLabel}
            onPress={() => onWaehle(wochentag)}
            style={[
              styles.eintrag,
              { borderColor: colors.border },
              aktiv && styles.eintragAktiv,
              aktiv && { backgroundColor: colors.accent, borderColor: colors.accent },
            ]}
          >
            {inhalt}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  leiste: { flexDirection: 'row' },
  eintrag: {
    flex: 1,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  // UX-F-070: Der gewählte Tag ist zusätzlich zur Farbfläche an der dickeren
  // unteren Kante erkennbar — die Auswahl hängt nicht allein an der Farbe.
  eintragAktiv: { borderBottomWidth: 4 },
});
