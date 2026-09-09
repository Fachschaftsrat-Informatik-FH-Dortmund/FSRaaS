import { SCHEDULE_NEUTRAL, SCHEDULE_PALETTE } from '@/theme/tokens';
import { anzeigeFarbe, farbeFuerVeranstaltung, kontrastZuHintergrund, textfarbeFuerHintergrund } from './farbe';
import type { CustomPlanEntry } from './typen';

function eintrag(color: string, farbeVonNutzer?: boolean): CustomPlanEntry {
  return {
    kind: 'eigen',
    id: 'a',
    title: 'a',
    deaktiviertBis: null,
    color,
    weekday: 'Mon',
    timeBeginMin: 540,
    timeEndMin: 600,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    wiederkehrend: true,
    ...(farbeVonNutzer === undefined ? {} : { farbeVonNutzer }),
  };
}

// Prüfprotokoll 2026-09-09, Abschnitt 3: Der Schalter wirkte bislang nur auf
// neu angelegte Einträge, weil die Farbe beim Anlegen fest hineingeschrieben
// wurde. Ein bestehender Plan blieb bunt.
describe('Farbwahl je Termin: Abschalten der Automatik wirkt auf den bestehenden Plan', () => {
  it('zeigt einen automatisch eingefärbten Termin bei abgeschalteter Automatik in der neutralen Fläche', () => {
    const automatisch = farbeFuerVeranstaltung('42012');
    expect(anzeigeFarbe(eintrag(automatisch), true)).toBe(automatisch);
    expect(anzeigeFarbe(eintrag(automatisch), false)).toBe(SCHEDULE_NEUTRAL);
  });

  it('behält eine von der Nutzerin gewählte Farbe, auch wenn die Automatik danach abgeschaltet wird', () => {
    const eigene = SCHEDULE_PALETTE[2]!;
    expect(anzeigeFarbe(eintrag(eigene, true), true)).toBe(eigene);
    expect(anzeigeFarbe(eintrag(eigene, true), false)).toBe(eigene);
  });

  it('behandelt einen gespeicherten Eintrag ohne Herkunftsvermerk als automatisch eingefärbt', () => {
    expect(anzeigeFarbe(eintrag('#123456'), false)).toBe(SCHEDULE_NEUTRAL);
  });

  it('ist umkehrbar: nach dem Wiedereinschalten erscheint die automatische Farbe erneut', () => {
    const automatisch = farbeFuerVeranstaltung('42012');
    const e = eintrag(automatisch, false);
    expect(anzeigeFarbe(e, false)).toBe(SCHEDULE_NEUTRAL);
    expect(anzeigeFarbe(e, true)).toBe(automatisch);
  });
});

describe('Herkunft der Terminfarbe', () => {
  it('behält einen gespeicherten Eintrag ohne Herkunftsvermerk und behandelt ihn als automatisch eingefärbt', () => {
    const ohneVermerk = eintrag('#123456');
    expect(ohneVermerk.farbeVonNutzer).toBeUndefined();
    expect(anzeigeFarbe(ohneVermerk, true)).toBe('#123456');
    expect(anzeigeFarbe(ohneVermerk, false)).toBe(SCHEDULE_NEUTRAL);
  });
});

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
