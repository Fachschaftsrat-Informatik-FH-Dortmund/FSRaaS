// ADMIN-N-010: Die Weboberfläche ist ab 1024 Pixeln Breite vollständig
// bedienbar — dort als mehrspaltige Tabelle vorgesehen, darunter (Telefon) die
// Kartenliste desselben Funktionsumfangs (ADR 0018). Die Hochformat-Vorgabe der
// App (NFR-N-150) bleibt unberührt: auf dem Telefon greift nie das Tabellenlayout.
//
// Stand Roadmap-Schritt 3: die Schwellwertlogik ist hier festgelegt und getestet;
// das eigentliche Tabellen-Rendering ab 1024 px ist noch offen und im
// Prüfprotokoll 2026-09-02 als solches vermerkt. Die Kartenliste ist auf breiten
// Bildschirmen bereits vollständig bedienbar.

export const TABELLEN_SCHWELLE = 1024;

export type AdminLayout = 'tabelle' | 'liste';

export function layoutForWidth(width: number): AdminLayout {
  return width >= TABELLEN_SCHWELLE ? 'tabelle' : 'liste';
}
