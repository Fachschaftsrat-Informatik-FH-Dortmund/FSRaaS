import { zeitstempel } from './zeitstempel';

describe('24-Stunden-Zeitformat für Zeitstempel', () => {
  it('Nachmittagszeit korrekt ausgewertet: 14:30 Uhr bleibt 14:30, nicht vormittags', () => {
    // Ortszeit-Angabe ohne Zone: wird in der Zeitzone des Geräts ausgewertet.
    expect(zeitstempel('2026-08-24T14:30:00')).toBe('24.08.2026, 14:30');
  });

  it('ISO-Zeitpunkt mit Zone wird in Ortszeit des Geräts dargestellt', () => {
    const roh = '2026-08-24T12:05:00Z';
    const d = new Date(roh);
    const erwartet = `${String(d.getHours()).padStart(2, '0')}:05`;
    expect(zeitstempel(roh)).toMatch(new RegExp(`, ${erwartet}$`));
  });

  it('Meldung mit unlesbarem Zeitstempel: kein Wert statt Fehler', () => {
    expect(zeitstempel('24.08.2026 - 14:30:00 Uhr?')).toBeNull();
    expect(zeitstempel(null)).toBeNull();
    expect(zeitstempel(undefined)).toBeNull();
    expect(zeitstempel('')).toBeNull();
  });
});
