## ADDED Requirements

### Requirement: Ausweis der Ausgabezeit bei abweichender Öffnungszeit

Falls die Quelle zu einer Mensa für den angezeigten Wochentag eine Essensausgabezeit führt, die von deren Öffnungszeit abweicht, muss das System beide ausweisen und dabei erkennbar machen, welche die Ausgabezeit ist. Stimmen beide überein, weist das System allein die Öffnungszeit aus. Herkunft: Recherche: mensa.fb4.it `GET /canteens/{id}/hours`, 2026-09-22. Die Felder `servingOpen`/`servingClose` stehen laut Quelle nur dort, wo sie von `open`/`close` abweichen; am Max-Ophüls-Platz öffnet das Haus um 08:00, die Essensausgabe beginnt um 11:30.

#### Scenario: Ausgabezeit weicht ab
- **WHEN** die Quelle zu einer Mensa für den angezeigten Wochentag eine von der Öffnungszeit abweichende Ausgabezeit führt
- **THEN** weist das System Öffnungszeit und Ausgabezeit getrennt aus und macht erkennbar, welche die Ausgabezeit ist

#### Scenario: Ausgabezeit gleich der Öffnungszeit
- **WHEN** die Quelle zu einer Mensa für den angezeigten Wochentag keine abweichende Ausgabezeit führt
- **THEN** weist das System allein die Öffnungszeit aus

### Requirement: Hinweis für geöffnete Mensa ohne Speiseplan

Falls eine gewählte Mensa am angezeigten Tag geöffnet ist, aber kein Gericht führt, muss das System sie mit einem Hinweis ausweisen, dass für diesen Tag kein Speiseplan vorliegt, und darf sie nicht als geschlossen darstellen. Ihre Öffnungszeit wird dabei angezeigt. Der Hinweis steht bei Gruppierung „nach Mensa" in ihrem eigenen Abschnitt unter der Mensa-Überschrift, bei jeder anderen Gruppierung am Ende der Gerichtsliste. Herkunft: Recherche: mensa.fb4.it, Abgleich aller 15 Standorte über sieben Tage, 2026-09-22. Drei Standorte führen grundsätzlich nie einen Speiseplan (`hasMenu: false`) und sind dennoch geöffnet; unter der vorherigen Fassung wären sie an sechs von sieben Tagen fälschlich als geschlossen angezeigt worden.

#### Scenario: Geöffnete Mensa ohne Gericht bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag geöffnet ist, aber kein Gericht führt
- **THEN** zeigt das System in deren Abschnitt den Hinweis, dass kein Speiseplan vorliegt, samt Öffnungszeit, und nicht den Geschlossen-Hinweis

#### Scenario: Geöffnete Mensa ohne Gericht ohne Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" nicht aktiv ist und eine gewählte Mensa am angezeigten Tag geöffnet ist, aber kein Gericht führt
- **THEN** zeigt das System sie am Ende der Gerichtsliste mit dem Hinweis, dass kein Speiseplan vorliegt, samt Öffnungszeit

### Requirement: Grund und Zeitraum einer Schließung

Falls die Quelle zu einer am angezeigten Tag geschlossenen Mensa einen Schließungsgrund führt, muss das System ihn zusammen mit dem Geschlossen-Hinweis wiedergeben; führt die Quelle zu dieser Schließung zusätzlich ein Enddatum, muss das System auch dieses nennen. Der Grund wird wiedergegeben, wie die Quelle ihn liefert, und nicht in eine eigene Formulierung übersetzt. Herkunft: Recherche: mensa.fb4.it `GET /canteens/{id}/hours`, Felder `today.reason` und `closures[]`, 2026-09-22. Die Quelle liefert Klartext wie „Restaurant-Schließtag: Betriebsferien" und dazu den Zeitraum `from`/`to`.

#### Scenario: Schließung mit Grund und Enddatum
- **WHEN** eine gewählte Mensa am angezeigten Tag geschlossen ist und die Quelle dazu einen Grund und ein Enddatum führt
- **THEN** nennt das System zusammen mit dem Geschlossen-Hinweis den Grund und das Enddatum der Schließung

