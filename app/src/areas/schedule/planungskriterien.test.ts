import {
  bewerteEntwurf,
  vergleicheBewertung,
  VOREINSTELLUNGEN,
  zielVorbereitung,
  type EntwurfTermin,
  type KriterienParameter,
} from './planungskriterien';
import type { Weekday } from './typen';

const PARAMETER: KriterienParameter = {
  vorbereitungAllgemeinMin: 30,
  vorbereitungJeArt: {},
  abstandVorlesungUebungMin: 0,
  zeitfenster: null,
};

function t(
  weekday: Weekday,
  von: number,
  bis: number,
  art: EntwurfTermin['art'] = 'V',
  veranstaltung: string | null = 'M1',
): EntwurfTermin {
  return { weekday, timeBeginMin: von, timeEndMin: bis, art, veranstaltung, bezeichnung: veranstaltung ?? 'eigen' };
}

describe('Kriterienrangfolge für die Planung', () => {
  it('Voreinstellung „Fahrten zur Uni" ordnet Uni-Tage vor Anwesenheitszeit und schaltet alles andere ab', () => {
    expect(VOREINSTELLUNGEN.fahrtenZurUni).toEqual(['uniTage', 'anwesenheitszeit']);
  });

  it('kennt genau die fünf benannten Voreinstellungen mit ihren festen Reihenfolgen', () => {
    expect(VOREINSTELLUNGEN).toEqual({
      zeitAnDerUni: ['anwesenheitszeit'],
      fahrtenZurUni: ['uniTage', 'anwesenheitszeit'],
      ausgeglicheneWoche: ['gleichmaessigeWoche'],
      abstandLerneinheiten: ['abstandLerneinheiten'],
      vorbereitungszeit: ['vorbereitungszeit', 'abstandVorlesungUebung'],
    });
  });

  it('Abwechslung und Zeitfenster gehören zu keiner Voreinstellung', () => {
    const alle = Object.values(VOREINSTELLUNGEN).flat();
    expect(alle).not.toContain('abwechslung');
    expect(alle).not.toContain('zeitfenster');
  });
});

