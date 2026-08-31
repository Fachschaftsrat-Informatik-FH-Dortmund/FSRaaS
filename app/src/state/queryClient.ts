import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { PERSIST_MAX_AGE } from '@/cache/ttl';
import { AppError } from '@/errors/AppError';

// Server-Zustandsschicht (ADR 0013): TanStack Query mit AsyncStorage-Persister
// für den Neustart-Fall (ARCH-F-100) und NetInfo als Netzstatus-Quelle.

// NetInfo speist den onlineManager — Grundlage für Offline-Erkennung
// (ARCH-F-100, DATA-F-090) und, ab Schritt 6, die Schreib-Warteschlange.
onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
  return unsubscribe;
});

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // staleTime/gcTime setzt jede Abfrage selbst aus cache/ttl.ts je Datenart
        // (DATA-F-080). Hier nur genügsame Grundwerte.
        staleTime: 60_000,
        gcTime: 7 * 24 * 60 * 60 * 1000,
        retry: (failureCount, error) => {
          const appError = AppError.from(error);
          if (!appError.retryable || appError.kind === 'offline') return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        // ARCH-F-125-Ausnahme (Verwaltung/Moderation/Kontolöschung): sofort
        // fehlschlagen statt warten. Regulärer Schreibpfad ab Schritt 6 setzt
        // networkMode neu.
        networkMode: 'online',
      },
    },
  });
}

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'fb4:query-cache',
  throttleTime: 1_000,
});

/** Obergrenze für das Alter persistierter Einträge (Teil von DATA-N-150). */
export const persistMaxAge = PERSIST_MAX_AGE;
