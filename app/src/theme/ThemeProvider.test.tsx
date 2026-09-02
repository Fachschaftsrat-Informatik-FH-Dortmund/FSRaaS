import { Text } from 'react-native';
import { useColorScheme } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';

import { clearAll, writeJson } from '@/storage/kv';
import { ThemeProvider, useTheme } from './ThemeProvider';

const mockColorScheme = useColorScheme as jest.Mock;

beforeEach(async () => {
  await clearAll();
  mockColorScheme.mockReturnValue('light');
});

function Probe() {
  const { scheme } = useTheme();
  return <Text>scheme:{scheme}</Text>;
}

describe('UX-F-020 Laufzeitreaktion auf die Systemeinstellung', () => {
  it('spiegelt den aktuellen Systemwert bei jedem Rendern, statt ihn beim Start einzufrieren', () => {
    mockColorScheme.mockReturnValue('light');
    const view = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('scheme:light')).toBeTruthy();

    // System wechselt zu dunkel, während die App läuft.
    mockColorScheme.mockReturnValue('dark');
    view.rerender(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByText('scheme:dark')).toBeTruthy();
  });
});

describe('UX-F-030 Manuelle Übersteuerung wird beim Start geladen und gilt vor dem System', () => {
  it('folgt der gespeicherten Wahl „dunkel" trotz hellem System', async () => {
    await writeJson('appearanceMode', 'dark');
    mockColorScheme.mockReturnValue('light');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByText('scheme:dark')).toBeTruthy());
  });
});
