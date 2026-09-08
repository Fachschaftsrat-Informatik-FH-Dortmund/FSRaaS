import { logError } from '@/errors/AppError';

import { leseDatumsbereichAusName, wendeGueltigkeitszeitraumAn } from './endpunktzeitraum';
import type { OfficialTermin } from './typen';

jest.mock('@/errors/AppError', () => ({
  logError: jest.fn(),
}));

const logErrorMock = jest.mocked(logError);

beforeEach(() => logErrorMock.mockClear());

function termin(überschreibung: Partial<OfficialTermin> = {}): OfficialTermin {
  return {
    courseId: '43054',
    name: 'IT-Landschaft - Planung und Umsetzung',
    courseType: 'V',
    lecturerName: 'Prof. Dr. Recker',
    studentSet: 'A-P',
    roomId: '*',
    weekday: 'Mon',
    timeBeginMin: 560,
    timeEndMin: 745,
    gueltigVon: 1_779_660_000, // von INT-002 geliefert: Semesterbeginn
    gueltigBis: 1_784_930_400, // von INT-002 geliefert: Semesterende
    ...überschreibung,
  };
}

describe('Gültigkeitszeitraum aus dem Endpunktnamen', () => {
  it('Blockwoche mit Zeitraum im Namen: liest Beginn und Ende aus der Klammer am Namensende', () => {
    const bereich = leseDatumsbereichAusName('Blockwoche 1 (13.04.-17.04.2026)');
    expect(bereich).not.toBeNull();
    expect(new Date(bereich!.gueltigVon * 1000).toISOString().slice(0, 10)).toBe('2026-04-13');
    expect(new Date(bereich!.gueltigBis * 1000).toISOString().slice(0, 10)).toBe('2026-04-17');
    expect(logErrorMock).not.toHaveBeenCalled();
  });

  it('Blockwoche mit Zeitraum im Namen: überschreibt den Gültigkeitszeitraum aller Termine des Endpunkts', () => {
    const termine = [termin({ weekday: 'Mon' }), termin({ weekday: 'Wed', courseId: '43099' })];
    const ergebnis = wendeGueltigkeitszeitraumAn(termine, 'Blockwoche 1 (13.04.-17.04.2026)');

    expect(ergebnis).toHaveLength(2);
    for (const t of ergebnis) {
      expect(new Date(t.gueltigVon! * 1000).toISOString().slice(0, 10)).toBe('2026-04-13');
      expect(new Date(t.gueltigBis! * 1000).toISOString().slice(0, 10)).toBe('2026-04-17');
    }
  });

  it('Endpunktname ohne Datumsbereich: übernimmt die gelieferten Gültigkeitsangaben unverändert', () => {
    expect(leseDatumsbereichAusName('Tutorien')).toBeNull();
    expect(leseDatumsbereichAusName('Bachelor Informatik (StgPO 2019), VR Data Science')).toBeNull();
    expect(logErrorMock).not.toHaveBeenCalled();

    const termine = [termin()];
    const ergebnis = wendeGueltigkeitszeitraumAn(termine, 'Tutorien');
    expect(ergebnis).toEqual(termine);
  });

  it('Datumsbereich nicht auswertbar: übernimmt die gelieferten Angaben unverändert und protokolliert den Vorfall', () => {
    const bereich = leseDatumsbereichAusName('Master Digital Design (StgPO 2024)');
    expect(bereich).toBeNull();
    expect(logErrorMock).toHaveBeenCalledWith('endpunktzeitraum.datumsbereich', expect.anything());

    const termine = [termin()];
    const ergebnis = wendeGueltigkeitszeitraumAn(termine, 'Master Digital Design (StgPO 2024)');
    expect(ergebnis).toEqual(termine);
  });
});
