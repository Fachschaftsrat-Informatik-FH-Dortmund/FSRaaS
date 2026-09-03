import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import { ThemeProvider } from '@/theme';
import { RollenScreen } from './RollenScreen';

const mockMutate = jest.fn();
let mockRollenQuery: any;

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ status: 'signed-in', roles: ['fsr-redaktion'] }),
}));

jest.mock('../api', () => ({
  useAdminApi: () => ({
    rollen: mockRollenQuery,
    rollenSpeichern: { mutateAsync: mockMutate, isPending: false },
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRollenQuery = {
    data: [{ kontoId: '1', anzeigename: 'Tobi', rollen: ['fsr-redaktion'] }],
    isPending: false,
    isError: false,
    isFetching: false,
    isStale: false,
    error: null,
    dataUpdatedAt: Date.now(),
    refetch: jest.fn(),
  };
});

function renderScreen() {
  return render(
    <ThemeProvider>
      <RollenScreen />
    </ThemeProvider>,
  );
}

describe('ADMIN-F-070 Rollen zuweisen und entziehen', () => {
  it('nimmt einen Benutzernamen zum Hinzufügen entgegen, nicht die interne Kennung', () => {
    renderScreen();
    expect(screen.getByPlaceholderText('Benutzername')).toBeTruthy();
    expect(screen.getByText(/Benutzername des FSR-Kontos/)).toBeTruthy();
  });

  it('übergibt den eingegebenen Benutzernamen an die Rollen-Mutation', () => {
    renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText('Benutzername'), 'tobi');
    fireEvent.press(screen.getByText('Als FSR-Redaktion hinzufügen'));
    expect(mockMutate).toHaveBeenCalledWith({ kontoId: 'tobi', rollen: ['fsr-redaktion'] });
  });

  it('meldet einen unbekannten Benutzernamen als eigenen Hinweis', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockMutate.mockRejectedValueOnce(
      new AppError({ kind: 'notFound', message: 'x', code: 'konto_unbekannt', status: 404, retryable: false }),
    );
    renderScreen();

    fireEvent.changeText(screen.getByPlaceholderText('Benutzername'), 'niemand');
    fireEvent.press(screen.getByText('Als FSR-Redaktion hinzufügen'));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith('Kein Konto mit diesem Benutzernamen gefunden.'),
    );
  });
});

describe('ADMIN-F-080 Aussperrschutz (Rückmeldung in der App)', () => {
  it('zeigt den Hinweis „letzte Redaktionsrolle", wenn der Server den Entzug ablehnt', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockMutate.mockRejectedValueOnce(
      new AppError({ kind: 'server', message: 'x', code: 'letzte_redaktion', status: 409, retryable: false }),
    );
    renderScreen();

    fireEvent.press(screen.getByText('✓ FSR-Redaktion'));
    fireEvent.press(screen.getByText('Rollen speichern'));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith('Die letzte verbleibende FSR-Redaktions-Rolle kann nicht entzogen werden.'),
    );
  });
});
