import { useEffect, useMemo, useState } from 'react';
import { ThemeProvider as NavThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';

// Registriert die Hintergrundaufgabe für den Lieblingsgericht-Abgleich
// (MENSA-F-100). Muss beim App-Start ausgeführt werden — auch, wenn das
// Betriebssystem die App headless für die Aufgabe startet.
import '@/areas/canteen/registerBackgroundTask';
import { ConsentGate } from '@/consent/ConsentGate';
import { logError } from '@/errors/AppError';
import { initI18n } from '@/i18n';
import { readLanguagePreference, resolveLanguage } from '@/i18n/languagePreference';
import { Providers } from '@/state/Providers';
import { navigationThemeFor, ThemedStatusBar, useTheme } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Wurzel des datei-basierten Routers (SHELL-F-050). Diese Datei verdrahtet nur
// den Anbieter-Baum, das Zustimmungs-Gate und den obersten Stack — keine
// Fachlogik.

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    readLanguagePreference()
      .then((pref) => initI18n(resolveLanguage(pref)))
      .catch((error) => {
        logError('bootstrap.i18n', error);
        return initI18n();
      })
      .finally(() => setI18nReady(true));
  }, []);

  if (!i18nReady) return null;

  return (
    <Providers>
      {/* Statusleiste an das Erscheinungsbild anpassen (UX-F-220) — muss im
          Anbieter-Baum liegen, um das wirksame Schema zu kennen. */}
      <ThemedStatusBar />
      <ConsentGate>
        <RootStack />
      </ConsentGate>
    </Providers>
  );
}

function RootStack() {
  const { scheme, colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const navTheme = useMemo(() => navigationThemeFor(scheme, colors), [scheme, colors]);

  return (
    // Das Farbsystem der App auch an React Navigation geben (UX-F-020, UX-F-030):
    // ohne diese Brücke bleibt dessen Theme hell und blitzt bei Szenenübergängen
    // — etwa dem Tab-Wechsel — durch die kurz teiltransparenten Szenen durch.
    // `contentStyle` deckt zusätzlich den Stack-Grund selbst ab, wie in den
    // verschachtelten Stacks unter (tabs)/more auch.
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: reducedMotion ? 'none' : 'default', // UX-N-030
        }}
      />
    </NavThemeProvider>
  );
}
