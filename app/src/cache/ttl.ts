// Gültigkeitsdauer je Datenart für den Lese-Zwischenspeicher (DATA-F-080,
// Quelle: data-and-storage.md Abschnitt 4). Wird als `staleTime` je TanStack-
// Query-Abfrage verwendet; `gcTime` hält den Stand darüber hinaus vor, damit er
// offline weiter angezeigt werden kann (DATA-F-090).

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Millisekunden bis zum Ende des laufenden Tages (lokale Zeit). */
export function untilEndOfDay(now: Date = new Date()): number {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(0, end.getTime() - now.getTime());
}

export type CachedResource =
  | 'speiseplan'
  | 'mensaVerzeichnisse'
  | 'news'
  | 'raumtermine'
  | 'stammdaten'
  | 'events'
  | 'ekeyStatus'
  | 'wiki'
  | 'studiengaenge'
  | 'stundenplanTermine';

type Ttl = number | (() => number);

const TTL: Record<CachedResource, Ttl> = {
  speiseplan: () => untilEndOfDay(),
  mensaVerzeichnisse: DAY,
  news: 15 * MINUTE,
  raumtermine: 15 * MINUTE,
  stammdaten: DAY,
  events: DAY,
  ekeyStatus: 15 * MINUTE,
  wiki: DAY,
  // INT-001/INT-002 (`platform/integrations.md`): beide schlagen als
  // Cache-Regel-Vorschlag einen Tag vor — Studiengänge/Fachsemester ändern
  // sich selten, der Terminbestand innerhalb eines Semesters kaum.
  studiengaenge: DAY,
  stundenplanTermine: DAY,
};

/** staleTime in ms für eine Datenart. */
export function staleTime(resource: CachedResource): number {
  const value = TTL[resource];
  return typeof value === 'function' ? value() : value;
}

/**
 * Wie lange ein nicht mehr aktueller Stand offline weiter angezeigt werden darf,
 * bevor er verworfen wird. Großzügiger als staleTime — der Altershinweis
 * (DATA-F-090) macht die Veralterung sichtbar.
 */
export function gcTime(resource: CachedResource): number {
  return Math.max(staleTime(resource), 7 * DAY);
}

/**
 * Arbeitsziel-Obergrenze für den gesamten persistierten Zwischenspeicher
 * (DATA-N-150, einschließlich TanStack-Query-Persister-Cache gemäß ADR 0013).
 * Byte-genaue Durchsetzung ist offen (data-and-storage.md Abschnitt 9); der
 * Persister begrenzt vorerst über `maxAge`.
 */
export const MAX_CACHE_BYTES = 50 * 1024 * 1024;
export const PERSIST_MAX_AGE = 7 * DAY;
