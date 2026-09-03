// Kapselung der OIDC-Mechanik gegen Authentik (INT-012, ADR 0010):
// Authorization-Code-Fluss mit PKCE im Systembrowser — die App nimmt niemals
// Zugangsdaten entgegen (SEC-F-040). Diese Datei ist die einzige Stelle mit
// direktem expo-auth-session-Bezug; die übrige Anmeldelogik ist davon getrennt
// und ohne Browser testbar.

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { config } from '@/config';
import { AppError } from '@/errors/AppError';

WebBrowser.maybeCompleteAuthSession();

// `profile` liefert bei Authentik standardmäßig den `groups`-Claim (Default-
// Scope-Mapping „OpenID 'profile'"); ein eigener `groups`-Scope ist nicht nötig
// und würde bei fehlender Definition ein `invalid_scope` auslösen.
const SCOPES = ['openid', 'profile', 'email', 'offline_access'];

export const redirectUri = AuthSession.makeRedirectUri({ scheme: 'fb4', path: 'auth' });

export interface OidcTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}

export function isConfigured(): boolean {
  return Boolean(config.authIssuer);
}

async function discovery(): Promise<AuthSession.DiscoveryDocument> {
  if (!isConfigured()) {
    throw new AppError({ kind: 'auth', message: 'admin.authNotConfigured', retryable: false });
  }
  return AuthSession.fetchDiscoveryAsync(config.authIssuer);
}

function toTokens(res: AuthSession.TokenResponse): OidcTokens {
  return {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    idToken: res.idToken,
    expiresIn: res.expiresIn,
  };
}

/** Interaktive Anmeldung (öffnet den Systembrowser). */
export async function signInInteractive(): Promise<OidcTokens> {
  const d = await discovery();
  const request = new AuthSession.AuthRequest({
    clientId: config.authClientId,
    redirectUri,
    scopes: SCOPES,
    usePKCE: true,
  });
  const result = await request.promptAsync(d);
  if (result.type === 'dismiss' || result.type === 'cancel') {
    throw new AppError({ kind: 'auth', message: 'admin.signInCancelled', retryable: true });
  }
  if (result.type !== 'success' || !result.params.code) {
    throw new AppError({ kind: 'auth', message: 'admin.signInFailed', retryable: true });
  }
  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId: config.authClientId,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    d,
  );
  return toTokens(token);
}

/** IDENT-N-030: Zugriffstoken über das Refresh-Token erneuern. */
export async function refreshTokens(refreshToken: string): Promise<OidcTokens> {
  const d = await discovery();
  const token = await AuthSession.refreshAsync({ clientId: config.authClientId, refreshToken }, d);
  return toTokens(token);
}

/** IDENT-F-140: serverseitige Abmeldung beim Identitätsanbieter (RP-Initiated Logout). */
export async function endSession(idToken: string | undefined): Promise<void> {
  const d = await discovery();
  if (!d.endSessionEndpoint) return;
  const params = new URLSearchParams({
    post_logout_redirect_uri: redirectUri,
    client_id: config.authClientId,
  });
  if (idToken) params.set('id_token_hint', idToken);
  await WebBrowser.openAuthSessionAsync(`${d.endSessionEndpoint}?${params.toString()}`, redirectUri);
}
