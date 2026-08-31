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

/** Kein verwertbarer Fehlerrumpf (leer / null) — dann zählt allein der Status. */
function isEmptyBody(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function kindForStatus(status: number): AppErrorKind {
  if (status === 404) return 'notFound';
  if (status === 401 || status === 403) return 'unauthorized';
  return 'server';
}

function messageForStatus(status: number): string {
  if (status === 404) return 'error.notFound';
  if (status === 401 || status === 403) return 'error.unauthorized';
  return 'error.server';
}

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

/**
 * Wandelt eine Fehlerantwort des Backends in einen AppError.
 *
 * - Rumpf im dokumentierten RFC-9457-Format → Code und Meldung daraus.
 * - Kein Rumpf (leer/null) → Einordnung allein über den HTTP-Status.
 * - Rumpf vorhanden, aber nicht formatkonform (z. B. HTML-Fehlerseite,
 *   abgeschnittenes JSON) → `parse`-Fehler, damit die Abweichung sichtbar wird
 *   statt still weiterverarbeitet zu werden (SEC-F-060, QA-N-070).
 */
export function problemToAppError(status: number, body: unknown): AppError {
  if (isProblemDetails(body)) {
    const effective = body.status ?? status;
    return new AppError({
      kind: kindForStatus(effective),
      code: body.code,
      message: body.title ?? messageForStatus(effective),
      status: effective,
      retryable: isRetryable(effective),
    });
  }
  if (isEmptyBody(body)) {
    return new AppError({
      kind: kindForStatus(status),
      message: messageForStatus(status),
      status,
      retryable: isRetryable(status),
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
