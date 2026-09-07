import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppError } from '@/errors/AppError';
import { useOnlineStatus } from '@/state/useOnlineStatus';
import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { describeAge, shouldShowAge } from './dataAge';

// EINZIGE Grundstruktur für Lade-, Leer-, Fehler- und Offline-Zustand
// (ARCH-F-130, ARCH-N-020, UX-F-100). Jede datenabhängige Ansicht rendert ihre
// Inhalte durch diese Komponente, statt eigene Zustandsansichten zu bauen.
//
//   <AsyncStates query={q} isEmpty={(d) => d.items.length === 0}
//                emptyNextStep={t('mensa.leerHinweis')}>
//     {(data) => <Liste data={data} />}
//   </AsyncStates>

/** Minimaler Ausschnitt aus TanStack Querys UseQueryResult, den wir hier brauchen. */
export interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  isStale: boolean;
  error: unknown;
  dataUpdatedAt: number;
  refetch: () => unknown;
}

export interface AsyncStatesProps<T> {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  /** Prüft, ob die geladenen Daten fachlich leer sind. */
  isEmpty?: (data: T) => boolean;
  /**
   * Nächster sinnvoller Schritt zur Behebung des Leerzustands — Pflicht, weil
   * ein Leerzustand ohne Handlungsweg unzulässig ist (UX-F-110).
   */
  emptyNextStep: string;
  emptyTitle?: string;
  /**
   * Sichtbarer Bedienweg zum genannten nächsten Schritt (UX-F-110: „mit
   * Handlungsweg"), z. B. ein Knopf zur fehlenden Einrichtung. Optional, weil
   * der nächste Schritt manchmal bereits am selben Bildschirm bedienbar ist
   * (z. B. ein Filter-Schalter direkt darüber) und keinen eigenen Knopf braucht.
   */
  emptyAction?: ReactNode;
}

export function AsyncStates<T>({
  query,
  children,
  isEmpty,
  emptyNextStep,
  emptyTitle,
  emptyAction,
}: AsyncStatesProps<T>) {
  const { t } = useTranslation();
  const online = useOnlineStatus();
  const hasData = query.data !== undefined;

  // 1. Laden — nur wenn noch nichts angezeigt werden kann.
  if (query.isPending && !hasData) {
    return <MessageView busy title={t('states.loading')} />;
  }

  // 2. Fehler ohne verwendbaren Zwischenspeicher.
  if (query.isError && !hasData) {
    const err = AppError.from(query.error);
    const offline = !online || err.kind === 'offline';
    return (
      <MessageView
        symbol={offline ? '⊘' : '⚠'}
        title={offline ? t('states.offlineTitle') : t('states.errorTitle')}
        body={offline ? t('states.offlineBody') : t(err.message)}
        action={
          err.retryable ? (
            <AppButton label={t('common.retry')} onPress={() => query.refetch()} />
          ) : undefined
        }
      />
    );
  }

  // Übergangszustand: weder Fehler noch als „lädt" markiert, aber noch keine
  // Daten — als Ladezustand behandeln, statt isEmpty auf undefined aufzurufen.
  if (!hasData) {
    return <MessageView busy title={t('states.loading')} />;
  }

  const data = query.data as T;

  // 3. Leer — mit Handlungsweg (UX-F-110).
  if (isEmpty?.(data)) {
    return (
      <MessageView
        symbol="—"
        title={emptyTitle ?? t('states.emptyTitle')}
        body={emptyNextStep}
        action={emptyAction}
      />
    );
  }

  // 4. Daten — bei veraltetem Offline-Stand mit sichtbarem Altershinweis (DATA-F-090).
  const showAge = shouldShowAge({ isOffline: !online, isStale: query.isStale, hasData });
  return (
    <View style={styles.fill}>
      {showAge ? <DataAgeBanner updatedAt={query.dataUpdatedAt} /> : null}
      {children(data)}
    </View>
  );
}

function DataAgeBanner({ updatedAt }: { updatedAt: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const age = describeAge(updatedAt);
  return (
    <View
      style={[styles.ageBanner, { backgroundColor: colors.banner }]}
      accessibilityRole="text"
    >
      <Text style={[styles.ageText, { color: colors.onBanner }]}>
        {'⊘ '}
        {t('dataAge.offlineHint')} · {t('dataAge.prefix')} {t(age.key, { count: age.count })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  ageBanner: { paddingVertical: 6, paddingHorizontal: 12 },
  ageText: { fontSize: 13, textAlign: 'center' },
});
