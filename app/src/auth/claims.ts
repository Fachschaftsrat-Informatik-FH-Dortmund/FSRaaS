// Auswertung der Token-Claims: Anzeigename und Verwaltungsrollen.
// Rollen kommen als Authentik-Gruppen-Claim (IDENT-F-045, API-F-250); die App
// führt keine eigene Rollenliste.

import { config } from '@/config';

export type AdminRole = 'fsr-redaktion' | 'moderation';

export interface TokenClaims {
  sub?: string;
  preferred_username?: string;
  name?: string;
  email?: string;
  groups?: unknown;
  [key: string]: unknown;
}

/** Dekodiert die Nutzlast eines JWT ohne Signaturprüfung (die macht das Backend). */
export function decodeJwt(token: string | undefined): TokenClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  const raw = parts[1];
  if (!raw) return null;
  try {
    const payload = raw.replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob === 'function'
        ? atob(payload)
        : Buffer.from(payload, 'base64').toString('binary');
    return JSON.parse(json) as TokenClaims;
  } catch {
    // Kein stiller Fehler nach außen (SEC-F-060): ein unlesbares Token führt zu
    // „nicht angemeldet", die aufrufende Schicht behandelt das.
    return null;
  }
}

function groupList(claims: TokenClaims | null): string[] {
  const g = claims?.groups;
  if (Array.isArray(g)) return g.filter((x): x is string => typeof x === 'string');
  if (typeof g === 'string') return [g];
  return [];
}

/** ADMIN-F-020 / ADMIN-F-010 (App-Seite): welche Verwaltungsrollen trägt das Konto? */
export function rolesFromClaims(claims: TokenClaims | null): AdminRole[] {
  const groups = new Set(groupList(claims));
  const roles: AdminRole[] = [];
  if (groups.has(config.authRedaktionGruppe)) roles.push('fsr-redaktion');
  if (groups.has(config.authModerationGruppe)) roles.push('moderation');
  return roles;
}

export function hasAnyAdminRole(claims: TokenClaims | null): boolean {
  return rolesFromClaims(claims).length > 0;
}

export function displayNameFromClaims(claims: TokenClaims | null): string | undefined {
  return claims?.name ?? claims?.preferred_username ?? claims?.email ?? undefined;
}
