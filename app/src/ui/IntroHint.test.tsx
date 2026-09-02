import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import { clearAll, readJson } from '@/storage/kv';
import { ThemeProvider } from '@/theme';
import { IntroHint } from './IntroHint';

beforeEach(async () => {
  await clearAll();
});

function renderHint(area = 'schedule') {
  return render(
    <ThemeProvider>
      <IntroHint area={area} text="Wähle oben deinen Studiengang." />
    </ThemeProvider>,
  );
}

describe('UX-F-190 Höchstens ein schließbarer Einführungshinweis je Bereich, danach nie wieder', () => {
  it('zeigt den Hinweis beim ersten Öffnen', async () => {
    renderHint();
    expect(await screen.findByText('Wähle oben deinen Studiengang.')).toBeTruthy();
  });

  it('blendet ihn nach dem Schließen aus und merkt sich das dauerhaft', async () => {
    const view = renderHint();
    fireEvent.press(await view.findByRole('button', { name: 'Hinweis schließen' }));
    await waitFor(() => expect(screen.queryByText('Wähle oben deinen Studiengang.')).toBeNull());
    expect(await readJson('introSeen:schedule', false)).toBe(true);

    view.unmount();
    renderHint();
    await waitFor(() =>
      expect(screen.queryByText('Wähle oben deinen Studiengang.')).toBeNull(),
    );
  });
});
