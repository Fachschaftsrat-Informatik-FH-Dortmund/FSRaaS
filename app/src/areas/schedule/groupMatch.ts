// SCHED-F-050 bis SCHED-F-090: Gruppenzuordnung. Prüft, ob ein `studentSet`-Wert
// aus INT-002 eine Gruppenkennung (Muster `^[A-Z][0-9]+$`, SCHED-F-040) einschließt.
// Die Beispieltabelle in `openspec/specs/schedule/spec.md` Abschnitt 4 ist die
// verbindliche Testvorgabe (QA-F-030) — siehe `groupMatch.test.ts`. Reine Funktion
// ohne React.
//
// Vier `studentSet`-Formen kommen laut Live-Befund (integrations.md, INT-002) vor:
//   - Wildcard `*`                          → gilt für jede Gruppenkennung (F-060).
//   - Einzelwert, mit oder ohne Zahl (`C8`, `D`) → nur der Buchstabe zählt (F-070).
//   - Bereich `A1-C9`, an einer oder beiden Grenzen ohne Zahl (`A-P`, `C5-E`) → die
//     Zahl wird numerisch, nicht zeichenweise verglichen (F-080), eine Grenze ohne
//     Zahl gilt als offen (F-090).
//   - alles andere (z. B. `A1B2`) ist ein unbekanntes Muster → sicherer Rückfall auf
//     „gruppenzugehörig", Vorfall protokolliert (SEC-F-060).

import { logError } from '@/errors/AppError';

interface Grenze {
  buchstabe: string;
  /** `null` = Grenze ist offen (F-090): jede Zahl auf diesem Buchstaben zählt. */
  zahl: number | null;
}

export type GeparstesStudentSet =
  | { art: 'wildcard' }
  | { art: 'einzelwert'; buchstabe: string }
  | { art: 'bereich'; von: Grenze; bis: Grenze }
  | { art: 'unbekannt'; roh: string };

interface GeparsteGruppenkennung {
  buchstabe: string;
  /** `null` = Kennung ohne Zahl, also unvollständig — die Zahl wird nicht angenommen. */
  zahl: number | null;
}

const MUSTER_EINZELWERT = /^([A-Za-z])([0-9]*)$/;
const MUSTER_BEREICH = /^([A-Za-z])([0-9]*)-([A-Za-z])([0-9]*)$/;
// SCHED-F-040/F-720 (entschieden 2026-09-06): Buchstabe und Zahl sind beide
// verpflichtend. Die zwischenzeitliche Erweiterung auf eine freiwillige Zahl
// (`[0-9]*`, 2026-09-04) ist zurückgenommen — fünf der 21 real vorkommenden
// `studentSet`-Werte tragen eine Zahl an einer Bereichsgrenze (`C5-E`, `M5-P`,
// `J-M4`, `H5-J`, `F-H4`), an der sie mitentscheidet.
//
// Eine Kennung ohne Zahl kann die Eingabe deshalb nicht mehr erzeugen, aus
// einem älteren gerätelokalen Stand oder einer unerwarteten INT-019-Antwort
// aber weiterhin vorliegen. Sie wird als unvollständig geführt (`zahl: null`)
// statt die fehlende Zahl als `0` zu lesen: `Number('')` ergab 0, wodurch eine
// Kennung `H` an der Grenze `H5-J` wegen 0 < 5 fälschlich als gruppenfremd
// galt und bei aktivem Ausblenden-Schalter aus dem Plan verschwand.
const MUSTER_GRUPPENKENNUNG = /^([A-Za-z])([0-9]+)$/;
/** Restfall einer Kennung ohne Zahl — seit dem 2026-09-06 unzulässig, aber nicht ausgeschlossen. */
const MUSTER_GRUPPENKENNUNG_UNVOLLSTAENDIG = /^([A-Za-z])$/;

function alsZahlOderOffen(text: string): number | null {
  return text === '' ? null : Number(text);
}

/** Parst einen `studentSet`-Rohwert in eine der vier bekannten Formen. */
export function parseStudentSet(roh: string): GeparstesStudentSet {
  if (roh === '*') return { art: 'wildcard' };

  const einzelwert = MUSTER_EINZELWERT.exec(roh);
  if (einzelwert) {
    return { art: 'einzelwert', buchstabe: einzelwert[1]!.toUpperCase() };
  }

  const bereich = MUSTER_BEREICH.exec(roh);
  if (bereich) {
    return {
      art: 'bereich',
      von: { buchstabe: bereich[1]!.toUpperCase(), zahl: alsZahlOderOffen(bereich[2]!) },
      bis: { buchstabe: bereich[3]!.toUpperCase(), zahl: alsZahlOderOffen(bereich[4]!) },
    };
  }

  return { art: 'unbekannt', roh };
}

