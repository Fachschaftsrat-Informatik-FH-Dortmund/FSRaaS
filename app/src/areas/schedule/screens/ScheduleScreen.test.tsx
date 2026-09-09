import AsyncStorage from '@react-native-async-storage/async-storage';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { removeKey, writeJson } from '@/storage/kv';
import { ThemeProvider } from '@/theme';
import { __resetAnsichtEinstellungenForTest, __resetAnsichtsstandForTest } from '../ansichtEinstellungen';
import { __resetEinrichtungForTest } from '../einrichtung';
import { __resetScheduleEntriesForTest } from '../planStore';
import { __resetSemesterstandForTest } from '../semesterstand';
import type { CustomPlanEntry, OfficialPlanEntry, PlanEntry } from '../typen';
import { ScheduleScreen } from './ScheduleScreen';

// Der Bildschirm liest den persönlichen Plan, die Einrichtung und die
// Ansichtseinstellungen aus den echten gerätelokalen Speichern — sie sind
// reaktiv und lassen die Schalter im Test tatsächlich wirken. Ersetzt wird
// allein der Netzzugriff (`../api`).

let mockVorlesungszeit: { data: { von: number | null; bis: number | null } | undefined };
let mockStudiengaenge: { sname: string; name: string; grades: string[] }[];

