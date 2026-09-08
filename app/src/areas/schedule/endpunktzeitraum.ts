// Requirement „Gültigkeitszeitraum aus dem Endpunktnamen"
// (`openspec/specs/schedule/spec.md`). Die drei Blockwochen-Endpunkte liefern
// über INT-002 `dateBegin`/`dateEnd` über das gesamte Semester und
// `interval: "weekly"` — identisch mit den regulären Veranstaltungen. Ihr
// tatsächlicher Zeitraum steht ausschließlich im Klarnamen des Endpunkts
// (INT-001 `name`), z. B. `Blockwoche 1 (13.04.-17.04.2026)`. Reine Funktion
// ohne React.

import { logError } from '@/errors/AppError';

import type { OfficialTermin } from './typen';

// Nur die letzte, am Namensende stehende Klammer zählt — mittendrin stehende
// Klammern (`Bachelor Informatik (StgPO 2019), VR Data Science`) sind kein
// Datumsbereich und lösen bewusst keine Prüfung aus.
const KLAMMER_AM_ENDE = /\(([^()]*)\)\s*$/;
const DATUMSBEREICH = /^(\d{2})\.(\d{2})\.-(\d{2})\.(\d{2})\.(\d{4})$/;

/** Unix-Sekunden zur Mittagszeit — unempfindlich gegenüber Zeitzonen-Randfällen (Vorbild `wochenrechnung.ts`). */
function unixSekundenMittag(jahr: number, monat: number, tag: number): number {
  return Math.floor(new Date(jahr, monat - 1, tag, 12, 0, 0).getTime() / 1000);
}

export interface Datumsbereich {
  gueltigVon: number;
  gueltigBis: number;
}

/**
 * Liest einen Datumsbereich aus der letzten Klammer am Ende eines
 * Endpunktnamens. Drei Ausgänge: kein Klammerausdruck am Ende → `null`, ohne
 * Protokoll (Szenario „Endpunktname ohne Datumsbereich"); Klammerausdruck,
 * aber kein lesbares Datumsmuster → `null`, protokolliert (Szenario
 * „Datumsbereich nicht auswertbar"); lesbarer Bereich → beide Grenzen als
 * Unix-Sekunden zur Mittagszeit des jeweiligen Tages.
 */
export function leseDatumsbereichAusName(name: string): Datumsbereich | null {
  const klammer = KLAMMER_AM_ENDE.exec(name);
  if (!klammer) return null;

  const inhalt = klammer[1]!.trim();
  const bereich = DATUMSBEREICH.exec(inhalt);
  if (!bereich) {
    logError('endpunktzeitraum.datumsbereich', new Error(`Klammerinhalt nicht als Datumsbereich lesbar: "${inhalt}"`));
    return null;
  }

  const [, vonTag, vonMonat, bisTag, bisMonat, jahr] = bereich;
  return {
    gueltigVon: unixSekundenMittag(Number(jahr), Number(vonMonat), Number(vonTag)),
    gueltigBis: unixSekundenMittag(Number(jahr), Number(bisMonat), Number(bisTag)),
  };
}

/**
 * Überschreibt den Gültigkeitszeitraum aller Termine eines Endpunkts, wenn
 * sich dessen Name als Datumsbereich lesen lässt — sonst bleiben die von
 * INT-002 gelieferten Angaben unverändert.
 */
export function wendeGueltigkeitszeitraumAn(
  termine: readonly OfficialTermin[],
  endpunktName: string,
): OfficialTermin[] {
  const bereich = leseDatumsbereichAusName(endpunktName);
  if (!bereich) return [...termine];
  return termine.map((termin) => ({ ...termin, gueltigVon: bereich.gueltigVon, gueltigBis: bereich.gueltigBis }));
}