describe('Reihung nach der Kriterienrangfolge', () => {
  const basis = [t('Mon', 480, 570), t('Tue', 480, 570)];
  // Option A: am Montag direkt anschließend — zwei Uni-Tage, aber lange Spanne nicht nötig.
  const optionMontag = t('Mon', 960, 1050, 'Ü');
  // Option B: neuer Mittwoch — drei Uni-Tage, kürzeste Spanne je Tag.
  const optionMittwoch = t('Wed', 480, 570, 'Ü');

  it('Uni-Tage vor Anwesenheitszeit: der Termin mit den wenigsten Uni-Tagen steht vorn, auch bei längerer Anwesenheit', () => {
    const rangfolge = VOREINSTELLUNGEN.fahrtenZurUni;
    const a = bewerteEntwurf([...basis, optionMontag], [optionMontag], rangfolge, PARAMETER);
    const b = bewerteEntwurf([...basis, optionMittwoch], [optionMittwoch], rangfolge, PARAMETER);
    expect(a[0]).toBe(2);
    expect(b[0]).toBe(3);
    expect(a[1]).toBeGreaterThan(b[1]!);
    expect(vergleicheBewertung(a, b)).toBeLessThan(0);
  });

  it('Gleichstand im obersten Kriterium: die kürzere Anwesenheitszeit entscheidet', () => {
    const rangfolge = VOREINSTELLUNGEN.fahrtenZurUni;
    const frueh = t('Mon', 570, 660, 'Ü');
    const spaet = t('Mon', 960, 1050, 'Ü');
    const a = bewerteEntwurf([...basis, frueh], [frueh], rangfolge, PARAMETER);
    const b = bewerteEntwurf([...basis, spaet], [spaet], rangfolge, PARAMETER);
    expect(a[0]).toBe(b[0]);
    expect(vergleicheBewertung(a, b)).toBeLessThan(0);
  });

  it('Übung vor der zugehörigen Vorlesung ist schlechter als jeder Termin nach der Vorlesung', () => {
    const parameter = { ...PARAMETER, abstandVorlesungUebungMin: 5 * 24 * 60 };
    const vorlesung = t('Wed', 480, 570, 'V');
    const davor = t('Tue', 480, 570, 'Ü');
    const knappDanach = t('Wed', 600, 690, 'Ü');
    const a = bewerteEntwurf([vorlesung, davor], [davor], ['abstandVorlesungUebung'], parameter);
    const b = bewerteEntwurf([vorlesung, knappDanach], [knappDanach], ['abstandVorlesungUebung'], parameter);
    expect(vergleicheBewertung(b, a)).toBeLessThan(0);
  });

  it('gleichmäßige Woche misst den Unterschied der Tagesspannen', () => {
    const entwurf = [t('Mon', 480, 600), t('Tue', 480, 780)];
    expect(bewerteEntwurf(entwurf, [], ['gleichmaessigeWoche'], PARAMETER)).toEqual([180]);
  });

  it('Abstand zwischen Lerneinheiten: größer ist besser, ohne Nachbarn maximal', () => {
    const nachbar = t('Mon', 480, 570);
    const eng = t('Mon', 585, 675, 'Ü');
    const weit = t('Mon', 720, 810, 'Ü');
    const allein = t('Tue', 480, 570, 'Ü');
    const r = (o: EntwurfTermin) => bewerteEntwurf([nachbar, o], [o], ['abstandLerneinheiten'], PARAMETER);
    expect(vergleicheBewertung(r(weit), r(eng))).toBeLessThan(0);
    expect(vergleicheBewertung(r(allein), r(weit))).toBeLessThan(0);
  });

  it('Abwechslung zählt unmittelbar aufeinanderfolgende Termine gleicher Art', () => {
    const entwurf = [t('Mon', 480, 570, 'V'), t('Mon', 600, 690, 'V'), t('Mon', 700, 790, 'P')];
    expect(bewerteEntwurf(entwurf, [], ['abwechslung'], PARAMETER)).toEqual([1]);
  });

  it('wertet streng der Reihe nach, ohne Toleranz', () => {
    expect(vergleicheBewertung([2, 1000], [2, 999])).toBeGreaterThan(0);
    expect(vergleicheBewertung([1, 9999], [2, 0])).toBeLessThan(0);
    expect(vergleicheBewertung([3, 3], [3, 3])).toBe(0);
  });
});

describe('Vorbereitungszeit je Veranstaltungsart', () => {
  const parameter = { ...PARAMETER, vorbereitungAllgemeinMin: 15, vorbereitungJeArt: { P: 60 } };

  it('verwendet den abweichenden Wert für Praktika und den allgemeinen für alle übrigen Arten', () => {
    expect(zielVorbereitung('P', parameter)).toBe(60);
    expect(zielVorbereitung('Ü', parameter)).toBe(15);
    expect(zielVorbereitung('V', parameter)).toBe(15);
  });

  it('verwendet für eine unbekannte Veranstaltungsart und eigene Termine den allgemeinen Wert', () => {
    expect(zielVorbereitung('XY', parameter)).toBe(15);
    expect(zielVorbereitung(null, parameter)).toBe(15);
  });

  it('misst den Fehlbetrag vor jedem Termin außer dem ersten des Tages', () => {
    // Praktikum 30 min nach der Vorlesung: Ziel 60, Fehlbetrag 30. Erster Termin zählt nicht.
    const entwurf = [t('Mon', 480, 570, 'V'), t('Mon', 600, 690, 'P')];
    expect(bewerteEntwurf(entwurf, [], ['vorbereitungszeit'], parameter)).toEqual([30]);
  });

  it('ein Praktikum als erster Termin des Tages gilt als erfüllt', () => {
    expect(bewerteEntwurf([t('Mon', 480, 570, 'P')], [], ['vorbereitungszeit'], parameter)).toEqual([0]);
  });
});
