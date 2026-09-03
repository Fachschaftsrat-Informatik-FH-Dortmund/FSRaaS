import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/i18n/LanguageProvider';
import { languagePreferences, type LanguagePreference } from '@/i18n/languagePreference';
import { logError } from '@/errors/AppError';
import {
  readStartView, writeStartView, startViewOptions, type StartView,
} from '@/navigation/startView';
import { useAppearanceMode, useTheme, appearanceModes, type AppearanceMode } from '@/theme';
import { RadioList, SegmentedControl } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';

// Einstellungen — Teilumfang von Roadmap-Schritt 2: Erscheinungsbild (SET-F-020),
// Oberflächensprache (SET-F-100/110) und Startansicht (SET-F-160). Alle wirken
// sofort, ohne separaten Speichern-Schritt.
export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { mode, setMode } = useAppearanceMode();
  const { preference, setPreference } = useLanguage();

  const [startView, setStartView] = useState<StartView>('schedule');
  useEffect(() => {
    readStartView().then(setStartView).catch((error) => logError('settings.startView', error));
  }, []);
  const changeStartView = (next: StartView) => {
    setStartView(next);
    writeStartView(next).catch((error) => logError('settings.startView.save', error));
  };

  const startViewLabel = (value: StartView) =>
    value === 'last' ? t('settings.startViewLast') : t(`nav.${value}`);

  return (
    <Screen scroll>
      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.text }]}>{t('settings.appearanceLabel')}</Text>
        <SegmentedControl<AppearanceMode>
          label={t('settings.appearanceLabel')}
          value={mode}
          onChange={setMode}
          options={appearanceModes.map((m) => ({ value: m, label: t(`appearance.${m}`) }))}
        />
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.text }]}>{t('settings.languageLabel')}</Text>
        <SegmentedControl<LanguagePreference>
          label={t('settings.languageLabel')}
          value={preference}
          onChange={setPreference}
          options={languagePreferences.map((p) => ({ value: p, label: t(`language.${p}`) }))}
        />
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.text }]}>{t('settings.startViewLabel')}</Text>
        <RadioList<StartView>
          label={t('settings.startViewLabel')}
          value={startView}
          onChange={changeStartView}
          options={startViewOptions.map((v) => ({ value: v, label: startViewLabel(v) }))}
        />
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.text }]}>{t('nav.canteen')}</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('settings.canteenSelection')}
          onPress={() => router.push('/canteen/auswahl')}
          style={[styles.row, { borderColor: colors.border }]}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>{t('settings.canteenSelection')}</Text>
          <Text style={[styles.rowText, { color: colors.textMuted }]}>›</Text>
        </Pressable>
      </View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('settings.moreSoon')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  rowText: { fontSize: 16 },
});
