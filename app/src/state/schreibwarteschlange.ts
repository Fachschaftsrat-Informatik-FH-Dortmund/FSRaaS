import { useMutationState, type Mutation, type QueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { AppError, logDatenhinweis, logError } from '@/errors/AppError';

// Generische Offline-Schreib-Warteschlange (ADR 0013; Capability `architecture`,
// Requirements „Offline-Warteschlange für Schreibvorgänge" und „Pause-/
// Fortsetzungs-Mechanismus der Offline-Warteschlange"; Capability
// `data-and-storage`, Requirements „Lokale Offline-Warteschlange mit
// FIFO-Übertragung", „Manuelle Entscheidung bei dauerhaft fehlgeschlagenem
// Schreibvorgang", „Status der Offline-Warteschlange einsehbar").
//
// Getragen von der Mutation-Pause/Resume von TanStack Query:
// - alle Einträge teilen einen Scope ⇒ Übertragung nacheinander in
//   Entstehungsreihenfolge (FIFO), spätere bleiben pausiert;
// - `networkMode: 'online'` ⇒ ohne Netz pausiert, bei Wiederverbindung
//   fortgesetzt, ohne erneute Bedienung;
// - Persistenz über den AsyncStorage-Persister (state/Providers.tsx) mit
//   eigenem Filter, Fortsetzen nach dem Neustart über `setzeWarteschlangeFort`.
//
// Ein Bereich beschreibt seinen Schreibvorgang mit `definiereSchreibvorgang`
// und nimmt ihn in `state/schreibvorgaenge.ts` auf; die Registrierung muss vor
// der Wiederherstellung aus dem Persister geschehen, sonst findet ein
// wiederhergestellter Eintrag seine Funktion nicht.
//
// Ausgenommen bleiben Verwaltungs- und Moderationshandlungen (ARCH-F-125): Sie
// laufen nicht über diese Warteschlange und werden ohne Netz abgelehnt.

/** Erstes Element des Mutationsschlüssels jedes Warteschlangen-Eintrags. */
export const WARTESCHLANGE_SCHLUESSEL = 'schreibvorgang';
/** Gemeinsamer Scope: hält die Einträge in Entstehungsreihenfolge. */
export const WARTESCHLANGE_SCOPE = 'schreibwarteschlange';
/** Wiederholungen nach dem ersten Fehlversuch, bevor die Nutzerin entscheidet. */
export const MAX_WIEDERHOLUNGEN = 5;
/** Verfallsfrist eines Eintrags (Arbeitsziel 7 Tage, Capability `data-and-storage`). */
export const VERFALL_MS = 7 * 24 * 60 * 60 * 1000;

/** Was in der Warteschlange liegt. `id` ist zugleich der Idempotenz-Schlüssel (API-F-140). */
export interface Schreibauftrag<N = unknown> {
  id: string;
  /** ISO-Zeitpunkt der Auslösung. */
  eingereihtAm: string;
  nutzdaten: N;
}

export interface Schreibvorgang<N = unknown, E = unknown> {
  art: string;
  ausfuehren: (auftrag: Schreibauftrag<N>) => Promise<E>;
  /** Nach erfolgreicher Übertragung, auch nach einem Neustart (z. B. Invalidieren). */
  nachErfolg?: (client: QueryClient, ergebnis: E, auftrag: Schreibauftrag<N>) => void | Promise<void>;
}

export function definiereSchreibvorgang<N, E>(
  art: string,
  optionen: Omit<Schreibvorgang<N, E>, 'art'>,
): Schreibvorgang<N, E> {
  return { art, ...optionen };
}

/** Wiederholen nur, was sich durch Warten bessern kann: Netz, Zeitgrenze, 5xx, 429. */
export function sollWiederholen(fehlversuche: number, fehler: unknown): boolean {
  return AppError.from(fehler).retryable && fehlversuche < MAX_WIEDERHOLUNGEN;
}

/** Steigender Abstand: 2 s, 4 s, 8 s … höchstens 5 Minuten. */
export function wiederholungsabstand(fehlversuche: number): number {
  return Math.min(2_000 * 2 ** fehlversuche, 300_000);
}

type Eintrag = Mutation<unknown, unknown, Schreibauftrag, unknown>;

/** Strukturelle Sicht auf eine Mutation, unabhängig von ihren Typparametern. */
interface MutationSicht {
  options: { mutationKey?: readonly unknown[] };
  state: { status: string };
}

export function istWarteschlangenEintrag(mutation: MutationSicht): boolean {
  return mutation.options.mutationKey?.[0] === WARTESCHLANGE_SCHLUESSEL;
}

function artVon(mutation: MutationSicht): string {
  return String(mutation.options.mutationKey?.[1] ?? '');
}

/** Für den Persister: wartende, laufende und fehlgeschlagene Einträge überdauern den Neustart. */
export function sollEintragPersistieren(mutation: MutationSicht): boolean {
  return istWarteschlangenEintrag(mutation) &&
    (mutation.state.status === 'pending' || mutation.state.status === 'error');
}

const registriert = new WeakSet<QueryClient>();

/** Setzt je Art die Mutationsvorgaben; einmal je Client, vor der Wiederherstellung. */
export function registriereSchreibvorgaenge(client: QueryClient, vorgaenge: Schreibvorgang<never, never>[]): void {
  for (const vorgang of vorgaenge as unknown as Schreibvorgang[]) {
    client.setMutationDefaults([WARTESCHLANGE_SCHLUESSEL, vorgang.art], {
      mutationFn: (auftrag: unknown) => vorgang.ausfuehren(auftrag as Schreibauftrag),
      onSuccess: (ergebnis: unknown, auftrag: unknown) =>
        vorgang.nachErfolg?.(client, ergebnis, auftrag as Schreibauftrag),
      networkMode: 'online',
      retry: sollWiederholen,
      retryDelay: wiederholungsabstand,
      scope: { id: WARTESCHLANGE_SCOPE },
      // Ein fehlgeschlagener Eintrag wartet auf die Entscheidung der Nutzerin,
      // statt nach der Standardfrist still zu verschwinden (SEC-F-060).
      gcTime: Infinity,
    });
  }
  if (registriert.has(client)) return;
  registriert.add(client);
  // Übertragenes verlässt die Warteschlange sofort.
  client.getMutationCache().subscribe((ereignis) => {
    if (ereignis.type === 'updated' && istWarteschlangenEintrag(ereignis.mutation) &&
      ereignis.mutation.state.status === 'success') {
      client.getMutationCache().remove(ereignis.mutation);
    }
  });
}

function starte(client: QueryClient, art: string, auftrag: Schreibauftrag): void {
  const mutation = client.getMutationCache().build(client, { mutationKey: [WARTESCHLANGE_SCHLUESSEL, art] });
  mutation.execute(auftrag).catch((fehler: unknown) => {
    // Bleibt als fehlgeschlagener Eintrag zur manuellen Entscheidung stehen.
    logError(`schreibwarteschlange.${art}`, fehler);
  });
}

/** Reiht einen Schreibvorgang ein; ohne Netz pausiert er, bis die Verbindung zurück ist. */
export function reiheEin<N, E>(client: QueryClient, vorgang: Schreibvorgang<N, E>, nutzdaten: N): Schreibauftrag<N> {
  const auftrag: Schreibauftrag<N> = {
    id: Crypto.randomUUID(),
    eingereihtAm: new Date().toISOString(),
    nutzdaten,
  };
  starte(client, vorgang.art, auftrag as Schreibauftrag);
  return auftrag;
}

function eintraege(client: QueryClient): Eintrag[] {
  return client.getMutationCache().getAll().filter(istWarteschlangenEintrag) as Eintrag[];
}

/** Entfernt Einträge jenseits der Verfallsfrist und protokolliert den Verfall. */
export function raeumeVerfalleneAuf(client: QueryClient, jetzt: number = Date.now()): number {
  const verfallen = eintraege(client).filter((m) => {
    const eingereiht = Date.parse(m.state.variables?.eingereihtAm ?? '');
    return Number.isFinite(eingereiht) && jetzt - eingereiht > VERFALL_MS;
  });
  for (const m of verfallen) client.getMutationCache().remove(m);
  if (verfallen.length > 0) logDatenhinweis('schreibwarteschlange', 'verfallen', verfallen.length);
  return verfallen.length;
}

/**
 * Nach der Wiederherstellung aus dem Persister: Verfallenes entfernen, jeden
 * wartenden Eintrag wieder anstoßen — auch einen, der beim Beenden gerade lief
 * (der Idempotenz-Schlüssel verhindert eine doppelte Wirkung). Die
 * Scope-Regel hält dabei die Reihenfolge.
 */
export function setzeWarteschlangeFort(client: QueryClient): void {
  raeumeVerfalleneAuf(client);
  for (const m of eintraege(client)) {
    if (m.state.status !== 'pending') continue;
    m.continue().catch((fehler: unknown) => logError(`schreibwarteschlange.${artVon(m)}`, fehler));
  }
}

export type EintragsZustand = 'wartend' | 'laeuft' | 'fehlgeschlagen';

export interface WarteschlangenEintrag {
  mutationId: number;
  art: string;
  auftrag: Schreibauftrag;
  zustand: EintragsZustand;
  /** Nur bei `fehlgeschlagen`: Fehlerart und -code (nach einem Neustart ohne Meldungstext). */
  fehler?: { kind: string; code?: string };
}

interface EintragSicht {
  mutationId: number;
  options: { mutationKey?: readonly unknown[] };
  state: { status: string; isPaused: boolean; variables?: unknown; error?: unknown };
}

function alsEintrag(m: EintragSicht): WarteschlangenEintrag | null {
  const auftrag = m.state.variables as Schreibauftrag | undefined;
  if (!auftrag || m.state.status === 'success') return null;
  const zustand: EintragsZustand = m.state.status === 'error'
    ? 'fehlgeschlagen'
    : m.state.status === 'pending' && !m.state.isPaused ? 'laeuft' : 'wartend';
  const roh = m.state.error as { kind?: unknown; code?: unknown } | null;
  return {
    mutationId: m.mutationId,
    art: artVon(m),
    auftrag,
    zustand,
    ...(zustand === 'fehlgeschlagen'
      ? { fehler: { kind: typeof roh?.kind === 'string' ? roh.kind : 'unknown', ...(typeof roh?.code === 'string' ? { code: roh.code } : {}) } }
      : {}),
  };
}

/** Momentaufnahme der Warteschlange, optional auf bestimmte Arten beschränkt. */
export function leseWarteschlange(client: QueryClient, arten?: readonly string[]): WarteschlangenEintrag[] {
  return eintraege(client)
    .filter((m) => !arten || arten.includes(artVon(m)))
    .map(alsEintrag)
    .filter((e): e is WarteschlangenEintrag => e !== null);
}

/** Reaktiver Status der Warteschlange für die Anzeige. */
export function useSchreibwarteschlange(arten?: readonly string[]): WarteschlangenEintrag[] {
  return useMutationState({
    filters: {
      mutationKey: [WARTESCHLANGE_SCHLUESSEL],
      predicate: (m) => !arten || arten.includes(artVon(m)),
    },
    select: alsEintrag,
  }).filter((e): e is WarteschlangenEintrag => e !== null);
}

function finde(client: QueryClient, mutationId: number): Eintrag | undefined {
  return eintraege(client).find((m) => m.mutationId === mutationId);
}

/** Manuelle Entscheidung „erneut versuchen": derselbe Auftrag, derselbe Idempotenz-Schlüssel. */
export function versucheErneut(client: QueryClient, eintrag: WarteschlangenEintrag): void {
  const m = finde(client, eintrag.mutationId);
  if (!m) return;
  client.getMutationCache().remove(m);
  starte(client, eintrag.art, eintrag.auftrag);
}

/** Manuelle Entscheidung „verwerfen". */
export function verwirf(client: QueryClient, eintrag: WarteschlangenEintrag): void {
  const m = finde(client, eintrag.mutationId);
  if (m) client.getMutationCache().remove(m);
}

/**
 * Nimmt einen noch nicht begonnenen Eintrag aus der Warteschlange. Liefert
 * `false`, wenn er schon läuft oder übertragen ist — dann muss der Aufrufer
 * den Vorgang auf anderem Weg rückgängig machen.
 */
export function nimmZurueck(client: QueryClient, auftragId: string): boolean {
  const m = eintraege(client).find((e) => e.state.variables?.id === auftragId);
  if (!m) return false;
  if (m.state.status === 'pending' && !m.state.isPaused) return false;
  if (m.state.status === 'success') return false;
  client.getMutationCache().remove(m);
  return true;
}
