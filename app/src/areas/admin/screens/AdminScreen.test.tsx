import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { AdminScreen } from './AdminScreen';

let mockAuth: {
  status: string;
  roles: string[];
  displayName?: string;
  signIn: jest.Mock;
  signOut: jest.Mock;
  getAccessToken: jest.Mock;
};

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));

function renderScreen() {
  return render(
    <ThemeProvider>
      <AdminScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mockAuth = {
    status: 'signed-out',
    roles: [],
    signIn: jest.fn(),
    signOut: jest.fn(),
    getAccessToken: jest.fn(),
  };
});

describe('ADMIN-F-020 Verwaltungsbereich nur mit Verwaltungsrolle nutzbar', () => {
  it('zeigt ohne Anmeldung eine Anmeldeaufforderung, keine Verwaltungsfunktionen', () => {
    mockAuth.status = 'signed-out';
    renderScreen();
    expect(screen.getByText('Anmelden')).toBeTruthy();
    expect(screen.queryByText('Rollen')).toBeNull();
  });

  it('zeigt angemeldet ohne Rolle „Kein Zugriff", keine Verwaltungsfunktionen', () => {
    mockAuth.status = 'signed-in';
    mockAuth.roles = [];
    renderScreen();
    expect(screen.getByText('Kein Zugriff')).toBeTruthy();
    expect(screen.queryByText('Stammdaten')).toBeNull();
  });

  it('meldet, wenn kein Identitätsanbieter eingerichtet ist', () => {
    mockAuth.status = 'unavailable';
    renderScreen();
    expect(screen.getByText('Anmeldung nicht eingerichtet')).toBeTruthy();
  });
});

describe('ADMIN-F-030 gleicher fachlicher Funktionsumfang (eine Codebasis)', () => {
  it('führt mit Verwaltungsrolle zu denselben Verwaltungsbereichen (App wie Web-Export)', () => {
    mockAuth.status = 'signed-in';
    mockAuth.roles = ['fsr-redaktion'];
    mockAuth.displayName = 'Testkonto';
    renderScreen();

    expect(screen.getByText('Rollen')).toBeTruthy();
    expect(screen.getByText('Stammdaten')).toBeTruthy();
    expect(screen.getByText('Laufwege')).toBeTruthy();
  });
});
