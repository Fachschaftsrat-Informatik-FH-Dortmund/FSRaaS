import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import pkg from '../package.json';
import { navAreas, tabAreas } from './navigation/navMap';
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

describe('ARCH-N-010 Navigationsstruktur trägt mehr als die fünf Alt-Tabs ohne gleichrangige Häufung', () => {
  it('führt mehr Bereiche als Tab-Plätze und trennt sie in Tab- und „Mehr"-Gruppe', () => {
    expect(navAreas.length).toBeGreaterThan(tabAreas.length);
    expect(tabAreas.length).toBeLessThanOrEqual(5);
    expect(navAreas.some((a) => a.group === 'more')).toBe(true);
  });
});

describe('ARCH-F-140 Quellcode nach fachlichen Bereichen geschnitten', () => {
  const areasDir = join(__dirname, 'areas');

  it('jeder Bereich unter areas/ bündelt seine Bildschirme in einem eigenen Ordner', () => {
    const areas = readdirSync(areasDir, { withFileTypes: true }).filter((e) => e.isDirectory());
    expect(areas.length).toBeGreaterThan(0);
    for (const area of areas) {
      expect(existsSync(join(areasDir, area.name, 'screens'))).toBe(true);
    }
  });
});
