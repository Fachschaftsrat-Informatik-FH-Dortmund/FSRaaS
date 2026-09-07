## Purpose

Zeigt Studierenden den Speiseplan der von ihnen gewählten Mensen des Studierendenwerks Dortmund, als eine über die Mensen zusammengefasste Gerichtsliste mit freier Sortierung und Gruppierung, ergänzt um Filterung nach Preis, Unverträglichkeit und Lebensstil sowie eine lokale Benachrichtigung bei Lieblingsgerichten. Vormals `specs/features/canteen/spec.md` (Präfix `MENSA`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Anzeige des Tagesspeiseplans der gewählten Mensen

Das System muss den Speiseplan des aktuellen Tages für die gewählten Mensen anzeigen. Herkunft: Alt: lib/areas/canteen/repositories/meals_repository.dart (vormals MENSA-F-010).

#### Scenario: Speiseplan für gewählte Mensen
- **WHEN** mindestens eine Mensa gewählt ist und für den aktuellen Tag ein Angebot vorliegt
- **THEN** zeigt das System den Speiseplan dieses Tages für die gewählten Mensen an

### Requirement: Zusammenfassung zu einem Eintrag je Gericht

Das System muss die Gerichte aller gewählten Mensen eines Tages zu genau einem Eintrag je Gericht zusammenfassen. Herkunft: NEU (vormals MENSA-F-012).

#### Scenario: Gleiches Gericht an zwei Mensen
- **WHEN** zwei gewählte Mensen am selben Tag dasselbe Gericht anbieten
- **THEN** erscheint es genau einmal in der Gerichtsliste

### Requirement: Gliederung nach Mensa-Auswahlreihenfolge bei aktiver Mensa-Gruppierung

Wenn die Gruppierung „nach Mensa" aktiv ist, muss das System die zusammengefasste Gerichtsliste in Abschnitte je **gewählter** Mensa gliedern — auch je Mensa ohne Angebot am angezeigten Tag —, in der gewählten Gruppenreihenfolge; ein an mehreren Mensen angebotenes Gericht steht im Abschnitt seiner maßgeblichen Mensa. Herkunft: NEU, vgl. L-046 (Kachel je Mensa in der Flutter-App — dieselbe Gliederung nach Mensa, dort als getrennte Kacheln statt als Abschnitte einer Liste), Ausdehnung auf Mensen ohne Angebot entschieden 2026-09-07; vormals MENSA-F-013.

#### Scenario: Gliederung nach Mensa-Auswahlreihenfolge
- **WHEN** die Gruppierung „nach Mensa" aktiv ist
- **THEN** gliedert das System die Liste in Abschnitte je gewählter Mensa, in der gewählten Gruppenreihenfolge, und ordnet ein mehrfach angebotenes Gericht dem Abschnitt seiner maßgeblichen Mensa zu

#### Scenario: Gewählte Mensa ohne Angebot
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** führt das System für sie einen eigenen Abschnitt an der Stelle, die die Gruppenreihenfolge ihr zuweist

### Requirement: Hinweis bei vollständig gefilterter Mensa

Wenn die Gruppierung „nach Mensa" aktiv ist und alle Gerichte einer gewählten Mensa mit Angebot durch die festgelegten Filtervorgaben ausgeblendet sind, muss das System deren Abschnitt mit einem Hinweis führen, der diesen Fall vom Geschlossen-Hinweis unterscheidet. Herkunft: NEU, entschieden 2026-09-07.

#### Scenario: Alle Gerichte einer Mensa weggefiltert
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und alle Gerichte einer Mensa mit Angebot durch die Filtervorgaben ausgeblendet sind
- **THEN** führt das System deren Abschnitt mit einem Hinweis auf die Filterung, unterscheidbar vom Geschlossen-Hinweis

### Requirement: Ausweis mehrerer anbietender Mensen je Gericht

Das System muss zu jedem zusammengefassten Gericht ausweisen, an welchen der gewählten Mensen es am angezeigten Tag angeboten wird, sofern es mehr als eine ist. Herkunft: NEU (vormals MENSA-F-014).

#### Scenario: Gericht an mehreren Mensen verfügbar
- **WHEN** ein zusammengefasstes Gericht an mehr als einer gewählten Mensa angeboten wird
- **THEN** nennt das System alle anbietenden Mensen am Gericht

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

### Requirement: Chip-Leiste zur Gruppen-Ankernavigation

Das System muss über der Gerichtsliste eine waagerechte Chip-Leiste mit den Gruppen der aktiven Gruppierung in der gewählten Gruppenreihenfolge führen und darin den Chip der Gruppe hervorheben, deren Abschnitt gerade oben im sichtbaren Bereich der Liste steht. Herkunft: NEU (vormals MENSA-F-016).

#### Scenario: Chip-Leiste mit Hervorhebung
- **WHEN** die Gerichtsliste mit aktiver Gruppierung angezeigt wird
- **THEN** zeigt das System eine Chip-Leiste mit den Gruppen in Gruppenreihenfolge und hebt den Chip des oben sichtbaren Abschnitts hervor

### Requirement: Scrollen zum Abschnitt bei Chip-Antippen

Wenn die Nutzerin einen Chip antippt, muss das System die Gerichtsliste an den Anfang des Abschnitts dieser Gruppe scrollen. Herkunft: NEU (vormals MENSA-F-017).

#### Scenario: Chip angetippt
- **WHEN** die Nutzerin einen Chip in der Chip-Leiste antippt
- **THEN** scrollt das System die Gerichtsliste an den Anfang des zugehörigen Abschnitts

### Requirement: Fortlaufende Hervorhebung beim Scrollen

Wenn die Nutzerin die Gerichtsliste scrollt, muss das System die Hervorhebung in der Chip-Leiste fortlaufend auf die Gruppe setzen, deren Abschnitt oben im sichtbaren Bereich steht. Herkunft: NEU (vormals MENSA-F-019).

#### Scenario: Scrollen durch die Liste
- **WHEN** die Nutzerin die Gerichtsliste scrollt
- **THEN** aktualisiert das System die Hervorhebung in der Chip-Leiste fortlaufend auf den oben sichtbaren Abschnitt

### Requirement: Preis-, Kennzeichnungs- und Zusatzstoffangaben der maßgeblichen Mensa

Das System muss zu einem zusammengefassten Gericht die Preis-, Kennzeichnungs- und Zusatzstoffangaben der maßgeblichen Mensa — der Mensa seines Abschnitts — anzeigen. Herkunft: NEU (vormals MENSA-F-018).

#### Scenario: Angaben der maßgeblichen Mensa
- **WHEN** ein zusammengefasstes Gericht angezeigt wird
- **THEN** zeigt das System dessen Preis-, Kennzeichnungs- und Zusatzstoffangaben so an, wie sie an der maßgeblichen Mensa gelten

### Requirement: Auswahl der angezeigten Mensen

Das System muss der Nutzerin die Auswahl einer oder mehrerer Mensen aus der vom Backend gelieferten Mensa-Liste ermöglichen. Herkunft: Alt: lib/areas/more/screens/select_canteens_page.dart (vormals MENSA-F-020).

#### Scenario: Mensen auswählen
- **WHEN** die Nutzerin die Mensaauswahl öffnet
- **THEN** ermöglicht das System die Auswahl einer oder mehrerer Mensen aus der vom Backend gelieferten Liste

### Requirement: Festlegen der Mensa-Reihenfolge

Das System muss der Nutzerin das Festlegen der Reihenfolge ermöglichen, in der die gewählten Mensen angezeigt werden. Herkunft: Recherche: alte apps/android-fb4, activities/MenuSortActivity.java, 2026-08-25 (vormals MENSA-F-025).

#### Scenario: Reihenfolge ändern
- **WHEN** die Nutzerin die Reihenfolge der gewählten Mensen ändert
- **THEN** übernimmt das System diese Reihenfolge für die Anzeige

### Requirement: Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe

Das System muss zu jedem Gericht Kategorie, Bezeichnung, Preis für Studierende, Mitarbeitende und Gäste sowie Zusatzstoff-/Allergenhinweise anzeigen. Herkunft: Alt: lib/areas/canteen/models/meal.dart (vormals MENSA-F-030).

#### Scenario: Vollständige Gerichtsangaben
- **WHEN** ein Gericht angezeigt wird
- **THEN** zeigt das System Kategorie, Bezeichnung, alle drei Preise sowie Zusatzstoff-/Allergenhinweise dieses Gerichts

### Requirement: Anzeige von Gericht-Kennzeichnungen

Sofern die Quelle (INT-015) zu einem Gericht Kennzeichnungen liefert (z. B. vegan, vegetarisch, Klimateller), muss das System sie am Gericht anzeigen. Herkunft: Recherche: INT-015, 2026-09-03 (vormals MENSA-F-035).

#### Scenario: Gericht mit Kennzeichnung
- **WHEN** INT-015 zu einem Gericht mindestens eine Kennzeichnung liefert
- **THEN** zeigt das System diese Kennzeichnung am Gericht an

### Requirement: Beilagen als eigene Kategorie

Das System muss `Beilagen` als eigene Kategorie von den Hauptspeisen getrennt darstellen. Herkunft: Alt: lib/areas/canteen/models/meal.dart (vormals MENSA-F-040).

#### Scenario: Beilage im Speiseplan
- **WHEN** der Tagesplan eine Beilage enthält
- **THEN** stellt das System sie in einer eigenen Beilagen-Kategorie getrennt von den Hauptspeisen dar

### Requirement: Untere Grenze der Tagesauswahl

Das System muss die Tagesauswahl auf den aktuellen Tag und darauf folgende Tage begrenzen. Herkunft: NEU, vgl. L-048 (die Flutter-App erlaubte sieben Tage rückwärts; die Begrenzung ist eine bewusste Abkehr davon, weil ein vergangener Speiseplan keinen Nutzen trägt); vormals MENSA-F-042.

#### Scenario: Kein Zugriff auf vergangene Tage
- **WHEN** die Nutzerin versucht, vor den aktuellen Tag zurückzublättern
- **THEN** verhindert das System dies und bleibt beim aktuellen Tag

### Requirement: Zurücksetzen der Tagesauswahl

Das System muss eine Handlung bereitstellen, die die Tagesauswahl unmittelbar auf den aktuellen Tag zurücksetzt; am aktuellen Tag ist sie nicht auslösbar. Herkunft: NEU (vormals MENSA-F-043).

#### Scenario: Zurücksetzen nach Vorblättern
- **WHEN** die Nutzerin auf einen Folgetag geblättert hat und die Zurücksetzen-Handlung auslöst
- **THEN** stellt das System die Tagesauswahl in einem Schritt auf den aktuellen Tag zurück

### Requirement: Überspringen angebotsfreier Wochenendtage

Falls an einem Samstag oder Sonntag keine der gewählten Mensen ein Angebot führt, muss das System diesen Tag beim Blättern und Wischen überspringen; den aktuellen Tag muss das System davon ausnehmen und nie überspringen. Ein Wochenendtag ist damit erreichbar, wenn er ein Angebot führt oder wenn er der aktuelle Tag ist. Herkunft: NEU, Ausnahme für den aktuellen Tag entschieden 2026-09-05 (vormals MENSA-F-044).

#### Scenario: Samstag ohne Angebot
- **WHEN** an einem Samstag, der nicht der aktuelle Tag ist, keine der gewählten Mensen ein Angebot führt
- **THEN** überspringt das System diesen Tag beim Blättern und beim Wischen

#### Scenario: Rückblättern auf einen angebotsfreien aktuellen Wochenendtag
- **WHEN** der aktuelle Tag ein Samstag oder Sonntag ohne Angebot ist und die Nutzerin von einem Folgetag zurückblättert oder zurückwischt
- **THEN** wechselt das System auf den aktuellen Tag, statt ihn zu überspringen

#### Scenario: Vorblättern vom angebotsfreien aktuellen Wochenendtag
- **WHEN** der aktuelle Tag ein Samstag ohne Angebot ist und die Nutzerin vorwärts blättert
- **THEN** überspringt das System den folgenden Sonntag ohne Angebot und zeigt den Montag

### Requirement: Blättern zu benachbarten Tagen

Das System muss der Nutzerin das Blättern zu benachbarten Tagen des Speiseplans ermöglichen. Herkunft: Alt: lib/areas/canteen/screens/canteen_overview_page.dart:39 (vormals MENSA-F-045).

#### Scenario: Zum Folgetag blättern
- **WHEN** die Nutzerin die Datumsauswahl vorwärts bedient
- **THEN** zeigt das System den Speiseplan des nächsten zulässigen Tages

### Requirement: Tageswechsel durch Wischen

Wenn die Nutzerin waagerecht über die Gerichtsliste wischt, muss das System zum benachbarten Tag wechseln. Herkunft: NEU, vgl. L-048 (dieselbe Geste in der Flutter-App, dort über ein Fenster von 14 Tagen); vormals MENSA-F-046.

#### Scenario: Wischgeste über die Liste
- **WHEN** die Nutzerin waagerecht über die Gerichtsliste wischt
- **THEN** wechselt das System zum benachbarten Tag

### Requirement: Öffnungszeiten je Mensa und Wochentag

Das System muss zu jeder gewählten Mensa deren Öffnungszeiten für den angezeigten Wochentag ausweisen. Herkunft: Recherche: alte apps/android-fb4, model/OpeningsDto.java, 2026-08-25 (vormals MENSA-F-047).

#### Scenario: Öffnungszeit einer Mensa
- **WHEN** eine gewählte Mensa am angezeigten Wochentag ein Angebot führt
- **THEN** zeigt das System ihre Öffnungszeit für diesen Wochentag an

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

### Requirement: Gerichtskategorien und Zusatzstoffhinweise in Oberflächensprache

Das System muss Gerichtskategorien und Zusatzstoffhinweise in der gewählten Oberflächensprache anzeigen, sofern die Quelle sie in dieser Sprache liefert. Herkunft: Recherche: alte apps/android-fb4, model/MenuInformationDto.java, 2026-08-25 (vormals MENSA-F-048).

#### Scenario: Quelle liefert Übersetzung
- **WHEN** die Quelle Kategorie- oder Zusatzstoffbezeichnungen in der gewählten Oberflächensprache liefert
- **THEN** zeigt das System sie in dieser Sprache an

### Requirement: Geschlossen-Hinweis für Mensa ohne Angebot

Falls eine gewählte Mensa am angezeigten Tag kein Angebot führt, muss das System sie mit dem Hinweis ausweisen, dass sie an diesem Tag geschlossen ist. Bei Gruppierung „nach Mensa" steht der Hinweis in ihrem eigenen Abschnitt unter der Mensa-Überschrift; bei jeder anderen Gruppierung steht er am Ende der Gerichtsliste. Herkunft: NEU, vgl. L-049 (Leerzustand „Keine Daten vorhanden" je Mensa in der Flutter-App; die Aussage ist dieselbe), Ort des Hinweises von der Gruppierung abhängig gemacht 2026-09-07; vormals MENSA-F-049.

#### Scenario: Gewählte Mensa ohne Tagesangebot bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** zeigt das System den Geschlossen-Hinweis in deren Abschnitt unter der Mensa-Überschrift

#### Scenario: Gewählte Mensa ohne Tagesangebot
- **WHEN** die Gruppierung „nach Mensa" nicht aktiv ist und eine gewählte Mensa am angezeigten Tag kein Angebot führt
- **THEN** zeigt das System sie am Ende der Gerichtsliste mit einem Geschlossen-Hinweis an

### Requirement: Wiedereröffnungshinweis an der geschlossenen Mensa

Falls eine gewählte Mensa am angezeigten Tag kein Angebot führt, muss das System zusammen mit dem Geschlossen-Hinweis den nächsten Wochentag nennen, für den die Mensa-Stammdaten eine Öffnungszeit führen; gesucht wird ab dem Tag nach dem angezeigten Tag über höchstens die folgenden sieben Tage. Der Hinweis muss als Aussage über die Öffnung formuliert sein, nicht als Aussage über das Angebot, weil die Öffnungszeiten weder Feiertage noch die vorlesungsfreie Zeit abbilden. Führt keiner dieser Tage eine Öffnungszeit, entfällt der Zusatz und es bleibt beim Geschlossen-Hinweis. Herkunft: NEU, entschieden 2026-09-07.

#### Scenario: Geschlossene Mensa mit späterem Öffnungstag
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt und die Stammdaten für einen der folgenden sieben Tage eine Öffnungszeit führen
- **THEN** nennt das System zusätzlich zum Geschlossen-Hinweis den nächstgelegenen dieser Wochentage als Tag der Wiedereröffnung

#### Scenario: Keine Öffnungszeit in den folgenden sieben Tagen
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt und die Stammdaten für keinen der folgenden sieben Tage eine Öffnungszeit führen
- **THEN** zeigt das System allein den Geschlossen-Hinweis, ohne Angabe eines Wiedereröffnungstages

