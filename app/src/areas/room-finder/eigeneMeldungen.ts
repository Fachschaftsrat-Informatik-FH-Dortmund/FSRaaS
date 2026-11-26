import { useEffect, useState } from 'react';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';

// Eigene, übertragene Besetzt-Meldungen dieses Geräts (Requirement
// „Besetzt-Meldung zurückziehen": „solange die meldende Person dieselbe
// Gerätesitzung verwendet"). Gerätelokal, ohne Personenbezug: Meldungskennung
// (= Idempotenz-Schlüssel), Raum und Ende der Gültigkeit. Abgelaufene Einträge
// fallen beim nächsten Lesen heraus; „Alle lokalen Daten löschen" erfasst die
// Liste über das gemeinsame Präfix (storage/kv.ts).

const KEY = 'raum.eigeneBesetztMeldungen';

export interface EigeneMeldung {
  meldungId: string;
  roomId: string;
  /** ISO-Zeitpunkt aus der Quittung des Backends. */
  gueltigBis: string;
}

const hoerer = new Set<() => void>();

function gueltige(liste: EigeneMeldung[], jetzt: number): EigeneMeldung[] {
  return liste.filter((m) => Date.parse(m.gueltigBis) > jetzt);
}

export async function leseEigeneMeldungen(jetzt: number = Date.now()): Promise<EigeneMeldung[]> {
  return gueltige(await readJson<EigeneMeldung[]>(KEY, []), jetzt);
}

async function speichere(liste: EigeneMeldung[]): Promise<void> {
  await writeJson(KEY, liste);
  hoerer.forEach((h) => h());
}

export async function merkeEigeneMeldung(meldung: EigeneMeldung): Promise<void> {
  const jetzt = Date.now();
  const liste = (await leseEigeneMeldungen(jetzt)).filter((m) => m.meldungId !== meldung.meldungId);
  // Eine beim Eingang schon abgelaufene Meldung gibt es nicht zurückzuziehen.
  if (Date.parse(meldung.gueltigBis) > jetzt) liste.push(meldung);
  await speichere(liste);
}

export async function vergissEigeneMeldung(meldungId: string): Promise<void> {
  const liste = await leseEigeneMeldungen();
  await speichere(liste.filter((m) => m.meldungId !== meldungId));
}

/** Eigene gültige Meldungen, reaktiv auf Änderungen aus Bedienung und Warteschlange. */
export function useEigeneMeldungen(): EigeneMeldung[] {
  const [liste, setListe] = useState<EigeneMeldung[]>([]);

  useEffect(() => {
    let aktiv = true;
    const aktualisiere = () => {
      leseEigeneMeldungen()
        .then((l) => {
          if (aktiv) setListe(l);
        })
        .catch((fehler: unknown) => logError('raum.eigeneMeldungen', fehler));
    };
    aktualisiere();
    hoerer.add(aktualisiere);
    return () => {
      aktiv = false;
      hoerer.delete(aktualisiere);
    };
  }, []);

  return liste;
}
