import { useCallback, useSyncExternalStore } from 'react';

// Requirement „Einblendung nur für die laufende Sitzung" (Change
// `alternativtermine-abgesetzt-und-sitzungsweise`, design.md Entscheidung 2):
// die beiden Einblendungsschalter der Wochenansicht. Reaktiver Modulspeicher
// nach dem Muster von `ansichtEinstellungen.ts`, aber bewusst ohne
// `readJson`/`writeJson` — der Stand lebt genau so lange wie der JS-Prozess,
// also eine App-Sitzung, und beginnt bei jedem App-Start abgeschaltet.

export interface EinblendungsStand {
  /** Requirement „Einblenden aller Veranstaltungen gewählter Module" (`alternativen.ts`). */
  alternativen: boolean;
  /** Requirement „Einblenden nicht gewählter Veranstaltungen" (`alternativen.ts`). */
  alle: boolean;
}

const AUS: EinblendungsStand = { alternativen: false, alle: false };

let snapshot: EinblendungsStand = AUS;
const hoerer = new Set<() => void>();

function setzen(next: EinblendungsStand) {
  snapshot = next;
  for (const h of hoerer) h();
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  return () => {
    hoerer.delete(cb);
  };
}

/** Nur für Tests: Stand wie nach einem App-Start. */
export function __resetEinblendungsStandForTest(): void {
  snapshot = AUS;
  hoerer.clear();
}

/** Nur für Tests: Stand vorbelegen, ohne einen Bildschirm zu bedienen. */
export function __setzeEinblendungsStandForTest(stand: Partial<EinblendungsStand>): void {
  setzen({ ...AUS, ...stand });
}

export function useEinblendungsStand() {
  const stand = useSyncExternalStore(subscribe, () => snapshot);

  const toggleAlternativen = useCallback(() => setzen({ ...snapshot, alternativen: !snapshot.alternativen }), []);
  const toggleAlle = useCallback(() => setzen({ ...snapshot, alle: !snapshot.alle }), []);
  /** Requirement „Hinweis auf aktive Einblendung in der Kopfzeile", Szenario „Chip antippen". */
  const alleAbschalten = useCallback(() => setzen(AUS), []);

  return {
    stand,
    aktiv: stand.alternativen || stand.alle,
    toggleAlternativen,
    toggleAlle,
    alleAbschalten,
  };
}
