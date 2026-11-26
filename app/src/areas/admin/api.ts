// Angemeldeter Zugriff auf die Verwaltungs-Endpunkte des Backends (ADMIN).
// Ein openapi-fetch-Client gegen denselben Vertrag wie der öffentliche Client,
// zusätzlich mit Bearer-Token je Anfrage und Zeitgrenze (NFR-F-070).

import createClient, { type Client } from 'openapi-fetch';
import { useMemo } from 'react';
import {
  useMutation, useQuery, useQueryClient, type UseQueryResult,
} from '@tanstack/react-query';

import type { components, paths } from '@/api/generated/schema';
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

type Meldungsentwurf = components['schemas']['Meldungsentwurf'];
type MeldungsentwurfEingabe = components['schemas']['MeldungsentwurfEingabe'];

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

function useAdminClient() {
  const { getAccessToken, status } = useAuth();
  const client = useMemo(() => adminClient(getAccessToken), [getAccessToken]);
  return { client, angemeldet: status === 'signed-in' };
}

export function useAdminApi() {
  const { client, angemeldet } = useAdminClient();
  const qc = useQueryClient();

  const stammdaten: UseQueryResult<StammdatenMitStand> = useQuery({
    queryKey: ['verwaltung', 'stammdaten'],
    enabled: angemeldet,
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
    // ADMIN-F-200: bei zwischenzeitlicher Änderung den neueren Stand nachladen,
    // damit die Oberfläche ihn zur erneuten Bearbeitung anbietet.
    onError: (error) => {
      if (AppError.from(error).status === 412) {
        qc.invalidateQueries({ queryKey: ['verwaltung', 'stammdaten'] });
      }
    },
  });

  const laufwege: UseQueryResult<LaufwegeMitStand> = useQuery({
    queryKey: ['verwaltung', 'laufwege'],
    enabled: angemeldet,
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
      const ergebnis = data as { laufwege: Laufweg[]; unbekannteRaeume: string[] };
      return { ...ergebnis, etag: response.headers.get('etag') ?? '' };
    },
    onSuccess: ({ laufwege: wege, etag }) =>
      qc.setQueryData<LaufwegeMitStand>(['verwaltung', 'laufwege'], { wege, etag }),
    onError: (error) => {
      if (AppError.from(error).status === 412) {
        qc.invalidateQueries({ queryKey: ['verwaltung', 'laufwege'] });
      }
    },
  });

  const rollen: UseQueryResult<Rollenzuweisung[]> = useQuery({
    queryKey: ['verwaltung', 'rollen'],
    enabled: angemeldet,
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
    // Erfolg wie Fehlschlag: den tatsächlichen Stand aus Authentik nachladen,
    // damit die Oberfläche nie eine abgelehnte Änderung anzeigt (ADMIN-F-080).
    onSettled: () => qc.invalidateQueries({ queryKey: ['verwaltung', 'rollen'] }),
  });

  return { stammdaten, stammdatenSpeichern, laufwege, laufwegeSpeichern, rollen, rollenSpeichern };
}

// ---------------------------------------------------------------- Meldungen
// Redaktion der FSR-News (Requirements „Meldungsredaktion für FSR-News",
// „Vorschau vor Veröffentlichung", „Ablehnung bei gleichzeitiger Änderung einer
// Meldung"). Nach jeder erfolgreichen Handlung werden die Redaktionsliste und die
// öffentliche Meldungsliste invalidiert, damit die App auf demselben Gerät die
// Änderung sofort zeigt (Change `news-redaktion`, design.md D8).

export const MELDUNGEN_VERWALTUNG = ['verwaltung', 'meldungen'] as const;

export function useMeldungenRedaktion() {
  const { client, angemeldet } = useAdminClient();
  return useQuery<Meldungsentwurf[]>({
    queryKey: MELDUNGEN_VERWALTUNG,
    enabled: angemeldet,
    queryFn: async () => {
      const { data, error, response } = await client.GET('/meldungen/entwuerfe');
      if (error || !data) throw fehler(response.status, error);
      return data;
    },
  });
}

/** Eine Meldung der Redaktion; `null` als Kennung heißt „neue Meldung" (kein Abruf). */
export function useMeldungsentwurf(id: string | null) {
  const { client, angemeldet } = useAdminClient();
  const qc = useQueryClient();

  const query = useQuery<Meldungsentwurf>({
    queryKey: [...MELDUNGEN_VERWALTUNG, id],
    enabled: angemeldet && id !== null,
    retry: false,
    queryFn: async () => {
      const { data, error, response } = await client.GET('/meldungen/entwuerfe/{entwurfId}', {
        params: { path: { entwurfId: id! } },
      });
      if (error || !data) throw fehler(response.status, error);
      return data;
    },
  });

  function gespeichert(m: Meldungsentwurf) {
    qc.setQueryData([...MELDUNGEN_VERWALTUNG, m.id], m);
    void qc.invalidateQueries({ queryKey: MELDUNGEN_VERWALTUNG, exact: true });
    void qc.invalidateQueries({ queryKey: ['meldungen'] });
    return m;
  }

  async function anlegen(eingabe: MeldungsentwurfEingabe): Promise<Meldungsentwurf> {
    const { data, error, response } = await client.POST('/meldungen/entwuerfe', { body: eingabe });
    if (error || !data) throw fehler(response.status, error);
    return gespeichert(data);
  }

  async function aendern(basis: Meldungsentwurf, eingabe: MeldungsentwurfEingabe): Promise<Meldungsentwurf> {
    const { data, error, response } = await client.PUT('/meldungen/entwuerfe/{entwurfId}', {
      params: { path: { entwurfId: basis.id }, header: { 'If-Match': basis.etag } },
      body: eingabe,
    });
    if (error || !data) throw fehler(response.status, error);
    return gespeichert(data);
  }

  /**
   * Aus der Vorschau: legt bei Bedarf an oder übernimmt geänderten Inhalt und
   * veröffentlicht dann genau diesen Stand (If-Match mit dem frischen ETag).
   */
  async function veroeffentlichen(
    basis: Meldungsentwurf | null,
    eingabe: MeldungsentwurfEingabe,
  ): Promise<Meldungsentwurf> {
    let stand = basis;
    if (!stand) stand = await anlegen(eingabe);
    else if (stand.titel !== eingabe.titel || stand.text !== eingabe.text) stand = await aendern(stand, eingabe);

    const { data, error, response } = await client.PUT('/meldungen/entwuerfe/{entwurfId}/veroeffentlichung', {
      params: { path: { entwurfId: stand.id }, header: { 'If-Match': stand.etag } },
    });
    if (error || !data) throw fehler(response.status, error);
    return gespeichert(data);
  }

  async function zurueckziehen(basis: Meldungsentwurf): Promise<Meldungsentwurf> {
    const { error, response } = await client.DELETE('/meldungen/entwuerfe/{entwurfId}/veroeffentlichung', {
      params: { path: { entwurfId: basis.id } },
    });
    if (error || !response.ok) throw fehler(response.status, error);
    // Neuer Stand samt ETag vom Server, statt ihn hier nachzubilden.
    const neu = await query.refetch();
    void qc.invalidateQueries({ queryKey: MELDUNGEN_VERWALTUNG, exact: true });
    void qc.invalidateQueries({ queryKey: ['meldungen'] });
    if (!neu.data) throw AppError.from(neu.error);
    return neu.data;
  }

  return { query, anlegen, aendern, veroeffentlichen, zurueckziehen };
}

export type { Stammdaten, Laufweg, Rollenzuweisung, Meldungsentwurf, MeldungsentwurfEingabe };
