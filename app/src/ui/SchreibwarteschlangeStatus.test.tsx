import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '@/errors/AppError';
import {
  definiereSchreibvorgang,
  leseWarteschlange,
  registriereSchreibvorgaenge,
  reiheEin,
  type Schreibvorgang,
} from '@/state/schreibwarteschlange';
import { ThemeProvider } from '@/theme';
import { SchreibwarteschlangeStatus } from './SchreibwarteschlangeStatus';

let ergebnis: () => Promise<string>;
const vorgang = definiereSchreibvorgang<{ text: string }, string>('statusTest', {
  ausfuehren: () => ergebnis(),
});

let client: QueryClient;

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  onlineManager.setOnline(true);
  ergebnis = async () => 'ok';
  client = new QueryClient();
  registriereSchreibvorgaenge(client, [vorgang] as unknown as Schreibvorgang<never, never>[]);
  client.mount();
});

afterEach(() => {
  cleanup();
  client.unmount();
  client.clear();
  onlineManager.setOnline(true);
  jest.restoreAllMocks();
});

function renderStatus() {
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <SchreibwarteschlangeStatus
          arten={['statusTest']}
          beschreibe={(e) => `Vorgang ${(e.auftrag.nutzdaten as { text: string }).text}`}
        />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

const ruhe = () => act(async () => {
  await new Promise((r) => setTimeout(r, 0));
});

describe('Status der Offline-Warteschlange einsehbar', () => {
  it('ohne Einträge zeigt der Baustein nichts', () => {
    renderStatus();
    expect(screen.queryByText('Noch nicht übertragen')).toBeNull();
  });

  it('Wartender Eintrag ohne Netz: sichtbar, bis er übertragen ist', async () => {
    onlineManager.setOnline(false);
    renderStatus();
    await act(async () => {
      reiheEin(client, vorgang, { text: 'A' });
    });

    expect(await screen.findByText('Noch nicht übertragen')).toBeTruthy();
    expect(screen.getByText('⏸ Vorgang A · wartet auf Verbindung')).toBeTruthy();

    await act(async () => {
      onlineManager.setOnline(true);
    });
    await waitFor(() => expect(screen.queryByText('Noch nicht übertragen')).toBeNull());
  });
});

describe('Manuelle Entscheidung bei dauerhaft fehlgeschlagenem Schreibvorgang', () => {
  it('Dauerhafter Fehlschlag: Hinweis mit „Erneut versuchen" und „Verwerfen"', async () => {
    ergebnis = async () => {
      throw new AppError({ kind: 'server', code: 'x', message: 'x', status: 400, retryable: false });
    };
    renderStatus();
    await act(async () => {
      reiheEin(client, vorgang, { text: 'B' });
    });
    await ruhe();

    expect(await screen.findByText('⚠ Vorgang B · fehlgeschlagen')).toBeTruthy();

    ergebnis = async () => 'ok';
    fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    await waitFor(() => expect(leseWarteschlange(client)).toEqual([]));
  });

  it('Verwerfen entfernt den Eintrag', async () => {
    ergebnis = async () => {
      throw new AppError({ kind: 'server', code: 'x', message: 'x', status: 400, retryable: false });
    };
    renderStatus();
    await act(async () => {
      reiheEin(client, vorgang, { text: 'C' });
    });
    fireEvent.press(await screen.findByRole('button', { name: 'Verwerfen' }));
    await waitFor(() => expect(screen.queryByText('Noch nicht übertragen')).toBeNull());
  });
});
