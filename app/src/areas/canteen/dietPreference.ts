import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import { LEERE_DIET_PREFS, type DietPrefs } from './dietFilter';

// MENSA-F-250 / F-260 / F-275: Lebensstil-Vorgabe (`nurZeigen`) und Ausschluss
// (`ausschluss`) über die Gericht-Kennzeichnungen. Gewöhnliche Ernährungs-
// vorlieben (nicht Art. 9 DSGVO wie die Unverträglichkeiten), dennoch
// ausschließlich gerätelokal — wird NIE an das Backend oder eine andere externe
// Schnittstelle übertragen (MENSA-F-275). Reaktiver Modul-Speicher wie
// `selection.ts`, damit Filterbildschirm und Mensaplan denselben Stand teilen.

const KEY = 'dishDietPreference';

let snapshot: DietPrefs = LEERE_DIET_PREFS;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function bereinige(v: unknown): DietPrefs {
  const roh = (v ?? {}) as Partial<Record<keyof DietPrefs, unknown>>;
  const liste = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((e): e is string => typeof e === 'string') : [];
  return { nurZeigen: liste(roh.nurZeigen), ausschluss: liste(roh.ausschluss) };
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<DietPrefs>(KEY, LEERE_DIET_PREFS)
      .then((v) => {
        snapshot = bereinige(v);
      })
      .catch((error) => logError('dietPreference.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: DietPrefs) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('dietPreference.save', error));
}

function umschalten(feld: keyof DietPrefs, code: string): DietPrefs {
  const aktuell = snapshot[feld];
  const neu = aktuell.includes(code)
    ? aktuell.filter((c) => c !== code)
    : [...aktuell, code];
  // Eine Kennzeichnung ist entweder Lebensstil-Vorgabe oder Ausschluss, nie beides.
  const anderes: keyof DietPrefs = feld === 'nurZeigen' ? 'ausschluss' : 'nurZeigen';
  return {
    ...snapshot,
    [feld]: neu,
    [anderes]: snapshot[anderes].filter((c) => c !== code),
  } as DietPrefs;
}

export function readDietPreference(): Promise<DietPrefs> {
  return readJson<DietPrefs>(KEY, LEERE_DIET_PREFS).then(bereinige);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetDietPreferenceForTest(): void {
  snapshot = LEERE_DIET_PREFS;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useDietPreference() {
  const prefs = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const toggleNurZeigen = useCallback((code: string) => schreiben(umschalten('nurZeigen', code)), []);
  const toggleAusschluss = useCallback(
    (code: string) => schreiben(umschalten('ausschluss', code)),
    [],
  );
  const clear = useCallback(() => schreiben(LEERE_DIET_PREFS), []);

  return { prefs, loaded, toggleNurZeigen, toggleAusschluss, clear };
}
