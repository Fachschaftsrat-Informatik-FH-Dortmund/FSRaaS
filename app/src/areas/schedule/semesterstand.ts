import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// Der zuletzt gesehene Stand der Fachsemester-Liste des gewählten Studiengangs.
// `semesterwechsel.erkenneSemesterwechsel` vergleicht ihn mit der aktuell aus
// INT-001 gelieferten Liste; welche Liste als „zuletzt gespeichert" gilt, legt
// laut jenem Modul die aufrufende Stelle fest — das ist dieser Speicher. Rein
// gerätelokal, reaktiver Modul-Speicher wie `einrichtung.ts`.
//
// Eigener Speicherschlüssel statt eines Feldes in `einrichtung.ts`: Der Stand
// ist kein Teil der von der Nutzerin getroffenen Einrichtung, sondern ein
// Merkposten für den Abgleich — er wird ohne ihr Zutun fortgeschrieben.

const KEY = 'scheduleSemesterstand';

interface Semesterstand {
  /** `null` = noch kein Stand vorhanden (erstmalige Einrichtung, kein Wechsel). */
  grades: string[] | null;
}

const LEER: Semesterstand = { grades: null };

let snapshot: Semesterstand = LEER;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function bereinige(v: unknown): Semesterstand {
  if (typeof v !== 'object' || v === null) return LEER;
  const roh = (v as Record<string, unknown>).grades;
  if (!Array.isArray(roh)) return LEER;
  return { grades: roh.filter((g): g is string => typeof g === 'string') };
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
  const gespeicherteGrades = useSyncExternalStore(subscribe, () => snapshot.grades);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const merkeGrades = useCallback((grades: readonly string[]) => {
    snapshot = { grades: [...grades] };
    geladen = true;
    melden();
    writeJson(KEY, snapshot).catch((error) => logError('semesterstand.save', error));
  }, []);

  return { gespeicherteGrades, loaded, merkeGrades };
}
