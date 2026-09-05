// Einlesen und Zerlegen des Anforderungsbestands für die Prüfungen aus
// openspec/specs/quality-and-testing/spec.md, Abschnitt „Prüfungen am
// Anforderungsbestand selbst".
//
// Seit ADR 0019 liegt der fachliche Bestand unter `openspec/specs/` in
// OpenSpec-Form (`### Requirement:` + `#### Scenario:`), die Entscheidungen und
// Produkt-/Prozessdokumente weiterhin unter `specs/` mit YAML-Frontmatter.
// Beide Bäume werden gelesen: `openspec/specs/` definiert Anforderungen,
// `specs/` verweist auf sie.
//
// Bewusst ohne Fremdabhängigkeit: Das Frontmatter der `specs/`-Dokumente nutzt
// nur einen kleinen YAML-Ausschnitt (Skalare, einfache Listen), den dieser
// Parser abdeckt.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';

/** Historische Anforderungs-ID: <PREFIX>-F-### oder <PREFIX>-N-### (ADR 0019). */
export const REQ_ID = /\b([A-Z]{2,6})-([FN])-(\d{3})\b/g;
/** Registereintrag im Schnittstellenregister (Sonderfall INT). */
export const INT_ID = /\bINT-(\d{3})\b/g;

/**
 * Die fünf zulässigen Herkunftsmuster (specs/README.md Abschnitt 6), geprüft
 * als Präfix der Herkunftsangabe.
 *
 * Bewusst kein einzelner Ausdruck über die ganze Angabe: Quellenangaben
 * enthalten Punkte (`wiki.fsrfb4.de`, `TimetableApi.java`), und hinter der
 * Markierung darf erläuternder Fließtext stehen — ein Muster, das an der
 * Satzgrenze endet, schneidet beides falsch ab. Reihenfolge ist bedeutsam:
 * „Alt: bewusst verworfen" muss vor „Alt: <pfad>" stehen, sonst schluckt das
 * allgemeinere Muster den Sonderfall.
 */
const HERKUNFT_PATTERNS = [
  /^Alt: bewusst verworfen\b/,
  /^NEU\b/,
  /^Android: unbekannt\b/,
  /^Recherche: .+?,\s*\d{4}-\d{2}-\d{2}\b/,
  /^Alt: \S+/,
];

/** Alle .md-Dateien unter dir, ohne Kopiervorlagen und Archiv. */
export function listMarkdownFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) {
        if (entry === '_templates' || entry === 'archive') continue;
        walk(full);
      } else if (entry.endsWith('.md')) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out.sort();
}

/** Pfad relativ zur Repo-Wurzel, immer mit "/" als Trenner. */
export function relPath(root, file) {
  return relative(root, file).split(sep).join(posix.sep);
}

/**
 * Zerlegt eine Markdown-Datei in Frontmatter-Schlüssel und Rumpf.
 * OpenSpec-Specs haben kein Frontmatter; dann ist body === raw.
 */
export function readDoc(file) {
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);
  const keys = new Set();
  let hasFrontmatter = false;
  let frontmatterEndLine = 0;

  if (lines[0]?.trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        hasFrontmatter = true;
        frontmatterEndLine = i;
        break;
      }
      const m = /^([A-Za-z_][A-Za-z0-9_]*):/.exec(lines[i]);
      if (m) keys.add(m[1]);
    }
  }

  const body = hasFrontmatter ? lines.slice(frontmatterEndLine + 1).join('\n') : raw;
  return { raw, lines, hasFrontmatter, keys, frontmatterEndLine, body };
}

/** Zeilenversatz des Rumpfes gegenüber der Datei (1-basiert). */
export function bodyOffset(doc) {
  return doc.hasFrontmatter ? doc.frontmatterEndLine + 2 : 1;
}

/** Frontmatter-Listenwerte (z. B. related:, betrifft:) als Array von Strings. */
export function frontmatterList(doc, key) {
  if (!doc.hasFrontmatter) return [];
  const out = [];
  let inList = false;
  for (let i = 1; i < doc.frontmatterEndLine; i++) {
    const line = doc.lines[i];
    if (inList) {
      const item = /^\s+-\s+(.*)$/.exec(line);
      if (item) {
        out.push(item[1].replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, ''));
        continue;
      }
      if (/^\S/.test(line)) inList = false;
    }
    if (new RegExp(`^${key}:\\s*$`).test(line.replace(/\s+#.*$/, '').trimEnd())) {
      inList = true;
    }
  }
  return out;
}

/**
 * Zerlegt eine OpenSpec-`spec.md` in ihre Requirements.
 *
 * Ein Requirement beginnt mit `### Requirement: <Titel>` und reicht bis zur
 * nächsten Überschrift der Ebene 1–3. Nur der Text bis zum ersten
 * `#### Scenario:` trägt die Herkunftsmarkierung.
 */
export function extractRequirements(doc, relFile) {
  const out = [];
  const lines = doc.body.split('\n');
  const offset = bodyOffset(doc);

  let current = null;
  const close = () => {
    if (!current) return;
    // Nur der Requirement-Text zählt, nicht die Scenario-Blöcke darunter.
    const head = current.textLines.join('\n').split(/^#### /m)[0];
    // Die Herkunftsangabe ist alles ab „Herkunft:" bis zum Zeilenende; welcher
    // Teil davon die Markierung ist, entscheidet isValidHerkunft().
    const m = /Herkunft:\s*([^\n]*)/.exec(head);
    out.push({
      title: current.title,
      text: head,
      herkunftCount: (head.match(/Herkunft:/g) || []).length,
      herkunft: m ? m[1].trim() : null,
      legacyIds: [...head.matchAll(/vormals\s+([A-Z]{2,6}-[FN]-\d{3})/g)].map((x) => x[1]),
      file: relFile,
      line: current.line,
    });
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^### Requirement:\s*(.+?)\s*$/.exec(line);
    if (m) {
      close();
      current = { title: m[1], line: offset + i, textLines: [] };
      continue;
    }
    if (current && /^#{1,3} /.test(line)) {
      close();
      continue;
    }
    if (current) current.textLines.push(line);
  }
  close();
  return out;
}

/** Prüft, ob eine Herkunftsangabe mit einem der fünf zulässigen Muster beginnt. */
export function isValidHerkunft(herkunft) {
  if (!herkunft) return false;
  const s = herkunft.trim();
  return HERKUNFT_PATTERNS.some((re) => re.test(s));
}
