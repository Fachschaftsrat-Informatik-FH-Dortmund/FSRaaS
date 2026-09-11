## ADDED Requirements

### Requirement: Weiterführender Bedienweg in der Kopfzeile

Das System muss den Bedienweg zum nächsten Schritt der Einrichtung, der Modulauswahl und des Schritts zur Gruppenkennung in der Kopfzeile rechts oben anbieten, nicht am Seitenende. Er muss als hervorgehobene Primäraktion der jeweiligen Ansicht erkennbar sein. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11, auf den Schritt zur Gruppenkennung ausgedehnt 2026-09-11. Der Schritt zur Gruppenkennung entsteht mit diesem Change und gehört zum selben Ablauf; ein abweichender Ort für seinen Weiter-Weg brächte genau die Uneinheitlichkeit zurück, die der Gerätetest beanstandet hat.

#### Scenario: Nächster Schritt in der Einrichtung
- **WHEN** die Nutzerin die Einrichtung mit mindestens einem gewählten Endpunkt geöffnet hat
- **THEN** bietet das System den Weg zum nächsten Schritt in der Kopfzeile rechts oben an

#### Scenario: Nächster Schritt in der Modulauswahl
- **WHEN** die Nutzerin die Modulauswahl geöffnet hat
- **THEN** bietet das System den Weg zum nächsten Schritt in der Kopfzeile rechts oben an

#### Scenario: Nächster Schritt auf dem Schritt zur Gruppenkennung
- **WHEN** die Nutzerin den Schritt zur Gruppenkennung geöffnet hat
- **THEN** bietet das System den Weg in den Planungsmodus in der Kopfzeile rechts oben an

### Requirement: Symbol für das Zurücksetzen der Auswahl

Das System muss den Bedienweg „Auswahl zurücksetzen" der Modulauswahl mit einem Symbol kennzeichnen, das das Zurücksetzen bezeichnet und sich von den übrigen Symbolen der Kopfzeile unterscheidet. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11.

#### Scenario: Zurücksetzen in der Kopfzeile
- **WHEN** die Nutzerin die Modulauswahl geöffnet hat
- **THEN** trägt der Bedienweg zum Zurücksetzen der Auswahl ein Symbol, das das Zurücksetzen bezeichnet

### Requirement: Eigener Schritt für die Gruppenkennung nach der Modulauswahl

Das System muss die Festlegung der Gruppenkennung als eigenen Schritt zwischen der Modulauswahl und dem Planungsmodus führen. Dieser Schritt trägt beide Wege — die Ermittlung über die Matrikelnummer und die Eingabe von Hand —; die Einrichtung selbst verlangt danach allein die Wahl der Endpunkte. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Erst nach der Modulauswahl steht ein von der Nutzerin selbst gewählter Terminbestand fest, gegen den die Rückmeldung während der Eingabe zählen kann (Requirement „Rückmeldung während der Eingabe der Gruppenkennung").

#### Scenario: Nach der Modulauswahl
- **WHEN** die Nutzerin die Modulauswahl abschließt
- **THEN** führt das System sie auf den Schritt zur Festlegung der Gruppenkennung, bevor der Planungsmodus erreichbar ist

#### Scenario: Einrichtung ohne Gruppenkennung
- **WHEN** die Nutzerin die Einrichtung der Endpunkte öffnet
- **THEN** verlangt das System dort keine Gruppenkennung

### Requirement: Gruppenkennung verpflichtend vor dem Planungsmodus

Das System muss eine gesetzte Gruppenkennung verlangen, bevor der Planungsmodus erreichbar ist; ein Überspringen dieses Schritts darf es nicht anbieten. Die Kennung bleibt jederzeit über den Zugang zur Einrichtung änderbar, lässt sich dort aber nur durch eine andere ersetzen, nicht ersatzlos entfernen. Allein die Aktion „Stundenplan zurücksetzen" (Capability `data-and-storage`, Löschkonzept) entfernt sie zusammen mit den gewählten Endpunkten; die Einrichtung beginnt danach von vorn und führt erneut über diesen Schritt. Trägt ein persönlicher Plan aus einer früheren Fassung der App keine Gruppenkennung, muss das System ihn unverändert erhalten und die Nutzerin beim Öffnen des Stundenplans auf den Schritt zur Gruppenkennung führen. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Entscheidung 2026-09-11. Ohne Kennung bleibt die Gruppenzuordnung wirkungslos — die fachliche Leistung dieses Bereichs, in der beide Alt-Apps belegte Fehler tragen; die Freiheit, gruppenfremde Termine dennoch zu sehen, sichert das Requirement „Kennzeichnung gruppenfremder Termine statt Entfernen", das eine gesetzte Kennung ausdrücklich nur kennzeichnen und nie filtern lässt. Ein Weg zum ersatzlosen Entfernen der Kennung stellte den Zustand ohne Kennung wieder her, den dieses Requirement ausschließt; der Plan aus einer früheren Fassung bleibt nach dem Requirement „Kein selbsttätiges Entfernen des Stundenplans" der Capability `data-and-storage` erhalten.

#### Scenario: Weitergehen ohne Kennung
- **WHEN** die Nutzerin auf dem Schritt zur Gruppenkennung weitergehen will, ohne eine Kennung festgelegt zu haben
- **THEN** verwehrt das System den Übergang in den Planungsmodus und benennt die fehlende Angabe

#### Scenario: Kennung nachträglich ändern
- **WHEN** die Nutzerin eine Gruppenkennung festgelegt hat und sie später ändern will
- **THEN** erreicht sie den Schritt zur Gruppenkennung erneut über den Zugang zur Einrichtung

#### Scenario: Kennung ersetzen statt entfernen
- **WHEN** eine Gruppenkennung festgelegt ist und die Nutzerin den Schritt zur Gruppenkennung öffnet
- **THEN** bietet das System an, die Kennung durch eine andere zu ersetzen, aber keinen Bedienweg, sie ersatzlos zu entfernen

#### Scenario: Bestehender Plan ohne Kennung
- **WHEN** ein persönlicher Plan aus einer früheren Fassung der App keine Gruppenkennung trägt und die Nutzerin den Stundenplan öffnet
- **THEN** führt das System sie auf den Schritt zur Gruppenkennung und lässt die Termine des Plans unverändert

## MODIFIED Requirements

### Requirement: Freitextsuche in der Endpunktauswahl

Das System muss eine Freitextsuche über die Endpunktauswahl bereitstellen, die Klarnamen und Kurznamen berücksichtigt. Das Suchfeld muss eine sichtbare Beschriftung tragen, die auch dann stehen bleibt, wenn die Nutzerin bereits Text eingegeben hat; ein Platzhaltertext allein genügt nicht. Herkunft: NEU, entschieden 2026-09-08, Beschriftung ergänzt 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68). Der Bestand umfasst nach der Live-Abfrage vom 2026-09-08 einundzwanzig auswählbare Endpunkte über acht Gruppen; wer seinen Studiengang kennt, soll ihn nicht durch alle Gruppen suchen müssen. Ein Platzhalter verschwindet mit dem ersten Zeichen; wer die Eingabe später wieder aufnimmt, sieht dann ein unbeschriftetes Feld.

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

