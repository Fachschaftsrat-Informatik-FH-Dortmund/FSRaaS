/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => () => {}),
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'de', languageTag: 'de-DE' }],
}));

// i18next synchron initialisieren, damit t() in Komponententests Klartext liefert.
const i18nMod = require('i18next');
const i18n = i18nMod.default || i18nMod;
const { initReactI18next } = require('react-i18next');
i18n.use(initReactI18next).init({
  lng: 'de',
  fallbackLng: 'de',
  resources: {
    de: { translation: require('./src/i18n/de.json') },
    en: { translation: require('./src/i18n/en.json') },
  },
  interpolation: { escapeValue: false },
});
