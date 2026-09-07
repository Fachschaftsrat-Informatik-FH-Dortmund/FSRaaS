// MENSA-F-042 / MENSA-F-044: Datumsgrenzen der Tagesauswahl. Untergrenze ist der
// aktuelle Tag; Samstage/Sonntage ohne bekanntes Angebot werden beim Blättern
// und Wischen übersprungen, Werktage nie — und der aktuelle Tag nie, auch wenn
// er auf ein angebotsfreies Wochenende fällt. Reine Funktionen, ohne React.

export function isoHeute(jetzt: Date = new Date()): string {
  return `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, '0')}-${String(
    jetzt.getDate(),
  ).padStart(2, '0')}`;
}

export function verschiebe(datum: string, tage: number): string {
  const [y, m, d] = datum.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d! + tage);
  return isoHeute(dt);
}

/** 0 = Sonntag … 6 = Samstag. */
export function wochentag(datum: string): number {
  const [y, m, d] = datum.split('-').map(Number);
  return new Date(y!, m! - 1, d!).getDay();
}

export function istWochenende(datum: string): boolean {
  const w = wochentag(datum);
  return w === 0 || w === 6;
}

export function istVorHeute(datum: string, jetzt?: Date): boolean {
  return datum < isoHeute(jetzt);
}

/**
 * Nächster wählbarer Tag ausgehend von `datum` in Richtung `richtung`
 * (-1 zurück, +1 vor). Gibt `null` zurück, wenn keine Bewegung möglich ist
 * (Untergrenze am heutigen Tag, MENSA-F-042).
 *
 * `hatAngebot(tag)` meldet, ob mindestens eine gewählte Mensa an diesem Tag ein
 * Angebot führt; `undefined` = unbekannt (offline/Ladefehler) und gilt wie „kein
 * Angebot" (Spec Abschnitt 9). Ein Wochenendtag ohne bekanntes Angebot wird
 * übersprungen, höchstens bis zum nächsten Werktag (MENSA-F-044); Werktage nie.
 * Ausgenommen ist der aktuelle Tag: Er ist die Untergrenze und wird nie
 * übersprungen, auch nicht als angebotsfreier Samstag oder Sonntag. Die
 * Ausnahme ist richtungsneutral formuliert; vorwärts kann der aktuelle Tag
 * ohnehin kein Kandidat sein.
 */
export function naechsterTag(
  datum: string,
  richtung: -1 | 1,
  hatAngebot: (tag: string) => boolean | undefined,
  jetzt?: Date,
): string | null {
  const heute = isoHeute(jetzt);
  let kandidat = verschiebe(datum, richtung);

  // höchstens drei Schritte — rückwärts endet die Kette spätestens am aktuellen
  // Tag, vorwärts nach Samstag und Sonntag; drei ist damit großzügig bemessen
  for (let schritt = 0; schritt < 3; schritt++) {
    if (kandidat < heute) return null;
    if (kandidat === heute) return kandidat;
    if (!istWochenende(kandidat) || hatAngebot(kandidat) === true) return kandidat;
    kandidat = verschiebe(kandidat, richtung);
  }
  return kandidat < heute ? null : kandidat;
}