#### Scenario: Schließung ohne Grundangabe
- **WHEN** eine gewählte Mensa am angezeigten Tag geschlossen ist und die Quelle dazu keinen Grund führt
- **THEN** zeigt das System allein den Geschlossen-Hinweis

### Requirement: Anzeige der CO₂-Klasse am Gericht

Sofern die Quelle zu einem Gericht eine CO₂-Klasse führt, muss das System sie am Gericht anzeigen. Ein Gericht der besten Klasse muss das System zusätzlich als Klimateller kennzeichnen. Herkunft: Recherche: mensa.fb4.it, Felder `co2Class` und Tag `climate-plate`, Legende unter `GET /legend`, 2026-09-22. Die Quelle führt die Klassen A, B, C und E; nur A gilt als Klimateller.

#### Scenario: Gericht mit CO₂-Klasse
- **WHEN** die Quelle zu einem Gericht eine CO₂-Klasse führt
- **THEN** zeigt das System diese Klasse am Gericht an

#### Scenario: Gericht der besten CO₂-Klasse
- **WHEN** die Quelle zu einem Gericht die beste CO₂-Klasse führt
- **THEN** kennzeichnet das System es zusätzlich als Klimateller

### Requirement: Gerichtsbezeichnung nach Komponenten gegliedert

Das System muss die Bezeichnung eines Gerichts nach dessen Komponenten gegliedert anzeigen: die erste Komponente hervorgehoben als Name des Gerichts, die weiteren darunter als dessen Beiwerk. Es darf die Komponenten nicht zu einer Zeile mit Trennzeichen zusammenziehen. Herkunft: Recherche: mensa.fb4.it, Feld `lines[]`, 2026-09-22. Die Quelle liefert die Bezeichnung bereits zerlegt — „Gebackener Kabeljau", „Dillsauce oder", „Dip", „Salzkartoffeln", „Salat", „Vinaigrette" —, wo die abgelöste Quelle eine einzelne Zeichenkette mit ` | `-Trennern lieferte.

#### Scenario: Gericht mit mehreren Komponenten
- **WHEN** die Quelle zu einem Gericht mehrere Komponenten liefert
- **THEN** zeigt das System die erste hervorgehoben und die weiteren darunter an, nicht als eine Zeile mit Trennzeichen

#### Scenario: Gericht mit einer Komponente
- **WHEN** die Quelle zu einem Gericht genau eine Komponente liefert
- **THEN** zeigt das System allein diese als Namen des Gerichts an

### Requirement: Standortangaben der Mensa

Das System muss zu jeder Mensa, zu der die Quelle sie führt, deren Anschrift, deren Beschreibung und einen Verweis auf ihre Lage in einem Kartendienst anbieten. Fehlt eine dieser Angaben, entfällt sie ersatzlos, ohne dass die übrigen ausbleiben. Herkunft: Recherche: mensa.fb4.it `GET /canteens`, Felder `address`, `description`, `mapsUrl`, 2026-09-22. Die abgelöste Quelle führte keine dieser Angaben; vier der 15 Standorte liegen außerhalb Dortmunds.

#### Scenario: Mensa mit vollständigen Standortangaben
- **WHEN** die Quelle zu einer Mensa Anschrift, Beschreibung und Kartenverweis führt
- **THEN** bietet das System alle drei an

#### Scenario: Mensa ohne Anschrift
- **WHEN** die Quelle zu einer Mensa keine Anschrift führt
- **THEN** entfällt allein die Anschrift, und das System bietet die übrigen vorhandenen Angaben weiterhin an

### Requirement: Getrennte Abschnitte für Allergene und Zusatzstoffe im Filtermenü

Das System muss die auswählbaren Kennzeichnungen im Filtermenü in zwei getrennten Abschnitten anbieten — Allergene und Zusatzstoffe —, entsprechend der Einordnung durch die Quelle. Eine bereits bestehende Auswahl der Nutzerin muss dabei unverändert gültig bleiben und im jeweils zugehörigen Abschnitt erscheinen. Herkunft: Recherche: mensa.fb4.it `GET /legend`, 2026-09-22. Die Quelle trennt 27 Allergene von 11 Zusatzstoffen; die abgelöste Quelle lieferte beide als eine Liste. Die Schlüssel sind in beiden Quellen dieselben, weshalb eine bestehende Auswahl ohne Umschreibung gültig bleibt.

