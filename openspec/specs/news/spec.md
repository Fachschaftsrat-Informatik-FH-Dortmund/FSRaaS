## Purpose

Informiert Studierende über FSR-News, FB-Aktuelles und automatisch abgeleitete Event-Erinnerungen in einer gemeinsamen, filter- und durchsuchbaren Liste, mit geräteseitiger Steuerung, welche Meldungen eine Benachrichtigung auslösen. Vormals `specs/features/news/spec.md` (Präfix `NEWS`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Laden und Anzeige aktueller Meldungen

Das System muss die aktuellen Meldungen aus dem eigenen Backend (Capability `integrations`, Eintrag INT-008, Zwischenspeicher von INT-003/INT-010) laden und in absteigender chronologischer Reihenfolge anzeigen. Herkunft: Alt: lib/areas/news/repositories/news_repository.dart (vormals NEWS-F-010).

#### Scenario: Meldungen laden
- **WHEN** die Meldungsliste geöffnet wird
- **THEN** lädt das System die aktuellen Meldungen über das eigene Backend und zeigt sie absteigend chronologisch an

### Requirement: 24-Stunden-Zeitformat für Zeitstempel

Das System muss den Zeitstempel jeder Meldung im 24-Stunden-Format auswerten. Herkunft: Alt: bewusst verworfen (vormals NEWS-F-020). Die Alt-App parst den Zeitstempel mit dem Muster `dd.MM.yyyy - hh:mm:ss` (12-Stunden-Stunde `hh`), obwohl das Rohformat keine AM/PM-Angabe liefert (`news_item.dart:26`, dokumentiert als INT-003 in Capability `integrations`). Zeiten ab 13:00 Uhr wurden dadurch falsch interpretiert; für die Neuentwicklung ist 24-Stunden-Parsing (`HH`) verbindlich.

#### Scenario: Nachmittagszeit korrekt ausgewertet
- **WHEN** der Rohwert `"24.08.2026 - 14:30:00"` ausgewertet wird
- **THEN** ergibt das System 14:30 Uhr, nicht vormittags fehlinterpretiert wie im Altverhalten mit 12-Stunden-Muster `hh`

#### Scenario: Meldung mit unlesbarem Zeitstempel
- **WHEN** ein Zeitstempel nicht auswertbar ist
- **THEN** zeigt das System die Meldung dennoch an und kennzeichnet den Zeitstempel als „unbekannt", statt die gesamte Meldung zu verwerfen

### Requirement: Fehlermeldung bei nicht erreichbarem News-Dienst

Falls der News-Dienst nicht erreichbar ist, muss das System eine Fehlermeldung mit Wiederholen-Option anzeigen. Herkunft: NEU (vormals NEWS-F-030).

#### Scenario: Dienst nicht erreichbar
- **WHEN** der Abruf des News-Diensts fehlschlägt
- **THEN** zeigt das System eine Fehlermeldung mit einer Option zum erneuten Versuch

### Requirement: Anpinnen und Ablösen einzelner Meldungen

Das System muss der Nutzerin das Anpinnen und Ablösen einzelner Meldungen über einen sichtbaren Bedienweg ermöglichen. Herkunft: Alt: bewusst verworfen (vormals NEWS-F-040). Die Alt-App erreicht diese Funktion nur über langes Drücken ohne sichtbaren Hinweis; das wird nicht übernommen (siehe Capability `ux-and-theming`).

#### Scenario: Meldung anpinnen
- **WHEN** die Nutzerin über einen sichtbaren Bedienweg eine Meldung anpinnt
- **THEN** markiert das System die Meldung als angepinnt und bietet denselben Weg zum Ablösen an

### Requirement: Dauerhafte Anzeige angepinnter Meldungen

Das System muss angepinnte Meldungen unabhängig von ihrem Alter dauerhaft oberhalb der übrigen Meldungen anzeigen. Herkunft: Alt: lib/areas/news/screens/news_overview_page.dart (vormals NEWS-F-050).

#### Scenario: Angepinnte Meldung nach Neustart
- **WHEN** die App nach dem Anpinnen einer Meldung neu gestartet wird
- **THEN** erscheint die Meldung weiterhin oberhalb der übrigen Meldungen, unabhängig von ihrem Alter

### Requirement: Push-Benachrichtigung bei neuen Meldungen

Sofern die Nutzerin Push-Benachrichtigungen für News aktiviert hat, muss das System bei neuen Meldungen eine Benachrichtigung auslösen. Herkunft: Alt: lib/utils/plugins/push_notification_manager.dart (vormals NEWS-F-060).

#### Scenario: Neue Meldung mit aktiviertem Push
- **WHEN** eine neue Meldung eintrifft und die Nutzerin Push-Benachrichtigungen für News aktiviert hat
- **THEN** löst das System eine Benachrichtigung aus, vorbehaltlich der Regeln aus „Zusammenspiel von Positiv- und Sperrliste"

### Requirement: Navigation zur Meldung bei angetippter Benachrichtigung

Wenn eine Push-Benachrichtigung zu einer Meldung angetippt wird, muss das System direkt zur betreffenden Meldung navigieren. Herkunft: NEU (vormals NEWS-F-070). Die Alt-App verarbeitet eingehende Push-Nachrichten nicht (Handler auskommentiert, siehe INT-005 in Capability `integrations`); Deep-Linking ist daher Neuentwicklung ohne Alt-Vorbild.

#### Scenario: Benachrichtigung angetippt
- **WHEN** die Nutzerin eine Push-Benachrichtigung zu einer Meldung antippt
- **THEN** navigiert das System direkt zur betreffenden Meldung

### Requirement: Klassifizierung jeder Meldung

Das System muss jede Meldung genau einer der drei Klassifizierungen FB-Aktuelles, FSR-News oder Event-Erinnerung zuordnen und diese Klassifizierung in der Liste sichtbar kennzeichnen. Herkunft: NEU (vormals NEWS-F-080). Aus der Redaktionsweg-Entscheidung des FSR FB4 vom 2026-08-25.

#### Scenario: Klassifizierung sichtbar
- **WHEN** eine Meldung in der Liste angezeigt wird
- **THEN** trägt sie sichtbar genau eine der drei Klassifizierungen

### Requirement: FB-Aktuelles über das eigene Backend laden

Das System muss FB-Aktuelles-Meldungen aus INT-010 (Fachbereichsseite `aktuelles-ni`) über das eigene Backend laden. Herkunft: NEU (vormals NEWS-F-090).

#### Scenario: FB-Aktuelles ohne eigene Redaktion
- **WHEN** eine FB-Aktuelles-Meldung angezeigt wird
- **THEN** stammt sie aus dem über das Backend geladenen Import von INT-010 und bietet keine FSR-Redaktionsmöglichkeit

### Requirement: Event-Erinnerung vor Event-Beginn

Wenn ein Event aus Capability `events` innerhalb der konfigurierten Vorlaufzeit beginnt, muss das System dafür eine Meldung der Klassifizierung Event-Erinnerung in der Liste anzeigen. Herkunft: NEU (vormals NEWS-F-100).

#### Scenario: Event innerhalb der Vorlaufzeit
- **WHEN** ein Event innerhalb der konfigurierten Vorlaufzeit beginnt
- **THEN** erscheint genau eine Event-Erinnerung in der Meldungsliste, kein Duplikat bei wiederholtem Laden

### Requirement: Kombinierbare Filterung der Meldungsliste

Das System muss eine kombinierbare Filterung der Meldungsliste nach mindestens den Merkmalen Klassifizierung, Quelle/Verteiler und Veröffentlichungszeitraum anbieten. Herkunft: NEU (vormals NEWS-F-110). Anforderung FSR FB4, 2026-09-04; ersetzt eine vorige, nur auf Klassifizierung beschränkte „kann"-Fassung — Major-Änderung.

#### Scenario: Kombinierter Filter
- **WHEN** die Nutzerin Klassifizierung, Verteiler und Zeitraum gleichzeitig einschränkt
- **THEN** zeigt das System nur Meldungen, die allen drei Filtermerkmalen entsprechen

### Requirement: Suche über Titel und Text

Das System muss eine Suche über Titel und Text der geladenen Meldungen anbieten. Herkunft: Alt: bewusst verworfen (vormals NEWS-F-120). Endpunktdetails siehe Capability `integrations`; keine serverseitige Suche vorgesehen, da der Bestand geräteseitig vollständig vorliegt.

#### Scenario: Treffer über Titel oder Text
- **WHEN** die Nutzerin einen Suchbegriff eingibt, der im Titel oder Text einer geladenen Meldung vorkommt
- **THEN** zeigt das System diese Meldung im Suchergebnis

### Requirement: Suche ohne Beachtung von Groß-/Kleinschreibung

Das System muss bei der Suche Groß- und Kleinschreibung unberücksichtigt lassen. Herkunft: Alt: bewusst verworfen (vormals NEWS-F-130). Die Alt-App durchsucht ohne Normalisierung der Groß-/Kleinschreibung (`news_overview_viewmodel.dart:95-101`); das wird korrigiert.

#### Scenario: Suche unabhängig von Schreibweise
- **WHEN** nach „klausur" gesucht wird und eine Meldung „Klausur" enthält
- **THEN** erscheint diese Meldung im Suchergebnis

### Requirement: Nachladen älterer Meldungen

Wenn die Nutzerin über das Ende der geladenen Meldungen hinaus blättert, muss das System ältere Meldungen nachladen. Herkunft: Recherche: alte apps/android-fb4, model/LoadMoreItem.java, 2026-08-25 (vormals NEWS-F-140). Die Quelle liefert Meldungen seitenweise (INT-010, siehe Capability `integrations`).

#### Scenario: Ans Ende der Liste blättern
- **WHEN** die Nutzerin über das Ende der bereits geladenen Meldungen hinaus blättert
- **THEN** lädt das System die nächste Seite älterer Meldungen nach

### Requirement: Textsuche über Quelle/Verteiler

Das System muss die Textsuche zusätzlich zu Titel und Text auch über die Quelle/den Verteiler jeder Meldung ausführen. Herkunft: NEU (vormals NEWS-F-150).

#### Scenario: Treffer über Verteiler
- **WHEN** der Suchbegriff dem Verteiler einer Meldung entspricht, aber weder in Titel noch Text vorkommt
- **THEN** erscheint diese Meldung im Suchergebnis

### Requirement: Kombination aus Filter und Suche

Solange gleichzeitig ein Filter und eine Suche aktiv sind, muss das System nur Meldungen anzeigen, die allen gesetzten Filtermerkmalen und dem Suchbegriff entsprechen. Herkunft: NEU (vormals NEWS-F-160).

#### Scenario: Filter und Suche gleichzeitig aktiv
- **WHEN** ein Filter und ein Suchbegriff gleichzeitig gesetzt sind
- **THEN** zeigt das System nur Meldungen, die beide Bedingungen erfüllen

### Requirement: Kennzeichnung aktiver Einschränkung mit Rücksetzweg

Solange mindestens ein Filter oder eine Suche aktiv ist, muss das System dies sichtbar kennzeichnen und einen Bedienweg bereitstellen, der alle Einschränkungen auf einmal aufhebt. Herkunft: NEU (vormals NEWS-F-170). Verhindert, dass ein vergessener Filter wie ein leerer Meldungsbestand wirkt.

#### Scenario: Alle Einschränkungen zurücksetzen
- **WHEN** mindestens ein Filter oder eine Suche aktiv ist und die Nutzerin den Rücksetzweg auslöst
- **THEN** entfernt das System alle Einschränkungen auf einmal und die Kennzeichnung verschwindet

### Requirement: Hinweis auf unvollständigen Bestand bei aktiver Suche oder Filter

Falls bei aktiver Suche oder aktivem Filter noch nicht alle Meldungen nachgeladen sind, muss das System darauf hinweisen, dass sich das Ergebnis nur auf die bereits geladenen Meldungen bezieht. Herkunft: NEU (vormals NEWS-F-180).

#### Scenario: Suche vor vollständigem Nachladen
- **WHEN** eine Suche oder ein Filter aktiv ist und noch nicht alle Meldungen geladen wurden
- **THEN** weist das System darauf hin, dass sich das Ergebnis nur auf den bereits geladenen Bestand bezieht

### Requirement: Erweiterter Suchmodus mit regulärem Ausdruck

Sofern die Nutzerin den erweiterten Suchmodus aktiviert, muss das System den eingegebenen Suchbegriff als regulären Ausdruck über Titel, Text und Verteiler der geladenen Meldungen auswerten. Herkunft: NEU (vormals NEWS-F-190). Anforderung FSR FB4, 2026-09-04; die einfache Suche bleibt der voreingestellte Weg.

#### Scenario: Suche mit regulärem Ausdruck
- **WHEN** der erweiterte Suchmodus aktiv ist und ein gültiger regulärer Ausdruck eingegeben wird
- **THEN** wertet das System ihn über Titel, Text und Verteiler der geladenen Meldungen aus

### Requirement: Kennzeichnung eines ungültigen regulären Ausdrucks

Falls der im erweiterten Suchmodus eingegebene reguläre Ausdruck syntaktisch ungültig ist, muss das System dies als Eingabefehler kennzeichnen und die zuletzt gültige Trefferliste unverändert lassen. Herkunft: NEU (vormals NEWS-F-200). Dieselbe Linie wie Capability `security-and-privacy` (keine stillschweigend verschluckten Fehler).

#### Scenario: Syntaktisch ungültiger Ausdruck
- **WHEN** ein syntaktisch ungültiger regulärer Ausdruck eingegeben wird
- **THEN** kennzeichnet das System dies als Eingabefehler und behält die zuletzt gültige Trefferliste bei, statt „keine Treffer" anzuzeigen

### Requirement: Laufzeitbegrenzung der Ausdrucksauswertung

Das System muss die Auswertung eines von der Nutzerin eingegebenen regulären Ausdrucks nach einer festen Obergrenze für Laufzeit oder Verarbeitungsaufwand abbrechen, ohne dass die Bedienoberfläche währenddessen blockiert. Herkunft: NEU (vormals NEWS-F-210). Schutz gegen katastrophales Backtracking (ReDoS).

#### Scenario: Ausdruck mit katastrophalem Backtracking
- **WHEN** ein bewusst auf katastrophales Backtracking angelegter regulärer Ausdruck ausgewertet wird
- **THEN** bricht das System die Auswertung nach der festen Obergrenze ab, ohne dass die Bedienoberfläche währenddessen blockiert

### Requirement: Kennzeichnung eines Abbruchs der Ausdrucksauswertung

Wenn die Auswertung eines regulären Ausdrucks nach der Laufzeitbegrenzung abgebrochen wurde, muss das System dies der Nutzerin kenntlich machen, statt ein unvollständiges Ergebnis wie ein reguläres darzustellen. Herkunft: NEU (vormals NEWS-F-215).

#### Scenario: Abbruch sichtbar gemacht
- **WHEN** die Auswertung eines regulären Ausdrucks wegen Überschreitens der Laufzeitgrenze abgebrochen wurde
- **THEN** kennzeichnet das System dies sichtbar, statt das unvollständige Ergebnis wie ein reguläres Suchergebnis darzustellen

### Requirement: Wahl der Groß-/Kleinschreibung im erweiterten Suchmodus

Solange der erweiterte Suchmodus aktiv ist, muss das System der Nutzerin die Wahl lassen, ob die Suche Groß- und Kleinschreibung beachtet; die Suche ohne Beachtung von Groß-/Kleinschreibung gilt in diesem Modus nur als Voreinstellung. Herkunft: NEU (vormals NEWS-F-220).

#### Scenario: Groß-/Kleinschreibung im erweiterten Modus abwählen
- **WHEN** der erweiterte Suchmodus aktiv ist und die Nutzerin die Beachtung von Groß-/Kleinschreibung einschaltet
- **THEN** wertet das System den regulären Ausdruck fortan unter Beachtung der Groß-/Kleinschreibung aus

### Requirement: Positiv- und Sperrliste für Benachrichtigungen

Sofern Push-Benachrichtigungen für News aktiviert sind, muss das System der Nutzerin ermöglichen, eine Positivliste und eine Sperrliste aus Regeln zu pflegen, die bestimmen, welche neuen Meldungen eine Benachrichtigung auslösen. Herkunft: NEU (vormals NEWS-F-230). Anforderung FSR FB4, 2026-09-04.

#### Scenario: Regellisten pflegen
- **WHEN** Push-Benachrichtigungen für News aktiviert sind
- **THEN** kann die Nutzerin Regeln zu einer Positivliste und einer Sperrliste hinzufügen

### Requirement: Merkmale der Regeln für Positiv- und Sperrliste

Das System muss als Regel für die Positiv- und die Sperrliste mindestens die Merkmale Klassifizierung, Quelle/Verteiler und Stichwort in Titel oder Text unterstützen. Herkunft: NEU (vormals NEWS-F-240).

#### Scenario: Regel nach Stichwort
- **WHEN** eine Regel mit einem Stichwort in Titel oder Text angelegt wird
- **THEN** wendet das System sie bei der Bewertung neuer Meldungen an

### Requirement: Zusammenspiel von Positiv- und Sperrliste

Wenn eine neue Meldung eintrifft und Push-Benachrichtigungen für News aktiviert sind, muss das System genau dann eine Benachrichtigung auslösen, wenn die Meldung keiner Regel der Sperrliste entspricht und zusätzlich die Positivliste entweder leer ist oder die Meldung mindestens einer ihrer Regeln entspricht. Herkunft: NEU (vormals NEWS-F-250). „Sperrliste befüllt"/„Positivliste befüllt" heißt: enthält mindestens eine Regel.

| Sperrliste | Positivliste | Meldung passt zu Sperrlisten-Regel | Meldung passt zu Positivlisten-Regel | Benachrichtigung |
|---|---|---|---|---|
| leer | leer | (entfällt) | (entfällt) | löst aus |
| leer | befüllt | (entfällt) | ja | löst aus |
| leer | befüllt | (entfällt) | nein | unterdrückt — nicht von der Positivliste erfasst |
| befüllt | leer | ja | (entfällt) | unterdrückt — Sperrliste |
| befüllt | leer | nein | (entfällt) | löst aus |
| befüllt | befüllt | ja | ja | unterdrückt — Sperrliste hat Vorrang |
| befüllt | befüllt | nein | ja | löst aus |
| befüllt | befüllt | nein | nein | unterdrückt — nicht von der Positivliste erfasst |

#### Scenario: Sperrliste hat Vorrang vor Positivliste
- **WHEN** eine Meldung sowohl einer Sperrlisten- als auch einer Positivlisten-Regel entspricht
- **THEN** unterdrückt das System die Benachrichtigung

#### Scenario: Leere Positivliste löst weiterhin aus
- **WHEN** die Sperrliste leer ist, die Positivliste leer ist und eine neue Meldung eintrifft
- **THEN** löst das System eine Benachrichtigung aus

#### Scenario: Befüllte Positivliste ohne Treffer unterdrückt
- **WHEN** die Sperrliste leer, die Positivliste befüllt ist und die Meldung keiner Positivlisten-Regel entspricht
- **THEN** unterdrückt das System die Benachrichtigung

### Requirement: Beschränkung von Positiv- und Sperrliste auf Benachrichtigungen

Das System muss die Positiv- und die Sperrliste ausschließlich auf das Auslösen von Benachrichtigungen anwenden. Herkunft: NEU (vormals NEWS-F-260).

#### Scenario: Keine Wirkung außerhalb von Benachrichtigungen
- **WHEN** eine Meldung durch die Sperrliste von einer Benachrichtigung ausgeschlossen ist
- **THEN** bleibt sie in der Meldungsliste unverändert enthalten

### Requirement: Vollständige Meldungsliste unabhängig von Benachrichtigungsregeln

Das System muss alle Meldungen in der Meldungsliste anzeigen, unabhängig davon, ob sie durch die Positiv- oder die Sperrliste von einer Benachrichtigung ausgeschlossen sind. Herkunft: NEU (vormals NEWS-F-265).

#### Scenario: Durch Sperrliste unterdrückte Meldung bleibt sichtbar
- **WHEN** eine Meldung per Sperrliste von der Benachrichtigung ausgeschlossen ist
- **THEN** ist sie in der Meldungsliste weiterhin vorhanden

### Requirement: Ausschließlich geräteseitige Auswertung der Benachrichtigungsregeln

Das System muss die Auswertung der Positiv- und der Sperrliste ausschließlich auf dem Gerät vornehmen; die Regeln dürfen das Gerät nicht verlassen. Herkunft: NEU (vormals NEWS-F-270). Die Regeln sind personenbeziehbar und werden nach demselben Muster wie in Capability `schedule` (SCHED-F-220) rein lokal ausgewertet.

#### Scenario: Keine Übertragung der Regeln
- **WHEN** der Netzverkehr der App während der Regelauswertung beobachtet wird
- **THEN** ist kein Inhalt der Benachrichtigungsregeln darin enthalten

### Requirement: Gleiche Regelauswertung für In-App-Hinweise

Sofern das System ohne Push-Infrastruktur In-App-Hinweise auf neue Meldungen anzeigt (INT-005), muss es dieselbe Auswertung der Positiv- und der Sperrliste darauf anwenden wie auf Push-Benachrichtigungen. Herkunft: NEU (vormals NEWS-F-280).

#### Scenario: In-App-Hinweis ohne Push-Infrastruktur
- **WHEN** eine neue Meldung ohne verfügbare Push-Infrastruktur als In-App-Hinweis angezeigt werden soll
- **THEN** wendet das System dieselben Positiv-/Sperrlisten-Regeln an wie bei Push-Benachrichtigungen

### Requirement: Schutzmaßnahmen für reguläre Ausdrücke in Benachrichtigungsregeln

Sofern eine Regel der Positiv- oder der Sperrliste als regulärer Ausdruck gekennzeichnet ist, muss das System sie unter denselben Schutzmaßnahmen wie bei der Laufzeitbegrenzung der Ausdrucksauswertung auswerten. Herkunft: NEU (vormals NEWS-F-290).

#### Scenario: Ungültiger regulärer Ausdruck in einer Regel
- **WHEN** eine als regulärer Ausdruck gekennzeichnete Regel beim Speichern syntaktisch ungültig ist
- **THEN** kennzeichnet das System die Regel als fehlerhaft, wendet sie nicht an, und die übrigen Regeln bleiben wirksam

### Requirement: Laufzeitobergrenze für die Suchbegriff-Auswertung

Die Auswertung eines Suchbegriffs über den geladenen Meldungsbestand sollte auf einem üblichen aktuellen Gerät innerhalb von 1 Sekunde abgeschlossen oder nach dieser Zeitspanne abgebrochen sein (vorgeschlagen, zu bestätigen). Herkunft: NEU (vormals NEWS-N-010). Ergänzt Capability `non-functional` (wahrgenommene Reaktionszeit) um eine harte Obergrenze speziell für die nutzerdefinierte Ausdrucksauswertung. Nachweis über ein datiertes Prüfprotokoll ist nach Capability `quality-and-testing` (Leistungswerte) zulässig.

#### Scenario: Auswertung innerhalb der Zeitgrenze
- **WHEN** ein Suchbegriff über den geladenen Meldungsbestand auf einem üblichen aktuellen Gerät ausgewertet wird
- **THEN** ist die Auswertung innerhalb von 1 Sekunde abgeschlossen oder nach dieser Zeitspanne abgebrochen

## Datenmodell

Meldung: Titel, Text, Veröffentlichungszeitpunkt, Quelle/Verteiler, Klassifizierung (`FB-Aktuelles` | `FSR-News` | `Event-Erinnerung`). Rohfelder FSR-News/FB-Aktuelles: siehe INT-003/INT-010 in Capability `integrations`. Event-Erinnerungen entstehen ausschließlich aus dem Event-Datenmodell (Capability `events`), keine eigenen Rohfelder. Angepinnter Zustand ist ein rein lokales Attribut, siehe Capability `data-and-storage` (DATA-F-060).

Filter- und Suchzustand (flüchtig): gewählte Klassifizierungen, Verteiler und Zeitraum, Suchbegriff und Suchmodus einfach/erweitert, Wahl der Groß-/Kleinschreibung im erweiterten Modus. Sitzungslokal, keine dauerhafte Speicherung nötig.

Benachrichtigungsregeln (lokal): Positivliste und Sperrliste als je eine Liste von Regeln. Eine Regel besteht aus einem Merkmalstyp (Klassifizierung, Verteiler oder Stichwort), dem Vergleichswert und einer Kennzeichnung, ob der Wert als Teilzeichenkette oder als regulärer Ausdruck ausgewertet wird. Ausschließlich geräteseitig gespeichert und nie übertragen, siehe Capability `data-and-storage` Abschnitt 2 und DATA-F-180.

## Externe Schnittstellen

Nutzt INT-003 (News-Feed, Klassifizierung FSR-News) und INT-010 (Fachbereichsseite `aktuelles-ni`, Klassifizierung FB-Aktuelles) ausschließlich über das eigene Backend INT-008 (siehe Capability `architecture`, ARCH-F-050) sowie INT-005 (Push-Benachrichtigungen) für die Zustellung. Die geräteseitige Auswertung der Positiv- und Sperrliste setzt voraus, dass die Push-Nutzlast von INT-005 Klassifizierung, Verteiler und Titel der Meldung mitführt; dieser Bedarf ist bei INT-005 vermerkt. Event-Erinnerungen nutzen keine eigene externe Schnittstelle, sondern die interne Event-Ressource des Backends (Capability `events`). Keine Endpunktdetails hier — siehe Capability `integrations`.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des Abrufs, zuletzt geladene Meldungen bleiben sichtbar |
| Leer | Hinweis „keine aktuellen Meldungen" |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Offline | Zuletzt geladener Stand mit Alters-Hinweis |
| Leer wegen Filter/Suche | Hinweis, dass die aktive Einschränkung der Grund ist, mit Rücksetzweg und, falls zutreffend, Hinweis auf nicht geladene Meldungen |
| Ungültiger regulärer Ausdruck | Sucheingabe als fehlerhaft markiert, zuletzt gültige Trefferliste bleibt stehen |
| Suche abgebrochen | Hinweis, dass die Auswertung des Ausdrucks die Zeitgrenze überschritten hat und abgebrochen wurde |
| Benachrichtigungsregeln bearbeiten | Getrennte Listen für Positiv- und Sperrliste, je Regel Merkmalstyp und Wert; eine als regulärer Ausdruck gekennzeichnete Regel wird beim Speichern auf Gültigkeit geprüft |

## Offline-Verhalten

News gehört zu den in Capability `architecture` (ARCH-F-100) benannten Bereichen mit garantiertem Offline-Zugriff auf den zuletzt geladenen, geräteseitig gecachten Stand (Cache-Regel: 15 Minuten laut INT-003, siehe Capability `data-and-storage` Abschnitt 4).

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Meldung mit unlesbarem Zeitstempel | Meldung dennoch anzeigen, Zeitstempel als „unbekannt" kennzeichnen statt die gesamte Meldung zu verwerfen |
| Push-Zustellung schlägt fehl | Kein Fehler in der App sichtbar — die Meldung ist beim nächsten regulären Abruf trotzdem verfügbar |
| Ungültiger regulärer Ausdruck in der Suche | Als Eingabefehler anzeigen, zuletzt gültige Trefferliste behalten; nicht als „keine Treffer" darstellen |
| Regulärer Ausdruck überschreitet die Laufzeitgrenze | Auswertung abbrechen und den Abbruch sichtbar kennzeichnen, Bedienoberfläche bleibt bedienbar |
| Ungültiger regulärer Ausdruck in einer Benachrichtigungsregel | Regel beim Speichern als fehlerhaft kennzeichnen und nicht anwenden, bis sie korrigiert ist; die übrigen Regeln bleiben wirksam |
| Push-Nutzlast ohne die zum Filtern nötigen Metadaten | Im Zweifel benachrichtigen statt unterdrücken, damit keine Meldung wegen unvollständiger Daten stillschweigend übergangen wird; Abweichung protokollieren (Capability `security-and-privacy`, SEC-F-060) |

## Bewusst nicht übernommenes Altverhalten

- 12-Stunden-Datumsparsing ohne AM/PM-Angabe im Rohformat — Grund: führt zu falscher Zeitanzeige ab 13:00 Uhr, siehe Requirement „24-Stunden-Zeitformat für Zeitstempel".
- Anpinnen/Ablösen ausschließlich über langes Drücken erreichbar — Grund: nicht auffindbar ohne Vorwissen, siehe Capability `ux-and-theming` (UX-F-090).
- Suche ohne Normalisierung der Groß-/Kleinschreibung — Grund: liefert je nach Schreibweise unvollständige Treffer, siehe Requirement „Suche ohne Beachtung von Groß-/Kleinschreibung".
- Suche nur über ein ein-/ausblendbares Lupensymbol ohne sichtbaren Hinweis, dass sie gerade aktiv ist (Flutter-Alt-App, L-040) — Grund: eine vergessene Sucheingrenzung wirkt wie ein leerer Meldungsbestand, siehe Requirement „Kennzeichnung aktiver Einschränkung mit Rücksetzweg".

## Offene Fragen

- Vorlaufzeit für Event-Erinnerungen: 24 Stunden vor Event-Beginn (Arbeitsziel, fester Wert; je-Nutzerin-Einstellbarkeit als mögliche spätere Erweiterung, nicht im ersten Umfang).
- Technische Machbarkeit des Imports von `aktuelles-ni` (strukturierter Feed vs. Scraping) — Capability `integrations`, INT-010.
- Visuelle Unterscheidung der drei Klassifizierungen: Arbeitsziel Icon plus Textlabel je Klassifizierung (nicht Farbe allein, konsistent mit Capability `ux-and-theming`, UX-F-070) — konkrete Icon-/Farbwahl bei Bildschirmgestaltung.
- Wie viele Seiten beim Nachladen höchstens abgerufen werden, bevor die Liste endet — bei Umsetzung anhand des tatsächlichen Bestands festzulegen.
- Konkrete Ausdrucks-Engine und ReDoS-Schutz für den erweiterten Suchmodus: Auswertung abseits des UI-Strangs mit Zeitscheiben oder eine Engine mit garantiert linearer Laufzeit (RE2-artig). Bei Umsetzung durch die technische Leitung festzulegen.
- Ob der erweiterte Suchmodus dieselbe Ausdruckssyntax auch für Regeln der Positiv- und Sperrliste anbietet oder ob Regeln auf Teilzeichenketten-Stichwörter beschränkt bleiben — abhängig davon, wie tragfähig der ReDoS-Schutz im Hintergrund-Zustellpfad ist.
- Genauer Satz der Filtermerkmale: Klassifizierung, Verteiler und Zeitraum sind gesetzt; ob zusätzlich ein Filter „nur angepinnte" sinnvoll ist, entscheidet sich bei der Bildschirmgestaltung.
- Wo die Benachrichtigungsregeln bedient werden — im News-Bereich, in Capability `settings` oder an beiden Stellen; Arbeitsziel ist der News-Bereich mit einem Einstiegspunkt aus den Einstellungen.
- Wert der Laufzeitobergrenze (1 Sekunde) ist ein Arbeitsziel, an einem frühen Prototyp auf einem Gerät der Mindestplattform (Capability `non-functional` Abschnitt 2) zu validieren.
