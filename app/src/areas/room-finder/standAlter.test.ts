import { quelleVeraltet } from '@/ui/state/dataAge';
import { raumplanQuelleStand, raumplanVeraltet } from './standAlter';

const MIN = 60_000;
const t0 = Date.parse('2026-11-26T10:00:00Z');
const stand = (minutenVorher: number) => ({
  abgerufenAm: new Date(t0 - minutenVorher * MIN).toISOString(),
  quelleErreichbar: true,
});

describe('Alter eines veralteten Raumplan-Stands anzeigen', () => {
  it('Veralteter Zwischenspeicher: beim Abruf älter als der stündliche Takt', () => {
    expect(raumplanVeraltet(stand(61), t0)).toBe(true);
  });

  it('Aktueller Zwischenspeicher: beim Abruf jünger als eine Stunde', () => {
    expect(raumplanVeraltet(stand(59), t0)).toBe(false);
  });

  it('die Gültigkeitsdauer des App-Zwischenspeichers zählt nicht zum Bestandsalter', () => {
    // Abruf um t0 mit 50 Minuten altem Bestand, angezeigt 14 Minuten später.
    const angabe = raumplanQuelleStand(stand(50), t0, t0 + 14 * MIN);
    expect(quelleVeraltet({ quelleStand: angabe.zeitpunkt, maxAlterMs: angabe.maxAlterMs, now: t0 + 14 * MIN })).toBe(false);
  });

  it('ein beim Abruf veralteter Bestand bleibt in der Anzeige veraltet', () => {
    const angabe = raumplanQuelleStand(stand(90), t0, t0 + 5 * MIN);
    expect(quelleVeraltet({ quelleStand: angabe.zeitpunkt, maxAlterMs: angabe.maxAlterMs, now: t0 + 5 * MIN })).toBe(true);
    expect(angabe.hinweis).toBe('raum.standVeraltet');
  });
});
