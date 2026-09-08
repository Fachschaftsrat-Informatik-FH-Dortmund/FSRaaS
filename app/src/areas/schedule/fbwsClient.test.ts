import { AppError } from '@/errors/AppError';
import { holeGruppenkennungZuMatrikelnummer, holeStudiengaenge, holeTermine } from './fbwsClient';

// Platzhalter-Matrikelnummern, keine echten (Testregel im Auftrag).
const PLATZHALTER_MATRIKELNUMMER = '1234567';

function mockFetchOnce(status: number, body: unknown): jest.Mock {
  const fn = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as unknown as Response),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('INT-001 — FBWS Studiengänge', () => {
  it('ruft die dokumentierte HTTPS-Adresse ohne weitere Parameter außer Accept auf', async () => {
    const fetchMock = mockFetchOnce(200, {});
    await holeStudiengaenge();
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toBe('https://ws.inf.fh-dortmund.de/timetable/current/rest/CourseOfStudy/?Accept=application/json');
  });

  it('wertet die Antwort als Map aus und verwirft Einträge mit grades: null', async () => {
    mockFetchOnce(200, {
      INPBPI: { name: 'Praktische Informatik', sname: 'INPBPI', grades: [{ grade: 2 }, { grade: 4 }], po: '2019' },
      Verworfen: { name: 'Ohne Fachsemester', sname: 'X', grades: null },
    });

    const studiengaenge = await holeStudiengaenge();
    expect(studiengaenge).toEqual([
      { name: 'Praktische Informatik', sname: 'INPBPI', grades: ['2', '4'], po: '2019' },
    ]);
  });

  it('wertet po sowohl als null als auch als Zeichenkette "NULL" als „keine Prüfungsordnung" aus', async () => {
    mockFetchOnce(200, {
      OhnePo: { name: 'Blockwoche 1', sname: 'Blockwoche1', grades: [{ grade: 0 }], po: null },
      StringNull: { name: 'FemINF', sname: 'FemINF', grades: [{ grade: 0 }], po: 'NULL' },
    });

    const studiengaenge = await holeStudiengaenge();
    expect(studiengaenge).toEqual([
      { name: 'Blockwoche 1', sname: 'Blockwoche1', grades: ['0'], po: null },
      { name: 'FemINF', sname: 'FemINF', grades: ['0'], po: null },
    ]);
  });

  it('SEC-F-060: überspringt einen strukturell unerwarteten Eintrag statt den gesamten Abruf scheitern zu lassen', async () => {
    mockFetchOnce(200, {
      Kaputt: { name: 'Kaputt' /* sname fehlt */, grades: [{ grade: 2 }] },
      Gueltig: { name: 'Gültig', sname: 'GUELTIG', grades: [{ grade: 2 }], po: null },
    });

    const studiengaenge = await holeStudiengaenge();
    expect(studiengaenge).toEqual([{ name: 'Gültig', sname: 'GUELTIG', grades: ['2'], po: null }]);
  });
});

describe('INT-002 Abruf der FBWS-Termine', () => {
  it('baut die Abruf-URL mit sname, grade und studentSet=* wie in integrations.md dokumentiert', async () => {
    const fetchMock = mockFetchOnce(200, []);
    await holeTermine('INPBPI', '2');
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toBe(
      'https://ws.inf.fh-dortmund.de/timetable/current/rest/CourseOfStudy/INPBPI/2/Events?Accept=application/json&studentSet=*',
    );
  });

  it('ruft die Wahlpflicht-Sammelkategorie mit sname=WFPB und grade=* ab (SCHED-F-400)', async () => {
    const fetchMock = mockFetchOnce(200, []);
    await holeTermine('WFPB', '*');
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toContain('/CourseOfStudy/WFPB/*/Events');
  });

  it('gibt die rohe Terminliste unverändert zurück', async () => {
    const roh = [{ name: 'X', courseType: 'V' }];
    mockFetchOnce(200, roh);
    expect(await holeTermine('INPBPI', '2')).toEqual(roh);
  });

  it('liefert bei grade=* für einen Bachelor-Endpunkt Termine mehrerer Fachsemester, jeder mit eigenem grade-Feld (Live-Befund 2026-09-08)', async () => {
    const roh = [
      { name: 'Algorithmen und Datenstrukturen', courseType: 'V', grade: 2 },
      { name: 'Softwaretechnik', courseType: 'V', grade: 4 },
      { name: 'Bachelorarbeit-Kolloquium', courseType: 'SV', grade: 6 },
    ];
    mockFetchOnce(200, roh);
    const termine = await holeTermine('INPBPI', '*');
    expect(termine.map((t) => t.grade)).toEqual([2, 4, 6]);
  });
});

