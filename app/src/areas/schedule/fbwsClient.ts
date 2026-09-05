// Schlanker Direktabruf gegen den FBWS-Dienst der FH Dortmund (INT-001, INT-002,
// `openspec/specs/integrations/spec.md`). FBWS steht — anders als das eigene Backend
// (INT-008) — nicht im OpenAPI-Vertrag; `openapi-fetch`/`@/net/client`s `api`
// greift dort nicht. Dieses Modul nutzt daher `fetchWithTimeout` unmittelbar
// (NFR-F-070 bleibt dadurch gewahrt) und wirft bei jeder Fehlerantwort einen
// `AppError`, genau wie `unwrap()` es für den eigenen Vertrag tut (API-N-040).
// Ausschließlich HTTPS (SEC-N-030) — der feste Pfad unten ist mit `/timetable/`
// bereits die für die Neuentwicklung verbindliche Korrektur aus INT-001.
// Keine stillen Fehler (SEC-F-060): jede unerwartete Struktur wird protokolliert
// und der betroffene Eintrag verworfen, nie ein leerer Bestand ohne Hinweis.

import { AppError, logError } from '@/errors/AppError';
import { fetchWithTimeout } from '@/net/client';

const FBWS_BASIS = 'https://ws.inf.fh-dortmund.de/timetable/current/rest';

if (!FBWS_BASIS.startsWith('https://')) {
  // Nie erreichbar, da der Wert oben fest verdrahtet ist — schützt trotzdem
  // vor einer künftigen, versehentlich unverschlüsselten Änderung (SEC-N-030).
  throw new Error('FBWS_BASIS muss https:// sein');
}

/** Ein FBWS-Studiengang aus INT-001, bereits auf die drei relevanten Felder reduziert. */
export interface FbwsStudiengang {
  name: string;
  sname: string;
  /** Fachsemester des Studiengangs (INT-001 `grades[].grade`), als Zeichenketten. */
  grades: string[];
}

async function holeJson(url: string, kontext: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchWithTimeout(url);
  } catch (error) {
    throw AppError.from(error);
  }

  if (!response.ok) {
    throw new AppError({
      kind: response.status === 404 ? 'notFound' : 'server',
      message: 'error.fbws',
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  try {
    return await response.json();
  } catch (error) {
    throw logError(kontext, error);
  }
}

/**
 * INT-001: Studiengänge mit Fachsemestern. Die Antwort ist eine Map (kein
 * Array); Einträge mit `grades: null` werden verworfen (INT-001-Vorgabe).
 * Ein Eintrag mit unerwarteter Struktur wird protokolliert und übersprungen,
 * statt den gesamten Abruf scheitern zu lassen (SEC-F-060).
 */
export async function holeStudiengaenge(): Promise<FbwsStudiengang[]> {
  const roh = await holeJson(
    `${FBWS_BASIS}/CourseOfStudy/?Accept=application/json`,
    'fbwsClient.studiengaenge.parse',
  );

  if (typeof roh !== 'object' || roh === null || Array.isArray(roh)) {
    throw logError('fbwsClient.studiengaenge.form', new Error('erwartetes Objekt (Map) fehlt'));
  }

  const ergebnis: FbwsStudiengang[] = [];
  for (const eintrag of Object.values(roh as Record<string, unknown>)) {
    if (typeof eintrag !== 'object' || eintrag === null) {
      logError('fbwsClient.studiengang.form', new Error('Eintrag ist kein Objekt'));
      continue;
    }
    const { name, sname, grades } = eintrag as Record<string, unknown>;
    if (grades === null || grades === undefined) continue; // INT-001: bewusst verworfen

    if (typeof name !== 'string' || typeof sname !== 'string' || !Array.isArray(grades)) {
      logError('fbwsClient.studiengang.form', new Error('unerwartete Feldtypen'));
      continue;
    }

    const gradeListe = grades
      .map((g) => (typeof g === 'object' && g !== null && 'grade' in g ? (g as { grade: unknown }).grade : null))
      .filter((g): g is string | number => g !== null && g !== undefined)
      .map((g) => String(g));

    ergebnis.push({ name, sname, grades: gradeListe });
  }
  return ergebnis;
}

/**
 * INT-002: Rohtermine eines Studiengang/Semester-Paars, `studentSet=*` (die
 * Gruppenfilterung erfolgt clientseitig, siehe `groupMatch.ts`). Für den
 * Wahlpflicht-Planungsmodus (SCHED-F-400) wird mit `sname="WFPB"`,
 * `grade="*"` abgerufen — technisch derselbe Endpunkt. Normalisierung der
 * Rohsätze ist Sache von `normalize.ts`, nicht dieses Moduls.
 */
export async function holeTermine(sname: string, grade: string): Promise<Record<string, unknown>[]> {
  const url =
    `${FBWS_BASIS}/CourseOfStudy/${encodeURIComponent(sname)}/${encodeURIComponent(grade)}/Events` +
    `?Accept=application/json&studentSet=*`;
  const roh = await holeJson(url, 'fbwsClient.termine.parse');

  if (!Array.isArray(roh)) {
    throw logError('fbwsClient.termine.form', new Error('erwartete Liste fehlt'));
  }
  return roh as Record<string, unknown>[];
}

/**
 * INT-019: ermittelt die vom Fachbereich zugeteilte Gruppenkennung zu einer
 * Matrikelnummer (SCHED-F-690). Der Dienst antwortet in drei Gestalten, alle
 * mit Status 200 — `{"fhDoStudentSet":"O7"}` (Kennung gefunden),
 * `{"fhDoStudentSet":false}` (keine Kennung hinterlegt) und `[]` (kein
 * Datensatz). Ausgewertet wird ausschließlich auf eine nicht-leere
 * Zeichenkette, nicht auf Vorhandensein des Felds und nicht auf Wahrheitswert
 * (`false` und `undefined` sind beide falsy, aber nur eine Zeichenkette ist
 * eine Kennung) — die beiden „nicht gefunden"-Gestalten liefern deshalb
 * gleichermaßen `null`, nie einen Fehler (SCHED-F-700). Nicht
 * zwischengespeichert (integrations.md INT-019).
 */
export async function holeGruppenkennungZuMatrikelnummer(matrikelnummer: string): Promise<string | null> {
  const url = `${FBWS_BASIS}/Student/${encodeURIComponent(matrikelnummer)}/Set?Accept=application/json`;
  const roh = await holeJson(url, 'fbwsClient.gruppenkennung.parse');

  if (Array.isArray(roh)) return null; // INT-019: leere Liste = kein Datensatz

  if (typeof roh !== 'object' || roh === null) {
    throw logError('fbwsClient.gruppenkennung.form', new Error('erwartetes Objekt fehlt'));
  }

  const wert = (roh as Record<string, unknown>).fhDoStudentSet;
  return typeof wert === 'string' && wert !== '' ? wert : null; // false/undefined → nicht gefunden
}
