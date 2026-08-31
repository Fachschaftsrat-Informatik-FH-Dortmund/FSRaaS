import { describeAge, shouldShowAge } from './dataAge';

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
