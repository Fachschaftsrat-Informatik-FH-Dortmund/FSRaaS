import { useState, type ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ConsentProvider } from '@/consent/ConsentProvider';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { ThemeProvider } from '@/theme';
import { createQueryClient, queryPersister, persistMaxAge } from './queryClient';

// Ein einziger Anbieter-Baum für die gesamte App. Kein app-weiter UI-Zustand
// (ARCH-N-030) — Server-Zustand (TanStack Query), Erscheinungsbild, Sprache und
// das Zustimmungs-Gate. Erscheinungsbild und Sprache halten je eine
// gerätebezogene Einstellung, keinen Bildschirmzustand.

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryPersister, maxAge: persistMaxAge }}
      >
        <ThemeProvider>
          <LanguageProvider>
            <ConsentProvider>{children}</ConsentProvider>
          </LanguageProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
