// Zeitangaben des Raum-Bereichs: Uhrzeit, Kalendertag und die Wahl des
// Zeitraums der Freie-Raum-Suche (Change `raumsuche-app`, design.md:
// Startzeit in 30-Minuten-Schritten, frühestens jetzt, höchstens 7 Tage voraus;
// Dauer 1–4 Stunden).

const MINUTE = 60_000;
export const SCHRITT_MS = 30 * MINUTE;
export const MAX_VORAUS_MS = 7 * 24 * 60 * MINUTE;
export const DAUERN_STUNDEN = [1, 2, 3, 4] as const;
export type DauerStunden = (typeof DAUERN_STUNDEN)[number];
export const STANDARD_DAUER: DauerStunden = 2;

/** Auf volle Minuten abgerundet. */
export function aufMinute(zeit: Date): Date {
  const d = new Date(zeit);
  d.setSeconds(0, 0);
  return d;
}

/** Startzeit um `schritte` × 30 Minuten verschoben, begrenzt auf [jetzt, jetzt + 7 Tage]. */
export function verschiebeStart(start: Date, schritte: number, jetzt: Date): Date {
  const frueheste = aufMinute(jetzt).getTime();
  const spaeteste = frueheste + MAX_VORAUS_MS;
  const ziel = start.getTime() + schritte * SCHRITT_MS;
  return new Date(Math.min(spaeteste, Math.max(frueheste, ziel)));
}

export function zeitraumEnde(start: Date, dauer: DauerStunden): Date {
  return new Date(start.getTime() + dauer * 60 * MINUTE);
}

const zwei = (n: number) => String(n).padStart(2, '0');

/** `HH:MM` in Ortszeit des Geräts. */
export function uhrzeit(zeit: Date): string {
  return `${zwei(zeit.getHours())}:${zwei(zeit.getMinutes())}`;
}

/** `YYYY-MM-DD` in Ortszeit des Geräts. */
export function kalendertag(zeit: Date): string {
  return `${zeit.getFullYear()}-${zwei(zeit.getMonth() + 1)}-${zwei(zeit.getDate())}`;
}

/** `TT.MM.` in Ortszeit des Geräts. */
export function kurzdatum(zeit: Date): string {
  return `${zwei(zeit.getDate())}.${zwei(zeit.getMonth() + 1)}.`;
}

export function gleicherTag(a: Date, b: Date): boolean {
  return kalendertag(a) === kalendertag(b);
}
