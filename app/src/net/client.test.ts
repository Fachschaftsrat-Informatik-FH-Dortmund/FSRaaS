jest.mock('@/config', () => ({
  config: { apiBaseUrl: 'https://api.fsrfb4.de/v1', netTimeoutMs: 40 },
}));

import { AppError } from '@/errors/AppError';
import { fetchWithTimeout, unwrap, type ApiResult } from './client';

describe('NFR-F-070 Netzabruf bricht nach der Zeitgrenze ab', () => {
  it('fetchWithTimeout bricht ab, wenn die Antwort zu lange braucht', async () => {
    const original = global.fetch;
    global.fetch = jest.fn((_url, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    }) as unknown as typeof fetch;

    await expect(fetchWithTimeout('https://api.fsrfb4.de/v1/langsam')).rejects.toMatchObject({
      name: 'AbortError',
    });

    global.fetch = original;
  });
});

describe('API-N-040 unwrap wirft AppError bei Fehlerantwort', () => {
  const ok = (): Response => ({ ok: true, status: 200 }) as Response;
  const bad = (status: number): Response => ({ ok: false, status }) as Response;

  it('gibt Nutzdaten zurück, wenn die Antwort in Ordnung ist', () => {
    const result: ApiResult<{ x: number }> = { data: { x: 1 }, response: ok() };
    expect(unwrap(result)).toEqual({ x: 1 });
  });

  it('wirft einen AppError, wenn error gesetzt ist', () => {
    const result: ApiResult<unknown> = {
      error: { code: 'not_found', title: 'weg', status: 404 },
      response: bad(404),
    };
    expect(() => unwrap(result)).toThrow(AppError);
  });

  it('wirft einen parse-Fehler, wenn weder data noch error vorliegen', () => {
    expect(() => unwrap({ response: ok() } as ApiResult<unknown>)).toThrow(/unexpectedResponse|parse/i);
  });
});
