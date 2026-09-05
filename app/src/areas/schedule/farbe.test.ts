import { SCHEDULE_PALETTE } from '@/theme/tokens';
import { farbeFuerVeranstaltung, kontrastZuHintergrund, textfarbeFuerHintergrund } from './farbe';

describe('SCHED-F-660 deterministische Farbvergabe je Veranstaltung', () => {
  it('liefert für denselben Schlüssel bei jedem Aufruf dieselbe Farbe', () => {
    expect(farbeFuerVeranstaltung('42012')).toBe(farbeFuerVeranstaltung('42012'));
    expect(farbeFuerVeranstaltung('Lern- und Arbeitstechniken')).toBe(
      farbeFuerVeranstaltung('Lern- und Arbeitstechniken'),
    );
  });

  it('liefert für unterschiedliche Schlüssel typischerweise unterschiedliche Farben', () => {
    const farben = new Set(
      ['42012', '42099', 'WFPB-1', 'INPBPI', 'X', 'Y', 'Z'].map((schluessel) => farbeFuerVeranstaltung(schluessel)),
    );
    expect(farben.size).toBeGreaterThan(1);
  });

  it('vergibt ausschließlich Farben aus der Palette', () => {
    for (const schluessel of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
      expect(SCHEDULE_PALETTE).toContain(farbeFuerVeranstaltung(schluessel));
    }
  });
});

describe('UX-F-040 Textfarbe wird aus der Hintergrundhelligkeit abgeleitet', () => {
  it('wählt Weiß auf einem dunklen Hintergrund', () => {
    expect(textfarbeFuerHintergrund('#000000')).toBe('#FFFFFF');
  });

  it('wählt Schwarz auf einem hellen Hintergrund', () => {
    expect(textfarbeFuerHintergrund('#FFFFFF')).toBe('#000000');
  });
});

describe('UX-N-010 Mindestkontrast 4,5:1 zwischen Text- und Hintergrundfarbe', () => {
  it('erreicht für jede Palettenfarbe mindestens den geforderten Kontrast', () => {
    for (const hintergrund of SCHEDULE_PALETTE) {
      const text = textfarbeFuerHintergrund(hintergrund);
      expect(kontrastZuHintergrund(text, hintergrund)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('erreicht den Mindestkontrast auch für einen mittelgrauen Grenzfall-Hintergrund', () => {
    const grenzfall = '#767676'; // nahe der WCAG-Kontrast-Kreuzung Schwarz/Weiß
    const text = textfarbeFuerHintergrund(grenzfall);
    expect(kontrastZuHintergrund(text, grenzfall)).toBeGreaterThanOrEqual(4.5);
  });
});