function parseGruppenkennung(kennung: string): GeparsteGruppenkennung | null {
  const treffer = MUSTER_GRUPPENKENNUNG.exec(kennung);
  if (treffer) return { buchstabe: treffer[1]!.toUpperCase(), zahl: Number(treffer[2]!) };

  const unvollstaendig = MUSTER_GRUPPENKENNUNG_UNVOLLSTAENDIG.exec(kennung);
  if (unvollstaendig) return { buchstabe: unvollstaendig[1]!.toUpperCase(), zahl: null };

  return null;
}

/**
 * SCHED-F-080/090: liegt (Buchstabe, Zahl) im durch `von`/`bis` aufgespannten Bereich?
 *
 * Der Buchstabe entscheidet zuerst und allein, wenn er außerhalb liegt — auch bei
 * einer unvollständigen Kennung. Erst danach kommt die Zahl ins Spiel. Fehlt sie,
 * ist eine Grenze *mit* Zahl nicht entscheidbar: Der Termin gilt dann als zugehörig
 * und der Vorfall wird protokolliert (SEC-F-060, „sichtbar statt fälschlich als
 * fremd markiert"), statt eine Zahl anzunehmen.
 */
function liegtImBereich(gruppe: GeparsteGruppenkennung, von: Grenze, bis: Grenze): boolean {
  if (gruppe.buchstabe < von.buchstabe || gruppe.buchstabe > bis.buchstabe) return false;

  if (gruppe.zahl === null) {
    const grenzeMitZahl =
      (gruppe.buchstabe === von.buchstabe && von.zahl !== null) ||
      (gruppe.buchstabe === bis.buchstabe && bis.zahl !== null);
    if (grenzeMitZahl) {
      logError('groupMatch.gruppenkennung', new Error('unvollständige Gruppenkennung an einer Grenze mit Zahl'));
    }
    return true;
  }

  if (gruppe.buchstabe === von.buchstabe && von.zahl !== null && gruppe.zahl < von.zahl) return false;
  if (gruppe.buchstabe === bis.buchstabe && bis.zahl !== null && gruppe.zahl > bis.zahl) return false;
  return true;
}

/**
 * SCHED-F-050 bis SCHED-F-090: Ist ein Termin mit gegebenem `studentSet` der
 * angegebenen Gruppenkennung zugehörig? `gruppenkennung` ist `null`/leer, solange
 * keine Gruppenkennung eingegeben wurde — dann gilt jeder Termin als zugehörig
 * (SCHED-F-050). Ein unbekanntes Muster — bei `studentSet` oder, defensiv, bei der
 * Gruppenkennung selbst — fällt sicher auf „zugehörig" zurück und wird protokolliert
 * (SEC-F-060, Abschnitt 9 der Spec: „sichtbar statt fälschlich als fremd markiert").
 */
export function gruppenzugehoerig(gruppenkennung: string | null | undefined, studentSet: string): boolean {
  if (!gruppenkennung) return true; // SCHED-F-050

  const geparst = parseStudentSet(studentSet);
  if (geparst.art === 'wildcard') return true; // SCHED-F-060
  if (geparst.art === 'unbekannt') {
    logError('groupMatch.studentSet', new Error('unbekanntes studentSet-Muster'));
    return true;
  }

  const gruppe = parseGruppenkennung(gruppenkennung);
  if (!gruppe) {
    logError('groupMatch.gruppenkennung', new Error('unbekanntes Gruppenkennung-Muster'));
    return true;
  }

  if (geparst.art === 'einzelwert') return gruppe.buchstabe === geparst.buchstabe; // SCHED-F-070
  return liegtImBereich(gruppe, geparst.von, geparst.bis); // SCHED-F-080/090
}

/** Ergebnis von {@link zaehleGruppenTreffer}: wie viele von `gesamt` Terminen eingeschlossen sind. */
export interface Gruppentreffer {
  eingeschlossen: number;
  gesamt: number;
}

/**
 * SCHED-F-650: Während der Eingabe einer Gruppenkennung zurückmelden, wie
 * viele Termine des übergebenen Auswahlbestands sie einschließt (Ergebnis von
 * {@link gruppenzugehoerig} je Termin). Der Fall „0 von N" ist ein reguläres
 * Ergebnis, kein Fehler — die Funktion wirft nie und meldet ihn wie jeden
 * anderen Zählwert.
 */
export function zaehleGruppenTreffer(
  gruppenkennung: string | null | undefined,
  termine: readonly { studentSet: string }[],
): Gruppentreffer {
  const gesamt = termine.length;
  const eingeschlossen = termine.reduce(
    (anzahl, termin) => (gruppenzugehoerig(gruppenkennung, termin.studentSet) ? anzahl + 1 : anzahl),
    0,
  );
  return { eingeschlossen, gesamt };
}