#### Scenario: Filtermenü mit beiden Abschnitten
- **WHEN** die Nutzerin das Filtermenü öffnet
- **THEN** bietet das System Allergene und Zusatzstoffe in zwei getrennten Abschnitten an

#### Scenario: Bestehende Auswahl nach der Umstellung
- **WHEN** eine vor der Trennung festgelegte Auswahl vorliegt und die Nutzerin das Filtermenü öffnet
- **THEN** bleibt jede gewählte Kennzeichnung gewählt und erscheint in dem Abschnitt, dem die Quelle sie zuordnet

### Requirement: Sammelschalter für zusammengehörige Allergengruppen

Das System muss für jede Allergengruppe, die die Quelle in Unterschlüssel gliedert, einen Schalter anbieten, der alle Unterschlüssel dieser Gruppe gemeinsam setzt und gemeinsam löst. Die Unterschlüssel müssen daneben einzeln wählbar bleiben. Herkunft: NEU, entschieden 2026-09-22. Die Quelle gliedert Gluten in sechs (`20a`–`20f`) und Nüsse in acht Unterschlüssel (`27a`–`27h`); ohne Sammelschalter müsste eine Nutzerin, die alle Glutenarten meidet, sechs Einträge einzeln antippen.

#### Scenario: Sammelschalter setzen
- **WHEN** die Nutzerin den Sammelschalter einer Allergengruppe setzt
- **THEN** gelten alle Unterschlüssel dieser Gruppe als gewählt

#### Scenario: Einzelner Unterschlüssel bleibt wählbar
- **WHEN** die Nutzerin einen einzelnen Unterschlüssel einer Allergengruppe wählt
- **THEN** gilt allein dieser als gewählt, ohne dass die übrigen der Gruppe mitgewählt werden

### Requirement: Geschlossen-Hinweis für geschlossene Mensa

Falls eine gewählte Mensa am angezeigten Tag laut Mensa-Schnittstelle geschlossen ist, muss das System sie mit dem Hinweis ausweisen, dass sie an diesem Tag geschlossen ist. Maßgeblich ist die Öffnungsangabe der Schnittstelle, nicht das Fehlen von Gerichten. Bei Gruppierung „nach Mensa" steht der Hinweis in ihrem eigenen Abschnitt unter der Mensa-Überschrift; bei jeder anderen Gruppierung steht er am Ende der Gerichtsliste. Herkunft: Recherche: mensa.fb4.it, Abgleich aller 15 Standorte über sieben Tage, 2026-09-22 (vormals MENSA-F-049, vgl. L-049; Ort des Hinweises von der Gruppierung abhängig gemacht 2026-09-07, Bedingung vom fehlenden Angebot auf die Öffnungsangabe umgestellt 2026-09-22). Der Abgleich ergab in 105 Tag/Mensa-Paaren keinen Fall, in dem die Schnittstelle eine Mensa als geschlossen führte, während ihr Speiseplan Gerichte enthielt; umgekehrt führten drei Standorte nie einen Speiseplan, obwohl sie geöffnet sind.

#### Scenario: Geschlossene Mensa bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag geschlossen ist
- **THEN** zeigt das System den Geschlossen-Hinweis in deren Abschnitt unter der Mensa-Überschrift

#### Scenario: Geschlossene Mensa ohne Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" nicht aktiv ist und eine gewählte Mensa am angezeigten Tag geschlossen ist
- **THEN** zeigt das System sie am Ende der Gerichtsliste mit einem Geschlossen-Hinweis an

#### Scenario: Geöffnete Mensa ohne Gericht
- **WHEN** eine gewählte Mensa am angezeigten Tag geöffnet ist und kein Gericht führt
- **THEN** zeigt das System keinen Geschlossen-Hinweis für sie

### Requirement: Keine Öffnungszeit für geschlossene Mensa

