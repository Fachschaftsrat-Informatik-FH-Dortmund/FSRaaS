// Requirements „Gruppierung der Endpunkte in der Auswahl" und „Auffangkorb für
// nicht zuzuordnende Endpunkte" (`openspec/specs/schedule/spec.md`). Ordnet die
// über INT-001 gelieferten Endpunkte des Lehrangebots (Capability
// `integrations`, `FbwsStudiengang`) benannten Gruppen zu — abgeleitet aus
// `po`, dem Muster des Kurznamens (`sname`) und Merkmalen des Klarnamens
// (`name`), nicht aus einer gepflegten Zuordnungstabelle (design.md,
// Entscheidung 1). Ein Endpunkt, den keine Regel trifft, landet sichtbar im
// Auffangkorb statt zu verschwinden. Reine Funktionen ohne React.

import type { FbwsStudiengang } from './fbwsClient';

export type EndpunktGruppenSchluessel =
  | 'bachelor'
  | 'bachelorDual'
  | 'master'
  | 'blockwoche'
  | 'seminar'
  | 'tutorium'
  | 'wahlpflicht'
  | 'sonstige';

/** Anzeigereihenfolge der Gruppen (proposal.md, „Die Liste wird gegliedert"). */
const GRUPPENREIHENFOLGE: readonly EndpunktGruppenSchluessel[] = [
  'bachelor',
  'bachelorDual',
  'master',
  'blockwoche',
  'seminar',
  'tutorium',
  'wahlpflicht',
  'sonstige',
];

/** Ein Endpunkt innerhalb einer Gruppe, mit bereits aufgelöster Prüfungsordnung (`po`, ersatzweise aus `name`). */
export interface EndpunktEintrag {
  sname: string;
  name: string;
  /** `po` aus INT-001, ersatzweise aus `name` abgeleitet (`StgPO <Jahr>`); `null` = keine Prüfungsordnung. */
  po: string | null;
}

export interface EndpunktGruppe {
  schluessel: EndpunktGruppenSchluessel;
  eintraege: EndpunktEintrag[];
}

const MUSTER_PO_AUS_NAME = /StgPO\s*(\d{4})/;

/**
 * design.md Entscheidung 2: `po` ist der Vorzugsweg; fehlt es (Rückfallliste
 * des eigenen Backends, INT-008, liefert kein `po`), wird die Prüfungsordnung
 * aus dem Klarnamen gelesen (`Bachelor Informatik (StgPO 2019), …`).
 */
function leitePruefungsordnungAb(s: FbwsStudiengang): string | null {
  if (s.po !== null) return s.po;
  const treffer = MUSTER_PO_AUS_NAME.exec(s.name);
  return treffer ? treffer[1]! : null;
}

/**
 * design.md Entscheidung 1: drei Merkmalsquellen, in fester Reihenfolge
 * geprüft. Die `sname`-Stellenregel (Master/Bachelor, dual) greift erst nach
 * den Namensregeln — sonst läse sie bei `Blockwoche1`, `QDL` oder `FemINF`
 * einen Buchstaben, der nichts mit Prüfungsordnungsart zu tun hat.
 */
function ermittleGruppenschluessel(s: FbwsStudiengang): EndpunktGruppenSchluessel {
  if (s.sname.startsWith('Blockwoche')) return 'blockwoche';
  if (s.name.includes('Tutori')) return 'tutorium';
  if (s.name.includes('eminar')) return 'seminar';
  if (s.name.includes('Wahlpflicht')) return 'wahlpflicht';

  const artZeichen = s.sname.charAt(3); // vierte Stelle: 'B' Bachelor, 'M' Master
  const dual = s.sname.charAt(2) === 'D'; // dritte Stelle: 'D' dual

  if (artZeichen === 'B') return dual ? 'bachelorDual' : 'bachelor';
  if (artZeichen === 'M') return 'master'; // keine „Master dual"-Gruppe im Bestand vom 2026-09-08

  return 'sonstige';
}

/**
 * Requirements „Gruppierung der Endpunkte in der Auswahl" und „Auffangkorb
 * für nicht zuzuordnende Endpunkte". Nur Gruppen mit mindestens einem Eintrag
 * erscheinen im Ergebnis, in der Reihenfolge Bachelor, Bachelor dual, Master,
 * Blockwoche, Seminare, Tutorien, Wahlpflicht, Auffangkorb. Innerhalb einer
 * Gruppe zuerst nach Prüfungsordnung, darunter alphabetisch nach Klarname.
 */
export function gruppiereEndpunkte(studiengaenge: readonly FbwsStudiengang[]): EndpunktGruppe[] {
  const nachGruppe = new Map<EndpunktGruppenSchluessel, EndpunktEintrag[]>();

  for (const s of studiengaenge) {
    const schluessel = ermittleGruppenschluessel(s);
    const eintrag: EndpunktEintrag = { sname: s.sname, name: s.name, po: leitePruefungsordnungAb(s) };
    const liste = nachGruppe.get(schluessel);
    if (liste) liste.push(eintrag);
    else nachGruppe.set(schluessel, [eintrag]);
  }

  const ergebnis: EndpunktGruppe[] = [];
  for (const schluessel of GRUPPENREIHENFOLGE) {
    const eintraege = nachGruppe.get(schluessel);
    if (!eintraege || eintraege.length === 0) continue;
    eintraege.sort((a, b) => (a.po ?? '').localeCompare(b.po ?? '') || a.name.localeCompare(b.name, 'de'));
    ergebnis.push({ schluessel, eintraege });
  }
  return ergebnis;
}

/** Freitextsuche (Requirement „Freitextsuche in der Endpunktauswahl") über Klar- und Kurzname, diakritika-/großschreibungstolerant. */
function normalisiereText(wert: string): string {
  return wert
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function filtereEndpunktGruppen(gruppen: readonly EndpunktGruppe[], suchtext: string): EndpunktGruppe[] {
  const text = suchtext.trim();
  if (!text) return [...gruppen];
  const normalisiert = normalisiereText(text);

  return gruppen
    .map((gruppe) => ({
      ...gruppe,
      eintraege: gruppe.eintraege.filter(
        (e) => normalisiereText(e.name).includes(normalisiert) || normalisiereText(e.sname).includes(normalisiert),
      ),
    }))
    .filter((gruppe) => gruppe.eintraege.length > 0);
}
