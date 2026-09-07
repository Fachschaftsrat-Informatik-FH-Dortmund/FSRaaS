import { kategorieRang, type Konsolidierung, type KonsolidiertesGericht } from './consolidate';
import { preisFuer } from './preise';
import type { PriceGroup } from './priceGroup';

// Sortier-/Gruppiermodell der Mensa-Hauptansicht (Requirements „Wahl der
// Gruppierung" bis „Feste Endposition von Beilagen- und Sammelgruppe" in
// openspec/specs/canteen/spec.md). Reine Fachlogik ohne React, entkoppelt von
// der Zusammenfassung (`consolidate.ts`): `wendeAn` nimmt die konsolidierten
// Gerichte plus einen Kontext und ein Preset und liefert die Anzeigestruktur.
//
// Drei unabhängige Bausteine: Gruppierung (keine / nach Mensa / nach Kategorie),
// Gruppenreihenfolge (Kriterium + Richtung, nur bei aktiver Gruppierung) und
// Gerichte-Sortierung (Kriterium + Richtung). Die maßgebliche Mensa bleibt an
// die Mensa-Auswahlreihenfolge gebunden, unabhängig von der Gruppenreihenfolge.

export type Gruppierung = 'keine' | 'mensa' | 'kategorie';
export type Sortierkriterium =
  | 'quelle'
  | 'bezeichnung'
  | 'preis'
  | 'eigeneBewertung'
  | 'community';
/** Kriterium für die Reihenfolge der Gruppen selbst. */
export type GruppenKriterium = 'reihenfolge' | 'alphabetisch';
export type Richtung = 'auf' | 'ab';

export interface Kombination {
  gruppierung: Gruppierung;
  /** Nur bei aktiver Gruppierung ausgewertet. */
  gruppenreihenfolge?: { kriterium: GruppenKriterium; richtung: Richtung };
  gerichteSortierung: { kriterium: Sortierkriterium; richtung: Richtung };
}

export interface AufgeloestesPreset extends Kombination {
  id: string;
  /** true = eigenes (umbenennbar/löschbar), false = eines der vier vordefinierten. */
  eigen: boolean;
}

/** Higher = besser bewertet; `undefined` = unbewertet. Anschlussstelle für RATE-F-100 (D4). */
export type BewertungResolver = (
  schluessel: string,
  art: 'eigen' | 'community',
) => number | undefined;

export interface SortierKontext {
  preisGruppe: PriceGroup;
  /** Kennungen der gewählten Mensen in Auswahlreihenfolge (MENSA-F-025). */
  mensaReihenfolge: string[];
  mensaName: (id: string) => string;
  /** Oberflächensprache für lokalisierte Sortierung (`Intl.Collator`). */
  sprache: string;
  /** Bis Roadmap-Schritt 9 liefert der Resolver immer `undefined` (D4). */
  bewertung?: BewertungResolver;
}

export interface Abschnitt {
  id: string;
  /** `null` = keine Überschrift (Gruppierung „keine" oder kategorielose Sammelgruppe). */
  titel: string | null;
  /**
   * `'geschlossen'` = gewählte Mensa ohne Angebot am Tag, mit leerer Gerichtsliste;
   * entsteht nur bei Gruppierung „nach Mensa" (design.md D2). Sonst `'gerichte'`.
   */
  zustand: 'gerichte' | 'geschlossen';
  gerichte: KonsolidiertesGericht[];
}

export interface AngezeigteStruktur {
  abschnitte: Abschnitt[];
  /** Steuert Chip-Leiste + Abschnittsüberschriften in der Ansicht. */
  gruppierungAktiv: boolean;
}

const ALLE_KRITERIEN: readonly Sortierkriterium[] = [
  'quelle',
  'bezeichnung',
  'preis',
  'eigeneBewertung',
  'community',
];

// -------------------------------------------------------------- Gerichte-Sortierung

function collator(sprache: string): Intl.Collator {
  return new Intl.Collator(sprache || 'de', { sensitivity: 'base', numeric: true });
}

/** Vergleicht auf `quellrang` (Reihenfolge der Quelle), stets aufsteigend. */
function nachQuelle(a: KonsolidiertesGericht, b: KonsolidiertesGericht): number {
  return a.quellrang - b.quellrang;
}

