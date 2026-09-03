import { layoutForWidth, TABELLEN_SCHWELLE } from './responsive';

describe('ADMIN-N-010 Weboberfläche ab 1024 px vollständig bedienbar', () => {
  it('wählt ab 1024 px das mehrspaltige Tabellenlayout', () => {
    expect(layoutForWidth(TABELLEN_SCHWELLE)).toBe('tabelle');
    expect(layoutForWidth(1440)).toBe('tabelle');
  });

  it('wählt darunter (Telefon-Hochformat) die Kartenliste desselben Umfangs', () => {
    expect(layoutForWidth(1023)).toBe('liste');
    expect(layoutForWidth(390)).toBe('liste');
  });
});
