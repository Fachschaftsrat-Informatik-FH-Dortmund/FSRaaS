import { erkenneSemesterwechsel } from './semesterwechsel';

describe('Hinweis bei Semesterwechsel', () => {
  it('meldet keine Änderung, wenn noch kein Stand gespeichert war (Ersteinrichtung)', () => {
    const ergebnis = erkenneSemesterwechsel(null, ['INPBPI', 'Blockwoche1']);
    expect(ergebnis.geaendert).toBe(false);
    expect(ergebnis.nachher).toEqual(['INPBPI', 'Blockwoche1']);
  });

  it('meldet keine Änderung, wenn dieselben Endpunkte in anderer Reihenfolge geliefert werden', () => {
    const ergebnis = erkenneSemesterwechsel(['INPBPI', 'Blockwoche1', 'TUPB'], ['TUPB', 'INPBPI', 'Blockwoche1']);
    expect(ergebnis.geaendert).toBe(false);
  });

  it('Semesterbeginn erkannt: meldet eine Änderung, wenn ein Endpunkt hinzugekommen ist (z. B. eine neue Blockwoche)', () => {
    const ergebnis = erkenneSemesterwechsel(['INPBPI'], ['INPBPI', 'Blockwoche1']);
    expect(ergebnis.geaendert).toBe(true);
  });

  it('Gewählter Endpunkt entfallen: meldet eine Änderung, wenn ein Endpunkt weggefallen ist', () => {
    const ergebnis = erkenneSemesterwechsel(['INPBPI', 'Blockwoche1'], ['INPBPI']);
    expect(ergebnis.geaendert).toBe(true);
  });

  it('ändert weder Auswahl noch Planeinträge selbst — reine Erkennungsfunktion ohne Nebenwirkung', () => {
    const vorher = Object.freeze(['INPBPI']);
    const nachher = Object.freeze(['INPBPI', 'Blockwoche1']);
    expect(() => erkenneSemesterwechsel(vorher, nachher)).not.toThrow();
  });

  it('trägt vorher/nachher unverändert zur Anzeige mit', () => {
    const ergebnis = erkenneSemesterwechsel(['INPBPI'], ['INPBPI', 'Blockwoche1']);
    expect(ergebnis.vorher).toEqual(['INPBPI']);
    expect(ergebnis.nachher).toEqual(['INPBPI', 'Blockwoche1']);
  });
});
