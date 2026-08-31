import { useCallback, type ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { logError } from '@/errors/AppError';
import { AppButton, MessageView } from '@/ui/primitives';
import { useConsent } from './ConsentProvider';
import { privacyPolicy } from './privacyPolicy';

// Sperre vor jeder Funktion mit personenbezogenen oder nutzergenerierten Daten
// (SEC-F-010). Solange die Zustimmung fehlt (zurückgestellt) oder die
// Datenschutzerklärung sich seit der Zustimmung geändert hat (SEC-F-020), wird
// statt des Inhalts eine Aufforderung zur Zustimmung angezeigt.
//
// Ab Schritt 9 (Bewertungen) und mit EKEY umschließt diese Komponente die
// jeweiligen Einstiegspunkte.

export function RequiresConsent({ children }: { children: ReactNode }) {
  const { personalDataAllowed, status, accept } = useConsent();
  const { t } = useTranslation();

  const openPolicy = useCallback(() => {
    Linking.openURL(privacyPolicy.url).catch((e) => logError('consent.openPolicy', e));
  }, []);

  if (personalDataAllowed) return <>{children}</>;

  return (
    <View style={styles.fill}>
      <MessageView
        symbol="🔒"
        title={t('consent.requiredTitle')}
        body={status === 'outdated' ? t('consent.changedIntro') : t('consent.requiredBody')}
        action={
          <View style={styles.actions}>
            <AppButton label={t('consent.openPolicy')} variant="secondary" onPress={openPolicy} />
            <AppButton label={t('consent.reviewNow')} onPress={() => void accept()} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  actions: { gap: 10, alignSelf: 'stretch' },
});
