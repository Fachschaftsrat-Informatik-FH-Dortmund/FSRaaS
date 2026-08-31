import { statusFor, personalDataAllowed, readConsent, writeConsent } from './consentStore';
import { privacyPolicy } from './privacyPolicy';
import { clearAll } from '@/storage/kv';

beforeEach(async () => {
  await clearAll();
});

describe('SHELL-F-030 Erststart holt Zustimmung ein', () => {
  it('ohne gespeicherte Entscheidung ist der Status "undecided"', async () => {
    expect(await readConsent()).toBeNull();
    expect(statusFor(null)).toBe('undecided');
  });
});

describe('SEC-F-010 Wirksame, versionierte Einwilligung', () => {
  it('nach Zustimmung zur aktuellen Fassung sind personenbezogene Funktionen erlaubt', async () => {
    await writeConsent('accepted');
    const record = await readConsent();
    expect(statusFor(record)).toBe('granted');
    expect(personalDataAllowed(statusFor(record))).toBe(true);
  });

  it('bei zurückgestellter Entscheidung bleiben personenbezogene Funktionen gesperrt', async () => {
    await writeConsent('deferred');
    const status = statusFor(await readConsent());
    expect(status).toBe('deferred');
    expect(personalDataAllowed(status)).toBe(false);
  });
});

describe('SEC-F-020 Erneute Einwilligung nach Änderung der Datenschutzerklärung', () => {
  it('eine ältere akzeptierte Fassung führt zu Status "outdated" und sperrt wieder', () => {
    const stale = { decision: 'accepted' as const, version: '2000-01-01', decidedAt: '' };
    expect(stale.version).not.toBe(privacyPolicy.version);
    expect(statusFor(stale)).toBe('outdated');
    expect(personalDataAllowed(statusFor(stale))).toBe(false);
  });
});
