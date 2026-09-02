// Wahl der Oberflächensprache (SET-F-100). Solange keine Wahl getroffen wurde,
// gilt die Systemsprache (SET-F-110). Persistiert als Einstellungsschlüssel
// `uiLanguage` (data-and-storage.md Abschnitt 2, Datenklasse „Einstellungen").

import { readJson, writeJson } from '@/storage/kv';
import { deviceLanguage, supportedLanguages, type resources } from './index';

export type UiLanguage = keyof typeof resources;
export type LanguagePreference = 'system' | UiLanguage;

export const languagePreferences: readonly LanguagePreference[] = ['system', 'de', 'en'];

const KEY = 'uiLanguage';

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === 'system' || (typeof value === 'string' && supportedLanguages.includes(value as UiLanguage));
}

export async function readLanguagePreference(): Promise<LanguagePreference> {
  const stored = await readJson<unknown>(KEY, 'system');
  return isLanguagePreference(stored) ? stored : 'system';
}

export async function writeLanguagePreference(pref: LanguagePreference): Promise<void> {
  await writeJson(KEY, pref);
}

/** Wirksame Sprache: die getroffene Wahl, sonst die Systemsprache (SET-F-110). */
export function resolveLanguage(pref: LanguagePreference): UiLanguage {
  return pref === 'system' ? deviceLanguage() : pref;
}
