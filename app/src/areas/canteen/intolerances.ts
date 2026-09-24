import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// MENSA-F-180 / F-215: Selbst festgelegte Unverträglichkeiten (Allergen- und
// Zusatzstoffkennzeichnungen aus dem Verzeichnis `/mensen/verzeichnisse`, das
// das Backend aus der Legende von INT-020 speist). Die Auswahl bleibt **eine**
// Liste von Schlüsseln, obwohl das Filtermenü Allergene und Zusatzstoffe seit
// der Ablösung von INT-015 getrennt führt: die Schlüssel sind in beiden Quellen
// dieselben, eine vor der Trennung festgelegte Auswahl bleibt damit ohne
// Umschreibung gültig (Requirement „Getrennte Abschnitte für Allergene und
// Zusatzstoffe im Filtermenü"). Besondere
// Kategorie personenbezogener Daten (Art. 9 DSGVO) — ausschließlich gerätelokal,
// wird NIE an das Backend oder eine andere externe Schnittstelle übertragen
// (MENSA-F-215). Reaktiver Modul-Speicher wie `selection.ts`.

const KEY = 'dishIntolerances';

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
        snapshot = Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
      })
      .catch((error) => logError('intolerances.load', error))
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
  writeJson(KEY, next).catch((error) => logError('intolerances.save', error));
}

export function readIntolerances(): Promise<string[]> {
  return readJson<string[]>(KEY, []);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetIntolerancesForTest(): void {
  snapshot = [];
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useIntolerances() {
  const codes = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const toggle = useCallback(
    (code: string) =>
      schreiben(snapshot.includes(code) ? snapshot.filter((c) => c !== code) : [...snapshot, code]),
    [],
  );
  // Sammelschalter einer Allergengruppe (Requirement „Sammelschalter für
  // zusammengehörige Allergengruppen"): setzt oder löscht alle Unterschlüssel
  // gemeinsam in einem Schreibvorgang, damit nicht je Unterschlüssel ein
  // eigener Speicherlauf anfällt.
  const setzeMehrere = useCallback((mehrere: readonly string[], aktiv: boolean) => {
    const naechste = new Set(snapshot);
    for (const code of mehrere) {
      if (aktiv) naechste.add(code);
      else naechste.delete(code);
    }
    schreiben([...naechste]);
  }, []);
  const clear = useCallback(() => schreiben([]), []);

  return { codes, loaded, toggle, setzeMehrere, clear };
}
