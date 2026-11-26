import { useQuery } from '@tanstack/react-query';

import type { components } from '@/api/generated/schema';
import { gcTime, staleTime } from '@/cache/ttl';
import { api, unwrap } from '@/net/client';

// Lesezugriff des Raum-Bereichs über das eigene Backend (Capability
// `room-finder`, Requirement „Raumtermine über den Backend-Zwischenspeicher
// beziehen"). Kontofrei. Die App spricht INT-009 nie selbst an; alle Sichten
// leiten sich aus dem Raumplan-Zwischenspeicher des Backends und der
// kuratierten Raumliste aus `/stammdaten` ab (Change `raumsuche-app`).

export type RaumStatus = components['schemas']['RaumStatus'];
export type Raumtermin = components['schemas']['Raumtermin'];
export type Raum = components['schemas']['Raum'];
export type Raumgroesse = components['schemas']['Raumgroesse'];
export type StandAlter = components['schemas']['StandAlter'];

export interface Raumuebersicht {
  raeume: RaumStatus[];
  standAlter: StandAlter;
}

export interface Raumbelegung {
  termine: Raumtermin[];
  standAlter: StandAlter;
}

/** Abfrageintervall der Übersicht „jetzt", solange die Sicht geöffnet ist. */
const JETZT_TAKT_MS = staleTime('raumbelegungJetzt');

/**
 * Raumübersicht. Ohne `zeitpunkt` gilt „jetzt" (Requirement „Übersicht aller
 * Räume mit Belegungszustand"): Der Zustand altert dann mit der Uhr und wird
 * bei geöffneter Sicht minütlich neu bezogen. Mit `zeitpunkt` (ISO-8601) trägt
 * die Antwort die Freie-Raum-Suche zu einem gewählten Beginn.
 */
export function useRaumuebersicht(zeitpunkt?: string) {
  const jetzt = zeitpunkt === undefined;
  return useQuery<Raumuebersicht>({
    queryKey: ['raumuebersicht', zeitpunkt ?? 'jetzt'],
    staleTime: staleTime(jetzt ? 'raumbelegungJetzt' : 'raumtermine'),
    gcTime: gcTime('raumtermine'),
    refetchInterval: jetzt ? JETZT_TAKT_MS : false,
    queryFn: async () =>
      unwrap(
        await api.GET('/raeume/uebersicht', {
          params: { query: zeitpunkt ? { zeitpunkt } : {} },
        }),
      ),
  });
}

/** Kuratierte Raumliste mit Größenklasse, E-Key und Schließzeit (Requirement „Raumsuche auf kuratierte Liste beschränken"). */
export function useKuratierteRaeume() {
  return useQuery<Raum[]>({
    queryKey: ['stammdaten', 'raeume'],
    staleTime: staleTime('stammdaten'),
    gcTime: gcTime('stammdaten'),
    queryFn: async () => unwrap(await api.GET('/stammdaten')).raeume,
  });
}

/** Tagesbelegung eines Raums (Requirement „Belegung eines gewählten Raums anzeigen"). */
export function useRaumbelegung(roomId: string, datum: string) {
  return useQuery<Raumbelegung>({
    queryKey: ['raumbelegung', roomId, datum],
    enabled: roomId.length > 0,
    staleTime: staleTime('raumtermine'),
    gcTime: gcTime('raumtermine'),
    queryFn: async () =>
      unwrap(
        await api.GET('/raeume/{roomId}/belegung', {
          params: { path: { roomId }, query: { datum } },
        }),
      ),
  });
}
