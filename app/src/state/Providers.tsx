import { useState, type ReactNode } from 'react';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth/AuthProvider';
import { ConsentProvider } from '@/consent/ConsentProvider';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { ThemeProvider } from '@/theme';
import { createQueryClient, queryPersister, persistMaxAge } from './queryClient';
import { SCHREIBVORGAENGE } from './schreibvorgaenge';
import { registriereSchreibvorgaenge, setzeWarteschlangeFort, sollEintragPersistieren } from './schreibwarteschlange';

// Ein einziger Anbieter-Baum für die gesamte App. Kein app-weiter UI-Zustand
// (ARCH-N-030) — Server-Zustand (TanStack Query), Erscheinungsbild, Sprache und
// das Zustimmungs-Gate. Erscheinungsbild und Sprache halten je eine
// gerätebezogene Einstellung, keinen Bildschirmzustand.

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    const client = createQueryClient();
    // Vor der Wiederherstellung: Ein wiederhergestellter Warteschlangen-Eintrag
    // findet seine Funktion nur über die registrierten Vorgaben.
    registriereSchreibvorgaenge(client, SCHREIBVORGAENGE);
    return client;
  });

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: persistMaxAge,
          // Verwaltungsdaten sind ausschließlich online nutzbar (ADMIN Abschnitt 8)
          // und enthalten Kontonamen — nicht auf die Platte schreiben.
          dehydrateOptions: {
            shouldDehydrateQuery: (query) =>
              defaultShouldDehydrateQuery(query) && query.queryKey[0] !== 'verwaltung',
            // Offline-Schreib-Warteschlange (ARCH-F-120/DATA-F-100): wartende,
            // laufende und fehlgeschlagene Einträge überdauern den Neustart.
            // Alle übrigen Mutationen (Verwaltung) bleiben flüchtig (ARCH-F-125).
            shouldDehydrateMutation: sollEintragPersistieren,
          },
        }}
        onSuccess={() => setzeWarteschlangeFort(queryClient)}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ConsentProvider>{children}</ConsentProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