/**
 * Ordnet die Gerichte einer Gruppe nach Kriterium und Richtung. Die
 * Quellreihenfolge (`quellrang`) ist stets der Stichentscheid; ohne wirksames
 * Kriterium entspricht die Reihenfolge damit der Reihenfolge der Quelle.
 */
export function sortiereGerichte(
  gerichte: KonsolidiertesGericht[],
  { kriterium, richtung }: Kombination['gerichteSortierung'],
  kontext: SortierKontext,
): KonsolidiertesGericht[] {
  const vz = richtung === 'ab' ? -1 : 1;

  if (kriterium === 'quelle') {
    return [...gerichte].sort((a, b) => vz * nachQuelle(a, b));
  }

  if (kriterium === 'bezeichnung') {
    const c = collator(kontext.sprache);
    return [...gerichte].sort(
      (a, b) => vz * c.compare(a.massgeblich.bezeichnung, b.massgeblich.bezeichnung) || nachQuelle(a, b),
    );
  }

  if (kriterium === 'preis') {
    const preis = (g: KonsolidiertesGericht) => preisFuer(g.massgeblich, kontext.preisGruppe);
    return [...gerichte].sort((a, b) => {
      const pa = preis(a);
      const pb = preis(b);
      // Gerichte ohne Preisangabe ans Ende, untereinander in Quellreihenfolge.
      if (pa == null && pb == null) return nachQuelle(a, b);
      if (pa == null) return 1;
      if (pb == null) return -1;
      return vz * (pa - pb) || nachQuelle(a, b);
    });
  }

  // Bewertungskriterien (eigeneBewertung / community): unbewertete Gerichte
  // unabhängig von der Richtung ans Ende, untereinander in Quellreihenfolge
  // (Requirement „Einordnung unbewerteter Gerichte ans Ende").
  const art = kriterium === 'community' ? 'community' : 'eigen';
  const bewertet: { g: KonsolidiertesGericht; wert: number }[] = [];
  const unbewertet: KonsolidiertesGericht[] = [];
  for (const g of gerichte) {
    const wert = kontext.bewertung?.(g.schluessel, art);
    if (wert == null) unbewertet.push(g);
    else bewertet.push({ g, wert });
  }
  bewertet.sort((a, b) => vz * (a.wert - b.wert) || nachQuelle(a.g, b.g));
  unbewertet.sort(nachQuelle);
  return [...bewertet.map((x) => x.g), ...unbewertet];
}

// -------------------------------------------------------------- Gruppenreihenfolge

function ordneGruppen<T extends { id: string; titel: string | null; rang: number; ersteQuelle: number }>(
  gruppen: T[],
  reihenfolge: Kombination['gruppenreihenfolge'],
  kontext: SortierKontext,
  festeEndgruppen: boolean,
): T[] {
  const kriterium = reihenfolge?.kriterium ?? 'reihenfolge';
  const vz = reihenfolge?.richtung === 'ab' ? -1 : 1;
  const c = collator(kontext.sprache);

  const vergleich = (a: T, b: T): number => {
    if (kriterium === 'alphabetisch') {
      return vz * c.compare(a.titel ?? '', b.titel ?? '') || a.ersteQuelle - b.ersteQuelle;
    }
    return vz * (a.ersteQuelle - b.ersteQuelle) || a.ersteQuelle - b.ersteQuelle;
  };

  if (!festeEndgruppen) return [...gruppen].sort(vergleich);

  // „Feste Endposition von Beilagen- und Sammelgruppe": kategorielose
  // Sammelgruppe (rang 1) und danach Beilagen (rang 2) stehen unabhängig vom
  // Kriterium am Ende; nur die benannten Kategorien (rang 0) werden geordnet.
  const benannt = gruppen.filter((g) => g.rang === 0).sort(vergleich);
  const rest = gruppen.filter((g) => g.rang !== 0).sort((a, b) => a.rang - b.rang);
  return [...benannt, ...rest];
}

// -------------------------------------------------------------- wendeAn

