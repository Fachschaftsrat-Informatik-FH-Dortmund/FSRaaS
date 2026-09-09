// Erscheinungsbild-Wahl der Nutzerin (SET-F-020): hell, dunkel oder
// systemabhängig. Persistiert als Einstellungsschlüssel `appearanceMode`
// (data-and-storage.md Abschnitt 5).

import type { ColorSchemeName } from 'react-native';

import { readJson, writeJson } from '@/storage/kv';
import type { Scheme } from './tokens';

export type AppearanceMode = 'system' | 'light' | 'dark';

export const appearanceModes: readonly AppearanceMode[] = ['system', 'light', 'dark'];

const KEY = 'appearanceMode';

export function isAppearanceMode(value: unknown): value is AppearanceMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export async function readAppearanceMode(): Promise<AppearanceMode> {
  const stored = await readJson<unknown>(KEY, 'system');
  return isAppearanceMode(stored) ? stored : 'system';
}

export async function writeAppearanceMode(mode: AppearanceMode): Promise<void> {
  await writeJson(KEY, mode);
}

/**
 * Auflösung der wirksamen Darstellung. Eine manuelle Wahl (hell/dunkel) gilt
 * unabhängig vom Systemzustand (UX-F-030); nur `system` folgt der
 * Systemeinstellung (UX-F-020).
 */
export function resolveScheme(
  mode: AppearanceMode,
  system: ColorSchemeName | null | undefined,
): Scheme {
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}
