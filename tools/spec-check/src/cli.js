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
  const opts = { json: false, root: null, herkunft: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') opts.json = true;
    else if (argv[i] === '--root') opts.root = argv[++i];
    else if (argv[i] === '--herkunft') opts.herkunft = argv[i + 1]?.startsWith('--')
      ? '' : (argv[++i] ?? '');
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

/**
 * Herkunftsbericht: zeigt, worauf sich der Bestand stützt.
 *
 * Ohne Argument die Verteilung über alle Requirements, mit Argument
 * (`NEU`, `Alt`, `Recherche`, `Android`) die betroffenen Requirements je
 * Capability. Gedacht als Einstieg in eine Durchsprache: Ein Requirement mit
 * Herkunft `NEU` stützt sich auf nichts außerhalb der Spec und ist damit das,
 * was am ehesten unbemerkt falsch sein kann.
 */
function herkunftsbericht(root, filter) {
  const { requirements } = collect(root);
  // Erstes Wort der Herkunftsangabe, ohne Satzzeichen — „NEU", „NEU." und
  // „NEU," sind dieselbe Herkunftsart.
  const art = (r) => (r.herkunft ?? '').split(/[:\s(]/)[0].replace(/[.,;]+$/, '') || '—';

  if (!filter) {
    const zaehler = new Map();
    for (const r of requirements) zaehler.set(art(r), (zaehler.get(art(r)) ?? 0) + 1);
    const sortiert = [...zaehler].sort((a, b) => b[1] - a[1]);
    process.stdout.write(`Requirements gesamt: ${requirements.length}\n\n`);
    for (const [k, v] of sortiert) {
      const anteil = Math.round((v / requirements.length) * 100);
      process.stdout.write(`  ${String(v).padStart(4)}  ${String(anteil).padStart(3)}%  ${k}\n`);
    }
    process.stdout.write('\nEinzelne Herkunftsart auflisten: --herkunft NEU\n');
    return;
  }

  const treffer = requirements.filter((r) => art(r) === filter);
  let letzte = null;
  for (const r of treffer) {
    if (r.file !== letzte) {
      process.stdout.write(`\n${r.file}\n`);
      letzte = r.file;
    }
    process.stdout.write(`  ${String(r.line).padStart(5)}  ${r.title}\n`);
  }
  process.stdout.write(`\n${treffer.length} Requirements mit Herkunft „${filter}".\n`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const root = opts.root ? resolve(opts.root) : defaultRoot();

  if (opts.herkunft !== null) {
    herkunftsbericht(root, opts.herkunft);
    return;
  }

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