function flach(konsolidierung: Konsolidierung): KonsolidiertesGericht[] {
  return konsolidierung.sektionen.flatMap((s) => s.gruppen.flatMap((g) => g.gerichte));
}

/**
 * Baut die Anzeigestruktur der Gerichtsliste aus einem aufgelösten Preset (bzw.
 * einer Kombination), der Konsolidierung und dem Kontext.
 */
export function wendeAn(
  kombination: Kombination,
  konsolidierung: Konsolidierung,
  kontext: SortierKontext,
): AngezeigteStruktur {
  const alle = flach(konsolidierung);
  const sortiert = (gs: KonsolidiertesGericht[]) =>
    sortiereGerichte(gs, kombination.gerichteSortierung, kontext);

  if (kombination.gruppierung === 'keine') {
    return {
      abschnitte: [{ id: 'alle', titel: null, zustand: 'gerichte', gerichte: sortiert(alle) }],
      gruppierungAktiv: false,
    };
  }

  if (kombination.gruppierung === 'mensa') {
    const proMensa = new Map<string, KonsolidiertesGericht[]>();
    for (const g of alle) {
      const id = g.massgeblich.mensaId;
      if (!proMensa.has(id)) proMensa.set(id, []);
      proMensa.get(id)!.push(g);
    }
    // Zusätzlich zu den Mensen mit Angebot erhält jede gewählte Mensa ohne
    // Angebot einen Abschnitt mit leerer Gerichtsliste (design.md D2). Beide
    // Arten durchlaufen dieselbe Gruppenordnung — eine geschlossene Mensa steht
    // an genau der Stelle, an der sie stünde, wenn sie geöffnet hätte.
    const geschlossen = new Set(konsolidierung.geschlossene);
    const gruppen = [
      ...[...proMensa.entries()].map(([id, gs]) => ({ id, gerichte: gs })),
      ...konsolidierung.geschlossene.map((id) => ({
        id,
        gerichte: [] as KonsolidiertesGericht[],
      })),
    ].map(({ id, gerichte }) => ({
      id,
      titel: kontext.mensaName(id),
      rang: 0,
      // Mensa-Auswahlreihenfolge (MENSA-F-025) als „eingestellte Mensa-Reihenfolge".
      ersteQuelle: indexOderEnde(kontext.mensaReihenfolge, id),
      gerichte,
    }));
    const geordnet = ordneGruppen(gruppen, kombination.gruppenreihenfolge, kontext, false);
    return {
      abschnitte: geordnet.map((gr) => ({
        id: gr.id,
        titel: gr.titel,
        zustand: geschlossen.has(gr.id) ? ('geschlossen' as const) : ('gerichte' as const),
        gerichte: sortiert(gr.gerichte),
      })),
      gruppierungAktiv: true,
    };
  }

  // gruppierung === 'kategorie': ein Abschnitt je Kategorie über alle gewählten
  // Mensen; kategorielose Sammelgruppe (ohne Überschrift) und Beilagen am Ende.
  const proKategorie = new Map<string, KonsolidiertesGericht[]>();
  for (const g of alle) {
    const kategorie = g.massgeblich.kategorie?.trim() ?? '';
    if (!proKategorie.has(kategorie)) proKategorie.set(kategorie, []);
    proKategorie.get(kategorie)!.push(g);
  }
  const gruppen = [...proKategorie.entries()].map(([kategorie, gs]) => ({
    id: kategorie === '' ? '__ohne' : `kat:${kategorie}`,
    titel: kategorie === '' ? null : kategorie,
    rang: kategorieRang(kategorie),
    // Reihenfolge der Ausgabestellen in der Quelle: erstes Auftreten der Kategorie.
    ersteQuelle: Math.min(...gs.map((x) => x.quellrang)),
    gerichte: gs,
  }));
  const geordnet = ordneGruppen(gruppen, kombination.gruppenreihenfolge, kontext, true);
  return {
    abschnitte: geordnet.map((gr) => ({
      id: gr.id,
      titel: gr.titel,
      zustand: 'gerichte',
      gerichte: sortiert(gr.gerichte),
    })),
    gruppierungAktiv: true,
  };
}

function indexOderEnde(liste: string[], wert: string): number {
  const i = liste.indexOf(wert);
  return i < 0 ? liste.length : i;
}

