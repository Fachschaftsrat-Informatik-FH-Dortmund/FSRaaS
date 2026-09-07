import type { Mensa } from './api';

// MENSA: Auflösung der gepflegten wöchentlichen Öffnungszeiten aus den
// Mensa-Stammdaten (Vertrag: „Ein Eintrag je Wochentag, Montag zuerst", Einträge
// dürfen `null` sein). Reine Fachlogik ohne React (Capability
// `quality-and-testing`, Abschnitt 5). Der Wiedereröffnungshinweis an einer
// geschlossenen Mensa speist sich ausschließlich aus dieser Wochenangabe — kein
// zusätzlicher Speiseplan-Abruf, offline verfügbar (design.md D1/D8).

/** Index in `oeffnungszeiten` (Montag zuerst) für ein ISO-Datum. */
function wochentagIndex(datum: string): number {
  const [y, m, d] = datum.split('-').map(Number);
  const tag = new Date(y!, m! - 1, d!).getDay(); // 0 = Sonntag … 6 = Samstag
  return (tag + 6) % 7; // 0 = Montag … 6 = Sonntag
}

/**
 * Öffnungszeit der Mensa für den Wochentag des angezeigten Datums, oder `null`,
 * wenn die Stammdaten für diesen Wochentag keinen Eintrag führen. Der Vertrag
 * legt nur „Montag zuerst" fest: eine siebenstellige Liste bedient auch Samstag
 * und Sonntag, eine kürzere (oder lückenhafte) liefert dort und für jeden nicht
 * gepflegten Tag `null` — ohne die übrigen Tage zu verlieren (design.md D8).
 */
export function oeffnungszeitFuer(mensa: Mensa | undefined, datum: string): string | null {
  const zeiten = mensa?.oeffnungszeiten;
  if (!zeiten) return null;
  const i = wochentagIndex(datum);
  if (i >= zeiten.length) return null;
  return zeiten[i] ?? null;
}

/**
 * Nächster Wochentag ab dem Tag *nach* `datum`, für den die Stammdaten eine
 * Öffnungszeit führen; gesucht über höchstens die folgenden sieben Tage. Liefert
 * den Wochentag als `Date.getDay()`-Wert (0 = Sonntag … 6 = Samstag) oder `null`,
 * wenn keiner dieser Tage eine Öffnungszeit führt (design.md D1).
 */
export function naechsterOeffnungstag(mensa: Mensa | undefined, datum: string): number | null {
  const zeiten = mensa?.oeffnungszeiten;
  if (!zeiten) return null;
  const [y, m, d] = datum.split('-').map(Number);
  for (let versatz = 1; versatz <= 7; versatz++) {
    const tag = new Date(y!, m! - 1, d! + versatz);
    const i = (tag.getDay() + 6) % 7;
    if (i < zeiten.length && zeiten[i] != null) return tag.getDay();
  }
  return null;
}