Das System darf zu einer gewählten Mensa, die am angezeigten Tag geschlossen ist, deren Öffnungszeit für diesen Tag in keiner Darstellungsform anzeigen — weder als Zeile am Listenende noch an der Abschnittsüberschrift; für sie bleiben allein der Geschlossen-Hinweis samt Grund und der Wiedereröffnungshinweis. Für eine geöffnete Mensa ohne Speiseplan gilt diese Einschränkung nicht: ihre Öffnungszeit wird angezeigt. Herkunft: NEU, vgl. AND-018 (Öffnungszeiten je Mensa und Wochentag in der Android-App; diese Anforderung schränkt deren Anzeige ein, statt sie neu einzuführen), auf jede Darstellungsform ausgedehnt 2026-09-07, Bedingung vom fehlenden Angebot auf die Öffnungsangabe umgestellt 2026-09-22; vormals MENSA-F-290.

#### Scenario: Geschlossene Mensa am Tag
- **WHEN** eine gewählte Mensa am angezeigten Tag geschlossen ist
- **THEN** zeigt das System für sie keine Öffnungszeit dieses Tages, weder am Listenende noch an ihrer Abschnittsüberschrift

#### Scenario: Geöffnete Mensa ohne Speiseplan
- **WHEN** eine gewählte Mensa am angezeigten Tag geöffnet ist und kein Gericht führt
- **THEN** zeigt das System ihre Öffnungszeit dieses Tages an

### Requirement: Überspringen geschlossener Wochenendtage

Falls an einem Samstag oder Sonntag keine der gewählten Mensen geöffnet ist, muss das System diesen Tag beim Blättern und Wischen überspringen; den aktuellen Tag muss das System davon ausnehmen und nie überspringen. Ein Wochenendtag ist damit erreichbar, wenn mindestens eine gewählte Mensa an ihm geöffnet ist oder wenn er der aktuelle Tag ist. Maßgeblich ist die Öffnungsangabe, nicht das Vorliegen eines Speiseplans. Herkunft: Recherche: mensa.fb4.it, 2026-09-22 (vormals MENSA-F-044; Ausnahme für den aktuellen Tag entschieden 2026-09-05, Bedingung vom fehlenden Angebot auf die Öffnungsangabe umgestellt 2026-09-22). Der Speiseplan führt grundsätzlich keine Wochenendtage und kann eine Samstagsöffnung weder bestätigen noch widerlegen; Canapé in Iserlohn und Snack it in Hagen sind samstags geöffnet und wären unter der vorherigen Fassung an ihrem Öffnungstag nicht erreichbar gewesen.

#### Scenario: Samstag ohne geöffnete Mensa
- **WHEN** an einem Samstag, der nicht der aktuelle Tag ist, keine der gewählten Mensen geöffnet ist
- **THEN** überspringt das System diesen Tag beim Blättern und beim Wischen

#### Scenario: Samstag mit geöffneter Mensa ohne Speiseplan
- **WHEN** an einem Samstag mindestens eine gewählte Mensa geöffnet ist und für ihn kein Speiseplan vorliegt
- **THEN** ist dieser Tag beim Blättern und beim Wischen erreichbar

#### Scenario: Rückblättern auf einen geschlossenen aktuellen Wochenendtag
- **WHEN** der aktuelle Tag ein Samstag oder Sonntag ohne geöffnete Mensa ist und die Nutzerin von einem Folgetag zurückblättert oder zurückwischt
- **THEN** wechselt das System auf den aktuellen Tag, statt ihn zu überspringen

#### Scenario: Vorblättern vom geschlossenen aktuellen Wochenendtag
- **WHEN** der aktuelle Tag ein Samstag ohne geöffnete Mensa ist und die Nutzerin vorwärts blättert
- **THEN** überspringt das System den folgenden Sonntag ohne geöffnete Mensa und zeigt den Montag

## MODIFIED Requirements

### Requirement: Öffnungszeiten je Mensa und Wochentag

Das System muss zu jeder gewählten Mensa deren Öffnungszeiten für den angezeigten Wochentag ausweisen, bezogen aus der Mensa-Schnittstelle. Herkunft: Recherche: mensa.fb4.it `GET /canteens/{id}/hours`, 2026-09-22 (vormals MENSA-F-047, Datengrundlage von den gepflegten Stammdaten auf die Schnittstelle umgestellt 2026-09-22). Die Umstellung revidiert die Entscheidung vom 2026-09-03 zugunsten der gepflegten Stammdaten; deren Grund — die Öffnungszeiten der damaligen Quelle waren nicht abrufbar — ist entfallen. Die gepflegte Angabe war zum Zeitpunkt der Umstellung nachweislich veraltet: für die Hauptmensa war freitags `11:30 - 14:00` hinterlegt, während die Schnittstelle `11:30 - 14:15` führte.