// -------------------------------------------------------------- Presets

/**
 * Die vier vordefinierten Presets (Requirement „Vordefinierte Presets",
 * Abschnitt „Presets für Sortierung und Gruppierung" in `canteen/spec.md`).
 * Unveränderlich; Anzeigenamen kommen aus i18n (`mensa.preset.*`), nicht aus den
 * Konstanten (NFR-F-115).
 */
export const VORDEFINIERTE_PRESETS: readonly AufgeloestesPreset[] = [
  {
    id: 'mensa-eigene-bewertung',
    eigen: false,
    gruppierung: 'mensa',
    gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
    gerichteSortierung: { kriterium: 'eigeneBewertung', richtung: 'ab' },
  },
  {
    id: 'mensa-community',
    eigen: false,
    gruppierung: 'mensa',
    gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
    gerichteSortierung: { kriterium: 'community', richtung: 'ab' },
  },
  {
    id: 'mensa-guenstigstes',
    eigen: false,
    gruppierung: 'mensa',
    gruppenreihenfolge: { kriterium: 'reihenfolge', richtung: 'auf' },
    gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
  },
  {
    id: 'preis',
    eigen: false,
    gruppierung: 'keine',
    gerichteSortierung: { kriterium: 'preis', richtung: 'auf' },
  },
] as const;

/** Voreinstellung ohne vorherige eigene Wahl (Requirement „Voreingestelltes Preset"). */
export const VOREINSTELLUNG_ID = 'mensa-guenstigstes';

export function istVordefiniert(id: string): boolean {
  return VORDEFINIERTE_PRESETS.some((p) => p.id === id);
}

export interface EigenesPreset {
  id: string;
  name: string;
  kombination: Kombination;
}

/**
 * Löst die zuletzt-aktiv-Referenz zu einem Preset auf. Fehlt sie oder zeigt sie
 * auf ein gelöschtes eigenes Preset, greift die Voreinstellung „Mensa,
 * günstigstes zuerst".
 */
export function loeseAuf(
  aktivId: string | null | undefined,
  eigene: EigenesPreset[],
): AufgeloestesPreset {
  const vordefiniert = VORDEFINIERTE_PRESETS.find((p) => p.id === aktivId);
  if (vordefiniert) return vordefiniert;
  const eigen = eigene.find((p) => p.id === aktivId);
  if (eigen) return { id: eigen.id, eigen: true, ...eigen.kombination };
  return VORDEFINIERTE_PRESETS.find((p) => p.id === VOREINSTELLUNG_ID)!;
}

// -------------------------------------------------------------- Validierung

const GRUPPIERUNGEN: readonly Gruppierung[] = ['keine', 'mensa', 'kategorie'];
const GRUPPEN_KRITERIEN: readonly GruppenKriterium[] = ['reihenfolge', 'alphabetisch'];
const RICHTUNGEN: readonly Richtung[] = ['auf', 'ab'];

function istRichtungPaar(v: unknown, kriterien: readonly string[]): boolean {
  if (v == null || typeof v !== 'object') return false;
  const o = v as { kriterium?: unknown; richtung?: unknown };
  return (
    typeof o.kriterium === 'string' &&
    kriterien.includes(o.kriterium) &&
    typeof o.richtung === 'string' &&
    RICHTUNGEN.includes(o.richtung as Richtung)
  );
}

/**
 * Prüft eine (aus dem Speicher gelesene) Kombination auf bekannte Werte. Ein
 * Preset mit unbekanntem Kriterium/unbekannter Richtung wird verworfen, nicht
 * die ganze Liste (Design „Preset-Speicher-Schema").
 */
export function istGueltigeKombination(v: unknown): v is Kombination {
  if (v == null || typeof v !== 'object') return false;
  const o = v as Kombination;
  if (!GRUPPIERUNGEN.includes(o.gruppierung)) return false;
  if (!istRichtungPaar(o.gerichteSortierung, ALLE_KRITERIEN)) return false;
  if (o.gruppierung !== 'keine') {
    if (!istRichtungPaar(o.gruppenreihenfolge, GRUPPEN_KRITERIEN)) return false;
  }
  return true;
}
