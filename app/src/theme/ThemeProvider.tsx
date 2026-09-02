import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { logError } from '@/errors/AppError';
import {
  readAppearanceMode, writeAppearanceMode, resolveScheme, type AppearanceMode,
} from './appearanceMode';
import { colorsFor, type Scheme, type ThemeColors } from './tokens';

interface ThemeContextValue {
  /** Gespeicherte Wahl der Nutzerin. */
  mode: AppearanceMode;
  /** Tatsächlich wirksame Darstellung nach Auflösung von Wahl + Systemzustand. */
  scheme: Scheme;
  colors: ThemeColors;
  setMode: (mode: AppearanceMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // useColorScheme() ist ein abonnierender Hook: Er liefert bei jeder
  // Systemänderung während der Laufzeit den neuen Wert und löst ein Rerender aus
  // (UX-F-020) — anders als die Alt-App, die die Systemhelligkeit einmalig beim
  // Start las (main.dart:111-112).
  const system = useColorScheme();
  const [mode, setModeState] = useState<AppearanceMode>('system');
  // Eine bereits getroffene Wahl der Nutzerin darf das asynchrone Laden aus dem
  // Speicher nicht mehr überschreiben.
  const settled = useRef(false);

  useEffect(() => {
    readAppearanceMode()
      .then((stored) => {
        if (settled.current) return;
        settled.current = true;
        setModeState(stored);
      })
      .catch((error) => logError('theme.loadMode', error));
  }, []);

  const setMode = useCallback((next: AppearanceMode) => {
    settled.current = true;
    setModeState(next);
    writeAppearanceMode(next).catch((error) => logError('theme.saveMode', error));
  }, []);

  const scheme = resolveScheme(mode, system);
  const colors = colorsFor(scheme);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch((error) =>
      logError('theme.systemUi', error),
    );
  }, [colors.background]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, colors, setMode }),
    [mode, scheme, colors, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Zugriff auf das aktuelle Farbsystem. Ohne umgebenden ThemeProvider wird die
 * Systemdarstellung verwendet, damit einzeln gerenderte Komponenten (Tests,
 * Storybook) ohne Anbieter-Baum funktionieren.
 */
export function useTheme(): { scheme: Scheme; colors: ThemeColors } {
  const ctx = useContext(ThemeContext);
  const system = useColorScheme();
  if (ctx) return { scheme: ctx.scheme, colors: ctx.colors };
  const scheme = resolveScheme('system', system);
  return { scheme, colors: colorsFor(scheme) };
}

export function useAppearanceMode(): {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
} {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppearanceMode muss innerhalb von <ThemeProvider> stehen');
  return { mode: ctx.mode, setMode: ctx.setMode };
}