#### Scenario: Öffnungszeit einer Mensa
- **WHEN** eine gewählte Mensa am angezeigten Wochentag geöffnet ist
- **THEN** zeigt das System ihre Öffnungszeit für diesen Wochentag an

### Requirement: Öffnungszeit an der Mensa-Abschnittsüberschrift

Wenn die Gruppierung „nach Mensa" aktiv ist, muss das System zu jedem Abschnitt eine Überschrift mit dem Mensa-Namen führen — auch wenn es nur einen Abschnitt gibt — und die Öffnungszeit dieser Mensa für den angezeigten Wochentag unmittelbar an dieser Überschrift ausweisen, nicht am Listenende. Bei jeder anderen Gruppierung bleiben die Öffnungszeiten der gewählten Mensen am Ende der Gerichtsliste. Herkunft: NEU, entschieden 2026-09-07, auf den Fall der geöffneten Mensa ohne Speiseplan ausgedehnt 2026-09-22.

#### Scenario: Mensa-Gruppierung mit hinterlegter Öffnungszeit
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine Mensa am angezeigten Wochentag geöffnet ist
- **THEN** zeigt das System deren Öffnungszeit an der Abschnittsüberschrift dieser Mensa und nicht am Listenende

#### Scenario: Einzige gewählte Mensa
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und nur eine Mensa einen Abschnitt führt
- **THEN** zeigt das System die Abschnittsüberschrift mit Mensa-Namen und Öffnungszeit trotzdem an

#### Scenario: Geöffnete Mensa ohne Speiseplan
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine Mensa am angezeigten Tag geöffnet ist, aber kein Gericht führt
- **THEN** zeigt das System deren Öffnungszeit an der Abschnittsüberschrift, zusammen mit dem Hinweis, dass kein Speiseplan vorliegt

#### Scenario: Ohne Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" nicht aktiv ist
- **THEN** zeigt das System die Öffnungszeiten der gewählten Mensen am Ende der Gerichtsliste

### Requirement: Wiedereröffnungshinweis an der geschlossenen Mensa

Falls eine gewählte Mensa am angezeigten Tag geschlossen ist, muss das System zusammen mit dem Geschlossen-Hinweis den nächsten Tag nennen, für den die Mensa-Schnittstelle diese Mensa als geöffnet führt; gesucht wird ab dem Tag nach dem angezeigten Tag über den gesamten von der Schnittstelle gelieferten Vorausblick — Öffnungsvorschau und Schließtage gemeinsam. Der Hinweis muss als Aussage über die Öffnung formuliert sein, nicht als Aussage über ein bestimmtes Gericht, weil ein künftiges Angebot bis zum jeweiligen Tag noch geändert werden kann. Reicht der Vorausblick nicht bis zu einem Öffnungstag, entfällt der Zusatz und es bleibt beim Geschlossen-Hinweis. Herkunft: Recherche: mensa.fb4.it, Felder `forecast[]` und `closures[]`, 2026-09-22 (Datengrundlage am 2026-09-07 von den gepflegten Öffnungszeiten auf den Speiseplan-Zwischenspeicher umgestellt, am 2026-09-22 auf die Öffnungsangaben der Schnittstelle). Der Speiseplan trug diese Aussage nicht verlässlich: sein Horizont schwankte am 2026-09-22 je Mensa zwischen 4 und 11 Tagen, und für die drei Standorte ohne Speiseplan existierte er gar nicht. Die Schließtagsangaben stimmten dagegen taggenau mit dem Speiseplanbeginn überein — die Betriebsferien der Mensa Süd endeten am 04.10., ihr Speiseplan begann am 05.10.

#### Scenario: Geschlossene Mensa mit späterem Öffnungstag
- **WHEN** eine gewählte Mensa am angezeigten Tag geschlossen ist und die Schnittstelle sie für einen späteren Tag ihres Vorausblicks als geöffnet führt
- **THEN** nennt das System zusätzlich zum Geschlossen-Hinweis den nächstgelegenen dieser Tage als Tag der Wiedereröffnung

