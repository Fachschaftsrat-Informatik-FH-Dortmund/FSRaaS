// Requirement „Gliederung der Modulauswahl nach Fachsemester"
// (`openspec/specs/schedule/spec.md`). Verdichtet den flachen INT-002-
// Terminbestand mehrerer gewählter Endpunkte zu Modulen (Gruppierungsschlüssel
// `courseId`, Rückfall auf `name`, wie schon vor diesem Change) und gliedert
// sie in Abschnitte: je Modul das Fachsemester, wenn seine Termine eines
// tragen — sonst der Name des Endpunkts, aus dem es stammt (Bachelor-
// Endpunkte mit echter Fachsemesterliste liefern verwertbare `grade`-Werte;
// Master, Blockwochen, Tutorien, Seminare und Wahlpflicht liefern
// durchgängig `grade: 0`, dort trennt eine Fachsemester-Gliederung nichts).
// Reine Funktion ohne React; Vorbild `canteen/consolidate.ts` (Gruppierung
// mit stabiler Eingabereihenfolge über eine `Map`).

import type { OfficialTermin } from './typen';

/** Alle Termine eines gewählten Endpunkts, mit dessen Klarnamen für den Abschnitts-Rückfall. */
export interface EndpunktTermine {
  sname: string;
  name: string;
  termine: readonly OfficialTermin[];
}

/** Ein Modul im Auswahlbestand — die Rohtermine bleiben erhalten (Grundlage der späteren Veranstaltungsart-/Slot-Wahl im Planungsmodus). */
export interface Modul {
  /** Gruppierungsschlüssel: `courseId`, ersatzweise `name`. */
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

function modulSchluessel(termin: OfficialTermin): string {
  return termin.courseId.trim() !== '' ? termin.courseId : termin.name;
}

/**
 * Baut den Auswahlbestand als Module gegliedert in Abschnitte (Requirement
 * „Gliederung der Modulauswahl nach Fachsemester"). Ein Modul, dessen Termine
 * mehr als ein auswertbares Fachsemester tragen — sollte das je vorkommen —,
 * fällt ebenfalls auf den Endpunktnamen zurück, da ein einzelner Abschnitt es
 * dann nicht eindeutig trüge. Reihenfolge folgt der Eingabereihenfolge der
 * Endpunkte und ihrer Termine (stabile Gruppierung, kein Sortieren), nur die
 * Fachsemester-Abschnitte werden zusätzlich numerisch vorangestellt.
 */
export function baueModulliste(perEndpunkt: readonly EndpunktTermine[]): ModulAbschnitt[] {
  interface ModulAccum {
    index: number;
    courseId: string;
    name: string;
    termine: OfficialTermin[];
    grades: Set<string>;
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
          name: termin.name,
          termine: [],
          grades: new Set(),
          erstesEndpunkt: { sname: endpunkt.sname, name: endpunkt.name },
        };
        module.set(schluessel, m);
      }
      m.termine.push(termin);
      if (termin.grade && termin.grade !== '0') m.grades.add(termin.grade);
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
    const gradeListe = [...m.grades];
    const grade = gradeListe.length === 1 ? gradeListe[0]! : null;
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
    a.module.push({ key: schluessel, courseId: m.courseId, name: m.name, termine: m.termine });
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
