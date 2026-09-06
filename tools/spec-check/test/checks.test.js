// Tests für die drei Prüfungen aus openspec/specs/quality-and-testing/spec.md,
// Abschnitt „Prüfungen am Anforderungsbestand selbst". Jeder Test trägt den
// Requirement-Titel im Namen (Requirement „Testnachweis für nicht-funktionale
// Anforderungen mit ‚muss'", vormals QA-F-010).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  collect, checkDuplicateTitles, checkHerkunft, checkReferences,
} from '../src/checks.js';

/**
 * Baut einen Mini-Bestand aus { relPfad: inhalt } unterhalb einer Repo-Wurzel
 * und gibt das eingelesene Modell zurück. Pfade sind repo-relativ, also z. B.
 * `openspec/specs/demo/spec.md` oder `specs/decisions/0099-test.md`.
 */
function build(files) {
  const dir = mkdtempSync(join(tmpdir(), 'speccheck-'));
  // Beide Bäume existieren immer, damit collect() nicht an fehlenden Ordnern
  // vorbeiläuft und ein Test versehentlich leer bestanden wird.
  mkdirSync(join(dir, 'openspec', 'specs'), { recursive: true });
  mkdirSync(join(dir, 'specs'), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  const model = collect(dir);
  return { dir, model, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/** Eine Capability-Spec in OpenSpec-Form aus fertigen Requirement-Blöcken. */
function spec(...bloecke) {
  return `## Purpose\n\nTestbestand.\n\n## Requirements\n\n${bloecke.join('\n\n')}\n`;
}

/** Ein Requirement mit Titel, Text (inkl. Herkunftssatz) und einem Scenario. */
function req(titel, text) {
  return `### Requirement: ${titel}\n\n${text}\n\n`
    + `#### Scenario: Regelfall\n- **WHEN** etwas geschieht\n- **THEN** geschieht etwas anderes`;
}

const REGISTER = spec(
  req('INT-001 — FBWS', 'Das System muss FBWS aufrufen. Herkunft: NEU.'),
);

// ------------------------- Keine doppelten Anforderungs-Titel im Bestand
test('Keine doppelten Anforderungs-Titel im Bestand: meldet zwei gleiche Titel in derselben Capability', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(
      req('Gleicher Titel', 'Das System muss X. Herkunft: NEU.'),
      req('Gleicher Titel', 'Das System muss Y. Herkunft: NEU.'),
    ),
  });
  const findings = checkDuplicateTitles(model);
  cleanup();
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /Gleicher Titel/);
});

test('Keine doppelten Anforderungs-Titel im Bestand: ist still bei durchweg eigenen Titeln', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(
      req('Erster Titel', 'Das System muss X. Herkunft: NEU.'),
      req('Zweiter Titel', 'Das System muss Y. Herkunft: NEU.'),
    ),
  });
  const findings = checkDuplicateTitles(model);
  cleanup();
  assert.deepEqual(findings, []);
});

test('Keine doppelten Anforderungs-Titel im Bestand: derselbe Titel in zwei Capabilities ist zulässig', () => {
  const { model, cleanup } = build({
    'openspec/specs/a/spec.md': spec(req('Offline-Zustand', 'Das System muss X. Herkunft: NEU.')),
    'openspec/specs/b/spec.md': spec(req('Offline-Zustand', 'Das System muss Y. Herkunft: NEU.')),
  });
  const findings = checkDuplicateTitles(model);
  cleanup();
  assert.deepEqual(findings, []);
});

// ------------------------------------------- Herkunftsnachweis ist Pflicht
test('Herkunftsnachweis ist Pflicht: akzeptiert alle fünf zulässigen Muster', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(
      req('A', 'Das System muss A. Herkunft: NEU.'),
      req('B', 'Das System muss B. Herkunft: Alt: lib/main.dart:37.'),
      req('C', 'Das System muss C. Herkunft: Android: unbekannt.'),
      req('D', 'Das System muss D. Herkunft: Alt: bewusst verworfen.'),
      req('E', 'Das System muss E. Herkunft: Recherche: f-droid.org/docs, 2026-08-25.'),
    ),
  });
  const findings = checkHerkunft(model);
  cleanup();
  assert.deepEqual(findings, []);
});

test('Herkunftsnachweis ist Pflicht: akzeptiert Quellen mit Punkt und nachgestellte Erläuterung', () => {
  // Regressionsfall: Ein Muster, das an der ersten Satzgrenze endet, schneidet
  // `wiki.fsrfb4.de` und den erläuternden Folgesatz falsch ab.
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(
      req('A', 'Das System muss A. Herkunft: Recherche: wiki.fsrfb4.de, 2026-08-24. (vormals WIKI-F-050)'),
      req('B', 'Das System muss B. Herkunft: NEU (vormals SCHED-F-060). Die Alt-App tat das anders.'),
      req('C', 'Das System muss C. Herkunft: Alt: lib/areas/schedule/viewmodels/v.dart:218-249 (vormals SCHED-F-080).'),
    ),
  });
  const findings = checkHerkunft(model);
  cleanup();
  assert.deepEqual(findings, []);
});

