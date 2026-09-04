import type { Gericht } from './api';

// MENSA-F-012 bis F-018: Die Gerichte der gewählten Mensen eines Tages werden zu
// genau einem Eintrag je Gericht zusammengefasst (Schlüssel: der vom Backend
// gelieferte normalisierte `schluessel`, RATE-F-050 — kein eigener Normalisierer
// in der App). Reine Fachlogik ohne React, damit sie einzeln testbar ist
// (`platform/quality-and-testing.md` Abschnitt 5).

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
   * (MENSA-F-018): die aktive Mensa, sofern sie das Gericht führt, sonst die in
   * der Reihenfolge erste anbietende Mensa.
   */
  massgeblich: AnbieterGericht;
  /** Die aktive Mensa führt dieses Gericht (MENSA-F-016, Hervorhebung). */
  anAktiver: boolean;
}

export interface Konsolidierung {
  gruppen: { kategorie: string; gerichte: KonsolidiertesGericht[] }[];
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
 * Fasst die je Mensa gelieferten Tagespläne zu einer Liste zusammen.
 * `proMensa` ist in Auswahlreihenfolge (MENSA-F-025) zu übergeben.
 */
export function konsolidiere(
  proMensa: MensaTagesplan[],
  aktiveMensaId: string | null,
): Konsolidierung {
  const geschlossene = proMensa.filter((p) => p.gerichte.length === 0).map((p) => p.mensaId);

  const eintraege = new Map<string, KonsolidiertesGericht>();
  const reihenfolge: string[] = [];

  for (const { mensaId, gerichte } of proMensa) {
    for (const g of gerichte) {
      const vorhanden = eintraege.get(g.schluessel);
      if (vorhanden) {
        if (!vorhanden.anbieter.includes(mensaId)) vorhanden.anbieter.push(mensaId);
      } else {
        eintraege.set(g.schluessel, {
          schluessel: g.schluessel,
          anbieter: [mensaId],
          massgeblich: { ...g, mensaId },
          anAktiver: false,
        });
        reihenfolge.push(g.schluessel);
      }
    }
  }

  // Maßgebliche Mensa und Aktiv-Kennzeichen auflösen (MENSA-F-016/F-018).
  for (const eintrag of eintraege.values()) {
    eintrag.anAktiver = aktiveMensaId !== null && eintrag.anbieter.includes(aktiveMensaId);
    const massgeblicheMensa =
      aktiveMensaId !== null && eintrag.anbieter.includes(aktiveMensaId)
        ? aktiveMensaId
        : eintrag.anbieter[0]!;
    if (massgeblicheMensa !== eintrag.massgeblich.mensaId) {
      const plan = proMensa.find((p) => p.mensaId === massgeblicheMensa);
      const gericht = plan?.gerichte.find((g) => g.schluessel === eintrag.schluessel);
      if (gericht) eintrag.massgeblich = { ...gericht, mensaId: massgeblicheMensa };
    }
  }

  // Nach Kategorie der maßgeblichen Mensa gruppieren (MENSA-F-040/F-160), Reihenfolge stabil.
  const flach = reihenfolge.map((schluessel) => {
    const eintrag = eintraege.get(schluessel)!;
    return { kategorie: eintrag.massgeblich.kategorie?.trim() ?? '', eintrag };
  });
  const gruppen = gruppiereNachKategorie(flach).map(({ kategorie, gerichte }) => ({
    kategorie,
    gerichte: gerichte.map((x) => x.eintrag),
  }));

  return { gruppen, geschlossene };
}
