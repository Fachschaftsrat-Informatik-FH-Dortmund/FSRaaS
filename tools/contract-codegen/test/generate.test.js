// API-N-035: jeder Aufruf zwischen App und Backend wird im Vertrag beschrieben,
// Typen werden daraus erzeugt (nicht von Hand geschrieben). Dieser Test sichert
// ab, dass die Erzeugung aus dem realen Vertrag gelingt und beide Zielsprachen
// deckt.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const generator = resolve(dirname(fileURLToPath(import.meta.url)), '../src/generate.mjs');

test('API-N-035 Codeerzeugung aus dem Vertrag gelingt für TypeScript und C#', () => {
  const before = new Set(readdirSync(tmpdir()).filter((d) => d.startsWith('fb4-codegen-')));
  execFileSync(process.execPath, [generator, '--check'], { stdio: 'pipe' });
  const dir = readdirSync(tmpdir())
    .filter((d) => d.startsWith('fb4-codegen-') && !before.has(d))
    .map((d) => join(tmpdir(), d))
    .at(-1);

  const ts = readFileSync(join(dir, 'schema.ts'), 'utf8');
  const cs = readFileSync(join(dir, 'Contract.cs'), 'utf8');

  assert.match(ts, /export interface components/);
  assert.match(ts, /Stammdaten:\s*\{/);
  assert.match(cs, /namespace Fb4\.Backend\.Contract\.Generated/);
  assert.match(cs, /public record Fehler/);
  assert.match(cs, /public enum Klassifizierung/);
});
