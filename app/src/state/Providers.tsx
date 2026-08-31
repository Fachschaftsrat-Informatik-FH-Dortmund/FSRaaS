import { useState, type ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { ConsentProvider } from '@/consent/ConsentProvider';
import { createQueryClient, queryPersister, persistMaxAge } from './queryClient';

// Ein einziger Anbieter-Baum für die gesamte App. Kein app-weiter UI-Zustand
// (ARCH-N-030) — nur Server-Zustand (TanStack Query) und das Zustimmungs-Gate.

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: persistMaxAge }}
    >
      <ConsentProvider>{children}</ConsentProvider>
    </PersistQueryClientProvider>
  );
}
