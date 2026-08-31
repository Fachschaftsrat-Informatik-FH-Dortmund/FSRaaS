import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';

// Netzstatus reaktiv. Speist sich aus demselben onlineManager, den TanStack
// Query für Pausieren/Fortsetzen nutzt (ADR 0013); die Verdrahtung mit NetInfo
// geschieht einmalig in state/queryClient.ts.

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true,
  );
}
