// Einheitlicher App-Fehlertyp und die Regel dahinter: Ein Fehler darf nie
// stillschweigend verschwinden (SEC-F-060). Jede Stelle, die einen Fehler
// abfängt, ohne ihn weiterzureichen, protokolliert ihn über logError().

export type AppErrorKind =
  | 'offline' // keine Netzwerkverbindung
  | 'timeout' // Netzabruf hat die Zeitgrenze überschritten (NFR-F-070)
  | 'server' // Backend hat einen Fehler geliefert (RFC 9457, API-N-040)
  | 'notFound' // 404
  | 'unauthorized' // 401/403
  | 'auth' // Anmeldung fehlgeschlagen, abgebrochen oder nicht eingerichtet (INT-012)
  | 'parse' // Antwort entsprach nicht der erwarteten Struktur
  | 'unknown';

export interface AppErrorInit {
  kind: AppErrorKind;
  /** Maschinenlesbarer Code aus der Backend-Antwort (API-N-040), falls vorhanden. */
  code?: string;
  /** Für Menschen lesbare Meldung (bereits lokalisiert oder i18n-Schlüssel). */
  message: string;
  /** HTTP-Status, falls zutreffend. */
  status?: number;
  /** Ob ein erneuter Versuch sinnvoll ist (steuert die Wiederholen-Option). */
  retryable: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly code?: string;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(init: AppErrorInit) {
    super(init.message, { cause: init.cause });
    this.name = 'AppError';
    this.kind = init.kind;
    this.code = init.code;
    this.status = init.status;
    this.retryable = init.retryable;
  }

  static from(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new AppError({ kind: 'timeout', message: 'error.timeout', retryable: true, cause: error });
    }
    if (error instanceof TypeError) {
      // fetch wirft TypeError bei Netzwerkproblemen.
      return new AppError({ kind: 'offline', message: 'error.offline', retryable: true, cause: error });
    }
    return new AppError({
      kind: 'unknown',
      message: 'error.unknown',
      retryable: true,
      cause: error,
    });
  }
}

/**
 * Protokolliert einen Fehler, ohne ihn zu verschlucken (SEC-F-060). Gibt den
 * Fehler zurück, damit Aufrufer ihn weiterwerfen können:
 *   catch (e) { throw logError('mensa.laden', e); }
 * Protokolle enthalten keine personenbezogenen Inhalte (SEC-N-120) — daher nur
 * Kontext-Label und Fehlerform, keine Nutzdaten.
 */
export function logError(context: string, error: unknown): AppError {
  const appError = AppError.from(error);
  // console.error ist hier bewusst gewollt (SEC-F-060) und in eslint.config.js erlaubt.
  console.error(`[${context}] ${appError.kind}${appError.code ? ` (${appError.code})` : ''}`);
  return appError;
}
