// Der reale Spec-Bestand muss alle vier Prüfungen bestehen (QA-N-080 bis
// QA-N-110). Schlägt dieser Test fehl, ist der Bestand selbst inkonsistent —
// nicht das Werkzeug.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { run } from '../src/cli.js';

const specsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../specs');

for (const id of ['QA-N-080', 'QA-N-090', 'QA-N-100', 'QA-N-110']) {
  test(`${id} bestanden für den realen Spec-Bestand`, () => {
    const result = run(specsDir).find((r) => r.id === id);
    assert.equal(
      result.findings.length,
      0,
      `${id}: ${result.findings.map((f) => `\n  ${f.file}:${f.line} ${f.message}`).join('')}`,
    );
  });
}