### Requirement: Zuletzt geladener Speiseplan bei fehlender Netzwerkverbindung

Solange keine Netzwerkverbindung besteht, muss das System den zuletzt geladenen Speiseplan anzeigen. Herkunft: Alt: lib/areas/canteen/repositories/meals_repository.dart (vormals MENSA-F-050).

#### Scenario: Offline-Zugriff
- **WHEN** keine Netzwerkverbindung besteht
- **THEN** zeigt das System den zuletzt geladenen Speiseplan an

### Requirement: Sichtbare Fehlermeldung beim Ladefehler

Falls beim Laden des Speiseplans ein Fehler auftritt, muss das System ihn der Nutzerin sichtbar machen, statt ihn stillschweigend zu verwerfen. Herkunft: Alt: bewusst verworfen (vormals MENSA-F-060).

#### Scenario: Fehler beim Laden
- **WHEN** beim Laden des Speiseplans ein Fehler auftritt
- **THEN** zeigt das System der Nutzerin eine sichtbare Fehlermeldung, statt den Fehler zu verwerfen

### Requirement: TLS-gesicherter Abruf des Speiseplans

Das System muss den Speiseplan ausschließlich über eine TLS-gesicherte Verbindung abrufen. Herkunft: Alt: bewusst verworfen (vormals MENSA-F-070).

#### Scenario: Speiseplan-Abruf
- **WHEN** das System den Speiseplan abruft
- **THEN** erfolgt der Abruf ausschließlich über eine TLS-gesicherte Verbindung

### Requirement: Ausgangsbestand bei nicht ladbarer Mensa-Liste

Falls die Mensa-Liste nicht vom Backend geladen werden kann, muss das System mit dem im Anwendungspaket mitgelieferten Ausgangsbestand arbeiten. Herkunft: Recherche: alte apps/android-fb4, assets/canteens.json, 2026-08-25 (vormals MENSA-F-075).

#### Scenario: Mensa-Liste nicht ladbar
- **WHEN** die Mensa-Liste nicht vom Backend geladen werden kann
- **THEN** arbeitet das System mit dem mitgelieferten Ausgangsbestand

### Requirement: Lieblingsgericht aus Höchstbewertung

Wenn die Nutzerin ein Gericht mit der besten Bewertungsstufe nach der Capability `canteen-ratings` (RATE-F-010) bewertet, muss das System dieses Gericht als Lieblingsgericht führen. Herkunft: NEU (vormals MENSA-F-085).

#### Scenario: Beste Bewertungsstufe vergeben
- **WHEN** die Nutzerin ein Gericht mit der besten Bewertungsstufe bewertet
- **THEN** führt das System dieses Gericht als Lieblingsgericht

### Requirement: Entfernen aus Lieblingsgerichten bei Rücknahme der Höchstbewertung

Wenn die Nutzerin ihre beste Bewertungsstufe für ein Gericht zurücknimmt oder herabsetzt, muss das System dieses Gericht nicht mehr als Lieblingsgericht führen. Herkunft: NEU (vormals MENSA-F-087).

#### Scenario: Höchstbewertung zurückgenommen
- **WHEN** die Nutzerin ihre beste Bewertungsstufe für ein Gericht zurücknimmt oder herabsetzt
- **THEN** führt das System dieses Gericht nicht mehr als Lieblingsgericht

### Requirement: Zuordnung über normalisierte Gerichtsbezeichnung

Das System muss die Zuordnung eines Lieblingsgerichts anhand der normalisierten Gerichtsbezeichnung (RATE-F-050, Capability `canteen-ratings`) vornehmen, damit dasselbe Gericht unabhängig vom Zubereitungstag wiedererkannt wird. Herkunft: NEU (vormals MENSA-F-090).

#### Scenario: Wiedererkennung an anderem Tag
- **WHEN** ein als Lieblingsgericht geführtes Gericht an einem anderen Tag unter derselben normalisierten Bezeichnung erneut angeboten wird
- **THEN** erkennt das System es als dasselbe Lieblingsgericht wieder

### Requirement: Lokale Benachrichtigung bei Lieblingsgericht im Tagesplan

Wenn der Tages-Speiseplan einer gewählten Mensa ein als Lieblingsgericht geführtes Gericht enthält, muss das System die Nutzerin per lokaler Gerätebenachrichtigung darüber informieren. Herkunft: NEU (vormals MENSA-F-100).

#### Scenario: Lieblingsgericht im Tagesangebot
- **WHEN** der Tagesplan einer gewählten Mensa ein Lieblingsgericht enthält
- **THEN** löst das System eine lokale Gerätebenachrichtigung aus

### Requirement: Abschaltbare Lieblingsgericht-Benachrichtigung

Solange die Lieblingsgericht-Benachrichtigung in den Einstellungen (Capability `settings`, SET-F-170) abgeschaltet ist, darf das System keine Benachrichtigung auslösen. Herkunft: NEU (vormals MENSA-F-105).

#### Scenario: Benachrichtigung abgeschaltet
- **WHEN** die Lieblingsgericht-Benachrichtigung in den Einstellungen abgeschaltet ist
- **THEN** löst das System keine Benachrichtigung aus, auch wenn ein Lieblingsgericht im Tagesplan erscheint

### Requirement: Höchstens eine Benachrichtigung je Gericht-Mensa-Tag

Das System darf für dasselbe Gericht an derselben Mensa am selben Tag höchstens eine Benachrichtigung auslösen. Herkunft: NEU (vormals MENSA-F-110).

#### Scenario: Wiederholter Abgleich am selben Tag
- **WHEN** der Abgleich für dasselbe Gericht an derselben Mensa am selben Tag erneut ausgeführt wird
- **THEN** löst das System keine weitere Benachrichtigung aus

### Requirement: Handlung „Alle Mensen anzeigen"

Das System muss am Ende der Gerichtsliste eine Handlung „Alle Mensen anzeigen" bereitstellen. Herkunft: NEU (vormals MENSA-F-120).

#### Scenario: Zugang am Listenende
- **WHEN** die Gerichtsliste der Hauptansicht angezeigt wird
- **THEN** steht am Ende der Liste die Handlung „Alle Mensen anzeigen" bereit

### Requirement: Ansicht aller Mensen nach Mensa getrennt

Wenn die Nutzerin die Handlung „Alle Mensen anzeigen" auswählt, muss das System die Speisepläne aller vom Backend gelieferten Mensen für den angezeigten Tag nach Mensa getrennt untereinander anzeigen. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/menu/MenuDayFragment.java:105 (vormals MENSA-F-130).

#### Scenario: Alle Mensen anzeigen ausgelöst
- **WHEN** die Nutzerin die Handlung „Alle Mensen anzeigen" auswählt
- **THEN** zeigt das System die Speisepläne aller Mensen für den angezeigten Tag nach Mensa getrennt untereinander an

### Requirement: Auslassen angebotsfreier Mensen in der Ansicht aller Mensen

Das System muss in der Ansicht aller Mensen Mensen ohne Angebot am angezeigten Tag auslassen. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/menu/MenuDayFragment.java:109 (vormals MENSA-F-140).

#### Scenario: Mensa ohne Angebot in der Vergleichsansicht
- **WHEN** eine Mensa in der Ansicht aller Mensen am angezeigten Tag kein Angebot führt
- **THEN** lässt das System diese Mensa in der Ansicht aus

### Requirement: Keine Auswahländerung durch die Ansicht aller Mensen

Das System darf die Ansicht aller Mensen nicht als Änderung der Mensaauswahl werten. Herkunft: NEU (vormals MENSA-F-150).

#### Scenario: Rückkehr aus der Ansicht aller Mensen
- **WHEN** die Nutzerin aus der Ansicht aller Mensen in die Hauptansicht zurückkehrt
- **THEN** sind Mensaauswahl und -reihenfolge unverändert

### Requirement: Sammelgruppe ohne Ausgabestellen-Kategorie

Falls die Quelle (INT-015) zu einem Gericht keine Ausgabestellen-Kategorie liefert (weder `counterNames` noch `counter`), muss das System das Gericht ohne Kategorieüberschrift in einer Sammelgruppe am Ende der Gerichtsliste führen, statt einen Platzhalter oder einen quellinternen Zahlencode als Kategorie anzuzeigen. Herkunft: Recherche: INT-015 Food Fakultät (Kennung 474), 2026-09-04 (vormals MENSA-F-160).

#### Scenario: Gericht ohne Ausgabestellen-Kategorie
- **WHEN** ein Gericht von der Quelle ohne `counterNames` und ohne `counter` geliefert wird
- **THEN** führt das System es ohne Kategorieüberschrift in einer Sammelgruppe am Ende der Liste

### Requirement: Zugang zum Filtermenü

Das System muss der Nutzerin oben rechts in der Hauptansicht einen Zugang zum Filtermenü bereitstellen, gekennzeichnet durch ein klassisches Filtersymbol (Trichter). Herkunft: NEU (vormals MENSA-F-170).

#### Scenario: Filterzugang sichtbar
- **WHEN** die Hauptansicht angezeigt wird
- **THEN** zeigt das System oben rechts einen mit einem Trichtersymbol gekennzeichneten Zugang zum Filtermenü

### Requirement: Hinweis auf lokale Verarbeitung im Filtermenü

Das System muss im Filtermenü am Seitenende einen Hinweis anzeigen, dass die festgelegten Filtereinstellungen ausschließlich auf dem Gerät verarbeitet werden. Herkunft: NEU (vormals MENSA-F-175).

#### Scenario: Hinweis im Filtermenü
- **WHEN** das Filtermenü geöffnet ist
- **THEN** zeigt das System am Seitenende den Hinweis auf die ausschließlich lokale Verarbeitung

### Requirement: Festlegen eigener Unverträglichkeiten

Das System muss der Nutzerin ermöglichen, eine oder mehrere der zu einem Gericht möglichen Zusatzstoff-/Allergenkennzeichnungen als eigene Unverträglichkeit festzulegen. Herkunft: NEU (vormals MENSA-F-180).

#### Scenario: Unverträglichkeit festlegen
- **WHEN** die Nutzerin im Filtermenü eine Zusatzstoff-/Allergenkennzeichnung als Unverträglichkeit auswählt
- **THEN** speichert das System diese Auswahl als eigene Unverträglichkeit

### Requirement: Ausblenden gefilterter Gerichte in der Hauptansicht

Wenn mindestens eine Filtervorgabe festgelegt ist (Höchstpreis, Unverträglichkeit, Lebensstil-Vorgabe oder Ausschluss), muss das System ein davon betroffenes Gericht aus der Gerichtsliste der Hauptansicht ausblenden. Herkunft: NEU (vormals MENSA-F-190).

#### Scenario: Gericht durch Filter betroffen
- **WHEN** mindestens eine Filtervorgabe gesetzt ist und ein Gericht davon betroffen ist
- **THEN** blendet das System dieses Gericht aus der Gerichtsliste der Hauptansicht aus

### Requirement: Anzeige der Anzahl gefilterter Gerichte

Das System muss am Ende der Gerichtsliste die Anzahl der wegen der festgelegten Filtervorgaben ausgeblendeten Gerichte anzeigen. Herkunft: NEU (vormals MENSA-F-200).

#### Scenario: Ausgeblendete Gerichte zählen
- **WHEN** mindestens ein Gericht wegen einer Filtervorgabe ausgeblendet ist
- **THEN** zeigt das System deren Anzahl am Ende der Gerichtsliste an

### Requirement: Ausgrauen gefilterter Gerichte in der Ansicht aller Mensen

Das System muss in der Ansicht aller Mensen ein Gericht, das von einer festgelegten Filtervorgabe betroffen ist, ausgegraut und ohne Interaktionsmöglichkeit darstellen, statt es wie in der Hauptansicht auszublenden. Herkunft: NEU (vormals MENSA-F-210).

#### Scenario: Gefiltertes Gericht in der Vergleichsansicht
- **WHEN** ein Gericht in der Ansicht aller Mensen von einer Filtervorgabe betroffen ist
- **THEN** stellt das System es ausgegraut und ohne Interaktionsmöglichkeit dar

### Requirement: Übertragungsverbot für Unverträglichkeiten

Das System darf die festgelegten Unverträglichkeiten unter keinen Umständen an das Backend oder eine andere externe Schnittstelle übertragen. Herkunft: NEU (vormals MENSA-F-215).

#### Scenario: Netzwerkmitschnitt bei aktivem Unverträglichkeiten-Filter
- **WHEN** ein Netzwerkmitschnitt bei aktivem Unverträglichkeiten-Filter erstellt wird
- **THEN** enthält kein Aufruf gegen das Backend oder eine andere externe Schnittstelle die festgelegten Unverträglichkeiten

### Requirement: Höchstpreis-Filter

Das System muss der Nutzerin ermöglichen, im Filtermenü einen Höchstpreis festzulegen, sodass Gerichte, deren Preis (in der gewählten Preisgruppe) diesen übersteigt, nicht angezeigt werden; ohne festgelegten Höchstpreis wirkt der Preisfilter nicht. Herkunft: NEU (vormals MENSA-F-235).

#### Scenario: Höchstpreis überschritten
- **WHEN** ein Höchstpreis festgelegt ist und der Preis eines Gerichts in der gewählten Preisgruppe diesen übersteigt
- **THEN** wird dieses Gericht nicht angezeigt

### Requirement: Anzeige nur der gewählten Preisgruppe in der Hauptansicht

Das System muss in der Hauptansicht ausschließlich den Preis der in den Einstellungen gewählten Preisgruppe (Capability `settings`, SET-F-180) je Gericht anzeigen, statt aller drei Preise. Herkunft: NEU (vormals MENSA-F-220).

#### Scenario: Preis der gewählten Preisgruppe
- **WHEN** die Hauptansicht ein Gericht anzeigt
- **THEN** zeigt das System ausschließlich dessen Preis in der in den Einstellungen gewählten Preisgruppe

### Requirement: Anzeige aller drei Preise in der Ansicht aller Mensen

Das System muss in der Ansicht aller Mensen unabhängig von der gewählten Preisgruppe alle drei Preise je Gericht anzeigen. Herkunft: NEU (vormals MENSA-F-230).

#### Scenario: Alle Preise in der Vergleichsansicht
- **WHEN** die Ansicht aller Mensen ein Gericht anzeigt
- **THEN** zeigt das System alle drei Preise dieses Gerichts unabhängig von der gewählten Preisgruppe

### Requirement: Neuladen durch Herunterziehen

Wenn die Nutzerin die Gerichtsliste der Hauptansicht nach unten zieht, muss das System die Tagespläne aller gewählten Mensen für den angezeigten Tag neu vom Backend laden und den Altershinweis entsprechend aktualisieren. Herkunft: NEU (vormals MENSA-F-240).

#### Scenario: Herunterziehen zum Aktualisieren
- **WHEN** die Nutzerin die Gerichtsliste nach unten zieht
- **THEN** lädt das System die Tagespläne der gewählten Mensen neu und aktualisiert den Altershinweis

### Requirement: Lebensstil-Vorgabe

Das System muss der Nutzerin ermöglichen, aus den zu Gerichten möglichen Kennzeichnungen eine oder mehrere als Lebensstil-Vorgabe festzulegen, sodass nur Gerichte angezeigt werden, die alle festgelegten Kennzeichnungen tragen. Herkunft: NEU (vormals MENSA-F-250).

#### Scenario: Lebensstil-Vorgabe „vegan"
- **WHEN** die Nutzerin „vegan" als Lebensstil-Vorgabe festlegt
- **THEN** zeigt das System nur noch Gerichte mit der Kennzeichnung „vegan" an

### Requirement: Ausschluss nach Kennzeichnung

Das System muss der Nutzerin ermöglichen, aus denselben Kennzeichnungen eine oder mehrere als auszuschließen festzulegen, sodass Gerichte, die eine davon tragen, nicht angezeigt werden. Herkunft: NEU (vormals MENSA-F-260).

#### Scenario: Ausschluss „Schwein"
- **WHEN** die Nutzerin „Schwein" als Ausschluss festlegt
- **THEN** blendet das System jedes so gekennzeichnete Gericht aus

### Requirement: Bündelung der Filtervorgaben im Filtermenü

Das System muss Höchstpreis, Lebensstil-Vorgabe, Ausschluss und Unverträglichkeiten in einer gemeinsamen Ansicht (dem Filtermenü) bündeln, erreichbar über den Zugang nach der Anforderung „Zugang zum Filtermenü". Herkunft: NEU (vormals MENSA-F-270).

#### Scenario: Filtermenü öffnen
- **WHEN** die Nutzerin den Filterzugang antippt
- **THEN** zeigt das System Höchstpreis, Lebensstil-Vorgabe, Ausschluss und Unverträglichkeiten in einer gemeinsamen Ansicht

