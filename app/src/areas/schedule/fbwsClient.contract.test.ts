// Vertragstest gegen den echten FBWS-Bestand (Requirement „Vertragstest gegen
// Fremdsysteme", `openspec/specs/quality-and-testing/spec.md`). Ruft die
// dokumentierten INT-001/INT-002-Endpunkte live über das Netz ab und
// schlägt sichtbar fehl, sobald sich die dort dokumentierte Antwortstruktur
// ändert — insbesondere das Feld `po` (INT-001) und der im Klarnamen
// geführte Datumsbereich der Blockwochen-Endpunkte
// (`endpunktzeitraum.leseDatumsbereichAusName`), auf den sich Capability
// `schedule` verlässt.
//
// Läuft NICHT in der Standardsuite (`npm test`/CI) — siehe `jest.config.js`
// und `jest.contract.config.js`. Aufruf ausdrücklich über
// `npm run test:contract`, mit Netzzugriff auf `ws.inf.fh-dortmund.de`.

import { leseDatumsbereichAusName } from './endpunktzeitraum';
import { holeStudiengaenge, holeTermine } from './fbwsClient';

describe('Vertragstest INT-001 — FBWS Studiengänge/Endpunkte gegen den echten Bestand', () => {
  it('liefert eine nicht-leere Liste, in der jeder Eintrag name, sname, grades und das Feld po trägt', async () => {
    const roh = await fetch('https://ws.inf.fh-dortmund.de/timetable/current/rest/CourseOfStudy/?Accept=application/json');
    expect(roh.ok).toBe(true);
    const map = (await roh.json()) as Record<string, unknown>;
    const eintraege = Object.values(map).filter(
      (e): e is Record<string, unknown> => typeof e === 'object' && e !== null && 'grades' in e && e.grades !== null,
    );
    expect(eintraege.length).toBeGreaterThan(0);

    for (const eintrag of eintraege) {
      expect(typeof eintrag.name).toBe('string');
      expect(typeof eintrag.sname).toBe('string');
      expect(Array.isArray(eintrag.grades)).toBe(true);
      // Requirement „Prüfungsordnung ausgewertet": po muss als Feld vorhanden
      // sein (Wert null, die Zeichenkette "NULL" oder eine Jahreszahl) — sein
      // Verschwinden ist genau der Bruch, den dieser Test aufdecken soll.
      expect('po' in eintrag).toBe(true);
    }
  });

  it('liefert holeStudiengaenge()-Einträge mit auswertbarem po-Feld über den eigenen Client', async () => {
    const studiengaenge = await holeStudiengaenge();
    expect(studiengaenge.length).toBeGreaterThan(0);
    for (const s of studiengaenge) {
      expect(s.po === null || typeof s.po === 'string').toBe(true);
    }
  });
});

describe('Vertragstest INT-002/schedule — Blockwochen-Zeitraum weiterhin aus dem Klarnamen lesbar', () => {
  it('jeder Blockwoche-Endpunkt aus dem echten INT-001-Bestand liefert einen Namen, aus dem sich ein Datumsbereich lesen lässt', async () => {
    const studiengaenge = await holeStudiengaenge();
    const blockwochen = studiengaenge.filter((s) => s.sname.startsWith('Blockwoche'));
    expect(blockwochen.length).toBeGreaterThan(0);

    for (const blockwoche of blockwochen) {
      const bereich = leseDatumsbereichAusName(blockwoche.name);
      expect(bereich).not.toBeNull();
    }
  });

  it('Termine eines Blockwoche-Endpunkts liefern weiterhin dateBegin/dateEnd über das ganze Semester, identisch für alle Termine (Grundlage der Überschreibung durch den Namen)', async () => {
    const studiengaenge = await holeStudiengaenge();
    const ersteBlockwoche = studiengaenge.find((s) => s.sname.startsWith('Blockwoche'));
    expect(ersteBlockwoche).toBeDefined();

    const termine = await holeTermine(ersteBlockwoche!.sname, '*');
    expect(termine.length).toBeGreaterThan(0);
    const dateBegins = new Set(termine.map((t) => t.dateBegin));
    // Nur ein einziger Wert über alle Termine des Endpunkts hinweg — der
    // Beweis, dass INT-002 hier keinen echten Blockwochen-Zeitraum liefert
    // und die Ableitung aus dem Namen (Capability `schedule`) nötig bleibt.
    expect(dateBegins.size).toBe(1);
  });
});
