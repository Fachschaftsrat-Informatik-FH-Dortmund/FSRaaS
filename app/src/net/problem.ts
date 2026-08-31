// Auswertung des einheitlichen Fehlerformats des Backends (API-N-040,
// RFC 9457 "Problem Details", `application/problem+json`). Das Backend liefert
//   { type, title, status, code, detail? }
// — `code` ist maschinenlesbar, `title` für Menschen lesbar.

import { AppError, type AppErrorKind } from '@/errors/AppError';

interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  code?: string;
  detail?: string;
}

function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('title' in value || 'code' in value || 'status' in value)
  );
}

function kindForStatus(status: number): AppErrorKind {
  if (status === 404) return 'notFound';
  if (status === 401 || status === 403) return 'unauthorized';
  return 'server';
}

/**
 * Wandelt eine Fehlerantwort des Backends in einen AppError. Entspricht der Rumpf
 * nicht dem dokumentierten Format, entsteht ein `parse`-Fehler statt eines still
 * weiterverarbeiteten Teilergebnisses (SEC-F-060, QA-N-070).
 */
export function problemToAppError(status: number, body: unknown): AppError {
  if (isProblemDetails(body)) {
    return new AppError({
      kind: kindForStatus(body.status ?? status),
      code: body.code,
      message: body.title ?? 'error.server',
      status: body.status ?? status,
      retryable: (body.status ?? status) >= 500 || status === 429,
    });
  }
  return new AppError({
    kind: 'parse',
    message: 'error.unexpectedResponse',
    status,
    retryable: false,
    cause: body,
  });
}