### Requirement: Übertragungsverbot für Lebensstil-Vorgabe und Ausschluss

Das System darf den Höchstpreis, die Lebensstil-Vorgabe und die Ausschlüsse unter keinen Umständen an das Backend oder eine andere externe Schnittstelle übertragen. Herkunft: NEU (vormals MENSA-F-275).

#### Scenario: Netzwerkmitschnitt bei aktiven Filtervorgaben
- **WHEN** ein Netzwerkmitschnitt bei festgelegtem Höchstpreis, Lebensstil-Vorgabe oder Ausschluss erstellt wird
- **THEN** enthält kein Aufruf gegen eine externe Schnittstelle diese Vorgaben

### Requirement: Position des Filterzugangs im Kopfbereich

Das System muss den Zugang zum Filtermenü im Kopfbereich der Hauptansicht auf Höhe des Bildschirmtitels führen und die Datumsauswahl darunter mittig anordnen. Herkunft: NEU (vormals MENSA-F-280).

#### Scenario: Anordnung im Kopfbereich
- **WHEN** die Hauptansicht angezeigt wird
- **THEN** steht der Filterzugang auf Höhe des Bildschirmtitels und die Datumsauswahl mittig darunter

### Requirement: Kompakte, waagerecht rollende Chip-Leiste

Das System muss die Mensa-Chip-Leiste als kompakte, waagerecht rollende Leiste darstellen, die nicht mehr senkrechten Raum einnimmt als eine Zeile, und den hervorgehobenen Chip beim Wechsel in den sichtbaren Bereich der Leiste rollen. Herkunft: NEU (vormals MENSA-F-285).

#### Scenario: Chip-Leiste als eine Zeile
- **WHEN** die Chip-Leiste angezeigt wird
- **THEN** nimmt sie nicht mehr senkrechten Raum ein als eine Zeile und rollt den hervorgehobenen Chip bei Bedarf in Sicht

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

### Requirement: Wahl der Gruppierung

Das System muss der Nutzerin ermöglichen, für die Gerichtsliste zwischen den Gruppierungs-Bausteinen „keine Gruppierung", „nach Mensa" und „nach Kategorie" zu wählen. Herkunft: NEU (vormals MENSA-F-300).

#### Scenario: Gruppierung wählen
- **WHEN** die Nutzerin in der Sortier-/Gruppierauswahl eine Gruppierung wählt
- **THEN** übernimmt das System diese Gruppierung für die Gerichtsliste

### Requirement: Wahl der Gerichte-Sortierung

Das System muss der Nutzerin ermöglichen, für die Sortierung der Gerichte — innerhalb der gewählten Gruppen oder, ohne Gruppierung, für die gesamte Liste — ein Sortierkriterium und, davon getrennt, eine Richtung (auf-/absteigend) zu wählen. Kriterium und Richtung werden als zwei eigenständige Auswahlfelder angeboten, nicht als vorkombinierte Einträge, damit jede Kombination erreichbar bleibt. Herkunft: NEU, entschieden 2026-09-04, Trennung der Richtungswahl bestätigt 2026-09-05; vormals MENSA-F-305.

#### Scenario: Sortierkriterium mit Richtung wählen
- **WHEN** die Nutzerin ein Sortierkriterium und eine Richtung wählt
- **THEN** sortiert das System die Gerichte innerhalb der Gruppen bzw. der gesamten Liste entsprechend

#### Scenario: Kriterium und Richtung getrennt wählbar
- **WHEN** die Nutzerin die Sortierauswahl öffnet
- **THEN** bietet das System das Kriterium und die Richtung in zwei getrennten Auswahlfeldern an

### Requirement: Sortierkriterien für Gerichte

Das System muss als Sortierkriterien mindestens anbieten: Reihenfolge der Mensa, Bezeichnung, Preis der gewählten Preisgruppe, eigene Bewertungsstufe und Community-Gesamtbewertung. Herkunft: NEU, Beschriftung des Reihenfolge-Kriteriums geändert 2026-09-07 (vormals MENSA-F-310).

#### Scenario: Verfügbare Sortierkriterien
- **WHEN** die Nutzerin die Sortierkriterien öffnet
- **THEN** bietet das System mindestens die Reihenfolge der Mensa, Bezeichnung, Preis, eigene Bewertungsstufe und Community-Gesamtbewertung an

### Requirement: Wahl der Gruppenreihenfolge

Wenn eine Gruppierung aktiv ist, muss das System der Nutzerin zusätzlich ermöglichen, die Reihenfolge der Gruppen selbst über ein wählbares Kriterium mit Richtung (auf-/absteigend) festzulegen. Herkunft: NEU (vormals MENSA-F-315).

#### Scenario: Gruppenreihenfolge festlegen
- **WHEN** eine Gruppierung aktiv ist und die Nutzerin ein Gruppenreihenfolge-Kriterium mit Richtung wählt
- **THEN** ordnet das System die Gruppen entsprechend an

### Requirement: Gruppenreihenfolge-Kriterien bei Mensa-Gruppierung

