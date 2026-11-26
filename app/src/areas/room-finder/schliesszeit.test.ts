import { schliesszeitAm, schliesszeitMinuten } from './schliesszeit';

describe('Gepflegte Gebäudeschließzeit statt fester Wert', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('liest HH:MM, HH.MM und HHMM', () => {
    expect(schliesszeitMinuten('21:30')).toBe(21 * 60 + 30);
    expect(schliesszeitMinuten('20.00')).toBe(20 * 60);
    expect(schliesszeitMinuten('2215')).toBe(22 * 60 + 15);
    expect(schliesszeitMinuten(' 7:45 ')).toBe(7 * 60 + 45);
  });

  it('ohne gepflegte Schließzeit nimmt die App keinen eigenen Wert an', () => {
    expect(schliesszeitMinuten(null)).toBeNull();
    expect(schliesszeitMinuten(undefined)).toBeNull();
    expect(schliesszeitMinuten('')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('eine unlesbare Schließzeit wird protokolliert und wie eine fehlende behandelt', () => {
    expect(schliesszeitMinuten('abends')).toBeNull();
    expect(schliesszeitMinuten('25:00')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('setzt die Schließzeit auf den Kalendertag des Bezugs', () => {
    const am = schliesszeitAm('21:30', new Date(2026, 10, 26, 9, 12));
    expect(am).toEqual(new Date(2026, 10, 26, 21, 30));
  });
});
