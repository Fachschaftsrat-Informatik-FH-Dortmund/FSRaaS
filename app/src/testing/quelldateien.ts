import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Alle Dateien unter `verzeichnis` (rekursiv), deren Name `muster` trifft.
 * Gemeinsamer Verzeichnis-Walker der statischen Quelltextprüfungen
 * (z. B. `navigation/routeFiles.test.ts`, `areas/canteen/keinDirektaufruf.test.ts`);
 * nur für Tests, nie aus App-Code importieren.
 */
export function quelldateienUnter(verzeichnis: string, muster: RegExp): string[] {
  return readdirSync(verzeichnis, { withFileTypes: true }).flatMap((eintrag) => {
    const pfad = join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) return quelldateienUnter(pfad, muster);
    return muster.test(eintrag.name) ? [pfad] : [];
  });
}
