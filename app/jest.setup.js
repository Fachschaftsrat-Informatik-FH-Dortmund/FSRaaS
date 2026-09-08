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

// Requirement „Erfassung von Uhrzeit und Datum über systemeigene Auswahl":
// beide Pakete haben nativen Anteil, der im Jest-Umfeld fehlt. Der Ersatz
// reicht alle Props unverändert durch — ein Test löst eine Wahl über
// `fireEvent(getByTestId(id), 'onChange', event, date)` bzw.
// `fireEvent(getByTestId(id), 'valueChange', wert)` aus, wie es die
// tatsächlichen Bibliotheken als Callback aufrufen.
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: (props) => React.createElement(View, props) };
});

jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const Picker = (props) => React.createElement(View, props, props.children);
  Picker.Item = (props) => React.createElement(Text, {}, props.label);
  return { __esModule: true, Picker };
});

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
    useLocalSearchParams: () => ({}),
  };
});

// @expo/vector-icons lädt beim Rendern die Icon-Schrift über expo-font, dessen
// nativer Anteil im Jest-Umfeld fehlt. Für Tests genügt ein schlichter Ersatz,
// der den Symbolnamen als Text ausgibt (so bleiben Icons per getByText prüfbar).
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name, ...rest }) => React.createElement(Text, rest, name);
  Icon.font = {};
  Icon.loadFont = () => Promise.resolve();
  return new Proxy(
    { __esModule: true },
    { get: (target, prop) => (prop in target ? target[prop] : Icon) },
  );
});

jest.mock('expo-font', () => ({
  __esModule: true,
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('expo-secure-store', () => ({
  __esModule: true,
  WHEN_UNLOCKED: 'whenUnlocked',
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-web-browser', () => ({
  __esModule: true,
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'dismiss' })),
}));

jest.mock('expo-auth-session', () => ({
  __esModule: true,
  makeRedirectUri: jest.fn(() => 'fb4://auth'),
  fetchDiscoveryAsync: jest.fn(() => Promise.resolve({ endSessionEndpoint: undefined })),
  exchangeCodeAsync: jest.fn(),
  refreshAsync: jest.fn(),
  AuthRequest: class {
    codeVerifier = 'verifier';
    promptAsync = jest.fn(() => Promise.resolve({ type: 'dismiss' }));
  },
}));

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

// Lieblingsgericht-Benachrichtigung (MENSA-F-100): lokale Benachrichtigungen und
// Hintergrund-Weckruf haben nativen Anteil.
jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(() => Promise.resolve('lieblingsgerichte')),
    requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
    getNotificationSettings: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
    displayNotification: jest.fn(() => Promise.resolve('id')),
  },
  AndroidImportance: { DEFAULT: 3 },
  AuthorizationStatus: { DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 },
}));

jest.mock('expo-task-manager', () => ({
  __esModule: true,
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(() => Promise.resolve(false)),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-background-fetch', () => ({
  __esModule: true,
  registerTaskAsync: jest.fn(() => Promise.resolve()),
  unregisterTaskAsync: jest.fn(() => Promise.resolve()),
  BackgroundFetchResult: { NoData: 1, NewData: 2, Failed: 3 },
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
