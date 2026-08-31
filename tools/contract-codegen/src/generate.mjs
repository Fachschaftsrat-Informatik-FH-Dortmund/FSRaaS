#!/usr/bin/env node
// Erzeugt Typen aus specs/platform/api-contract.yaml (API-N-035, ADR 0011):
//   - TypeScript für App und Verwaltungsoberfläche  (openapi-typescript)
//   - C#-Records für das Backend                    (dieser Emitter)
//
// Aufruf:  node src/generate.mjs            erzeugt beide Zieldateien
//          node src/generate.mjs --check    erzeugt in ein Temp-Verzeichnis und
//                                           prüft nur, dass die Erzeugung gelingt
//
// Die Zieldateien sind in .gitignore ausgenommen — sie entstehen im Build bzw.
// in der CI neu und werden nie von Hand bearbeitet.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parse } from 'yaml';
import openapiTS, { astToString } from 'openapi-typescript';

const VALUE_TYPES = new Set(['int', 'long', 'decimal', 'bool', 'Guid', 'DateTimeOffset', 'DateOnly']);

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const CONTRACT = resolve(REPO, 'specs/platform/api-contract.yaml');

const check = process.argv.includes('--check');
const outDir = check ? resolve(tmpdir(), `fb4-codegen-${Date.now()}`) : REPO;
const tsOut = resolve(outDir, check ? 'schema.ts' : 'app/src/api/generated/schema.ts');
const csOut = resolve(outDir, check ? 'Contract.cs' : 'backend/src/Fb4.Backend/Contract/Generated/Contract.cs');

// ------------------------------------------------------------------ TypeScript
const ast = await openapiTS(new URL(`file://${CONTRACT}`));
const ts = `// ERZEUGT aus specs/platform/api-contract.yaml — nicht von Hand bearbeiten (API-N-035).\n\n${astToString(ast)}`;
write(tsOut, ts);

// -------------------------------------------------------------------------- C#
const doc = parse(readFileSync(CONTRACT, 'utf8'));
write(csOut, emitCSharp(doc));

console.log(`contract-codegen: ${check ? 'Prüflauf' : 'erzeugt'} ->\n  ${tsOut}\n  ${csOut}`);

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function emitCSharp(spec) {
  const schemas = spec.components?.schemas ?? {};
  const lines = [
    '// ERZEUGT aus specs/platform/api-contract.yaml — nicht von Hand bearbeiten (API-N-035).',
    '#nullable enable',
    'using System.Text.Json.Serialization;',
    '',
    'namespace Fb4.Backend.Contract.Generated;',
    '',
  ];

  for (const [name, schema] of Object.entries(schemas)) {
    const t = name;
    if (schema.enum) {
      lines.push(`[JsonConverter(typeof(JsonStringEnumConverter))]`);
      lines.push(`public enum ${t}`);
      lines.push('{');
      for (const v of schema.enum) lines.push(`    ${enumMember(v)},`);
      lines.push('}', '');
      continue;
    }
    const merged = mergeAllOf(schema, schemas);
    const required = new Set(merged.required ?? []);
    const props = merged.properties ?? {};
    lines.push(`public record ${t}`);
    lines.push('{');
    for (const [propName, propSchema] of Object.entries(props)) {
      const optional = !required.has(propName);
      const csType = csTypeOf(propSchema, optional);
      const init = defaultFor(csType);
      // Nicht-nullbare Referenztypen ohne Initialisierer brauchen `required`,
      // sonst CS8618 (Backend baut mit TreatWarningsAsErrors).
      const needsRequired = init === '' && csType.endsWith('?') === false && !VALUE_TYPES.has(csType);
      const mod = needsRequired ? 'required ' : '';
      lines.push(`    [JsonPropertyName("${propName}")]`);
      lines.push(`    public ${mod}${csType} ${pascal(propName)} { get; init; }${init}`);
    }
    lines.push('}', '');
  }
  return lines.join('\n');
}

function mergeAllOf(schema, schemas) {
  if (!schema.allOf) return schema;
  const out = { required: [], properties: {} };
  for (const part of schema.allOf) {
    const resolved = part.$ref ? schemas[refName(part.$ref)] : part;
    const m = mergeAllOf(resolved, schemas);
    out.required.push(...(m.required ?? []));
    Object.assign(out.properties, m.properties ?? {});
  }
  return out;
}

function csTypeOf(schema, optional) {
  let nullable = optional;
  let s = schema;

  if (s.oneOf) {
    const nonNull = s.oneOf.filter((x) => !(x.type === 'null'));
    if (nonNull.length < s.oneOf.length) nullable = true;
    s = nonNull[0] ?? { type: 'string' };
  }
  if (Array.isArray(s.type)) {
    if (s.type.includes('null')) nullable = true;
    s = { ...s, type: s.type.find((x) => x !== 'null') };
  }
  if (s.$ref) return suffix(refName(s.$ref), nullable);

  switch (s.type) {
    case 'array': {
      const item = s.items ? csTypeOf(s.items, false) : 'object';
      return suffix(`IReadOnlyList<${item}>`, nullable);
    }
    case 'integer':
      return suffix(s.format === 'int64' ? 'long' : 'int', nullable);
    case 'number':
      return suffix('decimal', nullable);
    case 'boolean':
      return suffix('bool', nullable);
    case 'string':
      if (s.format === 'uuid') return suffix('Guid', nullable);
      if (s.format === 'date-time') return suffix('DateTimeOffset', nullable);
      if (s.format === 'date') return suffix('DateOnly', nullable);
      return suffix('string', nullable);
    case 'object':
    default:
      return suffix('object', nullable);
  }
}

function suffix(type, nullable) {
  return nullable ? `${type}?` : type;
}
function defaultFor(csType) {
  if (csType === 'string') return ' = string.Empty;';
  if (csType.startsWith('IReadOnlyList<') && !csType.endsWith('?')) return ' = [];';
  return '';
}
function refName(ref) {
  return ref.split('/').pop();
}
function pascal(name) {
  return name.replace(/(^|[_-])([a-z])/g, (_, __, c) => c.toUpperCase());
}
function enumMember(value) {
  const p = pascal(String(value).replace(/[^A-Za-z0-9]+/g, '-'));
  return `[JsonStringEnumMemberName("${value}")] ${p}`;
}
