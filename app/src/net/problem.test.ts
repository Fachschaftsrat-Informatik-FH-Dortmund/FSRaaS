import { problemToAppError } from './problem';

describe('API-N-040 Einheitliches Fehlerformat des Backends', () => {
  it('wertet eine RFC-9457-Antwort mit code und title aus', () => {
    const err = problemToAppError(409, {
      type: 'https://api.fsrfb4.de/problems/conflict',
      title: 'Für dieses Gericht heute bereits bewertet.',
      status: 409,
      code: 'bereits_heute_bewertet',
    });
    expect(err.code).toBe('bereits_heute_bewertet');
    expect(err.message).toBe('Für dieses Gericht heute bereits bewertet.');
    expect(err.status).toBe(409);
  });

  it('ordnet 404 und 401/403 den passenden Fehlerarten zu', () => {
    expect(problemToAppError(404, { code: 'not_found', title: 'x', status: 404 }).kind).toBe('notFound');
    expect(problemToAppError(403, { code: 'forbidden', title: 'x', status: 403 }).kind).toBe('unauthorized');
  });

  it('macht eine nicht formatkonforme Antwort als parse-Fehler sichtbar, statt sie weiterzuverarbeiten (SEC-F-060, QA-N-070)', () => {
    const err = problemToAppError(500, '<html>Gateway Timeout</html>');
    expect(err.kind).toBe('parse');
    expect(err.retryable).toBe(false);
  });
});
