// Ablage des Sitzungsmerkmals (DATA-F-120): auf den nativen Plattformen im
// gesicherten Systemspeicher (expo-secure-store), im Web-Export der
// Verwaltungsoberfläche im localStorage — der Browser hat keinen gesicherten
// Systemspeicher (SEC-F-180, Prüfprotokoll 2026-09-02).
//
// Lese-/Schreibfehler werden protokolliert, nie verschluckt (SEC-F-060).

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { logError } from '@/errors/AppError';
import type { StoredSession } from './session';

const KEY = 'fb4.session';
const isWeb = Platform.OS === 'web';

async function readRaw(): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(KEY) ?? null;
    } catch (error) {
      logError('tokenStore.read.web', error);
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch (error) {
    logError('tokenStore.read', error);
    return null;
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await readRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch (error) {
    logError('tokenStore.parse', error);
    return null;
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  const raw = JSON.stringify(session);
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(KEY, raw);
    } catch (error) {
      throw logError('tokenStore.write.web', error);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, raw, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } catch (error) {
    throw logError('tokenStore.write', error);
  }
}

/** DATA-F-130: bei Abmeldung oder Sitzungsablauf das Merkmal entfernen. */
export async function clearSession(): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch (error) {
      throw logError('tokenStore.clear.web', error);
    }
    return;
  }
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch (error) {
    throw logError('tokenStore.clear', error);
  }
}