test('Herkunftsnachweis ist Pflicht: meldet ein Requirement ganz ohne Herkunftssatz', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(req('Ohne', 'Das System muss A.')),
  });
  const findings = checkHerkunft(model);
  cleanup();
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /kein Herkunftssatz/);
});

test('Herkunftsnachweis ist Pflicht: meldet eine nicht zulässige Markierung', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(req('Falsch', 'Das System muss A. Herkunft: irgendwas.')),
  });
  const findings = checkHerkunft(model);
  cleanup();
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /entspricht keinem/);
});

test('Herkunftsnachweis ist Pflicht: meldet zwei Herkunftssätze in einem Requirement', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(
      req('Doppelt', 'Das System muss A. Herkunft: NEU.\n\nNachtrag. Herkunft: Android: unbekannt.'),
    ),
  });
  const findings = checkHerkunft(model);
  cleanup();
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /2 Herkunftssätze/);
});

test('Herkunftsnachweis ist Pflicht: wertet nur den Requirement-Text, nicht die Scenarios', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': '## Purpose\n\nT.\n\n## Requirements\n\n'
      + '### Requirement: Nur im Scenario\n\nDas System muss A.\n\n'
      + '#### Scenario: Regelfall\n- **WHEN** x\n- **THEN** y. Herkunft: NEU.\n',
  });
  const findings = checkHerkunft(model);
  cleanup();
  assert.equal(findings.length, 1, 'Herkunft im Scenario darf nicht als Nachweis zählen');
});

// -------------------------------- Referenzen zeigen auf existierende Ziele
test('Referenzen zeigen auf existierende Ziele: meldet einen related-Verweis ins Leere', () => {
  const { model, cleanup } = build({
    'specs/product/x.md': '---\nstatus: draft\nrelated:\n  - ../gibtsnicht.md\n---\n\nText.\n',
  });
  const findings = checkReferences(model);
  cleanup();
  assert.ok(findings.some((f) => /gibtsnicht\.md/.test(f.message)));
});

test('Referenzen zeigen auf existierende Ziele: meldet eine nirgends geführte Anforderungs-ID', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(req('A', 'Das System muss A. Herkunft: NEU (vormals DEMO-F-010).')),
    'specs/pruefprotokolle/2026-01-01-test.md': '# Protokoll\n\nGeprüft: BBB-F-999.\n',
  });
  const findings = checkReferences(model);
  cleanup();
  assert.ok(findings.some((f) => /BBB-F-999/.test(f.message)));
});

test('Referenzen zeigen auf existierende Ziele: eine als entfallen geführte ID gilt weiterhin als vergeben', () => {
  const { model, cleanup } = build({
    'openspec/specs/demo/spec.md': spec(req('A', 'Das System muss A. Herkunft: NEU.'))
      + '\n## Entfallene Anforderungen (historisch)\n\n'
      + '### Ehemals DEMO-F-020: Alter Merker\n\nStatus: entfallen.\n',
    'specs/pruefprotokolle/2026-01-01-test.md': '# Protokoll\n\nGeprüft: DEMO-F-020.\n',
  });
  const findings = checkReferences(model);
  cleanup();
  assert.deepEqual(findings, []);
});

test('Referenzen zeigen auf existierende Ziele: meldet einen nicht registrierten INT-Eintrag', () => {
  const { model, cleanup } = build({
    'openspec/specs/integrations/spec.md': REGISTER,
    'openspec/specs/demo/spec.md': spec(req('A', 'Das System muss INT-042 nutzen. Herkunft: NEU.')),
  });
  const findings = checkReferences(model);
  cleanup();
  assert.ok(findings.some((f) => /INT-042/.test(f.message)));
});

test('Referenzen zeigen auf existierende Ziele: eine entfallene Integration bleibt vergeben', () => {
  const { model, cleanup } = build({
    'openspec/specs/integrations/spec.md': REGISTER
      + '\n## Entfallene Anforderungen (historisch)\n\n'
      + '### Ehemals INT-013 — Prüfungsplan (Intranet-Excel)\n\n'
      + 'Status: entfallen, ersetzt durch INT-001.\n',
    'openspec/specs/demo/spec.md': spec(
      req('A', 'Das System nutzte früher INT-013. Herkunft: NEU.'),
    ),
  });
  const findings = checkReferences(model);
  cleanup();
  assert.deepEqual(findings, []);
});

test('Referenzen zeigen auf existierende Ziele: ist still, wenn alle Verweise aufgehen', () => {
  const { model, cleanup } = build({
    'openspec/specs/integrations/spec.md': REGISTER,
    'openspec/specs/demo/spec.md': spec(
      req('A', 'Das System muss INT-001 nutzen. Herkunft: NEU (vormals DEMO-F-010).'),
    ),
    'specs/pruefprotokolle/2026-01-01-test.md': '# Protokoll\n\nGeprüft: DEMO-F-010 über INT-001.\n',
  });
  const findings = checkReferences(model);
  cleanup();
  assert.deepEqual(findings, []);
});
