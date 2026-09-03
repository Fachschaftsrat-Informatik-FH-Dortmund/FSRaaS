import { useWindowDimensions } from 'react-native';

// ADMIN-N-010: Die Weboberfläche ist ab 1024 Pixeln Breite vollständig
// bedienbar — dort mehrspaltige Tabelle, darunter (Telefon) eine Kartenliste
// desselben Funktionsumfangs (ADR 0018). Die Hochformat-Vorgabe der App
// (NFR-N-150) bleibt unberührt: auf dem Telefon greift nie das Tabellenlayout.

export const TABELLEN_SCHWELLE = 1024;

export type AdminLayout = 'tabelle' | 'liste';

export function layoutForWidth(width: number): AdminLayout {
  return width >= TABELLEN_SCHWELLE ? 'tabelle' : 'liste';
}

export function useAdminLayout(): AdminLayout {
  const { width } = useWindowDimensions();
  return layoutForWidth(width);
}
