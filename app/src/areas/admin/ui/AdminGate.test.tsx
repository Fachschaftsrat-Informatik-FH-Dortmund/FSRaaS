import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { AdminGate } from './AdminGate';

let mockAuth: any;
jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));

// `Redirect` ist global als `() => null` gemockt (jest.setup.js): rendert die
// Gate ihn statt der Kinder, ist der Inhalt nicht im Baum.
function renderGate() {
  return render(
    <ThemeProvider>
      <AdminGate>
        <Text>INHALT</Text>
      </AdminGate>
    </ThemeProvider>,
  );
}

describe('ADMIN-F-010 / ADMIN-F-020 Verwaltungs-Unterseiten nur mit Rolle', () => {
  it('gibt den Inhalt frei, wenn das Konto eine Verwaltungsrolle trägt', () => {
    mockAuth = { status: 'signed-in', roles: ['moderation'] };
    renderGate();
    expect(screen.getByText('INHALT')).toBeTruthy();
  });

  it('blendet den Inhalt aus (Umleitung), wenn keine Verwaltungsrolle vorliegt', () => {
    mockAuth = { status: 'signed-in', roles: [] };
    renderGate();
    expect(screen.queryByText('INHALT')).toBeNull();
  });

  it('blendet den Inhalt aus, solange die Anmeldung noch lädt', () => {
    mockAuth = { status: 'loading', roles: [] };
    renderGate();
    expect(screen.queryByText('INHALT')).toBeNull();
  });
});
