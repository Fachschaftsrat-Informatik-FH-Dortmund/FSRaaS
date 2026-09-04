// MENSA-F-046: Waagerechtes Wischen über die Gerichtsliste wechselt zum
// benachbarten Tag. Reine Schwellwert-Funktion, damit die Richtung ohne
// PanResponder-Simulation testbar ist; die Pfeile der Datumsauswahl bleiben der
// zweite, sichtbare Bedienweg (MENSA-F-045, UX-F-090).

/**
 * Übersetzt die waagerechte Wischstrecke in eine Blätter-Richtung.
 * Nach links (negatives `dx`) → nächster Tag (+1); nach rechts → vorheriger (-1).
 * Unter der Schwelle: keine Aktion (0).
 */
export function wischRichtung(dx: number, schwelle = 50): -1 | 1 | 0 {
  if (dx <= -schwelle) return 1;
  if (dx >= schwelle) return -1;
  return 0;
}
