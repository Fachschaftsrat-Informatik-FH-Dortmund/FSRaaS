// Requirement „Hinweis bei Semesterwechsel": erkennt einen möglichen
// Semesterwechsel, indem die aktuell über INT-001 gelieferte Endpunktliste
// (Kurznamen, `sname`) gegen den zuletzt gespeicherten Stand gehalten wird —
// zuverlässiger als ein festes Kalenderdatum, da Semesterstart-Termine
// variieren. Deckt zugleich den Fall „ein gewählter Endpunkt existiert nicht
// mehr" mit ab, da dessen Verschwinden aus der Liste ebenfalls eine Änderung
// ist. Reine Funktion ohne React; welche Liste als „zuletzt gespeichert" gilt,
// legt die aufrufende Stelle fest (`semesterstand.ts`/Bildschirm).

export interface SemesterwechselErgebnis {
  /** Ob sich die Endpunktliste gegenüber dem gespeicherten Stand geändert hat. */
  geaendert: boolean;
  /** Zuvor gespeicherte Liste (unverändert übernommen, zur Anzeige/zum Protokoll). */
  vorher: string[];
  /** Aktuell von INT-001 gelieferte Liste. */
  nachher: string[];
}

/**
 * Vergleicht die zuletzt gespeicherte Endpunktliste
 * (`gespeicherteEndpunkte`, `null` = noch kein Stand vorhanden, z. B. beim
 * erstmaligen Einrichten) mit der aktuell von INT-001 gelieferten Liste
 * (`aktuelleEndpunkte`). Der Vergleich ist mengenbasiert (Reihenfolge
 * unerheblich) — nur eine tatsächliche Änderung des Angebots gilt als
 * Wechsel, kein aus INT-001 riskierter Ordnungswechsel.
 */
export function erkenneSemesterwechsel(
  gespeicherteEndpunkte: readonly string[] | null,
  aktuelleEndpunkte: readonly string[],
): SemesterwechselErgebnis {
  const nachher = [...aktuelleEndpunkte];
  if (gespeicherteEndpunkte === null) {
    return { geaendert: false, vorher: [], nachher };
  }

  const vorher = [...gespeicherteEndpunkte];
  const vorherMenge = new Set(vorher);
  const nachherMenge = new Set(nachher);
  const geaendert =
    vorherMenge.size !== nachherMenge.size || [...vorherMenge].some((sname) => !nachherMenge.has(sname));

  return { geaendert, vorher, nachher };
}
