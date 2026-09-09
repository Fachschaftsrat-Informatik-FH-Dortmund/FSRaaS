// QA-F-040: INT-002 liefert `timeBegin`/`timeEnd` wahlweise als Zahl oder als
// Zeichenkette ohne führende Nullen (`platform/integrations.md`, INT-002, Felder
// `timeBegin`/`timeEnd`: „linksseitig mit 0 auf vier Stellen aufzufüllen"). Diese
// Funktionen normalisieren das Format, rechnen in Minuten seit Mitternacht um
// (Grundlage für Sortierung, Überschneidungsprüfung, Lückenberechnung) und wieder
// zurück. Reine Funktionen, ohne React, keine Datumsbibliothek nötig.

/** Roher FBWS-Zeitwert: Zahl oder Zeichenkette, je nach Feldherkunft. */
export type FbwsZeit = string | number;

/** Füllt eine Zeit (`"Hmm"`/`"HHmm"` oder Zahl) linksseitig mit `0` auf vier Stellen auf. */
export function padZeit(wert: FbwsZeit): string {
  return String(wert).trim().padStart(4, '0');
}

/** Wandelt eine FBWS-Zeit in Minuten seit Mitternacht (0..1439) um. */
export function zeitZuMinuten(wert: FbwsZeit): number {
  const gepolstert = padZeit(wert);
  const stunden = Number(gepolstert.slice(0, 2));
  const minuten = Number(gepolstert.slice(2, 4));
  return stunden * 60 + minuten;
}

/** Formatiert Minuten seit Mitternacht als `"HHmm"`-Zeichenkette (Kehrfunktion zu `zeitZuMinuten`). */
export function minutenZuZeit(minutenSeitMitternacht: number): string {
  const stunden = Math.floor(minutenSeitMitternacht / 60);
  const minuten = minutenSeitMitternacht % 60;
  return `${String(stunden).padStart(2, '0')}${String(minuten).padStart(2, '0')}`;
}

/**
 * Prüft, ob sich zwei halboffene Zeiträume [Beginn, Ende) überschneiden. Ein
 * Termin, der genau endet, wenn der nächste beginnt, gilt nicht als Überschneidung.
 */
export function ueberschneidenSich(
  aBeginnMin: number,
  aEndeMin: number,
  bBeginnMin: number,
  bEndeMin: number,
): boolean {
  return aBeginnMin < bEndeMin && bBeginnMin < aEndeMin;
}

/** SCHED-F-252: sortiert Termine mit `timeBeginMin` aufsteigend nach Beginnzeit (stabil). */
export function sortiereNachBeginnzeit<T extends { timeBeginMin: number }>(
  termine: readonly T[],
): T[] {
  return [...termine].sort((a, b) => a.timeBeginMin - b.timeBeginMin);
}

/**
 * Requirement „Wirkung eines deaktivierten Termins" / „Selbsttätiges Ende einer
 * einmaligen Deaktivierung" (design.md, Entscheidung 3): einzige Auswertung des
 * Felds `deaktiviertBis` (`typen.ts`). Ausgewertet beim Lesen, nicht durch einen
 * Aufräumlauf — ein einmalig deaktivierter Termin wird von selbst wieder aktiv,
 * sobald `jetztSek` seinen Zeitpunkt erreicht oder überschreitet.
 */
export function istAktiv(e: { deaktiviertBis: null | 'dauerhaft' | number }, jetztSek: number): boolean {
  if (e.deaktiviertBis === null) return true;
  if (e.deaktiviertBis === 'dauerhaft') return false;
  return jetztSek >= e.deaktiviertBis;
}
