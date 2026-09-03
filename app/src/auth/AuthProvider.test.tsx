import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';

import * as oidc from './oidc';
import * as tokenStore from './tokenStore';
import { AuthProvider, useAuth } from './AuthProvider';

jest.mock('./oidc', () => ({
  isConfigured: jest.fn(() => true),
  signInInteractive: jest.fn(),
  refreshTokens: jest.fn(),
  endSession: jest.fn(() => Promise.resolve()),
}));
jest.mock('./tokenStore', () => ({
  loadSession: jest.fn(() => Promise.resolve(null)),
  saveSession: jest.fn(() => Promise.resolve()),
  clearSession: jest.fn(() => Promise.resolve()),
}));

const mOidc = oidc as jest.Mocked<typeof oidc>;
const mStore = tokenStore as jest.Mocked<typeof tokenStore>;

let auth: ReturnType<typeof useAuth>;
function Probe() {
  auth = useAuth();
  return <Text>{auth.status}</Text>;
}

async function mount() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  await act(async () => {});
}

beforeEach(() => {
  jest.clearAllMocks();
  mOidc.isConfigured.mockReturnValue(true);
  mStore.loadSession.mockResolvedValue(null);
});

describe('SEC-F-040 Anmeldung ausschließlich über den Redirect-Fluss', () => {
  it('startet die Anmeldung über den Systembrowser und legt die Sitzung ab', async () => {
    mOidc.signInInteractive.mockResolvedValue({ accessToken: 'neu', refreshToken: 'r', idToken: undefined, expiresIn: 300 });
    await mount();
    expect(screen.getByText('signed-out')).toBeTruthy();

    await act(async () => {
      await auth.signIn();
    });

    expect(mOidc.signInInteractive).toHaveBeenCalled();
    expect(mStore.saveSession).toHaveBeenCalledWith(expect.objectContaining({ accessToken: 'neu' }));
    expect(auth.status).toBe('signed-in');
  });
});

describe('IDENT-F-140 Abmeldung löst eine serverseitige Abmeldung aus', () => {
  it('entfernt das lokale Merkmal und ruft die RP-Initiated-Logout-Funktion', async () => {
    mStore.loadSession.mockResolvedValue({ accessToken: 'a', idToken: 'id-token', expiresAt: Date.now() + 1_000_000 });
    await mount();
    expect(auth.status).toBe('signed-in');

    await act(async () => {
      await auth.signOut();
    });

    expect(mStore.clearSession).toHaveBeenCalled();
    expect(mOidc.endSession).toHaveBeenCalledWith('id-token');
    expect(auth.status).toBe('signed-out');
  });
});

describe('IDENT-N-030 Zugriffstoken wird vor Ablauf über das Refresh-Token erneuert', () => {
  it('erneuert das Token, wenn es fast abgelaufen ist', async () => {
    mStore.loadSession.mockResolvedValue({ accessToken: 'alt', refreshToken: 'r', expiresAt: Date.now() + 1_000 });
    mOidc.refreshTokens.mockResolvedValue({ accessToken: 'frisch', refreshToken: 'r2', idToken: undefined, expiresIn: 300 });
    await mount();

    let token: string | null = null;
    await act(async () => {
      token = await auth.getAccessToken();
    });

    expect(mOidc.refreshTokens).toHaveBeenCalledWith('r');
    expect(token).toBe('frisch');
  });

  it('gibt ein noch gültiges Token unverändert zurück', async () => {
    mStore.loadSession.mockResolvedValue({ accessToken: 'gueltig', refreshToken: 'r', expiresAt: Date.now() + 1_000_000 });
    await mount();

    let token: string | null = null;
    await act(async () => {
      token = await auth.getAccessToken();
    });

    expect(mOidc.refreshTokens).not.toHaveBeenCalled();
    expect(token).toBe('gueltig');
  });
});

describe('Anmeldung nicht eingerichtet', () => {
  it('meldet den Status unavailable, wenn kein Issuer konfiguriert ist (SEC-F-050)', async () => {
    mOidc.isConfigured.mockReturnValue(false);
    await mount();
    expect(auth.status).toBe('unavailable');
  });
});
