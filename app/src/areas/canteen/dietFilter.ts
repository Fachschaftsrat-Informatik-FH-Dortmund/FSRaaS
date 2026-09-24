// MENSA-F-250 / F-260: Ernährungsfilter über die Gericht-Kennzeichnungen
// (MENSA-F-035, Legende von INT-020). Drei Vorgaben:
//   - nurZeigen  → das Gericht muss JEDE gewählte Kennzeichnung tragen
//                  (einschließend, „vegan" allein zeigt nur Veganes).
//   - ausschluss → das Gericht darf KEINE gewählte Kennzeichnung tragen
//                  (ausschließend, deckt „kein Schwein" ab).
//   - co2Ausschluss → das Gericht darf keine der gewählten CO₂-Klassen tragen
//                  (Requirement „Ausschluss nach Kennzeichnung"). Getrennt
//                  geführt, weil die Klasse in einem eigenen Feld des Gerichts
//                  steht (`co2Klasse`) und nicht unter seinen Kennzeichnungen.
// Reine Funktion ohne React. Das Backend liefert die Kennzeichnungen als
// aufgelöste Anzeigenamen (`Gericht.kennzeichnungen`); eine gewählte Vorgabe ist
// je eine Token-Gruppe (Anzeigename UND Verzeichnis-Id), damit sowohl aufgelöste
// als auch rohe Codes greifen. Ein Gericht „trägt" eine Vorgabe, wenn eines der
// Token der Gruppe in seinen Kennzeichnungen vorkommt.

export interface DietPrefs {
  nurZeigen: string[];
  ausschluss: string[];
  /** Ausgeschlossene CO₂-Klassen, als Schlüssel der Quelle (`A`, `B`, `C`, `E`). */
  co2Ausschluss: string[];
}

export const LEERE_DIET_PREFS: DietPrefs = { nurZeigen: [], ausschluss: [], co2Ausschluss: [] };

/**
 * Baut aus gewählten Verzeichnis-Ids je eine Token-Gruppe `[id, Anzeigename]`.
 * `labelVon` bildet die Id auf ihren aufgelösten Anzeigenamen ab (Verzeichnis).
 */
export function baueTokenGruppen(
  codes: readonly string[],
  labelVon: (id: string) => string | undefined,
): string[][] {
  return codes.map((id) => {
    const label = labelVon(id);
    return label ? [id, label] : [id];
  });
}

function traegt(vorhanden: ReadonlySet<string>, gruppe: readonly string[]): boolean {
  return gruppe.some((token) => vorhanden.has(token));
}

/** Trifft eine der beiden Vorgaben auf das Gericht zu (→ ausblenden/ausgrauen)? */
export function gerichtDietBetroffen(
  kennzeichnungen: string[] | undefined,
  nurZeigen: readonly (readonly string[])[],
  ausschluss: readonly (readonly string[])[],
): boolean {
  const vorhanden = new Set(kennzeichnungen ?? []);

  for (const gruppe of ausschluss) {
    if (traegt(vorhanden, gruppe)) return true;
  }

  for (const gruppe of nurZeigen) {
    if (!traegt(vorhanden, gruppe)) return true;
  }

  return false;
}

/**
 * Trägt das Gericht eine als Ausschluss gewählte CO₂-Klasse? Verglichen wird der
 * Schlüssel, wie die Quelle ihn liefert — ein unbekannter Code schließt damit
 * nichts aus, statt verschluckt zu werden.
 */
export function gerichtCo2Betroffen(
  co2Klasse: string | null | undefined,
  co2Ausschluss: readonly string[],
): boolean {
  if (!co2Klasse || co2Ausschluss.length === 0) return false;
  return co2Ausschluss.includes(co2Klasse);
}
