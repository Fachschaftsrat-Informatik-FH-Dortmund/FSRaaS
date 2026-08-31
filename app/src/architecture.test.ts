import pkg from '../package.json';
import { createQueryClient, queryPersister, persistMaxAge } from './state/queryClient';

// Architektur-Constraints, die sich nicht sinnvoll als Verhaltenstest prüfen
// lassen und deshalb per statischer Analyse nachgewiesen werden (QA-N-115).

describe('ARCH-N-030 Bildschirm-lokaler UI-Zustand nie als app-weite Store-Instanz', () => {
  it('bindet keine globale State-Management-Bibliothek ein', () => {
    const banned = [
      'redux', '@reduxjs/toolkit', 'react-redux', 'zustand', 'mobx',
      'mobx-react', 'mobx-react-lite', 'jotai', 'recoil', 'valtio',
      'effector', 'easy-peasy', 'rematch', '@xstate/store',
    ];
    const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;
    expect(banned.filter((name) => name in deps)).toEqual([]);
  });
});

describe('ARCH-F-150 Server-Zustand über eine dedizierte Schicht mit Cache, Aktualisierung, Invalidierung', () => {
  it('die Server-State-Schicht ist eine eigene TanStack-Query-Schicht, getrennt vom UI-Code', () => {
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@tanstack/react-query']).toBeDefined();
    expect(deps['@tanstack/react-query-persist-client']).toBeDefined();
    expect(deps['@tanstack/query-async-storage-persister']).toBeDefined();
  });

  it('der QueryClient konfiguriert Aufbewahrung, Aktualisierung und Wiederholung zentral', () => {
    const queries = createQueryClient().getDefaultOptions().queries ?? {};
    expect(typeof queries.staleTime).toBe('number'); // Aktualisierungsstrategie
    expect(typeof queries.gcTime).toBe('number'); // Cache-Aufbewahrung
    expect(typeof queries.retry).toBe('function'); // Wiederholung/Invalidierung zentral
    expect(queryPersister).toBeDefined(); // Persistenz über Neustart
    expect(persistMaxAge).toBeGreaterThan(0);
  });
});
