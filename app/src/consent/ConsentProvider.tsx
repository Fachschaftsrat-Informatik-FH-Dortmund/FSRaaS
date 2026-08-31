import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { logError } from '@/errors/AppError';
import {
  readConsent, writeConsent, statusFor, personalDataAllowed,
  type ConsentStatus,
} from './consentStore';
import { privacyPolicy } from './privacyPolicy';

interface ConsentContextValue {
  ready: boolean;
  status: ConsentStatus;
  /** Ob personenbezogene/nutzergenerierte Funktionen genutzt werden dürfen (SEC-F-010). */
  personalDataAllowed: boolean;
  policyVersion: string;
  /** Zustimmung erteilen (SEC-F-010, bzw. erneut nach Änderung SEC-F-020). */
  accept: () => Promise<void>;
  /** Zurückstellen — App bleibt mit Basisfunktionen nutzbar. */
  defer: () => Promise<void>;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<ConsentStatus>('undecided');

  useEffect(() => {
    readConsent()
      .then((record) => setStatus(statusFor(record)))
      .catch((error) => logError('consent.load', error))
      .finally(() => setReady(true));
  }, []);

  const accept = useCallback(async () => {
    await writeConsent('accepted');
    setStatus(statusFor({ decision: 'accepted', version: privacyPolicy.version, decidedAt: '' }));
  }, []);

  const defer = useCallback(async () => {
    await writeConsent('deferred');
    setStatus('deferred');
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      ready,
      status,
      personalDataAllowed: personalDataAllowed(status),
      policyVersion: privacyPolicy.version,
      accept,
      defer,
    }),
    [ready, status, accept, defer],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const value = useContext(ConsentContext);
  if (value === null) throw new Error('useConsent muss innerhalb von <ConsentProvider> stehen');
  return value;
}
