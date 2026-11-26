import { useInfiniteQuery } from '@tanstack/react-query';

import type { components } from '@/api/generated/schema';
import { gcTime, staleTime } from '@/cache/ttl';
import { api, unwrap } from '@/net/client';

// Lesezugriff des News-Bereichs über das eigene Backend (Capability `news`,
// Requirements „Laden und Anzeige aktueller Meldungen" und „Nachladen älterer
// Meldungen"). Kontofrei; die App fragt nie eine Fremdquelle direkt ab (INT-008).

export type Meldung = components['schemas']['Meldung'];
export type Meldungsseite = components['schemas']['Meldungsseite'];
export type Klassifizierung = components['schemas']['Klassifizierung'];

/** Zusammengeführter Bestand aller geladenen Seiten. */
export interface MeldungsBestand {
  meldungen: Meldung[];
  /** Kennungen aller zurückgezogenen Meldungen (ADMIN-F-050), über alle Seiten vereinigt. */
  zurueckgezogen: string[];
}

export const MELDUNGEN_SCHLUESSEL = ['meldungen'] as const;

/** Führt die geladenen Seiten zusammen; eine Meldung erscheint höchstens einmal. */
export function seitenZusammenfuehren(seiten: readonly Meldungsseite[]): MeldungsBestand {
  const gesehen = new Set<string>();
  const meldungen: Meldung[] = [];
  const zurueckgezogen = new Set<string>();
  for (const seite of seiten) {
    for (const m of seite.meldungen) {
      if (gesehen.has(m.id)) continue;
      gesehen.add(m.id);
      meldungen.push(m);
    }
    for (const id of seite.zurueckgezogen) zurueckgezogen.add(id);
  }
  return { meldungen, zurueckgezogen: [...zurueckgezogen] };
}

export function useMeldungen() {
  return useInfiniteQuery({
    queryKey: MELDUNGEN_SCHLUESSEL,
    staleTime: staleTime('news'),
    gcTime: gcTime('news'),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET('/meldungen', {
          params: { query: pageParam ? { cursor: pageParam } : {} },
        }),
      ),
    getNextPageParam: (letzte) => letzte.naechsterCursor ?? undefined,
    select: (daten) => seitenZusammenfuehren(daten.pages),
  });
}
