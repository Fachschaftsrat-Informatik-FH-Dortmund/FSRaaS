import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { logError } from '@/errors/AppError';
import { useTheme } from '@/theme';
import { AppButton } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useMensen, type Mensa } from '../api';
import { useCanteenSelection } from '../selection';

// MENSA-F-020 / MENSA-F-025 (SET-F-030 / SET-F-150): Auswahl der angezeigten
// Mensen aus der vom Backend gelieferten Liste und ihre Reihenfolge.

export function CanteenSelectionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mensen, istAusgangsbestand, query } = useMensen();
  const { ids, toggle, move } = useCanteenSelection();

  const gewaehlt = ids
    .map((id) => mensen.find((m) => m.id === id))
    .filter((m): m is Mensa => m !== undefined);
  const uebrige = mensen
    .filter((m) => !ids.includes(m.id))
    .sort((a, b) => a.reihenfolge - b.reihenfolge);

  const inhalt = (
    <Screen scroll>
      {istAusgangsbestand ? <Hinweis text={t('mensa.ausgangsbestandHinweis')} /> : null}

      {gewaehlt.length > 0 ? (
        <Abschnitt titel={t('mensa.gewaehlteMensen')}>
          {gewaehlt.map((m, i) => (
            <Zeile key={m.id} mensa={m}>
              <Ordnen
                labelHoch={t('mensa.nachOben')}
                labelRunter={t('mensa.nachUnten')}
                obenMoeglich={i > 0}
                untenMoeglich={i < gewaehlt.length - 1}
                onHoch={() => move(m.id, -1)}
                onRunter={() => move(m.id, 1)}
              />
              <Switch
                value
                onValueChange={() => toggle(m.id)}
                accessibilityLabel={m.name}
              />
            </Zeile>
          ))}
        </Abschnitt>
      ) : null}

      <Abschnitt titel={t('mensa.weitereMensen')}>
        {uebrige.map((m) => (
          <Zeile key={m.id} mensa={m}>
            <Switch value={false} onValueChange={() => toggle(m.id)} accessibilityLabel={m.name} />
          </Zeile>
        ))}
      </Abschnitt>

      {gewaehlt.length > 0 ? (
        <View style={styles.fertig}>
          <AppButton label={t('common.done')} onPress={() => router.back()} />
        </View>
      ) : null}
    </Screen>
  );

  // Bei erfolgreichem Laden oder Ausgangsbestand direkt anzeigen; nur der reine
  // Ladezustand ohne jede Liste geht über AsyncStates.
  if (mensen.length > 0) return inhalt;
  return (
    <Screen>
      <AsyncStates query={query} isEmpty={() => false} emptyNextStep={t('mensa.keineMensenHinweis')}>
        {() => inhalt}
      </AsyncStates>
    </Screen>
  );
}

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.abschnitt}>
      <Text style={[styles.abschnittTitel, { color: colors.textMuted }]}>{titel}</Text>
      {children}
    </View>
  );
}

function Zeile({ mensa, children }: { mensa: Mensa; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.zeile, { borderBottomColor: colors.border }]}>
      <View style={styles.nameSpalte}>
        <Text style={[styles.name, { color: colors.text }]}>{mensa.name}</Text>
        <Standort mensa={mensa} />
      </View>
      <View style={styles.aktionen}>{children}</View>
    </View>
  );
}

/**
 * Standortangaben der Mensa (Requirement „Standortangaben der Mensa"): Anschrift,
 * Beschreibung und ein Kartenverweis, aus INT-020 durchgereicht. Fehlt eine
 * dieser Angaben, entfällt sie ersatzlos, ohne dass die übrigen ausbleiben.
 */
function Standort({ mensa }: { mensa: Mensa }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { anschrift, beschreibung, kartenUrl } = mensa;

  if (!anschrift && !beschreibung && !kartenUrl) return null;

  return (
    <View style={styles.standort}>
      {beschreibung ? (
        <Text style={[styles.standortText, { color: colors.textMuted }]}>{beschreibung}</Text>
      ) : null}
      {anschrift ? (
        <Text style={[styles.standortText, { color: colors.textMuted }]}>{anschrift}</Text>
      ) : null}
      {kartenUrl ? (
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            Linking.openURL(kartenUrl).catch((e) => logError('canteen.openMaps', e))
          }
        >
          <Text style={[styles.standortLink, { color: colors.accent }]}>
            {t('mensa.kartenLink')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Ordnen({
  labelHoch,
  labelRunter,
  obenMoeglich,
  untenMoeglich,
  onHoch,
  onRunter,
}: {
  labelHoch: string;
  labelRunter: string;
  obenMoeglich: boolean;
  untenMoeglich: boolean;
  onHoch: () => void;
  onRunter: () => void;
}) {
  const { colors } = useTheme();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labelHoch}
        accessibilityState={{ disabled: !obenMoeglich }}
        disabled={!obenMoeglich}
        onPress={onHoch}
        style={styles.ordnenKnopf}
      >
        <Text style={{ color: obenMoeglich ? colors.text : colors.border, fontSize: 18 }}>▲</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labelRunter}
        accessibilityState={{ disabled: !untenMoeglich }}
        disabled={!untenMoeglich}
        onPress={onRunter}
        style={styles.ordnenKnopf}
      >
        <Text style={{ color: untenMoeglich ? colors.text : colors.border, fontSize: 18 }}>▼</Text>
      </Pressable>
    </>
  );
}

function Hinweis({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.hinweis, { backgroundColor: colors.banner }]}>
      <Text style={[styles.hinweisText, { color: colors.onBanner }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  abschnitt: { gap: 4 },
  abschnittTitel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  zeile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nameSpalte: { flex: 1, gap: 2 },
  name: { fontSize: 16 },
  standort: { gap: 1 },
  standortText: { fontSize: 12 },
  standortLink: { fontSize: 12, fontWeight: '600' },
  aktionen: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ordnenKnopf: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  hinweis: { padding: 10, borderRadius: 8 },
  hinweisText: { fontSize: 13 },
  fertig: { marginTop: 8 },
});
