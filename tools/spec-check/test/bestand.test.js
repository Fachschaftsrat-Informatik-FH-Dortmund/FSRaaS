// Der reale Anforderungsbestand muss alle drei Prüfungen bestehen. Schlägt
// dieser Test fehl, ist der Bestand selbst inkonsistent — nicht das Werkzeug.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { run } from '../src/cli.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

for (const result of run(root)) {
  test(`${result.id} bestanden für den realen Anforderungsbestand`, () => {
    assert.equal(
      result.findings.length,
      0,
      `${result.id}: ${result.findings.map((f) => `\n  ${f.file}:${f.line} ${f.message}`).join('')}`,
    );
  });
}
