import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// MENSA-F-235: Preisfilter — Höchstpreis für die Gerichtsliste. `null` = kein
// Limit. Verglichen wird gegen den Preis der gewählten Preisgruppe (SET-F-180)
// der maßgeblichen Mensa. Rein gerätelokal; reaktiver Modul-Speicher wie
// `selection.ts`.

const KEY = 'maxPrice';

/** Schrittweite und Grenzen des Höchstpreis-Stellers (in Euro). */
export const PREIS_SCHRITT = 0.5;
export const PREIS_MIN = 1;
export const PREIS_MAX = 10;

let snapshot: number | null = null;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function bereinige(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<number | null>(KEY, null)
      .then((v) => {
        snapshot = bereinige(v);
      })
      .catch((error) => logError('priceLimit.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: number | null) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('priceLimit.save', error));
}

export function readPriceLimit(): Promise<number | null> {
  return readJson<number | null>(KEY, null).then(bereinige);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetPriceLimitForTest(): void {
  snapshot = null;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

function gerundet(n: number): number {
  return Math.round(n / PREIS_SCHRITT) * PREIS_SCHRITT;
}

export function usePriceLimit() {
  const limit = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const erhoehen = useCallback(() => {
    const ziel = limit == null ? PREIS_MIN : gerundet(limit + PREIS_SCHRITT);
    schreiben(Math.min(ziel, PREIS_MAX));
  }, [limit]);

  const senken = useCallback(() => {
    if (limit == null) return;
    const ziel = gerundet(limit - PREIS_SCHRITT);
    schreiben(ziel < PREIS_MIN ? null : ziel);
  }, [limit]);

  const clear = useCallback(() => schreiben(null), []);

  return { limit, loaded, erhoehen, senken, clear };
}
