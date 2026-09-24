import { describeAge, quelleVeraltet, shouldShowAge } from './dataAge';

describe('DATA-F-090 Sichtbarer Altershinweis auf zwischengespeicherte Daten', () => {
  const now = new Date('2026-08-28T12:00:00').getTime();

  it('beschreibt das Alter relativ', () => {
    expect(describeAge(now - 30_000, now)).toEqual({ key: 'dataAge.justNow', count: 0 });
    expect(describeAge(now - 5 * 60_000, now)).toEqual({ key: 'dataAge.minutesAgo', count: 5 });
    expect(describeAge(now - 3 * 60 * 60_000, now)).toEqual({ key: 'dataAge.hoursAgo', count: 3 });
    expect(describeAge(now - 2 * 24 * 60 * 60_000, now)).toEqual({ key: 'dataAge.daysAgo', count: 2 });
  });

  it('zeigt den Hinweis nur bei vorhandenen Daten, offline und abgelaufen', () => {
    expect(shouldShowAge({ hasData: true, isOffline: true, isStale: true })).toBe(true);
    expect(shouldShowAge({ hasData: true, isOffline: false, isStale: true })).toBe(false);
    expect(shouldShowAge({ hasData: true, isOffline: true, isStale: false })).toBe(false);
    expect(shouldShowAge({ hasData: false, isOffline: true, isStale: true })).toBe(false);
  });
});

describe('Altershinweis bei veralteten Daten der Mensa-Schnittstelle', () => {
  const now = new Date('2026-09-24T12:00:00Z').getTime();
  const TAG = 24 * 60 * 60_000;

  it('meldet einen Stand als veraltet, der älter ist als sein Höchstalter', () => {
    // Die Messung vom 2026-09-22 fand 6,7 Tage alte Speisepläne, während der
    // Zustandsendpunkt der Quelle weiterhin `ok` meldete.
    const vorSiebenTagen = new Date(now - 7 * TAG).toISOString();
    expect(quelleVeraltet({ quelleStand: vorSiebenTagen, maxAlterMs: TAG, now })).toBe(true);
  });

  it('meldet einen Stand innerhalb des Höchstalters nicht als veraltet', () => {
    const vorZweiStunden = new Date(now - 2 * 60 * 60_000).toISOString();
    expect(quelleVeraltet({ quelleStand: vorZweiStunden, maxAlterMs: TAG, now })).toBe(false);
  });

  it('hängt nicht am Netzzustand — geprüft wird allein der gemeldete Stand', () => {
    // Gegenprobe zu `shouldShowAge`: dort ist `isOffline` Bedingung, hier nicht.
    const vorZweiTagen = new Date(now - 2 * TAG).toISOString();
    expect(quelleVeraltet({ quelleStand: vorZweiTagen, maxAlterMs: TAG, now })).toBe(true);
    expect(shouldShowAge({ hasData: true, isOffline: false, isStale: true })).toBe(false);
  });

  it('wertet eine fehlende oder unlesbare Angabe nicht als Befund', () => {
    expect(quelleVeraltet({ quelleStand: null, maxAlterMs: TAG, now })).toBe(false);
    expect(quelleVeraltet({ quelleStand: undefined, maxAlterMs: TAG, now })).toBe(false);
    expect(quelleVeraltet({ quelleStand: 'kein Datum', maxAlterMs: TAG, now })).toBe(false);
  });
});
