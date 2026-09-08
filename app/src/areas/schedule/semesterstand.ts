import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// Der zuletzt gesehene Stand der über INT-001 gelieferten Endpunktliste
// (Kurznamen, `sname`). `semesterwechsel.erkenneSemesterwechsel` vergleicht
// ihn mit der aktuell gelieferten Liste; welche Liste als „zuletzt
// gespeichert" gilt, legt laut jenem Modul die aufrufende Stelle fest — das
// ist dieser Speicher. Rein gerätelokal, reaktiver Modul-Speicher wie
// `einrichtung.ts`.
//
// Eigener Speicherschlüssel statt eines Feldes in `einrichtung.ts`: Der Stand
// ist kein Teil der von der Nutzerin getroffenen Einrichtung, sondern ein
// Merkposten für den Abgleich — er wird ohne ihr Zutun fortgeschrieben.

const KEY = 'scheduleSemesterstand';

interface Semesterstand {
  /** `null` = noch kein Stand vorhanden (erstmalige Einrichtung, kein Wechsel). */
  endpunkte: string[] | null;
}

const LEER: Semesterstand = { endpunkte: null };

let snapshot: Semesterstand = LEER;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function bereinige(v: unknown): Semesterstand {
  if (typeof v !== 'object' || v === null) return LEER;
  const roh = (v as Record<string, unknown>).endpunkte;
  if (!Array.isArray(roh)) return LEER;
  return { endpunkte: roh.filter((e): e is string => typeof e === 'string') };
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<unknown>(KEY, LEER)
      .then((v) => {
        snapshot = bereinige(v);
      })
      .catch((error) => logError('semesterstand.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetSemesterstandForTest(): void {
  snapshot = LEER;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useSemesterstand() {
  const gespeicherteEndpunkte = useSyncExternalStore(subscribe, () => snapshot.endpunkte);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const merkeEndpunkte = useCallback((endpunkte: readonly string[]) => {
    snapshot = { endpunkte: [...endpunkte] };
    geladen = true;
    melden();
    writeJson(KEY, snapshot).catch((error) => logError('semesterstand.save', error));
  }, []);

  return { gespeicherteEndpunkte, loaded, merkeEndpunkte };
}
