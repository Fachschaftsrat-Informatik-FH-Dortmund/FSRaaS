import { decodeJwt, displayNameFromClaims, hasAnyAdminRole, rolesFromClaims } from './claims';

// Baut ein Token mit gegebener Nutzlast (Signatur belanglos — die prüft das Backend).
function token(payload: Record<string, unknown>): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=+$/, '');
  return `header.${b64}.sig`;
}

describe('IDENT-F-045 Rollenzugehörigkeit stammt aus dem Identitätsanbieter', () => {
  it('leitet FSR-Redaktion und Moderation aus dem Gruppen-Claim ab', () => {
    const claims = decodeJwt(token({ groups: ['FSR-Redaktion', 'Moderation', 'Studierende'] }));
    expect(rolesFromClaims(claims).sort()).toEqual(['fsr-redaktion', 'moderation']);
  });

  it('akzeptiert einen einzelnen Gruppen-Wert als String', () => {
    expect(rolesFromClaims(decodeJwt(token({ groups: 'FSR-Redaktion' })))).toEqual(['fsr-redaktion']);
  });

  it('führt keine eigene Rollenliste: ohne passende Gruppe keine Rolle', () => {
    expect(rolesFromClaims(decodeJwt(token({ groups: ['Studierende'] })))).toEqual([]);
  });
});

describe('ADMIN-F-020 Verwaltungsbereich nur mit mindestens einer Verwaltungsrolle', () => {
  it('erkennt ein Konto ohne jede Verwaltungsrolle', () => {
    expect(hasAnyAdminRole(decodeJwt(token({ groups: [] })))).toBe(false);
  });

  it('erkennt ein Konto mit Verwaltungsrolle', () => {
    expect(hasAnyAdminRole(decodeJwt(token({ groups: ['Moderation'] })))).toBe(true);
  });
});

describe('decodeJwt', () => {
  it('gibt bei unlesbarem Token null zurück, statt zu werfen (SEC-F-060)', () => {
    expect(decodeJwt('kein-jwt')).toBeNull();
    expect(decodeJwt(undefined)).toBeNull();
  });

  it('liest den Anzeigenamen aus name/preferred_username/email', () => {
    expect(displayNameFromClaims(decodeJwt(token({ preferred_username: 'tb' })))).toBe('tb');
  });
});
