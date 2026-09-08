import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';

// MENSA-F-016 / F-017 / F-019: Ankernavigation nach Vorbild gängiger Liefer-Apps.
// Eine waagerechte Chip-Leiste über einer langen, nach Mensa-Abschnitten
// gegliederten Liste. Antippen eines Chips scrollt zum Abschnitt (F-017); beim
// manuellen Scrollen markiert die Leiste den Abschnitt, der gerade oben im
// sichtbaren Bereich steht (F-019). Wiederverwendet von Haupt- und Alle-Mensen-
// Ansicht.

const ANKER_OFFSET = 12; // kleine Toleranz, damit der Wechsel „beim Erreichen" greift
const SPY_PAUSE_MS = 650; // nach einem Chip-Tipp die Scroll-Erkennung kurz aussetzen

export interface AnkerChip {
  id: string;
  titel: string;
  /** Kein zugehöriger Abschnitt (z. B. geschlossene Mensa, MENSA-F-295) — nicht auswählbar. */
  deaktiviert?: boolean;
}

export interface AnkerAbschnitt {
  id: string;
  inhalt: ReactNode;
}

export function AnkerListe({
  chips,
  abschnitte,
  fuss,
  contentContainerStyle,
  scrollProps,
}: {
  chips: AnkerChip[];
  abschnitte: AnkerAbschnitt[];
  fuss?: ReactNode;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  scrollProps?: Partial<ScrollViewProps>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const chipScrollRef = useRef<ScrollView>(null);
  const yRef = useRef<Record<string, number>>({});
  const chipXRef = useRef<Record<string, number>>({});
  const pauseBis = useRef(0);
  const [aktiv, setAktiv] = useState<string | null>(null);

  const abschnittIds = abschnitte.map((a) => a.id);
  const aktivEffektiv =
    aktiv && abschnittIds.includes(aktiv) ? aktiv : (abschnittIds[0] ?? null);

  // Aktiven Chip in den sichtbaren Bereich der Leiste rollen.
  useEffect(() => {
    if (!aktivEffektiv) return;
    const x = chipXRef.current[aktivEffektiv];
    if (x != null) chipScrollRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
  }, [aktivEffektiv]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollProps?.onScroll?.(e);
    if (Date.now() < pauseBis.current) return;
    const y = e.nativeEvent.contentOffset.y;
    let aktuell = abschnittIds[0] ?? null;
    for (const id of abschnittIds) {
      const sy = yRef.current[id];
      if (sy != null && sy - ANKER_OFFSET <= y) aktuell = id;
    }
    if (aktuell && aktuell !== aktivEffektiv) setAktiv(aktuell);
  };

  const zumAbschnitt = (id: string) => {
    setAktiv(id);
    pauseBis.current = Date.now() + SPY_PAUSE_MS;
    const y = yRef.current[id];
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - ANKER_OFFSET), animated: true });
    }
  };

  return (
    <View style={styles.flex}>
      {chips.length > 1 ? (
        <ScrollView
          ref={chipScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipBox}
          contentContainerStyle={styles.chipInhalt}
          accessibilityRole="tablist"
        >
          {chips.map((c) => {
            const on = c.id === aktivEffektiv && !c.deaktiviert;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on, disabled: c.deaktiviert }}
                accessibilityLabel={
                  c.deaktiviert ? t('mensa.chipGeschlossen', { mensa: c.titel }) : c.titel
                }
                disabled={c.deaktiviert}
                onPress={() => zumAbschnitt(c.id)}
                onLayout={(e) => {
                  chipXRef.current[c.id] = e.nativeEvent.layout.x;
                }}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  on && { backgroundColor: colors.accent, borderColor: colors.accent },
                  c.deaktiviert && styles.chipZu,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: on
                        ? colors.onAccent
                        : c.deaktiviert
                          ? colors.textMuted
                          : colors.text,
                    },
                  ]}
                >
                  {c.titel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <ScrollView
        {...scrollProps}
        ref={scrollRef}
        contentContainerStyle={contentContainerStyle}
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {abschnitte.map((a) => (
          <View
            key={a.id}
            onLayout={(e) => {
              yRef.current[a.id] = e.nativeEvent.layout.y;
            }}
          >
            {a.inhalt}
          </View>
        ))}
        {fuss}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chipBox: { flexGrow: 0, flexShrink: 0, marginBottom: 8 },
  chipInhalt: { gap: 8, paddingVertical: 2, alignItems: 'center' },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'center',
  },
  chipZu: { opacity: 0.5 },
  chipText: { fontSize: 13, fontWeight: '600' },
});
