import type { Gericht } from './api';

// MENSA-F-012 bis F-018: Die Gerichte der gewählten Mensen eines Tages werden zu
// genau einem Eintrag je Gericht zusammengefasst (Schlüssel: der vom Backend
// gelieferte normalisierte `schluessel`, RATE-F-050 — kein eigener Normalisierer
// in der App) und **primär nach der Mensa-Auswahlreihenfolge (MENSA-F-025)**
// gruppiert: je gewählter Mensa mit Angebot ein Abschnitt, in Auswahlreihenfolge;
// ein an mehreren Mensen angebotenes Gericht steht im Abschnitt der ersten
// anbietenden Mensa. Reine Fachlogik ohne React (`platform/quality-and-testing.md`
// Abschnitt 5).

/** Ein Gericht mit der Angabe, welche Mensa es führt. */
export interface AnbieterGericht extends Gericht {
  mensaId: string;
}

export interface KonsolidiertesGericht {
  schluessel: string;
  /** Kennungen der Mensen, die das Gericht am Tag führen, in Auswahlreihenfolge (MENSA-F-014). */
  anbieter: string[];
  /**
   * Die Mensa, deren Preis-/Kennzeichnungs-/Zusatzstoffangaben angezeigt werden
   * (MENSA-F-018): die Mensa des Abschnitts, in dem das Gericht steht — also die
   * in der Auswahlreihenfolge erste anbietende Mensa.
   */
  massgeblich: AnbieterGericht;
}

export interface KonsolidierteSektion {
  mensaId: string;
  gruppen: { kategorie: string; gerichte: KonsolidiertesGericht[] }[];
}

export interface Konsolidierung {
  /** Ein Abschnitt je gewählter Mensa mit Angebot, in Auswahlreihenfolge (MENSA-F-025). */
  sektionen: KonsolidierteSektion[];
  /** Gewählte Mensen ohne Angebot am Tag (MENSA-F-049); Quelle unterscheidet nicht „zu" von „keine Daten". */
  geschlossene: string[];
}

export interface MensaTagesplan {
  mensaId: string;
  gerichte: Gericht[];
}

/** Rang der Kategorie in der Gruppenreihenfolge: benannt → kategorielos (F-160) → Beilagen (F-040). */
function kategorieRang(kategorie: string): number {
  if (kategorie === '') return 1;
  if (/beilag/i.test(kategorie)) return 2;
  return 0;
}

/**
 * Gruppiert eine flache Gerichtsliste nach Kategorie (MENSA-F-040 Beilagen ans
 * Ende, MENSA-F-160 kategorielose Gerichte in eine Sammelgruppe ohne Überschrift
 * davor). Reihenfolge innerhalb einer Gruppe = Eingabereihenfolge.
 */
export function gruppiereNachKategorie<T extends { kategorie: string }>(
  gerichte: T[],
): { kategorie: string; gerichte: T[] }[] {
  const map = new Map<string, { index: number; gerichte: T[] }>();
  let lauf = 0;
  for (const g of gerichte) {
    const kategorie = g.kategorie?.trim() ?? '';
    const gruppe = map.get(kategorie);
    if (gruppe) gruppe.gerichte.push(g);
    else map.set(kategorie, { index: lauf++, gerichte: [g] });
  }
  return [...map.entries()]
    .map(([kategorie, { index, gerichte: gs }]) => ({ kategorie, index, gerichte: gs }))
    .sort((a, b) => kategorieRang(a.kategorie) - kategorieRang(b.kategorie) || a.index - b.index)
    .map(({ kategorie, gerichte: gs }) => ({ kategorie, gerichte: gs }));
}

/**
 * Fasst die je Mensa gelieferten Tagespläne zu Abschnitten je Mensa zusammen.
 * `proMensa` ist in Auswahlreihenfolge (MENSA-F-025) zu übergeben.
 */
export function konsolidiere(proMensa: MensaTagesplan[]): Konsolidierung {
  const geschlossene = proMensa.filter((p) => p.gerichte.length === 0).map((p) => p.mensaId);

  const eintraege = new Map<string, KonsolidiertesGericht>();
  // je Mensa die Schlüssel der Gerichte, für die sie die erste anbietende Mensa ist,
  // in der von der Quelle gelieferten Reihenfolge dieser Mensa.
  const schluesselJeMensa = new Map<string, string[]>();

  for (const { mensaId, gerichte } of proMensa) {
    for (const g of gerichte) {
      const vorhanden = eintraege.get(g.schluessel);
      if (vorhanden) {
        if (!vorhanden.anbieter.includes(mensaId)) vorhanden.anbieter.push(mensaId);
        continue;
      }
      eintraege.set(g.schluessel, {
        schluessel: g.schluessel,
        anbieter: [mensaId],
        massgeblich: { ...g, mensaId },
      });
      if (!schluesselJeMensa.has(mensaId)) schluesselJeMensa.set(mensaId, []);
      schluesselJeMensa.get(mensaId)!.push(g.schluessel);
    }
  }

  const sektionen: KonsolidierteSektion[] = proMensa
    .filter((p) => p.gerichte.length > 0)
    .map((p) => {
      const flach = (schluesselJeMensa.get(p.mensaId) ?? []).map((s) => {
        const eintrag = eintraege.get(s)!;
        return { kategorie: eintrag.massgeblich.kategorie?.trim() ?? '', eintrag };
      });
      const gruppen = gruppiereNachKategorie(flach).map(({ kategorie, gerichte }) => ({
        kategorie,
        gerichte: gerichte.map((x) => x.eintrag),
      }));
      return { mensaId: p.mensaId, gruppen };
    })
    // Ein Abschnitt kann leer sein, wenn alle seine Gerichte schon in einem
    // früheren Abschnitt stehen (dieselbe Mensa früher in der Auswahl → nie;
    // ein Gericht nur an einer später gewählten Mensa → eigener Abschnitt).
    .filter((s) => s.gruppen.length > 0);

  return { sektionen, geschlossene };
}
