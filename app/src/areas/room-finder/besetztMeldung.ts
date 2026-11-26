import { useQueryClient } from '@tanstack/react-query';

import type { components } from '@/api/generated/schema';
import { logError } from '@/errors/AppError';
import { api, unwrap } from '@/net/client';
import { problemToAppError } from '@/net/problem';
import {
  definiereSchreibvorgang,
  leseWarteschlange,
  nimmZurueck,
  reiheEin,
  useSchreibwarteschlange,
  type WarteschlangenEintrag,
} from '@/state/schreibwarteschlange';
import { merkeEigeneMeldung, useEigeneMeldungen, vergissEigeneMeldung, type EigeneMeldung } from './eigeneMeldungen';

// Besetzt-Meldungen der Raumsuche (Change `besetzt-meldungen`): der erste
// kontofreie Schreibpfad und erste Nutzer der Offline-Schreib-Warteschlange.
// Requirements „Raum als besetzt melden" (auch offline: eingereiht statt
// verworfen), „Besetzt-Meldung zurückziehen", „Gültigkeitsdauer einer
// Besetzt-Meldung" (der Auslösezeitpunkt reist als `gemeldetAm` mit).

export type BesetztMeldungQuittung = components['schemas']['BesetztMeldungQuittung'];

interface MeldenDaten {
  roomId: string;
}

interface ZurueckziehenDaten {
  roomId: string;
  meldungId: string;
}

const ART_MELDEN = 'besetztMeldung';
const ART_ZURUECKZIEHEN = 'besetztMeldungZurueckziehen';
export const BESETZT_ARTEN = [ART_MELDEN, ART_ZURUECKZIEHEN] as const;

export const besetztMelden = definiereSchreibvorgang<MeldenDaten, BesetztMeldungQuittung>(ART_MELDEN, {
  ausfuehren: async (auftrag) =>
    unwrap(
      await api.POST('/raeume/{roomId}/besetzt-meldungen', {
        params: {
          path: { roomId: auftrag.nutzdaten.roomId },
          header: { 'Idempotency-Key': auftrag.id },
        },
        body: { gemeldetAm: auftrag.eingereihtAm },
      }),
    ),
  nachErfolg: async (client, quittung, auftrag) => {
    // Wurde die Meldung inzwischen zurückgezogen (Rücknahme wartet hinter ihr in
    // der Warteschlange), merkt sich das Gerät sie nicht mehr als eigene.
    const zurueckgezogen = leseWarteschlange(client, [ART_ZURUECKZIEHEN])
      .some((e) => (e.auftrag.nutzdaten as ZurueckziehenDaten).meldungId === auftrag.id);
    if (!zurueckgezogen) {
      await merkeEigeneMeldung({
        meldungId: quittung.meldungId,
        roomId: auftrag.nutzdaten.roomId,
        gueltigBis: quittung.gueltigBis,
      });
    }
    await client.invalidateQueries({ queryKey: ['raumuebersicht'] });
  },
});

export const besetztMeldungZurueckziehen = definiereSchreibvorgang<ZurueckziehenDaten, null>(ART_ZURUECKZIEHEN, {
  ausfuehren: async (auftrag) => {
    const { roomId, meldungId } = auftrag.nutzdaten;
    const ergebnis = await api.DELETE('/raeume/{roomId}/besetzt-meldungen/{meldungId}', {
      params: { path: { roomId, meldungId } },
    });
    if (!ergebnis.response.ok) throw problemToAppError(ergebnis.response.status, ergebnis.error);
    return null;
  },
  nachErfolg: async (client) => {
    await client.invalidateQueries({ queryKey: ['raumuebersicht'] });
  },
});

export interface EigenerMeldestand {
  /** Übertragene, noch gültige eigene Meldung für diesen Raum. */
  eigene?: EigeneMeldung;
  /** Noch nicht (erfolgreich) übertragene eigene Meldung für diesen Raum. */
  ausstehend?: WarteschlangenEintrag;
  melden: () => void;
  zurueckziehen: () => void;
}

/** Bedienung „Als besetzt melden" / „Meldung zurückziehen" für einen Raum. */
export function useBesetztMeldung(roomId: string): EigenerMeldestand {
  const client = useQueryClient();
  const eigene = useEigeneMeldungen().find((m) => m.roomId === roomId);
  const warteschlange = useSchreibwarteschlange(BESETZT_ARTEN);
  const zurueckWartend = new Set(
    warteschlange
      .filter((e) => e.art === ART_ZURUECKZIEHEN)
      .map((e) => (e.auftrag.nutzdaten as ZurueckziehenDaten).meldungId),
  );
  const ausstehend = warteschlange.find((e) =>
    e.art === ART_MELDEN &&
    (e.auftrag.nutzdaten as MeldenDaten).roomId === roomId &&
    !zurueckWartend.has(e.auftrag.id));

  const melden = () => {
    if (eigene || ausstehend || !roomId) return; // höchstens eine aktive eigene Meldung je Raum
    reiheEin(client, besetztMelden, { roomId });
  };

  const zurueckziehen = () => {
    // Noch nicht begonnen: einfach aus der Warteschlange nehmen, nichts senden.
    if (ausstehend && nimmZurueck(client, ausstehend.auftrag.id)) return;
    const meldungId = eigene?.meldungId ?? ausstehend?.auftrag.id;
    if (!meldungId) return;
    // Läuft oder ist übertragen: Rücknahme einreihen — auch offline, sie
    // überschreibt keinen fremden Stand; die Reihenfolge hält sie hinter der Meldung.
    reiheEin(client, besetztMeldungZurueckziehen, { roomId, meldungId });
    vergissEigeneMeldung(meldungId).catch((fehler: unknown) => logError('raum.besetztZurueckziehen', fehler));
  };

  return { eigene, ausstehend, melden, zurueckziehen };
}