### Requirement: Rückmeldung während der Eingabe der Gruppenkennung

Während der Eingabe der Gruppenkennung muss das System zurückmelden, wie viele Termine der gewählten Module die Kennung einschließt. Termine nicht gewählter Module des Auswahlbestands zählen dabei weder zu den eingeschlossenen noch zur Gesamtzahl. Herkunft: Recherche: FBWS live abgefragt, 2026-09-04 (vormals SCHED-F-650), Bezugsmenge auf die gewählten Module eingegrenzt 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68). Gegen den gesamten Auswahlbestand gezählt, mischt die Zahl Module ein, die die Nutzerin gar nicht belegt, und sagt über ihren eigenen Plan nichts aus; erst der Schritt zur Gruppenkennung hinter der Modulauswahl macht die engere Bezugsmenge möglich.

#### Scenario: Eingabe ohne Treffer
- **WHEN** die eingegebene Gruppenkennung keinen Termin der gewählten Module einschließt
- **THEN** meldet das System „0 von N Terminen" unmittelbar zurück, ohne die Eingabe zu verwerfen

#### Scenario: Nicht gewählte Module zählen nicht mit
- **WHEN** die Nutzerin zwei Module gewählt hat und der Auswahlbestand darüber hinaus weitere Module enthält
- **THEN** bezieht sich die Rückmeldung ausschließlich auf die Termine der beiden gewählten Module

### Requirement: Gliederung des Auswahlbestands

Das System muss den Auswahlbestand über zwei Bedienschritte gliedern: zuerst die Wahl der Module, danach je gewähltem Modul die Wahl von Veranstaltungsart und Gruppen-Slot. Zwischen beiden liegt der Schritt zur Festlegung der Gruppenkennung. Eine flache Liste einzelner Termine ist ausgeschlossen. Herkunft: Recherche: FBWS live abgefragt, 2026-09-04, auf zwei Schritte aufgeteilt 2026-09-08, Schritt zur Gruppenkennung dazwischen eingefügt 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68); vormals SCHED-F-600. Die Live-Prüfung vom 2026-09-04 ergab 121 Termine für ein einzelnes Fachsemester und 161 für die Wahlpflicht-Sammelkategorie — eine flache Liste ist in dieser Größenordnung nicht bedienbar. Die Aufteilung auf zwei Schritte trennt zusätzlich zwei verschiedene Fragen: welche Module belegt werden und zu welcher Gruppe man geht.

#### Scenario: Auswahlbestand öffnen
- **WHEN** die Nutzerin den Auswahlbestand öffnet
- **THEN** zeigt das System zunächst die Module zur Auswahl, ohne Veranstaltungsarten oder Gruppen-Slots

#### Scenario: Veranstaltungsart und Slot wählen
- **WHEN** Module gewählt sind, die Gruppenkennung festgelegt ist und die Nutzerin zum nächsten Schritt geht
- **THEN** stellt das System je gewähltem Modul Veranstaltungsart und Gruppen-Slot zur Wahl

## REMOVED Requirements

### Requirement: Alle Termine ohne Gruppenkennung

**Reason**: Die Gruppenkennung ist seit diesem Change verpflichtend und nicht überspringbar (Requirement „Gruppenkennung verpflichtend vor dem Planungsmodus"). Der Zustand „keine Gruppenkennung angegeben", den diese Anforderung beschreibt, kann damit nicht mehr entstehen.

**Migration**: Die Freiheit, Termine unabhängig von der eigenen Gruppe zu sehen, entfällt nicht — sie wird vom Requirement „Kennzeichnung gruppenfremder Termine statt Entfernen" getragen, das eine gesetzte Kennung ausdrücklich nur kennzeichnen und nie filtern lässt. Ein gruppenfremder Termin bleibt sichtbar. Der Zweig „keine Kennung gesetzt" in `app/src/areas/schedule/groupMatch.ts` entfällt mit der Umsetzung; ein Plan aus einer früheren Fassung der App ohne Kennung bleibt erhalten und führt beim Öffnen des Stundenplans auf den Schritt zur Gruppenkennung, wie das Requirement „Gruppenkennung verpflichtend vor dem Planungsmodus" festlegt.
