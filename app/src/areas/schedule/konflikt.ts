// Requirements „Konflikthinweis bei festen Terminen", „Kein Konflikthinweis bei
// vorgemerkten Terminen" und „Bewusste Übernahme trotz Konflikt": ermittelt zu
// den Terminen **eines** Tages die kollidierenden Paare und trennt die bewusst
// angenommenen von den offenen. Reine Funktion ohne React, wie alle übrigen
// Module des Bereichs — damit sie ohne Renderer prüfbar bleibt.
//
// Die Annahme trägt das Paar, nicht der einzelne Eintrag (design.md,
// Entscheidung 2): Ein Paar gilt nur als angenommen, wenn **beide** Termine
// einander in `akzeptierteKonflikte` nennen. Eine einseitige Eintragung — etwa
// nachdem der angenommene Gegenpart gelöscht und ein anderer Termin an dieselbe
// Stelle getreten ist — gilt als nicht angenommen und erzeugt einen Hinweis.

import { ueberschneidenSich } from './time';
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
 * und Sichtbarkeit gefiltert). Geprüft werden ausschließlich Termine mit Status
 * „fest": Ein vorgemerkter Termin erzeugt keinen Hinweis, weder gegen einen
 * anderen vorgemerkten noch gegen einen festen.
 */
export function ermittleKonflikte(tagesTermine: readonly PlanEntry[]): Konflikte {
  const feste = tagesTermine.filter((t) => t.status === 'fest');
  const offen: Konfliktpaar[] = [];
  const angenommen: Konfliktpaar[] = [];
  const hinweisIds = new Set<string>();
  const angenommenIds = new Set<string>();

  for (let i = 0; i < feste.length; i++) {
    for (let j = i + 1; j < feste.length; j++) {
      const a = feste[i]!;
      const b = feste[j]!;
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
 * Requirements „Konfliktprüfung paralleler Termine" und „Konfliktprüfung
 * gegenüber angepinnten Terminen" (design.md, Entscheidung 3): Kollidiert
 * *dieser eine* Kandidat mit dem Zwischenstand — dem gesicherten Plan samt
 * allen in der laufenden Sitzung getroffenen, noch ungesicherten
 * Entscheidungen? Angepinnte Termine (eigenes, noch unumgesetztes
 * Requirement) gehen, sobald es sie gibt, in denselben `zwischenstand` ein,
 * ohne dass sich diese Prüfung ändert. Ein Kandidat, zu dem noch keine
 * Entscheidung getroffen wurde, trägt per Konstruktion keinen Eintrag im
 * Zwischenstand und wird deshalb nicht mitgerechnet — die Vollkombinatorik
 * über mehrere gleichzeitig unentschiedene Kandidaten bleibt ausgeschlossen.
 *
 * Requirement „Kein Konflikthinweis bei vorgemerkten Terminen": Diese
 * Funktion prüft — anders als `ermittleKonflikte` für die Wochenansicht —
 * auch gegen vorgemerkte Termine des Zwischenstands, aber als eigene,
 * zurückgenommene Stufe zwischen „konfliktfrei" und „Konflikt": Im
 * Planungsmodus wird gerade entschieden, ob aus dem Vorgemerkten etwas Festes
 * wird, und das ist der Gegenstand der Arbeit, keine Störung.
 */
export type KandidatKonfliktstufe = 'konfliktfrei' | 'konflikt' | 'vorgemerkterKonflikt';

export function pruefeKandidatGegenZwischenstand(
  kandidat: { weekday: Weekday; timeBeginMin: number; timeEndMin: number },
  zwischenstand: readonly PlanEntry[],
): KandidatKonfliktstufe {
  const amTag = zwischenstand.filter((e) => e.weekday === kandidat.weekday);
  const ueberschneidet = (e: PlanEntry) =>
    ueberschneidenSich(kandidat.timeBeginMin, kandidat.timeEndMin, e.timeBeginMin, e.timeEndMin);

  if (amTag.some((e) => e.status === 'fest' && ueberschneidet(e))) return 'konflikt';
  if (amTag.some((e) => e.status === 'vorgemerkt' && ueberschneidet(e))) return 'vorgemerkterKonflikt';
  return 'konfliktfrei';
}
