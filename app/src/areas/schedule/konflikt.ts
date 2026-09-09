// Requirements „Konflikthinweis bei überschneidenden Terminen", „Wirkung eines
// deaktivierten Termins" und „Bewusste Übernahme trotz Konflikt": ermittelt zu
// den Terminen **eines** Tages die kollidierenden Paare und trennt die bewusst
// angenommenen von den offenen. Reine Funktion ohne React, wie alle übrigen
// Module des Bereichs — damit sie ohne Renderer prüfbar bleibt.
//
// Die Annahme trägt das Paar, nicht der einzelne Eintrag (design.md,
// Entscheidung 2): Ein Paar gilt nur als angenommen, wenn **beide** Termine
// einander in `akzeptierteKonflikte` nennen. Eine einseitige Eintragung — etwa
// nachdem der angenommene Gegenpart gelöscht und ein anderer Termin an dieselbe
// Stelle getreten ist — gilt als nicht angenommen und erzeugt einen Hinweis.

import { istAktiv, ueberschneidenSich } from './time';
import type { PlanEntry, Weekday } from './typen';

export interface Konfliktpaar {
  a: PlanEntry;
  b: PlanEntry;
}

export interface Konflikte {
  /** Kollidierende Paare ohne beidseitige Annahme — sie erzeugen einen Konflikthinweis. */
  offen: Konfliktpaar[];
  /** Kollidierende Paare, die beide Termine einander nennen — allein die Kennzeichnung „angenommener Konflikt". */
  angenommen: Konfliktpaar[];
  /** Kennungen der Termine mit mindestens einem offenen Konflikt. */
  hinweisIds: Set<string>;
  /** Kennungen der Termine mit mindestens einem angenommenen Konflikt. */
  angenommenIds: Set<string>;
}

/** Ein Paar gilt nur als angenommen, wenn beide Termine einander nennen. */
function istAngenommen(a: PlanEntry, b: PlanEntry): boolean {
  return a.akzeptierteKonflikte.includes(b.id) && b.akzeptierteKonflikte.includes(a.id);
}

/**
 * Ermittelt die Konflikte unter den Terminen eines Tages (bereits nach Wochentag
 * und Sichtbarkeit gefiltert). Geprüft werden ausschließlich aktive Termine
 * (`istAktiv`, `time.ts`): Ein deaktivierter Termin erzeugt keinen Hinweis,
 * weder gegen einen anderen deaktivierten noch gegen einen aktiven
 * (Requirement „Wirkung eines deaktivierten Termins").
 */
export function ermittleKonflikte(tagesTermine: readonly PlanEntry[], jetztSek: number): Konflikte {
  const aktive = tagesTermine.filter((t) => istAktiv(t, jetztSek));
  const offen: Konfliktpaar[] = [];
  const angenommen: Konfliktpaar[] = [];
  const hinweisIds = new Set<string>();
  const angenommenIds = new Set<string>();

  for (let i = 0; i < aktive.length; i++) {
    for (let j = i + 1; j < aktive.length; j++) {
      const a = aktive[i]!;
      const b = aktive[j]!;
      if (!ueberschneidenSich(a.timeBeginMin, a.timeEndMin, b.timeBeginMin, b.timeEndMin)) continue;
      if (istAngenommen(a, b)) {
        angenommen.push({ a, b });
        angenommenIds.add(a.id);
        angenommenIds.add(b.id);
      } else {
        offen.push({ a, b });
        hinweisIds.add(a.id);
        hinweisIds.add(b.id);
      }
    }
  }

  return { offen, angenommen, hinweisIds, angenommenIds };
}

/**
 * Requirement „Konfliktprüfung paralleler Termine" (design.md, Entscheidung 3
 * und 5): Kollidiert *dieser eine* Kandidat mit dem Zwischenstand — dem
 * gesicherten Plan samt allen in der laufenden Sitzung getroffenen, noch
 * ungesicherten Entscheidungen? Ein Kandidat, zu dem noch keine Entscheidung
 * getroffen wurde, trägt per Konstruktion keinen Eintrag im Zwischenstand und
 * wird deshalb nicht mitgerechnet — die Vollkombinatorik über mehrere
 * gleichzeitig unentschiedene Kandidaten bleibt ausgeschlossen.
 *
 * Deaktivierte Termine des gesicherten Plans zählen dabei nicht als
 * Bezugsgröße (Requirement „Konfliktprüfung paralleler Termine", Szenario
 * „Kollision mit einem deaktivierten Termin"); in der Sitzung neu gewählte
 * Termine sind stets aktiv. Nur zwei Stufen: konfliktfrei oder kollidierend —
 * die dritte Stufe für vorgemerkte Termine entfällt mit dem Status selbst.
 */
export type KandidatKonfliktstufe = 'konfliktfrei' | 'konflikt';

export function pruefeKandidatGegenZwischenstand(
  kandidat: { weekday: Weekday; timeBeginMin: number; timeEndMin: number },
  zwischenstand: readonly PlanEntry[],
  jetztSek: number,
): KandidatKonfliktstufe {
  const amTag = zwischenstand.filter((e) => e.weekday === kandidat.weekday && istAktiv(e, jetztSek));
  const ueberschneidet = (e: PlanEntry) =>
    ueberschneidenSich(kandidat.timeBeginMin, kandidat.timeEndMin, e.timeBeginMin, e.timeEndMin);

  return amTag.some(ueberschneidet) ? 'konflikt' : 'konfliktfrei';
}
