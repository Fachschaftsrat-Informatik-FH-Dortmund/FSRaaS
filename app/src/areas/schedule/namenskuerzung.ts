// Requirement „Kürzung langer Veranstaltungsnamen unter Erhalt einer Endzahl"
// (Change `modul-umbenennen-und-namenskuerzung`, design.md Entscheidung 3).
//
// Diese Datei zerlegt einen Namen nur in Stamm und Endzahl. Gekürzt wird
// nicht hier, sondern durch das native Textlayout der Kachel
// (`ScheduleScreen.tsx`, `TerminKachel`): Der Stamm schrumpft mit „…", die
// Endzahl bleibt stehen. Am 2026-09-11 verworfen und deshalb ohne Ersatz: jede
// Messung der verfügbaren Breite.

export interface NamensTeile {
  /** Der Name ohne Endzahl und ohne den Leerraum davor — bei fehlender Endzahl der ganze Name. */
  stamm: string;
  /** Die Zahl am Ende, `null`, wenn der Name nicht auf eine Zahl endet. */
  endzahl: string | null;
}

/**
 * Als Endzahl gilt eine Ziffernfolge am Ende des Namens, auch mit Punkten
 * gegliedert („2.0"), der mindestens ein Zeichen vorausgeht, das weder Ziffer,
 * Punkt noch Leerraum ist. Eine Zahl in der Mitte und römische Ziffern zählen
 * nicht.
 */
export function teileEndzahl(name: string): NamensTeile {
  const treffer = /^(.*[^\d\s.].*?)\s*(\d+(?:\.\d+)*)$/.exec(name.trimEnd());
  if (!treffer) return { stamm: name, endzahl: null };
  return { stamm: treffer[1]!, endzahl: treffer[2]! };
}
