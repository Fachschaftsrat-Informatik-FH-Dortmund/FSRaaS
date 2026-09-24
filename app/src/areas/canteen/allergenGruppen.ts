// Requirement „Sammelschalter für zusammengehörige Allergengruppen"
// (canteen/spec.md): Die Quelle gliedert einzelne Allergene in Unterschlüssel —
// Gluten in `20a`–`20f`, Nüsse in `27a`–`27h`. Ohne Sammelschalter müsste eine
// Nutzerin, die alle Glutenarten meidet, sechs Einträge einzeln antippen.
//
// Die Gruppen werden aus dem Verzeichnis abgeleitet, nicht im Code aufgezählt:
// ein Schlüssel der Form `<Ziffern><Kleinbuchstabe>` ist ein Unterschlüssel des
// Stamms `<Ziffern>`. Nimmt die Quelle eine weitere Gliederung auf, entsteht
// deren Sammelschalter von selbst. Reine Funktion, ohne React.
//
// Der Stamm selbst bleibt ein eigener, einzeln wählbarer Eintrag, wo die Quelle
// ihn führt: `20` steht für „Gluten (nicht näher bezeichnet)" und ist damit eine
// eigene Angabe, keine Überschrift. `27` führt die Quelle gar nicht.

/** Ein Schlüssel wie `20a` — Ziffernstamm plus ein Kleinbuchstabe. */
const UNTERSCHLUESSEL = /^(\d+)[a-z]$/;

export interface AllergenGruppe {
  /** Ziffernstamm der Gruppe, z. B. `20` für `20a`–`20f`. */
  stamm: string;
  /** Unterschlüssel in Verzeichnisreihenfolge. */
  unterschluessel: string[];
}

/**
 * Leitet die Sammelgruppen aus den Allergen-Einträgen des Verzeichnisses ab.
 * Ein Stamm bildet nur dann eine Gruppe, wenn die Quelle ihn in **mehrere**
 * Unterschlüssel gliedert — ein einzelner Unterschlüssel ist keine Gliederung,
 * für die sich ein Sammelschalter lohnt.
 */
export function allergenGruppen(eintraege: readonly { id: string }[]): AllergenGruppe[] {
  const proStamm = new Map<string, string[]>();
  for (const { id } of eintraege) {
    const stamm = UNTERSCHLUESSEL.exec(id)?.[1];
    if (stamm === undefined) continue;
    const bisher = proStamm.get(stamm);
    if (bisher) bisher.push(id);
    else proStamm.set(stamm, [id]);
  }
  return [...proStamm.entries()]
    .filter(([, unterschluessel]) => unterschluessel.length > 1)
    .map(([stamm, unterschluessel]) => ({ stamm, unterschluessel }));
}

/** Sind alle Unterschlüssel einer Gruppe gewählt? */
export function gruppeVollstaendig(
  gruppe: AllergenGruppe,
  gewaehlt: readonly string[],
): boolean {
  return gruppe.unterschluessel.every((id) => gewaehlt.includes(id));
}
