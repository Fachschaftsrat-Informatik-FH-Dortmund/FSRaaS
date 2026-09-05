// Die drei Prüfungen am Anforderungsbestand aus
// openspec/specs/quality-and-testing/spec.md, Abschnitt „Prüfungen am
// Anforderungsbestand selbst":
//
//   Keine doppelten Anforderungs-Titel im Bestand   (vormals QA-N-080)
//   Herkunftsnachweis ist Pflicht                   (vormals QA-N-090)
//   Referenzen zeigen auf existierende Ziele        (vormals QA-N-110)
//
// Die vierte Prüfung des Vorgängerstands (Frontmatter-Pflichtfelder, vormals
// QA-N-100) ist mit ADR 0019 entfallen: OpenSpec-Specs tragen kein Frontmatter,
// und die Anforderungstabelle der Capability führt sie nicht mehr. Struktur-
// prüfungen an Proposal, Spec-Delta, Design und Tasks übernimmt `openspec
// validate`.
//
// Jede Funktion nimmt das eingelesene Modell (siehe collect()) und gibt eine
// Liste von Befunden { file, line, message } zurück. Eine leere Liste = bestanden.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  listMarkdownFiles, relPath, readDoc, frontmatterList, bodyOffset,
  extractRequirements, isValidHerkunft, REQ_ID, INT_ID,
} from './parse.js';

