import {
  datumFuerWochentag,
  imGueltigkeitszeitraum,
  verschiebeDatum,
  verschiebeWoche,
  wochenanfang,
  wochentagVonDatum,
  wocheAusserhalbVorlesungszeit,
  zielWochentagBeimOeffnen,
} from './wochenrechnung';

// 2026-09-04 ist ein Freitag (wie in canteen/tageswahl.test.ts), 2026-08-31 der
// Montag derselben Woche, 2026-09-06 der Sonntag danach.
function mittagUnix(datum: string): number {
  const [y, m, d] = datum.split('-').map(Number);
  return Math.floor(new Date(y!, m! - 1, d!, 12, 0, 0).getTime() / 1000);
}

describe('SCHED-F-480 Wochenanfang und Datum je Wochentag', () => {
  it('ermittelt den Montag der Woche für einen beliebigen Wochentag', () => {
    expect(wochenanfang('2026-09-04')).toBe('2026-08-31');
    expect(wochenanfang('2026-08-31')).toBe('2026-08-31');
    expect(wochenanfang('2026-09-06')).toBe('2026-08-31');
  });

  it('liefert das Datum eines Wochentags innerhalb der Woche', () => {
    expect(datumFuerWochentag('2026-08-31', 'Mon')).toBe('2026-08-31');
    expect(datumFuerWochentag('2026-08-31', 'Fri')).toBe('2026-09-04');
    expect(datumFuerWochentag('2026-08-31', 'Sun')).toBe('2026-09-06');
  });

  it('bestimmt den Wochentag zu einem Datum', () => {
    expect(wochentagVonDatum('2026-09-04')).toBe('Fri');
    expect(wochentagVonDatum('2026-08-31')).toBe('Mon');
    expect(wochentagVonDatum('2026-09-06')).toBe('Sun');
  });

  it('verschiebt ein Datum auch über Monatsgrenzen hinweg korrekt', () => {
    expect(verschiebeDatum('2026-08-31', 1)).toBe('2026-09-01');
    expect(verschiebeDatum('2026-09-01', -1)).toBe('2026-08-31');
  });
});

describe('SCHED-F-490 Blättern über Wochengrenzen', () => {
  it('springt eine Woche vor und wieder zurück zum selben Stand', () => {
    const naechsteWoche = verschiebeWoche('2026-08-31', 1);
    expect(naechsteWoche).toBe('2026-09-07');
    expect(verschiebeWoche(naechsteWoche, -1)).toBe('2026-08-31');
  });

  it('springt mehrere Wochen auf einmal', () => {
    expect(verschiebeWoche('2026-08-31', 3)).toBe('2026-09-21');
  });
});

describe('SCHED-F-500 Gültigkeitszeitraum eines Termins', () => {
  it('zeigt einen Termin in der letzten zutreffenden Woche, aber nicht mehr danach', () => {
    const gueltigBis = mittagUnix('2026-09-02'); // Mittwoch der Woche ab 2026-08-31
    expect(imGueltigkeitszeitraum('2026-08-31', null, gueltigBis)).toBe(true); // Montag derselben Woche
    expect(imGueltigkeitszeitraum('2026-09-02', null, gueltigBis)).toBe(true); // genau der Endtag
    expect(imGueltigkeitszeitraum('2026-09-04', null, gueltigBis)).toBe(false); // Freitag derselben Woche
    expect(imGueltigkeitszeitraum('2026-09-07', null, gueltigBis)).toBe(false); // Montag der Folgewoche
  });

  it('berücksichtigt auch die untere Grenze', () => {
    const gueltigVon = mittagUnix('2026-09-01');
    expect(imGueltigkeitszeitraum('2026-08-31', gueltigVon, null)).toBe(false);
    expect(imGueltigkeitszeitraum('2026-09-01', gueltigVon, null)).toBe(true);
    expect(imGueltigkeitszeitraum('2026-09-02', gueltigVon, null)).toBe(true);
  });

  it('gilt ohne jede Einschränkung als jederzeit gültig', () => {
    expect(imGueltigkeitszeitraum('2026-01-01', null, null)).toBe(true);
  });
});

describe('SCHED-F-510 vorlesungsfreie Woche', () => {
  const semesterVon = mittagUnix('2026-09-07');
  const semesterBis = mittagUnix('2026-12-18');

  it('erkennt eine Woche vor Semesterbeginn als vorlesungsfrei', () => {
    expect(wocheAusserhalbVorlesungszeit('2026-08-31', semesterVon, semesterBis)).toBe(true);
  });

  it('erkennt eine Woche innerhalb des Semesters als regulär', () => {
    expect(wocheAusserhalbVorlesungszeit('2026-09-07', semesterVon, semesterBis)).toBe(false);
  });

  it('erkennt eine Woche nach Semesterende als vorlesungsfrei', () => {
    expect(wocheAusserhalbVorlesungszeit('2026-12-21', semesterVon, semesterBis)).toBe(true);
  });

  it('zeigt ohne bekannte Vorlesungszeit keinen Hinweis (sicherer Rückfall)', () => {
    expect(wocheAusserhalbVorlesungszeit('2026-08-31', null, null)).toBe(false);
  });
});

describe('SCHED-F-150 Zielwochentag beim Öffnen ist an Werktagen immer der aktuelle Tag', () => {
  it('zeigt den aktuellen Werktag unabhängig davon, ob er Termine hat', () => {
    expect(zielWochentagBeimOeffnen('Mon', () => false)).toBe('Mon');
    expect(zielWochentagBeimOeffnen('Fri', () => true)).toBe('Fri');
  });
});

describe('SCHED-F-160 Wochenendtag ohne Termine springt vorwärts, nicht zum vorigen Freitag', () => {
  it('bleibt an einem Wochenendtag mit eigenen Terminen', () => {
    expect(zielWochentagBeimOeffnen('Sat', (wt) => wt === 'Sat')).toBe('Sat');
  });

  it('springt von einem Samstag ohne Termine zum Sonntag, falls dieser Termine hat', () => {
    expect(zielWochentagBeimOeffnen('Sat', (wt) => wt === 'Sun')).toBe('Sun');
  });

  it('springt von einem Samstag ohne Termine über den Sonntag hinweg zum Montag', () => {
    expect(zielWochentagBeimOeffnen('Sat', (wt) => wt === 'Mon')).toBe('Mon');
  });

  it('sucht vorwärts statt fest auf Freitag zu springen (Altverhalten: vorangegangener Freitag)', () => {
    // Nur Donnerstag hat Termine. Das alte Verhalten hätte unabhängig davon immer
    // den vorangegangenen Freitag gezeigt und Donnerstag dabei übersehen.
    expect(zielWochentagBeimOeffnen('Sun', (wt) => wt === 'Thu')).toBe('Thu');
  });

  it('bleibt beim aktuellen Tag, wenn die gesamte Woche keine Termine hat', () => {
    expect(zielWochentagBeimOeffnen('Sat', () => false)).toBe('Sat');
  });
});
