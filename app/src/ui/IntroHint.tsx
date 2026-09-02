import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import { useTheme } from '@/theme';

// UX-F-190: Höchstens ein schließbarer Einführungshinweis je Bereich, danach nie
// wieder. Der Zustand liegt lokal unter `introSeen:<bereich>`.

function key(area: string) {
  return `introSeen:${area}`;
}

export function useIntroHint(area: string): { visible: boolean; dismiss: () => void } {
  const [state, setState] = useState<'loading' | 'visible' | 'hidden'>('loading');

  useEffect(() => {
    let active = true;
    readJson<boolean>(key(area), false)
      .then((seen) => {
        if (active) setState(seen ? 'hidden' : 'visible');
      })
      .catch((error) => {
        logError('introHint.load', error);
        if (active) setState('visible');
      });
    return () => {
      active = false;
    };
  }, [area]);

  const dismiss = useCallback(() => {
    setState('hidden');
    writeJson(key(area), true).catch((error) => logError('introHint.save', error));
  }, [area]);

  return { visible: state === 'visible', dismiss };
}

/**
 * Einzeiliger, schließbarer Einführungshinweis. Rendert nichts, solange der
 * Hinweis für diesen Bereich bereits geschlossen wurde.
 */
export function IntroHint({ area, text }: { area: string; text: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { visible, dismiss } = useIntroHint(area);

  if (!visible) return null;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{text}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.dismissHint')}
        onPress={dismiss}
        style={styles.close}
      >
        <Text style={[styles.closeGlyph, { color: colors.textMuted }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingLeft: 12,
  },
  text: { flex: 1, fontSize: 13, paddingVertical: 10 },
  close: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  closeGlyph: { fontSize: 15 },
});
