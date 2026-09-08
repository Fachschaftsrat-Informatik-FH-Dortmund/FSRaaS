/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // React-Native-Komponententests mit kaltem Modulgraph brauchen mehr als die
  // Standard-5s, besonders unter paralleler Last.
  testTimeout: 20000,
  // Vertragstests (`*.contract.test.ts`, Requirement „Vertragstest gegen
  // Fremdsysteme") rufen echte Fremdsysteme über das Netz auf und laufen
  // deshalb nicht in dieser Standardsuite (Reproduzierbarkeit des Builds,
  // NFR-N-170/210) — eigenes Kommando `npm run test:contract`.
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '\\.contract\\.test\\.ts$'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|i18next|react-i18next|@tanstack/.*))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
