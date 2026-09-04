import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// SET-F-180 / SET-F-190: Eigene Preisgruppe für den Mensaplan. Wirkt über
// MENSA-F-220 auf die Hauptansicht (nur der eigene Preis). Voreinstellung
// „student" (SET-F-190). Rein gerätelokal; reaktiver Modul-Speicher wie
// `selection.ts`, damit Einstellungsbildschirm und Mensaplan denselben Stand
// teilen (kein globaler State-Store, ARCH-N-030).

export type PriceGroup = 'student' | 'staff' | 'guest';
export const priceGroups: readonly PriceGroup[] = ['student', 'staff', 'guest'];

const KEY = 'priceGroup';
const VORGABE: PriceGroup = 'student';

function istPriceGroup(v: unknown): v is PriceGroup {
  return v === 'student' || v === 'staff' || v === 'guest';
}

let snapshot: PriceGroup = VORGABE;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<PriceGroup>(KEY, VORGABE)
      .then((v) => {
        snapshot = istPriceGroup(v) ? v : VORGABE;
      })
      .catch((error) => logError('priceGroup.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: PriceGroup) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('priceGroup.save', error));
}

export function readPriceGroup(): Promise<PriceGroup> {
  return readJson<PriceGroup>(KEY, VORGABE).then((v) => (istPriceGroup(v) ? v : VORGABE));
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetPriceGroupForTest(): void {
  snapshot = VORGABE;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function usePriceGroup() {
  const group = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);
  const setGroup = useCallback((next: PriceGroup) => schreiben(next), []);
  return { group, loaded, setGroup };
}