/** Liest beide Bäume einmal ein: openspec/specs/ und specs/. */
export function collect(root) {
  const openspecDir = join(root, 'openspec', 'specs');
  const specsDir = join(root, 'specs');

  const docs = [];
  for (const [dir, tree] of [[openspecDir, 'openspec'], [specsDir, 'specs']]) {
    if (!existsSync(dir)) continue;
    for (const file of listMarkdownFiles(dir)) {
      docs.push({ file, rel: relPath(root, file), tree, doc: readDoc(file) });
    }
  }

  // Anforderungen werden ausschließlich aus den Capability-Specs gelesen.
  const requirements = [];
  for (const d of docs) {
    if (d.tree !== 'openspec' || !/\/spec\.md$/.test(d.rel)) continue;
    requirements.push(...extractRequirements(d.doc, d.rel));
  }

  // Historische IDs gelten als definiert, wenn sie als „(vormals <ID>)" an
  // einem Requirement hängen — so bleibt die Rückverfolgbarkeit aus Testnamen
  // und Prüfprotokollen prüfbar (ADR 0019, offener Punkt).
  const definedLegacyIds = new Set();
  for (const r of requirements) for (const id of r.legacyIds) definedLegacyIds.add(id);

  // Entfallene Anforderungen bleiben vergeben: Eine zurückgezogene ID wird nie
  // neu verwendet, und Prüfprotokolle wie Erläuterungen verweisen weiterhin
  // auf sie. Der Vorgängerstand hielt das über durchgestrichene Tabellenzeilen
  // fest, die Capability-Specs über einen Abschnitt „Entfallene Anforderungen".
  for (const d of docs) {
    if (d.tree !== 'openspec') continue;
    for (const section of retiredSections(d.doc.body)) {
      for (const m of section.matchAll(REQ_ID)) definedLegacyIds.add(m[0]);
    }
  }

  // Das Schnittstellenregister führt seine Einträge als Requirement-Titel
  // „INT-### — <Name>".
  const definedIntIds = new Set();
  const intDoc = docs.find((d) => d.rel === 'openspec/specs/integrations/spec.md');
  if (intDoc) {
    for (const m of intDoc.doc.body.matchAll(/^### Requirement:\s*(INT-\d{3})\b/gm)) {
      definedIntIds.add(m[1]);
    }
  }

  return { root, docs, requirements, definedLegacyIds, definedIntIds };
}

// ------------------------------------- Keine doppelten Anforderungs-Titel
export function checkDuplicateTitles(model) {
  const findings = [];
  const perFile = new Map();
  for (const r of model.requirements) {
    if (!perFile.has(r.file)) perFile.set(r.file, new Map());
    const seen = perFile.get(r.file);
    if (!seen.has(r.title)) seen.set(r.title, []);
    seen.get(r.title).push(r);
  }
  for (const [file, seen] of perFile) {
    for (const [title, rows] of seen) {
      if (rows.length < 2) continue;
      findings.push({
        file,
        line: rows[0].line,
        message: `Requirement-Titel „${title}" ${rows.length}-mal in derselben Capability `
          + `definiert (Zeilen ${rows.map((r) => r.line).join(', ')}).`,
      });
    }
  }
  return findings;
}

// ------------------------------------------- Herkunftsnachweis ist Pflicht
export function checkHerkunft(model) {
  const findings = [];
  for (const r of model.requirements) {
    if (r.herkunftCount === 0) {
      findings.push({
        file: r.file,
        line: r.line,
        message: `Requirement „${r.title}": kein Herkunftssatz („Herkunft: …") im Requirement-Text.`,
      });
      continue;
    }
    if (r.herkunftCount > 1) {
      findings.push({
        file: r.file,
        line: r.line,
        message: `Requirement „${r.title}": ${r.herkunftCount} Herkunftssätze, genau einer ist zulässig.`,
      });
      continue;
    }
    if (!isValidHerkunft(r.herkunft)) {
      findings.push({
        file: r.file,
        line: r.line,
        message: `Requirement „${r.title}": Herkunft „${r.herkunft ?? '—'}" entspricht keinem der `
          + 'fünf zulässigen Muster (Alt: <pfad>, NEU, Android: unbekannt, '
          + 'Alt: bewusst verworfen, Recherche: <quelle>, <datum>).',
      });
    }
  }
  return findings;
}

// -------------------------------- Referenzen zeigen auf existierende Ziele
export function checkReferences(model) {
  const findings = [];

  for (const d of model.docs) {
    const offset = bodyOffset(d.doc);

    // (a) related: / betrifft: im Frontmatter -> Zieldatei muss existieren.
    for (const key of ['related', 'betrifft']) {
      for (const ref of frontmatterList(d.doc, key)) {
        if (!ref || ref.startsWith('#') || /^https?:/.test(ref)) continue;
        const candidates = [
          join(model.root, dirname(d.rel), ref),
          join(model.root, 'specs', ref),
          join(model.root, 'openspec', 'specs', ref),
          join(model.root, ref),
        ];
        if (!candidates.some((c) => existsSync(c))) {
          findings.push({
            file: d.rel,
            line: 1,
            message: `${key}: Verweis „${ref}" zeigt auf keine existierende Datei.`,
          });
        }
      }
    }

    // (b) INT-### im Rumpf -> muss im Schnittstellenregister definiert sein.
    for (const m of d.doc.body.matchAll(INT_ID)) {
      if (model.definedIntIds.has(m[0])) continue;
      findings.push({
        file: d.rel,
        line: lineOf(d.doc.body, m.index) + offset,
        message: `Verweis auf ${m[0]}, aber kein solcher Eintrag in `
          + 'openspec/specs/integrations/spec.md.',
      });
    }

    // (c) Historische Anforderungs-ID im Rumpf -> muss als „(vormals <ID>)"
    //     an einem Requirement hängen.
    for (const m of d.doc.body.matchAll(REQ_ID)) {
      if (model.definedLegacyIds.has(m[0])) continue;
      findings.push({
        file: d.rel,
        line: lineOf(d.doc.body, m.index) + offset,
        message: `Verweis auf Anforderung ${m[0]}, die an keinem Requirement als `
          + '„(vormals …)" geführt wird.',
      });
    }
  }
  return dedupe(findings);
}

/**
 * Die Abschnitte „Entfallene Anforderungen …" einer Capability-Spec, jeweils
 * bis zur nächsten Überschrift gleicher Ebene.
 */
function retiredSections(body) {
  const out = [];
  const lines = body.split('\n');
  let buf = null;
  for (const line of lines) {
    if (/^## /.test(line)) {
      if (buf) { out.push(buf.join('\n')); buf = null; }
      if (/^## Entfallene Anforderungen/.test(line)) buf = [];
      continue;
    }
    if (buf) buf.push(line);
  }
  if (buf) out.push(buf.join('\n'));
  return out;
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
  {
    id: 'Keine doppelten Anforderungs-Titel im Bestand',
    vormals: 'QA-N-080',
    run: checkDuplicateTitles,
  },
  { id: 'Herkunftsnachweis ist Pflicht', vormals: 'QA-N-090', run: checkHerkunft },
  { id: 'Referenzen zeigen auf existierende Ziele', vormals: 'QA-N-110', run: checkReferences },
];
