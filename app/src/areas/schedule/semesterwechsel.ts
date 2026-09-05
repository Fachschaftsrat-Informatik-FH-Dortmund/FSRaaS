// SCHED-F-180: erkennt einen möglichen Semesterwechsel, indem die aktuell aus
// INT-001 gelieferte `grades`-Liste des gewählten Studiengangs gegen den
// zuletzt gespeicherten Stand gehalten wird — zuverlässiger als ein festes
// Kalenderdatum, da Semesterstart-Termine variieren (siehe Erläuterung zu
// SCHED-F-180 in `openspec/specs/schedule/spec.md` Abschnitt 13). Reine
// Funktion ohne React; welche Liste als „zuletzt gespeichert" gilt, legt die
// aufrufende Stelle fest (`einrichtung.ts`/Bildschirm).

export interface SemesterwechselErgebnis {
  /** Ob sich die Fachsemester-Liste gegenüber dem gespeicherten Stand geändert hat. */
  geaendert: boolean;
  /** Zuvor gespeicherte Liste (unverändert übernommen, zur Anzeige/zum Protokoll). */
  vorher: string[];
  /** Aktuell von INT-001 gelieferte Liste. */
  nachher: string[];
}

/**
 * Vergleicht die zuletzt gespeicherte `grade`-Liste eines Studiengangs
 * (`gespeicherteGrades`, `null` = noch kein Stand vorhanden, z. B. beim
 * erstmaligen Einrichten) mit der aktuell von INT-001 gelieferten Liste
 * (`aktuelleGrades`). Der Vergleich ist mengenbasiert (Reihenfolge
 * unerheblich) — nur eine tatsächliche Änderung der angebotenen Fachsemester
 * gilt als Wechsel, kein aus INT-001 riskierter Ordnungswechsel.
 */
export function erkenneSemesterwechsel(
  gespeicherteGrades: readonly string[] | null,
  aktuelleGrades: readonly string[],
): SemesterwechselErgebnis {
  const nachher = [...aktuelleGrades];
  if (gespeicherteGrades === null) {
    return { geaendert: false, vorher: [], nachher };
  }

  const vorher = [...gespeicherteGrades];
  const vorherMenge = new Set(vorher);
  const nachherMenge = new Set(nachher);
  const geaendert =
    vorherMenge.size !== nachherMenge.size || [...vorherMenge].some((grade) => !nachherMenge.has(grade));

  return { geaendert, vorher, nachher };
}
