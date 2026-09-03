import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import { ThemeProvider } from '@/theme';
import { StammdatenScreen } from './StammdatenScreen';

const mockMutate = jest.fn();
let mockStammdatenQuery: any;

jest.mock('@/auth/AuthProvider', () => ({
  useAuth: () => ({ status: 'signed-in', roles: ['fsr-redaktion'] }),
}));

jest.mock('../api', () => ({
  useAdminApi: () => ({
    stammdaten: mockStammdatenQuery,
    stammdatenSpeichern: { mutateAsync: mockMutate, isPending: false },
  }),
}));

const basis = {
  daten: {
    mensen: [{ id: 'M', name: 'Hauptmensa', standardAuswahl: true, reihenfolge: 10 }],
    raeume: [{ roomId: 'A.E.01', groesse: 'gross', ekeyZugaenglich: true }],
    links: [],
    semestertermine: {},
  },
  etag: '"e1"',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockStammdatenQuery = {
    data: basis,
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
      <StammdatenScreen />
    </ThemeProvider>,
  );
}

describe('ADMIN-F-180 Mensa-, Raum- und Links-Liste anlegen, ändern, entfernen', () => {
  it('zeigt einen Raum-Abschnitt mit vorhandenen Räumen und Schaltflächen zum Anlegen', () => {
    renderScreen();
    expect(screen.getByText('Räume')).toBeTruthy();
    expect(screen.getByDisplayValue('A.E.01')).toBeTruthy();
    expect(screen.getByText('Raum hinzufügen')).toBeTruthy();
    expect(screen.getByText('Mensa hinzufügen')).toBeTruthy();
  });

  it('fügt beim Tippen auf „Raum hinzufügen" eine weitere Raumzeile hinzu', () => {
    renderScreen();
    const vorher = screen.getAllByLabelText('Raumkennung').length;
    fireEvent.press(screen.getByText('Raum hinzufügen'));
    expect(screen.getAllByLabelText('Raumkennung')).toHaveLength(vorher + 1);
  });
});

describe('ADMIN-F-190 Semestertermine und Ticket-Bildausschnitt ändern', () => {
  it('bietet alle vier Semestertermine und den Ticket-Bildausschnitt an', () => {
    renderScreen();
    expect(screen.getByLabelText('Semesterbeginn (JJJJ-MM-TT)')).toBeTruthy();
    expect(screen.getByLabelText('Nächster Wintersemesterbeginn (JJJJ-MM-TT)')).toBeTruthy();
    expect(screen.getByLabelText('Nächster Sommersemesterbeginn (JJJJ-MM-TT)')).toBeTruthy();
    expect(screen.getByText('Ticket-Bildausschnitt')).toBeTruthy();
    expect(screen.getByLabelText('Rechts')).toBeTruthy();
  });
});

describe('ADMIN-F-200 Speichern gegen zwischenzeitliche Änderung', () => {
  it('meldet bei 412 den nachgeladenen Stand, nicht einen allgemeinen Fehler', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockMutate.mockRejectedValueOnce(
      new AppError({ kind: 'server', message: 'x', status: 412, retryable: false }),
    );
    renderScreen();

    fireEvent.press(screen.getByText('Speichern'));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(expect.stringContaining('neuere Stand wurde geladen')),
    );
  });
});
