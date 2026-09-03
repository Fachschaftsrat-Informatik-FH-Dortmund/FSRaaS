import {
  findeNeueTreffer,
  istVormittag,
  ledgerAktualisieren,
  ledgerKey,
  type NotifiedLedger,
} from './backgroundCheck';

const plan = (mensaId: string, datum: string, gerichte: [string, string][]) => ({
  mensaId,
  mensaName: mensaId,
  datum,
  gerichte: gerichte.map(([schluessel, bezeichnung]) => ({ schluessel, bezeichnung })),
});

describe('MENSA-F-100 Lieblingsgericht im Tagesplan einer gewählten Mensa', () => {
  it('meldet ein Lieblingsgericht, das heute angeboten wird', () => {
    const treffer = findeNeueTreffer({
      plaene: [plan('Mensa', '2026-09-04', [['currywurst', 'Currywurst'], ['salat', 'Salat']])],
      favoriten: new Set(['currywurst']),
      ledger: {},
    });
    expect(treffer.map((t) => t.schluessel)).toEqual(['currywurst']);
    expect(treffer[0]?.mensaId).toBe('Mensa');
  });

  it('meldet nichts, wenn kein Lieblingsgericht im Plan steht', () => {
    const treffer = findeNeueTreffer({
      plaene: [plan('Mensa', '2026-09-04', [['salat', 'Salat']])],
      favoriten: new Set(['currywurst']),
      ledger: {},
    });
    expect(treffer).toEqual([]);
  });
});

describe('MENSA-F-110 höchstens eine Benachrichtigung je Gericht-Mensa-Tag', () => {
  it('unterdrückt einen bereits gemeldeten Treffer', () => {
    const ledger: NotifiedLedger = { [ledgerKey('currywurst', 'Mensa', '2026-09-04')]: '2026-09-04' };
    const treffer = findeNeueTreffer({
      plaene: [plan('Mensa', '2026-09-04', [['currywurst', 'Currywurst']])],
      favoriten: new Set(['currywurst']),
      ledger,
    });
    expect(treffer).toEqual([]);
  });

  it('dasselbe Gericht an einer anderen Mensa oder an einem anderen Tag ist ein neuer Treffer', () => {
    const ledger: NotifiedLedger = { [ledgerKey('currywurst', 'Mensa', '2026-09-04')]: '2026-09-04' };
    const treffer = findeNeueTreffer({
      plaene: [
        plan('Sued', '2026-09-04', [['currywurst', 'Currywurst']]),
        plan('Mensa', '2026-09-05', [['currywurst', 'Currywurst']]),
      ],
      favoriten: new Set(['currywurst']),
      ledger,
    });
    expect(treffer).toHaveLength(2);
  });

  it('ledgerAktualisieren trägt neue Treffer ein und verwirft Einträge vergangener Tage', () => {
    const alt: NotifiedLedger = {
      [ledgerKey('altes', 'Mensa', '2026-09-03')]: '2026-09-03',
      [ledgerKey('heutiges', 'Mensa', '2026-09-04')]: '2026-09-04',
    };
    const neu = ledgerAktualisieren(
      alt,
      [{ schluessel: 'frisch', bezeichnung: 'Frisch', mensaId: 'Mensa', mensaName: 'Mensa', datum: '2026-09-04' }],
      '2026-09-04',
    );
    expect(Object.keys(neu)).toEqual([
      ledgerKey('heutiges', 'Mensa', '2026-09-04'),
      ledgerKey('frisch', 'Mensa', '2026-09-04'),
    ]);
  });
});

describe('MENSA-F-100 kein Nachholen am Nachmittag', () => {
  it('istVormittag ist vor 12:00 wahr, danach falsch', () => {
    expect(istVormittag(new Date('2026-09-04T09:30:00'))).toBe(true);
    expect(istVormittag(new Date('2026-09-04T11:59:00'))).toBe(true);
    expect(istVormittag(new Date('2026-09-04T13:00:00'))).toBe(false);
  });
});
