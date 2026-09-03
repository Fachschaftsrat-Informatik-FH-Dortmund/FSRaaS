import * as SecureStore from 'expo-secure-store';

import { clearSession, loadSession, saveSession } from './tokenStore';

const secure = SecureStore as jest.Mocked<typeof SecureStore>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DATA-F-120 Sitzungsmerkmal ausschließlich im gesicherten Systemspeicher', () => {
  it('schreibt den Token-Satz über expo-secure-store, nicht in einfachen Speicher', async () => {
    await saveSession({ accessToken: 'a', refreshToken: 'r', expiresAt: 42 });

    expect(secure.setItemAsync).toHaveBeenCalledTimes(1);
    const call = secure.setItemAsync.mock.calls[0]!;
    expect(call[0]).toBe('fb4.session');
    expect(JSON.parse(call[1])).toMatchObject({ accessToken: 'a', refreshToken: 'r' });
  });

  it('liest den Token-Satz aus dem gesicherten Speicher', async () => {
    secure.getItemAsync.mockResolvedValueOnce(JSON.stringify({ accessToken: 'x', expiresAt: 1 }));
    await expect(loadSession()).resolves.toEqual({ accessToken: 'x', expiresAt: 1 });
  });

  it('gibt bei defektem Inhalt null zurück, statt zu werfen (SEC-F-060)', async () => {
    secure.getItemAsync.mockResolvedValueOnce('{kaputt');
    await expect(loadSession()).resolves.toBeNull();
  });
});

describe('DATA-F-130 Sitzungsmerkmal bei Abmeldung entfernen', () => {
  it('löscht den Eintrag im gesicherten Speicher', async () => {
    await clearSession();
    expect(secure.deleteItemAsync).toHaveBeenCalledWith('fb4.session');
  });
});
