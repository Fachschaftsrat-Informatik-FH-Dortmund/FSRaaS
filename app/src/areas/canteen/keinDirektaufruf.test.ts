import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Capability `architecture`, Requirement „News und Mensa-Speisepläne über das
// Backend": Die App bezieht beides ausschließlich über das eigene Backend und
// spricht die jeweilige Quelle nie unmittelbar an — auch nicht die vom FSR
// selbst betriebene Mensa-Schnittstelle (INT-020). Der Grund liegt nicht in der
// Vertrauenswürdigkeit der Quelle, sondern darin, dass Kuration der
// Mensa-Auswahl, Verknüpfung mit Bewertungen und Fotos sowie die einheitliche
// Fehlerbehandlung an einer Stelle bleiben (design.md D1).
//
// Die Prüfung liest den Quelltext, weil ein unterbliebener Netzaufruf sich nicht
// beobachten lässt: Ein Test kann belegen, dass ein Aufruf geschieht, nicht aber,
// dass keiner geschieht. Geprüft werden deshalb die Adressen selbst.

const APP_QUELLE = join(__dirname, '..', '..');

/** Adressen der Fremdquellen, die allein das Backend ansprechen darf. */
const FREMDQUELLEN = [
  // INT-020 — Mensa-API des FSR, Speiseplan und Öffnungsangaben.
  'mensa.fb4.it',
  // INT-015 — abgelöste ITMC-Schnittstelle der TU Dortmund.
  'api.itmc.tu-dortmund.de',
  // INT-008 — News-Quelle des FSR.
  'app.fsrfb4.de',
];

function dateienUnter(verzeichnis: string): string[] {
  const treffer: string[] = [];
  for (const eintrag of readdirSync(verzeichnis)) {
    const pfad = join(verzeichnis, eintrag);
    if (statSync(pfad).isDirectory()) {
      treffer.push(...dateienUnter(pfad));
    } else if (/\.tsx?$/.test(eintrag)) {
      treffer.push(pfad);
    }
  }
  return treffer;
}

describe('News und Mensa-Speisepläne über das Backend', () => {
  const dateien = dateienUnter(APP_QUELLE).filter((p) => !/\.test\.tsx?$/.test(p));

  it.each(FREMDQUELLEN)('nennt %s an keiner Stelle des App-Quelltexts', (adresse) => {
    const treffer = dateien.filter((pfad) => readFileSync(pfad, 'utf8').includes(adresse));
    expect(treffer).toEqual([]);
  });

  it('spricht die Mensa-Schnittstelle des FSR nicht unmittelbar an, sondern über das Backend', () => {
    const api = readFileSync(join(__dirname, 'api.ts'), 'utf8');
    // Jeder Abruf läuft über den erzeugten Backend-Client (`@/net/client`),
    // dessen Pfade aus dem Vertrag stammen — kein eigenes `fetch`.
    expect(api).toMatch(/@\/net\/client/);
    expect(api).not.toMatch(/\bfetch\(/);
    expect(api).toMatch(/'\/mensen\/\{mensaId\}\/speiseplan\/\{datum\}'/);
  });
});
