// Wählbare Startansicht (SHELL-F-070, SET-F-160). Voreinstellung: Stundenplan.
// „last" öffnet den zuletzt aktiven Tab; dafür wird dieser lokal vermerkt.

import { readJson, writeJson } from '@/storage/kv';
import { tabAreas, type NavArea } from './navMap';

export type TabKey = 'schedule' | 'canteen' | 'news' | 'rooms' | 'more';
export type StartView = 'schedule' | 'canteen' | 'news' | 'rooms' | 'last';

export const startViewOptions: readonly StartView[] = [
  'schedule', 'canteen', 'news', 'rooms', 'last',
];

const START_KEY = 'startView';
const LAST_TAB_KEY = 'lastTab';

const TAB_KEYS: readonly TabKey[] = ['schedule', 'canteen', 'news', 'rooms', 'more'];

export function isStartView(value: unknown): value is StartView {
  return typeof value === 'string' && (startViewOptions as readonly string[]).includes(value);
}

export function isTabKey(value: unknown): value is TabKey {
  return typeof value === 'string' && (TAB_KEYS as readonly string[]).includes(value);
}

export async function readStartView(): Promise<StartView> {
  const stored = await readJson<unknown>(START_KEY, 'schedule');
  return isStartView(stored) ? stored : 'schedule';
}

export async function writeStartView(value: StartView): Promise<void> {
  await writeJson(START_KEY, value);
}

export async function readLastTab(): Promise<TabKey> {
  const stored = await readJson<unknown>(LAST_TAB_KEY, 'schedule');
  return isTabKey(stored) ? stored : 'schedule';
}

export async function writeLastTab(value: TabKey): Promise<void> {
  await writeJson(LAST_TAB_KEY, value);
}

/**
 * Auflösung zum tatsächlich zu öffnenden Tab-Schlüssel. „last" → der vermerkte
 * Tab; jeder unbekannte Wert → Stundenplan.
 */
export function resolveStartTab(startView: StartView, lastTab: TabKey): TabKey {
  if (startView === 'last') return lastTab;
  return startView;
}

/** Route des Tabs mit diesem Schlüssel. */
export function tabHref(tab: TabKey): string {
  if (tab === 'more') return '/more';
  const area: NavArea | undefined = tabAreas.find((a) => a.key === tab);
  return area?.href ?? '/';
}