Das System muss bei Gruppierung nach Mensa als Kriterien für die Gruppenreihenfolge die von der Nutzerin eingestellte Mensa-Reihenfolge (die Auswahlreihenfolge nach der Anforderung „Festlegen der Mensa-Reihenfolge") und die alphabetische Reihenfolge des Mensa-Namens anbieten. Herkunft: NEU, Beschriftung des Reihenfolge-Kriteriums geändert 2026-09-07 (vormals MENSA-F-320).

#### Scenario: Kriterien bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist
- **THEN** bietet das System die eingestellte Mensa-Reihenfolge und die alphabetische Reihenfolge als Gruppenreihenfolge-Kriterien an

### Requirement: Gruppenreihenfolge-Kriterien bei Kategorie-Gruppierung

Das System muss bei Gruppierung nach Kategorie als Kriterien für die Gruppenreihenfolge die Reihenfolge der Ausgabestellen in der Quelle (INT-015) für den angezeigten Tag und die alphabetische Reihenfolge des Kategorienamens anbieten. Herkunft: NEU (vormals MENSA-F-325).

#### Scenario: Kriterien bei Kategorie-Gruppierung
- **WHEN** die Gruppierung „nach Kategorie" aktiv ist
- **THEN** bietet das System die Quellreihenfolge der Ausgabestellen und die alphabetische Reihenfolge als Gruppenreihenfolge-Kriterien an

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

### Requirement: Vordefinierte Presets

Das System muss mindestens die vier vordefinierten Presets aus Gruppierung, Gruppenreihenfolge und Gerichte-Sortierung bereitstellen, die im Abschnitt „Presets für Sortierung und Gruppierung" aufgeführt sind. Herkunft: NEU (vormals MENSA-F-330).

#### Scenario: Vordefinierte Presets verfügbar
- **WHEN** die Nutzerin die Sortier-/Gruppierauswahl öffnet
- **THEN** stehen mindestens die vier vordefinierten Presets zur direkten Anwahl bereit

### Requirement: Voreingestelltes Preset

Ohne vorherige eigene Wahl muss das System das Preset „Mensa, günstigstes zuerst" als Voreinstellung verwenden. Herkunft: NEU, entschieden 2026-09-05; vormals MENSA-F-335.

#### Scenario: Erstes Öffnen ohne eigene Wahl
- **WHEN** die Nutzerin die Hauptansicht ohne vorherige eigene Preset-Wahl öffnet
- **THEN** ist das Preset „Mensa, günstigstes zuerst" aktiv

### Requirement: Speichern eines eigenen Presets

Das System muss der Nutzerin ermöglichen, die aktuell gewählte Kombination aus Gruppierung, Gruppenreihenfolge und Gerichte-Sortierung unter einem selbstgewählten Namen als eigenes Preset zu speichern. Herkunft: NEU (vormals MENSA-F-340).

#### Scenario: Eigenes Preset speichern
- **WHEN** die Nutzerin die aktuelle Kombination unter einem eigenen Namen speichert
- **THEN** legt das System sie als eigenes, wählbares Preset an

### Requirement: Umbenennen und Löschen eigener Presets

Das System muss der Nutzerin ermöglichen, ein eigenes Preset umzubenennen und zu löschen; die vordefinierten Presets können weder umbenannt noch gelöscht werden. Herkunft: NEU (vormals MENSA-F-345).

#### Scenario: Eigenes Preset umbenennen
- **WHEN** die Nutzerin ein eigenes Preset umbenennt
- **THEN** übernimmt das System den neuen Namen, während vordefinierte Presets dafür keine Handlung anbieten

### Requirement: Merken des zuletzt gewählten Presets

Das System muss das zuletzt gewählte Preset — vordefiniert oder eigen — gerätelokal merken und bei jedem Öffnen der Hauptansicht wiederherstellen. Herkunft: NEU (vormals MENSA-F-350).

#### Scenario: Neustart mit gemerktem Preset
- **WHEN** die Nutzerin die App nach einer Preset-Wahl neu startet
- **THEN** stellt das System dasselbe Preset wieder her

### Requirement: Zugang zur Sortier-/Gruppierauswahl

Das System muss der Nutzerin im Kopfbereich der Hauptansicht, neben dem Zugang zum Filtermenü, einen eigenen Zugang zur Sortier-/Gruppierauswahl bereitstellen. Herkunft: NEU (vormals MENSA-F-355).

#### Scenario: Zugang im Kopfbereich
- **WHEN** die Hauptansicht angezeigt wird
- **THEN** steht neben dem Filterzugang ein eigener Zugang zur Sortier-/Gruppierauswahl bereit

### Requirement: Chip-Leiste zeigt Gruppen der aktiven Gruppierung

Das System muss in der Chip-Leiste die Gruppen der aktiven Gruppierung anzeigen — Mensen bei Gruppierung nach Mensa, Kategorien bei Gruppierung nach Kategorie — und die Chip-Leiste ausblenden, wenn keine Gruppierung aktiv ist. Herkunft: NEU (vormals MENSA-F-360).

#### Scenario: Keine Gruppierung aktiv
- **WHEN** keine Gruppierung aktiv ist
- **THEN** blendet das System die Chip-Leiste aus

### Requirement: Einordnung unbewerteter Gerichte ans Ende

Trägt ein Gericht beim gewählten Bewertungs-Sortierkriterium keine Bewertung, muss das System es unabhängig von der gewählten Richtung ans Ende der Sortierung einordnen; mehrere unbewertete Gerichte untereinander in der Reihenfolge der Quelle (INT-015). Herkunft: NEU, entschieden 2026-09-04, Ordnung der unbewerteten Gerichte geändert 2026-09-05; vormals MENSA-F-365.

#### Scenario: Gericht ohne Bewertung
- **WHEN** bei aktivem Bewertungs-Sortierkriterium ein Gericht keine Bewertung trägt
- **THEN** ordnet das System es ans Ende der Sortierung ein, mehrere unbewertete Gerichte untereinander in der Reihenfolge der Quelle

#### Scenario: Kein Gericht trägt eine Bewertung
- **WHEN** bei aktivem Bewertungs-Sortierkriterium kein Gericht des angezeigten Tages eine Bewertung trägt
- **THEN** entspricht die Reihenfolge innerhalb jeder Gruppe der Reihenfolge der Quelle

### Requirement: Feste Endposition von Beilagen- und Sammelgruppe

Bei Gruppierung nach Kategorie muss das System die Beilagen-Gruppe und die kategorielose Sammelgruppe unabhängig vom gewählten Gruppenreihenfolge-Kriterium am Ende belassen, die kategorielose Gruppe unmittelbar vor der Beilagen-Gruppe. Herkunft: NEU (vormals MENSA-F-370).

#### Scenario: Kategorie-Gruppierung mit Beilagen und Sammelgruppe
- **WHEN** die Gruppierung „nach Kategorie" aktiv ist
- **THEN** stehen die kategorielose Sammelgruppe und danach die Beilagen-Gruppe unabhängig vom Gruppenreihenfolge-Kriterium am Ende

### Requirement: Zielzeitpunkt für den Lieblingsgerichte-Abgleich

Der Lieblingsgerichte-Abgleich sollte spätestens um 11:00 Uhr Ortszeit erfolgt sein, sofern ein Hintergrundabruf bis dahin durch das Betriebssystem zugelassen wurde. Herkunft: NEU (vormals MENSA-N-010).

#### Scenario: Abgleich am Vormittag
- **WHEN** das Betriebssystem den Hintergrundabruf rechtzeitig zulässt
- **THEN** ist der Lieblingsgerichte-Abgleich spätestens um 11:00 Uhr Ortszeit erfolgt

### Requirement: Aktualisierungszeitplan des Speiseplan-Zwischenspeichers

Der Speiseplan-Zwischenspeicher des Backends (Capability `backend-and-api`, API-F-076) sollte vor der morgendlichen und vor der mittäglichen studentischen Nutzungsspitze je einmal sowie einmal zeitnah nach dem Ende des Mensabetriebs aus INT-015 aufgefrischt worden sein, damit der in der App angezeigte Plan die tatsächliche Tagesausgabe abbildet, bevor die meisten Studierenden nachsehen, und eine kurzfristige Änderung des Folgetagsangebots noch am selben Abend sichtbar wird. Herkunft: NEU (vormals MENSA-N-020).

#### Scenario: Auffrischung vor den Nutzungsspitzen
- **WHEN** eine morgendliche oder mittägliche Nutzungsspitze bevorsteht
- **THEN** ist der Zwischenspeicher zuvor aus INT-015 aufgefrischt worden

### Requirement: Aktueller Tag als Ausgangspunkt der Tagesauswahl

Beim Öffnen der Hauptansicht muss das System den aktuellen Tag als gewählten Tag führen, auch wenn dieser ein Samstag oder Sonntag ist und keine der gewählten Mensen an ihm ein Angebot führt. Herkunft: NEU, entschieden 2026-09-05.

#### Scenario: Öffnen an einem Werktag
- **WHEN** die Nutzerin die Hauptansicht an einem Werktag öffnet
- **THEN** ist der aktuelle Tag der gewählte Tag

#### Scenario: Öffnen an einem angebotsfreien Wochenendtag
- **WHEN** die Nutzerin die Hauptansicht an einem Samstag oder Sonntag öffnet, an dem keine der gewählten Mensen ein Angebot führt
- **THEN** ist der aktuelle Tag der gewählte Tag und das System zeigt für ihn den Leerzustand „kein Angebot"

## Entfallene Anforderungen (historisch)

### Ehemals MENSA-F-080: Eigener Lieblingsgericht-Merker

Ursprünglicher Text: „Das System muss der Nutzerin ermöglichen, ein Gericht im Speiseplan als Lieblingsgericht zu markieren und die Markierung wieder aufzuheben." Herkunft: NEU.

Status: entfallen (entschieden 2026-09-04). Grund: Der Stern zum Markieren und die Bewertung nach RATE-F-010 standen nebeneinander und fragten dasselbe zweimal: „Magst du das?". Ein Gericht, das jemand mit der besten Stufe bewertet, ist das Lieblingsgericht; ein zweiter Merker trägt keine zusätzliche Aussage. Die Lieblingsliste ergibt sich seitdem ausschließlich aus den eigenen Höchstbewertungen (Anforderungen „Lieblingsgericht aus Höchstbewertung" und „Entfernen aus Lieblingsgerichten bei Rücknahme der Höchstbewertung").

### Ehemals MENSA-F-297: Aktive Mensa auf erste anbietende Mensa zurücksetzen

Ursprünglicher Text: „Wenn die aktive Mensa am angezeigten Tag kein Angebot führt, muss das System die aktive Mensa auf die in der Reihenfolge erste Mensa mit Angebot setzen." Herkunft: NEU.

Status: entfallen. Grund: Die Hervorhebung ist seit der Ankernavigation (Anforderungen „Chip-Leiste zur Gruppen-Ankernavigation" und „Fortlaufende Hervorhebung beim Scrollen") aus der Scrollposition abgeleitet und wird nicht mehr gemerkt; beim Öffnen ist der erste Abschnitt hervorgehoben.

## Erläuterungen

**Eine Liste statt einer Liste je Mensa, gegliedert nach Mensa-Auswahlreihenfolge** (Requirements „Anzeige des Tagesspeiseplans der gewählten Mensen" (geändert) und „Zusammenfassung zu einem Eintrag je Gericht" bis „Preis-, Kennzeichnungs- und Zusatzstoffangaben der maßgeblichen Mensa"). Entschieden 2026-09-04. Die bisherige Ansicht zeigte je Bildschirm den Plan einer Mensa; wer zwei Mensen gewählt hatte, las dieselben Gerichte zweimal und musste selbst vergleichen. Fachlich interessiert zuerst das Gericht, erst danach der Ort. Die Ansicht fasst deshalb über die gewählten Mensen zusammen und trägt den Ort als Angabe am Gericht nach. Die eine Liste ist dabei nach der Mensa-Auswahlreihenfolge gegliedert (nachgetragen 2026-09-04): je gewählter Mensa mit Angebot ein Abschnitt mit Mensa-Überschrift, in Auswahlreihenfolge; ein an mehreren Mensen angebotenes Gericht steht **einmal**, im Abschnitt der ersten anbietenden Mensa, und nennt die weiteren über die „Angeboten in"-Zeile. Bei nur einer Mensa mit Angebot entfällt die Überschrift. Zwei Begriffe, die die Requirements voraussetzen:

| Begriff | Bedeutung |
|---|---|
| Aktive Mensa | Die Mensa, deren Abschnitt gerade oben im sichtbaren Bereich der Gerichtsliste steht (Ankernavigation nach Vorbild gängiger Liefer-Apps). Sie ergibt sich fortlaufend aus der Scrollposition oder aus dem zuletzt angetippten Chip und bestimmt **nur** die Hervorhebung in der Chip-Leiste — **nicht** die maßgebliche Mensa, **nicht** die Reihenfolge oder Zuordnung der Gerichte, **nicht** die angezeigten Preise. Sie wird **nicht** gerätelokal gemerkt; beim Öffnen der Ansicht ist der erste Abschnitt aktiv. |
| Maßgebliche Mensa | Die Mensa des Abschnitts, in dem das Gericht steht — also die in der Auswahlreihenfolge erste anbietende Mensa. Ihre Preis-, Kennzeichnungs- und Zusatzstoffangaben werden angezeigt. Sie hängt nicht von der aktiven Mensa ab: der Mensa-Wechsel verschiebt kein Gericht und ändert keinen angezeigten Preis. |

Die Zusammenfassung erfolgt über den normalisierten Gerichtsschlüssel (RATE-F-050) — denselben Schlüssel, der bereits Bewertungen und Lieblingsgerichte trägt. Gerichte mit gleichem Schlüssel, aber abweichenden Preisen an verschiedenen Mensen bleiben ein Eintrag im Abschnitt der ersten anbietenden Mensa; angezeigt wird deren Preis, nicht der Durchschnitt und keine Aufspaltung — sonst wäre die Zusammenfassung wirkungslos. Die Chip-Leiste ist eine reine Ankernavigation: Antippen scrollt zum Abschnitt, Scrollen setzt den hervorgehobenen Chip — sie wechselt weder Inhalt noch Gliederung der Liste. Dasselbe Verhalten trägt die Ansicht aller Mensen. Frühere Fassungen (bis 2.9.0) führten die aktive Mensa als gemerkte, angetippte Auswahl, die zusätzlich Gerichte hervorhob und (bis 2.7.0) die maßgebliche Mensa bestimmte; seit der Gliederung nach Mensa gibt es weniger Überschneidungen als erwartet, sodass die schlichtere Ankernavigation genügt (entschieden 2026-09-04).

Frühere Fassung (bis 2.7.0): Die eine Liste war primär nach Ausgabestelle/Kategorie gegliedert, und die maßgebliche Mensa war die aktive Mensa, sofern sie das Gericht führte, sonst die erste anbietende. Am 2026-09-04 auf die Gliederung nach Mensa-Auswahlreihenfolge umgestellt — Studierende scannen zuerst „ihre" Mensa und wollen deren Angebot am Stück sehen, nicht kategorieweise über Standorte verteilt.

**Frei wählbare Sortierung und Gruppierung** (Requirements „Wahl der Gruppierung" bis „Feste Endposition von Beilagen- und Sammelgruppe", ergänzt am 2026-09-04 als „Sortier- und Gruppierfunktion für Informatiker"). Die bis 2.10.0 feste Gliederung nach Mensa-Auswahlreihenfolge wird eine von mehreren wählbaren Kombinationen aus drei unabhängigen Bausteinen:

| Baustein | Bedeutung | Werte |
|---|---|---|
| Gruppierung | Ob und wonach die Liste in Abschnitte geteilt wird | keine, nach Mensa, nach Kategorie |
| Gruppenreihenfolge | In welcher Reihenfolge die Abschnitte selbst erscheinen (nur bei aktiver Gruppierung) | je nach Gruppierung ein Kriterium mit Richtung auf-/absteigend |
| Gerichte-Sortierung | Wie die Gerichte innerhalb eines Abschnitts — oder, ohne Gruppierung, in der gesamten Liste — geordnet werden | ein Kriterium mit Richtung auf-/absteigend |

Alle drei Bausteine sind unabhängig kombinierbar, auch die „Reihenfolge der Mensa" (Gerichte-Sortierkriterium `quelle`, die von INT-015 gelieferte Reihenfolge, in der die Mensa ausgibt) mit der Richtung „absteigend" (= diese Reihenfolge umgekehrt) — entschieden 2026-09-04 („maximale Flexibilität"), damit keine Kombination ausgeschlossen bleibt, die sich aus den Bausteinen ergibt. Beschriftet wird das Kriterium nach seiner Bedeutung im jeweiligen Kontext, nicht als Systembegriff „Quelle" (Requirement „Beschriftung des Reihenfolge-Kriteriums nach seiner Bedeutung", geändert 2026-09-07): als Gerichte-Sortierkriterium und als Gruppenreihenfolge-Kriterium bei Kategorie-Gruppierung „Reihenfolge der Mensa", als Gruppenreihenfolge-Kriterium bei Mensa-Gruppierung „Meine Mensa-Reihenfolge" — dort ist mit demselben gespeicherten Wert `reihenfolge` die von der Nutzerin eingestellte Mensa-Auswahlreihenfolge gemeint, nicht die Reihenfolge aus INT-015. Der Begriff „Quelle" bleibt in dieser Spec-Prosa und in Code-Kommentaren zulässig, wo er die Herkunft aus INT-015 bezeichnet; nur in der Oberfläche entfällt er.

**Presets für Sortierung und Gruppierung.** Vier vordefinierte Presets decken die am 2026-09-04 nach Durchsicht bestätigten Regelfälle ab:

| Name | Gruppierung | Gruppenreihenfolge | Gerichte-Sortierung |
|---|---|---|---|
| Mensa, eigene Bewertung | nach Mensa | Mensa-Auswahlreihenfolge, aufsteigend | eigene Bewertungsstufe, absteigend |
| Mensa, Community-Bewertung | nach Mensa | Mensa-Auswahlreihenfolge, aufsteigend | Community-Gesamtbewertung, absteigend |
| Mensa, günstigstes zuerst (**Voreinstellung**) | nach Mensa | Mensa-Auswahlreihenfolge, aufsteigend | Preis, aufsteigend |
| Preis | keine | — | Preis, aufsteigend |

Bewusst nicht als vordefiniertes Preset aufgenommen (entschieden 2026-09-04 bei der Durchsicht der ursprünglich sechs vorgeschlagenen Presets): „Mensa, unsortiert" sowie die ungruppierten Varianten „Eigene Bewertung" und „Community-Bewertung" — sie bleiben über eigene Presets weiterhin erreichbar, tragen als feste Voreinstellung aber wenig zusätzlichen Nutzen gegenüber den vier verbliebenen. Ebenso bewusst nicht aufgenommen: jede Kombination mit Gruppierung „nach Kategorie" — die Ausgabestellen-Gliederung ist im Bestand nur an der Hauptmensa wirklich aussagekräftig, an anderen Mensen bliebe ein Kategorie-Preset meist bei der kategorielosen Sammelgruppe. Die Gruppierung nach Kategorie bleibt trotzdem ein wählbarer Baustein für eigene Presets, nur eben ohne vordefinierte Vorlage.

Die vordefinierten Presets sind unveränderlich; eigene Presets entstehen als benannte Momentaufnahme der drei Bausteine und werden wie die übrigen Anzeigeeinstellungen des Mensaplans gerätelokal gespeichert (Abschnitt „Datenmodell") — es gibt keinen Zusammenhang mit einem Konto, die Presets sind wie die Filtervorgaben rein geräteseitig (kein Konto nötig, keine Übertragung), auch wenn sie anders als Unverträglichkeiten keine besondere Kategorie personenbezogener Daten sind, sondern eine gewöhnliche Anzeigeeinstellung.

Die **maßgebliche Mensa** (siehe Begriffstabelle oben) bleibt von alldem unberührt: Sie folgt weiterhin ausschließlich der Mensa-Auswahlreihenfolge, nicht der gewählten Gruppenreihenfolge — sonst würde sich der angezeigte Preis oder die angezeigte Kennzeichnung eines an mehreren Mensen angebotenen Gerichts allein durch eine andere Sortierung ändern, was verwirrend wäre. Die Gruppenreihenfolge bestimmt nur, an welcher Position der Abschnitt einer Mensa in der Liste erscheint, nicht welche Mensa für ein zusammengefasstes Gericht maßgeblich ist.

**Durchsprache vom 2026-09-05** (`docs/agents/herkunft-durchsprache.md`). Alle 56 `NEU`-Requirements dieser Capability wurden nach der Leitfrage „Würde der FSR das heute noch so beschließen — und woran erkennt man das?" durchgegangen. Kein Requirement entfällt; drei ändern sich (Voreinstellung, Ordnung unbewerteter Gerichte, getrennte Richtungswahl). Was dabei bestätigt wurde, trägt seitdem diesen Beleg — insbesondere:

- **Vier vordefinierte Presets bleiben**, obwohl „Mensa, eigene Bewertung" und „Mensa, Community-Bewertung" sich bis Roadmap-Schritt 9 identisch verhalten: beide sortieren mangels Bewertungsdaten nach der Reihenfolge der Quelle. Das ist kein Fehler, sondern löst sich mit Schritt 9 von selbst auf; festgehalten, damit es beim nächsten Durchgang nicht erneut auffällt. Die Voreinstellung ist deshalb bis dahin „Mensa, günstigstes zuerst" — das einzige gruppierte Preset, das ohne Bewertungsdaten vollständig trägt.
- **Gruppierung „nach Kategorie" bleibt** als Baustein ohne eigenes Preset, **eigene Presets bleiben** vollständig (speichern, umbenennen, löschen, merken), **die Chip-Leiste wird ohne Gruppierung ausgeblendet**, und **Filter und Sortierung behalten getrennte Zugänge** im Kopfbereich.
- **Die 41 Requirements außerhalb des Sortier-/Gruppierblocks** sind umgesetzt und durch ID-tragende Tests belegt; sie wurden gesammelt bestätigt. Die Bestätigung stützt sich auf die laufende Implementierung, nicht auf eine Beobachtung an einer Nutzerin — der Unterschied ist für eine spätere Durchsprache erheblich.
- **Die sechs Lieblingsgericht- und Benachrichtigungs-Requirements** bleiben unverändert, sind aber bis Schritt 9 nicht erfüllbar. Ihre heutige Umsetzung beruht auf dem Stern-Prototyp in `favorites.ts`, der mit Issue #19 auf Höchstbewertungen umgestellt wird; die dazugehörigen grünen Tests sind deshalb **kein** Erfüllungsnachweis der geltenden Fassung.
**Bewertungskriterien vor Umsetzung der Bewertungs-Capability** (Sortierkriterien und Behandlung unbewerteter Gerichte). Eigene Bewertungsstufe und Community-Gesamtbewertung als Sortierkriterien setzen Bewertungsdaten voraus, die erst mit Roadmap-Schritt 9 entstehen (Capability `canteen-ratings`, RATE-F-030/F-100). Die Bausteine sind bewusst schon jetzt Teil dieser Spec, weil sie zu den am 2026-09-04 bestätigten Presets „Mensa, eigene Bewertung" und „Mensa, Community-Bewertung" gehören und die Aufnahme in Schritt 9 sonst eine erneute Spec-Änderung an dieser Stelle erzwänge. Bis Bewertungen existieren, hat kein Gericht eine Bewertung — die Einordnung unbewerteter Gerichte ans Ende greift dann für die gesamte Liste, und eines dieser beiden Presets verhält sich bis Schritt 9 wie „Mensa, eigene Bewertung"/„Mensa, Community-Bewertung" mit der Reihenfolge der Quelle statt Bewertungs-Sortierung innerhalb der Abschnitte (geändert 2026-09-05). Das ist kein Fehler, sondern der dokumentierte Übergangszustand, analog zur Erläuterung zum entfallenen MENSA-F-080 (Zeitpunkt-Tabelle).

**„Alle Mensen"-Ansicht bewusst unverändert.** Die Sortier-/Gruppierauswahl gilt ausschließlich für die Hauptansicht. Die Ansicht aller Mensen bleibt eine reine, fest nach Mensa gegliederte Vergleichsansicht mit allen drei Preisen — entschieden 2026-09-04: Eine wählbare Sortierung würde dem erklärten Zweck der Ansicht („was bieten alle Mensen") zuwiderlaufen und bräuchte eigene Regeln für die Preisanzeige bei Sortierung nach Preis (welche der drei Preisgruppen zählt?), ohne einen erkennbaren zusätzlichen Nutzen.

**Keine Vergangenheit** (Requirement „Untere Grenze der Tagesauswahl"). Ein vergangener Speiseplan hat keinen Nutzen: Das Essen ist weg, und die Mensa-Quelle (INT-015) hält Vergangenes ohnehin nicht zuverlässig vor. Der aktuelle Tag ist damit die untere Grenze der Datumsauswahl; „Tag zurück" ist am heutigen Tag nicht auslösbar, statt zu einem leeren Tag zu führen. Die obere Grenze ergibt sich aus dem Datenbestand von INT-015 und wird nicht zusätzlich festgelegt.

gilt er als ohne Angebot und wird übersprungen, siehe Abschnitt „Fehlerfälle". Das deutet einen Ladefehler als Tatsachenaussage und steht damit der Regel „keine stillen Fehler" (SEC-F-060) entgegen; bei der Durchsprache am 2026-09-05 geprüft und bewusst beibehalten, weil die Mensen des Studierendenwerks an Wochenenden praktisch nie ein Angebot führen — die Fehldeutung trifft damit fast immer zu und kostet im seltenen Gegenfall einen Tag, den die Nutzerin über die Datumsauswahl weiterhin erreicht.

**Wischen zusätzlich zur Datumsauswahl** (Requirement „Tageswechsel durch Wischen"). Die Pfeile der Datumsauswahl bleiben unverändert; das Wischen tritt daneben, es ersetzt sie nicht. Beide Wege unterliegen denselben Grenzen aus den Requirements „Untere Grenze der Tagesauswahl" und „Überspringen angebotsfreier Wochenendtage". Barrierefreiheit: Die Wischgeste ist damit nicht der einzige Weg zum Tageswechsel und bleibt für Bedienung per Schalter oder Screenreader entbehrlich (Capability `ux-and-theming`).

**Geschlossene Mensa: Ort hängt von der Gruppierung ab** (Requirements „Geschlossen-Hinweis für Mensa ohne Angebot", „Öffnungszeit an der Mensa-Abschnittsüberschrift", „Wiedereröffnungshinweis an der geschlossenen Mensa", „Hinweis bei vollständig gefilterter Mensa"; geändert 2026-09-07, Change `canteen-mensa-kontext`). Bis 2026-09-07 stand der Hinweis „Mensa X hat heute zu" ausnahmslos am Ende der Gerichtsliste, gemeinsam mit den Öffnungszeiten, mit der Begründung, er verdränge nichts vom tatsächlichen Angebot. Diese Begründung trägt weiter, solange die Liste nicht nach Mensa gegliedert ist: Bei „keine Gruppierung" und „nach Kategorie" gibt es keinen Mensa-Abschnitt, in den der Hinweis gehören könnte, und er bleibt mit den Öffnungszeiten am Listenende. Ist die Gruppierung „nach Mensa" aktiv, kehrt sich die Begründung um — eine fehlende Mensa in einer nach Mensa gegliederten Liste liest sich als Lücke, nicht als Absicht. Jede gewählte Mensa erhält dort deshalb einen eigenen Abschnitt, auch ohne Angebot: mit Gerichten, mit Geschlossen-Hinweis oder, wenn ihr gesamtes Tagesangebot durch die Filtervorgaben ausgeblendet ist, mit einem davon unterscheidbaren Filter-Hinweis (Requirement „Hinweis bei vollständig gefilterter Mensa" — sonst entstünde durch die Ausdehnung auf jede gewählte Mensa eine Lücke, die wie „geschlossen" aussähe, es aber nicht ist). Die Öffnungszeit wandert dabei von der Fußzeile an die jeweilige Abschnittsüberschrift (Requirement „Öffnungszeit an der Mensa-Abschnittsüberschrift"); eine geschlossene Mensa trägt dort weiterhin keine Öffnungszeit (Requirement „Keine Öffnungszeit für Mensa ohne Angebot"), sondern stattdessen den nächsten Wochentag, für den die Mensa-Stammdaten eine Öffnungszeit führen (Requirement „Wiedereröffnungshinweis an der geschlossenen Mensa") — als Aussage über die Öffnung, nie über das Angebot, weil die Öffnungszeiten weder Feiertage noch die vorlesungsfreie Zeit abbilden und eine Aussage über das Angebot von den Daten nicht gedeckt wäre (SEC-F-060, keine stillen Falschaussagen). Führt am angezeigten Tag keine einzige gewählte Mensa ein Angebot, bleibt es beim Leerzustand „Heute kein Angebot" statt einer Liste aus lauter Geschlossen-Abschnitten. Die Quelle unterscheidet weiterhin nicht zwischen „geschlossen" und „keine Daten geliefert"; beides führt zum selben Hinweis, dessen Formulierung das offenlässt.

**Höchstbewertung statt eigener Markierung** (entfallenes MENSA-F-080 / Requirements „Lieblingsgericht aus Höchstbewertung" / „Entfernen aus Lieblingsgerichten bei Rücknahme der Höchstbewertung"). Entschieden 2026-09-04. Der Stern zum Markieren und die Bewertung (RATE-F-010) standen nebeneinander und fragten dasselbe zweimal: „Magst du das?". Ein Gericht, das jemand mit der besten Stufe bewertet, **ist** das Lieblingsgericht; ein zweiter Merker trägt keine zusätzliche Aussage. MENSA-F-080 entfällt deshalb ersatzlos, die Lieblingsliste ergibt sich aus den eigenen Höchstbewertungen. (Die Bewertungsskala selbst wechselte ebenfalls am 2026-09-04 von Sternen auf ein dreistufiges Daumen-System — schlecht/gut/sehr gut, siehe Capability `canteen-ratings` RATE-F-010; das Prinzip „Höchstbewertung = Lieblingsgericht" bleibt davon unberührt, nur die Bezeichnung „Stern" entfällt in den folgenden Requirements.) Drei Folgen, die bei der Umsetzung zu tragen sind:

| Folge | Auswirkung |
|---|---|
| Kontopflicht | Bewerten setzt ein Konto voraus (RATE-F-090). Ohne Anmeldung gibt es damit keine Lieblingsgerichte und keine Benachrichtigung mehr — bisher war beides kontofrei möglich. |
| Zeitpunkt | Bewertungen entstehen erst in Roadmap-Schritt 9. Zwischen dieser Spec-Änderung und Schritt 9 gibt es keinen Weg, ein Lieblingsgericht zu setzen; die Requirements „Lieblingsgericht aus Höchstbewertung", „Entfernen aus Lieblingsgerichten bei Rücknahme der Höchstbewertung", „Lokale Benachrichtigung bei Lieblingsgericht im Tagesplan", „Abschaltbare Lieblingsgericht-Benachrichtigung" und „Höchstens eine Benachrichtigung je Gericht-Mensa-Tag" sind bis dahin nicht erfüllbar. |
| Datenschutz | Die Lieblingseigenschaft ist nicht mehr rein gerätelokal, siehe die geänderte Erläuterung zur Zuordnung über die normalisierte Gerichtsbezeichnung. |

**Zuordnung lokal, Ursprung serverseitig** (Requirement „Zuordnung über normalisierte Gerichtsbezeichnung", geändert am 2026-09-04). Die vorige Fassung hielt fest, die Lieblingsliste bleibe ausschließlich gerätelokal und das Backend erfahre nichts über individuelle Vorlieben. Das gilt mit der Kopplung an die Höchstbewertung nicht mehr uneingeschränkt: Die Höchstbewertung, aus der die Lieblingseigenschaft folgt, ist eine kontogebundene, serverseitig gespeicherte Bewertung (Capability `canteen-ratings` Abschnitt „Datenmodell"). Das Backend kann daraus ableiten, welche Gerichte eine Person besonders mag — eine Aussage über Ernährungsvorlieben, die zuvor bewusst auf dem Gerät blieb. Bewusst in Kauf genommen, weil dieselbe Aussage bereits in der Bewertung selbst steckt und ein zusätzlicher lokaler Merker sie nicht verborgen hätte, sobald beide Wege nebeneinander bestehen. Unverändert gilt: Der Abgleich gegen den Tagesplan läuft rein auf dem Gerät gegen eine lokale Spiegelung der eigenen Bewertungen (RATE-F-100); es wird keine Lieblingsliste als eigene Ressource an das Backend übertragen und keine von dort abgerufen. Der Eintrag in Capability `data-and-storage` Abschnitt 2 ist entsprechend fortgeschrieben.

**Alle Mensen ohne Auswahländerung** (Requirements „Handlung „Alle Mensen anzeigen"" bis „Keine Auswahländerung durch die Ansicht aller Mensen"). Wer heute an einem anderen Campus ist, will einmal dorthin sehen, nicht seine dauerhafte Mensaauswahl umstellen und später zurückstellen. Die Handlung am Seitenende führt deshalb in eine reine Leseansicht über alle vom Backend gelieferten Mensen (API-F-230), nach Mensa getrennt untereinander — die Darstellung, die die Android-Alt-App als Hauptansicht führte (`MenuDayFragment.java:105`). Das dortige Verhalten, Mensen ohne Angebot des Tages wegzulassen (`MenuDayFragment.java:109`), wird übernommen; der Hinweis auf geschlossene Mensen bleibt auf die **gewählten** Mensen der Hauptansicht beschränkt, sonst bestünde die Ansicht an einem Wochenende fast nur aus Geschlossen-Hinweisen. Die Requirement „Keine Auswahländerung durch die Ansicht aller Mensen" hält fest, dass diese Ansicht nichts speichert: Sie ändert weder Auswahl noch Reihenfolge. Die Chip-Ankernavigation verhält sich wie in der Hauptansicht, hier über die anbietenden Mensen. Der angezeigte Tag wird aus der Hauptansicht übernommen, damit der Wechsel den Zusammenhang nicht verliert.

**Umsetzungsstand nach der Überarbeitung vom 2026-09-04, nachgeführt am 2026-09-04.** Die Spec war nach der Überarbeitung von `implemented` auf `accepted` zurückgesetzt. Mit dem Abschluss von Roadmap-Schritt 4 am 2026-09-04 sind umgesetzt und durch ID-tragende Tests belegt: die zusammengefasste, nach Mensa-Auswahlreihenfolge in Abschnitte gegliederte Gerichtsliste (MENSA-F-012 bis F-018), die Datumsgrenzen, das Wischen und „Zurücksetzen" (F-042/F-043/F-044/F-046), der Geschlossen-Hinweis (F-049), die Chip-Ankernavigation (F-016/F-017/F-019/F-295, geteilt von Haupt- und Alle-Mensen-Ansicht `app/src/areas/canteen/ui/AnkerListe.tsx`), die Ansicht aller Mensen (F-120 bis F-150), das Filtermenü — Höchstpreis (F-235), Unverträglichkeiten (F-170 bis F-215) sowie Lebensstil-Vorgabe und Ausschluss (F-250 bis F-285) —, die Preisgruppe (F-220/F-230 mit SET-F-180/F-190), das Herunterziehen zum Aktualisieren (F-240) und die Kopfbereich-Korrekturen (F-280/F-285/F-290) — alles in der App, ohne Vertragsänderung. Serverseitig ist der Speiseplan-Job auf einen Ortszeit-Zeitplan vor den Nutzungsspitzen und nach Mensaschluss umgestellt (MENSA-N-020 über API-F-076). Am 2026-09-07 nachgeführt: Das Überspringen angebotsfreier Wochenendtage (F-044, Requirement „Überspringen angebotsfreier Wochenendtage") nimmt seither den aktuellen Tag aus — er wird nie übersprungen, damit ein angebotsfreier Samstag oder Sonntag als Untergrenze der Tagesauswahl (F-042) erreichbar bleibt statt beim Rückblättern verloren zu gehen. Belegt durch Tests, die den Requirement-Titel statt der Alt-ID tragen (`app/src/areas/canteen/tageswahl.test.ts`, `app/src/areas/canteen/screens/CanteenScreen.wochenende.test.tsx`); dasselbe gilt für das mit dieser Änderung erstmals geschriebene Requirement „Aktueller Tag als Ausgangspunkt der Tagesauswahl".

Der `status` bleibt **`accepted`**, weil die bewertungsgekoppelten Anforderungen noch offen sind: MENSA-F-085/F-087 (Lieblingsgericht aus der Höchstbewertung), MENSA-F-090 in der Neufassung, MENSA-F-100/F-105/F-110 in der Neufassung und der Abschalter SET-F-170 folgen gemeinsam mit den Bewertungen in Roadmap-Schritt 9 und sind bis dahin nicht erfüllbar (Erläuterung zum entfallenen MENSA-F-080, Tabellenzeile „Zeitpunkt"). Bis dahin liegt der in Schritt 4 gelieferte Stern-Merker nach dem entfallenen MENSA-F-080 weiter im Code (`app/src/areas/canteen/favorites.ts`, `backgroundCheck.ts`, `notifications.ts`, `registerBackgroundTask.ts`); zwei Tests tragen die entfallene ID MENSA-F-080 im Namen — ein bewusst in Kauf genommener und hier dokumentierter Rückstand, kein unbemerktes Auseinanderlaufen (Capability `quality-and-testing`). Die Geräte- und Gestaltungsprüfungen der neuen Ansicht sind im Prüfprotokoll `pruefprotokolle/2026-09-04-schritt-4-mensa-teil-a.md` festgehalten (Geräteprüfungen „ausstehend Gerät").

**Frei wählbare Sortierung und Gruppierung — umgesetzt am 2026-09-07** (Change `canteen-sortieren-gruppieren`, GitHub-Issue #26). Die Requirements „Wahl der Gruppierung" bis „Feste Endposition von Beilagen- und Sammelgruppe" (vormals MENSA-F-300 bis F-370, ergänzt 2026-09-04, bestätigt 2026-09-05) sind in der App umgesetzt, ohne Vertrags-, Backend- oder Integrationsänderung. Neu: `app/src/areas/canteen/sortierung.ts` (reines Sortier-/Gruppiermodell `wendeAn` und die vier vordefinierten Presets), `app/src/areas/canteen/sortierPreset.ts` (gerätelokaler, reaktiver Preset-Speicher — eigene Presets, zuletzt aktives Preset, transiente Zusammenstellung), `app/src/areas/canteen/ui/SortierZugang.tsx` (Kopfzugang neben dem Filter-Trichter) und `app/src/areas/canteen/screens/SortierGruppierScreen.tsx` (die Auswahl-Ansicht, Route `app/app/(tabs)/canteen/sortierung.tsx`). Geändert: `consolidate.ts` trägt je Gericht einen stabilen Quellrang; `CanteenScreen.tsx` bildet die Abschnitte über das aktive Preset statt über die feste Mensa-Gliederung; die Chip-Leiste (`ui/AnkerListe.tsx`) zeigt die Gruppen der aktiven Gruppierung und ist ohne Gruppierung ausgeblendet. Die „Alle Mensen"-Ansicht bleibt fest nach Mensa gegliedert (`CanteenAllScreen.tsx`, bewusst ohne Preset-Bezug). Auslegung (Change `canteen-sortieren-gruppieren` design.md D1): Die Kategorie-Unterstruktur — die unbedingte Beilagen-Trennung (Requirement „Beilagen als eigene Kategorie") und die kategorielose Sammelgruppe (Requirement „Sammelgruppe ohne Ausgabestellen-Kategorie") — bindet strukturell nur bei Gruppierung „nach Kategorie"; bei „keine" und „nach Mensa" wird die Liste flach nach dem gewählten Kriterium sortiert, eine Beilage wie jedes andere Gericht einsortiert. Die beiden Bewertungs-Sortierkriterien werden angeboten, greifen aber bis Roadmap-Schritt 9 mangels Bewertungsdaten über die Regel „unbewertete Gerichte ans Ende" auf die Reihenfolge der Quelle durch (dokumentierter Übergangszustand). Belegt durch Tests, die den Requirement-Titel tragen (`sortierung.test.ts`, `sortierPreset.test.ts`, `screens/SortierGruppierScreen.test.tsx`, `ui/SortierZugang.test.tsx` sowie ergänzte Fälle in `consolidate.test.ts`, `screens/CanteenScreen.test.tsx`, `screens/CanteenAllScreen.test.tsx`) und durch das Prüfprotokoll `pruefprotokolle/2026-09-07-canteen-sortieren-gruppieren.md` (Geräteschritte „ausstehend Gerät").

**Mensa-Kontext in der Gerichtsliste sichtbar gemacht — umgesetzt am 2026-09-07** (Change `canteen-mensa-kontext`, Nachbesserung an Roadmap-Schritt 4). Sieben Requirements geändert, vier neu — siehe die vorstehende Erläuterung „Geschlossene Mensa: Ort hängt von der Gruppierung ab" für den fachlichen Zusammenhang. Neu: `app/src/areas/canteen/oeffnungszeiten.ts` (reine Funktionen `oeffnungszeitFuer` und `naechsterOeffnungstag`, aus `CanteenScreen.tsx` ausgelagert und um die Wiedereröffnungs-Suche ergänzt). Geändert: `sortierung.ts` (`Abschnitt` trägt jetzt `zustand: 'gerichte' | 'geschlossen'`; `wendeAn` erzeugt bei Gruppierung „nach Mensa" zusätzlich einen Abschnitt je gewählter Mensa ohne Angebot, eingeordnet in derselben Gruppenreihenfolge wie die übrigen), `CanteenScreen.tsx` (Filterauswertung je Abschnitt unterscheidet jetzt „mit Gerichten" / „geschlossen" / „vollständig gefiltert"; Abschnittskopfzeile trägt bei Mensa-Gruppierung Name und Öffnungszeit und wird auch bei nur einem Abschnitt gezeigt; Fußbereich zeigt Öffnungszeit- und Geschlossen-Zeilen nur noch, wenn keine Abschnitte gerendert werden — bei Mensa-Gruppierung mit Angebot tragen die Abschnitte diesen Kontext selbst; Gericht-Karte nennt die anbietende(n) Mensa/Mensen jetzt auch ohne Mensa-Gruppierung, außer bei nur einer gewählten Mensa; Chip-Bildung braucht keine Sonderbehandlung geschlossener Mensen mehr, weil jede gewählte Mensa bei Mensa-Gruppierung einen Abschnitt führt), `SortierGruppierScreen.tsx` (Beschriftung des Reihenfolge-Kriteriums richtet sich nach der aktiven Gruppierung), `de.json`/`en.json` (neue Schlüssel `mensa.gruppenkriterium.reihenfolgeMensa`/`reihenfolgeKategorie` ersetzen `mensa.gruppenkriterium.reihenfolge`; `mensa.sortierkriterium.quelle` neu formuliert; neue Schlüssel `mensa.wiederGeoeffnet`, `mensa.mensaGefiltert`). Die gespeicherten Kriterium-Werte `quelle`/`reihenfolge` sind unverändert geblieben — nur die Anzeigetexte wechseln —, bestehende eigene Presets bleiben deshalb ohne Migration gültig. Kein Vertrag, kein Backend, keine Integration betroffen; `oeffnungszeiten` stand bereits im Mensa-Schema. Belegt durch Tests, die den Requirement-Titel tragen (`oeffnungszeiten.test.ts`, ergänzte Fälle in `sortierung.test.ts`, `screens/CanteenScreen.test.tsx`, `screens/CanteenScreen.wochenende.test.tsx`, `screens/SortierGruppierScreen.test.tsx`, `sortierPreset.test.ts`) und durch das Prüfprotokoll `pruefprotokolle/2026-09-07-canteen-mensa-kontext.md` (Geräteschritte „ausstehend Gerät").

**Requirement „Sichtbare Fehlermeldung beim Ladefehler"** — `canteen_overview_viewmodel.dart:60-66` enthält einen `try`-Block mit leerem `finally` ohne `catch`; ein Fehler beim Laden des Speiseplans verschwindet dadurch kommentarlos (dokumentiert in Capability `security-and-privacy` SEC-F-060). Für die Neuentwicklung ist sichtbare Fehlerbehandlung verbindlich.

**Requirement „TLS-gesicherter Abruf des Speiseplans"** — Der Altaufruf erfolgt unverschlüsselt über `http://fb4app.hemacode.de/...` (`meals_repository.dart:21`, dokumentiert als INT-004 in Capability `integrations`, Risiko „hoch"). Für die Neuentwicklung ist TLS ausnahmslos verbindlich (siehe auch Capability `security-and-privacy` SEC-N-030).

**Lokal statt serverseitig, Architekturentscheidung** (Requirement „Zuordnung über normalisierte Gerichtsbezeichnung"). Die Lieblingsgerichte-Liste verrät Ernährungsgewohnheiten und -vorlieben und ist damit sensibler als eine reine Mensaauswahl. Analog zur bereits für den Stundenplan getroffenen Entscheidung (kein serverseitiges Speichern persönlicher Auswahl, siehe Capability `schedule`, Erläuterung zu SCHED-F-220, Capability `backend-and-api` API-F-100) bleibt die Liste ausschließlich gerätelokal (Capability `data-and-storage` DATA-F-010). Das Backend (INT-008) erfährt nichts über individuelle Vorlieben.

**Lokale Benachrichtigung statt INT-005 (UnifiedPush/FCM)** (Requirement „Lokale Benachrichtigung bei Lieblingsgericht im Tagesplan"). INT-005 ist ein Themen-/Endpunkt-Abonnement für alle Nutzerinnen gleichermaßen und für Inhalte gedacht, die der FSR selbst veröffentlicht (News); es eignet sich nicht für eine pro Nutzerin unterschiedliche, personenbezogene Auswahl wie Lieblingsgerichte, ohne diese Auswahl an das Backend zu übertragen — was die Zuordnungs-Anforderung gerade ausschließt. Der Abgleich erfolgt daher rein clientseitig gegen den ohnehin abgerufenen Tages-Speiseplan, die Benachrichtigung wird über die geräteeigene lokale Benachrichtigungs-API ausgelöst, ohne Netzwerkbeteiligung. Dafür ist wie bei INT-005 die vom Betriebssystem erteilte allgemeine Benachrichtigungsberechtigung erforderlich (siehe Abschnitt „Fehlerfälle"), aber kein Push-Abonnement.

**Zeitpunkt „vormittags" und Plattformgrenzen** (Requirement „Lokale Benachrichtigung bei Lieblingsgericht im Tagesplan"). Damit die Benachrichtigung für die Tagesplanung nutzbar ist, muss der Abgleich vor der Mittagszeit erfolgen (Zielwert siehe Requirement „Zielzeitpunkt für den Lieblingsgerichte-Abgleich"). Ein zu einer festen Uhrzeit garantiert ausgeführter Hintergrundabruf ist auf mobilen Betriebssystemen (insbesondere iOS) nicht zugesichert (vgl. bereits dokumentierte Zurückhaltung zu Hintergrundabrufen in Capability `non-functional` NFR-N-090). Trifft der Hintergrundabruf nicht rechtzeitig ein, holt das System den Abgleich beim nächsten Öffnen der App nach, sofern es noch vormittags ist (siehe Abschnitt „Fehlerfälle") — es gibt keine rückwirkende Benachrichtigung am Nachmittag.

**Umsetzungsmechanismus (Roadmap-Schritt 4)** (Requirement „Lokale Benachrichtigung bei Lieblingsgericht im Tagesplan"). Der Weckruf erfolgt über die betriebssystemeigene Hintergrundaufgabe (Android WorkManager, iOS BGTaskScheduler), nicht über Push. Beim Weckruf lädt die App selbst den Tagesplan der gewählten Mensen aus dem Backend-Zwischenspeicher (INT-008), gleicht ihn lokal gegen die gerätegespeicherte Lieblingsliste ab und löst die Benachrichtigung über die lokale Benachrichtigungs-API des Geräts aus. Die Lieblingsliste verlässt das Gerät nicht; INT-005/UnifiedPush ist nicht beteiligt. Da die Ausführungszeit des Weckrufs vom Betriebssystem bestimmt wird, bleibt das Zielzeitpunkt-Requirement ein Zielwert mit Vordergrund-Nachholung.

**Requirement „Anzeige von Gericht-Kennzeichnungen".** INT-015 liefert je Gericht ein `type`-Feld mit Kennzeichnungen (Kürzel wie `N` = vegan, `B` = Klimateller), aufgelöst über das `/types`-Verzeichnis. Die Kennzeichnungen werden über denselben Zwischenspeicher- und Sprachweg wie Kategorien und Zusatzstoffe ausgeliefert (Capability `integrations` INT-015, Requirement „Gerichtskategorien und Zusatzstoffhinweise in Oberflächensprache"). Fehlt das Feld oder ist es leer, entfällt die Anzeige ersatzlos.

**Verbrauchsorte ohne Ausgabestellen-Gliederung** (Requirement „Sammelgruppe ohne Ausgabestellen-Kategorie"). Die Food Fakultät (INT-015-Kennung 474) liefert zu jedem Gericht `counter` und `counterNames` leer und nur einen numerischen `category`-Code, der im `/categories`-Verzeichnis der Quelle nicht enthalten ist (Prüfung 2026-09-04, Capability `integrations` INT-015) — eine anzeigbare Kategorie ist damit nicht zu gewinnen. Die Android-Alt-App setzt in diesem Fall den rohen Zahlencode als Überschrift (`MenuService.java:122-125`); für die Neuentwicklung entfällt die Überschrift stattdessen, die Gerichte erscheinen vollständig in einer Sammelgruppe. Das Requirement „Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe" bezieht sich auf den Regelfall mit gelieferter Kategorie; „Sammelgruppe ohne Ausgabestellen-Kategorie" ist die ausdrückliche Ausnahme. Die getrennte Beilagen-Darstellung bleibt unberührt — sie hängt an `counterNames`, das hier ohnehin fehlt; die kategorielose Sammelgruppe steht wie die Beilagen am Listenende. Das Backend gibt für solche Gerichte `Gericht.kategorie` als leeren String aus (`openspec/specs/api-contract.yaml`); die Sammelgruppe bildet die App.

**Unverträglichkeiten-Filter** (Requirements „Zugang zum Filtermenü" bis „Ausgrauen gefilterter Gerichte in der Ansicht aller Mensen"). Ergänzt am 2026-09-04. Der Filter arbeitet auf denselben Zusatzstoff-/Allergen-Codes, die die Anforderung „Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe" ohnehin am Gericht anzeigt (`/additives`-Verzeichnis, INT-015) — es entsteht keine eigene Taxonomie und kein zusätzlicher Endpunkt. Die Hauptansicht und die Ansicht aller Mensen reagieren dabei bewusst unterschiedlich, weil sie unterschiedliche Fragen beantworten:

| Ansicht | Frage, die sie beantwortet | Reaktion auf einen Treffer |
|---|---|---|
| Hauptansicht | Was kann ich heute essen? | Ausblenden, gezählt statt verschwiegen |
| Alle Mensen | Was bieten alle Mensen insgesamt an? | Ausgegraut, aber sichtbar — Ausblenden würde die Vollständigkeit dieser Vergleichsansicht gerade dort brechen, wo sie ihren Zweck ausmacht |

Ein festgelegter Filter ohne Treffer im Tagesangebot verändert nichts an der Liste — das Ausblenden greift nur, wenn tatsächlich ein Gericht betroffen ist; die Anzahl zeigt dann `0` nicht gesondert an (siehe Abschnitt „UI-Flows & Zustände").

**Datenklasse.** Eine festgelegte Unverträglichkeit ist eine Gesundheitsangabe und fällt damit unter die besonderen Kategorien personenbezogener Daten (Art. 9 DSGVO) — sensibler als die bereits als personenbezogen geführten Lieblingsgerichte (bloße Ernährungsvorlieben). Der Filter bleibt deshalb ausnahmslos gerätelokal, wird nie an das Backend übertragen und liegt hinter demselben Zustimmungs-Gate wie Lieblingsgerichte (Capability `security-and-privacy` SEC-F-010); anders als dort ist dafür **kein** Konto nötig — Filtern ist reines Lesen, INT-008 erfährt nichts davon. Siehe Capability `data-and-storage` Abschnitt 2.

**Vom Unverträglichkeiten-Filter zum allgemeinen Filtermenü**, ergänzt am 2026-09-04. Der Zugang war zunächst als „Unverträglichkeiten", dann als „Ernährungsfilter" geführt; er ist jetzt schlicht **„Filter"** mit klassischem Trichter-Symbol und bündelt alle Filtervorgaben. Neu darin der **Preisfilter**: ein Höchstpreis-Steller in 0,50-€-Schritten zwischen 1,00 € und 10,00 €, dessen unterer Anschlag „Kein Limit" ist. Verglichen wird gegen den Preis der gewählten Preisgruppe (SET-F-180) — dieselbe Zahl, die die Hauptansicht am Gericht zeigt; in der Ansicht aller Mensen (alle drei Preise) entscheidet weiterhin die Preisgruppe über das Ausgrauen. Der Preisfilter ist gewöhnliche, nicht personenbezogene Einstellungsinformation, bleibt aber wie die übrigen Filtervorgaben rein gerätelokal. Die weiteren Kennzeichnungs-Filter: Die Nutzerin will nicht nur Zusatzstoffe meiden, sondern auch nach Lebensstil filtern (vegan, vegetarisch) oder Einzelnes ausschließen (kein Schwein). Beides arbeitet auf denselben Kennzeichnungen, die die Anforderung „Anzeige von Gericht-Kennzeichnungen" ohnehin am Gericht anzeigt (`/types`-Verzeichnis, INT-015) — keine eigene Taxonomie, kein zusätzlicher Endpunkt, keine im Code fest verdrahteten Kennzeichnungsnamen: Lebensstil und Ausschluss listen genau die Kennzeichnungen auf, die das Verzeichnis in der Oberflächensprache liefert. Der Lebensstil-Abschnitt filtert einschließend (Gericht muss **alle** gewählten Kennzeichnungen tragen — „vegan" allein zeigt nur Veganes), der Ausschluss-Abschnitt ausschließend (Gericht mit **einer** der Kennzeichnungen verschwindet). Beide Abschnitte teilen mit den Unverträglichkeiten den Zugang und die Ausblende-/Ausgrau-Logik. Anders als die Unverträglichkeiten sind Lebensstil und Ausschluss keine Gesundheitsangabe (Art. 9 DSGVO), sondern gewöhnliche Ernährungsvorlieben; sie bleiben trotzdem gerätelokal und werden nie übertragen, schon weil ein geteilter Speicherort mit den Art.-9-Daten die Trennung nur verkompliziert hätte. Die Requirements „Position des Filterzugangs im Kopfbereich" / „Kompakte, waagerecht rollende Chip-Leiste" / „Keine Öffnungszeit für Mensa ohne Angebot" sind Gestaltungskorrekturen aus dem Gerätetest: der Filterzugang gehört auf die Titelzeile (nicht als dritter „Pfeil" neben die Datumsauswahl), die Datumsauswahl mittig darunter ohne den vorher sichtbaren Leerraum, die Mensa-Chip-Leiste einzeilig statt vertikal auslaufend, und eine geschlossene Mensa nennt keine Öffnungszeit. Der Leerraum unter dem Titel stammte daher, dass die Ansicht trotz eigener Kopfzeile zusätzlich den oberen Geräte-Sicherheitsabstand einzog (doppelt gezählt); Ansichten mit Kopfzeile verzichten auf diesen Abstand (`app/src/ui/Screen.tsx`). Der vertikale Rollbalken der Gerichtsliste ist ausgeblendet, weil er sonst über den rechten Rand der umrandeten Gerichtskarten läuft; das Blättern per Wischen und Pfeil bleibt unberührt. Seit der Umstellung auf die Ankernavigation (2.10.0) hebt die Chip-Leiste nur den Abschnitt hervor — es gibt keine Randfarben-Hervorhebung einzelner Gerichtskarten mehr; die Karten haben wieder eine konstante 1-px-Umrandung.

verdient. Der Hinweis steht am Seitenende des Filtermenüs (2026-09-04), wo er dauerhaft im selben Menü sichtbar ist, ohne die Auswahl zu verstellen. Der frühere Anspruch, er müsse „unübersehbar" über den Abschnitten stehen, ist bei der Durchsprache am 2026-09-05 fallengelassen worden: Ein Hinweis über der Auswahl wird nach dem dritten Öffnen nicht mehr gelesen, verstellt aber jedes Mal den Blick.

**Ein Preis in der Hauptansicht, alle drei in der Vergleichsansicht** (Requirements „Anzeige nur der gewählten Preisgruppe in der Hauptansicht" / „Anzeige aller drei Preise in der Ansicht aller Mensen"). Ergänzt am 2026-09-04. Das Requirement „Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe" legt fest, dass zu jedem Gericht alle drei Preise im Datenmodell vorliegen — das bleibt unverändert; „Anzeige nur der gewählten Preisgruppe in der Hauptansicht" schränkt nur die **Anzeige** in der Hauptansicht auf die Preisgruppe aus SET-F-180 ein. Grund für dieselbe Aufteilung wie beim Unverträglichkeiten-Filter: Die Hauptansicht beantwortet „was koste ich für mich", die Ansicht aller Mensen „was gilt hier allgemein" — eine Mitarbeiterin, die für eine Kollegin nachschaut, was ein Gericht für Studierende kostet, braucht dort weiterhin alle drei Werte, deshalb bleibt „Anzeige aller drei Preise in der Ansicht aller Mensen" von der Preisgruppe unberührt. Die maßgebliche Mensa bestimmt weiterhin, **von welcher** Mensa der Preis stammt; die Preisgruppe (SET-F-180) bestimmt, **welcher der drei Werte** dieser Mensa angezeigt wird — beide Einschränkungen wirken unabhängig voneinander.

**Aktualität des Speiseplans** (Requirement „Neuladen durch Herunterziehen" und „Aktualisierungszeitplan des Speiseplan-Zwischenspeichers"). Ergänzt am 2026-09-04. Der Speiseplan ist die meistgenutzte Ansicht der App, und Studierende sehen typischerweise zu zwei Zeitpunkten nach: morgens vor dem Aufstehen und kurz vor der Essenszeit, bevor sie zur Mensa gehen. Zwei getrennte Maßnahmen:

- **Serverseitig** (umgesetzt über Capability `backend-and-api` API-F-076): Der Backend-Zwischenspeicher wird so aufgefrischt, dass eine Aktualisierung aus INT-015 vor jeder dieser beiden Nutzungsspitzen abgeschlossen ist — nicht nur in einem starren, seit Prozessstart laufenden Intervall. Ein weiterer Lauf liegt zeitnah nach dem Ende des Mensabetriebs, damit eine gegen Betriebsschluss in der Quelle hinterlegte Änderung des Folgetagsangebots noch am selben Abend im Zwischenspeicher steht statt erst am nächsten Morgen. Die App ruft INT-015 weiterhin nie selbst ab (Capability `architecture` ARCH-F-050); sie liest ausschließlich den Backend-Zwischenspeicher.
- **Clientseitig**: Zusätzlich zur automatischen Aktualität kann die Nutzerin die Liste durch Herunterziehen neu laden — die feature-spezifische Ausprägung der querschnittlichen Aktualisierungsgeste (Capability `ux-and-theming` UX-F-160). Das Herunterziehen lädt die Tagespläne der gewählten Mensen neu aus dem Backend-Zwischenspeicher; es stößt keinen synchronen INT-015-Abruf an. Der Altershinweis (Abschnitt „Offline-Verhalten") spiegelt danach den Stand des Zwischenspeichers.

**Zustimmungs-Gate bei Lieblingsgerichten.** Der Speiseplan selbst, die Mensaauswahl und die Ansicht aller Mensen sind kontofrei und ungegatet (Lesefunktionen ohne personenbezogene Verarbeitung). Das Führen eines Lieblingsgerichts verarbeitet dagegen Ernährungsvorlieben (Capability `data-and-storage` Abschnitt 2, Datenklasse „Lieblingsgerichte", personenbezogen) und liegt hinter dem Zustimmungs-Gate (Capability `security-and-privacy` SEC-F-010) — seit der Kopplung an die Bewertung zusätzlich hinter der Kontopflicht des Schreibpfads (RATE-F-090). Die Systemberechtigung für Benachrichtigungen wird erst bei der ersten Höchstbewertung angefragt (SEC-F-080); wird sie verweigert, bleibt die Bewertung wirksam, nur die Benachrichtigung entfällt (SEC-F-090, siehe Abschnitt „Fehlerfälle").

## Scope / Nicht-Scope

### Scope

- Anzeige des Tagesangebots der gewählten Mensen als eine über die Mensen zusammengefasste Gerichtsliste, mit Angabe der anbietenden Mensen je Gericht.
- Blättern über die Datumsauswahl und Wischen zwischen benachbarten Tagen, beschränkt auf den aktuellen und folgende Tage.
- Nach Mensa getrennte Ansicht aller vom Backend gelieferten Mensen für den angezeigten Tag, erreichbar am Ende der Gerichtsliste.
- Auswahl der angezeigten Mensen aus der vom Backend gelieferten Liste, einschließlich eigener Reihenfolge.
- Anzeige der Öffnungszeiten je Mensa und Wochentag sowie Hinweis auf geschlossene Mensen am Seitenende.
- Anzeige von Preisen (Studierende/Mitarbeitende/Gäste) und Zusatzstoff-/Allergenhinweisen.
- Führen von Lieblingsgerichten als Folge der eigenen Höchstbewertung und lokale Benachrichtigung, wenn eines davon am aktuellen Tag im Speiseplan einer gewählten Mensa auftaucht.
- Filterung der Gerichtsliste über ein gebündeltes Filtermenü: Höchstpreis, selbst festgelegte Unverträglichkeiten (Zusatzstoff-/Allergenkennzeichnungen) sowie Lebensstil-Vorgabe und Ausschluss anhand der Gericht-Kennzeichnungen (vegan, vegetarisch, Schwein …).
- Beschränkung der angezeigten Preise in der Hauptansicht auf die in den Einstellungen gewählte Preisgruppe.
- Frei wählbare Sortierung und Gruppierung der Gerichtsliste der Hauptansicht aus einzelnen Bausteinen (Gruppierung, Gruppenreihenfolge, Gerichte-Sortierung), über vordefinierte und selbst erstellte, gerätelokal gespeicherte Presets.

### Nicht-Scope

- Bewertung einzelner Gerichte — eigene Spec, aber als Handlung je Gericht innerhalb dieser Ansicht erreichbar, kein eigener Navigationspunkt, siehe Capability `canteen-ratings`. Die Höchstbewertung wirkt von dort auf die Requirements „Lieblingsgericht aus Höchstbewertung" zurück.
- Fotos zu Gerichten (Anzeige, Vergrößern, Hochladen, Freigabe) — eigene Spec Capability `canteen-photos`, zweite Ausbaustufe; die Anzeigefläche liegt in dieser Ansicht, die Requirements nicht.
- Bestellung, Bezahlung oder Guthabenabfrage — die Schnittstelle ist rein lesend.
- Ein eigener, unabhängig vom Bewertungspfad setzbarer Lieblingsgericht-Merker — entfallen am 2026-09-04, siehe Erläuterung zum entfallenen MENSA-F-080.
- Versand der Lieblingsgerichte-Benachrichtigung über INT-005 (UnifiedPush/FCM) — die Benachrichtigung entsteht ausschließlich lokal auf dem Gerät, siehe Erläuterung zur Requirement „Lokale Benachrichtigung bei Lieblingsgericht im Tagesplan".

## Nutzergeschichten

- Als Studierende möchte ich sehen, was heute angeboten wird, ohne die Mensa-Website zu besuchen.
- Als Studierende möchte ich jedes Gericht nur einmal in der Liste sehen und daneben ablesen, in welcher Mensa es zu haben ist, statt dieselbe Liste je Mensa erneut zu durchsuchen.
- Als Studierende möchte ich mit einer Wischgeste durch die kommenden Tage blättern, ohne die Datumsauswahl zu treffen.
- Als Studierende möchte ich vergangene Tage gar nicht erst angeboten bekommen, weil ich sie nie brauche.
- Als Studierende, die heute spontan an einem anderen Campus ist, möchte ich mit einer Handlung das Angebot aller Mensen sehen, ohne meine dauerhafte Mensaauswahl zu ändern.
- Als Studierende mit Unverträglichkeit möchte ich Zusatzstoff-/Allergenhinweise je Gericht sehen.
- Als Studierende mit einer Unverträglichkeit möchte ich Gerichte, die den betreffenden Zusatzstoff enthalten, gar nicht erst in meiner Liste sehen, statt sie bei jedem Gericht einzeln prüfen zu müssen.
- Als Mitarbeitende möchte ich bei jedem Gericht sofort meinen Preis sehen, statt ihn zwischen drei angezeigten Werten herauszusuchen.
- Als Studierende möchte ich morgens benachrichtigt werden, wenn ein von mir mit der besten Bewertungsstufe bewertetes Gericht heute angeboten wird, damit ich es nicht verpasse, ohne täglich selbst nachzusehen.
- Als Studierende möchte ich die Liste statt nach Mensa auch schlicht nach Preis oder nach Bewertung sortiert sehen, ohne dafür erst durch alle Mensa-Abschnitte zu scrollen.
- Als technikaffine Nutzerin möchte ich mir eine eigene Kombination aus Gruppierung und Sortierung zusammenstellen und unter einem eigenen Namen speichern, statt bei jedem Öffnen erneut umzustellen.

## Datenmodell

Gericht: Kategorie, Bezeichnung, Preise für Studierende/Mitarbeitende/Gäste, Zusatzstoffhinweise — Felder wie in INT-015 (Capability `integrations`) dokumentiert. Mensa-Stammdaten: siehe Capability `backend-and-api` Abschnitt 5. Mensaauswahl und -reihenfolge der Nutzerin: lokal persistiert, siehe Capability `data-and-storage`.

Zusammengefasstes Gericht (nur Anzeige, nicht persistiert): normalisierter Gerichtsschlüssel (RATE-F-050), Bezeichnung, Menge der anbietenden Mensen des Tages in Auswahlreihenfolge, Verweis auf die maßgebliche Mensa = die erste anbietende Mensa, aus der Kategorie, Preise, Kennzeichnungen und Zusatzstoffhinweise übernommen werden. Die Anzeige ist in Abschnitte je Mensa gegliedert; ein Gericht gehört zum Abschnitt seiner maßgeblichen Mensa. Entsteht bei jedem Aufbau der Ansicht neu aus den je Mensa abgerufenen Tagesplänen; es gibt keinen zusammengefassten Bestand im Zwischenspeicher oder im Backend.

Lieblingsgerichte-Liste (lokal, abgeleitet): Menge normalisierter Gerichtsbezeichnungen (RATE-F-050), gebildet aus den eigenen Höchstbewertungen und gerätelokal gespiegelt (RATE-F-100), damit der Abgleich ohne Netzzugriff möglich bleibt. Kein eigenständiger, unabhängig setzbarer Merker mehr (MENSA-F-080 entfallen); die führende Quelle ist die Bewertung. Benachrichtigungsverlauf (lokal): je Kombination aus Gericht, Mensa und Datum ein Merker, ob bereits benachrichtigt wurde (Grundlage für die Requirement „Höchstens eine Benachrichtigung je Gericht-Mensa-Tag").

Unverträglichkeiten-Filter (lokal): Menge von Zusatzstoff-/Allergen-Codes aus dem `/additives`-Verzeichnis der Quelle (INT-015), von der Nutzerin selbst gewählt. Rein gerätegespeichert, kein serverseitiges Pendant.

Lebensstil-/Ausschluss-Vorgabe (lokal): zwei Mengen von Kennzeichnungs-Codes aus dem `/types`-Verzeichnis der Quelle (INT-015) — `nurZeigen` und `ausschluss`. Gewöhnliche personenbezogene Daten (Ernährungsvorlieben), nicht Art. 9 DSGVO wie die Unverträglichkeiten; dennoch rein gerätegespeichert und nie an eine externe Schnittstelle übertragen.

Höchstpreis (lokal): eine Zahl in Euro oder „kein Limit". Keine personenbezogene Angabe, aber wie die übrigen Filtervorgaben rein gerätegespeichert.

Sortier-/Gruppierpreset (lokal): Gruppierung (keine/Mensa/Kategorie), bei aktiver Gruppierung eine Gruppenreihenfolge aus Kriterium und Richtung, eine Gerichte-Sortierung aus Kriterium und Richtung. Vier vordefinierte Presets sind fester Bestandteil der Anwendung und unveränderlich. Eigene Presets tragen zusätzlich einen selbstgewählten Namen und liegen in einer gerätelokalen Liste; eine gerätelokale Referenz hält das zuletzt aktive Preset fest. Keine personenbezogene Angabe.

## Externe Schnittstellen

Nutzt INT-015 (Mensa-API des ITMC) über das eigene Backend INT-008 (siehe Capability `architecture` ARCH-F-050). Die Mensa-Stammdaten (Kennung, Anzeigename, Öffnungszeiten, Standardauswahl, Reihenfolge) liefert das Backend selbst, siehe Capability `backend-and-api` API-F-230; dieselbe Liste trägt die Ansicht aller Mensen. Die Zusammenfassung entsteht in der App aus den je Mensa gelieferten Tagesplänen und erfordert keinen zusätzlichen Endpunkt. Der Lieblingsgerichte-Abgleich nutzt ausschließlich die bereits über INT-015 abgerufenen Daten sowie die geräteeigene lokale Benachrichtigungs-API — ausdrücklich **nicht** INT-005, siehe Erläuterung zur Requirement „Lokale Benachrichtigung bei Lieblingsgericht im Tagesplan". Der Unverträglichkeiten-Filter ist an keiner externen Schnittstelle beteiligt — weder an INT-015 noch am eigenen Backend INT-008 — und erzeugt keinen eigenen Aufruf; er filtert ausschließlich die bereits über INT-015 abgerufenen Gerichte lokal. Keine weiteren Endpunktdetails hier — siehe Capability `integrations`.

## UI-Flows & Zustände

Die Hauptansicht ist von oben nach unten gegliedert: der Zugang zum Filtermenü, ein Trichter-Symbol, und daneben der Zugang zur Sortier-/Gruppierauswahl, sitzen auf Höhe des Bildschirmtitels im Kopfbereich, nicht in der Datumszeile; darunter die Datumsauswahl mit Pfeilen, mittig angeordnet, mit einer Handlung „Zurücksetzen" am Datum selbst, die nur außerhalb des aktuellen Tages sichtbar und auslösbar ist; darunter die Chip-Leiste als kompakte, einzeilige Ankernavigation über die Abschnitte der aktiven Gruppierung — Antippen scrollt zum Abschnitt, Scrollen setzt den hervorgehobenen Chip —, Chips ohne sichtbaren Abschnitt nicht auswählbar, ganz ausgeblendet ohne aktive Gruppierung; darunter die zusammengefasste Gerichtsliste, gemäß aktivem Preset gruppiert und sortiert (Überschrift entfällt bei nur einem sichtbaren Abschnitt), je Gericht mit dem Preis der eigenen Preisgruppe, ohne die durch den Filter betroffenen Gerichte; darunter der Fußbereich mit Öffnungszeiten der Mensen mit Angebot, der Anzahl gefilterter Gerichte, Geschlossen-Hinweisen und der Handlung „Alle Mensen anzeigen". Zwischen Bildschirmtitel und Datumsauswahl steht kein zusätzlicher Leerraum über das gewöhnliche Zeilenmaß hinaus. Waagerechtes Wischen über die Liste wechselt den Tag; Herunterziehen der Liste lädt die Tagespläne der gewählten Mensen neu.

Die Sortier-/Gruppierauswahl ist eine eigene Ansicht mit den vier vordefinierten Presets und den eigenen Presets obenan als Liste zum direkten Anwählen, darunter ein Bereich zum Zusammenstellen und Speichern einer eigenen Kombination aus Gruppierung, — bei aktiver Gruppierung — Gruppenreihenfolge und Gerichte-Sortierung; ein eigenes Preset trägt eine Umbenennen- und eine Löschen-Handlung, vordefinierte Presets keine.

Das Filtermenü ist eine eigene Ansicht mit vier Abschnitten untereinander: **Preis** (Höchstpreis-Steller mit −/+ und „Kein Limit" als unterem Anschlag, verglichen gegen die Preisgruppe aus SET-F-180), **Lebensstil** (nur Gerichte zeigen, die alle gewählten Kennzeichnungen tragen), **Ausschließen** (Gerichte mit einer dieser Kennzeichnungen verbergen) und **Unverträglichkeiten** (Zusatzstoff-/Allergenkennzeichnungen). Oben rechts neben dem Titel der Ansicht liegt die Handlung „Alle Filter entfernen" (immer sichtbar, nur bei mindestens einer gesetzten Vorgabe auslösbar); am Seitenende, unter den Abschnitten, steht der Hinweis auf die ausschließlich lokale Verarbeitung. Der Preis-Abschnitt ist auch ohne erreichbares Kennzeichnungs-/Zusatzstoffverzeichnis bedienbar. Lebensstil und Ausschluss speisen sich aus dem Kennzeichnungs-Verzeichnis, die Unverträglichkeiten aus dem Zusatzstoff-Verzeichnis (INT-015 `/additives`).

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des Abrufs |
| Leer (keine Mensa gewählt) | Hinweis auf die Mensaauswahl als nächsten Schritt; von dort kehrt die Nutzerin ohne separaten Speichern-Schritt zurück und sieht das Angebot der gewählten Mensen (die Auswahl wirkt sofort). Die Handlung „Alle Mensen anzeigen" ist auch in diesem Zustand erreichbar |
| Leer (alle gewählten Mensen ohne Angebot) | Hinweis „heute kein Angebot", keine Fehlermeldung; die Geschlossen-Hinweise stehen darunter |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Offline | Zuletzt geladener Speiseplan mit Alters-Hinweis |
| Aktualisieren (Herunterziehen) | Ladeanzeige am oberen Listenrand, während die Tagespläne der gewählten Mensen neu geladen werden; bei Fehlschlag bleibt der bisherige Stand mit Alters-/Fehlerhinweis sichtbar, keine leere Liste |
| Erster/letzter wählbarer Tag | Am aktuellen Tag ist „Tag zurück" nicht auslösbar und das Wischen nach hinten wirkungslos, erkennbar am abgeblendeten Pfeil |
| Chip angetippt | Liste scrollt an den Anfang des Abschnitts dieser Mensa; ihr Chip wird hervorgehoben |
| Liste gescrollt | Der Chip der Mensa, deren Abschnitt oben im sichtbaren Bereich steht, ist hervorgehoben; die Chip-Leiste rollt ihn bei Bedarf in Sicht |
| Lieblingsgericht heute verfügbar | Gericht in der Liste zusätzlich visuell hervorgehoben (unabhängig davon, ob die Benachrichtigung bereits ausgelöst wurde) |
| Gerichte ohne Quell-Kategorie | In einer Sammelgruppe ohne Kategorieüberschrift, am Ende der Gerichtsliste vor etwaigen Beilagen |
| Sortier-/Gruppiermenü geöffnet | Vordefinierte und eigene Presets zum direkten Anwählen (aktives Preset hervorgehoben), darunter der Zusammenstellungsbereich für ein eigenes Preset; ein eigenes Preset trägt Umbenennen/Löschen, vordefinierte nicht |
| Preset ohne Gruppierung gewählt | Gerichtsliste ohne Abschnittsüberschriften, Chip-Leiste ausgeblendet |
| Filtermenü geöffnet | Vier Abschnitte untereinander — Preis, Lebensstil, Ausschließen, Unverträglichkeiten; oben rechts neben dem Titel die Handlung „Alle Filter entfernen", am Seitenende der Hinweis auf die ausschließlich lokale Verarbeitung. Die Handlung ist ohne gesetzte Vorgabe sichtbar, aber abgeblendet und nicht auslösbar — sie sitzt außerhalb des scrollenden Inhalts, damit das erste Anhaken nichts verschiebt |
| Mindestens ein Gericht durch Unverträglichkeiten-Filter ausgeblendet | Gericht fehlt in der Gerichtsliste; am Seitenende die Anzahl der ausgeblendeten Gerichte |
| Kein Filter festgelegt oder Filter ohne Treffer im Tagesangebot | Kein Hinweis auf ausgeblendete Gerichte am Seitenende — die Anzahl 0 wird nicht eigens angezeigt |
| Alle Gerichte des Tages durch den Filter ausgeblendet | Leerzustand statt der Gerichtsliste, mit Anzahl der ausgeblendeten Gerichte und Verweis auf den Zugang zu den Unverträglichkeiten, unterscheidbar vom Leerzustand „heute kein Angebot" |
| Ansicht aller Mensen | Eigene Ansicht, aus dem Fußbereich geöffnet; dieselbe Chip-Ankernavigation wie die Hauptansicht über die anbietenden Mensen, je Mensa ein Abschnitt untereinander, Mensen ohne Angebot ausgelassen, je Gericht alle drei Preise unabhängig von der eigenen Preisgruppe. Lade-, Fehler- und Offline-Zustand wie in der Hauptansicht. Ein Gericht mit festgelegter Filtervorgabe erscheint ausgegraut statt ausgeblendet. Zurück führt in die Hauptansicht mit unverändertem Tag und unveränderter Auswahl |

## Offline-Verhalten

Speisepläne gelten laut Capability `data-and-storage` Abschnitt 4 bis Tagesende als aktuell genug und werden bei fehlendem Netzzugriff aus dem Zwischenspeicher angezeigt (siehe auch Capability `architecture` ARCH-F-100). Die Zusammenfassung arbeitet auf diesem Zwischenspeicher und ist damit ebenso offline verfügbar; fehlt der Tagesplan einer gewählten Mensa, fehlen ihre Gerichte in der Liste und sie erscheint im Geschlossen-Hinweis, was Abschnitt „Fehlerfälle" als Sonderfall benennt. Die Ansicht aller Mensen zeigt offline die Mensen, deren Tagesplan im Zwischenspeicher liegt — für nie geladene Mensen liegt nichts vor, sie fehlen wie unter der Requirement „Auslassen angebotsfreier Mensen in der Ansicht aller Mensen".

Die gespiegelte Lieblingsgerichte-Liste (RATE-F-100) ist wie jede lokale Auswahl unabhängig vom Netzzugriff verfügbar; der Abgleich gegen den Tagesplan setzt jedoch einen zuvor erfolgreich geladenen Speiseplan voraus.

Das Herunterziehen zum Aktualisieren ist offline wirkungslos außer einem sofort endenden Ladehinweis — es gibt keine Quelle, aus der neu geladen werden könnte; der zuletzt geladene Stand mit Alters-Hinweis bleibt stehen.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Gewählte Mensa liefert an einem Tag keine Daten | Geschlossen-Hinweis am Seitenende; nur wenn keine gewählte Mensa Daten liefert, Leerzustand „heute kein Angebot", in keinem Fall ein Fehlerzustand |
| Dasselbe Gericht trägt an zwei Mensen abweichende Preise oder Kennzeichnungen | Ein Eintrag bleibt bestehen; angezeigt werden die Angaben der maßgeblichen Mensa, nicht der Durchschnitt und keine Aufspaltung |
| Angebot eines Wochenendtags nicht bekannt (offline, Ladefehler) | Tag gilt als ohne Angebot und wird übersprungen; wird er später mit Angebot nachgeladen, erscheint er beim nächsten Blättern wieder |
| INT-015 liefert unerwartetes Antwortformat | Fehler protokollieren, Fehlermeldung mit Wiederholen-Option anzeigen (siehe Capability `quality-and-testing` QA-N-070) |
| Ansicht aller Mensen ohne Netzzugriff geöffnet | Zwischengespeicherte Mensen anzeigen, für die übrigen den Alters-/Offline-Hinweis der Ansicht; kein Fehlerzustand, solange wenigstens eine Mensa vorliegt |
| Höchstbewertung ohne erteilte Systemberechtigung für Benachrichtigungen | Bewertung wird dennoch gespeichert und das Gericht als Lieblingsgericht geführt, Hinweis auf die fehlende Systemberechtigung mit Verweis auf die Systemeinstellungen (analog Capability `settings` Abschnitt 9) |
| Höchstbewertung ohne angemeldetes Konto | Anmeldeaufforderung des Bewertungspfads (RATE-F-090); ohne Konto entsteht kein Lieblingsgericht |
| Hintergrundabruf vor dem Zielzeitpunkt nicht ausgeführt (Plattformeinschränkung) | Abgleich und Benachrichtigung erfolgen beim nächsten App-Öffnen nach, sofern es noch vormittags ist; andernfalls entfällt die Benachrichtigung für diesen Tag ersatzlos, das Gericht bleibt im Speiseplan normal sichtbar |

## Nicht-funktionale Anforderungen (Register)

Siehe Requirements „Zielzeitpunkt für den Lieblingsgerichte-Abgleich" (vormals MENSA-N-010) und „Aktualisierungszeitplan des Speiseplan-Zwischenspeichers" (vormals MENSA-N-020) oben.

## Akzeptanzkriterien

- Für eine gewählte Mensa mit bekanntem Tagesangebot werden alle Gerichte mit vollständigen Preisangaben angezeigt.
- Bieten zwei gewählte Mensen dasselbe Gericht an, erscheint es genau einmal in der Liste und nennt beide Mensen.
- Die zusammengefasste Liste ist in Abschnitte je gewählter Mensa mit Angebot gegliedert, in Auswahlreihenfolge; ein an mehreren Mensen angebotenes Gericht erscheint einmal, im Abschnitt der ersten anbietenden Mensa.
- Ein Chip-Tipp scrollt die Liste an den Anfang des Abschnitts dieser Mensa und hebt ihren Chip hervor, ohne Umfang, Gliederung oder einen Preis zu ändern; beim Scrollen folgt die Hervorhebung dem obersten sichtbaren Abschnitt.
- Am aktuellen Tag führt weder der Zurück-Pfeil noch eine Wischgeste nach hinten zu einem früheren Datum.
- Nach dem Blättern auf einen Folgetag stellt die Handlung „Zurücksetzen" die Tagesauswahl in einem Schritt auf den aktuellen Tag zurück; am aktuellen Tag ist sie nicht sichtbar.
- Ein Samstag ohne Angebot wird beim Blättern von Freitag aus übersprungen; ein Samstag mit Angebot wird angezeigt.
- Eine gewählte, an diesem Tag nicht anbietende Mensa erscheint als Hinweis unter der Liste, nicht als Fehlermeldung und nicht als leerer Abschnitt in der Liste.
- Die Handlung „Alle Mensen anzeigen" führt zu einer nach Mensa getrennten Ansicht mit derselben Chip-Ankernavigation; nach der Rückkehr sind Mensaauswahl, Reihenfolge und angezeigter Tag unverändert.
- Ein simulierter Ladefehler führt zu einer sichtbaren Fehlermeldung, nicht zu einer stillen leeren Ansicht.
- Das Herunterziehen der Gerichtsliste löst einen erneuten Abruf der Tagespläne aller gewählten Mensen aus dem Backend-Zwischenspeicher aus; schlägt er fehl, bleibt der bisherige Speiseplan mit Alters-/Fehlerhinweis sichtbar.
- Ein Speiseplan, dessen Gerichte keine Quell-Kategorie tragen (Food Fakultät), zeigt alle Gerichte in einer Gruppe ohne Kategorieüberschrift — kein Platzhalter, kein Zahlencode, kein Gericht fällt weg.
- Nach dem Festlegen einer Unverträglichkeit fehlt jedes Gericht mit der entsprechenden Kennzeichnung in der Gerichtsliste der Hauptansicht, und deren Anzahl steht am Seitenende.
- Dasselbe Gericht erscheint in der Ansicht aller Mensen weiterhin, aber ausgegraut und ohne Interaktionsmöglichkeit.
- Das Filtermenü zeigt den Hinweis auf die ausschließlich lokale Verarbeitung am Seitenende; die Handlung „Alle Filter entfernen" liegt oben rechts neben dem Titel, ist auch ohne gesetzte Vorgabe sichtbar (abgeblendet) und lässt den Inhalt beim ersten Anhaken nicht springen.
- Ist ein Höchstpreis von 4,00 € festgelegt, fehlt ein Gericht zu 4,50 € (Preis der gewählten Preisgruppe) in der Hauptansicht und erscheint in der Ansicht aller Mensen ausgegraut; die Anzahl steht am Seitenende.
- Der Zugang zum Filtermenü ist mit einem Trichter-Symbol gekennzeichnet und hebt sich farblich ab, sobald irgendein Filter — auch nur der Preis — gesetzt ist.
- Eine gewählte Mensa ohne sichtbaren Abschnitt am angezeigten Tag (kein Angebot oder alle Gerichte weggefiltert) erscheint in der Chip-Leiste als nicht auswählbarer Chip; beim Öffnen der Ansicht ist der erste Abschnitt hervorgehoben.
- Ist als Lebensstil „vegan" festgelegt, erscheinen nur noch Gerichte mit der Kennzeichnung „vegan"; alle übrigen sind ausgeblendet und am Seitenende gezählt.
- Ist „Schwein" als Ausschluss festgelegt, fehlt jedes so gekennzeichnete Gericht in der Hauptansicht und erscheint in der Ansicht aller Mensen ausgegraut.
- Lebensstil-Vorgabe und Ausschluss erscheinen in keinem Netzwerkmitschnitt gegen INT-008 oder eine andere Schnittstelle.
- Der Zugang zum Filtermenü steht auf Höhe des Bildschirmtitels; die Datumsauswahl steht mittig darunter, ohne zusätzlichen Leerraum dazwischen.
- Eine gewählte Mensa ohne Angebot am Tag erscheint nur im Geschlossen-Hinweis, nicht zusätzlich mit einer Öffnungszeit-Zeile.
- Ein Netzwerkmitschnitt bei aktivem Unverträglichkeiten-Filter enthält in keinem Aufruf gegen INT-008 oder eine andere externe Schnittstelle die gewählten Kennzeichnungen.
- Ohne festgelegte Unverträglichkeit verhält sich die Ansicht unverändert zur Fassung ohne Filter — kein Gericht wird ausgeblendet, kein Hinweis auf ausgeblendete Gerichte erscheint.
- In der Hauptansicht zeigt jedes Gericht genau einen Preis, entsprechend der in den Einstellungen gewählten Preisgruppe; ohne eigene Wahl den Preis für Studierende (SET-F-190).
- In der Ansicht aller Mensen zeigt dasselbe Gericht weiterhin alle drei Preise, unabhängig von der gewählten Preisgruppe.
- Ein mit der besten Bewertungsstufe bewertetes Gericht wird über mehrere Tage hinweg trotz wechselnder roher Gerichtsbezeichnung als Lieblingsgericht wiedererkannt.
- Wird die Höchstbewertung herabgesetzt, gilt das Gericht nicht mehr als Lieblingsgericht und löst keine Benachrichtigung mehr aus.
- Erscheint ein Lieblingsgericht im Tages-Speiseplan, erfolgt genau eine Benachrichtigung für diese Gericht-Mensa-Tag-Kombination, keine wiederholte.
- Bei abgeschalteter Lieblingsgericht-Benachrichtigung (SET-F-170) erfolgt keine Benachrichtigung, das Gericht bleibt in der Liste hervorgehoben.
- Die gespiegelte Lieblingsgerichte-Liste bleibt nach einem simulierten Offline-Start der App vollständig erhalten (lokale Persistenz, RATE-F-100/Datenmodell).
- Ohne eigene Wahl ist beim ersten Öffnen das Preset „Mensa, günstigstes zuerst" aktiv; die Liste ist nach Mensa gegliedert, in Mensa-Auswahlreihenfolge, die Gerichte je Abschnitt aufsteigend nach dem Preis der eigenen Preisgruppe.
- Wird das Preset „Preis" gewählt, verschwindet die Chip-Leiste, es gibt keine Abschnittsüberschriften mehr, und die Gerichte der gewählten Mensen erscheinen in einer Liste, aufsteigend nach dem Preis der eigenen Preisgruppe sortiert.
- Wird die Gruppierung „nach Kategorie" mit der Gruppenreihenfolge „alphabetisch, absteigend" gewählt, erscheinen die Kategorie-Abschnitte in umgekehrt alphabetischer Reihenfolge, mit der kategorielosen Sammelgruppe unmittelbar vor der weiterhin letzten Beilagen-Gruppe.
- Ein selbst zusammengestelltes Preset ist nach dem Speichern unter dem gewählten Namen in der Presetliste wählbar, bleibt nach einem simulierten Neustart erhalten und lässt sich umbenennen und löschen; ein vordefiniertes Preset bietet dafür keine Handlung.
- Das zuletzt gewählte Preset ist nach einem simulierten Neustart weiterhin aktiv.
- Ändert die Nutzerin nur die Gruppenreihenfolge einer Mensa-Gruppierung (z. B. auf alphabetisch), bleibt der bei einem an mehreren Mensen angebotenen Gericht angezeigte Preis unverändert — er richtet sich weiterhin nach der Mensa-Auswahlreihenfolge, nicht nach der Gruppenreihenfolge.
- Solange zu keinem Gericht eine Bewertung vorliegt, verhält sich ein nach Bewertung sortiertes Preset wie die Reihenfolge der Quelle — kein Gericht fällt aus der Liste, keine Fehleranzeige.

## Bewusst nicht übernommenes Altverhalten

- Stillschweigend verschluckter Ladefehler (leeres `finally` ohne `catch`) — Grund: verdeckt Fehlerzustände, siehe Requirement „Sichtbare Fehlermeldung beim Ladefehler".
- Unverschlüsselter Abruf über `http://` — Grund: überträgt Standort-/Mensawahl im Klartext, siehe Requirement „TLS-gesicherter Abruf des Speiseplans".
- Roher numerischer `category`-Code als Kategorieüberschrift, wenn die Quelle keinen Ausgabestellennamen liefert (Android-Alt-App, `MenuService.java:122-125`) — Grund: „20"/„21" als Überschrift ist für die Nutzerin bedeutungslos; stattdessen kategorielose Sammelgruppe, siehe Requirement „Sammelgruppe ohne Ausgabestellen-Kategorie".
- Trennung der Tagesansicht nach Mensa als **einzige** Darstellung (Android-Alt-App, `MenuDayFragment.java:105`) — Grund: zeigt dasselbe Gericht mehrfach und verlagert den Vergleich auf die Nutzerin, siehe Requirement „Zusammenfassung zu einem Eintrag je Gericht". Die Darstellung selbst bleibt als zweite Ansicht erhalten, sie ist nur nicht mehr der Regelfall.
- Ausblenden einer Mensa aus dem Kontextmenü der Tageskarte (Android-Alt-App, `MenuDayFragment.java:64-72`, schreibt die Auswahl beim Blättern still um) — Grund: eine beiläufige Geste ändert dauerhaft die Mensaauswahl; die Auswahl wird ausschließlich in der Mensaauswahl geändert.

## Offene Fragen

- ~~Datenquelle für Mensa-Öffnungszeiten: keine bestätigte Quelle identifiziert.~~ Beantwortet am 2026-08-25: INT-015 liefert Öffnungszeiten je Mensa; zusätzlich enthalten die Mensa-Stammdaten eine gepflegte Angabe je Wochentag. Aufgenommen als Requirement „Öffnungszeiten je Mensa und Wochentag".
- ~~Welche der beiden Öffnungszeit-Quellen führend ist — die Schnittstelle (INT-015, `openings/all`) oder die gepflegten Stammdaten.~~ Entschieden am 2026-09-03 (Roadmap-Schritt 4): Die gepflegten Stammdaten sind führend; `openings/all` antwortete bei der Verifikation mit HTTP 500 und wird nicht genutzt (Capability `integrations` INT-015).
- ~~Zuverlässigkeit zeitgesteuerter Hintergrundabrufe je Plattform für den Zielwert der Requirement „Zielzeitpunkt für den Lieblingsgerichte-Abgleich".~~ In Roadmap-Schritt 4 umgesetzt über die betriebssystemeigene Hintergrundaufgabe mit Vordergrund-Nachholung (siehe Erläuterung zum Umsetzungsmechanismus); die tatsächliche Ausführungszeit auf Gerät wird im Prüfprotokoll `pruefprotokolle/2026-09-04-schritt-4-mensa.md` festgehalten, das Requirement bleibt Zielwert (Capability `non-functional` Abschnitt 11).
- ~~Ob ein zusätzlicher, globaler Ein-/Ausschalter für Lieblingsgerichte-Benachrichtigungen in Capability `settings` sinnvoll ist (unabhängig vom Entfernen einzelner Markierungen, MENSA-F-080).~~ Entschieden am 2026-09-04: Er ist nötig, seit die Lieblingseigenschaft aus der Bewertung folgt — wer ein Gericht mit der besten Stufe bewertet, will damit nicht zwingend benachrichtigt werden, und das Herabsetzen der eigenen Bewertung wäre ein unangemessener Weg, die Benachrichtigung abzustellen. Aufgenommen als SET-F-170, wirksam über die Requirement „Abschaltbare Lieblingsgericht-Benachrichtigung".
- Ob die Zusammenfassung über die gewählten Mensen hinaus auch in der Ansicht aller Mensen angeboten werden soll. Für den ersten Umfang bewusst nein: Dort ist der Ort die Frage, nicht das Gericht. Zu prüfen, sobald die Ansicht in Gebrauch ist — FSR FB4.
- Ob die Beschränkung auf den aktuellen Tag auch für den laufenden Tag nach Schließung der Mensen sinnvoll bleibt oder ab einer Uhrzeit auf den Folgetag vorgeblendet werden sollte. Nicht entschieden, betrifft nur den Startwert der Datumsauswahl, nicht die Grenze selbst — FSR FB4.
- Wie sich die Lieblingsgericht-Benachrichtigung verhält, wenn eine Person auf einem zweiten Gerät angemeldet ist: Die Spiegelung (RATE-F-100) entsteht je Gerät beim Abruf der eigenen Bewertungen; ob dabei jedes Gerät benachrichtigt oder eine Zustellung genügt, ist offen und mit Roadmap-Schritt 9 zu entscheiden.
- **Weitere Gruppierungs-/Sortier-Bausteine.** Die aktuellen Requirements zu Sortierung und Gruppierung decken die am 2026-09-04 benannten Regelfälle und die naheliegenden Ergänzungen (Preis, alphabetisch) ab. Ob weitere Bausteine sinnvoll sind — etwa Gruppierung nach Kennzeichnung (vegan/vegetarisch/Fleisch) oder Sortierung nach Entfernung/Öffnungsstatus der Mensa — ist offen und nach erster Nutzung zu prüfen, FSR FB4.