#### Scenario: Keine Öffnungszeit in den folgenden sieben Tagen
- **WHEN** eine gewählte Mensa am angezeigten Tag geschlossen ist und die Schnittstelle für keinen Tag ihres Vorausblicks eine Öffnung dieser Mensa führt
- **THEN** zeigt das System allein den Geschlossen-Hinweis, ohne Angabe eines Wiedereröffnungstages

#### Scenario: Zwischenzeitlich veröffentlichter Speiseplan
- **WHEN** die Schnittstelle zu einem zuvor ohne Angabe eines Wiedereröffnungstages angezeigten Zeitraum nachträglich einen Öffnungstag dieser Mensa führt
- **THEN** nennt das System bei der nächsten Anzeige diesen Tag als Wiedereröffnungstag, statt weiterhin ohne Angabe zu bleiben

#### Scenario: Mensa ohne Speiseplan
- **WHEN** eine gewählte Mensa geschlossen ist und für sie grundsätzlich kein Speiseplan geführt wird
- **THEN** nennt das System den Wiedereröffnungstag dennoch, sofern die Öffnungsangaben der Schnittstelle ihn hergeben

### Requirement: Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe

Das System muss zu jedem Gericht Kategorie, Bezeichnung, Preis für Studierende, Mitarbeitende und Gäste sowie die Allergen- und Zusatzstoffhinweise anzeigen; Allergene und Zusatzstoffe müssen dabei als solche unterscheidbar sein. Herkunft: Alt: lib/areas/canteen/models/meal.dart (vormals MENSA-F-030), um die Unterscheidung von Allergenen und Zusatzstoffen ergänzt 2026-09-22 nach Recherche: mensa.fb4.it `GET /legend`.

#### Scenario: Vollständige Gerichtsangaben
- **WHEN** ein Gericht angezeigt wird
- **THEN** zeigt das System Kategorie, Bezeichnung, alle drei Preise sowie die Allergen- und Zusatzstoffhinweise dieses Gerichts

#### Scenario: Unterscheidbarkeit von Allergen und Zusatzstoff
- **WHEN** ein Gericht sowohl Allergen- als auch Zusatzstoffhinweise trägt
- **THEN** macht das System erkennbar, welche Hinweise Allergene und welche Zusatzstoffe sind

### Requirement: Anzeige von Gericht-Kennzeichnungen

Sofern die Quelle zu einem Gericht Kennzeichnungen liefert (z. B. vegan, vegetarisch, Klimateller, artgerecht), muss das System sie am Gericht anzeigen. Herkunft: Recherche: mensa.fb4.it `GET /legend`, 2026-09-22 (vormals MENSA-F-035, Quellbezug von INT-015 auf die neue Mensa-Schnittstelle umgestellt). Die Quelle führt ein festes Vokabular von zehn Kennzeichnungen, darunter „artgerecht", das die abgelöste Quelle nicht kannte.

#### Scenario: Gericht mit Kennzeichnung
- **WHEN** die Quelle zu einem Gericht mindestens eine Kennzeichnung liefert
- **THEN** zeigt das System diese Kennzeichnung am Gericht an

### Requirement: Festlegen eigener Unverträglichkeiten

Das System muss der Nutzerin ermöglichen, eines oder mehrere der zu einem Gericht möglichen Allergene und Zusatzstoffe als eigene Unverträglichkeit festzulegen. Herkunft: NEU (vormals MENSA-F-180), auf die getrennte Führung von Allergenen und Zusatzstoffen nachgezogen 2026-09-22.

#### Scenario: Unverträglichkeit festlegen
- **WHEN** die Nutzerin im Filtermenü ein Allergen oder einen Zusatzstoff als Unverträglichkeit auswählt
- **THEN** speichert das System diese Auswahl als eigene Unverträglichkeit

### Requirement: Ausschluss nach Kennzeichnung

Das System muss der Nutzerin ermöglichen, aus denselben Kennzeichnungen sowie aus den CO₂-Klassen eine oder mehrere als auszuschließen festzulegen, sodass Gerichte, die eine davon tragen, nicht angezeigt werden. Herkunft: NEU (vormals MENSA-F-260), um die CO₂-Klassen erweitert 2026-09-22.

