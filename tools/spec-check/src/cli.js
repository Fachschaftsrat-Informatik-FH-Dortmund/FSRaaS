#!/usr/bin/env node
// Läuft in der CI bei jedem Pull Request (openspec/specs/quality-and-testing,
// Abschnitt „Prüfungen am Anforderungsbestand selbst"; ADR 0011).
// Exit-Code != 0 blockiert den Merge.
//
// Aufruf:  node src/cli.js [--json] [--root <pfad>]
//
// Geprüft werden beide Bäume: `openspec/specs/` (Anforderungsbestand seit
// ADR 0019) und `specs/` (Entscheidungen, Produkt-/Prozessdokumente,
// Prüfprotokolle — sie verweisen auf Anforderungen, definieren aber keine).

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { collect, CHECKS } from './checks.js';

function parseArgs(argv) {
  const opts = { json: false, root: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') opts.json = true;
    else if (argv[i] === '--root') opts.root = argv[++i];
  }
  return opts;
}

function defaultRoot() {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '../../..');
}

export function run(root) {
  const model = collect(root);
  return CHECKS.map((c) => ({
    id: c.id,
    vormals: c.vormals,
    findings: c.run(model),
  }));
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = opts.root ? resolve(opts.root) : defaultRoot();
  const results = run(root);
  const failed = results.filter((r) => r.findings.length > 0);

  if (opts.json) {
    process.stdout.write(JSON.stringify({ root, results }, null, 2) + '\n');
  } else {
    for (const r of results) {
      const mark = r.findings.length === 0 ? 'OK  ' : 'FEHL';
      process.stdout.write(`[${mark}] ${r.id}  (vormals ${r.vormals})\n`);
      for (const f of r.findings) {
        process.stdout.write(`       ${f.file}:${f.line}  ${f.message}\n`);
      }
    }
    process.stdout.write(
      failed.length === 0
        ? '\nAnforderungsbestand: alle Prüfungen bestanden.\n'
        : `\nAnforderungsbestand: ${failed.length} von ${results.length} Prüfungen fehlgeschlagen.\n`,
    );
  }

  process.exit(failed.length === 0 ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
