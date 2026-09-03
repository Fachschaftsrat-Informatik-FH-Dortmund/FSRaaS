// Angemeldeter Zugriff auf die Verwaltungs-Endpunkte des Backends (ADMIN).
// Ein openapi-fetch-Client gegen denselben Vertrag wie der öffentliche Client,
// zusätzlich mit Bearer-Token je Anfrage und Zeitgrenze (NFR-F-070).

import createClient, { type Client } from 'openapi-fetch';
import { useMemo } from 'react';
import {
  useMutation, useQuery, useQueryClient, type UseQueryResult,
} from '@tanstack/react-query';

import type { paths } from '@/api/generated/schema';
import { useAuth } from '@/auth/AuthProvider';
import { config } from '@/config';
import { AppError } from '@/errors/AppError';
import { fetchWithTimeout } from '@/net/client';
import { problemToAppError } from '@/net/problem';

type Stammdaten = paths['/verwaltung/stammdaten']['get']['responses']['200']['content']['application/json'];
type Laufweg = NonNullable<
  paths['/verwaltung/laufwege']['get']['responses']['200']['content']['application/json']
>[number];
type Rollenzuweisung = NonNullable<
  paths['/verwaltung/rollen']['get']['responses']['200']['content']['application/json']
>[number];

export interface StammdatenMitStand {
  daten: Stammdaten;
  etag: string;
}

export interface LaufwegeMitStand {
  wege: Laufweg[];
  etag: string;
}

function adminClient(getAccessToken: () => Promise<string | null>): Client<paths> {
  const client = createClient<paths>({ baseUrl: config.apiBaseUrl, fetch: fetchWithTimeout });
  client.use({
    async onRequest({ request }) {
      const token = await getAccessToken();
      if (token) request.headers.set('Authorization', `Bearer ${token}`);
      return request;
    },
  });
  return client;
}

function fehler(status: number, error: unknown): AppError {
  return problemToAppError(status, error);
}

export function useAdminApi() {
  const { getAccessToken } = useAuth();
  const client = useMemo(() => adminClient(getAccessToken), [getAccessToken]);
  const qc = useQueryClient();

  const stammdaten: UseQueryResult<StammdatenMitStand> = useQuery({
    queryKey: ['verwaltung', 'stammdaten'],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/verwaltung/stammdaten');
      if (error || !data) throw fehler(response.status, error);
      return { daten: data, etag: response.headers.get('etag') ?? '' };
    },
  });

  const stammdatenSpeichern = useMutation({
    mutationFn: async ({ daten, etag }: StammdatenMitStand) => {
      const { data, error, response } = await client.PUT('/verwaltung/stammdaten', {
        params: { header: { 'If-Match': etag } },
        body: daten,
      });
      if (error || !data) throw fehler(response.status, error);
      return { daten: data, etag: response.headers.get('etag') ?? '' } satisfies StammdatenMitStand;
    },
    onSuccess: (next) => qc.setQueryData(['verwaltung', 'stammdaten'], next),
  });

  const laufwege: UseQueryResult<LaufwegeMitStand> = useQuery({
    queryKey: ['verwaltung', 'laufwege'],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/verwaltung/laufwege');
      if (error || !data) throw fehler(response.status, error);
      return { wege: data, etag: response.headers.get('etag') ?? '' };
    },
  });

  const laufwegeSpeichern = useMutation({
    mutationFn: async ({ wege, etag }: LaufwegeMitStand) => {
      const { data, error, response } = await client.PUT('/verwaltung/laufwege', {
        params: { header: { 'If-Match': etag } },
        body: wege,
      });
      if (error || !data) throw fehler(response.status, error);
      return data as { laufwege: Laufweg[]; unbekannteRaeume: string[] };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verwaltung', 'laufwege'] }),
  });

  const rollen: UseQueryResult<Rollenzuweisung[]> = useQuery({
    queryKey: ['verwaltung', 'rollen'],
    queryFn: async () => {
      const { data, error, response } = await client.GET('/verwaltung/rollen');
      if (error || !data) throw fehler(response.status, error);
      return data;
    },
    retry: false,
  });

  const rollenSpeichern = useMutation({
    mutationFn: async (zuweisung: Rollenzuweisung) => {
      const { data, error, response } = await client.PUT('/verwaltung/rollen', { body: zuweisung });
      if (error || !data) throw fehler(response.status, error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verwaltung', 'rollen'] }),
  });

  return { stammdaten, stammdatenSpeichern, laufwege, laufwegeSpeichern, rollen, rollenSpeichern };
}

export type { Stammdaten, Laufweg, Rollenzuweisung };