#### Scenario: Ausschluss „Schwein"
- **WHEN** die Nutzerin „Schwein" als Ausschluss festlegt
- **THEN** blendet das System jedes so gekennzeichnete Gericht aus

#### Scenario: Ausschluss einer CO₂-Klasse
- **WHEN** die Nutzerin eine CO₂-Klasse als Ausschluss festlegt
- **THEN** blendet das System jedes Gericht dieser Klasse aus

### Requirement: Wahl der Gruppierung

Das System muss der Nutzerin ermöglichen, für die Gerichtsliste zwischen den Gruppierungs-Bausteinen „keine Gruppierung", „nach Mensa", „nach Kategorie" und „nach CO₂-Klasse" zu wählen. Herkunft: NEU (vormals MENSA-F-300), um die CO₂-Klasse erweitert 2026-09-22.

#### Scenario: Gruppierung wählen
- **WHEN** die Nutzerin in der Sortier-/Gruppierauswahl eine Gruppierung wählt
- **THEN** übernimmt das System diese Gruppierung für die Gerichtsliste

#### Scenario: Gruppierung nach CO₂-Klasse
- **WHEN** die Nutzerin die Gruppierung „nach CO₂-Klasse" wählt
- **THEN** gliedert das System die Gerichtsliste in Abschnitte je CO₂-Klasse

### Requirement: Sortierkriterien für Gerichte

Das System muss als Sortierkriterien mindestens anbieten: Reihenfolge der Mensa, Bezeichnung, Preis der gewählten Preisgruppe, eigene Bewertungsstufe, Community-Gesamtbewertung und CO₂-Klasse. Herkunft: NEU, Beschriftung des Reihenfolge-Kriteriums geändert 2026-09-07, um die CO₂-Klasse erweitert 2026-09-22 (vormals MENSA-F-310). Beantwortet den auf die CO₂-Klasse entfallenden Teil der offenen Frage „Weitere Gruppierungs-/Sortier-Bausteine".

#### Scenario: Verfügbare Sortierkriterien
- **WHEN** die Nutzerin die Sortierkriterien öffnet
- **THEN** bietet das System mindestens die Reihenfolge der Mensa, Bezeichnung, Preis, eigene Bewertungsstufe, Community-Gesamtbewertung und CO₂-Klasse an

### Requirement: Gruppenreihenfolge-Kriterien bei Kategorie-Gruppierung

Das System muss bei Gruppierung nach Kategorie als Kriterien für die Gruppenreihenfolge die Reihenfolge der Ausgabestellen in der Mensa-Schnittstelle für den angezeigten Tag und die alphabetische Reihenfolge des Kategorienamens anbieten. Herkunft: NEU (vormals MENSA-F-325), Quellbezug von INT-015 auf die neue Mensa-Schnittstelle umgestellt 2026-09-22.

#### Scenario: Kriterien bei Kategorie-Gruppierung
- **WHEN** die Gruppierung „nach Kategorie" aktiv ist
- **THEN** bietet das System die Quellreihenfolge der Ausgabestellen und die alphabetische Reihenfolge als Gruppenreihenfolge-Kriterien an

### Requirement: Nicht auswählbare Chips ohne sichtbaren Abschnitt

Das System muss in der Chip-Leiste den Chip einer Gruppe, die am angezeigten Tag keinen eigenen Abschnitt führt, als nicht auswählbar darstellen. Bei Gruppierung „nach Mensa" führt jede gewählte Mensa einen Abschnitt — mit Angebot, mit Geschlossen-Hinweis, mit dem Hinweis auf den fehlenden Speiseplan oder mit Filter-Hinweis —, ihr Chip ist damit stets auswählbar. Herkunft: NEU, auf Gruppen ohne eigenen Abschnitt eingeschränkt 2026-09-07, um den Abschnitt der geöffneten Mensa ohne Speiseplan ergänzt 2026-09-22 (vormals MENSA-F-295).

#### Scenario: Chip ohne Abschnitt
- **WHEN** die Gruppierung „nach Kategorie" aktiv ist und eine Kategorie am angezeigten Tag keinen Abschnitt führt
- **THEN** stellt das System deren Chip als nicht auswählbar dar

