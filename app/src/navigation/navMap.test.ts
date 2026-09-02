import { navAreas, tabAreas, moreAreas, moreAreasByGroup, stepsToReach } from './navMap';

describe('SHELL-F-010 Tab-Leiste plus Sammel-Einstieg „Mehr" statt gleichrangiger Häufung', () => {
  it('teilt die Bereiche in eine Tab-Gruppe und eine „Mehr"-Gruppe', () => {
    expect(tabAreas.length).toBeGreaterThan(0);
    expect(moreAreas.length).toBeGreaterThan(0);
    expect(new Set(navAreas.map((a) => a.group))).toEqual(new Set(['tab', 'more']));
  });

  it('häuft nicht alle Bereiche als gleichrangige Tab-Einträge (Alt: bewusst verworfen)', () => {
    // Die Alt-App zeigte fünf gleichrangige Tabs; hier liegen mehr Bereiche vor
    // als Tab-Plätze.
    expect(navAreas.length).toBeGreaterThan(tabAreas.length);
  });
});

describe('SHELL-F-060 Tab-Leiste mit genau Stundenplan, Mensaplan, News, Raumsuche', () => {
  it('besetzt die Tab-Leiste mit genau diesen vier Bereichen in dieser Reihenfolge', () => {
    expect(tabAreas.map((a) => a.key)).toEqual(['schedule', 'canteen', 'news', 'rooms']);
  });

  it('führt alle übrigen Bereiche ausschließlich unter „Mehr"', () => {
    expect(moreAreas.map((a) => a.key).sort()).toEqual(['admin', 'settings', 'ticket']);
  });
});

describe('SHELL-F-090 „Mehr" als nach Themen gruppierte Liste ohne ausgegraute Einträge', () => {
  it('liefert die „Mehr"-Bereiche nach Themengruppe', () => {
    const sections = moreAreasByGroup();
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.flatMap((s) => s.areas.map((a) => a.key)).sort()).toEqual(
      ['admin', 'settings', 'ticket'],
    );
  });

  it('lässt leere Gruppen (nur Ausbaustufe-2-Bereiche) ganz weg statt sie ausgegraut zu zeigen', () => {
    const groups = moreAreasByGroup().map((s) => s.group);
    expect(groups).not.toContain('fachschaft'); // Events/Helfer/Wiki: erst Ausbaustufe 2
    for (const section of moreAreasByGroup()) {
      expect(section.areas.length).toBeGreaterThan(0);
    }
  });

  it('jeder „Mehr"-Bereich trägt genau eine Themengruppe', () => {
    for (const area of moreAreas) {
      expect(area.moreGroup).toBeDefined();
    }
  });
});

describe('SHELL-F-020 Jedes Kernfeature in höchstens zwei Interaktionsschritten erreichbar', () => {
  it('kein Bereich liegt mehr als zwei Schritte von der Startseite entfernt', () => {
    for (const area of navAreas) {
      expect(stepsToReach(area)).toBeLessThanOrEqual(2);
    }
  });

  it('die vier Kernfeatures der ersten Ausbaustufe sind einen Schritt entfernt', () => {
    for (const key of ['schedule', 'canteen', 'news', 'rooms']) {
      const area = navAreas.find((a) => a.key === key);
      expect(area && stepsToReach(area)).toBe(1);
    }
  });
});
