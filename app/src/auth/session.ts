// Sitzungsmerkmal (Token-Satz) der Anmeldung gegen Authentik (INT-012).
// Reine Datenform und Lebenszyklus-Regeln — UI- und speicherfrei testbar.

export interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  /** Ablaufzeitpunkt des Zugriffstokens als Unix-Millisekunden. */
  expiresAt: number;
}

/** Sicherheitsabstand vor dem echten Ablauf, in dem schon erneuert wird. */
export const REFRESH_SKEW_MS = 60_000;

export function isExpired(session: StoredSession, now: number = Date.now()): boolean {
  return now >= session.expiresAt;
}

/**
 * IDENT-N-030: kurzlebige Zugriffstoken werden über das Refresh-Token erneuert,
 * nicht bis zum Ablauf unverändert vorgehalten. Hier: erneuern, sobald weniger
 * als {@link REFRESH_SKEW_MS} bis zum Ablauf bleiben.
 */
export function needsRefresh(session: StoredSession, now: number = Date.now()): boolean {
  return now >= session.expiresAt - REFRESH_SKEW_MS;
}

/** Baut ein {@link StoredSession} aus einer OIDC-Token-Antwort. */
export function sessionFromTokenResponse(
  res: { accessToken: string; refreshToken?: string; idToken?: string; expiresIn?: number },
  now: number = Date.now(),
): StoredSession {
  return {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    idToken: res.idToken,
    expiresAt: now + (res.expiresIn ?? 300) * 1000,
  };
}
