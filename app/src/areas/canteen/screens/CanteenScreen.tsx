import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

import { useConsent } from '@/consent/ConsentProvider';
import { logError } from '@/errors/AppError';
import { readJson, writeJson } from '@/storage/kv';
import { useTheme } from '@/theme';
import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { AsyncStates } from '@/ui/state/AsyncStates';
import { useMensen, useSpeiseplan, type Gericht, type Mensa, type Speiseplan } from '../api';
import { useFavorites } from '../favorites';
import {
  benachrichtigungBerechtigungAnfragen,
  benachrichtigungErlaubt,
} from '../notifications';
import {
  fuehreLieblingsgerichtAbgleichAus,
  lieblingsgerichtAbgleichRegistrieren,
  nachholenBeimAppStart,
} from '../registerBackgroundTask';
import { useCanteenSelection } from '../selection';

// MENSA: Tages-Speiseplan der gewählten Mensen mit Blättern über benachbarte
// Tage (MENSA-F-045), einer Mensa je Ansicht mit Wechsler (MENSA-F-010, „zwischen
// ihnen wechseln"), Lieblingsgericht-Markierung (MENSA-F-080) und Hervorhebung
// heute verfügbarer Lieblingsgerichte (Abschnitt 7).

const AKTIVE_MENSA_KEY = 'lastViewedCanteen';

function isoHeute(): string {
  return new Date().toISOString().slice(0, 10);
}

