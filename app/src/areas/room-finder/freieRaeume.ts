import { logDatenhinweis } from '@/errors/AppError';
import type { Raum, Raumgroesse, RaumStatus } from './api';
import { schliesszeitAm } from './schliesszeit';

// Freie-Raum-Suche (Requirement „Suche nach freien Räumen"), abgeleitet aus der
// Raumübersicht zum Beginn des gewählten Zeitraums und der kuratierten
// Raumliste (Change `raumsuche-app`, design.md). Die Übersicht kennt zu `von`
// den laufenden Termin und den nächsten Beginn — mehr braucht die Entscheidung
// „frei im Zeitraum [von, bis)" nicht, sie ist damit exakt.

export type Groessenfilter = Raumgroesse | 'alle';

export interface Suchfilter {
  groesse: Groessenfilter;
  nurEkey: boolean;
}

export const OHNE_FILTER: Suchfilter = { groesse: 'alle', nurEkey: false };

export interface FreierRaum {
  roomId: string;
  groesse: Raumgroesse;
  ekeyZugaenglich: boolean;
  /**
   * Bis wann der Raum frei ist (Requirement „Freizeitpunkt eines freien Raums
   * anzeigen"): nächster Terminbeginn oder gepflegte Schließzeit, je nachdem,
   * was früher liegt. `null`, wenn weder ein Folgetermin noch eine Schließzeit
   * bekannt ist — dann nennt die App keinen Endzeitpunkt (Requirement
   * „Gepflegte Gebäudeschließzeit statt fester Wert").
   */
  freiBis: Date | null;
  /** `true`, wenn `freiBis` die Schließzeit ist und nicht ein Folgetermin. */
  freiBisSchliesszeit: boolean;
  /** Gültige Besetzt-Meldungen zum Beginn (Requirement „Anzahl der Besetzt-Meldungen anzeigen"). */
  besetztMeldungen: number;
}

/**
 * Räume der kuratierten Liste, die im Zeitraum `[von, bis)` frei sind, nach
 * Raumkennung sortiert. Ein kuratierter Raum, den die Übersicht nicht führt,
 * gilt als unbekannt und erscheint nicht — „unbekannt" ist nicht „frei".
 */
export function freieRaeume(
  uebersicht: RaumStatus[],
  kuratiert: Raum[],
  von: Date,
  bis: Date,
  filter: Suchfilter = OHNE_FILTER,
): FreierRaum[] {
  const status = new Map(uebersicht.map((r) => [r.roomId, r]));
  const ergebnis: FreierRaum[] = [];
  let unlesbar = 0;

  for (const raum of kuratiert) {
    if (filter.groesse !== 'alle' && raum.groesse !== filter.groesse) continue;
    if (filter.nurEkey && !raum.ekeyZugaenglich) continue;

    const s = status.get(raum.roomId);
    if (!s || s.zustand !== 'frei') continue;

    const frei = freiBisFuer(s, raum.schliesszeit, von);
    if (frei === 'unlesbar') {
      // Ohne auswertbare Zeitangabe ist der Raum nicht sicher frei (room-finder, Fehlerfälle).
      unlesbar += 1;
      continue;
    }
    if (frei === 'geschlossen') continue;
    const { freiBis, freiBisSchliesszeit } = frei;
    if (freiBis && freiBis.getTime() < bis.getTime()) continue;

    ergebnis.push({
      roomId: raum.roomId,
      groesse: raum.groesse,
      ekeyZugaenglich: raum.ekeyZugaenglich,
      freiBis,
      freiBisSchliesszeit,
      besetztMeldungen: s.besetztMeldungen,
    });
  }

  if (unlesbar > 0) logDatenhinweis('raum.freieRaeume', 'Termin ohne auswertbare Zeitangabe', unlesbar);
  return ergebnis.sort((a, b) => a.roomId.localeCompare(b.roomId));
}

/**
 * Freizeitpunkt eines zu `bezug` freien Raums (Requirements „Freizeitpunkt
 * eines freien Raums anzeigen" und „Gepflegte Gebäudeschließzeit statt fester
 * Wert"): nächster Terminbeginn oder Schließzeit am Tag von `bezug`, je nachdem,
 * was früher liegt. `geschlossen`, wenn `bezug` nicht vor der Schließzeit liegt;
 * `unlesbar`, wenn der nächste Termin keine auswertbare Zeitangabe trägt.
 */
export function freiBisFuer(
  status: RaumStatus,
  schliesszeit: string | null | undefined,
  bezug: Date,
): { freiBis: Date | null; freiBisSchliesszeit: boolean } | 'geschlossen' | 'unlesbar' {
  const schliesst = schliesszeitAm(schliesszeit, bezug);
  if (schliesst && bezug.getTime() >= schliesst.getTime()) return 'geschlossen';

  let naechster: Date | null = null;
  if (status.naechsterTermin) {
    const beginn = Date.parse(status.naechsterTermin.beginn);
    if (Number.isNaN(beginn)) return 'unlesbar';
    naechster = new Date(beginn);
  }

  const freiBisSchliesszeit =
    schliesst !== null && (naechster === null || schliesst.getTime() < naechster.getTime());
  return { freiBis: freiBisSchliesszeit ? schliesst : naechster, freiBisSchliesszeit };
}

/** Ob ein Filter gesetzt ist — für den Rückweg „Filter zurücksetzen" im Leerzustand. */
export function filterGesetzt(filter: Suchfilter): boolean {
  return filter.groesse !== 'alle' || filter.nurEkey;
}
