import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as QuickActions from 'expo-quick-actions';
import { useQuickActionRouting as useRouterQuickActions } from 'expo-quick-actions/router';

import { logError } from '@/errors/AppError';

// SHELL-F-040: Betriebssystem-Schnellzugriffe auf mindestens Stundenplan und
// Semesterticket. Die Alt-App verdrahtete Titel und Ziel fest
// (quick_actions_manager.dart: „Ticket anzeigen", Sprung auf Tab-Index 3); hier
// sind die Ziele datenbeschrieben und die Titel übersetzt (NFR-F-115).

export interface QuickActionTarget {
  id: string;
  /** i18n-Schlüssel des vom Betriebssystem angezeigten Namens. */
  titleKey: string;
  /** Ziel-Pfad im datei-basierten Router (SHELL-F-050). */
  href: string;
}

export const quickActionTargets: readonly QuickActionTarget[] = [
  { id: 'schedule', titleKey: 'nav.schedule', href: '/' },
  { id: 'ticket', titleKey: 'more.ticket', href: '/more/ticket' },
];

/**
 * Registriert die Schnellzugriffe beim Betriebssystem und behandelt das
 * Antippen eines Schnellzugriffs, indem zum hinterlegten `href` navigiert wird.
 * Muss aus einem Unter-Layout aufgerufen werden, nicht aus der Router-Wurzel
 * (Vorgabe von expo-quick-actions/router).
 */
export function useQuickActionRouting(): void {
  const { t } = useTranslation();

  useEffect(() => {
    QuickActions.setItems(
      quickActionTargets.map((target) => ({
        id: target.id,
        title: t(target.titleKey),
        params: { href: target.href },
      })),
    ).catch((error: unknown) => logError('quickActions.setItems', error));
  }, [t]);

  useRouterQuickActions();
}
