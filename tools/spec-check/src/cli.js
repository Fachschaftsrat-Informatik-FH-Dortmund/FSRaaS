#!/usr/bin/env node
// Läuft in der CI bei jedem Pull Request (specs/platform/quality-and-testing.md
// Abschnitt 8, ADR 0011). Exit-Code != 0 blockiert den Merge.
//
// Aufruf:  node src/cli.js [--json] [--specs <pfad>]

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { collect, CHECKS } from './checks.js';

function parseArgs(argv) {
  const opts = { json: false, specs: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') opts.json = true;
    else if (argv[i] === '--specs') opts.specs = argv[++i];
  }
  return opts;
}

function defaultSpecsDir() {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '../../../specs');
}

export function run(specsDir) {
  const model = collect(specsDir);
  return CHECKS.map((c) => ({
    id: c.id,
    title: c.title,
    findings: c.run(model),
  }));
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const specsDir = opts.specs ? resolve(opts.specs) : defaultSpecsDir();
  const results = run(specsDir);
  const failed = results.filter((r) => r.findings.length > 0);

  if (opts.json) {
    process.stdout.write(JSON.stringify({ specsDir, results }, null, 2) + '\n');
  } else {
    for (const r of results) {
      const mark = r.findings.length === 0 ? 'OK  ' : 'FEHL';
      process.stdout.write(`[${mark}] ${r.id}  ${r.title}\n`);
      for (const f of r.findings) {
        process.stdout.write(`       ${f.file}:${f.line}  ${f.message}\n`);
      }
    }
    process.stdout.write(
      failed.length === 0
        ? '\nSpec-Bestand: alle Prüfungen bestanden.\n'
        : `\nSpec-Bestand: ${failed.length} von ${results.length} Prüfungen fehlgeschlagen.\n`,
    );
  }

  process.exit(failed.length === 0 ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
