import { quickActionTargets } from './quickActions';
import { navAreas } from './navMap';

// SHELL-F-040: OS-Schnellzugriffe auf mindestens Stundenplan und Semesterticket.
// Die native Registrierung selbst ist geräteabhängig (Prüfprotokoll); hier wird
// die Ziel-Zuordnung geprüft.

describe('SHELL-F-040 Betriebssystem-Schnellzugriffe auf Stundenplan und Semesterticket', () => {
  it('bietet einen Schnellzugriff auf den Stundenplan', () => {
    const schedule = quickActionTargets.find((t) => t.id === 'schedule');
    expect(schedule?.href).toBe('/');
    expect(schedule?.titleKey).toBe('nav.schedule');
  });

  it('bietet einen Schnellzugriff auf das Semesterticket', () => {
    const ticket = quickActionTargets.find((t) => t.id === 'ticket');
    expect(ticket?.href).toBe('/more/ticket');
    expect(ticket?.titleKey).toBe('more.ticket');
  });

  it('jeder Schnellzugriff zeigt auf eine tatsächlich vorhandene Route', () => {
    const hrefs = new Set(navAreas.map((a) => a.href));
    for (const target of quickActionTargets) {
      expect(hrefs.has(target.href)).toBe(true);
    }
  });
});
