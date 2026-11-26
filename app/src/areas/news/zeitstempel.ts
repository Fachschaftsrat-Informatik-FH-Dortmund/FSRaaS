// Darstellung des Veröffentlichungszeitpunkts (Requirement „24-Stunden-Zeitformat
// für Zeitstempel"). Datum und Uhrzeit folgen unabhängig von der Oberflächensprache
// der deutschen Konvention (NFR-F-120): `TT.MM.JJJJ, HH:MM`, 24-Stunden-Uhr, in
// der Zeitzone des Geräts. Ein fehlender oder unlesbarer Wert ergibt `null` — die
// Ansicht zeigt dann „unbekannt", die Meldung selbst bleibt sichtbar.

const zwei = (n: number) => String(n).padStart(2, '0');

export function zeitstempel(roh: string | null | undefined): string | null {
  if (!roh) return null;
  const ms = Date.parse(roh);
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms);
  return `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.${d.getFullYear()}, ${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
}
