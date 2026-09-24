// Sichtbarer Hinweis auf das Alter zwischengespeicherter Daten (DATA-F-090):
// Solange offline und der Zwischenspeicher abgelaufen ist, wird der zuletzt
// geladene Stand mit Altersangabe gezeigt statt einer Leeransicht.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface DataAge {
  /** i18n-Schlüssel und -Parameter für die relative Altersangabe. */
  key: 'dataAge.justNow' | 'dataAge.minutesAgo' | 'dataAge.hoursAgo' | 'dataAge.daysAgo';
  count: number;
}

export function describeAge(updatedAt: number, now: number = Date.now()): DataAge {
  const delta = Math.max(0, now - updatedAt);
  if (delta < MINUTE) return { key: 'dataAge.justNow', count: 0 };
  if (delta < HOUR) return { key: 'dataAge.minutesAgo', count: Math.floor(delta / MINUTE) };
  if (delta < DAY) return { key: 'dataAge.hoursAgo', count: Math.floor(delta / HOUR) };
  return { key: 'dataAge.daysAgo', count: Math.floor(delta / DAY) };
}

/**
 * Ob für einen vorhandenen Datenstand der Altershinweis gezeigt werden muss:
 * wenn offline UND die Daten nicht mehr taufrisch sind (DATA-F-090).
 */
export function shouldShowAge(params: { isOffline: boolean; isStale: boolean; hasData: boolean }): boolean {
  return params.hasData && params.isOffline && params.isStale;
}

/**
 * Ob ein von der **Quelle selbst** gemeldeter Datenstand als veraltet gilt
 * (Requirement „Altershinweis bei veralteten Daten der Mensa-Schnittstelle").
 * Anders als `shouldShowAge` hängt das nicht am Netzzustand: eine erreichbare
 * Quelle kann veraltete Daten liefern, ohne das selbst zu melden.
 *
 * Meldet die Quelle keinen Stand, gilt nichts als veraltet — eine fehlende
 * Angabe ist kein Befund.
 */
export function quelleVeraltet(params: {
  quelleStand: string | null | undefined;
  maxAlterMs: number;
  now?: number;
}): boolean {
  if (!params.quelleStand) return false;
  const stand = Date.parse(params.quelleStand);
  if (Number.isNaN(stand)) return false;
  return (params.now ?? Date.now()) - stand > params.maxAlterMs;
}
