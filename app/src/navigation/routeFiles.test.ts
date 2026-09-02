import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// SHELL-F-050: datei-basierte Navigation, wobei jede Routendatei nur auf eine
// Bildschirmkomponente des zugehörigen areas/<bereich>-Moduls verweist und keine
// Fachlogik selbst enthält. Nachweis per statischer Analyse (QA-N-115-Muster).

const ROUTES_DIR = join(__dirname, '..', '..', 'app');

function collectFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(full);
    return entry.name.endsWith('.tsx') ? [full] : [];
  });
}

const files = collectFiles(ROUTES_DIR);
const screenRoutes = files.filter((f) => !f.endsWith('_layout.tsx'));

describe('SHELL-F-050 Routendateien verweisen nur auf areas/<bereich>-Screens', () => {
  it('es gibt überhaupt datei-basierte Routen', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(screenRoutes.length).toBeGreaterThan(0);
  });

  it.each(screenRoutes.map((f) => [f.replace(ROUTES_DIR, 'app'), f] as const))(
    '%s ist ein reiner Re-Export einer areas-Bildschirmkomponente',
    (_label, file) => {
      const source = readFileSync(file, 'utf8').trim();
      const match = source.match(
        /^export \{ (\w+) as default \} from '(@\/areas\/[\w-]+\/screens\/\w+)';$/,
      );
      expect(match).not.toBeNull();
      // Keine weitere Anweisung in der Datei — kein Import, keine Funktion, kein JSX.
      expect(source.split('\n')).toHaveLength(1);
    },
  );

  it('jede referenzierte Bildschirmkomponente existiert als Datei im areas-Modul', () => {
    for (const file of screenRoutes) {
      const spec = readFileSync(file, 'utf8').match(/from '@\/areas\/([\w-/]+)'/);
      expect(spec).not.toBeNull();
      const target = join(__dirname, '..', 'areas', `${spec![1]}.tsx`);
      expect(existsSync(target)).toBe(true);
    }
  });

  it('Layout-Dateien tragen keine Bildschirm-Fachlogik (nur Navigator-Konfiguration)', () => {
    for (const file of files.filter((f) => f.endsWith('_layout.tsx'))) {
      const source = readFileSync(file, 'utf8');
      // Ein Layout bindet Tabs/Stack ein, keine areas-Screens direkt.
      expect(source).not.toMatch(/@\/areas\/[\w-]+\/screens/);
    }
  });
});

describe('UX-F-170 Jeder Bildschirm trägt einen Titel aus der Bezeichnung des Einstiegspunkts', () => {
  const tabsLayout = readFileSync(join(ROUTES_DIR, '(tabs)', '_layout.tsx'), 'utf8');
  const moreLayout = readFileSync(join(ROUTES_DIR, '(tabs)', 'more', '_layout.tsx'), 'utf8');

  it('die Tab-Layouts setzen für jeden Bildschirm einen übersetzten Titel', () => {
    for (const key of ['nav.schedule', 'nav.canteen', 'nav.news', 'nav.rooms', 'nav.more']) {
      expect(tabsLayout).toContain(`t('${key}')`);
    }
    for (const key of ['more.title', 'more.ticket', 'more.settings', 'more.admin']) {
      expect(moreLayout).toContain(`t('${key}')`);
    }
  });
});

describe('SHELL-F-080 / F-085 Tab-Stacks bleiben erhalten, aktiver Tab kehrt zur Wurzel zurück', () => {
  it('das Tab-Layout schaltet weder das Erhalten des Stacks noch den Wurzel-Rücksprung ab', () => {
    const source = readFileSync(join(ROUTES_DIR, '(tabs)', '_layout.tsx'), 'utf8');
    // Beides ist Standardverhalten des Navigators; ein Abschalten wäre explizit.
    expect(source).not.toMatch(/unmountOnBlur:\s*true/);
    expect(source).not.toMatch(/popToTopOnBlur:\s*false/);
  });
});

describe('SHELL-F-100 Einsprung über Schnellzugriff/Deep Link baut einen Rückweg auf', () => {
  it('der „Mehr"-Stack legt die Liste unter jeden tieferen Bildschirm (initialRouteName)', () => {
    const source = readFileSync(join(ROUTES_DIR, '(tabs)', 'more', '_layout.tsx'), 'utf8');
    expect(source).toMatch(/initialRouteName:\s*'index'/);
  });
});
