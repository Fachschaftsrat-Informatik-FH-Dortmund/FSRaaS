// Einlesen und Zerlegen des Spec-Bestands für die Prüfungen aus
// specs/platform/quality-and-testing.md Abschnitt 8.
//
// Bewusst ohne Fremdabhängigkeit: Das Frontmatter der Specs nutzt nur einen
// kleinen YAML-Ausschnitt (Skalare, einfache Listen), den dieser Parser abdeckt.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';

/** Requirement-ID: <PREFIX>-F-### oder <PREFIX>-N-### (README.md Abschnitt 4). */
export const REQ_ID = /\b([A-Z]{2,6})-([FN])-(\d{3})\b/g;
/** Registereintrag im Schnittstellenregister (README.md Abschnitt 4, Sonderfall INT). */
export const INT_ID = /\bINT-(\d{3})\b/g;

/** Alle .md-Dateien unter specs/, ohne die Kopiervorlagen in _templates/. */
export function listSpecFiles(specsDir) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        if (entry === '_templates') continue;
        walk(full);
      } else if (entry.endsWith('.md')) {
        out.push(full);
      }
    }
  };
  walk(specsDir);
  return out.sort();
}

/** Pfad relativ zum specs/-Wurzelverzeichnis, immer mit "/" als Trenner. */
export function relPath(specsDir, file) {
  return relative(specsDir, file).split(sep).join(posix.sep);
}

/**
 * Zerlegt eine Spec-Datei in Frontmatter-Schlüssel und Rumpf.
 * Rückgabe: { hasFrontmatter, keys:Set<string>, frontmatterEndLine, body, lines }
 */
export function readSpec(file) {
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

  const body = hasFrontmatter
    ? lines.slice(frontmatterEndLine + 1).join('\n')
    : raw;

  return { raw, lines, hasFrontmatter, keys, frontmatterEndLine, body };
}

/**
 * Liest einen einzelnen (skalaren) Frontmatter-Wert bzw. eine Listenlänge.
 * Nur für die wenigen Fälle gedacht, in denen der Wert gebraucht wird
 * (z. B. praefix). Kommentare (# ...) werden entfernt.
 */
export function frontmatterValue(spec, key) {
  if (!spec.hasFrontmatter) return undefined;
  for (let i = 1; i < spec.frontmatterEndLine; i++) {
    const line = spec.lines[i];
    const m = new RegExp(`^${key}:\\s*(.*)$`).exec(line);
    if (!m) continue;
    let v = m[1].replace(/\s+#.*$/, '').trim();
    if (v === '' || v === '[]') return v;
    return v.replace(/^["']|["']$/g, '');
  }
  return undefined;
}

/** Frontmatter-Listenwerte (z. B. related:, betrifft:) als Array von Strings. */
export function frontmatterList(spec, key) {
  if (!spec.hasFrontmatter) return [];
  const out = [];
  let inList = false;
  for (let i = 1; i < spec.frontmatterEndLine; i++) {
    const line = spec.lines[i];
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

const HERKUNFT_CELL = String.raw`(?:Alt: [^|]+|NEU|Android: unbekannt|Alt: bewusst verworfen|Recherche: [^|]+,\s*\d{4}-\d{2}-\d{2}\.?)`;

/**
 * Eine Anforderungszeile aus einer Anforderungstabelle (README.md Abschnitt 9):
 * erste Zelle ist genau eine Requirement-ID (ggf. in `Backticks` und/oder ~~durchgestrichen~~),
 * letzte Zelle trägt die Herkunftsmarkierung.
 */
export function extractRequirements(spec, relFile) {
  const out = [];
  const bodyLines = spec.body.split('\n');
  const bodyOffset = spec.hasFrontmatter ? spec.frontmatterEndLine + 2 : 1;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    if (!line.startsWith('|')) continue;
    const cells = splitRow(line);
    if (cells.length < 3) continue;

    const idCell = stripDeco(cells[0]);
    const idMatch = /^([A-Z]{2,6}-[FN]-\d{3})$/.exec(idCell);
    if (!idMatch) continue;

    const herkunftCell = stripDeco(cells[cells.length - 1]);
    const struck = /~~/.test(cells[0]);
    out.push({
      id: idMatch[1],
      herkunft: herkunftCell,
      struck,
      file: relFile,
      line: bodyOffset + i,
    });
  }
  return out;
}

export function isValidHerkunft(cell) {
  const re = new RegExp(`^${HERKUNFT_CELL}$`);
  return re.test(cell.trim());
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

/** Entfernt `Backticks` und ~~Durchstreichung~~ am Zellenrand. */
function stripDeco(cell) {
  let c = cell.trim();
  c = c.replace(/^~~/, '').replace(/~~$/, '').trim();
  c = c.replace(/^`+/, '').replace(/`+$/, '').trim();
  c = c.replace(/^~~/, '').replace(/~~$/, '').trim();
  return c;
}
