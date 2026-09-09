// Requirement „Gliederung der Modulauswahl nach Fachsemester" und
// „Anzeigename paralleler Termingruppen ohne bedeutungslose Endzahl"
// (`openspec/specs/schedule/spec.md`). Verdichtet den flachen INT-002-
// Terminbestand mehrerer gewählter Endpunkte zu Modulen (Gruppierungsschlüssel
// `courseId` und Fachsemester, Rückfall auf `name` statt `courseId`) und
// gliedert sie in Abschnitte: je Modul das Fachsemester, wenn seine Termine
// eines tragen — sonst der Name des Endpunkts, aus dem es stammt (Bachelor-
// Endpunkte mit echter Fachsemesterliste liefern verwertbare `grade`-Werte;
// Master, Blockwochen, Tutorien, Seminare und Wahlpflicht liefern
// durchgängig `grade: 0`, dort trennt eine Fachsemester-Gliederung nichts).
// Da das Fachsemester bereits Teil des Gruppierungsschlüssels ist, trägt ein
// Modul per Konstruktion höchstens ein Fachsemester — ein Wiederholerangebot
// mit abweichendem Fachsemester bildet dadurch ein eigenständiges Modul statt
// mehrdeutig in den Endpunkt-Abschnitt zu fallen. Reine Funktion ohne React;
// Vorbild `canteen/consolidate.ts` (Gruppierung mit stabiler
// Eingabereihenfolge über eine `Map`).

import { logError } from '@/errors/AppError';

import { terminSchluessel } from './planungsstand';
import type { OfficialTermin } from './typen';

/** Alle Termine eines gewählten Endpunkts, mit dessen Klarnamen für den Abschnitts-Rückfall. */
export interface EndpunktTermine {
  sname: string;
  name: string;
  termine: readonly OfficialTermin[];
}

/** Ein Modul im Auswahlbestand — die Rohtermine bleiben erhalten (Grundlage der späteren Veranstaltungsart-/Slot-Wahl im Planungsmodus). */
export interface Modul {
  /** Gruppierungsschlüssel: `courseId` (ersatzweise `name`), gefolgt von `'|'` und dem normalisierten Fachsemester. */
  key: string;
  courseId: string;
  name: string;
  termine: OfficialTermin[];
}

export type ModulAbschnittKennung =
  | { art: 'fachsemester'; grade: string }
  | { art: 'endpunkt'; name: string };

export interface ModulAbschnitt {
  kennung: ModulAbschnittKennung;
  module: Modul[];
}

/** `'0'` und leer gelten beide als „kein auswertbares Fachsemester" und werden auf einen leeren String vereinheitlicht. */
function normalisiertesFachsemester(termin: OfficialTermin): string {
  return termin.grade && termin.grade !== '0' ? termin.grade : '';
}

function modulSchluessel(termin: OfficialTermin): string {
  const basis = termin.courseId.trim() !== '' ? termin.courseId : termin.name;
  return `${basis}|${normalisiertesFachsemester(termin)}`;
}

/** Gemeinsamer Namensstamm einer angehängten Zahl, z. B. „Technisches Englisch 1" → „Technisches Englisch". */
function namensstamm(name: string): string | null {
  const treffer = /^(.*?)\s*\d+$/.exec(name);
  return treffer ? treffer[1]! : null;
}

/**
 * Requirement „Anzeigename paralleler Termingruppen ohne bedeutungslose
 * Endzahl": Tragen die Termine eines Moduls mehrere unterschiedliche Namen,
 * die sich nur durch eine angehängte Zahl unterscheiden und im Namensstamm
 * übereinstimmen, wird der Namensstamm ohne Zahl verwendet. Tritt nur eine
 * einzige Zahl auf (auch mehrfach wiederholt) oder unterscheiden sich die
 * Namen über die Zahl hinaus, bleibt der zuerst beobachtete Name unverändert.
 */
function anzeigename(erstName: string, termine: readonly OfficialTermin[]): string {
  const namen = new Set(termine.map((t) => t.name));
  if (namen.size <= 1) return erstName;

  const staemme = new Set<string>();
  for (const name of namen) {
    const stamm = namensstamm(name);
    if (stamm === null) return erstName;
    staemme.add(stamm);
  }
  if (staemme.size !== 1) return erstName;
  return [...staemme][0]!;
}

