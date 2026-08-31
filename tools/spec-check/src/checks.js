// Die vier Prüfungen am Spec-Bestand aus
// specs/platform/quality-and-testing.md Abschnitt 8.
//
//   QA-N-080  keine doppelten Anforderungs-IDs
//   QA-N-090  jede Anforderung trägt genau eine Herkunftsmarkierung
//   QA-N-100  alle Frontmatter-Pflichtfelder vorhanden
//   QA-N-110  jeder Verweis zeigt auf ein existierendes Ziel
//
// Jede Funktion nimmt das eingelesene Modell (siehe collect()) und gibt eine
// Liste von Befunden { file, line, message } zurück. Eine leere Liste = bestanden.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  listSpecFiles, relPath, readSpec, frontmatterValue, frontmatterList,
  extractRequirements, isValidHerkunft, REQ_ID, INT_ID,
} from './parse.js';

// Frontmatter-Pflichtfelder je Dateiart (Feldlisten aus specs/_templates/).
const FIELDS = {
  adr: ['nummer', 'titel', 'status', 'datum', 'betrifft'],
  feature: ['id', 'titel', 'praefix', 'status', 'prioritaet', 'version', 'owner',
    'last_reviewed', 'derived_from', 'implemented_in', 'related'],
  // platform/-Specs folgen der Feature-Vorlage ohne prioritaet.
  platform: ['id', 'titel', 'praefix', 'status', 'version', 'owner',
    'last_reviewed', 'derived_from', 'implemented_in', 'related'],
  // Produkt-/Prozessdokumente ohne Präfix (README, roadmap, glossary, …).
  doc: ['status', 'version', 'owner', 'last_reviewed'],
};

function classify(rel, spec) {
  if (rel.startsWith('decisions/')) return 'adr';
  if (/^features\/[^/]+\/spec\.md$/.test(rel)) return 'feature';
  if (spec.keys.has('praefix')) return 'platform';
  return 'doc';
}

/** Liest den gesamten Bestand einmal ein. */
export function collect(specsDir) {
  const files = listSpecFiles(specsDir);
  const specs = files.map((file) => {
    const rel = relPath(specsDir, file);
    const spec = readSpec(file);
    const kind = classify(rel, spec);
    return { file, rel, spec, kind };
  });

  // Anforderungen werden nur aus Dateien mit Präfix gelesen (Feature- und
  // platform/-Specs). README, Vorlagen und Produktdokumente definieren keine.
  const requirements = [];
  for (const s of specs) {
    if (!s.spec.keys.has('praefix')) continue;
    requirements.push(...extractRequirements(s.spec, s.rel));
  }

  const definedReqIds = new Set(requirements.map((r) => r.id));
  const intFile = specs.find((s) => s.rel === 'platform/integrations.md');
  const definedIntIds = new Set();
  if (intFile) {
    for (const m of intFile.spec.body.matchAll(/^\|\s*(INT-\d{3})\s*\|/gm)) {
      definedIntIds.add(m[1]);
    }
  }

  return { specsDir, specs, requirements, definedReqIds, definedIntIds };
}

// ---------------------------------------------------------------- QA-N-080
export function checkDuplicateIds(model) {
  const seen = new Map();
  for (const r of model.requirements) {
    if (!seen.has(r.id)) seen.set(r.id, []);
    seen.get(r.id).push(r);
  }
  const findings = [];
  for (const [id, rows] of seen) {
    if (rows.length < 2) continue;
    const where = rows.map((r) => `${r.file}:${r.line}`).join(', ');
    findings.push({
      file: rows[0].file,
      line: rows[0].line,
      message: `Anforderungs-ID ${id} ${rows.length}-mal definiert: ${where}`,
    });
  }
  return findings;
}

// ---------------------------------------------------------------- QA-N-090
export function checkHerkunft(model) {
  const findings = [];
  for (const r of model.requirements) {
    if (isValidHerkunft(r.herkunft)) continue;
    findings.push({
      file: r.file,
      line: r.line,
      message: `Anforderung ${r.id}: Herkunftsmarkierung "${r.herkunft}" entspricht keinem der `
        + 'zulässigen Muster (Alt: <pfad>, NEU, Android: unbekannt, Alt: bewusst verworfen, '
        + 'Recherche: <quelle>, <datum>).',
    });
  }
  return findings;
}

// ---------------------------------------------------------------- QA-N-100
export function checkFrontmatter(model) {
  const findings = [];
  for (const s of model.specs) {
    if (!s.spec.hasFrontmatter) {
      findings.push({ file: s.rel, line: 1, message: 'Kein YAML-Frontmatter gefunden.' });
      continue;
    }
    const required = FIELDS[s.kind];
    const missing = required.filter((f) => !s.spec.keys.has(f));
    if (missing.length) {
      findings.push({
        file: s.rel,
        line: 1,
        message: `Frontmatter (${s.kind}) fehlen Pflichtfelder: ${missing.join(', ')}`,
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------- QA-N-110
export function checkReferences(model) {
  const findings = [];

  for (const s of model.specs) {
    // (a) related: / betrifft: -> Zieldatei muss existieren.
    const refKey = s.kind === 'adr' ? 'betrifft' : 'related';
    for (const ref of frontmatterList(s.spec, refKey)) {
      if (!ref || ref.startsWith('#')) continue;
      const fromDir = join(model.specsDir, dirname(s.rel), ref);
      const fromRoot = join(model.specsDir, ref);
      if (!existsSync(fromDir) && !existsSync(fromRoot)) {
        findings.push({
          file: s.rel,
          line: 1,
          message: `${refKey}: Verweis "${ref}" zeigt auf keine existierende Datei.`,
        });
      }
    }

    // (b) INT-### im Rumpf -> muss im Register definiert sein.
    for (const m of s.spec.body.matchAll(INT_ID)) {
      const id = m[0];
      if (!model.definedIntIds.has(id)) {
        findings.push({
          file: s.rel,
          line: lineOf(s.spec.body, m.index) + bodyOffset(s.spec),
          message: `Verweis auf ${id}, aber kein solcher Eintrag in platform/integrations.md.`,
        });
      }
    }

    // (c) Requirement-ID im Rumpf -> muss irgendwo definiert sein.
    for (const m of s.spec.body.matchAll(REQ_ID)) {
      const id = m[0];
      if (model.definedReqIds.has(id)) continue;
      findings.push({
        file: s.rel,
        line: lineOf(s.spec.body, m.index) + bodyOffset(s.spec),
        message: `Verweis auf Anforderung ${id}, die in keiner Spec definiert ist.`,
      });
    }
  }
  return dedupe(findings);
}

function bodyOffset(spec) {
  return spec.hasFrontmatter ? spec.frontmatterEndLine + 2 : 1;
}
function lineOf(text, index) {
  let n = 0;
  for (let i = 0; i < index; i++) if (text[i] === '\n') n++;
  return n;
}
function dedupe(findings) {
  const seen = new Set();
  return findings.filter((f) => {
    const k = `${f.file}:${f.line}:${f.message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const CHECKS = [
  { id: 'QA-N-080', title: 'Keine doppelten Anforderungs-IDs', run: checkDuplicateIds },
  { id: 'QA-N-090', title: 'Genau eine Herkunftsmarkierung je Anforderung', run: checkHerkunft },
  { id: 'QA-N-100', title: 'Frontmatter-Pflichtfelder vollständig', run: checkFrontmatter },
  { id: 'QA-N-110', title: 'Verweise zeigen auf existierende Ziele', run: checkReferences },
];
