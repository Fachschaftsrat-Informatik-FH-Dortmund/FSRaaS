import { useCallback, type ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { logError } from '@/errors/AppError';
import { AppButton, MessageView } from '@/ui/primitives';
import { useConsent } from './ConsentProvider';
import { privacyPolicy } from './privacyPolicy';

// Erststart-Gate (SHELL-F-030): Beim allerersten Start — solange keine
// Entscheidung vorliegt — wird vor dem Betreten der App die Zustimmung zur
// Datenschutzerklärung eingeholt. Danach erscheint dieser Bildschirm nicht mehr;
// eine spätere Fassungsänderung betrifft nur personenbezogene Funktionen
// (SEC-F-020, siehe <RequiresConsent>).

export function ConsentGate({ children }: { children: ReactNode }) {
  const { ready, status, accept, defer } = useConsent();
  const { t } = useTranslation();

  const openPolicy = useCallback(() => {
    Linking.openURL(privacyPolicy.url).catch((e) => logError('consent.openPolicy', e));
  }, []);

  if (!ready) return null;

  if (status === 'undecided') {
    return (
      <View style={styles.fill}>
        <MessageView
          symbol="🔒"
          title={t('consent.title')}
          body={t('consent.intro')}
          action={
            <View style={styles.actions}>
              <AppButton label={t('consent.openPolicy')} variant="secondary" onPress={openPolicy} />
              <AppButton label={t('consent.accept')} onPress={() => void accept()} />
              <AppButton label={t('consent.defer')} variant="secondary" onPress={() => void defer()} />
            </View>
          }
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  actions: { gap: 10, alignSelf: 'stretch' },
});
