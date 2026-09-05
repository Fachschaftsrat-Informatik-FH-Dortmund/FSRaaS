import { useCallback, useSyncExternalStore } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// Ansichtseinstellungen des Stundenplans (`specs/features/schedule/spec.md`
// Abschnitt 5): proportionale Zeitachse oder kompakte Liste (SCHED-F-530),
// gruppenfremde Termine ausblenden (SCHED-F-145) und Sprung zum aktuellen
// Wochentag beim Öffnen (SCHED-F-150). Rein gerätelokal. Reaktiver
// Modul-Speicher wie `canteen/selection.ts`.

const KEY = 'scheduleViewSettings';

export interface AnsichtEinstellungen {
  /** SCHED-F-520/530: `true` = proportionale Zeitachse (Vorgabe), `false` = kompakte Liste. */
  zeitachse: boolean;
  /** SCHED-F-145: gruppenfremde Termine ausblenden statt nur zu kennzeichnen (SCHED-F-140). */
  gruppenfremdeAusblenden: boolean;
  /** SCHED-F-150: beim Öffnen automatisch zum aktuellen Wochentag springen. */
  sprungZuHeute: boolean;
}

const STANDARD: AnsichtEinstellungen = {
  zeitachse: true,
  gruppenfremdeAusblenden: false,
  sprungZuHeute: true,
};

let snapshot: AnsichtEinstellungen = STANDARD;
let geladen = false;
let ladeGestartet = false;
const hoerer = new Set<() => void>();

function melden() {
  for (const h of hoerer) h();
}

function bereinige(v: unknown): AnsichtEinstellungen {
  const roh = (v ?? {}) as Partial<Record<keyof AnsichtEinstellungen, unknown>>;
  const alsBoolean = (x: unknown, standard: boolean): boolean => (typeof x === 'boolean' ? x : standard);
  return {
    zeitachse: alsBoolean(roh.zeitachse, STANDARD.zeitachse),
    gruppenfremdeAusblenden: alsBoolean(roh.gruppenfremdeAusblenden, STANDARD.gruppenfremdeAusblenden),
    sprungZuHeute: alsBoolean(roh.sprungZuHeute, STANDARD.sprungZuHeute),
  };
}

function subscribe(cb: () => void): () => void {
  hoerer.add(cb);
  if (!ladeGestartet) {
    ladeGestartet = true;
    readJson<AnsichtEinstellungen>(KEY, STANDARD)
      .then((v) => {
        snapshot = bereinige(v);
      })
      .catch((error) => logError('ansichtEinstellungen.load', error))
      .finally(() => {
        geladen = true;
        melden();
      });
  }
  return () => {
    hoerer.delete(cb);
  };
}

function schreiben(next: AnsichtEinstellungen) {
  snapshot = next;
  geladen = true;
  melden();
  writeJson(KEY, next).catch((error) => logError('ansichtEinstellungen.save', error));
}

export function readAnsichtEinstellungen(): Promise<AnsichtEinstellungen> {
  return readJson<AnsichtEinstellungen>(KEY, STANDARD).then(bereinige);
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function __resetAnsichtEinstellungenForTest(): void {
  snapshot = STANDARD;
  geladen = false;
  ladeGestartet = false;
  hoerer.clear();
}

export function useAnsichtEinstellungen() {
  const einstellungen = useSyncExternalStore(subscribe, () => snapshot);
  const loaded = useSyncExternalStore(subscribe, () => geladen);

  const toggleZeitachse = useCallback(() => schreiben({ ...snapshot, zeitachse: !snapshot.zeitachse }), []);
  const toggleGruppenfremdeAusblenden = useCallback(
    () => schreiben({ ...snapshot, gruppenfremdeAusblenden: !snapshot.gruppenfremdeAusblenden }),
    [],
  );
  const toggleSprungZuHeute = useCallback(
    () => schreiben({ ...snapshot, sprungZuHeute: !snapshot.sprungZuHeute }),
    [],
  );

  return { einstellungen, loaded, toggleZeitachse, toggleGruppenfremdeAusblenden, toggleSprungZuHeute };
}
