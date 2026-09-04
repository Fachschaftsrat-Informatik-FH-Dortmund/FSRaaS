// MENSA-F-190 / F-200 / F-210: Abgleich der Zusatzstoff-/Allergenangaben eines
// Gerichts gegen die festgelegten Unverträglichkeiten. Das Backend liefert die
// Angaben bereits als aufgelöste Anzeigenamen (`Gericht.zusatzstoffe`); der
// Bildschirm übergibt die Auswahl als Menge aus Anzeigename **und** Verzeichnis-Id,
// damit auch unaufgelöste Rohcodes greifen. Reine Funktion, ohne React.

export function gerichtBetroffen(
  zusatzstoffe: string[] | undefined,
  ausgewaehlt: ReadonlySet<string>,
): boolean {
  if (ausgewaehlt.size === 0 || !zusatzstoffe || zusatzstoffe.length === 0) return false;
  return zusatzstoffe.some((z) => ausgewaehlt.has(z));
}

/** Teilt eine Liste in sichtbare und (wegen Unverträglichkeiten) ausgeblendete Einträge. */
export function teileNachUnvertraeglichkeit<T>(
  eintraege: T[],
  zusatzstoffeVon: (eintrag: T) => string[] | undefined,
  ausgewaehlt: ReadonlySet<string>,
): { sichtbar: T[]; ausgeblendet: T[] } {
  const sichtbar: T[] = [];
  const ausgeblendet: T[] = [];
  for (const eintrag of eintraege) {
    if (gerichtBetroffen(zusatzstoffeVon(eintrag), ausgewaehlt)) ausgeblendet.push(eintrag);
    else sichtbar.push(eintrag);
  }
  return { sichtbar, ausgeblendet };
}
