import { staleTime, gcTime, untilEndOfDay, MAX_CACHE_BYTES } from './ttl';

describe('DATA-F-080 Gültigkeitsdauer je Datenart', () => {
  it('News und Raumtermine gelten 15 Minuten (data-and-storage.md Abschnitt 4)', () => {
    expect(staleTime('news')).toBe(15 * 60_000);
    expect(staleTime('raumtermine')).toBe(15 * 60_000);
  });

  it('Stammdaten, Verzeichnisse, Events und Wiki gelten einen Tag', () => {
    for (const r of ['stammdaten', 'mensaVerzeichnisse', 'events', 'wiki'] as const) {
      expect(staleTime(r)).toBe(24 * 60 * 60_000);
    }
  });

  it('Speisepläne gelten bis Tagesende', () => {
    const now = new Date('2026-08-28T20:00:00');
    expect(untilEndOfDay(now)).toBe(3 * 60 * 60_000 + 59 * 60_000 + 59_000 + 999);
    expect(staleTime('speiseplan')).toBeGreaterThan(0);
  });

  it('gcTime hält den Stand mindestens für die Offline-Anzeige vor (DATA-F-090)', () => {
    expect(gcTime('news')).toBeGreaterThanOrEqual(7 * 24 * 60 * 60_000);
  });
});

describe('DATA-N-150 Obergrenze des Zwischenspeichers', () => {
  it('das Arbeitsziel beträgt 50 MB', () => {
    expect(MAX_CACHE_BYTES).toBe(50 * 1024 * 1024);
  });
});
