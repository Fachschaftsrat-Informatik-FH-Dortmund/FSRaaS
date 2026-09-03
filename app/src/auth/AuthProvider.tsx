import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';

import { logError } from '@/errors/AppError';
import type { AdminRole } from './claims';
import { decodeJwt, displayNameFromClaims, rolesFromClaims } from './claims';
import * as oidc from './oidc';
import { needsRefresh, sessionFromTokenResponse, type StoredSession } from './session';
import { clearSession, loadSession, saveSession } from './tokenStore';

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in' | 'unavailable';

export interface AuthValue {
  status: AuthStatus;
  roles: AdminRole[];
  displayName?: string;
  /** Öffnet den Systembrowser für die Anmeldung (SEC-F-040). */
  signIn: () => Promise<void>;
  /** Lokales Entfernen (DATA-F-130) und serverseitige Abmeldung (IDENT-F-140). */
  signOut: () => Promise<void>;
  /** Gültiges Zugriffstoken, bei Bedarf erneuert (IDENT-N-030); null wenn nicht angemeldet. */
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthValue | null>(null);

function derive(session: StoredSession | null) {
  const claims = decodeJwt(session?.idToken ?? session?.accessToken);
  return {
    roles: session ? rolesFromClaims(claims) : [],
    displayName: session ? displayNameFromClaims(claims) : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    oidc.isConfigured() ? 'loading' : 'unavailable',
  );
  // Verhindert parallele Erneuerungen desselben Refresh-Tokens.
  const refreshing = useRef<Promise<StoredSession | null> | null>(null);

  useEffect(() => {
    if (!oidc.isConfigured()) return;
    let aktiv = true;
    loadSession()
      .then((s) => {
        if (!aktiv) return;
        setSession(s);
        setStatus(s ? 'signed-in' : 'signed-out');
      })
      .catch((error) => {
        if (!aktiv) return;
        logError('auth.load', error);
        setStatus('signed-out');
      });
    return () => {
      aktiv = false;
    };
  }, []);

  const persist = useCallback(async (s: StoredSession | null) => {
    setSession(s);
    setStatus(s ? 'signed-in' : 'signed-out');
    if (s) await saveSession(s);
    else await clearSession();
  }, []);

  const signIn = useCallback(async () => {
    const tokens = await oidc.signInInteractive();
    await persist(sessionFromTokenResponse(tokens));
  }, [persist]);

  const signOut = useCallback(async () => {
    const current = session;
    await persist(null);
    try {
      await oidc.endSession(current?.idToken);
    } catch (error) {
      // Die lokale Abmeldung ist bereits erfolgt; die serverseitige darf sie
      // nicht rückgängig machen, aber der Fehler wird protokolliert (SEC-F-060).
      logError('auth.endSession', error);
    }
  }, [persist, session]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!session) return null;
    if (!needsRefresh(session)) return session.accessToken;
    if (!session.refreshToken) {
      await persist(null);
      return null;
    }
    if (!refreshing.current) {
      refreshing.current = (async () => {
        try {
          const tokens = await oidc.refreshTokens(session.refreshToken!);
          const next = sessionFromTokenResponse(tokens);
          await persist(next);
          return next;
        } catch (error) {
          logError('auth.refresh', error);
          await persist(null);
          return null;
        } finally {
          refreshing.current = null;
        }
      })();
    }
    const next = await refreshing.current;
    return next?.accessToken ?? null;
  }, [session, persist]);

  const value = useMemo<AuthValue>(() => {
    const { roles, displayName } = derive(session);
    return { status, roles, displayName, signIn, signOut, getAccessToken };
  }, [status, session, signIn, signOut, getAccessToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> stehen.');
  return ctx;
}

/** ADMIN-F-020: trägt das angemeldete Konto mindestens eine Verwaltungsrolle? */
export function useHasAdminRole(): boolean {
  return useAuth().roles.length > 0;
}
