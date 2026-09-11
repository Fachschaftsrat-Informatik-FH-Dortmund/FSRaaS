## ADDED Requirements

### Requirement: Weiterführender Bedienweg in der Kopfzeile

Das System muss den Bedienweg zum nächsten Schritt der Einrichtung und der Modulauswahl in der Kopfzeile rechts oben anbieten, nicht am Seitenende. Er muss als hervorgehobene Primäraktion der jeweiligen Ansicht erkennbar sein. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11.

#### Scenario: Nächster Schritt in der Einrichtung
- **WHEN** die Nutzerin die Einrichtung mit mindestens einem gewählten Endpunkt geöffnet hat
- **THEN** bietet das System den Weg zum nächsten Schritt in der Kopfzeile rechts oben an

#### Scenario: Nächster Schritt in der Modulauswahl
- **WHEN** die Nutzerin die Modulauswahl geöffnet hat
- **THEN** bietet das System den Weg zum nächsten Schritt in der Kopfzeile rechts oben an

### Requirement: Sichtbare Beschriftung des Suchfelds

Das System muss das Suchfeld der Endpunktauswahl mit einer sichtbaren Beschriftung versehen, die auch dann stehen bleibt, wenn die Nutzerin bereits Text eingegeben hat. Ein Platzhaltertext allein genügt nicht. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Ein Platzhalter verschwindet mit dem ersten Zeichen; wer die Eingabe später wieder aufnimmt, sieht dann ein unbeschriftetes Feld.

#### Scenario: Suchfeld mit eingegebenem Text
- **WHEN** die Nutzerin Text in das Suchfeld der Endpunktauswahl eingegeben hat
- **THEN** bleibt die Beschriftung des Feldes sichtbar

### Requirement: Symbol für das Zurücksetzen der Auswahl

Das System muss den Bedienweg „Auswahl zurücksetzen" der Modulauswahl mit einem Symbol kennzeichnen, das das Zurücksetzen bezeichnet und sich von den übrigen Symbolen der Kopfzeile unterscheidet. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11.

#### Scenario: Zurücksetzen in der Kopfzeile
- **WHEN** die Nutzerin die Modulauswahl geöffnet hat
- **THEN** trägt der Bedienweg zum Zurücksetzen der Auswahl ein Symbol, das das Zurücksetzen bezeichnet

### Requirement: Eigener Schritt für die Gruppenkennung nach der Modulauswahl

Das System muss die Festlegung der Gruppenkennung als eigenen Schritt zwischen der Modulauswahl und dem Planungsmodus führen. Dieser Schritt trägt beide Wege — die Ermittlung über die Matrikelnummer und die Eingabe von Hand —; die Einrichtung selbst verlangt danach allein die Wahl der Endpunkte. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Erst nach der Modulauswahl steht ein von der Nutzerin selbst gewählter Terminbestand fest, gegen den die Rückmeldung während der Eingabe zählen kann.

#### Scenario: Nach der Modulauswahl
- **WHEN** die Nutzerin die Modulauswahl abschließt
- **THEN** führt das System sie auf den Schritt zur Festlegung der Gruppenkennung, bevor der Planungsmodus erreichbar ist

#### Scenario: Einrichtung ohne Gruppenkennung
- **WHEN** die Nutzerin die Einrichtung der Endpunkte öffnet
- **THEN** verlangt das System dort keine Gruppenkennung

### Requirement: Gruppenkennung verpflichtend vor dem Planungsmodus

Das System muss eine gesetzte Gruppenkennung verlangen, bevor der Planungsmodus erreichbar ist; ein Überspringen dieses Schritts darf es nicht anbieten. Die Kennung bleibt jederzeit über den Zugang zur Einrichtung änderbar. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Entscheidung 2026-09-11. Ohne Kennung bleibt die Gruppenzuordnung wirkungslos — die fachliche Leistung dieses Bereichs, in der beide Alt-Apps belegte Fehler tragen; die Freiheit, gruppenfremde Termine dennoch zu sehen, sichert das Requirement „Kennzeichnung gruppenfremder Termine statt Entfernen", das eine gesetzte Kennung ausdrücklich nur kennzeichnen und nie filtern lässt.

#### Scenario: Weitergehen ohne Kennung
- **WHEN** die Nutzerin auf dem Schritt zur Gruppenkennung weitergehen will, ohne eine Kennung festgelegt zu haben
- **THEN** verwehrt das System den Übergang in den Planungsmodus und benennt die fehlende Angabe

