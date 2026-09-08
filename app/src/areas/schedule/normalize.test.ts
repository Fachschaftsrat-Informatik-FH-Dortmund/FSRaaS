import { logError } from '@/errors/AppError';

import { normalizeOfficialTermin, normalizeOfficialTermine } from './normalize';

jest.mock('@/errors/AppError', () => ({
  logError: jest.fn(),
}));

const logErrorMock = jest.mocked(logError);

beforeEach(() => logErrorMock.mockClear());

const VOLLSTAENDIGER_ROHSATZ = {
  name: 'Algorithmen und Datenstrukturen',
  courseId: '42012',
  courseType: 'V',
  courseOfStudy: 'INPBPI',
  examinationReg: '2019 84 079 PR',
  termId: 'SS 26',
  grade: 2,
  description: null,
  note: 'Raumänderung möglich',
  lecturerId: 'MUS',
  lecturerName: 'Prof. Mustermann',
  studentSet: 'A-P',
  timeBegin: 800,
  timeEnd: '930',
  dateBegin: 1_700_000_000,
  dateEnd: 1_710_000_000,
  weekday: 'Mon',
  roomId: 'A.E.01',
  interval: 'weekly',
};

describe('SCHED-F-030 vollständiger FBWS-Rohsatz wird korrekt übernommen', () => {
  it('übernimmt die sechs sicher vorhandenen Felder sowie die optionalen Felder', () => {
    const ergebnis = normalizeOfficialTermin(VOLLSTAENDIGER_ROHSATZ);
    expect(ergebnis).toEqual({
      courseId: '42012',
      name: 'Algorithmen und Datenstrukturen',
      courseType: 'V',
      lecturerName: 'Prof. Mustermann',
      studentSet: 'A-P',
      roomId: 'A.E.01',
      weekday: 'Mon',
      timeBeginMin: 8 * 60,
      timeEndMin: 9 * 60 + 30,
      gueltigVon: 1_700_000_000,
      gueltigBis: 1_710_000_000,
      note: 'Raumänderung möglich',
      examinationReg: '2019 84 079 PR',
      grade: '2',
    });
    expect(logErrorMock).not.toHaveBeenCalled();
  });

  it('rundet die Zeitfelder über die Auffüllregel korrekt auf Minuten seit Mitternacht um', () => {
    const ergebnis = normalizeOfficialTermin({ ...VOLLSTAENDIGER_ROHSATZ, timeBegin: 800, timeEnd: 1215 });
    expect(ergebnis?.timeBeginMin).toBe(8 * 60);
    expect(ergebnis?.timeEndMin).toBe(12 * 60 + 15);
  });
});

describe('SCHED-F-030 optionale Felder dürfen fehlen', () => {
  it('setzt courseId, lecturerName und roomId auf leere Zeichenkette, wenn sie fehlen', () => {
    const { courseId, lecturerName, roomId, ...rest } = VOLLSTAENDIGER_ROHSATZ;
    const ergebnis = normalizeOfficialTermin(rest);
    expect(ergebnis?.courseId).toBe('');
    expect(ergebnis?.lecturerName).toBe('');
    expect(ergebnis?.roomId).toBe('');
    expect(logErrorMock).not.toHaveBeenCalled();
  });

  it('lässt note, examinationReg und grade weg, wenn sie fehlen', () => {
    const { note, examinationReg, grade, ...rest } = VOLLSTAENDIGER_ROHSATZ;
    const ergebnis = normalizeOfficialTermin(rest);
    expect(ergebnis?.note).toBeUndefined();
    expect(ergebnis?.examinationReg).toBeUndefined();
    expect(ergebnis?.grade).toBeUndefined();
    expect(logErrorMock).not.toHaveBeenCalled();
  });

  it('setzt den Gültigkeitszeitraum auf null, wenn dateBegin/dateEnd fehlen', () => {
    const { dateBegin, dateEnd, ...rest } = VOLLSTAENDIGER_ROHSATZ;
    const ergebnis = normalizeOfficialTermin(rest);
    expect(ergebnis?.gueltigVon).toBeNull();
    expect(ergebnis?.gueltigBis).toBeNull();
    expect(logErrorMock).not.toHaveBeenCalled();
  });
});