/**
 * Baut den Auswahlbestand als Module gegliedert in Abschnitte (Requirement
 * „Gliederung der Modulauswahl nach Fachsemester"). Da das Fachsemester
 * bereits Teil des Gruppierungsschlüssels ist, trägt jedes Modul höchstens
 * ein Fachsemester (oder durchgängig keines, dann Rückfall auf den
 * Endpunktnamen). Reihenfolge folgt der Eingabereihenfolge der Endpunkte und
 * ihrer Termine (stabile Gruppierung, kein Sortieren), nur die
 * Fachsemester-Abschnitte werden zusätzlich numerisch vorangestellt.
 */
export function baueModulliste(perEndpunkt: readonly EndpunktTermine[]): ModulAbschnitt[] {
  interface ModulAccum {
    index: number;
    courseId: string;
    grade: string;
    name: string;
    termine: OfficialTermin[];
    /** Requirement „Zusammenfassen deckungsgleicher Rohtermine" (design.md, Entscheidung 6):
     * bereits aufgenommene Schlüssel dieses Moduls, um einen Rohtermin, der in Veranstaltung,
     * Veranstaltungsart, Wochentag, Zeitraum, Raum und Gruppenmenge übereinstimmt, nicht doppelt
     * zu übernehmen. */
    schluesselGesehen: Set<string>;
    erstesEndpunkt: { sname: string; name: string };
  }

  const module = new Map<string, ModulAccum>();
  let modulIndex = 0;

  for (const endpunkt of perEndpunkt) {
    for (const termin of endpunkt.termine) {
      const schluessel = modulSchluessel(termin);
      let m = module.get(schluessel);
      if (!m) {
        m = {
          index: modulIndex++,
          courseId: termin.courseId,
          grade: normalisiertesFachsemester(termin),
          name: termin.name,
          termine: [],
          schluesselGesehen: new Set(),
          erstesEndpunkt: { sname: endpunkt.sname, name: endpunkt.name },
        };
        module.set(schluessel, m);
      }
      // `terminSchluessel` lässt `name` bewusst außen vor (Grundlage von
      // `terminEntsprichtEintrag`) — für die Anzeigename-Zusammenführung
      // (design.md, Entscheidung 6 dieses Moduls) müssen mehrere Termine
      // *unterschiedlichen* Namens an gleicher Stelle erhalten bleiben. Das
      // Requirement „Zusammenfassen deckungsgleicher Rohtermine" nennt
      // „Veranstaltung" als eigenes Merkmal, deshalb zählt der Name hier mit.
      const terminKennung = `${terminSchluessel(termin)}|${termin.name}`;
      if (m.schluesselGesehen.has(terminKennung)) {
        logError(
          'kursbaum.baueModulliste.deckungsgleich',
          new Error(`deckungsgleicher Rohtermin zusammengefasst: ${terminKennung}`),
        );
        continue;
      }
      m.schluesselGesehen.add(terminKennung);
      m.termine.push(termin);
    }
  }

  interface AbschnittAccum {
    index: number;
    kennung: ModulAbschnittKennung;
    module: Modul[];
  }

  const abschnitte = new Map<string, AbschnittAccum>();
  let abschnittIndex = 0;

  for (const [schluessel, m] of module) {
    const grade = m.grade !== '' ? m.grade : null;
    const abschnittSchluessel = grade !== null ? `fachsemester:${grade}` : `endpunkt:${m.erstesEndpunkt.sname}`;

    let a = abschnitte.get(abschnittSchluessel);
    if (!a) {
      a = {
        index: abschnittIndex++,
        kennung: grade !== null ? { art: 'fachsemester', grade } : { art: 'endpunkt', name: m.erstesEndpunkt.name },
        module: [],
      };
      abschnitte.set(abschnittSchluessel, a);
    }
    a.module.push({ key: schluessel, courseId: m.courseId, name: anzeigename(m.name, m.termine), termine: m.termine });
  }

  return [...abschnitte.values()]
    .sort((a, b) => {
      if (a.kennung.art === 'fachsemester' && b.kennung.art === 'fachsemester') {
        return Number(a.kennung.grade) - Number(b.kennung.grade);
      }
      if (a.kennung.art !== b.kennung.art) return a.kennung.art === 'fachsemester' ? -1 : 1;
      return a.index - b.index;
    })
    .map(({ kennung, module: modListe }) => ({ kennung, module: modListe }));
}
