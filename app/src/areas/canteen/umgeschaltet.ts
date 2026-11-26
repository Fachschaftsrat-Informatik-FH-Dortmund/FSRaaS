/**
 * Liste mit `code` umgeschaltet: entfernt, wenn enthalten, sonst angehängt.
 * Gemeinsamer Kern aller Filter-Umschalter im Mensa-Bereich (Lebensstil,
 * Ausschluss, CO₂-Ausschluss, Unverträglichkeiten), damit sie sich nicht
 * unabhängig voneinander auseinanderentwickeln.
 */
export function umgeschaltet<T>(liste: readonly T[], code: T): T[] {
  return liste.includes(code) ? liste.filter((c) => c !== code) : [...liste, code];
}
