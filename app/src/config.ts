// Zielsysteme ausschließlich über Konfiguration, nie fest im Quellcode
// verdrahtet (SEC-F-050). Werte kommen aus app.json -> expo.extra, überschreibbar
// per Umgebungsvariable für lokale Entwicklung und CI.

import Constants from 'expo-constants';

type Extra = {
  apiBaseUrl?: string;
  netTimeoutMs?: number;
  authIssuer?: string;
  authClientId?: string;
  authRedaktionGruppe?: string;
  authModerationGruppe?: string;
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

  /**
   * OIDC-Issuer der Authentik-Instanz (INT-012). Kein Wert = Anmeldung noch nicht
   * eingerichtet; der Verwaltungsbereich meldet dann „Anmeldung nicht verfügbar",
   * statt zu raten (SEC-F-050).
   */
  authIssuer: process.env.EXPO_PUBLIC_AUTH_ISSUER ?? extra.authIssuer ?? '',
  authClientId: process.env.EXPO_PUBLIC_AUTH_CLIENT_ID ?? extra.authClientId ?? 'fb4-app',

  /** Authentik-Gruppennamen der Verwaltungsrollen (Claim-Auswertung, IDENT-F-045). */
  authRedaktionGruppe: extra.authRedaktionGruppe ?? 'FSR-Redaktion',
  authModerationGruppe: extra.authModerationGruppe ?? 'Moderation',
} as const;

if (!/^https:\/\//.test(config.apiBaseUrl)) {
  // Alle Netzaufrufe ausschließlich über TLS (SEC-N-030). Auch die Konfiguration
  // darf das nicht unterlaufen.
  throw new Error(`config.apiBaseUrl muss https:// sein, ist "${config.apiBaseUrl}"`);
}

if (config.authIssuer && !/^https:\/\//.test(config.authIssuer)) {
  throw new Error(`config.authIssuer muss https:// sein, ist "${config.authIssuer}"`);
}
