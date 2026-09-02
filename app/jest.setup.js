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
  getLocales: jest.fn(() => [{ languageCode: 'de', languageTag: 'de-DE' }]),
}));

jest.mock('expo-system-ui', () => ({
  setBackgroundColorAsync: jest.fn(() => Promise.resolve()),
}));

// AccessibilityInfo: „Bewegung reduzieren" standardmäßig aus, überschreibbar.
jest.spyOn(require('react-native').AccessibilityInfo, 'isReduceMotionEnabled')
  .mockResolvedValue(false);
jest.spyOn(require('react-native').AccessibilityInfo, 'addEventListener')
  .mockReturnValue({ remove: jest.fn() });

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// Navigations- und Schnellzugriffs-Module haben nativen Anteil, der im
// Jest-Umfeld nicht existiert. Route-Dateien selbst sind reine Re-Exporte
// (SHELL-F-050) und werden nicht über den Router getestet.
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const passthrough = ({ children }) => children ?? null;
  return {
    __esModule: true,
    Link: ({ children, href, asChild, ...rest }) =>
      asChild ? children : React.createElement(Text, rest, children),
    Stack: Object.assign(passthrough, { Screen: () => null }),
    Tabs: Object.assign(passthrough, { Screen: () => null }),
    Slot: passthrough,
    Redirect: () => null,
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    usePathname: () => '/',
  };
});

jest.mock('expo-quick-actions', () => ({
  __esModule: true,
  setItems: jest.fn(() => Promise.resolve()),
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  isSupported: jest.fn(() => Promise.resolve(true)),
  initial: undefined,
  maxCount: 4,
}));

jest.mock('expo-quick-actions/router', () => ({
  __esModule: true,
  useQuickActionRouting: jest.fn(),
  isRouterAction: jest.fn(() => true),
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
  compatibilityJSON: 'v3',
});
