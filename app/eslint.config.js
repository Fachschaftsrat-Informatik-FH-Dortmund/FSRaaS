const expoConfig = require('eslint-config-expo/flat');

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
  ...expoConfig,
  {
    rules: {
      // Fehler nie stillschweigend verschlucken (SEC-F-060): console.error ist in
      // der Fehlerschicht bewusst erlaubt, sonst aber unerwünscht.
      'no-console': ['warn', { allow: ['error', 'warn'] }],

      // eslint-config-expo 57 bringt neue, auf den React Compiler vorbereitende
      // Hooks-Regeln mit, die vorher nicht existierten. Sie schlagen an rund
      // zehn Stellen quer durchs Projekt an (Date.now()/Refs/Komponenten
      // während des Renderns, setState in Effekten). Ein Teil davon ist
      // begründeter Bestandscode (z. B. eine Ref-Mutation in einem
      // Event-Handler, keine Render-Unreinheit), ein Teil echte Nacharbeit.
      // Beides verdient eine eigene, pro Fundstelle geprüfte Änderung statt
      // einer Blindkorrektur im Zuge dieses Abhängigkeits-Updates — deshalb
      // hier auf Warnung statt Fehler, nicht abgeschaltet. Nacharbeit: siehe
      // verlinktes Issue.
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/globals': 'warn',
    },
  },
];
