import { Text } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import i18n from '@/i18n';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { readJson, clearAll } from '@/storage/kv';
import { ThemeProvider, useTheme } from '@/theme';
import { SettingsScreen } from './SettingsScreen';

beforeEach(async () => {
  await clearAll();
  await i18n.changeLanguage('de');
});

afterEach(async () => {
  await i18n.changeLanguage('de');
});

function SchemeProbe() {
  const { scheme } = useTheme();
  return <Text>probe:{scheme}</Text>;
}

function Harness() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SchemeProbe />
        <SettingsScreen />
      </LanguageProvider>
    </ThemeProvider>
  );
}

describe('SET-F-020 Wahl zwischen hellem, dunklem und systemabhängigem Erscheinungsbild', () => {
  it('bietet genau die drei Optionen an', () => {
    render(<Harness />);
    expect(screen.getByRole('radio', { name: 'System' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Hell' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Dunkel' })).toBeTruthy();
  });

  it('wirkt sofort und wird persistent gespeichert', async () => {
    render(<Harness />);
    expect(screen.getByText('probe:light')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'Dunkel' }));

    await waitFor(() => expect(screen.getByText('probe:dark')).toBeTruthy());
    expect(await readJson('appearanceMode', 'system')).toBe('dark');
  });
});

describe('SET-F-160 Wahl der Startansicht inklusive „zuletzt genutzt"', () => {
  it('bietet die vier Tab-Bereiche und „zuletzt genutzt" an und speichert die Wahl', async () => {
    render(<Harness />);
    expect(screen.getByRole('radio', { name: 'Zuletzt genutzt' })).toBeTruthy();
    for (const name of ['Stundenplan', 'Mensaplan', 'News', 'Raumsuche']) {
      expect(screen.getByRole('radio', { name })).toBeTruthy();
    }

    fireEvent.press(screen.getByRole('radio', { name: 'News' }));
    await waitFor(async () => expect(await readJson('startView', 'schedule')).toBe('news'));
  });
});

describe('SET-F-100 Wahl der Oberflächensprache zwischen Deutsch und Englisch', () => {
  it('wechselt die angezeigte Sprache ohne Neustart und speichert die Wahl', async () => {
    render(<Harness />);
    expect(screen.getByText('Erscheinungsbild')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'Englisch' }));

    await waitFor(() => expect(screen.getByText('Appearance')).toBeTruthy());
    expect(screen.queryByText('Erscheinungsbild')).toBeNull();
    expect(await readJson('uiLanguage', 'system')).toBe('en');
  });
});
