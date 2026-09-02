import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'expo-router';

import { logError } from '@/errors/AppError';
import {
  readStartView, readLastTab, writeLastTab, resolveStartTab, tabHref, type TabKey,
} from './startView';

/** Leitet den Pfad innerhalb der Tab-Gruppe auf einen Tab-Schlüssel ab. */
export function tabKeyFromPath(pathname: string): TabKey {
  if (pathname.startsWith('/more')) return 'more';
  if (pathname.startsWith('/canteen')) return 'canteen';
  if (pathname.startsWith('/news')) return 'news';
  if (pathname.startsWith('/rooms')) return 'rooms';
  return 'schedule';
}

/**
 * Öffnet beim ersten Rendern der Tab-Gruppe die konfigurierte Startansicht
 * (SHELL-F-070) und vermerkt fortlaufend den zuletzt aktiven Tab (SET-F-160,
 * Option „zuletzt genutzt").
 */
export function useStartView(): void {
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;
    Promise.all([readStartView(), readLastTab()])
      .then(([startView, lastTab]) => {
        const target = resolveStartTab(startView, lastTab);
        if (target !== 'schedule') router.replace(tabHref(target));
      })
      .catch((error) => logError('startView.redirect', error));
  }, [router]);

  useEffect(() => {
    // Erst nach dem Startsprung vermerken, damit der Sprung selbst den Wert
    // nicht überschreibt.
    if (!redirected.current) return;
    writeLastTab(tabKeyFromPath(pathname)).catch((error) =>
      logError('startView.trackLastTab', error),
    );
  }, [pathname]);
}
