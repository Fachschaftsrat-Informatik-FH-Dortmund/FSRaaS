import { useCallback, useEffect, useState } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// MENSA-F-080 / MENSA-F-090: Lieblingsgerichte, adressiert über den normalisierten
// Gerichtsschlüssel (`schluessel`, vom Backend geliefert) — dieselbe Markierung
// unabhängig vom Zubereitungstag. Personenbezogen (Ernährungsvorlieben), rein
// gerätelokal (DATA Abschnitt 2, MENSA-F-090). Kein serverseitiges Pendant.

const KEY = 'favoriteDishes';

export interface FavoriteDish {
  schluessel: string;
  /** Zuletzt gesehene Bezeichnung — nur für die Anzeige, falls das Gericht gerade nicht im Plan steht. */
  letzteBezeichnung: string;
}

export function readFavorites(): Promise<FavoriteDish[]> {
  return readJson<FavoriteDish[]>(KEY, []);
}

export function useFavorites() {
  const [list, setList] = useState<FavoriteDish[]>([]);

  useEffect(() => {
    readFavorites()
      .then(setList)
      .catch((error) => logError('favorites.load', error));
  }, []);

  const has = useCallback(
    (schluessel: string) => list.some((f) => f.schluessel === schluessel),
    [list],
  );

  const toggle = useCallback((gericht: { schluessel: string; bezeichnung: string }) => {
    setList((prev) => {
      const drin = prev.some((f) => f.schluessel === gericht.schluessel);
      const next = drin
        ? prev.filter((f) => f.schluessel !== gericht.schluessel)
        : [...prev, { schluessel: gericht.schluessel, letzteBezeichnung: gericht.bezeichnung }];
      writeJson(KEY, next).catch((error) => logError('favorites.save', error));
      return next;
    });
  }, []);

  return { list, has, toggle };
}
