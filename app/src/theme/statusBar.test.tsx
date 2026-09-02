import { useColorScheme } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { clearAll, writeJson } from '@/storage/kv';
import { ThemeProvider } from './ThemeProvider';
import { statusBarStyle, ThemedStatusBar } from './statusBar';

const lastStyle: { value?: string } = {};
jest.mock('expo-status-bar', () => ({
  StatusBar: (props: { style?: string }) => {
    lastStyle.value = props.style;
    return null;
  },
}));

const mockColorScheme = useColorScheme as jest.Mock;

beforeEach(async () => {
  await clearAll();
  lastStyle.value = undefined;
  mockColorScheme.mockReturnValue('light');
});

describe('UX-F-220 Statusleiste folgt dem wirksamen Erscheinungsbild', () => {
  it('wählt auf dunklem Grund helle Symbole, auf hellem dunkle', () => {
    expect(statusBarStyle('dark')).toBe('light');
    expect(statusBarStyle('light')).toBe('dark');
  });

  it('rendert im Dunkelmodus helle Symbole', () => {
    mockColorScheme.mockReturnValue('dark');
    render(
      <ThemeProvider>
        <ThemedStatusBar />
      </ThemeProvider>,
    );
    expect(lastStyle.value).toBe('light');
  });

  it('folgt der manuellen Übersteuerung „dunkel" trotz hellem System (UX-F-030)', async () => {
    await writeJson('appearanceMode', 'dark');
    mockColorScheme.mockReturnValue('light');
    render(
      <ThemeProvider>
        <ThemedStatusBar />
      </ThemeProvider>,
    );
    await waitFor(() => expect(lastStyle.value).toBe('light'));
  });
});
