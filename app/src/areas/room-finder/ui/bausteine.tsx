import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import { MessageView } from '@/ui/primitives';
import type { QueryLike } from '@/ui/state/AsyncStates';
import type { Raumgroesse } from '../api';
import { gleicherTag, kurzdatum, uhrzeit } from '../zeitraum';

// Gemeinsame Bausteine der Raum-Sichten. Bedeutung nie allein über Farbe:
// Zustand mit Symbol und Text, E-Key und Prüfung als Text (Capability
// `ux-and-theming`).

/**
 * Requirement „Raumsuche offline nicht verfügbar" (Capability `architecture`):
 * ohne Netz kein zwischengespeichertes Ergebnis, sondern diese Kennzeichnung.
 */
export function RaumOffline() {
  const { t } = useTranslation();
  return <MessageView symbol="⊘" title={t('raum.offlineTitel')} body={t('raum.offlineHinweis')} />;
}

/** Zwei Abfragen als eine für `AsyncStates`; Daten erst, wenn beide vorliegen. */
export function kombiniere<A, B, T>(
  a: QueryLike<A>,
  b: QueryLike<B>,
  verbinde: (a: A, b: B) => T,
): QueryLike<T> {
  const data = a.data !== undefined && b.data !== undefined ? verbinde(a.data, b.data) : undefined;
  return {
    data,
    isPending: a.isPending || b.isPending,
    isError: a.isError || b.isError,
    isFetching: a.isFetching || b.isFetching,
    isStale: a.isStale || b.isStale,
    error: a.error ?? b.error,
    dataUpdatedAt: a.dataUpdatedAt,
    refetch: () => {
      a.refetch();
      b.refetch();
    },
  };
}

/** Uhrzeit, mit Datum davor, wenn der Zeitpunkt nicht am Bezugstag liegt. */
export function useZeitText() {
  const { t } = useTranslation();
  return (zeit: Date, bezug: Date) =>
    gleicherTag(zeit, bezug) ? uhrzeit(zeit) : t('raum.datumZeit', { datum: kurzdatum(zeit), zeit: uhrzeit(zeit) });
}

/** „frei bis …" nach den Requirements zu Freizeitpunkt und Schließzeit. */
export function FreiBisText({
  freiBis,
  schliesszeit,
  bezug,
}: {
  freiBis: Date | null;
  schliesszeit: boolean;
  bezug: Date;
}) {
  const { t } = useTranslation();
  const zeitText = useZeitText();
  if (!freiBis) return <Zeile text={t('raum.keinWeitererTermin')} />;
  const zeit = zeitText(freiBis, bezug);
  return <Zeile text={schliesszeit ? t('raum.freiBisSchliesszeit', { zeit }) : t('raum.freiBis', { zeit })} />;
}

/** Größenklasse und E-Key-Kennzeichen eines kuratierten Raums. */
export function Merkmale({ groesse, ekey }: { groesse?: Raumgroesse; ekey?: boolean }) {
  const { t } = useTranslation();
  const teile: string[] = [];
  if (groesse) teile.push(t('raum.groesseLabel', { groesse: t(`raum.groesse.${groesse}`) }));
  if (ekey) teile.push(t('raum.ekey'));
  if (teile.length === 0) return null;
  return <Zeile text={teile.join(' · ')} gedaempft />;
}

export function Zustand({ belegt }: { belegt: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Text style={[styles.zustand, { color: belegt ? colors.danger : colors.text }]}>
      {belegt ? `${t('raum.symbolBelegt')} ${t('raum.belegt')}` : `${t('raum.symbolFrei')} ${t('raum.frei')}`}
    </Text>
  );
}

export function Zeile({ text, gedaempft = false }: { text: string; gedaempft?: boolean }) {
  const { colors } = useTheme();
  return <Text style={[styles.zeile, { color: gedaempft ? colors.textMuted : colors.text }]}>{text}</Text>;
}

/** Antippbare Karte eines Raums oder Termins, ≥ 44 dp hoch (UX-N-020). */
export function Karte({
  children,
  onPress,
  label,
}: {
  children: ReactNode;
  onPress?: () => void;
  label?: string;
}) {
  const { colors } = useTheme();
  const stil = [styles.karte, { borderColor: colors.border, backgroundColor: colors.surface }];
  if (!onPress) return <View style={stil}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [...stil, pressed && styles.gedrueckt]}
    >
      {children}
    </Pressable>
  );
}

export function Kennung({ roomId }: { roomId: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.kennung, { color: colors.text }]}>{roomId}</Text>;
}

const styles = StyleSheet.create({
  karte: { minHeight: 44, borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  gedrueckt: { opacity: 0.7 },
  kennung: { fontSize: 17, fontWeight: '700' },
  zustand: { fontSize: 15, fontWeight: '600' },
  zeile: { fontSize: 15 },
});
