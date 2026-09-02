import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';

import { ConsentGate } from '@/consent/ConsentGate';
import { logError } from '@/errors/AppError';
import { initI18n } from '@/i18n';
import { readLanguagePreference, resolveLanguage } from '@/i18n/languagePreference';
import { Providers } from '@/state/Providers';
import { ThemedStatusBar } from '@/theme';
import { useReducedMotion } from '@/ui/reducedMotion';

// Wurzel des datei-basierten Routers (SHELL-F-050). Diese Datei verdrahtet nur
// den Anbieter-Baum, das Zustimmungs-Gate und den obersten Stack — keine
// Fachlogik.

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readLanguagePreference()
      .then((pref) => initI18n(resolveLanguage(pref)))
      .catch((error) => {
        logError('bootstrap.i18n', error);
        return initI18n();
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

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
  const reducedMotion = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? 'none' : 'default', // UX-N-030
      }}
    />
  );
}