#### Scenario: Geschlossene Mensa bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag geschlossen ist
- **THEN** ist ihr Chip auswählbar und führt zu ihrem Abschnitt mit dem Geschlossen-Hinweis

#### Scenario: Geöffnete Mensa ohne Speiseplan bei Mensa-Gruppierung
- **WHEN** die Gruppierung „nach Mensa" aktiv ist und eine gewählte Mensa am angezeigten Tag geöffnet ist, aber kein Gericht führt
- **THEN** ist ihr Chip auswählbar und führt zu ihrem Abschnitt mit dem Hinweis auf den fehlenden Speiseplan

## REMOVED Requirements

### Requirement: Geschlossen-Hinweis für Mensa ohne Angebot

**Reason**: Die Bedingung „führt am angezeigten Tag kein Angebot" ist als Kennzeichen einer Schließung nicht mehr tragfähig, seit die Mensa-Schnittstelle die Öffnung selbst meldet. Der Abgleich am 2026-09-22 über alle 15 Standorte und 105 Tag/Mensa-Paare ergab drei Standorte, die grundsätzlich nie einen Speiseplan führen und dennoch geöffnet sind — sie wären unter dieser Fassung dauerhaft fälschlich als geschlossen angezeigt worden.

**Migration**: Ersetzt durch zwei Requirements derselben Capability, die die beiden nun unterscheidbaren Sachverhalte tragen: „Geschlossen-Hinweis für geschlossene Mensa" (gestützt auf die Öffnungsangabe der Schnittstelle) und „Hinweis für geöffnete Mensa ohne Speiseplan". Die Regeln zum Ort des Hinweises je nach Gruppierung gelten unverändert für beide.

### Requirement: Keine Öffnungszeit für Mensa ohne Angebot

**Reason**: Dieselbe Umstellung der Bedingung. Die Einschränkung war daran gebunden, dass eine Mensa ohne Angebot als geschlossen galt; eine geöffnete Mensa ohne Speiseplan soll ihre Öffnungszeit dagegen anzeigen, weil die Nutzerin dort hingehen kann.

**Migration**: Ersetzt durch „Keine Öffnungszeit für geschlossene Mensa" in derselben Capability. Die Einschränkung gilt dort unverändert für jede Darstellungsform, greift aber nur noch bei tatsächlicher Schließung.

### Requirement: Überspringen angebotsfreier Wochenendtage

**Reason**: Der Speiseplan enthält grundsätzlich keine Wochenendtage — die Quelle lässt sie aus, weil die Mensen üblicherweise geschlossen sind. Er kann eine Wochenendöffnung damit weder bestätigen noch widerlegen. Canapé (Iserlohn) und Snack it (Hagen) sind samstags geöffnet; unter dieser Fassung wäre ihr Öffnungstag beim Blättern und Wischen nicht erreichbar gewesen.

**Migration**: Ersetzt durch „Überspringen geschlossener Wochenendtage" in derselben Capability. Die Ausnahme für den aktuellen Tag gilt unverändert; maßgeblich ist statt des Angebots die Öffnungsangabe der Mensa-Schnittstelle.

### Requirement: Aktualisierungszeitplan des Speiseplan-Zwischenspeichers

**Reason**: Der serverseitige Speiseplan-Zwischenspeicher entfällt mit der Ablösung von INT-015 ersatzlos. Die neue Mensa-Schnittstelle ist selbst ein Zwischenspeicher im Verantwortungsbereich des FSR und hält die Daten vor; ein zweiter Zwischenspeicher davor brächte keinen Gewinn, sondern eine weitere Stelle, an der ein veralteter Stand hängen bleiben kann. Damit entfällt auch der Zeitplan, nach dem er aufzufrischen wäre.

**Migration**: Die Aktualität wird nicht mehr über einen eigenen Auffrischungszeitplan hergestellt, sondern durch Durchreichen bei jeder Anfrage unter Beachtung der von der Quelle gesetzten Gültigkeitsdauer (Capability `backend-and-api`, Requirement „Mensa-Daten durchreichen statt zwischenspeichern"). Meldet die Quelle einen auffällig alten Stand, greift der bestehende Altershinweis (Capability `data-and-storage`, Requirement „Altershinweis bei veralteten Daten der Mensa-Schnittstelle").
