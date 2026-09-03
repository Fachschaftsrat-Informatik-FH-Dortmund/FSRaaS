import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/auth/AuthProvider';
import { MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

// ADMIN-F-010 / ADMIN-F-020 (App-Seite): die Unterseiten der Verwaltung sind nur
// mit mindestens einer Verwaltungsrolle erreichbar. Ein direkt aufgerufener Pfad
// (Deep Link) ohne Rolle führt zurück auf den Verwaltungs-Einstieg, der die
// Anmeldung bzw. den Hinweis „Kein Zugriff" zeigt. Die serverseitige Ablehnung
// bleibt die eigentliche Schutzmaßnahme (ADMIN-F-010).
export function AdminGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { status, roles } = useAuth();

  if (status === 'loading') {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (status !== 'signed-in' || roles.length === 0) {
    return <Redirect href="/more/admin" />;
  }

  return <>{children}</>;
}
