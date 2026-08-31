// Flat-Config-Brücke für eslint-config-expo (SDK 52 liefert noch das ältere
// .eslintrc-Format). ESLint 9 selbst nutzt ausschließlich Flat Config.
const path = require('node:path');
const { FlatCompat } = require('@eslint/eslintrc');

const expoConfigDir = path.dirname(require.resolve('eslint-config-expo/package.json'));
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: expoConfigDir,
});

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'dist/**',
      'src/api/generated/**',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      'jest.setup.js',
      'eslint.config.js',
    ],
  },
  ...compat.extends('eslint-config-expo'),
  {
    rules: {
      // Fehler nie stillschweigend verschlucken (SEC-F-060): console.error ist in
      // der Fehlerschicht bewusst erlaubt, sonst aber unerwünscht.
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
];
