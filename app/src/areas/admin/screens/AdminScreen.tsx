import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/auth/AuthProvider';
import { AppError } from '@/errors/AppError';
import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

// Einstieg in die Verwaltung (SHELL-F-060). Der Bereich ist nur mit
// Verwaltungsrolle nutzbar (ADMIN-F-020); die serverseitige Ablehnung ist die
// eigentliche Schutzmaßnahme (ADMIN-F-010). Derselbe Funktionsumfang steht in
// der App und im Web-Export (ADMIN-F-030) — dieselbe Codebasis.

const SEKTIONEN = [
  { key: 'rollen', href: '/more/admin/rollen', rolle: 'fsr-redaktion' as const },
  { key: 'stammdaten', href: '/more/admin/stammdaten', rolle: 'fsr-redaktion' as const },
  { key: 'laufwege', href: '/more/admin/laufwege', rolle: 'fsr-redaktion' as const },
];

export function AdminScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { status, roles, displayName, signIn, signOut } = useAuth();
  const [fehler, setFehler] = useState<string | null>(null);
  const [beschaeftigt, setBeschaeftigt] = useState(false);

  if (status === 'unavailable') {
    return (
      <Screen center>
        <MessageView
          symbol="🔒"
          title={t('admin.authNotConfigured')}
          body={t('admin.authNotConfiguredBody')}
        />
      </Screen>
    );
  }

  if (status === 'loading') {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (status === 'signed-out') {
    return (
      <Screen center>
        <MessageView
          symbol="🔑"
          title={t('admin.signInPrompt')}
          body={t('admin.signInBody')}
          action={
            <AppButton
              label={t('admin.signIn')}
              onPress={async () => {
                setFehler(null);
                setBeschaeftigt(true);
                try {
                  await signIn();
                } catch (error) {
                  setFehler(AppError.from(error).message);
                } finally {
                  setBeschaeftigt(false);
                }
              }}
              disabled={beschaeftigt}
            />
          }
        />
        {fehler ? <Text style={[styles.fehler, { color: colors.danger }]}>{t(fehler)}</Text> : null}
      </Screen>
    );
  }

  // Angemeldet.
  if (roles.length === 0) {
    return (
      <Screen center>
        <MessageView symbol="⛔" title={t('admin.noRole')} body={t('admin.noRoleBody')} />
        <AppButton label={t('admin.signOut')} variant="secondary" onPress={() => void signOut()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={[styles.begruessung, { color: colors.textMuted }]}>
        {t('admin.signedInAs', { name: displayName ?? '—' })}
      </Text>
      {SEKTIONEN.map((s) => (
        <Link
          key={s.key}
          href={s.href}
          accessibilityRole="link"
          style={[styles.zeile, { color: colors.text, borderBottomColor: colors.border }]}
        >
          {t(`admin.sections.${s.key}`)}
        </Link>
      ))}
      <View style={styles.abmelden}>
        <AppButton label={t('admin.signOut')} variant="secondary" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  begruessung: { fontSize: 14 },
  zeile: { minHeight: 44, paddingVertical: 14, fontSize: 17, borderBottomWidth: StyleSheet.hairlineWidth },
  abmelden: { marginTop: 24, alignItems: 'flex-start' },
  fehler: { fontSize: 14, textAlign: 'center', marginTop: 12 },
});
