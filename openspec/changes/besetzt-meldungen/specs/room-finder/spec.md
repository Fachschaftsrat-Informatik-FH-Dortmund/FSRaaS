## ADDED Requirements

### Requirement: Gültigkeitsdauer einer Besetzt-Meldung

Das System muss eine Besetzt-Meldung ab ihrem Auslösezeitpunkt 90 Minuten lang als gültig zählen und danach nicht mehr anzeigen. Das gilt auch für eine Meldung, die offline ausgelöst und später übertragen wird: Maßgeblich ist der Auslösezeitpunkt auf dem Gerät, nicht der Zeitpunkt der Übertragung. Ein Auslösezeitpunkt in der Zukunft gilt als Zeitpunkt des Eingangs. Herkunft: NEU, Change `besetzt-meldungen`, 2026-11-26. Schließt den offenen Punkt „Zeitfenster, nach dem eine Besetzt-Meldung verfällt" mit dem Arbeitsziel von 90 Minuten. Ohne Bezug auf den Auslösezeitpunkt würde eine Meldung, die Stunden in der Offline-Warteschlange lag, einen inzwischen wieder freien Raum als besetzt ausweisen.

#### Scenario: Meldung nach Ablauf
- **WHEN** seit der Auslösung einer Besetzt-Meldung mehr als 90 Minuten vergangen sind
- **THEN** zählt das System sie nicht mehr zur angezeigten Meldungsanzahl des Raums

#### Scenario: Verspätet übertragene Meldung
- **WHEN** eine offline ausgelöste Besetzt-Meldung erst nach Ablauf von 90 Minuten übertragen wird
- **THEN** erhöht sie die angezeigte Meldungsanzahl nicht