function verschiebe(datum: string, tage: number): string {
  const [y, m, d] = datum.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d! + tage);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function CanteenScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { ids, loaded } = useCanteenSelection();
  const { mensen } = useMensen();
  const [datum, setDatum] = useState(isoHeute);
  const [aktiv, setAktiv] = useState<string | null>(null);

  useEffect(() => {
    void nachholenBeimAppStart();
  }, []);

  // Aktive Mensa: gemerkte Wahl, sonst die erste der Auswahl (MENSA-F-010).
  useEffect(() => {
    if (!loaded || ids.length === 0) return;
    readJson<string>(AKTIVE_MENSA_KEY, '')
      .then((gemerkt) => setAktiv(ids.includes(gemerkt) ? gemerkt : ids[0]!))
      .catch(() => setAktiv(ids[0]!));
  }, [loaded, ids]);

  const waehleMensa = (id: string) => {
    setAktiv(id);
    writeJson(AKTIVE_MENSA_KEY, id).catch((error) => logError('canteen.lastViewed', error));
  };

  if (!loaded) {
    return (
      <Screen center>
        <MessageView busy title={t('states.loading')} />
      </Screen>
    );
  }

  if (ids.length === 0) {
    return (
      <Screen center>
        <MessageView
          symbol="—"
          title={t('mensa.keineMensaTitel')}
          body={t('mensa.keineMensaHinweis')}
          action={
            <AppButton
              label={t('mensa.mensenWaehlen')}
              onPress={() => router.push('/canteen/auswahl')}
            />
          }
        />
      </Screen>
    );
  }

  const aktiveMensa = mensen.find((m) => m.id === aktiv);

  return (
    <Screen>
      <View style={styles.kopf}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mensa.tagZurueck')}
          onPress={() => setDatum((d) => verschiebe(d, -1))}
          style={styles.pfeil}
        >
          <Text style={[styles.pfeilGlyph, { color: colors.text }]}>◀</Text>
        </Pressable>
        <Text style={[styles.datum, { color: colors.text }]}>{formatDatum(datum, t)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mensa.tagVor')}
          onPress={() => setDatum((d) => verschiebe(d, 1))}
          style={styles.pfeil}
        >
          <Text style={[styles.pfeilGlyph, { color: colors.text }]}>▶</Text>
        </Pressable>
      </View>

      {ids.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.wechsler}
          accessibilityRole="tablist"
        >
          {ids.map((id) => {
            const name = mensen.find((m) => m.id === id)?.name ?? id;
            const on = id === aktiv;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={name}
                onPress={() => waehleMensa(id)}
                style={[
                  styles.chip,
                  { borderColor: colors.border },
                  on && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? colors.onAccent : colors.text }]}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {aktiv ? <MensaAbschnitt mensaId={aktiv} mensa={aktiveMensa} datum={datum} /> : null}
    </Screen>
  );
}

function MensaAbschnitt({
  mensaId,
  mensa,
  datum,
}: {
  mensaId: string;
  mensa: Mensa | undefined;
  datum: string;
}) {
  const { t } = useTranslation();
  const query = useSpeiseplan(mensaId, datum);

  return (
    <AsyncStates<Speiseplan>
      query={query}
      isEmpty={(d) => d.gerichte.length === 0}
      emptyTitle={t('mensa.keinAngebotTitel')}
      emptyNextStep={t('mensa.keinAngebotHinweis')}
    >
      {(plan) => <GerichtListe plan={plan} mensa={mensa} datum={datum} />}
    </AsyncStates>
  );
}

function GerichtListe({
  plan,
  mensa,
  datum,
}: {
  plan: Speiseplan;
  mensa: Mensa | undefined;
  datum: string;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const favorites = useFavorites();
  const consent = useConsent();

  const oeffnung = oeffnungszeitFuer(mensa, datum);
  const gruppen = useMemo(() => gruppiere(plan.gerichte), [plan.gerichte]);

  async function markiere(gericht: Gericht) {
    if (!consent.personalDataAllowed) {
      Alert.alert(t('consent.requiredTitle'), t('consent.requiredBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('consent.reviewNow'), onPress: () => void consent.accept() },
      ]);
      return;
    }

    const wirdMarkiert = !favorites.has(gericht.schluessel);
    favorites.toggle({ schluessel: gericht.schluessel, bezeichnung: gericht.bezeichnung });

    if (wirdMarkiert) {
      // SEC-F-080: Benachrichtigungs-Berechtigung erst jetzt anfragen.
      const schonErlaubt = await benachrichtigungErlaubt();
      const erlaubt = schonErlaubt || (await benachrichtigungBerechtigungAnfragen());
      if (!erlaubt) {
        Alert.alert(t('mensa.benachrichtigungAusTitel'), t('mensa.benachrichtigungAusHinweis'));
      } else {
        await lieblingsgerichtAbgleichRegistrieren();
        void fuehreLieblingsgerichtAbgleichAus();
      }
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.liste}>
      {oeffnung ? (
        <Text style={[styles.oeffnung, { color: colors.textMuted }]}>
          {t('mensa.oeffnungszeit', { zeit: oeffnung })}
        </Text>
      ) : null}

      {gruppen.map(({ kategorie, gerichte }) => (
        <View key={kategorie} style={styles.gruppe}>
          <Text style={[styles.gruppeTitel, { color: colors.textMuted }]}>{kategorie}</Text>
          {gerichte.map((g, i) => {
            const favorit = favorites.has(g.schluessel);
            return (
              <View
                key={`${g.schluessel}-${i}`}
                style={[
                  styles.karte,
                  { borderColor: colors.border },
                  favorit && { borderColor: colors.accent, backgroundColor: colors.surface },
                ]}
              >
                <View style={styles.kartekopf}>
                  <Text style={[styles.bezeichnung, { color: colors.text }]}>{g.bezeichnung}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: favorit }}
                    accessibilityLabel={
                      favorit ? t('mensa.lieblingEntfernen') : t('mensa.lieblingMarkieren')
                    }
                    onPress={() => void markiere(g)}
                    style={styles.stern}
                  >
                    <Text style={{ color: favorit ? colors.accent : colors.textMuted, fontSize: 20 }}>
                      {favorit ? '★' : '☆'}
                    </Text>
                  </Pressable>
                </View>

                {g.kennzeichnungen && g.kennzeichnungen.length > 0 ? (
                  <Text style={[styles.kennzeichnungen, { color: colors.textMuted }]}>
                    {g.kennzeichnungen.join(' · ')}
                  </Text>
                ) : null}

                <Text style={[styles.preise, { color: colors.text }]}>
                  {preisZeile(g, t)}
                </Text>

                {g.zusatzstoffe && g.zusatzstoffe.length > 0 ? (
                  <Text style={[styles.zusatzstoffe, { color: colors.textMuted }]}>
                    {t('mensa.zusatzstoffe', { liste: g.zusatzstoffe.join(', ') })}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

// -------------------------------------------------------------------- Helfer

/** MENSA-F-040: Beilagen als eigene Kategorie, ans Ende gestellt. */
function gruppiere(gerichte: Gericht[]): { kategorie: string; gerichte: Gericht[] }[] {
  const map = new Map<string, Gericht[]>();
  for (const g of gerichte) {
    const k = g.kategorie || '—';
    const arr = map.get(k);
    if (arr) arr.push(g);
    else map.set(k, [g]);
  }
  const istBeilage = (k: string) => /beilag/i.test(k);
  return [...map.entries()]
    .map(([kategorie, gs]) => ({ kategorie, gerichte: gs }))
    .sort((a, b) => Number(istBeilage(a.kategorie)) - Number(istBeilage(b.kategorie)));
}

function preisZeile(g: Gericht, t: TFunction): string {
  const fmt = (n: number | null | undefined) =>
    n == null ? '–' : `${n.toFixed(2).replace('.', ',')} €`;
  return t('mensa.preise', {
    studierende: fmt(g.preisStudierende),
    mitarbeitende: fmt(g.preisMitarbeitende),
    gaeste: fmt(g.preisGaeste),
  });
}

function oeffnungszeitFuer(mensa: Mensa | undefined, datum: string): string | null {
  const zeiten = mensa?.oeffnungszeiten;
  if (!zeiten || zeiten.length < 5) return null;
  const [y, m, d] = datum.split('-').map(Number);
  const wochentag = new Date(y!, m! - 1, d!).getDay(); // 0 So … 6 Sa
  if (wochentag === 0 || wochentag === 6) return null;
  return zeiten[wochentag - 1] ?? null;
}

function formatDatum(datum: string, t: TFunction): string {
  const [y, m, d] = datum.split('-').map(Number);
  const wd = new Date(y!, m! - 1, d!).getDay();
  return `${t(`mensa.weekday.${wd}`)}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
}

const styles = StyleSheet.create({
  kopf: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pfeil: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pfeilGlyph: { fontSize: 18 },
  datum: { fontSize: 16, fontWeight: '600' },
  wechsler: { gap: 8, paddingVertical: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, minHeight: 36, justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '600' },
  liste: { gap: 16, paddingBottom: 24 },
  oeffnung: { fontSize: 13 },
  gruppe: { gap: 8 },
  gruppeTitel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  karte: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  kartekopf: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  bezeichnung: { fontSize: 15, fontWeight: '600', flex: 1 },
  stern: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  kennzeichnungen: { fontSize: 13 },
  preise: { fontSize: 14 },
  zusatzstoffe: { fontSize: 12 },
});
