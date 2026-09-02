import { resolveStartTab, tabHref, isStartView, startViewOptions } from './startView';
import { tabKeyFromPath } from './useStartView';

describe('SHELL-F-070 Regulärer Start öffnet die konfigurierte Startansicht, sonst den Stundenplan', () => {
  it('öffnet den konfigurierten Tab-Bereich', () => {
    expect(resolveStartTab('news', 'schedule')).toBe('news');
    expect(resolveStartTab('rooms', 'schedule')).toBe('rooms');
  });

  it('öffnet ohne abweichende Konfiguration den Stundenplan', () => {
    expect(resolveStartTab('schedule', 'schedule')).toBe('schedule');
  });

  it('jede Startansicht löst zu einer vorhandenen Route auf', () => {
    for (const view of startViewOptions) {
      const target = resolveStartTab(view, 'canteen');
      expect(typeof tabHref(target)).toBe('string');
      expect(tabHref(target).startsWith('/')).toBe(true);
    }
  });
});

describe('SET-F-160 Wahl der Startansicht inklusive „zuletzt genutzt"', () => {
  it('bietet die vier Tab-Bereiche und „zuletzt genutzt" an', () => {
    expect([...startViewOptions]).toEqual(['schedule', 'canteen', 'news', 'rooms', 'last']);
  });

  it('„zuletzt genutzt" öffnet den zuletzt aktiven Tab', () => {
    expect(resolveStartTab('last', 'rooms')).toBe('rooms');
    expect(resolveStartTab('last', 'more')).toBe('more');
  });

  it('verwirft unbekannte gespeicherte Werte', () => {
    expect(isStartView('dashboard')).toBe(false);
    expect(isStartView('schedule')).toBe(true);
    expect(isStartView('last')).toBe(true);
  });

  it('leitet den zuletzt aktiven Tab aus dem Pfad ab', () => {
    expect(tabKeyFromPath('/')).toBe('schedule');
    expect(tabKeyFromPath('/canteen')).toBe('canteen');
    expect(tabKeyFromPath('/more')).toBe('more');
    expect(tabKeyFromPath('/more/ticket')).toBe('more');
  });
});
