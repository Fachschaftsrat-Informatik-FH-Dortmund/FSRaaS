## ADDED Requirements

### Requirement: Ausweis der anbietenden Mensa ohne Mensa-Gliederung

Wenn die Gruppierung „nach Mensa" nicht aktiv ist, muss das System an jedem Gericht die Mensa nennen, an der es am angezeigten Tag angeboten wird — auch dann, wenn es nur eine ist. Ist insgesamt nur eine Mensa gewählt, entfällt die Angabe, weil sie nichts unterscheidet. Herkunft: NEU, entschieden 2026-09-07.

#### Scenario: Keine Gruppierung, ein Gericht an genau einer Mensa
- **WHEN** keine Gruppierung aktiv ist, mehrere Mensen gewählt sind und ein Gericht an genau einer davon angeboten wird
- **THEN** nennt das System diese Mensa am Gericht

#### Scenario: Gruppierung nach Kategorie
- **WHEN** die Gruppierung „nach Kategorie" aktiv ist und mehrere Mensen gewählt sind
- **THEN** nennt das System an jedem Gericht die anbietende(n) Mensa/Mensen

#### Scenario: Nur eine Mensa gewählt
- **WHEN** insgesamt nur eine Mensa gewählt ist und keine Mensa-Gruppierung aktiv ist
- **THEN** nennt das System die Mensa nicht am Gericht

### Requirement: Öffnungszeit an der Mensa-Abschnittsüberschrift

Wenn die Gruppierung „nach Mensa" aktiv ist, muss das System zu jedem Abschnitt eine Überschrift mit dem Mensa-Namen führen — auch wenn es nur einen Abschnitt gibt — und die Öffnungszeit dieser Mensa für den angezeigten Wochentag unmittelbar an dieser Überschrift ausweisen, nicht am Listenende. Bei jeder anderen Gruppierung bleiben die Öffnungszeiten der gewählten Mensen am Ende der Gerichtsliste. Herkunft: NEU, entschieden 2026-09-07.

#### Scenario: Mensa-Gruppierung mit hinterlegter Öffnungszeit
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und zu einer Mensa mit Angebot eine Öffnungszeit für den angezeigten Wochentag vorliegt
- **THEN** zeigt das System diese Öffnungszeit an der Abschnittsüberschrift dieser Mensa und nicht am Listenende

#### Scenario: Einzige gewählte Mensa
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und nur eine Mensa einen Abschnitt führt
- **THEN** zeigt das System die Abschnittsüberschrift mit Mensa-Namen und Öffnungszeit trotzdem an

#### Scenario: Ohne Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" nicht aktiv ist
- **THEN** zeigt das System die Öffnungszeiten der gewählten Mensen am Ende der Gerichtsliste

### Requirement: Wiedereröffnungshinweis an der geschlossenen Mensa

Falls eine gewählte Mensa am angezeigten Tag kein Angebot führt, muss das System zusammen mit dem Geschlossen-Hinweis den nächsten Wochentag nennen, für den die Mensa-Stammdaten eine Öffnungszeit führen; gesucht wird ab dem Tag nach dem angezeigten Tag über höchstens die folgenden sieben Tage. Der Hinweis muss als Aussage über die Öffnung formuliert sein, nicht als Aussage über das Angebot, weil die Öffnungszeiten weder Feiertage noch die vorlesungsfreie Zeit abbilden. Führt keiner dieser Tage eine Öffnungszeit, entfällt der Zusatz und es bleibt beim Geschlossen-Hinweis. Herkunft: NEU, entschieden 2026-09-07.

#### Scenario: Geschlossene Mensa mit späterem Öffnungstag
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt und die Stammdaten für einen der folgenden sieben Tage eine Öffnungszeit führen
- **THEN** nennt das System zusätzlich zum Geschlossen-Hinweis den nächstgelegenen dieser Wochentage als Tag der Wiedereröffnung

#### Scenario: Keine Öffnungszeit in den folgenden sieben Tagen
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt und die Stammdaten für keinen der folgenden sieben Tage eine Öffnungszeit führen
- **THEN** zeigt das System allein den Geschlossen-Hinweis, ohne Angabe eines Wiedereröffnungstages