#### Scenario: Kennung nachträglich ändern
- **WHEN** die Nutzerin eine Gruppenkennung festgelegt hat und sie später ändern will
- **THEN** erreicht sie den Schritt zur Gruppenkennung erneut über den Zugang zur Einrichtung

## MODIFIED Requirements

### Requirement: Freitextsuche in der Endpunktauswahl

Das System muss eine Freitextsuche über die Endpunktauswahl bereitstellen, die Klarnamen und Kurznamen berücksichtigt. Das Suchfeld trägt eine sichtbare Beschriftung. Herkunft: NEU, entschieden 2026-09-08, Beschriftung ergänzt 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68). Der Bestand umfasst nach der Live-Abfrage vom 2026-09-08 einundzwanzig auswählbare Endpunkte über acht Gruppen; wer seinen Studiengang kennt, soll ihn nicht durch alle Gruppen suchen müssen.

#### Scenario: Suche nach Kurzname
- **WHEN** die Nutzerin den Kurznamen eines Endpunkts eingibt
- **THEN** zeigt das System den zugehörigen Endpunkt

#### Scenario: Beschriftung bei gefülltem Feld
- **WHEN** die Nutzerin einen Suchbegriff eingegeben hat
- **THEN** bleibt die Beschriftung des Suchfelds sichtbar

### Requirement: Gruppenkennung ohne Matrikelnummer

Das System muss die Gruppenkennung auch ohne Angabe einer Matrikelnummer festlegbar machen; die manuelle Angabe erfolgt über ein einzelnes Textfeld und verlangt Buchstabe und Zahl. Beide Wege stehen auf dem eigenen Schritt zur Gruppenkennung nach der Modulauswahl. Die Ermittlung über die Matrikelnummer (INT-019) bleibt der voreingestellte Weg, weil sie die vollständige Kennung samt Zahl liefert, ohne dass die Nutzerin sie kennen muss; ihr Vorrang muss sich aus Anordnung und Betonung ergeben, ein Umschalter zwischen beiden Wegen ist nicht erforderlich. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Zahlenpflicht ergänzt 2026-09-06, Eingabeform auf ein Textfeld umgestellt 2026-09-08, auf den eigenen Schritt nach der Modulauswahl verlegt 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68). Die bisherige Umsetzung bot ein Antippgitter aus allen 26 Buchstaben nebst getrenntem Zahlenfeld und brauchte dafür einen Umschalter; eine Kennung wie `C8` steht auf jedem Aushang als zwei Zeichen und wird mit der gewöhnlichen Tastatur schneller eingegeben.

#### Scenario: Einrichtung ohne Matrikelnummer
- **WHEN** die Nutzerin keine Matrikelnummer angibt
- **THEN** lässt sich der Schritt dennoch durch Eingabe der vollständigen Kennung in das Textfeld abschließen

#### Scenario: Voreingestellter Weg
- **WHEN** die Nutzerin den Schritt zur Gruppenkennung öffnet
- **THEN** steht die Ermittlung über die Matrikelnummer an erster Stelle und die manuelle Eingabe unmittelbar darunter erreichbar

#### Scenario: Kleinschreibung eingegeben
- **WHEN** die Nutzerin `c8` in das Textfeld eingibt
- **THEN** übernimmt das System die Eingabe als `C8`, ohne sie zurückzuweisen

## REMOVED Requirements

### Requirement: Alle Termine ohne Gruppenkennung

**Reason**: Die Gruppenkennung ist seit diesem Change verpflichtend und nicht überspringbar (Requirement „Gruppenkennung verpflichtend vor dem Planungsmodus"). Der Zustand „keine Gruppenkennung angegeben", den diese Anforderung beschreibt, kann damit nicht mehr entstehen.

**Migration**: Die Freiheit, Termine unabhängig von der eigenen Gruppe zu sehen, entfällt nicht — sie wird vom Requirement „Kennzeichnung gruppenfremder Termine statt Entfernen" getragen, das eine gesetzte Kennung ausdrücklich nur kennzeichnen und nie filtern lässt. Ein gruppenfremder Termin bleibt sichtbar. Der Zweig „keine Kennung gesetzt" in `app/src/areas/schedule/groupMatch.ts` entfällt mit der Umsetzung; ein Bestand aus einer früheren Fassung der App wird beim ersten Öffnen auf den Schritt zur Gruppenkennung geführt.
