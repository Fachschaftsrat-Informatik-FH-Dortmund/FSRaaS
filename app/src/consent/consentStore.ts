// Persistenz der Datenschutz-Zustimmung. Schlüssel entsprechen den in
// data-and-storage.md Abschnitt 3 benannten Einstellungsschlüsseln der Alt-App
// (`privacyPolicyAccepted`, `privacyPolicyAcceptedVersion`).

import { readJson, writeJson } from '@/storage/kv';
import { privacyPolicy } from './privacyPolicy';

const KEY = 'privacyPolicyConsent';

export interface ConsentRecord {
  /** Zuletzt getroffene Entscheidung. `deferred` = "später, nur Basisfunktionen". */
  decision: 'accepted' | 'deferred';
  /** Fassung der Datenschutzerklärung zum Zeitpunkt der Entscheidung. */
  version: string;
  decidedAt: string;
}

export async function readConsent(): Promise<ConsentRecord | null> {
  return readJson<ConsentRecord | null>(KEY, null);
}

export async function writeConsent(decision: ConsentRecord['decision']): Promise<ConsentRecord> {
  const record: ConsentRecord = {
    decision,
    version: privacyPolicy.version,
    decidedAt: new Date().toISOString(),
  };
  await writeJson(KEY, record);
  return record;
}

export type ConsentStatus =
  /** Noch keine Entscheidung getroffen — Erststart-Fall (SHELL-F-030). */
  | 'undecided'
  /** Zugestimmt, Fassung aktuell (SEC-F-010). */
  | 'granted'
  /** Zugestimmt, aber Datenschutzerklärung hat sich seither geändert (SEC-F-020). */
  | 'outdated'
  /** Bewusst zurückgestellt — Basisfunktionen nutzbar, personenbezogene nicht. */
  | 'deferred';

export function statusFor(record: ConsentRecord | null): ConsentStatus {
  if (record === null) return 'undecided';
  if (record.decision === 'deferred') return 'deferred';
  return record.version === privacyPolicy.version ? 'granted' : 'outdated';
}

/** Zugriff auf personenbezogene/nutzergenerierte Funktionen erlaubt? (SEC-F-010) */
export function personalDataAllowed(status: ConsentStatus): boolean {
  return status === 'granted';
}
