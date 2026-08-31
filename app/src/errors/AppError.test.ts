import { AppError, logError } from './AppError';

describe('SEC-F-060 Fehler werden nicht stillschweigend verschluckt', () => {
  it('logError protokolliert den Fehler und gibt ihn zur Weitergabe zurück', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = logError('test.kontext', new Error('kaputt'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(AppError);
    spy.mockRestore();
  });

  it('logError enthält kein personenbezogenes Nutzdatum, nur Kontext und Fehlerform (SEC-N-120)', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logError('mensa.laden', new AppError({ kind: 'server', code: 'x', message: 'geheim@example.com', retryable: true }));
    expect(spy.mock.calls[0]?.[0]).not.toContain('geheim@example.com');
    spy.mockRestore();
  });
});

describe('NFR-F-070 Zeitüberschreitung wird als wiederholbarer Fehler gemeldet', () => {
  it('ein AbortError wird zu kind "timeout" mit retryable', () => {
    const err = AppError.from(new DOMException('abort', 'AbortError'));
    expect(err.kind).toBe('timeout');
    expect(err.retryable).toBe(true);
  });

  it('ein fetch-TypeError wird zu kind "offline"', () => {
    const err = AppError.from(new TypeError('Network request failed'));
    expect(err.kind).toBe('offline');
  });
});
