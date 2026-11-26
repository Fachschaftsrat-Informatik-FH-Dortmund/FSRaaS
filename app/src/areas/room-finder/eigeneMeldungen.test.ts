import AsyncStorage from '@react-native-async-storage/async-storage';

import { leseEigeneMeldungen, merkeEigeneMeldung, vergissEigeneMeldung } from './eigeneMeldungen';

beforeEach(async () => {
  await AsyncStorage.clear();
});

const inMinuten = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

describe('Besetzt-Meldung zurückziehen', () => {
  it('das Gerät merkt sich eigene Meldungen ohne Personenbezug, nur Kennung, Raum und Gültigkeit', async () => {
    await merkeEigeneMeldung({ meldungId: 'm1', roomId: 'C.E.44', gueltigBis: inMinuten(90) });

    expect(await leseEigeneMeldungen()).toEqual([{ meldungId: 'm1', roomId: 'C.E.44', gueltigBis: expect.any(String) }]);
    const roh = await AsyncStorage.getItem('fb4:raum.eigeneBesetztMeldungen');
    expect(Object.keys(JSON.parse(roh ?? '[]')[0]).sort()).toEqual(['gueltigBis', 'meldungId', 'roomId']);
  });

  it('abgelaufene Meldungen fallen heraus und lassen sich nicht mehr zurückziehen', async () => {
    await merkeEigeneMeldung({ meldungId: 'm1', roomId: 'C.E.44', gueltigBis: inMinuten(5) });
    await merkeEigeneMeldung({ meldungId: 'm2', roomId: 'A.E.01', gueltigBis: inMinuten(-1) });

    expect((await leseEigeneMeldungen()).map((m) => m.meldungId)).toEqual(['m1']);
    expect(await leseEigeneMeldungen(Date.now() + 6 * 60_000)).toEqual([]);
  });

  it('nach dem Zurückziehen vergisst das Gerät die Meldung', async () => {
    await merkeEigeneMeldung({ meldungId: 'm1', roomId: 'C.E.44', gueltigBis: inMinuten(90) });
    await vergissEigeneMeldung('m1');
    expect(await leseEigeneMeldungen()).toEqual([]);
  });
});
