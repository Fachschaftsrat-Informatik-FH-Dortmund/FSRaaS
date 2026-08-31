// Typisierter HTTP-Client gegen den Vertrag (ADR 0013: openapi-fetch gegen
// api-contract.yaml). Erzwingt die Zeitgrenze je Abruf (NFR-F-070) und wandelt
// jede Fehlerantwort in einen AppError (API-N-040, SEC-F-060).

import createClient, { type Client } from 'openapi-fetch';

import type { paths } from '@/api/generated/schema';
import { config } from '@/config';
import { AppError } from '@/errors/AppError';
import { problemToAppError } from './problem';

/** fetch mit harter Zeitgrenze; bricht den Abruf nach config.netTimeoutMs ab (NFR-F-070). */
export const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.netTimeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const api: Client<paths> = createClient<paths>({
  baseUrl: config.apiBaseUrl,
  fetch: fetchWithTimeout,
});

/** Ergebnisform von openapi-fetch: entweder `data` oder `error`, plus `response`. */
export interface ApiResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/**
 * Packt ein openapi-fetch-Ergebnis aus: gibt die Nutzdaten zurück oder wirft
 * einen AppError. Ein Netzwerk-/Abbruchfehler (fetch wirft) wird von der
 * aufrufenden `queryFn` über {@link AppError.from} behandelt; hier geht es um
 * die Fehlerantwort des Servers.
 */
export function unwrap<T>(result: ApiResult<T>): T {
  if (result.error !== undefined || !result.response.ok) {
    throw problemToAppError(result.response.status, result.error);
  }
  if (result.data === undefined) {
    throw new AppError({
      kind: 'parse',
      message: 'error.unexpectedResponse',
      status: result.response.status,
      retryable: false,
    });
  }
  return result.data;
}
