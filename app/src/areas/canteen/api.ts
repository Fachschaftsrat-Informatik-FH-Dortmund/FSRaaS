import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { components } from '@/api/generated/schema';
import { gcTime, staleTime } from '@/cache/ttl';
import { api, unwrap } from '@/net/client';
import ausgangsbestand from './assets/stammdaten-ausgangsbestand.json';

// Lesezugriff auf den Mensa-Speiseplan-Zwischenspeicher des Backends (MENSA, INT-008).
// Kontofrei. Gültigkeitsdauer je Datenart aus @/cache/ttl (DATA-F-080).

export type Mensa = components['schemas']['Mensa'];
export type Gericht = components['schemas']['Gericht'];
export type Schluesselwert = components['schemas']['Schluesselwert'];
export type StandAlter = components['schemas']['StandAlter'];

export interface Speiseplan {
  gerichte: Gericht[];
  standAlter: StandAlter;
}
export interface Verzeichnisse {
  kategorien: Schluesselwert[];
  zusatzstoffe: Schluesselwert[];
  kennzeichnungen: Schluesselwert[];
}

const FALLBACK_MENSEN = ausgangsbestand.mensen as unknown as Mensa[];

/** Oberflächensprache auf das Vertrags-Enum de/en abbilden. */
export function apiSprache(sprache: string): 'de' | 'en' {
  return sprache.toLowerCase().startsWith('en') ? 'en' : 'de';
}

/**
 * Mensa-Liste. Ist das Backend nicht erreichbar und liegt kein Zwischenspeicher
 * vor, wird der im Anwendungspaket mitgelieferte Ausgangsbestand verwendet
 * (MENSA-F-075, API-F-235).
 */
export function useMensen() {
  const query = useQuery({
    queryKey: ['mensen'],
    staleTime: staleTime('stammdaten'),
    gcTime: gcTime('stammdaten'),
    queryFn: async () => unwrap(await api.GET('/mensen')),
  });

  const istAusgangsbestand = query.isError && query.data === undefined;
  const mensen = query.data ?? (istAusgangsbestand ? FALLBACK_MENSEN : []);
  return { mensen, istAusgangsbestand, query };
}

export function useSpeiseplan(mensaId: string | undefined, datum: string) {
  const { i18n } = useTranslation();
  const sprache = apiSprache(i18n.language);

  return useQuery<Speiseplan>({
    queryKey: ['speiseplan', mensaId, datum, sprache],
    enabled: Boolean(mensaId),
    staleTime: staleTime('speiseplan'),
    gcTime: gcTime('speiseplan'),
    queryFn: async () =>
      unwrap(
        await api.GET('/mensen/{mensaId}/speiseplan/{datum}', {
          params: { path: { mensaId: mensaId!, datum }, header: { 'Accept-Language': sprache } },
        }),
      ),
  });
}

export function useMensaVerzeichnisse() {
  const { i18n } = useTranslation();
  const sprache = apiSprache(i18n.language);

  return useQuery<Verzeichnisse>({
    queryKey: ['mensaVerzeichnisse', sprache],
    staleTime: staleTime('mensaVerzeichnisse'),
    gcTime: gcTime('mensaVerzeichnisse'),
    queryFn: async () =>
      unwrap(await api.GET('/mensen/verzeichnisse', { params: { header: { 'Accept-Language': sprache } } })),
  });
}

/**
 * Speiseplan bzw. Mensa-Liste ohne React — für den Hintergrund-Abgleich der
 * Lieblingsgerichte (MENSA-F-100), der außerhalb des Komponentenbaums läuft.
 */
export async function ladeSpeiseplanGerichte(mensaId: string, datum: string): Promise<Gericht[]> {
  const { gerichte } = unwrap(
    await api.GET('/mensen/{mensaId}/speiseplan/{datum}', {
      params: { path: { mensaId, datum }, header: { 'Accept-Language': 'de' } },
    }),
  );
  return gerichte;
}

export async function ladeMensen(): Promise<Mensa[]> {
  return unwrap(await api.GET('/mensen'));
}
