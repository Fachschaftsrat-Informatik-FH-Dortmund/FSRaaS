import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme } from '@/theme';
import { useWeiterAktion } from '../weiterAktion';

// Requirement „Weiterführender Bedienweg in der Kopfzeile": ein einziges
// Kopfzeilen-Symbol für die Einrichtung, die Modulauswahl und den Schritt zur
// Gruppenkennung, gespeist aus `weiterAktion.ts` (design.md, Entscheidung 2).
// Außerhalb dieser drei Bildschirme liefert `useWeiterAktion` `null`, die
// Schaltfläche verschwindet dann vollständig.
//
// Issue #124: Verschwunden ist dabei nur die Schaltfläche, nie der Platz. Der
// Weiter-Weg meldet sich beim Antippen vor der Navigation ab (Change
// `weiter-bedienweg-absturzschutz`, Entscheidung 2) und nach „Zurück" wieder
// an. Rendert die Kopfzeilen-Komponente dazwischen `null`, schrumpft die native
// headerRight-Ansicht von react-native-screens auf Android auf 0×0 und wird beim
// erneuten Füllen nicht neu vermessen — das Symbol bleibt unsichtbar, obwohl
// der Eintrag im Register steht. Ein Platzhalter gleicher Größe hält die
// Ansicht vermessen; für Bedienungshilfen ist er unsichtbar.
//
// Ohne Freigabe bleibt sie sichtbar und bedienbar: Was ein Antippen dann tut,
// entscheidet der Bildschirm. Der Schritt zur Gruppenkennung benennt die
// fehlende Angabe, statt wortlos nichts zu tun. Der zurückgenommene Zustand
// steht zusätzlich zur Farbe im `accessibilityState` — nie allein über Farbe
// (UX-F-070).
export function WeiterZugang() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const aktion = useWeiterAktion();

  if (!aktion) {
    return (
      <View
        testID="weiter-zugang-platzhalter"
        style={styles.zugang}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !aktion.freigegeben }}
      accessibilityLabel={t('schedule.weiterZumNaechstenSchritt')}
      onPress={aktion.weiter}
      style={styles.zugang}
      hitSlop={8}
    >
      <Ionicons name="arrow-forward" size={22} color={aktion.freigegeben ? colors.accent : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zugang: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
