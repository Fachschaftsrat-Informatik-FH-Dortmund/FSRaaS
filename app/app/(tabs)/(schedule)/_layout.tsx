import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EinrichtungHeaderZugang } from '@/areas/schedule/ui/EinrichtungHeaderZugang';
import { ModulauswahlVerwerfenZugang } from '@/areas/schedule/ui/ModulauswahlVerwerfenZugang';
import { PlanungSpeichernZugang } from '@/areas/schedule/ui/PlanungSpeichernZugang';
import { VerwaltungsblattZugang } from '@/areas/schedule/ui/VerwaltungsblattZugang';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Requirements „Dauerhafter Zugang zur Einrichtung" und „Ansichts- und
// Verwaltungsblatt in der Kopfzeile": zwei getrennte Kopfzeilen-Symbole der
// Wochenansicht, nebeneinander wie bei `PlanungSpeichernZugang`.
function WochenansichtKopfzeile() {
  return (
    <View style={styles.kopfzeilenGruppe}>
      <EinrichtungHeaderZugang />
      <VerwaltungsblattZugang />
    </View>
  );
}

const styles = StyleSheet.create({
  kopfzeilenGruppe: { flexDirection: 'row' },
});

// Verschachtelter Stack des Stundenplans (SHELL-F-050: Routendateien sind reine
// Re-Exporte aus app/src/areas/schedule). Der Ordnername trägt Klammern
// ((schedule)), damit er selbst nicht zum Pfad beiträgt — `index` darin bleibt
// `/`, wie es `src/navigation/navMap.ts` (href: '/') und der Tab-Platz an
// erster Stelle verlangen (specs/features/schedule/spec.md, Etappe 2b).
// `initialRouteName` legt die Übersicht unter jeden tieferen Einsprung
// (SHELL-F-100), wie im `canteen`- und `more`-Stack.
export const unstable_settings = { initialRouteName: 'index' };

export default function ScheduleLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <Stack
      screenOptions={{
        animation: reducedMotion ? 'none' : 'default',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t('nav.schedule'), headerRight: () => <WochenansichtKopfzeile /> }}
      />
      <Stack.Screen name="einrichtung" options={{ title: t('schedule.einrichtungTitel') }} />
      <Stack.Screen
        name="kurse"
        options={{ title: t('schedule.kurseTitel'), headerRight: () => <ModulauswahlVerwerfenZugang /> }}
      />
      <Stack.Screen
        name="planung"
        options={{ title: t('schedule.planungTitel'), headerRight: () => <PlanungSpeichernZugang /> }}
      />
      <Stack.Screen name="detail" options={{ title: t('schedule.detailTitel') }} />
      <Stack.Screen name="termin" options={{ title: t('schedule.terminTitel') }} />
    </Stack>
  );
}
