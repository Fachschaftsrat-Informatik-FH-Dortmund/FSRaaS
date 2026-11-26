import { besetztMelden, besetztMeldungZurueckziehen } from '@/areas/room-finder/besetztMeldung';
import type { Schreibvorgang } from './schreibwarteschlange';

// Alle Schreibvorgänge, die über die Offline-Schreib-Warteschlange laufen
// (Capability `architecture`, Requirement „Offline-Warteschlange für
// Schreibvorgänge"). Ein neuer Schreibpfad — Mensa-Bewertung,
// Helfer-Anmeldung, E-Key — kommt hier mit einer Zeile dazu. Die Liste wird vor
// der Wiederherstellung aus dem Persister registriert (state/Providers.tsx).
// Verwaltungs- und Moderationshandlungen gehören ausdrücklich nicht hierher
// (ARCH-F-125).

export const SCHREIBVORGAENGE = [
  besetztMelden,
  besetztMeldungZurueckziehen,
] as unknown as Schreibvorgang<never, never>[];
