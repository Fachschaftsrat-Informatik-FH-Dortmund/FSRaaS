import { Fragment } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { moreAreasByGroup } from '@/navigation/navMap';
import { useTheme } from '@/theme';
import { Screen } from '@/ui/Screen';

// Sammel-Einstieg „Mehr" (SHELL-F-010): nach Themen gruppierte Liste aller
// Bereiche außerhalb der Tab-Leiste (SHELL-F-090). Bereiche künftiger
// Ausbaustufen erscheinen erst mit ihrer Umsetzung — keine ausgegrauten
// Einträge. Jeder Eintrag ist ein sichtbarer Bedienweg (keine Geste, UX-F-090)
// und ≥ 44 dp hoch (UX-N-020).
export function MoreScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen scroll>
      {moreAreasByGroup().map((section) => (
        <Fragment key={section.group}>
          <Text style={[styles.groupHeader, { color: colors.textMuted }]}>
            {t(section.titleKey)}
          </Text>
          {section.areas.map((area) => (
            // `Link` selbst als Textzeile gestalten, nicht `asChild` mit einem
            // `<Text>`-Kind: das Zusammenführen der Stile über die Slot-Mechanik
            // zerlegt das Style-Array und verwirft dabei `color` — im Dunkelmodus
            // erschiene der Eintrag dann dunkel auf dunklem Grund.
            <Link
              key={area.key}
              href={area.href}
              accessibilityRole="link"
              style={[styles.row, { color: colors.text, borderBottomColor: colors.border }]}
            >
              {t(area.titleKey)}
            </Link>
          ))}
        </Fragment>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  row: {
    minHeight: 44,
    paddingVertical: 14,
    fontSize: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
