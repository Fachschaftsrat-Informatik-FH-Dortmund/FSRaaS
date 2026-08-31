// Oberflächensprache Deutsch und Englisch von Anfang an (NFR-F-115).
// Keine Zeichenkette fest im Code — jede sichtbare Zeichenkette kommt aus den
// Katalogen de.json / en.json.
//
// Datums-, Zeit- und Währungsformate bleiben deutscher Konvention, unabhängig
// von der gewählten Sprache (NFR-F-120) — das gehört in die Formatierungsschicht,
// nicht hierher.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import de from './de.json';
import en from './en.json';

export const resources = {
  de: { translation: de },
  en: { translation: en },
} as const;

export const supportedLanguages = Object.keys(resources) as (keyof typeof resources)[];

export const fallbackLanguage: keyof typeof resources = 'de';

/** Erste vom System bevorzugte unterstützte Sprache, sonst der Rückfallwert. */
export function deviceLanguage(): keyof typeof resources {
  for (const locale of getLocales()) {
    const code = locale.languageCode as keyof typeof resources | null;
    if (code && supportedLanguages.includes(code)) return code;
  }
  return fallbackLanguage;
}

export function initI18n(language?: keyof typeof resources) {
  return i18n.use(initReactI18next).init({
    resources,
    lng: language ?? deviceLanguage(),
    fallbackLng: fallbackLanguage,
    interpolation: { escapeValue: false },
    returnNull: false,
    // Hermes (React Native) hat kein vollständiges Intl.PluralRules. Die Kataloge
    // nutzen ausschließlich {{count}} ohne Plural-Suffixe, daher ist das ältere
    // v3-Pluralformat ausreichend und vermeidet die Laufzeit-Fehlermeldung.
    compatibilityJSON: 'v3',
  });
}

export default i18n;