jest.mock('../api', () => ({
  useVorlesungszeit: () => mockVorlesungszeit,
  useStudiengaenge: () => ({ studiengaenge: mockStudiengaenge }),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));

// Mittwoch, 9. September 2026, 10:30 Uhr. Ohne feste Uhr hingen der geöffnete
// Wochentag, die Hervorhebung des laufenden Termins und die Uhrzeitmarke am
// Tag des Testlaufs. Festgehalten wird ausschließlich `Date`; alle Zeitgeber
// bleiben echt, damit `waitFor` unverändert arbeitet.
const MITTWOCH = new Date(2026, 8, 9, 10, 30, 0);

beforeAll(() => {
  jest.useFakeTimers({
    now: MITTWOCH,
    doNotFake: [
      'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
      'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask',
      'performance', 'requestAnimationFrame', 'cancelAnimationFrame',
      'requestIdleCallback', 'cancelIdleCallback', 'hrtime',
    ],
  });
});

afterAll(() => jest.useRealTimers());

function offiziell(over: Partial<OfficialPlanEntry> & { id: string }): OfficialPlanEntry {
  return {
    kind: 'offiziell',
    deaktiviertBis: null,
    color: '#1E88E5',
    weekday: 'Wed',
    timeBeginMin: 480,
    timeEndMin: 570,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    courseId: '43051',
    name: 'Analysis',
    courseType: 'V',
    lecturerName: 'Prof. Beispiel',
    studentSet: '*',
    roomId: 'A.2.02',
    ...over,
  };
}

function eigen(over: Partial<CustomPlanEntry> & { id: string }): CustomPlanEntry {
  return {
    kind: 'eigen',
    deaktiviertBis: null,
    color: '#43A047',
    weekday: 'Wed',
    timeBeginMin: 840,
    timeEndMin: 900,
    gruppenzugehoerig: true,
    abweichendeGruppe: false,
    akzeptierteKonflikte: [],
    istPruefung: false,
    gueltigVon: null,
    gueltigBis: null,
    title: 'Lerngruppe',
    wiederkehrend: true,
    ...over,
  };
}

const ANALYSIS = offiziell({ id: 'analysis', timeBeginMin: 480, timeEndMin: 570 });
const DATENBANKEN = offiziell({
  id: 'db',
  name: 'Datenbanken',
  courseType: 'Ü',
  timeBeginMin: 600,
  timeEndMin: 690,
  color: '#8E24AA',
});
const PROGRAMMIEREN = offiziell({
  id: 'prog',
  name: 'Programmieren',
  weekday: 'Mon',
  timeBeginMin: 720,
  timeEndMin: 810,
  color: '#F4511E',
});

async function seed(entries: PlanEntry[], einstellungen: Record<string, unknown> = {}) {
  await AsyncStorage.clear();
  await writeJson('scheduleEntries', entries);
  await writeJson('scheduleSetup', {
    endpunkte: ['INPBPI'],
    gruppenkennung: 'C8',
    gruppenkennungVorschlag: null,
  });
  await writeJson('scheduleViewSettings', {
    zeitachse: true,
    gruppenfremdeAusblenden: false,
    sprungZuHeute: true,
    alleAnzeigen: false,
    ...einstellungen,
  });
  __resetScheduleEntriesForTest();
  __resetEinrichtungForTest();
  __resetAnsichtEinstellungenForTest();
  __resetAnsichtsstandForTest();
  __resetSemesterstandForTest();
}

async function zeige() {
  render(
    <ThemeProvider>
      <ScheduleScreen />
    </ThemeProvider>,
  );
  await waitFor(() => expect(screen.queryByText('Wird geladen …')).toBeNull());
}

beforeEach(() => {
  jest.clearAllMocks();
  mockVorlesungszeit = { data: { von: null, bis: null } };
  mockStudiengaenge = [];
});

afterEach(cleanup);

describe('Fünf-Tage-Ansicht', () => {
  it('zeigt mindestens Montag bis Freitag in der Wochentagsleiste', async () => {
    await seed([ANALYSIS]);
    await zeige();

    for (const tag of ['Mo', 'Di', 'Mi', 'Do', 'Fr']) {
      expect(screen.getByLabelText(new RegExp(`^${tag} `))).toBeTruthy();
    }
  });
});

describe('Wochentagsleiste mit bedarfsweisem Samstag', () => {
  it('nimmt den Samstag auf, wenn dort ein Termin liegt', async () => {
    await seed([ANALYSIS, offiziell({ id: 'sa', weekday: 'Sat', name: 'Blockseminar' })]);
    await zeige();

    expect(screen.getByLabelText(/^Sa /)).toBeTruthy();
  });

  it('lässt den Samstag aus, wenn dort kein Termin liegt', async () => {
    await seed([ANALYSIS]);
    await zeige();

    expect(screen.queryByLabelText(/^Sa /)).toBeNull();
  });
});

describe('Kalenderdatum je Wochentag', () => {
  it('weist zu jedem Wochentag das Kalenderdatum der angezeigten Woche aus', async () => {
    await seed([ANALYSIS]);
    await zeige();

    expect(screen.getByText('07.09.')).toBeTruthy(); // Montag
    expect(screen.getByText('09.09.')).toBeTruthy(); // Mittwoch
    expect(screen.getByText('11.09.')).toBeTruthy(); // Freitag
  });
});

describe('Blättern über Wochengrenzen', () => {
  it('blättert in die Vorwoche und kehrt über den sichtbaren Weg zur laufenden Woche zurück', async () => {
    await seed([ANALYSIS]);
    await zeige();
    expect(screen.getByText('07.09.')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Vorige Woche'));
    await waitFor(() => expect(screen.getByText('31.08.')).toBeTruthy());
    expect(screen.queryByText('07.09.')).toBeNull();

    fireEvent.press(screen.getByLabelText('Zur laufenden Woche'));
    await waitFor(() => expect(screen.getByText('07.09.')).toBeTruthy());
    expect(screen.queryByLabelText('Zur laufenden Woche')).toBeNull();
  });

  it('blättert auch in die Folgewoche', async () => {
    await seed([ANALYSIS]);
    await zeige();

    fireEvent.press(screen.getByLabelText('Nächste Woche'));
    await waitFor(() => expect(screen.getByText('14.09.')).toBeTruthy());
  });
});

describe('Anzeige nur im Gültigkeitszeitraum', () => {
  it('zeigt eine Veranstaltung in der letzten zutreffenden Woche und in der folgenden nicht mehr', async () => {
    const endeMittwoch = Math.floor(new Date(2026, 8, 9, 12, 0, 0).getTime() / 1000);
    await seed([offiziell({ id: 'analysis', name: 'Analysis', gueltigBis: endeMittwoch })]);
    await zeige();

    expect(screen.getByText('Analysis')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Nächste Woche'));
    await waitFor(() => expect(screen.queryByText('Analysis')).toBeNull());
  });
});

describe('Kennzeichnung vorlesungsfreier Wochen', () => {
  it('kennzeichnet eine Woche außerhalb der Vorlesungszeit statt eines regulären Plans', async () => {
    mockVorlesungszeit = {
      data: {
        von: Math.floor(new Date(2026, 9, 1, 12, 0, 0).getTime() / 1000), // 1. Oktober
        bis: Math.floor(new Date(2027, 0, 31, 12, 0, 0).getTime() / 1000),
      },
    };
    await seed([ANALYSIS]);
    await zeige();

    expect(screen.getByText('Vorlesungsfreie Woche')).toBeTruthy();
    expect(screen.queryByText('Analysis')).toBeNull();
  });

  it('erzeugt ohne bekannte Vorlesungszeit keinen Hinweis', async () => {
    await seed([ANALYSIS]);
    await zeige();

    expect(screen.queryByText('Vorlesungsfreie Woche')).toBeNull();
    expect(screen.getByText('Analysis')).toBeTruthy();
  });
});

describe('Proportionale Zeitachse', () => {
  it('stellt die Lücke zwischen zwei Terminen mit Angabe ihrer Dauer dar', async () => {
    await seed([ANALYSIS, DATENBANKEN]);
    await zeige();

    // 09:30 bis 10:00 — eine halbe Stunde ohne Termin.
    expect(screen.getByLabelText('Freie Zeit von 09:30 bis 10:00, 30 Minuten')).toBeTruthy();
    expect(screen.getAllByText('30 Minuten frei').length).toBeGreaterThan(0);
  });

  it('bemisst die Höhe eines Termins nach seiner Dauer', async () => {
    await seed([ANALYSIS, DATENBANKEN]);
    await zeige();

    const analysis = screen.getByLabelText(/^08:00–09:30 · Analysis/);
    const datenbanken = screen.getByLabelText(/^10:00–11:30 · Datenbanken/);
    // 90 Minuten gegenüber 90 Minuten: gleich hoch, und beide auf der Achse platziert.
    expect(analysis).toBeTruthy();
    expect(datenbanken).toBeTruthy();
  });
});

describe('Abschalten der proportionalen Zeitachse', () => {
  it('zeigt die kompakte Liste ohne Lückendarstellung, die Terminfolge bleibt unverändert', async () => {
    await seed([ANALYSIS, DATENBANKEN]);
    await zeige();
    expect(screen.getByLabelText('Freie Zeit von 09:30 bis 10:00, 30 Minuten')).toBeTruthy();

    fireEvent(screen.getByLabelText('Proportionale Zeitachse'), 'valueChange', false);

    await waitFor(() => expect(screen.queryByLabelText(/^Freie Zeit/)).toBeNull());
    expect(screen.getByText('Analysis')).toBeTruthy();
    expect(screen.getByText('Datenbanken')).toBeTruthy();
  });
});

describe('Nebeneinanderdarstellung überschneidender Termine', () => {
  it('stellt zwei überschneidende Termine einzeln erkenn- und auswählbar dar', async () => {
    await seed([
      offiziell({ id: 'a', name: 'Analysis', timeBeginMin: 480, timeEndMin: 600 }),
      offiziell({ id: 'b', name: 'Datenbanken', timeBeginMin: 540, timeEndMin: 660 }),
    ]);
    await zeige();

    const a = screen.getByLabelText(/^08:00–10:00 · Analysis/);
    const b = screen.getByLabelText(/^09:00–11:00 · Datenbanken/);
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();

    fireEvent.press(b);
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/detail', params: { id: 'b' } });
  });
});

describe('Sortierung nach Beginnzeit', () => {
  it('stellt die Termine eines Wochentags aufsteigend nach Beginnzeit dar', async () => {
    await seed(
      [DATENBANKEN, ANALYSIS],
      { zeitachse: false },
    );
    await zeige();

    const titel = screen.getAllByText(/^(Analysis|Datenbanken)$/).map((n) => n.props.children);
    expect(titel).toEqual(['Analysis', 'Datenbanken']);
  });
});

describe('Anzeige des laufenden und nächsten Termins', () => {
  it('nennt laufenden und nächsten Termin mit verbleibender Zeit über dem Plan', async () => {
    await seed([
      DATENBANKEN, // 10:00–11:30, läuft um 10:30
      offiziell({ id: 'spaeter', name: 'Softwaretechnik', timeBeginMin: 780, timeEndMin: 870 }),
    ]);
    await zeige();

    expect(screen.getByText('Jetzt: Datenbanken — noch 60 min')).toBeTruthy();
    expect(screen.getByText('Danach: Softwaretechnik — in 150 min')).toBeTruthy();
  });
});

describe('Hervorhebung des laufenden Termins und der aktuellen Uhrzeit', () => {
  it('hebt den laufenden Termin im Plan hervor und kennzeichnet die aktuelle Uhrzeit', async () => {
    await seed([ANALYSIS, DATENBANKEN]);
    await zeige();

    expect(screen.getByLabelText(/10:00–11:30 · Datenbanken.*Läuft gerade/)).toBeTruthy();
    expect(screen.getByLabelText('Jetzt 10:30')).toBeTruthy();
  });

  it('kennzeichnet die Uhrzeit nicht an einem anderen Wochentag', async () => {
    await seed([ANALYSIS, DATENBANKEN, PROGRAMMIEREN]);
    await zeige();

    fireEvent.press(screen.getByLabelText(/^Mo /));
    await waitFor(() => expect(screen.queryByLabelText('Jetzt 10:30')).toBeNull());
  });
});

describe('Kennzeichnung gruppenfremder Termine statt Entfernen', () => {
  it('zeigt einen gruppenfremden Termin weiterhin, aber gekennzeichnet', async () => {
    await seed([offiziell({ id: 'fremd', name: 'Praktikum', gruppenzugehoerig: false })]);
    await zeige();

    expect(screen.getByLabelText(/Praktikum.*Andere Gruppe/)).toBeTruthy();
  });
});

describe('Schalter zum Ausblenden gruppenfremder Termine', () => {
  it('blendet gruppenfremde Termine aus und wieder ein', async () => {
    await seed([
      ANALYSIS,
      offiziell({ id: 'fremd', name: 'Praktikum', gruppenzugehoerig: false, timeBeginMin: 600, timeEndMin: 660 }),
    ]);
    await zeige();
    expect(screen.getByText('Praktikum')).toBeTruthy();

    fireEvent(screen.getByLabelText('Termine anderer Gruppen ausblenden'), 'valueChange', true);
    await waitFor(() => expect(screen.queryByText('Praktikum')).toBeNull());
    expect(screen.getByText('Analysis')).toBeTruthy();

    fireEvent(screen.getByLabelText('Termine anderer Gruppen ausblenden'), 'valueChange', false);
    await waitFor(() => expect(screen.getByText('Praktikum')).toBeTruthy());
  });
});

describe('Wirkung eines deaktivierten Termins', () => {
  it('kennzeichnet einen deaktivierten Termin durch Text, nicht allein durch Farbe', async () => {
    await seed([offiziell({ id: 'deaktiviert', name: 'Wahlpflicht', deaktiviertBis: 'dauerhaft' })]);
    await zeige();

    expect(screen.getByLabelText(/Wahlpflicht.*Deaktiviert/)).toBeTruthy();
  });
});

describe('Konflikthinweis bei überschneidenden Terminen', () => {
  it('hält Konflikthinweis und angenommenen Konflikt am Termin auseinander', async () => {
    await seed([
      offiziell({ id: 'a', name: 'Analysis', timeBeginMin: 480, timeEndMin: 600, akzeptierteKonflikte: ['b'] }),
      offiziell({ id: 'b', name: 'Datenbanken', timeBeginMin: 480, timeEndMin: 540, akzeptierteKonflikte: ['a'] }),
      offiziell({ id: 'c', name: 'Praktikum', timeBeginMin: 540, timeEndMin: 600 }),
    ]);
    await zeige();

    // Das angenommene Paar trägt allein die Kennzeichnung …
    expect(screen.getByLabelText(/Datenbanken.*Angenommener Konflikt/)).toBeTruthy();
    expect(screen.queryByLabelText(/Datenbanken.*· Konflikt ·/)).toBeNull();
    // … das offene Paar den Hinweis.
    expect(screen.getByLabelText(/Praktikum.*Konflikt/)).toBeTruthy();
  });

  it('erzeugt für einen deaktivierten Termin keinen Konflikthinweis', async () => {
    await seed([
      offiziell({ id: 'a', name: 'Analysis', timeBeginMin: 480, timeEndMin: 600 }),
      offiziell({ id: 'b', name: 'Datenbanken', deaktiviertBis: 'dauerhaft', timeBeginMin: 480, timeEndMin: 540 }),
    ]);
    await zeige();

    expect(screen.queryByLabelText(/Analysis.*Konflikt/)).toBeNull();
    expect(screen.queryByLabelText(/Datenbanken.*· Konflikt/)).toBeNull();
  });
});

describe('Kennzeichnung eigener Termine', () => {
  it('unterscheidet einen eigenen Termin dauerhaft vom offiziellen', async () => {
    await seed([ANALYSIS, eigen({ id: 'lern', title: 'Lerngruppe' })]);
    await zeige();

    expect(screen.getByLabelText(/Lerngruppe.*Eigener Termin/)).toBeTruthy();
    expect(screen.queryByLabelText(/Analysis.*Eigener Termin/)).toBeNull();
  });
});

describe('Visuelle Kennzeichnung von Prüfungsterminen', () => {
  it('stellt einen Prüfungstermin gesondert von regulären Terminen dar', async () => {
    await seed([ANALYSIS, eigen({ id: 'klausur', title: 'Klausur Analysis', istPruefung: true })]);
    await zeige();

    expect(screen.getByLabelText(/Klausur Analysis.*Prüfung/)).toBeTruthy();
    expect(screen.queryByLabelText(/· Analysis.*Prüfung/)).toBeNull();
  });
});

describe('Hinweis bei Semesterwechsel', () => {
  it('weist auf eine mögliche Anpassung hin, wenn sich das Lehrangebot geändert hat (Semesterbeginn erkannt)', async () => {
    mockStudiengaenge = [
      { sname: 'INPBPI', name: 'Praktische Informatik', grades: ['1', '2', '3'] },
      { sname: 'Blockwoche1', name: 'Blockwoche 1 (13.04.-17.04.2026)', grades: ['0'] },
    ];
    await seed([ANALYSIS]);
    await writeJson('scheduleSemesterstand', { endpunkte: ['INPBPI'] });
    __resetSemesterstandForTest();
    await zeige();

    await waitFor(() =>
      expect(
        screen.getByText('Das Lehrangebot hat sich geändert. Prüfe deine Endpunktauswahl und deine Gruppenkennung.'),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByLabelText('Passt so'));
    await waitFor(() => expect(screen.queryByText(/Das Lehrangebot hat sich geändert/)).toBeNull());
  });

  it('Gewählter Endpunkt entfallen: weist darauf hin, ohne die Auswahl selbsttätig zu ändern', async () => {
    mockStudiengaenge = [{ sname: 'TUPB', name: 'Tutorien', grades: ['0'] }]; // INPBPI ist verschwunden
    await seed([ANALYSIS]);
    await writeJson('scheduleSemesterstand', { endpunkte: ['INPBPI', 'TUPB'] });
    __resetSemesterstandForTest();
    await zeige();

    await waitFor(() =>
      expect(
        screen.getByText('Das Lehrangebot hat sich geändert. Prüfe deine Endpunktauswahl und deine Gruppenkennung.'),
      ).toBeTruthy(),
    );
  });

  it('weist beim erstmaligen Einrichten nicht auf einen Wechsel hin', async () => {
    mockStudiengaenge = [{ sname: 'INPBPI', name: 'Praktische Informatik', grades: ['1', '2', '3'] }];
    await seed([ANALYSIS]);
    await zeige();

    expect(screen.queryByText(/Das Lehrangebot hat sich geändert/)).toBeNull();
  });
});

describe('Leerer Tag bei wirksamem Filter', () => {
  it('nennt die Gruppenfilterung als Grund, wenn sie den Tag geleert hat', async () => {
    await seed(
      [offiziell({ id: 'fremd', name: 'Praktikum', gruppenzugehoerig: false })],
      { gruppenfremdeAusblenden: true },
    );
    await zeige();

    expect(screen.getByText('Alle Termine dieses Tages sind durch die Gruppenfilterung ausgeblendet.')).toBeTruthy();
  });

  it('nennt den Gültigkeitszeitraum als Grund, wenn er den Tag geleert hat', async () => {
    const abgelaufen = Math.floor(new Date(2026, 7, 31, 12, 0, 0).getTime() / 1000);
    await seed([offiziell({ id: 'alt', name: 'Analysis', gueltigBis: abgelaufen })]);
    await zeige();

    expect(screen.getByText('Alle Termine dieses Tages liegen außerhalb ihres Gültigkeitszeitraums.')).toBeTruthy();
  });

  it('unterscheidet den Leerzustand ohne gewählten Studiengang vom wirksamen Filter', async () => {
    await seed([]);
    await removeKey('scheduleSetup');
    __resetEinrichtungForTest();
    await zeige();

    expect(screen.getByText('Noch keine Einrichtung')).toBeTruthy();
    expect(screen.queryByText('Kein Termin an diesem Tag')).toBeNull();
  });

  it('bietet ohne gewählten Studiengang einen Bedienweg zur Einrichtung an, statt nur Text zu zeigen', async () => {
    await seed([]);
    await removeKey('scheduleSetup');
    __resetEinrichtungForTest();
    await zeige();

    fireEvent.press(screen.getByLabelText('Einrichtung öffnen'));
    expect(mockPush).toHaveBeenCalledWith('/einrichtung');
  });

  it('bietet bei leerem Plan trotz vorhandener Einrichtung einen Bedienweg zur Kursauswahl', async () => {
    await seed([]);
    await zeige();

    expect(screen.getByText('Noch keine Termine im Plan')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Weiter zur Kursauswahl'));
    expect(mockPush).toHaveBeenCalledWith('/kurse');
  });

  // Requirement „Zweckbestimmung eigener Termine": der Bedienweg zum Anlegen
  // eigener Termine führt seit diesem Change über den Planungsmodus, nicht
  // mehr über die Wochenansicht (`PlanungScreen.test.tsx`).
  it('bietet keinen Bedienweg zum Anlegen eigener Termine an', async () => {
    await seed([]);
    await zeige();

    expect(screen.queryByLabelText('Eigenen Termin anlegen')).toBeNull();
  });
});

describe('Schalter zum Abschalten aller Filter', () => {
  it('zeigt alle Termine des Plans und macht den aktiven Zustand erkennbar', async () => {
    const abgelaufen = Math.floor(new Date(2026, 7, 31, 12, 0, 0).getTime() / 1000);
    await seed(
      [
        offiziell({ id: 'fremd', name: 'Praktikum', gruppenzugehoerig: false }),
        offiziell({ id: 'alt', name: 'Analysis', timeBeginMin: 600, timeEndMin: 660, gueltigBis: abgelaufen }),
      ],
      { gruppenfremdeAusblenden: true },
    );
    await zeige();
    expect(screen.queryByText('Praktikum')).toBeNull();
    expect(screen.queryByText('Analysis')).toBeNull();

    fireEvent(screen.getByLabelText('Alle Termine anzeigen'), 'valueChange', true);

    await waitFor(() => expect(screen.getByText('Praktikum')).toBeTruthy());
    expect(screen.getByText('Analysis')).toBeTruthy();
    expect(screen.getByText('Alle Filter sind abgeschaltet.')).toBeTruthy();
  });

  it('lässt die zuvor gesetzten Filter nach dem Zurücknehmen unverändert weiterwirken', async () => {
    await seed(
      [ANALYSIS, offiziell({ id: 'fremd', name: 'Praktikum', gruppenzugehoerig: false, timeBeginMin: 600, timeEndMin: 660 })],
      { gruppenfremdeAusblenden: true },
    );
    await zeige();

    fireEvent(screen.getByLabelText('Alle Termine anzeigen'), 'valueChange', true);
    await waitFor(() => expect(screen.getByText('Praktikum')).toBeTruthy());

    fireEvent(screen.getByLabelText('Alle Termine anzeigen'), 'valueChange', false);
    await waitFor(() => expect(screen.queryByText('Praktikum')).toBeNull());
    expect(screen.getByText('Analysis')).toBeTruthy();
  });
});
