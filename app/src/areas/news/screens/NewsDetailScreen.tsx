import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton, MessageView } from '@/ui/primitives';
import { Screen } from '@/ui/Screen';
import { useAngepinnt } from '../angepinnt';
import { useMeldungen } from '../api';
import { MeldungInhalt, PinSchalter } from '../ui/MeldungBausteine';

// Requirement „Detailansicht einer Meldung": vollständiger Text mit demselben
// Bedienweg zum Anpinnen wie in der Liste. Ohne eigenen Abruf — die Meldung
// kommt aus dem geladenen Bestand oder aus den angepinnten Kopien (design.md D6).

export function NewsDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { meldungId } = useLocalSearchParams<{ meldungId?: string }>();
  const query = useMeldungen();
  const { pins, istAngepinnt, umschalten } = useAngepinnt();

  const pin = pins.find((p) => p.meldung.id === meldungId);
  const meldung =
    query.data?.meldungen.find((m) => m.id === meldungId) ?? (pin && !pin.zurueckgezogen ? pin.meldung : undefined);

  if (!meldung) {
    return (
      <Screen center>
        <MessageView
          symbol="?"
          title={t(pin?.zurueckgezogen ? 'news.zurueckgezogen' : 'news.detail.nichtVerfuegbarTitel')}
          body={t(pin?.zurueckgezogen ? 'news.zurueckgezogenHinweis' : 'news.detail.nichtVerfuegbarHinweis')}
          action={<AppButton label={t('news.detail.zurListe')} variant="secondary" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll tight>
      <MeldungInhalt meldung={meldung} />
      <View style={styles.aktionen}>
        <PinSchalter
          angepinnt={istAngepinnt(meldung.id)}
          titel={meldung.titel}
          onPress={() => umschalten(meldung)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  aktionen: { flexDirection: 'row', marginTop: 8 },
});
