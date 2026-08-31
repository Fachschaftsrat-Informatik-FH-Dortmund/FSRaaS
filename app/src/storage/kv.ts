// Schmale, typisierte Schlüssel-Wert-Ablage auf dem Gerät (DATA-F-050,
// Teilnachweis — die vollständige Einstellungsverwaltung folgt mit SET in
// Schritt 2). Alle Daten liegen im App-eigenen Speicherbereich (DATA-F-170).
//
// Lesefehler werden nicht verschluckt (SEC-F-060): Ein defekter Eintrag führt zu
// einem protokollierten Fehler und dem Standardwert, nicht zu stillem Verlust.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { logError } from '@/errors/AppError';

const PREFIX = 'fb4:';

export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    logError(`kv.read:${key}`, error);
    return fallback;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (error) {
    throw logError(`kv.write:${key}`, error);
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch (error) {
    throw logError(`kv.remove:${key}`, error);
  }
}

/** Entfernt alle unter diesem Präfix abgelegten Schlüssel (Grundlage für DATA-F-160). */
export async function clearAll(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
  } catch (error) {
    throw logError('kv.clearAll', error);
  }
}