describe('SEC-N-030 ausschließlich HTTPS gegen FBWS', () => {
  it('jede abgerufene URL beginnt mit https://', async () => {
    const fetchMock = mockFetchOnce(200, []);
    await holeTermine('INPBPI', '2');
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/^https:\/\//);
  });
});

describe('SCHED-F-690 Ermittlung der Gruppenkennung zu einer Matrikelnummer über INT-019', () => {
  it('ruft die dokumentierte HTTPS-Adresse mit der Matrikelnummer im Pfad und Accept=application/json auf', async () => {
    const fetchMock = mockFetchOnce(200, { fhDoStudentSet: 'O7' });
    await holeGruppenkennungZuMatrikelnummer(PLATZHALTER_MATRIKELNUMMER);
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url).toBe(
      `https://ws.inf.fh-dortmund.de/timetable/current/rest/Student/${PLATZHALTER_MATRIKELNUMMER}/Set?Accept=application/json`,
    );
  });

  it('Antwortgestalt 1: {"fhDoStudentSet":"O7"} liefert die Kennung als Zeichenkette', async () => {
    mockFetchOnce(200, { fhDoStudentSet: 'O7' });
    await expect(holeGruppenkennungZuMatrikelnummer(PLATZHALTER_MATRIKELNUMMER)).resolves.toBe('O7');
  });

  it('Antwortgestalt 2: {"fhDoStudentSet":false} wird wie „nicht gefunden" behandelt (null, kein Fehler)', async () => {
    mockFetchOnce(200, { fhDoStudentSet: false });
    await expect(holeGruppenkennungZuMatrikelnummer(PLATZHALTER_MATRIKELNUMMER)).resolves.toBeNull();
  });

  it('Antwortgestalt 3: leere Liste [] wird ebenso wie „nicht gefunden" behandelt (null, kein Fehler)', async () => {
    mockFetchOnce(200, []);
    await expect(holeGruppenkennungZuMatrikelnummer(PLATZHALTER_MATRIKELNUMMER)).resolves.toBeNull();
  });

  it('wertet auf eine nicht-leere Zeichenkette aus, nicht auf Vorhandensein des Felds oder Wahrheitswert', async () => {
    mockFetchOnce(200, { fhDoStudentSet: undefined });
    await expect(holeGruppenkennungZuMatrikelnummer(PLATZHALTER_MATRIKELNUMMER)).resolves.toBeNull();
  });

  it('SEC-N-030: die abgerufene URL beginnt mit https://', async () => {
    const fetchMock = mockFetchOnce(200, { fhDoStudentSet: 'A9' });
    await holeGruppenkennungZuMatrikelnummer(PLATZHALTER_MATRIKELNUMMER);
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/^https:\/\//);
  });
});

describe('SEC-F-060 keine stillen Fehler bei einer Fehlerantwort des Dienstes', () => {
  it('wirft einen AppError statt eine leere Liste zurückzugeben, wenn der Dienst mit 500 antwortet', async () => {
    mockFetchOnce(500, null);
    await expect(holeTermine('INPBPI', '2')).rejects.toBeInstanceOf(AppError);
  });

  it('wirft einen AppError, wenn INT-002 keine Liste liefert', async () => {
    mockFetchOnce(200, { unerwartet: true });
    await expect(holeTermine('INPBPI', '2')).rejects.toBeInstanceOf(AppError);
  });

  it('wirft einen AppError, wenn INT-001 keine Map liefert', async () => {
    mockFetchOnce(200, []);
    await expect(holeStudiengaenge()).rejects.toBeInstanceOf(AppError);
  });

  it('wirft einen AppError, wenn INT-019 weder Objekt noch Liste liefert', async () => {
    mockFetchOnce(200, 'unerwartet');
    await expect(holeGruppenkennungZuMatrikelnummer(PLATZHALTER_MATRIKELNUMMER)).rejects.toBeInstanceOf(AppError);
  });
});