### Requirement: Hinweis bei vollständig gefilterter Mensa

Wenn die Gruppierung „nach Mensa" aktiv ist und alle Gerichte einer gewählten Mensa mit Angebot durch die festgelegten Filtervorgaben ausgeblendet sind, muss das System deren Abschnitt mit einem Hinweis führen, der diesen Fall vom Geschlossen-Hinweis unterscheidet. Herkunft: NEU, entschieden 2026-09-07.

#### Scenario: Alle Gerichte einer Mensa weggefiltert
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und alle Gerichte einer Mensa mit Angebot durch die Filtervorgaben ausgeblendet sind
- **THEN** führt das System deren Abschnitt mit einem Hinweis auf die Filterung, unterscheidbar vom Geschlossen-Hinweis

### Requirement: Beschriftung des Reihenfolge-Kriteriums nach seiner Bedeutung

Das System muss das Reihenfolge-Kriterium in der Sortier-/Gruppierauswahl nach seiner Bedeutung im jeweiligen Kontext beschriften und darf es nicht als „Reihenfolge der Quelle" beschriften: als Gruppenreihenfolge-Kriterium bei Gruppierung nach Mensa als die von der Nutzerin eingestellte Mensa-Reihenfolge, als Gruppenreihenfolge-Kriterium bei Gruppierung nach Kategorie und als Gerichte-Sortierkriterium als die Reihenfolge, in der die Mensa ausgibt. Herkunft: NEU, entschieden 2026-09-07.

#### Scenario: Reihenfolge-Kriterium bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und die Nutzerin die Gruppenreihenfolge-Kriterien öffnet
- **THEN** beschriftet das System das Reihenfolge-Kriterium als die eingestellte Mensa-Reihenfolge

#### Scenario: Reihenfolge-Kriterium bei Kategorie-Gruppierung und bei der Gerichte-Sortierung
- **WHEN** die Nutzerin die Gruppenreihenfolge-Kriterien bei Gruppierung nach Kategorie oder die Gerichte-Sortierkriterien öffnet
- **THEN** beschriftet das System das Reihenfolge-Kriterium als die Reihenfolge der Mensa

#### Scenario: Begriff „Quelle" in der Oberfläche
- **WHEN** die Sortier-/Gruppierauswahl angezeigt wird
- **THEN** trägt kein Kriterium die Beschriftung „Reihenfolge der Quelle"

## MODIFIED Requirements

### Requirement: Gliederung nach Mensa-Auswahlreihenfolge bei aktiver Mensa-Gruppierung

Wenn die Gruppierung „nach Mensa" aktiv ist, muss das System die zusammengefasste Gerichtsliste in Abschnitte je **gewählter** Mensa gliedern — auch je Mensa ohne Angebot am angezeigten Tag —, in der gewählten Gruppenreihenfolge; ein an mehreren Mensen angebotenes Gericht steht im Abschnitt seiner maßgeblichen Mensa. Herkunft: NEU, vgl. L-046 (Kachel je Mensa in der Flutter-App — dieselbe Gliederung nach Mensa, dort als getrennte Kacheln statt als Abschnitte einer Liste), Ausdehnung auf Mensen ohne Angebot entschieden 2026-09-07; vormals MENSA-F-013.

#### Scenario: Gliederung nach Mensa-Auswahlreihenfolge
- **WHEN** die Gruppierung „nach Mensa" aktiv ist
- **THEN** gliedert das System die Liste in Abschnitte je gewählter Mensa, in der gewählten Gruppenreihenfolge, und ordnet ein mehrfach angebotenes Gericht dem Abschnitt seiner maßgeblichen Mensa zu

#### Scenario: Gewählte Mensa ohne Angebot
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** führt das System für sie einen eigenen Abschnitt an der Stelle, die die Gruppenreihenfolge ihr zuweist

### Requirement: Geschlossen-Hinweis für Mensa ohne Angebot

Falls eine gewählte Mensa am angezeigten Tag kein Angebot führt, muss das System sie mit dem Hinweis ausweisen, dass sie an diesem Tag geschlossen ist. Bei Gruppierung „nach Mensa" steht der Hinweis in ihrem eigenen Abschnitt unter der Mensa-Überschrift; bei jeder anderen Gruppierung steht er am Ende der Gerichtsliste. Herkunft: NEU, vgl. L-049 (Leerzustand „Keine Daten vorhanden" je Mensa in der Flutter-App; die Aussage ist dieselbe), Ort des Hinweises von der Gruppierung abhängig gemacht 2026-09-07; vormals MENSA-F-049.

