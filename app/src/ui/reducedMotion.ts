import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { logError } from '@/errors/AppError';

// UX-N-030: Die Systemeinstellung „Bewegung reduzieren" respektieren.

export type StackAnimation = 'default' | 'none';

/** Übergangsanimation je nach Reduzieren-Einstellung. */
export function motionAnimation(reduced: boolean): StackAnimation {
  return reduced ? 'none' : 'default';
}

/**
 * Abonniert `AccessibilityInfo.isReduceMotionEnabled`; liefert bei jeder
 * Systemänderung den neuen Wert. Fehler beim Lesen werden protokolliert, nicht
 * verschluckt (SEC-F-060), und als „nicht reduziert" behandelt.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch((error) => logError('a11y.reduceMotion', error));

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
