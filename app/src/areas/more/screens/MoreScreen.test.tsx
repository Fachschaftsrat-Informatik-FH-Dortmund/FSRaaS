import { useColorScheme, StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { ThemeProvider, darkColors } from '@/theme';
import { MoreScreen } from './MoreScreen';

const mockColorScheme = useColorScheme as jest.Mock;

let mockHasAdminRole = false;
jest.mock('@/auth/AuthProvider', () => ({
  useHasAdminRole: () => mockHasAdminRole,
}));

function renderScreen() {
  return render(
    <ThemeProvider>
      <MoreScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  mockHasAdminRole = false;
});

describe('SHELL-F-090 „Mehr" als nach Themen gruppierte Liste', () => {
  it('zeigt Gruppen-Zwischenüberschriften und die Einträge darunter', () => {
    renderScreen();
    expect(screen.getByText('Mein Studium')).toBeTruthy();
    expect(screen.getByText('Semesterticket')).toBeTruthy();
    expect(screen.getByText('Einstellungen')).toBeTruthy();
  });

  it('zeigt keine Einträge für Bereiche künftiger Ausbaustufen', () => {
    renderScreen();
    expect(screen.queryByText('Notenübersicht')).toBeNull();
    expect(screen.queryByText('Wiki')).toBeNull();
    expect(screen.queryByText('Events')).toBeNull();
  });

  it('jeder Eintrag ist ein sichtbarer Bedienweg (Link), keine Geste', () => {
    renderScreen();
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(2);
  });

  it('färbt die Einträge im Dunkelmodus nach dem Farbsystem (UX-F-020)', () => {
    mockColorScheme.mockReturnValue('dark');
    renderScreen();
    const entry = StyleSheet.flatten(screen.getByText('Semesterticket').props.style);
    expect(entry.color).toBe(darkColors.text);
  });
});

describe('ADMIN-F-020 Verwaltungsbereich nur mit Verwaltungsrolle sichtbar', () => {
  it('blendet den Verwaltungseintrag ohne Rolle vollständig aus', () => {
    mockHasAdminRole = false;
    renderScreen();
    expect(screen.queryByText('Verwaltung & Redaktion')).toBeNull();
    expect(screen.queryByText('Verwaltung')).toBeNull(); // leere Gruppe wird ausgelassen
  });

  it('zeigt den Verwaltungseintrag, sobald das Konto eine Verwaltungsrolle trägt', () => {
    mockHasAdminRole = true;
    renderScreen();
    expect(screen.getByText('Verwaltung')).toBeTruthy(); // Gruppen-Überschrift
    expect(screen.getByText('Verwaltung & Redaktion')).toBeTruthy();
  });
});