describe('SEC-F-060 fehlende sicher erwartete Felder werden übersprungen und protokolliert', () => {
  it.each(['name', 'studentSet', 'weekday', 'timeBegin', 'timeEnd', 'courseType'])(
    'gibt null zurück und protokolliert, wenn "%s" fehlt',
    (feld) => {
      const { [feld]: _entfernt, ...rest } = VOLLSTAENDIGER_ROHSATZ as Record<string, unknown>;
      const ergebnis = normalizeOfficialTermin(rest);
      expect(ergebnis).toBeNull();
      expect(logErrorMock).toHaveBeenCalledWith(`normalize.${feld}`, expect.anything());
    },
  );

  it('überspringt einen Satz mit unbekanntem Wochentag', () => {
    const ergebnis = normalizeOfficialTermin({ ...VOLLSTAENDIGER_ROHSATZ, weekday: 'Feiertag' });
    expect(ergebnis).toBeNull();
    expect(logErrorMock).toHaveBeenCalledWith('normalize.weekday', expect.anything());
  });

  it('überspringt einen Satz, dessen timeBegin weder Zahl noch Zeichenkette ist', () => {
    const ergebnis = normalizeOfficialTermin({ ...VOLLSTAENDIGER_ROHSATZ, timeBegin: null });
    expect(ergebnis).toBeNull();
    expect(logErrorMock).toHaveBeenCalledWith('normalize.timeBegin', expect.anything());
  });
});

describe('SEC-F-060 unerwartete, aber vorhandene Werte werden protokolliert statt verschluckt', () => {
  it('übernimmt einen unbekannten courseType-Wert dennoch, protokolliert ihn aber', () => {
    const ergebnis = normalizeOfficialTermin({ ...VOLLSTAENDIGER_ROHSATZ, courseType: 'X' });
    expect(ergebnis?.courseType).toBe('X');
    expect(logErrorMock).toHaveBeenCalledWith('normalize.courseType.unbekannt', expect.anything());
  });

  it('ignoriert ein optionales Feld mit unerwartetem Typ und protokolliert es', () => {
    const ergebnis = normalizeOfficialTermin({ ...VOLLSTAENDIGER_ROHSATZ, lecturerName: 42 });
    expect(ergebnis?.lecturerName).toBe('');
    expect(logErrorMock).toHaveBeenCalledWith('normalize.lecturerName', expect.anything());
  });
});

describe('SCHED-F-030 courseType kennt auch PR (Blockwochen) und S (Seminare)', () => {
  it('übernimmt PR ohne es als unbekannt zu protokollieren (Live-Befund 2026-09-08, Blockwoche1)', () => {
    const ergebnis = normalizeOfficialTermin({ ...VOLLSTAENDIGER_ROHSATZ, courseType: 'PR' });
    expect(ergebnis?.courseType).toBe('PR');
    expect(logErrorMock).not.toHaveBeenCalledWith('normalize.courseType.unbekannt', expect.anything());
  });

  it('übernimmt S ohne es als unbekannt zu protokollieren (Live-Befund 2026-09-08, SMPB)', () => {
    const ergebnis = normalizeOfficialTermin({ ...VOLLSTAENDIGER_ROHSATZ, courseType: 'S' });
    expect(ergebnis?.courseType).toBe('S');
    expect(logErrorMock).not.toHaveBeenCalledWith('normalize.courseType.unbekannt', expect.anything());
  });
});

describe('normalizeOfficialTermine verarbeitet eine Liste', () => {
  it('lässt übersprungene Sätze im Ergebnis weg, ohne die Liste abzubrechen', () => {
    const { name, ...unvollstaendig } = VOLLSTAENDIGER_ROHSATZ;
    const ergebnis = normalizeOfficialTermine([VOLLSTAENDIGER_ROHSATZ, unvollstaendig]);
    expect(ergebnis).toHaveLength(1);
    expect(ergebnis[0]?.name).toBe('Algorithmen und Datenstrukturen');
  });
});
