import { useCallback, useEffect, useState } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// MENSA-F-020 / MENSA-F-025 (auch SET-F-030 / SET-F-150): Auswahl der angezeigten
// Mensen und ihre Reihenfolge, rein gerätelokal. Die Reihenfolge ist die
// Array-Reihenfolge.

const KEY = 'selectedCanteens';

export function readSelection(): Promise<string[]> {
  return readJson<string[]>(KEY, []);
}

export function useCanteenSelection() {
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readSelection()
      .then((v) => setIds(v))
      .catch((error) => logError('canteenSelection.load', error))
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    writeJson(KEY, next).catch((error) => logError('canteenSelection.save', error));
  }, []);

  const toggle = useCallback(
    (id: string) => persist(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
    [ids, persist],
  );

  /** Verschiebt eine Kennung um eine Position (Richtung -1 = nach oben). */
  const move = useCallback(
    (id: string, richtung: -1 | 1) => {
      const i = ids.indexOf(id);
      const j = i + richtung;
      if (i < 0 || j < 0 || j >= ids.length) return;
      const next = [...ids];
      [next[i], next[j]] = [next[j]!, next[i]!];
      persist(next);
    },
    [ids, persist],
  );

  return { ids, loaded, toggle, move };
}