#### Scenario: Gewählte Mensa ohne Tagesangebot bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** zeigt das System den Geschlossen-Hinweis in deren Abschnitt unter der Mensa-Überschrift

#### Scenario: Gewählte Mensa ohne Tagesangebot
- **WHEN** die Gruppierung „nach Mensa" nicht aktiv ist und eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** zeigt das System sie am Ende der Gerichtsliste mit einem Geschlossen-Hinweis an

### Requirement: Keine Öffnungszeit für Mensa ohne Angebot

Das System darf zu einer gewählten Mensa ohne Angebot am angezeigten Tag deren Öffnungszeit für diesen Tag in keiner Darstellungsform anzeigen — weder als Zeile am Listenende noch an der Abschnittsüberschrift; für sie bleiben allein der Geschlossen-Hinweis und der Wiedereröffnungshinweis. Herkunft: NEU, vgl. AND-018 (Öffnungszeiten je Mensa und Wochentag in der Android-App; diese Anforderung schränkt deren Anzeige ein, statt sie neu einzuführen), auf jede Darstellungsform ausgedehnt 2026-09-07; vormals MENSA-F-290.

#### Scenario: Mensa ohne Angebot am Tag
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** zeigt das System für sie keine Öffnungszeit dieses Tages, weder am Listenende noch an ihrer Abschnittsüberschrift

### Requirement: Nicht auswählbare Chips ohne sichtbaren Abschnitt

Das System muss in der Chip-Leiste den Chip einer Gruppe, die am angezeigten Tag keinen eigenen Abschnitt führt, als nicht auswählbar darstellen. Bei Gruppierung „nach Mensa" führt jede gewählte Mensa einen Abschnitt — mit Angebot, mit Geschlossen-Hinweis oder mit Filter-Hinweis —, ihr Chip ist damit stets auswählbar. Herkunft: NEU, auf Gruppen ohne eigenen Abschnitt eingeschränkt 2026-09-07 (vormals MENSA-F-295).

#### Scenario: Chip ohne Abschnitt
- **WHEN** die Gruppierung „nach Kategorie" aktiv ist und eine Kategorie am angezeigten Tag keinen Abschnitt führt
- **THEN** stellt das System deren Chip als nicht auswählbar dar

#### Scenario: Geschlossene Mensa bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** ist ihr Chip auswählbar und führt zu ihrem Abschnitt mit dem Geschlossen-Hinweis

### Requirement: Sortierkriterien für Gerichte

Das System muss als Sortierkriterien mindestens anbieten: Reihenfolge der Mensa, Bezeichnung, Preis der gewählten Preisgruppe, eigene Bewertungsstufe und Community-Gesamtbewertung. Herkunft: NEU, Beschriftung des Reihenfolge-Kriteriums geändert 2026-09-07 (vormals MENSA-F-310).

#### Scenario: Verfügbare Sortierkriterien
- **WHEN** die Nutzerin die Sortierkriterien öffnet
- **THEN** bietet das System mindestens die Reihenfolge der Mensa, Bezeichnung, Preis, eigene Bewertungsstufe und Community-Gesamtbewertung an

### Requirement: Gruppenreihenfolge-Kriterien bei Mensa-Gruppierung

Das System muss bei Gruppierung nach Mensa als Kriterien für die Gruppenreihenfolge die von der Nutzerin eingestellte Mensa-Reihenfolge (die Auswahlreihenfolge nach der Anforderung „Festlegen der Mensa-Reihenfolge") und die alphabetische Reihenfolge des Mensa-Namens anbieten. Herkunft: NEU, Beschriftung des Reihenfolge-Kriteriums geändert 2026-09-07 (vormals MENSA-F-320).

#### Scenario: Kriterien bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist
- **THEN** bietet das System die eingestellte Mensa-Reihenfolge und die alphabetische Reihenfolge als Gruppenreihenfolge-Kriterien an
