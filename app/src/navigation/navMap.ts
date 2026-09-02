// Beschreibung der Navigationsstruktur als reine Daten — genutzt von der
// Tab-Leiste, der „Mehr"-Liste, den Schnellzugriffen und den Struktur-Tests
// (SHELL-F-010/020/060/090). Die Alt-App häufte fünf gleichrangige Tabs an
// (main_page.dart:29-53); hier besetzen genau vier Bereiche die Tab-Leiste,
// alles Übrige liegt themengruppiert unter „Mehr".

export type NavGroup = 'tab' | 'more';

/** Themengruppe innerhalb von „Mehr" (SHELL-F-090). */
export type MoreGroup = 'studium' | 'fachschaft' | 'app' | 'verwaltung';

export interface NavArea {
  /** Routen-Segment / Schlüssel. */
  key: string;
  /** i18n-Schlüssel des angezeigten Namens. */
  titleKey: string;
  /** Ziel-Pfad im datei-basierten Router (SHELL-F-050). */
  href: string;
  group: NavGroup;
  /** Nur für `group: 'more'` gesetzt. */
  moreGroup?: MoreGroup;
}

export const navAreas: readonly NavArea[] = [
  { key: 'schedule', titleKey: 'nav.schedule', href: '/', group: 'tab' },
  { key: 'canteen', titleKey: 'nav.canteen', href: '/canteen', group: 'tab' },
  { key: 'news', titleKey: 'nav.news', href: '/news', group: 'tab' },
  { key: 'rooms', titleKey: 'nav.rooms', href: '/rooms', group: 'tab' },
  { key: 'ticket', titleKey: 'more.ticket', href: '/more/ticket', group: 'more', moreGroup: 'studium' },
  { key: 'settings', titleKey: 'more.settings', href: '/more/settings', group: 'more', moreGroup: 'app' },
  { key: 'admin', titleKey: 'more.admin', href: '/more/admin', group: 'more', moreGroup: 'verwaltung' },
];

export const tabAreas = navAreas.filter((a) => a.group === 'tab');
export const moreAreas = navAreas.filter((a) => a.group === 'more');

/** Reihenfolge der „Mehr"-Gruppen und ihr Überschriften-i18n-Schlüssel. */
export const moreGroupOrder: readonly { group: MoreGroup; titleKey: string }[] = [
  { group: 'studium', titleKey: 'more.groupStudium' },
  { group: 'fachschaft', titleKey: 'more.groupFachschaft' },
  { group: 'app', titleKey: 'more.groupApp' },
  { group: 'verwaltung', titleKey: 'more.groupVerwaltung' },
];

/** „Mehr"-Einträge nach Gruppe, leere Gruppen ausgelassen (keine toten Einträge, SHELL-F-090). */
export function moreAreasByGroup(): { group: MoreGroup; titleKey: string; areas: NavArea[] }[] {
  return moreGroupOrder
    .map(({ group, titleKey }) => ({
      group,
      titleKey,
      areas: moreAreas.filter((a) => a.moreGroup === group),
    }))
    .filter((section) => section.areas.length > 0);
}

/**
 * Interaktionsschritte von der Startseite bis zum Bereich (SHELL-F-020,
 * ARCH-F-090): ein Tab-Wechsel ist ein Schritt; ein „Mehr"-Eintrag ist der
 * Tab-Wechsel plus die Listenauswahl, also zwei.
 */
export function stepsToReach(area: NavArea): number {
  return area.group === 'tab' ? 1 : 2;
}
