import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { clearAll, writeJson } from '@/storage/kv';
import { ConsentProvider } from './ConsentProvider';
import { ConsentGate } from './ConsentGate';
import { RequiresConsent } from './RequiresConsent';

beforeEach(async () => {
  await clearAll();
});

function App({ children }: { children: React.ReactNode }) {
  return (
    <ConsentProvider>
      <ConsentGate>{children}</ConsentGate>
    </ConsentProvider>
  );
}

describe('SHELL-F-030 Erststart holt Zustimmung zur Datenschutzerklärung ein', () => {
  it('zeigt beim ersten Start das Zustimmungs-Gate statt der App', async () => {
    render(<App><Text>Startseite</Text></App>);
    expect(await screen.findByText('Datenschutz')).toBeTruthy();
    expect(screen.queryByText('Startseite')).toBeNull();
  });

  it('nach Zustimmung erscheint die App', async () => {
    render(<App><Text>Startseite</Text></App>);
    fireEvent.press(await screen.findByRole('button', { name: 'Zustimmen' }));
    expect(await screen.findByText('Startseite')).toBeTruthy();
  });

  it('nach "Später" erscheint die App ebenfalls (Basisfunktionen nutzbar)', async () => {
    render(<App><Text>Startseite</Text></App>);
    fireEvent.press(await screen.findByRole('button', { name: 'Später – nur Basisfunktionen' }));
    expect(await screen.findByText('Startseite')).toBeTruthy();
  });
});

describe('SEC-F-010 Personenbezogene Funktionen erst nach wirksamer Einwilligung', () => {
  it('RequiresConsent sperrt ohne Zustimmung und gibt nach Zustimmung frei', async () => {
    render(
      <ConsentProvider>
        <RequiresConsent><Text>Bewertung abgeben</Text></RequiresConsent>
      </ConsentProvider>,
    );
    expect(await screen.findByText('Zustimmung erforderlich')).toBeTruthy();
    expect(screen.queryByText('Bewertung abgeben')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Jetzt zustimmen' }));
    await waitFor(() => expect(screen.getByText('Bewertung abgeben')).toBeTruthy());
  });
});

describe('SHELL-F-110 Gesperrte Ansicht nennt Grund, bietet Freischaltweg und zeigt danach dieselbe Ansicht', () => {
  it('nennt den Grund und einen direkten Weg zur Freischaltung, dann erscheint der ursprüngliche Inhalt', async () => {
    render(
      <ConsentProvider>
        <RequiresConsent><Text>Bewertung abgeben</Text></RequiresConsent>
      </ConsentProvider>,
    );

    // Grund benannt (ein Satz), Freischaltweg als Knopf sichtbar.
    expect(await screen.findByText('Zustimmung erforderlich')).toBeTruthy();
    expect(
      screen.getByText('Diese Funktion verarbeitet personenbezogene Daten. Stimme der Datenschutzerklärung zu, um sie zu nutzen.'),
    ).toBeTruthy();
    const unlock = screen.getByRole('button', { name: 'Jetzt zustimmen' });

    fireEvent.press(unlock);

    // Nach der Freischaltung dieselbe Ansicht, an der die Nutzerin war.
    await waitFor(() => expect(screen.getByText('Bewertung abgeben')).toBeTruthy());
  });
});

describe('SEC-F-020 Erneute Einwilligung nach Änderung der Datenschutzerklärung', () => {
  it('sperrt personenbezogene Funktionen wieder und weist auf die Änderung hin', async () => {
    // Zustimmung zu einer älteren Fassung vortäuschen.
    await writeJson('privacyPolicyConsent', {
      decision: 'accepted',
      version: '2000-01-01',
      decidedAt: new Date().toISOString(),
    });

    render(
      <ConsentProvider>
        <RequiresConsent><Text>Bewertung abgeben</Text></RequiresConsent>
      </ConsentProvider>,
    );

    expect(await screen.findByText('Die Datenschutzerklärung hat sich geändert. Bitte stimme der aktualisierten Fassung zu.')).toBeTruthy();
    expect(screen.queryByText('Bewertung abgeben')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Jetzt zustimmen' }));
    await waitFor(() => expect(screen.getByText('Bewertung abgeben')).toBeTruthy());
  });
});
