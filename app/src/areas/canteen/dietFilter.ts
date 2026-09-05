// MENSA-F-250 / F-260: Ernährungsfilter über die Gericht-Kennzeichnungen
// (MENSA-F-035, INT-015 `/types`). Zwei Vorgaben:
//   - nurZeigen  → das Gericht muss JEDE gewählte Kennzeichnung tragen
//                  (einschließend, „vegan" allein zeigt nur Veganes).
//   - ausschluss → das Gericht darf KEINE gewählte Kennzeichnung tragen
//                  (ausschließend, deckt „kein Schwein" ab).
// Reine Funktion ohne React. Das Backend liefert die Kennzeichnungen als
// aufgelöste Anzeigenamen (`Gericht.kennzeichnungen`); eine gewählte Vorgabe ist
// je eine Token-Gruppe (Anzeigename UND Verzeichnis-Id), damit sowohl aufgelöste
// als auch rohe Codes greifen. Ein Gericht „trägt" eine Vorgabe, wenn eines der
// Token der Gruppe in seinen Kennzeichnungen vorkommt.

export interface DietPrefs {
  nurZeigen: string[];
  ausschluss: string[];
}

export const LEERE_DIET_PREFS: DietPrefs = { nurZeigen: [], ausschluss: [] };

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
