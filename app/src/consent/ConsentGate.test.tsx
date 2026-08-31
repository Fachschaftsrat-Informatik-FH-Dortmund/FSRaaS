import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { clearAll } from '@/storage/kv';
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
