import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// MENSA-F-020 / MENSA-F-025 (auch SET-F-030 / SET-F-150): Auswahl der angezeigten
// Mensen und ihre Reihenfolge, rein gerätelokal. Die Reihenfolge ist die
// Array-Reihenfolge.
//
// Reaktiver Modul-Speicher: Der Mensaplan-Bildschirm und der Auswahl-Bildschirm
// (und die Einstellungen) teilen sich denselben Stand — ändert einer die Auswahl,
// sehen die anderen sie sofort, ohne Neustart oder Fokus-Wechsel. Kein globaler
// State-Management-Store (ARCH-N-030), nur ein Snapshot plus useSyncExternalStore.

const KEY = 'selectedCanteens';

let snapshot: string[] = [];
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
    readJson<string[]>(KEY, [])
      .then((v) => {
        snapshot = v;
      })
      .catch((error) => logError('canteenSelection.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: string[]) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('canteenSelection.save', error));
}

export function readSelection(): Promise<string[]> {
  return readJson<string[]>(KEY, []);
}

/** Nur für Tests: Modulzustand zurücksetzen (das Modul überlebt sonst zwischen Tests). */
export function __resetSelectionForTest(): void {
  snapshot = [];
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useCanteenSelection() {
  const ids = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const toggle = useCallback(
    (id: string) => schreiben(snapshot.includes(id) ? snapshot.filter((x) => x !== id) : [...snapshot, id]),
    [],
  );

  /** Verschiebt eine Kennung um eine Position (Richtung -1 = nach oben). */
  const move = useCallback((id: string, richtung: -1 | 1) => {
    const i = snapshot.indexOf(id);
    const j = i + richtung;
    if (i < 0 || j < 0 || j >= snapshot.length) return;
    const next = [...snapshot];
    [next[i], next[j]] = [next[j]!, next[i]!];
    schreiben(next);
  }, []);

  return { ids, loaded, toggle, move };
}
