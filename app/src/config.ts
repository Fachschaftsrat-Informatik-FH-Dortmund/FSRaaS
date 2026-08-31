// Zielsysteme ausschließlich über Konfiguration, nie fest im Quellcode
// verdrahtet (SEC-F-050). Werte kommen aus app.json -> expo.extra, überschreibbar
// per Umgebungsvariable für lokale Entwicklung und CI.

import Constants from 'expo-constants';

type Extra = {
  apiBaseUrl?: string;
  netTimeoutMs?: number;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const config = {
  /** Basis-URL des eigenen Backends (INT-008). */
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    extra.apiBaseUrl ??
    'https://api.fsrfb4.de/v1',

  /**
   * Zeitgrenze für einen einzelnen Netzabruf (NFR-F-070). Nach Ablauf wird der
   * Abruf abgebrochen und ein wiederholbarer Fehler gemeldet.
   */
  netTimeoutMs: Number(process.env.EXPO_PUBLIC_NET_TIMEOUT_MS ?? extra.netTimeoutMs ?? 10_000),
} as const;

if (!/^https:\/\//.test(config.apiBaseUrl)) {
  // Alle Netzaufrufe ausschließlich über TLS (SEC-N-030). Auch die Konfiguration
  // darf das nicht unterlaufen.
  throw new Error(`config.apiBaseUrl muss https:// sein, ist "${config.apiBaseUrl}"`);
}
