// Tests für die vier Prüfungen aus specs/platform/quality-and-testing.md
// Abschnitt 8. Jeder Test trägt die Anforderungs-ID im Namen (QA-F-010).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  collect, checkDuplicateIds, checkHerkunft, checkFrontmatter, checkReferences,
} from '../src/checks.js';

/** Baut einen Mini-Spec-Bestand aus { relPfad: inhalt } und gibt das Modell zurück. */
function build(files) {
  const dir = mkdtempSync(join(tmpdir(), 'speccheck-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  const model = collect(dir);
  return { dir, model, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const FM_PLATFORM = (praefix) => `---
id: x
titel: X
praefix: ${praefix}
status: accepted
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-27
derived_from: []
implemented_in: []
related: []
---
`;

const REG = `---
id: integrations
titel: Schnittstellenregister
praefix: INT
status: accepted
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-27
derived_from: []
implemented_in: []
related: []
---

| ID | Zweck |
|---|---|
| INT-001 | FBWS |
`;

// ------------------------------------------------------------------ QA-N-080
test('QA-N-080 meldet eine über zwei Dateien doppelt vergebene Anforderungs-ID', () => {
  const { model, cleanup } = build({
    'platform/a.md': FM_PLATFORM('AAA') + '\n| AAA-F-010 | Das System muss X. | NEU |\n',
    'platform/b.md': FM_PLATFORM('BBB') + '\n| AAA-F-010 | Das System muss Y. | NEU |\n',
  });
  const findings = checkDuplicateIds(model);
  cleanup();
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /AAA-F-010/);
});

test('QA-N-080 ist still, wenn jede Anforderungs-ID nur einmal vorkommt', () => {
  const { model, cleanup } = build({
    'platform/a.md': FM_PLATFORM('AAA')
      + '\n| AAA-F-010 | Das System muss X. | NEU |\n| AAA-F-020 | Das System muss Y. | NEU |\n',
  });
  const findings = checkDuplicateIds(model);
  cleanup();
  assert.deepEqual(findings, []);
});

test('QA-N-080 zählt eine als entfallen markierte Anforderung weiterhin als vergeben', () => {
  const { model, cleanup } = build({
    'platform/a.md': FM_PLATFORM('AAA') + '\n| ~~AAA-F-010~~ | ~~Das System muss X.~~ — entfallen | NEU |\n',
    'platform/b.md': FM_PLATFORM('BBB') + '\n| AAA-F-010 | Das System muss X neu. | NEU |\n',
  });
  const findings = checkDuplicateIds(model);
  cleanup();
  assert.equal(findings.length, 1);
});

// ------------------------------------------------------------------ QA-N-090
test('QA-N-090 akzeptiert alle fünf zulässigen Herkunftsmuster', () => {
  const rows = [
    '| AAA-F-010 | Das System muss A. | NEU |',
    '| AAA-F-020 | Das System muss B. | Alt: lib/main.dart:37 |',
    '| AAA-F-030 | Das System muss C. | Android: unbekannt |',
    '| AAA-F-040 | Das System muss D. | Alt: bewusst verworfen |',
    '| AAA-F-050 | Das System muss E. | Recherche: f-droid.org/docs, 2026-08-25 |',
  ].join('\n');
  const { model, cleanup } = build({ 'platform/a.md': FM_PLATFORM('AAA') + '\n' + rows + '\n' });
  const findings = checkHerkunft(model);
  cleanup();
  assert.deepEqual(findings, []);
});

test('QA-N-090 meldet eine Anforderung ohne erkennbare Herkunftsmarkierung', () => {
  const { model, cleanup } = build({
    'platform/a.md': FM_PLATFORM('AAA') + '\n| AAA-F-010 | Das System muss A. | irgendwas |\n',
  });
  const findings = checkHerkunft(model);
  cleanup();
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /AAA-F-010/);
});

test('QA-N-090 meldet eine Zelle mit zwei Markierungen', () => {
  const { model, cleanup } = build({
    'platform/a.md': FM_PLATFORM('AAA') + '\n| AAA-F-010 | Das System muss A. | NEU, Android: unbekannt |\n',
  });
  const findings = checkHerkunft(model);
  cleanup();
  assert.equal(findings.length, 1);
});

// ------------------------------------------------------------------ QA-N-100
test('QA-N-100 meldet ein fehlendes Frontmatter-Pflichtfeld einer Feature-Spec', () => {
  const spec = `---
id: demo
titel: Demo
praefix: DEMO
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-27
derived_from: []
implemented_in: []
related: []
---
`; // prioritaet fehlt
  const { model, cleanup } = build({ 'features/demo/spec.md': spec });
  const findings = checkFrontmatter(model);
  cleanup();
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /prioritaet/);
});

test('QA-N-100 meldet ein ADR ohne betrifft', () => {
  const adr = `---
nummer: 0099
titel: Test
status: angenommen
datum: 2026-08-27
---
`;
  const { model, cleanup } = build({ 'decisions/0099-test.md': adr });
  const findings = checkFrontmatter(model);
  cleanup();
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /betrifft/);
});

test('QA-N-100 ist still bei vollständigem Frontmatter', () => {
  const { model, cleanup } = build({ 'platform/a.md': FM_PLATFORM('AAA') });
  const findings = checkFrontmatter(model);
  cleanup();
  assert.deepEqual(findings, []);
});

// ------------------------------------------------------------------ QA-N-110
test('QA-N-110 meldet einen related-Verweis auf eine fehlende Datei', () => {
  const spec = FM_PLATFORM('AAA').replace('related: []', 'related:\n  - ../platform/gibtsnicht.md');
  const { model, cleanup } = build({ 'platform/a.md': spec });
  const findings = checkReferences(model);
  cleanup();
  assert.ok(findings.some((f) => /gibtsnicht\.md/.test(f.message)));
});

test('QA-N-110 meldet einen Verweis auf eine nicht definierte Anforderungs-ID', () => {
  const { model, cleanup } = build({
    'platform/a.md': FM_PLATFORM('AAA')
      + '\n| AAA-F-010 | Das System muss A. | NEU |\n\nSiehe auch BBB-F-999 dazu.\n',
  });
  const findings = checkReferences(model);
  cleanup();
  assert.ok(findings.some((f) => /BBB-F-999/.test(f.message)));
});

test('QA-N-110 meldet einen Verweis auf einen nicht existierenden INT-Eintrag', () => {
  const { model, cleanup } = build({
    'platform/integrations.md': REG,
    'platform/a.md': FM_PLATFORM('AAA') + '\nNutzt INT-042 fuer irgendwas.\n',
  });
  const findings = checkReferences(model);
  cleanup();
  assert.ok(findings.some((f) => /INT-042/.test(f.message)));
});

test('QA-N-110 ist still, wenn Anforderungs- und INT-Verweise aufgehen', () => {
  const { model, cleanup } = build({
    'platform/integrations.md': REG,
    'platform/a.md': FM_PLATFORM('AAA')
      + '\n| AAA-F-010 | Das System muss A. | NEU |\n\nAAA-F-010 nutzt INT-001.\n',
  });
  const findings = checkReferences(model);
  cleanup();
  assert.deepEqual(findings, []);
});
