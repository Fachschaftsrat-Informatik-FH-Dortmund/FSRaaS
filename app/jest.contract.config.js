// Eigene Jest-Konfiguration für die Vertragstests gegen echte Fremdsysteme
// (Requirement „Vertragstest gegen Fremdsysteme", `openspec/specs/quality-and-testing/spec.md`).
// Getrennt von `jest.config.js`, damit `npm test` (Standardsuite, CI) ohne
// Netzzugriff reproduzierbar bleibt (NFR-N-170/210); Aufruf ausdrücklich über
// `npm run test:contract`.
/** @type {import('jest').Config} */
const basis = require('./jest.config');

module.exports = {
  ...basis,
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  testMatch: ['**/*.contract.test.ts'],
  // Live-Abrufe gegen ein Hochschulsystem ohne bekanntes SLA (integrations.md)
  // brauchen mehr Zeit als die 20s der Standardsuite.
  testTimeout: 30000,
};
