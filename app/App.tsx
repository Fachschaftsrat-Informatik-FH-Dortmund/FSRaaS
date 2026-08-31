import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { initI18n } from '@/i18n';
import { Providers } from '@/state/Providers';
import { ConsentGate } from '@/consent/ConsentGate';

// App-Gerüst nach Roadmap-Schritt 1 (Querschnitt): Anbieter-Baum, Zustimmungs-
// Gate. Navigation und die eigentlichen Bereiche folgen in Schritt 2.
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <Providers>
      <ConsentGate>
        <Shell />
      </ConsentGate>
    </Providers>
  );
}

function Shell() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('app.name')}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600' },
});
