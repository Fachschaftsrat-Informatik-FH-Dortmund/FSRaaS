import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useOnlineStatus } from '@/state/useOnlineStatus';
import { SegmentedControl } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { RaumOffline } from '../ui/bausteine';
import { BesetztMeldenPerKennung, BesetztWarteschlange } from '../ui/BesetztMeldung';
import { FreieRaeumeSicht } from '../ui/FreieRaeumeSicht';
import { LaufendSicht } from '../ui/LaufendSicht';
import { UebersichtSicht } from '../ui/UebersichtSicht';

// Raum-Bereich (Capability `room-finder`, Roadmap-Schritt 6): drei Sichten auf
// denselben Raumplan-Zwischenspeicher, gewechselt innerhalb des Tabs
// (Requirement „Wechsel zwischen den drei Sichten"). Ohne Netz ist der Bereich
// als nicht verfügbar gekennzeichnet, auch mit Zwischenspeicher (Capability
// `architecture`, Requirement „Raumsuche offline nicht verfügbar"). Einzige
// Ausnahme: Eine Besetzt-Meldung lässt sich auch offline abgeben und wartet in
// der Offline-Schreib-Warteschlange (Change `besetzt-meldungen`).

export type Sicht = 'frei' | 'uebersicht' | 'laufend';
const SICHTEN: Sicht[] = ['frei', 'uebersicht', 'laufend'];

export function RoomFinderScreen() {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const [sicht, setSicht] = useState<Sicht>('frei');

  return (
    <Screen tight>
      <View style={styles.fill}>
        <View style={styles.sichtwahl}>
          <SegmentedControl
            label={t('raum.sichtLabel')}
            options={SICHTEN.map((s) => ({ value: s, label: t(`raum.sicht.${s}`) }))}
            value={sicht}
            onChange={setSicht}
          />
        </View>
        <BesetztWarteschlange />
        {!online ? (
          <ScrollView>
            <RaumOffline />
            <BesetztMeldenPerKennung />
          </ScrollView>
        ) : sicht === 'frei' ? (
          <FreieRaeumeSicht />
        ) : sicht === 'uebersicht' ? (
          <UebersichtSicht />
        ) : (
          <LaufendSicht />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  sichtwahl: { paddingBottom: 12 },
});
