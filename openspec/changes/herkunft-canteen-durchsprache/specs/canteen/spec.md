## MODIFIED Requirements

### Requirement: Gliederung nach Mensa-Auswahlreihenfolge bei aktiver Mensa-Gruppierung

Wenn die Gruppierung „nach Mensa" aktiv ist, muss das System die zusammengefasste Gerichtsliste in Abschnitte je Mensa mit Angebot gliedern, in der gewählten Gruppenreihenfolge; ein an mehreren Mensen angebotenes Gericht steht im Abschnitt seiner maßgeblichen Mensa. Herkunft: NEU, vgl. L-046 (Kachel je Mensa in der Flutter-App — dieselbe Gliederung nach Mensa, dort als getrennte Kacheln statt als Abschnitte einer Liste).

#### Scenario: Gliederung nach Mensa-Auswahlreihenfolge
- **WHEN** die Gruppierung „nach Mensa" aktiv ist
- **THEN** gliedert das System die Liste in Abschnitte je Mensa mit Angebot, in der gewählten Gruppenreihenfolge, und ordnet ein mehrfach angebotenes Gericht dem Abschnitt seiner maßgeblichen Mensa zu

### Requirement: Untere Grenze der Tagesauswahl

Das System muss die Tagesauswahl auf den aktuellen Tag und darauf folgende Tage begrenzen. Herkunft: NEU, vgl. L-048 (die Flutter-App erlaubte sieben Tage rückwärts; die Begrenzung ist eine bewusste Abkehr davon, weil ein vergangener Speiseplan keinen Nutzen trägt).

#### Scenario: Kein Zugriff auf vergangene Tage
- **WHEN** die Nutzerin versucht, vor den aktuellen Tag zurückzublättern
- **THEN** verhindert das System dies und bleibt beim aktuellen Tag

### Requirement: Tageswechsel durch Wischen

Wenn die Nutzerin waagerecht über die Gerichtsliste wischt, muss das System zum benachbarten Tag wechseln. Herkunft: NEU, vgl. L-048 (dieselbe Geste in der Flutter-App, dort über ein Fenster von 14 Tagen).

#### Scenario: Wischgeste über die Liste
- **WHEN** die Nutzerin waagerecht über die Gerichtsliste wischt
- **THEN** wechselt das System zum benachbarten Tag

### Requirement: Geschlossen-Hinweis für Mensa ohne Angebot

Falls eine gewählte Mensa am angezeigten Tag kein Angebot führt, muss das System sie am Ende der Gerichtsliste mit dem Hinweis ausweisen, dass sie an diesem Tag geschlossen ist. Herkunft: NEU, vgl. L-049 (Leerzustand „Keine Daten vorhanden" je Mensa in der Flutter-App; die Aussage ist dieselbe, die Einordnung am Listenende folgt aus der Zusammenfassung zu einer Liste).

#### Scenario: Gewählte Mensa ohne Tagesangebot
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** zeigt das System sie am Ende der Gerichtsliste mit einem Geschlossen-Hinweis an

### Requirement: Keine Öffnungszeit für Mensa ohne Angebot

Das System darf zu einer gewählten Mensa ohne Angebot am angezeigten Tag keine Öffnungszeit-Zeile anzeigen; für sie bleibt allein der Geschlossen-Hinweis. Herkunft: NEU, vgl. AND-018 (Öffnungszeiten je Mensa und Wochentag in der Android-App; diese Anforderung schränkt deren Anzeige ein, statt sie neu einzuführen).

#### Scenario: Mensa ohne Angebot am Tag
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** zeigt das System für sie keine Öffnungszeit-Zeile, nur den Geschlossen-Hinweis
