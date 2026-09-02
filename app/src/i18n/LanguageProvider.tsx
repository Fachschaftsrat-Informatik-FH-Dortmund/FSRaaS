import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';

import { logError } from '@/errors/AppError';
import i18n from './index';
import {
  readLanguagePreference, writeLanguagePreference, resolveLanguage,
  type LanguagePreference, type UiLanguage,
} from './languagePreference';

interface LanguageContextValue {
  /** Gespeicherte Wahl der Nutzerin (`system` = Systemsprache folgen). */
  preference: LanguagePreference;
  /** Tatsächlich aktive Sprache. */
  language: UiLanguage;
  setPreference: (pref: LanguagePreference) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyLanguage(pref: LanguagePreference) {
  const target = resolveLanguage(pref);
  if (i18n.language !== target) {
    i18n.changeLanguage(target).catch((error) => logError('language.change', error));
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LanguagePreference>('system');
  // Sobald die Nutzerin selbst gewählt hat, darf das (asynchrone) Laden aus dem
  // Speicher diese Wahl nicht mehr überschreiben.
  const settled = useRef(false);

  useEffect(() => {
    readLanguagePreference()
      .then((pref) => {
        if (settled.current) return;
        settled.current = true;
        setPreferenceState(pref);
        applyLanguage(pref);
      })
      .catch((error) => logError('language.load', error));
  }, []);

  const setPreference = useCallback((pref: LanguagePreference) => {
    settled.current = true;
    setPreferenceState(pref);
    // Wirkt ohne Neustart: react-i18next rendert bei `languageChanged` neu
    // (SET-F-100, Akzeptanzkriterium der Settings-Spec).
    applyLanguage(pref);
    writeLanguagePreference(pref).catch((error) => logError('language.save', error));
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ preference, language: resolveLanguage(preference), setPreference }),
    [preference, setPreference],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage muss innerhalb von <LanguageProvider> stehen');
  return ctx;
}
