import { isExpired, needsRefresh, REFRESH_SKEW_MS, sessionFromTokenResponse } from './session';

describe('IDENT-N-030 kurzlebige Zugriffstoken mit Refresh-Token-Erneuerung', () => {
  const now = 1_000_000;

  it('meldet Erneuerungsbedarf, sobald der Sicherheitsabstand vor dem Ablauf erreicht ist', () => {
    const session = { accessToken: 'a', expiresAt: now + REFRESH_SKEW_MS - 1 };
    expect(needsRefresh(session, now)).toBe(true);
    expect(isExpired(session, now)).toBe(false);
  });

  it('hält ein frisches Token ohne Erneuerung', () => {
    const session = { accessToken: 'a', expiresAt: now + REFRESH_SKEW_MS + 60_000 };
    expect(needsRefresh(session, now)).toBe(false);
  });

  it('rechnet expiresIn (Sekunden) in einen absoluten Ablaufzeitpunkt um', () => {
    const s = sessionFromTokenResponse({ accessToken: 'a', expiresIn: 300 }, now);
    expect(s.expiresAt).toBe(now + 300_000);
  });
});
