---
id: legacy-inventory
titel: Funktionsinventar der Alt-Apps
status: accepted
version: 1.2.0
owner: FSR FB4
last_reviewed: 2026-09-05
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib
  - alte apps/android-fb4/FB4/fB4/src/main
related:
  - vision.md
  - glossary.md
  - ../../openspec/specs/integrations/spec.md
  - ../open-questions.md
---

# Funktionsinventar der Alt-Apps

## 1. Zweck und Vorgehen

Dieses Inventar erfasst den Funktionsumfang der beiden abzulösenden Apps auf Ebene einzelner Nutzerfunktionen, nicht auf Ebene von Bildschirmen. Für beide liegt inzwischen der vollständige Quellcode vor: die iOS/Flutter-App unter `alte apps/fb4_app-main/fb4_app-main/lib/` (rund 6.700 Zeilen Dart, Abschnitt 2, Mängel in Abschnitt 3) und die Android-App unter `alte apps/android-fb4/` (128 Java-Dateien, Version 1.4.11, Abschnitt 4). Jede Zeile trägt eine Fundstelle, weil Code-Verhalten und beabsichtigtes Verhalten nicht immer zusammenfallen (siehe `../README.md` Abschnitt 6). Dieses Dokument ist die Referenz für die Prüfung, ob jede Bestandsfunktion in einer Feature-Spec abgedeckt oder bewusst verworfen wurde (Abschnitt 5).

**Änderung vom 2026-08-25.** Der Android-Quellcode wurde vom FSR FB4 nachgereicht. Bis dahin führte Abschnitt 4 ein „Lückenregister" mit acht offenen Fragen, das den Funktionsumfang der Android-App aus der Play-Store-Beschreibung erschloss. Diese Erschließung war in wesentlichen Punkten unvollständig — sie übersah unter anderem die Raumsuche, die daraufhin im gesamten Spec-Bestand fälschlich als Neuentwicklung ohne Vorbild geführt wurde. Abschnitt 4 ist deshalb vollständig durch ein echtes Funktionsinventar ersetzt; Abschnitt 5 unterscheidet nun nach Herkunft aus beiden Apps.

## 2. Funktionsinventar iOS/Flutter

Pfade sind relativ ab `lib/` angegeben. Endpunktdetails der genutzten Schnittstellen stehen ausschließlich in `platform/integrations.md` und werden hier nicht wiederholt.

Die Spalte `Android` trägt in jeder Zeile weiterhin `unbekannt`. Das ist seit dem Vorliegen des Android-Quellcodes (2026-08-25) bewusst so belassen: Abschnitt 4 führt inzwischen ein eigenständiges Funktionsinventar der Android-App mit eigenen `AND-###`-Nummern, statt sie zeilenweise gegen die iOS-Funktionen zu spiegeln. Eine Gegenüberstellung Zeile für Zeile wäre irreführend, weil beide Apps unterschiedliche Zuschnitte haben — die Android-App fasst manches zusammen, was hier getrennt steht, und enthält Funktionen ohne iOS-Entsprechung. Wo eine Zuordnung besteht, nennt sie die Spalte „Flutter" in Abschnitt 4.2.

| Nr | Bereich | Funktion | Quelle | Zielspec | Android |
|---|---|---|---|---|---|
| L-001 | App-Rahmen | Bottom-Navigation mit fünf Tabs (Stundenplan, News, Mensa, Semesterticket, Mehr). | main_page.dart | SHELL | unbekannt |
| L-002 | App-Rahmen | Zustimmungs-Gate zur Datenschutzerklärung beim ersten Start (in der Umsetzung wirkungslos, siehe M-001). | main_page.dart:14-16; main_view_model.dart:8-22 | SHELL | unbekannt |
| L-003 | App-Rahmen | Automatische Wahl von Hell-/Dunkeldesign anhand der Systemeinstellung beim App-Start. | main.dart:111-124 | SHELL | unbekannt |
| L-004 | App-Rahmen | Schnellaktion (Home-Bildschirm, Haptic Touch) „Ticket anzeigen" springt direkt in den Semesterticket-Tab. | utils/plugins/quick_actions_manager.dart | SHELL | unbekannt |
| L-005 | App-Rahmen | Erzwungene Portraitausrichtung, Querformat gesperrt. | main.dart:113-115 | SHELL | unbekannt |
| L-006 | Stundenplan | Wochentagsnavigation Mo–Fr über Segmented Control, synchronisiert mit horizontal wischbarem Seitenview. | areas/schedule/screens/schedule_overview_page.dart:27-119 | SCHED | unbekannt |
| L-007 | Stundenplan | Automatischer Sprung zum aktuellen Wochentag beim Laden, sofern Einstellung aktiv. | areas/schedule/viewmodels/schedule_overview_viewmodel.dart:124-135 | SCHED | unbekannt |
| L-008 | Stundenplan | Leerzustand mit Hinweistext, solange kein Stundenplan angelegt ist. | areas/schedule/screens/schedule_overview_page.dart:124-132 | SCHED | unbekannt |
| L-009 | Stundenplan | Ladezustand mit Aktivitätsindikator während des Datenbankabrufs. | areas/schedule/screens/schedule_overview_page.dart:120-124 | SCHED | unbekannt |
| L-010 | Stundenplan | Hinzufügen-Menü als Aktionsblatt: Wahl zwischen „Offizieller Stundenplan" und „Eigener Eintrag". | areas/schedule/screens/schedule_overview_page.dart:198-249 | SCHED | unbekannt |
| L-011 | Stundenplan | Auswahldialog Studiengang aus der geladenen FBWS-Liste. | areas/schedule/screens/add_official_schedule_page.dart:181-191 | SCHED | unbekannt |
| L-012 | Stundenplan | Auswahldialog Semester aus den Fachsemestern des gewählten Studiengangs, erst nach Studiengangswahl aktivierbar. | areas/schedule/screens/add_official_schedule_page.dart:196-238 | SCHED | unbekannt |
| L-013 | Stundenplan | Fehlerdialog, wenn Semester ohne vorherige Studiengangswahl gewählt werden soll. | areas/schedule/screens/add_official_schedule_page.dart:214-237 | SCHED | unbekannt |
| L-014 | Stundenplan | Optionale Eingabe der Gruppenkennung mit Live-Validierung (genau ein Großbuchstabe, mindestens eine Ziffer). | areas/schedule/screens/add_official_schedule_page.dart:252-270 | SCHED | unbekannt |
| L-015 | Stundenplan | Fehlerdialog beim Speichern ohne vollständige Pflichtfelder (Studiengang/Semester). | areas/schedule/screens/add_official_schedule_page.dart:113-137 | SCHED | unbekannt |
| L-016 | Stundenplan | Abgleich der Gruppenkennung gegen das `studentSet` jedes geladenen Termins (Einzelwert oder Bereichsnotation) zur Markierung der Gruppenzugehörigkeit — Sollverhalten in `features/schedule/spec.md`, da der Alt-Code hier zwei bestätigte Fehler enthält (siehe M-016). | areas/schedule/viewmodels/schedule_overview_viewmodel.dart:209-252 | SCHED | unbekannt |
| L-017 | Stundenplan | Termine außerhalb der eigenen Gruppe werden abgeblendet dargestellt statt ausgeblendet. | areas/schedule/widgets/schedule_card.dart:50-54 | SCHED | unbekannt |
| L-018 | Stundenplan | Nach Laden vom Server: Editiermodus mit Checkbox je Termin zur Auswahl der zu übernehmenden Termine. | areas/schedule/viewmodels/schedule_overview_viewmodel.dart:58-90; areas/schedule/widgets/schedule_card.dart | SCHED | unbekannt |
| L-019 | Stundenplan | Übernahme ausgewählter Termine per Häkchen-Symbol in der Navigationsleiste; vorhandene eigene Einträge bleiben erhalten. | areas/schedule/screens/schedule_overview_page.dart:181-194; areas/schedule/viewmodels/schedule_overview_viewmodel.dart:169-186 | SCHED | unbekannt |
| L-020 | Stundenplan | Abbruch des Editiermodus per X-Symbol, verwirft die geladene Auswahl und lädt den gespeicherten Bestand neu. | areas/schedule/screens/schedule_overview_page.dart:159-173 | SCHED | unbekannt |
| L-021 | Stundenplan | Hinzufügen „Eigener Eintrag": Formular für Kursname, Wochentag, Start-/Endzeit, Raum, Lehrenden, Kürzel. | areas/schedule/screens/add_custom_schedule_item_page.dart | SCHED | unbekannt |
| L-022 | Stundenplan | Wochentagsauswahl über eigenen Rad-Picker. | areas/schedule/screens/add_custom_schedule_item_page.dart:283-329 | SCHED | unbekannt |
| L-023 | Stundenplan | Start-/Endzeitauswahl über eigenen Zeit-Picker im 24-Stunden-Format. | areas/schedule/screens/add_custom_schedule_item_page.dart:237-281 | SCHED | unbekannt |
| L-024 | Stundenplan | Pflichtfeldvalidierung aller Felder eines eigenen Eintrags vor dem Speichern. | areas/schedule/viewmodels/add_custom_schedule_item_page_viewmodel.dart:27-35 | SCHED | unbekannt |
| L-025 | Stundenplan | Eigene Einträge erhalten automatisch die Veranstaltungsart „C". | areas/schedule/viewmodels/add_custom_schedule_item_page_viewmodel.dart:17 | SCHED | unbekannt |
| L-026 | Stundenplan | Termin per langem Drücken öffnet Kontextmenü mit „Farbe ändern" / „Eintrag entfernen" (nur außerhalb des Editiermodus). | areas/schedule/widgets/schedule_list.dart:39-44 | SCHED | unbekannt |
| L-027 | Stundenplan | Farbwahl je Termin aus 22-Farben-Palette. | areas/schedule/widgets/schedule_list.dart:59-136 | SCHED | unbekannt |
| L-028 | Stundenplan | Löschen eines einzelnen Termins über das Kontextmenü, ohne weitere Sicherheitsabfrage. | areas/schedule/widgets/schedule_list.dart:139-149 | SCHED | unbekannt |
| L-029 | Stundenplan | Termine je Wochentag aufsteigend nach Startzeit sortiert. | areas/schedule/models/schedule_item.dart:80-82; areas/schedule/viewmodels/schedule_overview_viewmodel.dart:85-86,121 | SCHED | unbekannt |
| L-030 | Stundenplan | Lokale Persistenz aller Termine (eigene und übernommene) als Datensatz je Wochentag. | areas/schedule/viewmodels/schedule_overview_viewmodel.dart:154-167 | SCHED | unbekannt |
| L-031 | Stundenplan | Termin-Kachel zeigt Veranstaltungsart-Kürzel, Uhrzeit, Kursname, Gruppenkennung, Lehrenden (Name + Kürzel) und Raum. | areas/schedule/widgets/schedule_card.dart:69-121 | SCHED | unbekannt |
| L-032 | Stundenplan | Bei unerwarteter Anzahl gespeicherter Wochentags-Datensätze: vollständiges Neuanlegen der lokalen Datenbank ohne Rückfrage (siehe M-008). | areas/schedule/viewmodels/schedule_overview_viewmodel.dart:136-147 | SCHED | unbekannt |
| L-033 | News | Liste aller News-Meldungen in Server-Reihenfolge. | areas/news/screens/news_overview_page.dart; areas/news/repositories/news_repository.dart | NEWS | unbekannt |
| L-034 | News | Pull-to-Refresh zum manuellen Neuladen der Liste. | areas/news/screens/news_overview_page.dart:80-89 | NEWS | unbekannt |
| L-035 | News | Ladezustand mit Aktivitätsindikator beim Erstladen. | areas/news/screens/news_overview_page.dart:47-49 | NEWS | unbekannt |
| L-036 | News | Fehlerzustand mit „Nochmal versuchen"-Button bei fehlgeschlagenem Abruf. | areas/news/screens/news_overview_page.dart:145-166 | NEWS | unbekannt |
| L-037 | News | Gesonderte Fehlermeldung bei fehlender Netzwerkverbindung gegenüber sonstigen Fehlern. | areas/news/viewmodels/news_overview_viewmodel.dart:38-46 | NEWS | unbekannt |
| L-038 | News | Detailansicht per Antippen als modales Popup mit vollständigem Text und Verteiler. | areas/news/widgets/news_card.dart:16-90 | NEWS | unbekannt |
| L-039 | News | Listenkarte mit Titel (max. 3 Zeilen), Text (max. 3 Zeilen, abgeschnitten), Verteiler und Datum. | areas/news/widgets/news_card.dart:98-135 | NEWS | unbekannt |
| L-040 | News | Volltextsuche über Titel und Text, ein-/ausblendbar über Lupe-/X-Symbol in der Navigationsleiste. | areas/news/screens/news_overview_page.dart:25-37; areas/news/viewmodels/news_overview_viewmodel.dart:52-56 | NEWS | unbekannt |
| L-041 | News | Suche als reine Teilzeichenketten-Suche ohne Normalisierung der Groß-/Kleinschreibung, rein clientseitig auf dem bereits geladenen Bestand (siehe M-017). | areas/news/viewmodels/news_overview_viewmodel.dart:95-101 | NEWS | unbekannt |
| L-042 | News | Anpinnen einzelner Meldungen per langem Drücken. | areas/news/screens/news_overview_page.dart:198-217; areas/news/viewmodels/news_overview_viewmodel.dart:58-62 | NEWS | unbekannt |
| L-043 | News | Angepinnte Meldungen erscheinen dauerhaft in eigenem Abschnitt oberhalb der übrigen Liste, lokal gespeichert über App-Neustarts hinweg. | areas/news/viewmodels/news_overview_viewmodel.dart:70-93 | NEWS | unbekannt |
| L-044 | News | Ablösen (Entfernen) angepinnter Meldungen per langem Drücken. | areas/news/screens/news_overview_page.dart:219-243; areas/news/viewmodels/news_overview_viewmodel.dart:64-68 | NEWS | unbekannt |
| L-045 | News | Entfernen von HTML-Tags und Ersetzen bekannter Sonderzeichen beim Einlesen des Meldungstexts. | areas/news/models/news_item.dart:16-23 | NEWS | unbekannt |
| L-046 | Mensa | Kachel je ausgewählter Mensa mit Namen, Hauptspeisen und Beilagen getrennt dargestellt. | areas/canteen/screens/canteen_overview_page.dart:141-190 | MENSA | unbekannt |
| L-047 | Mensa | Datumsnavigation per Vor-/Zurück-Pfeil im horizontalen Datumsbalken. | utils/ui/widgets/cupertino_horizontal_date_picker.dart | MENSA | unbekannt |
| L-048 | Mensa | Datumsnavigation zusätzlich per horizontalem Wischen über 14 Tage (7 Tage zurück bis 7 Tage voraus, zentriert auf heute). | areas/canteen/screens/canteen_overview_page.dart:39-47; areas/canteen/viewmodels/canteen_overview_viewmodel.dart:21,40-56,74-94 | MENSA | unbekannt |
| L-049 | Mensa | Leerzustand „Keine Daten vorhanden" je Mensa, wenn für den Tag kein Speiseplan verfügbar ist. | areas/canteen/screens/canteen_overview_page.dart:111-138 | MENSA | unbekannt |
| L-050 | Mensa | App-weiter Leerzustand, solange keine Mensen ausgewählt sind, mit Verweis auf die Einstellungen. | areas/canteen/screens/canteen_overview_page.dart:87-93 | MENSA | unbekannt |
| L-051 | Mensa | Detailansicht je Gericht per Antippen: Name, Kategorie, alle verfügbaren Preise, Zusatzstoff-/Allergenhinweise. | areas/canteen/screens/canteen_overview_page.dart:222-271 | MENSA | unbekannt |
| L-052 | Mensa | Kategorie-Icon je Gerichtstyp (Tagesgericht, Menü 1, Menü 2, Vegetarisches Menü; sonstige ohne Icon). | areas/canteen/screens/canteen_overview_page.dart:341-354 | MENSA | unbekannt |
| L-053 | Mensa | In-Memory-Cache der geladenen Speisepläne je Mensa und Datum innerhalb der laufenden Sitzung. | areas/canteen/repositories/meals_repository.dart:9-16 | MENSA | unbekannt |
| L-054 | Semesterticket | Import des Tickets als PDF über die System-Dateiauswahl. | areas/ticket/screens/ticket_viewer_page.dart:44-53 | TICKET | unbekannt |
| L-055 | Semesterticket | Extraktion eines Bildausschnitts aus der ersten PDF-Seite mit fest programmierten Pixelwerten (siehe M-010). | areas/ticket/viewmodels/ticket_overview_viewmodel.dart:59-95 | TICKET | unbekannt |
| L-056 | Semesterticket | Speicherung des extrahierten Bilds im App-Dokumentenverzeichnis, unverschlüsselt (siehe M-009). | areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82-94 | TICKET | unbekannt |
| L-057 | Semesterticket | Automatisches Laden und Anzeigen des gespeicherten Tickets beim Öffnen des Tabs, sofern vorhanden. | areas/ticket/viewmodels/ticket_overview_viewmodel.dart:22-37 | TICKET | unbekannt |
| L-058 | Semesterticket | Doppel-Tap zum Ein-/Auszoomen auf die Antipp-Position (Zoomfaktor 2.2). | areas/ticket/screens/ticket_viewer_page.dart:91-104 | TICKET | unbekannt |
| L-059 | Semesterticket | Freies Zoomen und Verschieben per Zwei-Finger-Geste. | areas/ticket/screens/ticket_viewer_page.dart:77-79 | TICKET | unbekannt |
| L-060 | Semesterticket | Leerzustand mit Hinweistext und „Ticket wählen"-Button, wenn noch kein Ticket vorhanden ist. | areas/ticket/screens/ticket_viewer_page.dart:24-58 | TICKET | unbekannt |
| L-061 | Semesterticket | Ladezustand mit Aktivitätsindikator während der Bildextraktion. | areas/ticket/screens/ticket_viewer_page.dart:64-68 | TICKET | unbekannt |
| L-062 | Semesterticket | Automatische Erhöhung der Displayhelligkeit beim Wechsel in den Ticket-Tab, Wiederherstellung beim Verlassen, sofern Einstellung aktiv. | utils/helpers/app_state_oberserver.dart:14-35 | TICKET | unbekannt |
| L-063 | Semesterticket | Erhöhung der Displayhelligkeit bei Rückkehr aus dem Hintergrund, wenn der Ticket-Tab aktiv ist. | utils/helpers/app_state_oberserver.dart:37-55 | TICKET | unbekannt |
| L-064 | Noten | Zugang über „Mehr" > „Notenübersicht"; führt bei fehlenden gespeicherten Zugangsdaten und leerem Notencache zum Login, sonst direkt zur Notenliste. | areas/more/screens/more_list_page.dart:82-105 | NOTEN | unbekannt |
| L-065 | Noten | Login-Formular mit Benutzername, maskiertem Passwort und Schalter „Passwort speichern". | areas/ods/views/login_page.dart | NOTEN | unbekannt |
| L-066 | Noten | Hinweistext im Login, dass Zugangsdaten verschlüsselt in der Keychain gespeichert werden. | areas/ods/views/login_page.dart:106-127 | NOTEN | unbekannt |
| L-067 | Noten | Fehlerdialog bei fehlgeschlagenem Login (falsche Zugangsdaten und Verbindungsfehler werden nicht unterschieden). | areas/ods/views/login_page.dart:29-35; areas/ods/viewmodels/login_page_viewmodel.dart:48-53 | NOTEN | unbekannt |
| L-068 | Noten | Optionales Speichern der Zugangsdaten im Secure Storage bei aktiviertem Schalter. | areas/ods/viewmodels/login_page_viewmodel.dart:34-39 | NOTEN | unbekannt |
| L-069 | Noten | Automatischer erneuter Login mit gespeicherten Zugangsdaten bei fehlendem oder ungültigem Sitzungstoken, ohne erneute Nutzerinteraktion (siehe M-004). | areas/ods/repositories/ods_repository.dart:14-19,69-78 | NOTEN | unbekannt |
| L-070 | Noten | Notenliste gruppiert nach Fachsemester, je Prüfung aufklappbar (Prüfungsart, Versuchszahl, ECTS, Status, Anmerkungen). | areas/ods/views/grade_overview_page.dart | NOTEN | unbekannt |
| L-071 | Noten | Nur Prüfungen mit eingetragener Note werden angezeigt; Zwischenüberschriften-Zeilen werden übersprungen. | areas/ods/repositories/ods_repository.dart:41-49 | NOTEN | unbekannt |
| L-072 | Noten | Ladezustand mit Aktivitätsindikator während des Abrufs. | areas/ods/views/grade_overview_page.dart:19,102-104 | NOTEN | unbekannt |
| L-073 | Einstellungen | „Links / Downloads"-Seite mit zehn fest hinterlegten externen Links (u. a. Ilias, ODS, SmartAssign, Prüfungsplan, Lageplan, Zeitplan). | areas/more/screens/links_downloads_page.dart | SET | unbekannt |
| L-074 | Einstellungen | „Feedback geben" öffnet den Mail-Client mit vorausgefüllter Empfängeradresse. | areas/more/screens/more_list_page.dart:47-52 | SET | unbekannt |
| L-075 | Einstellungen | „Über"-Dialog mit FSR-Info und Versionsangabe (fest codierter Text, siehe M-006). | areas/more/screens/more_list_page.dart:111-184 | SET | unbekannt |
| L-076 | Einstellungen | Lizenzseite: Liste aller Open-Source-Lizenzen (Name, Version, Kurzbeschreibung) mit Detailansicht je Lizenztext. | areas/more/screens/licenses_page.dart; areas/more/viewmodels/licenses_page_viewmodel.dart; oss_licenses.dart | SET | unbekannt |
| L-077 | Einstellungen | Datenschutzerklärung als Markdown-Ansicht, aus Bundle-Asset geladen, jederzeit über das Menü aufrufbar (ohne Zustimmungszwang). | areas/more/screens/privacy_page.dart; areas/more/viewmodels/privacy_page_viewmodel.dart | SET | unbekannt |
| L-078 | Einstellungen | Schalter „Aktuellen Wochentag zuerst zeigen" (steuert automatischen Sprung im Stundenplan). | areas/more/screens/settings_page.dart:25-36 | SCHED | unbekannt |
| L-079 | Einstellungen | Schalter „Helligkeit erhöhen" (aktiviert automatische Displayhelligkeit im Ticket-Tab). | areas/more/screens/settings_page.dart:50-61 | TICKET | unbekannt |
| L-080 | Einstellungen | Button „Stundenplan löschen" mit Bestätigungsdialog. | areas/more/screens/settings_page.dart:37-48; areas/more/viewmodels/settings_page_view_model.dart:58-63 | SCHED | unbekannt |
| L-081 | Einstellungen | Button „Ticket löschen" mit Bestätigungsdialog. | areas/more/screens/settings_page.dart:62-72 | TICKET | unbekannt |
| L-082 | Einstellungen | Button „Mensen auswählen" öffnet die Mensa-Auswahlseite. | areas/more/screens/settings_page.dart:74-86 | MENSA | unbekannt |
| L-083 | Einstellungen | Auswahlseite Mensen: Umschalter je Mensa aus fest hinterlegter Liste von zwölf Mensen (TU/FH Dortmund). | areas/more/screens/select_canteens_page.dart; areas/canteen/repositories/canteens_repository.dart | MENSA | unbekannt |
| L-084 | Einstellungen | Button „Anmeldedaten löschen" (ODS) mit Erfolgsmeldung. | areas/more/screens/settings_page.dart:87-96; areas/more/viewmodels/settings_page_view_model.dart:65-70 | NOTEN | unbekannt |
| L-085 | Einstellungen | Schalter „Benachrichtigungen bei News" (FCM-Opt-in/-out, siehe INT-005). | areas/more/screens/settings_page.dart:98-107; utils/plugins/push_notification_manager.dart | SET | unbekannt |

## 3. Bekannte Mängel der Alt-App

Alle vorgegebenen Befunde wurden am Quellcode nachvollzogen und bestätigt; M-004, M-007, M-013 und M-016 sind unten mit einer Präzisierung versehen. M-013 bis M-017 sind zusätzliche Befunde aus der Durcharbeitung.

| Nr | Befund | Quelle | Konsequenz für die Neuentwicklung |
|---|---|---|---|
| M-001 | Zustimmungs-Gate zur Datenschutzerklärung ist wirkungslos: `shouldShowPrivacyPolicy` wird korrekt ermittelt, aber unmittelbar danach fest auf `false` gesetzt. | main_view_model.dart:8-22 | Zustimmungs-Zwang muss aktiv durchgesetzt und getestet werden, nicht nur berechnet. |
| M-002 | Mensa-Endpunkt wird unverschlüsselt über `http://` aufgerufen. | areas/canteen/repositories/meals_repository.dart:21 | `https://` erzwingen (bereits als Risiko in INT-004 geführt). |
| M-003 | Datum im News-Feed wird mit 12-Stunden-Muster `hh` statt `HH` geparst; Zeiten ab 13 Uhr werden falsch interpretiert. | areas/news/models/news_item.dart:26 | 24-Stunden-Muster `HH` verwenden (bereits in INT-003 dokumentiert). |
| M-004 | ODS-Zugangsdaten werden geräteseitig gespeichert und bei Tokenablauf ohne erneute Nutzerinteraktion automatisch erneut gesendet. | areas/ods/repositories/ods_repository.dart:14-19; areas/ods/viewmodels/login_page_viewmodel.dart:34-39 | Kein Passwort-Replay übernehmen; SSO oder offizielle Schnittstelle statt Zugangsdatenspeicherung (siehe INT-006). Präzisierung siehe unten. |
| M-005 | Interne IP-Adresse `10.11.15.121` ist im Anmeldeformular fest verdrahtet. | areas/ods/services/ods_authentication_service.dart:11 | Entfällt vollständig mit Ablösung durch HISinOne (INT-006). |
| M-006 | Versionsnummer im Über-Dialog ist fest einprogrammiert (`"Version: 1.2.0"`) statt aus dem Build gelesen. | areas/more/screens/more_list_page.dart:157 | Versionsangabe aus dem Build-System lesen (z. B. package_info). |
| M-007 | Fehler beim Lesen von Einstellungen werden stillschweigend verschluckt: `try`-Block mit leerem `finally`, ohne `catch`. | areas/canteen/viewmodels/canteen_overview_viewmodel.dart:59-66; areas/more/viewmodels/select_canteens_page_viewmodel.dart:18-25 | Parsing-Fehler behandeln statt stillschweigend zu verwerfen. Tritt zweifach auf, Präzisierung siehe unten. |
| M-008 | Bei unerwarteter Anzahl gespeicherter Stundenplan-Einträge wird der gesamte Bestand ohne Rückfrage gelöscht und neu angelegt. | areas/schedule/viewmodels/schedule_overview_viewmodel.dart:136-147 | Dateninkonsistenzen erkennen, ohne automatisch Nutzerdaten zu vernichten. |
| M-009 | Semesterticket wird unverschlüsselt im Dateisystem der App abgelegt. | areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82-94 | Sensible Dokumente verschlüsselt bzw. geschützt ablegen. |
| M-010 | Bildausschnitt des Semestertickets ist mit festen Pixelwerten an ein bestimmtes PDF-Layout gebunden. | areas/ticket/viewmodels/ticket_overview_viewmodel.dart:66-73 | Layoutunabhängig arbeiten oder Layoutänderungen erkennen. |
| M-011 | Farbthema wird nur beim App-Start anhand der Systemeinstellung gewählt und folgt keinem Wechsel zur Laufzeit. | main.dart:111-124 | Auf Laufzeit-Änderungen der Systemeinstellung reagieren. |
| M-012 | Wesentliche Aktionen sind allein über langes Drücken erreichbar und ohne Vorwissen nicht auffindbar (Stundenplan: Farbe, Löschen; News: Anpinnen). | areas/schedule/widgets/schedule_list.dart:39-44; areas/news/screens/news_overview_page.dart:198-217 | Zusätzlich sichtbare Bedienelemente anbieten. |
| M-013 | Kommentar verweist auf absichtlich in Kauf genommene TLS-Zertifikatsprobleme der FH Dortmund; im vorliegenden Dart-Code ist jedoch keine Override-Logik dafür auffindbar. | areas/news/repositories/news_repository.dart:7 | Klären, ob eine Ausnahme außerhalb des Dart-Codes besteht; reguläre TLS-Prüfung ohne Ausnahme sicherstellen. Präzisierung siehe unten. |
| M-014 | FCM-Notification-Tap-Handling ist vorbereitet (`onRoute`-Callback in main.dart), der zugehörige Nachrichten-Handler ist auskommentiert und wird nie aufgerufen. | utils/plugins/push_notification_manager.dart:39-50 | Deep-Linking bei Push-Empfang neu konzipieren, nicht aus dem Altcode übernehmen. |
| M-015 | Feld `order` im Mensa-Modell ist vorhanden, wird aber weder in der Auswahlliste noch in der Anzeige zur Sortierung verwendet. | areas/canteen/models/canteen.dart:3; areas/more/screens/select_canteens_page.dart | Keine ungeprüfte Sortierlogik aus dem Altcode ableiten; Darstellungsreihenfolge neu festlegen. |
| M-016 | Zwei unabhängige, bestätigte Fehler in der Gruppenzuordnung: (a) redundante Bedingung `info.groupLetter == "" \|\| info.groupLetter == ""` prüft zweimal denselben Ausdruck; (b) beim Einzelwert-`studentSet` wird `info.groupNumber` (Ziffernteil der Gruppenkennung, z. B. `8`) mit dem ersten Zeichen von `studentSet` (ein Buchstabe) verglichen — ein Vergleich, der bei gültigen Daten nie zutreffen kann. | areas/schedule/viewmodels/schedule_overview_viewmodel.dart:210,216 | Nicht unreflektiert übernehmen. Das beabsichtigte Verhalten ist in `features/schedule/spec.md` als Sollvorgabe mit Beispieltabelle spezifiziert, nicht aus diesem Code abgeleitet. Präzisierung siehe unten. |
| M-017 | Suche im News-Bereich filtert ausschließlich den bereits geladenen Bestand (kein serverseitiger Suchendpunkt) und normalisiert Groß-/Kleinschreibung nicht. | areas/news/viewmodels/news_overview_viewmodel.dart:95-101 | Suchverhalten (client-/serverseitig, Normalisierung) für die Neuentwicklung bewusst festlegen. |

### Erläuterungen

**M-004** — Die Speicherung erfolgt über `FlutterSecureStorage` (iOS Keychain, geräteseitig verschlüsselt) und liegt damit nicht unverschlüsselt auf der Festplatte. Die Werte sind jedoch nicht gehasht, sondern reversibel abgelegt: Bei Zugriff auf das entsperrte Gerät oder die Keychain ist das Passwort im Klartext auslesbar. Zusätzlich sendet die App das Passwort bei jedem Ablauf des Sitzungstokens automatisch erneut, ohne dass die Nutzerin das bemerkt oder erneut bestätigen muss.

**M-007** — Dasselbe Muster (leeres `finally`, kein `catch`) tritt an zwei unabhängigen Stellen auf, die beide dieselbe Einstellung (`settingsEnabledCanteenIds`) aus dem lokalen Einstellungsspeicher lesen.

**M-013** — Der Kommentar im Quellcode besagt sinngemäß, dass die TLS-Zertifikate der FH Dortmund als unzuverlässig eingeschätzt werden. Eine Suche nach `HttpOverrides`, `badCertificateCallback` oder vergleichbaren Mechanismen im Dart-Code blieb ergebnislos; die Aussage des Kommentars lässt sich aus dem vorliegenden Code nicht verifizieren. Für die Neuentwicklung gilt unabhängig davon: Die Zertifikatsprüfung wird unter keinen Umständen abgeschaltet (siehe `platform/integrations.md`, INT-003).

**M-016** — Beide Teilfehler sind gravierender als ein bloßer Schönheitsfehler: Fehler (b) bewirkt, dass bei Terminen mit Einzelwert-`studentSet` (kein Bereich) praktisch jeder Termin fälschlich als „nicht eigene Gruppe" markiert wird, da Ziffer und Buchstabe nie übereinstimmen können. `features/schedule/spec.md` spezifiziert deshalb das beabsichtigte Verhalten eigenständig, mit einer Beispieltabelle, statt den Alt-Code als Vorlage zu nehmen.

## 4. Funktionsinventar Android

**Stand 2026-08-25: Der Quellcode liegt vor.** Bis zu diesem Datum führte dieser Abschnitt ein „Lückenregister" mit acht offenen Fragen (A-001 bis A-008), weil das Verhalten der Android-App nur aus der Play-Store-Beschreibung erschlossen werden konnte. Der FSR FB4 hat den Quellcode am 2026-08-25 bereitgestellt (`alte apps/android-fb4/`, Version 1.4.11, `versionCode` 58, 128 Java-Dateien). Die Vermutungen sind damit durch Befunde ersetzt.

**Einordnung: Diese App ist der zu übertreffende Stand** (Vorgabe FSR FB4, 2026-08-25). Sie ist nicht die schwächere der beiden Alt-Apps, sondern die stärkere — sie enthält mehrere Funktionen, die die Flutter-App nicht hat und die der Spec-Bestand bis zu diesem Datum als Neuentwicklung führte. Wo eine Anforderung der Neuentwicklung hinter dieser App zurückbleibt, ist das eine bewusste Entscheidung mit Begründung, kein Versehen.

### 4.1 Technischer Rahmen

| Merkmal | Wert |
|---|---|
| Paket, Version | `de.fsrfb4.fb4`, 1.4.11 (`versionCode` 58) |
| Plattformfenster | `minSdkVersion` 26 (Android 8), `targetSdkVersion` 35, Java 17 |
| Bausteine | Hilt (Abhängigkeitsverwaltung), Room und Realm (lokale Datenhaltung, Migration von Realm nach Room vorhanden), Retrofit/OkHttp, Jsoup, WorkManager, Firebase (Messaging, Crashlytics, Analytics) |
| Berechtigungen | `INTERNET`, `ACCESS_NETWORK_STATE`, `READ_CALENDAR`, `WRITE_CALENDAR`, `POST_NOTIFICATIONS` |
| Sprachen | Zweisprachig: `res/values` (Englisch) und `res/values-de` (Deutsch) |
| Erscheinungsbild | `res/values-night` vorhanden, also Dunkelmodus unterstützt |
| Zertifikate | Bündelt `fh.cer` und `dst.cer` als zusätzliche Trust-Anchor (`util/AdditionalKeyStoresSSLSocketFactory.java`) |

### 4.2 Funktionsinventar

Pfade relativ ab `alte apps/android-fb4/FB4/fB4/src/main/`. Die Spalte „Flutter" hält fest, ob die Funktion dort eine Entsprechung hat (L-Nummer) oder nicht. Endpunktdetails stehen ausschließlich in `../../openspec/specs/integrations/spec.md`.

| Nr | Bereich | Funktion | Quelle | Zielspec | Flutter |
|---|---|---|---|---|---|
| AND-001 | App-Rahmen | Startbildschirm mit Willkommensablauf beim Erststart, einschließlich Push-Anmeldung | `java/…/activities/WelcomePageActivity.java` | SHELL | teilweise, L-002 |
| AND-002 | App-Rahmen | Splash-Bildschirm mit Vorabladen der Stammdaten | `java/…/SplashActivity.java` | SHELL | – |
| AND-003 | App-Rahmen | Serverseitige Hinweise an die App, abhängig von Sprache und App-Version | `java/…/retrofit/ServerMessageApi.java`, `model/ServerMessage.java` | SHELL | – |
| AND-004 | App-Rahmen | Ferngepflegte Stammdaten mit lokalem Zwischenspeicher und Hintergrund-Aktualisierung | `java/…/service/DataService.java`, `worker/DataUpdateWorker.java` | ADMIN, API | – |
| AND-005 | App-Rahmen | Mitgelieferte Rückfalldaten (`canteens.json`, `rooms.json`), falls die Fernkonfiguration fehlt | `assets/canteens.json`, `assets/rooms.json` | MENSA, RAUM | – |
| AND-006 | App-Rahmen | Zweisprachige Oberfläche Deutsch/Englisch | `res/values`, `res/values-de` | NFR | – |
| AND-007 | App-Rahmen | Dunkelmodus über Systemressourcen | `res/values-night` | UX | teilweise, L-003 |
| AND-008 | Stundenplan | Studiengangs- und Semesterauswahl mit Rückfallliste, falls das Hochschulsystem nicht erreichbar ist | `java/…/retrofit/TimeTableFallbackApi.java` | SCHED | teilweise, L-011/L-012 |
| AND-009 | Stundenplan | Auswahl der zu übernehmenden Termine beim Anlegen, gefiltert nach Gruppenbuchstabe | `java/…/activities/timetable/AddEventsActivity.java`, `fragments/timetable/filter/LetterFilter.java` | SCHED | L-018–L-020 |
| AND-010 | Stundenplan | Gruppenzuordnung über Einzelwert und Bereichsnotation | `java/…/util/GroupLetterUtil.java` | SCHED | L-016 |
| AND-011 | Stundenplan | Eigene Termine anlegen und bearbeiten | `java/…/activities/timetable/CustomEventActivity.java`, `EditEventActivity.java` | SCHED | L-021–L-025 |
| AND-012 | Stundenplan | **Export in einen wählbaren Gerätekalender** mit Auswahl von Zielkalender und Zeitraum | `java/…/dialog/CalendarExportDialog.java` | SCHED | – |
| AND-013 | Stundenplan | Semestertermine (Beginn, Ende, nächster WS-/SS-Start) aus der Fernkonfiguration | `java/…/service/DataService.java` | SCHED | – |
| AND-014 | Raumsuche | **Suche nach freien Räumen zu einem Zeitraum**, mit Angabe, bis wann der Raum frei ist | `java/…/fragments/roomsearch/RoomSearchFragment.java`, `service/RoomService.java` | RAUM | – |
| AND-015 | Raumsuche | Kuratierte Raumliste mit Raumgröße (klein/mittel/groß) und **E-Key-Eignung je Raum** | `assets/rooms.json`, `model/Room.java` | RAUM, EKEY | – |
| AND-016 | Raumsuche | Ermittlung der Belegung aus einem einzigen Aufruf über alle Räume | `java/…/retrofit/TimetableApi.java`, Methode `getAllEvents()` | RAUM | – |
| AND-017 | Mensa | Speiseplan aus der offiziellen ITMC-Schnittstelle, tagesweise und wochenweise | `java/…/retrofit/MenuApi.java` | MENSA | L-046 |
| AND-018 | Mensa | **Öffnungszeiten je Mensa und Wochentag** | `java/…/model/OpeningsDto.java`, `assets/canteens.json` | MENSA | – |
| AND-019 | Mensa | Gerichtskategorien und Zusatzstoffverzeichnis als eigene Schlüsselverzeichnisse, zweisprachig | `java/…/model/MenuInformationDto.java` | MENSA | teilweise, L-052 |
| AND-020 | Mensa | **Eigene Reihenfolge der angezeigten Mensen** | `java/…/activities/MenuSortActivity.java` | MENSA, SET | – |
| AND-021 | Mensa | Detailansicht je Gericht | `java/…/activities/DishDetailsActivity.java` | MENSA | L-051 |
| AND-022 | News | Fachbereichsnachrichten aus `aktuelles-ni` mit Blättern über ältere Seiten | `java/…/retrofit/NewsApi.java`, `util/NewsParserImpl.java` | NEWS | – |
| AND-023 | News | **Zweite Nachrichtenquelle: Fachbereich Wirtschaft (FB9)**, eigener Parser und eigene Ansicht | `java/…/fragments/news/NewsEconomyFragment.java`, `util/NewsEconomyParserImpl.java` | NEWS | – |
| AND-024 | News | **Suche in beiden Nachrichtenbereichen** | `java/…/fragments/news/NewsFragment.java`, `NewsEconomyFragment.java` | NEWS | L-040/L-041 |
| AND-025 | News | Lokale Datenhaltung der Meldungen mit Nachladen älterer Einträge | `java/…/room/NewsDao.java`, `RoomNews.java`, `model/LoadMoreItem.java` | NEWS | – |
| AND-026 | News | Push-Benachrichtigung zum Thema `Aktuelles`, in den Einstellungen abschaltbar | `java/…/firebase/DefaultFirebaseMessagingService.java`, `fragments/UserSettingFragment.java` | NEWS, SET | L-085 |
| AND-027 | Semesterticket | **Automatischer Download des NRW-Tickets** aus dem Hochschulportal | `java/…/activities/ticket/TicketDownloadActivity.java`, `worker/TicketDownloadWorker.java`, `retrofit/HisApi.java` | TICKET | – |
| AND-028 | Semesterticket | Anmeldung am Hochschulportal mit geräteseitig verschlüsselt gespeicherten Zugangsdaten | `java/…/fragments/ticket/LoginFragment.java`, `util/UserCredentialsHelper.java`, `util/Cryptography.java` | TICKET | vergleichbar L-065–L-069 |
| AND-029 | Semesterticket | Push-Benachrichtigung zum Thema `Ticket` bei Verfügbarkeit eines neuen Tickets | `java/…/firebase/DefaultFirebaseMessagingService.java` | TICKET | – |
| AND-030 | Semesterticket | **Bildausschnitt des Tickets aus der Fernkonfiguration** statt fest im Quellcode | `java/…/util/TicketUtil.java`, Schlüssel `ticket_rect_coordinates` | TICKET | L-055, dort als Mangel M-010 |
| AND-031 | Semesterticket | Manueller Import als Rückfallweg, PDF-Anzeige und Zoom | `java/…/activities/ticket/PdfViewerActivity.java`, `TicketViewActivity.java`, `view/ZoomableImageView.java` | TICKET | L-054, L-058/L-059 |
| AND-032 | Einstellungen | Ferngepflegte Links- und Downloads-Liste statt fest hinterlegter Einträge | `java/…/fragments/LinksDownloadsFragment.java`, `service/LinkService.java`, `model/Link.java` | SET, ADMIN | L-073, dort fest hinterlegt |
| AND-033 | Einstellungen | Einstellungsbildschirm einschließlich Push-Themen und Zugangsdatenverwaltung | `java/…/fragments/UserSettingFragment.java`, `activities/PreferenceActivity.java` | SET | L-078–L-085 |
| AND-034 | Betrieb | Fehler- und Absturzberichte sowie Nutzungsereignisse an einen Drittanbieterdienst | `java/…/util/FirebaseAnalyticsEvents.java`, Crashlytics-Aufrufe in `service/DataService.java` | SEC | – |
| AND-035 | Betrieb | Zusätzliche Trust-Anchor für Hochschulzertifikate, ohne die Prüfung abzuschalten | `java/…/util/AdditionalKeyStoresSSLSocketFactory.java`, `assets/fh.cer`, `assets/dst.cer` | SEC | – |
| AND-036 | Einstellungen | „Feedback" im Seitenmenü öffnet den Mail-Client mit vorausgefüllter Empfängeradresse `app@fsrfb4.de`, Betreff und App-Version/API-Level im Text | `java/…/activities/MainActivity.java:340-342,555-578` | SET | L-074 |

**Zu AND-036, Abgrenzung vom Backend-Befund.** Das im ehemaligen Backend `app.fsrfb4.de` vorhandene Formular `feedback/feedback.php` (Felder `Name`, `Feedback`, `Api`, `VersionCode`, Ablage in Tabelle `app_feedback`) ist ein eigener, technisch funktionsfähiger Weg, wird aber von keiner der beiden Alt-Apps aufgerufen — beide senden Feedback ausschließlich per Mail-Intent (AND-036, L-074). Der Endpunkt ist damit verwaistes Altbestandteil ohne Client, siehe `../../openspec/specs/integrations/spec.md` INT-008.

### 4.3 Beantwortung der vormals offenen Fragen

| Nr | Frage | Antwort aus dem Quellcode |
|---|---|---|
| A-001 | Welche Funktionen gab es nur unter Android? | Raumsuche (AND-014 bis AND-016), Kalender-Export in den Gerätekalender (AND-012), automatischer Ticket-Download (AND-027), Mensa-Öffnungszeiten (AND-018), eigene Mensa-Reihenfolge (AND-020), zweite Nachrichtenquelle (AND-023), ferngepflegte Stammdaten (AND-004), Zweisprachigkeit (AND-006) |
| A-002 | Wich der Funktionsumfang von der iOS-Version ab? | Ja, erheblich — die Android-App ist der größere Funktionsumfang. Umgekehrt fehlen ihr die Betriebssystem-Schnellzugriffe (L-004; `ShortCutActivity` ist im Manifest auskommentiert) und das Anpinnen von Meldungen (L-042–L-044) |
| A-003 | Gab es Homescreen-Widgets? | Nein. Kein `AppWidgetProvider`, keine Widget-Deklaration im Manifest |
| A-004 | Wie wurde das Semesterticket gehandhabt? | Automatischer Download aus dem Hochschulportal (AND-027) mit manuellem Import als Rückfallweg (AND-031); Bildausschnitt aus der Fernkonfiguration (AND-030) |
| A-005 | War die Notenübersicht enthalten? | Nein. Der Portalzugang existiert, wird aber ausschließlich für den Ticket-Bezug genutzt; es gibt keine Notenansicht |
| A-006 | Gab es Push-Benachrichtigungen? | Ja, zwei Themen: `Aktuelles` für Meldungen und `Ticket` für neue Semestertickets |
| A-007 | Wie viele aktive Nutzende? | Aus dem Quellcode nicht ableitbar; bleibt offen. Die Play-Console- und Firebase-Zugänge lägen beim FSR |
| A-008 | Welche Berechtigungen wurden abgefragt? | `INTERNET`, `ACCESS_NETWORK_STATE`, `READ_CALENDAR`, `WRITE_CALENDAR`, `POST_NOTIFICATIONS` |

**NFC-Teilen (Play-Store-Befund, siehe 4.4) ist in Version 1.4.11 nicht mehr vorhanden** — es gibt weder eine NFC-Berechtigung noch entsprechenden Quellcode. Die Funktion wurde offenbar in einer früheren Version entfernt. Für die Neuentwicklung besteht damit kein Übernahmebedarf.

### 4.4 Play-Store-Befund (Recherche vom 2026-08-24)

Der zuvor allein maßgebliche Befund bleibt zur Einordnung erhalten. Die Android-App ist identifiziert: Paket `de.fsrfb4.fb4`, Titel „FH Dortmund FB4", Entwickler Fachschaftsrat Informatik, 5.000+ Installationen, ausschließlich für Android. Quelle: [FH Dortmund FB4 – Google Play](https://play.google.com/store/apps/details?id=de.fsrfb4.fb4), Recherche 2026-08-24.

Der Vergleich mit dem Quellcode zeigt, dass die Store-Beschreibung in zwei Punkten irreführend war: Sie nennt NFC-Teilen, das nicht mehr existiert, und sie verschweigt die Raumsuche, die die fachlich bedeutendste Zusatzfunktion ist. Das bestätigt die Regel aus `../README.md` Abschnitt 6, Store-Text als schwächere Evidenzstufe zu behandeln.

**Zweitfund, Klärung zurückgestellt:** Ein zweiter Play-Store-Eintrag „Official FB4-App FHDo" (Paket `fh.dortmund.imslFB4`) wurde bei derselben Recherche gefunden. Das Verhältnis zu `de.fsrfb4.fb4` bleibt ungeklärt; der FSR FB4 hat die Klärung am 2026-08-25 als für den Rollout unerheblich zurückgestellt. Für die Nutzerkommunikation beim Launch werden beide Store-Einträge als abgelöst gekennzeichnet.

### 4.5 Mängel der Android-App

Nach demselben Muster wie Abschnitt 3 für die Flutter-App. Diese Befunde dürfen in der Neuentwicklung nicht wiederholt werden.

| Nr | Befund | Quelle | Konsequenz für die Neuentwicklung |
|---|---|---|---|
| N-001 | Der Stundenplandienst wird unverschlüsselt über `http://` aufgerufen, obwohl `https://` funktioniert (live geprüft 2026-08-25) | `module/NetworkModule.java` | TLS ausnahmslos, siehe SEC-N-030 |
| N-002 | Hochschul-Zugangsdaten werden geräteseitig vorgehalten und von einem Hintergrund-Worker wiederholt erneut gesendet | `util/UserCredentialsHelper.java`, `worker/TicketDownloadWorker.java` | Kein Passwort-Replay, siehe SEC-F-040 und INT-017 |
| N-003 | Das Ticket-PDF liegt unverschlüsselt im externen App-Verzeichnis | `util/TicketUtil.java` | Verschlüsselte Ablage, siehe DATA-F-040 — derselbe Mangel wie M-009 bei der Flutter-App |
| N-004 | Die Endezeit eines freien Raums fällt ohne weiteren Termin auf einen fest eingetragenen Wert von 21:30 Uhr zurück, im Quellcode als offener Punkt markiert | `service/RoomService.java` | Gebäudeöffnungszeiten als pflegbare Angabe führen, nicht als Konstante |
| N-005 | Die Fernkonfiguration verweist für Prüfungs- und Zeitplan auf die private Domain `hoolycraap.de`, unverschlüsselt | live abgefragt 2026-08-25, Schlüssel `examplan`, `timeplan` | Zweite Fremdabhängigkeit neben `hemacode.de`, mit abzulösen, siehe INT-008 |
| N-006 | Der Datenbestand der Fernkonfiguration ist seit dem Wintersemester 2023/24 nicht mehr gepflegt | live abgefragt 2026-08-25, Schlüssel `semester_end` = `19.01.2024` | Pflege muss über eine Oberfläche möglich sein, die der FSR ohne Serverzugang bedienen kann, siehe `../../openspec/specs/admin/spec.md` |
| N-007 | Ein Wildcard-Gruppenwert `*` im Feld `studentSet` wird bei gesetzter Gruppenkennung nicht als „gilt für alle" erkannt, sondern führt zum Ausschluss des Termins | `util/GroupLetterUtil.java` | Wildcard ausdrücklich behandeln, siehe SCHED-F-060 |
| N-008 | Absturzberichte und Nutzungsereignisse gehen an einen Drittanbieterdienst | `util/FirebaseAnalyticsEvents.java`, Crashlytics-Aufrufe | Mit F-Droid unvereinbar (NFR-N-170) und im Verarbeitungsverzeichnis nicht vorgesehen; nicht übernehmen |
| N-009 | Die Zeitüberschreitung für Netzaufrufe liegt bei 30 Sekunden | `FB4.java`, `callTimeout(30, TimeUnit.SECONDS)` | Deutlich kürzer ansetzen, siehe NFR-F-070 |

## 5. Abdeckungsübersicht

Grundlage der späteren Vollständigkeitsprüfung: wie viele Inventarzeilen jede Feature-Spec abzudecken hat, getrennt nach Herkunft aus der Flutter-App (`L-###`, Abschnitt 2) und der Android-App (`AND-###`, Abschnitt 4.2).

**Verhältnis zur Herkunftsmarkierung `NEU` (präzisiert 2026-09-05).** Diese Übersicht sagt, ob ein Feature ein Vorbild in den Alt-Apps *hat* — nicht, welche Markierung seine Anforderungen tragen. `NEU` bedeutet nicht „ohne Vorbild", sondern „vorwärts entschieden statt aus Altcode rückwärts erschlossen": die Markierung misst, wie sicher eine Anforderung ist, nicht wie neu (`CLAUDE.md`, Herkunft bleibt Pflicht). Eine vorwärts entschiedene Anforderung bleibt deshalb auch dann `NEU`, wenn diese Übersicht für ihr Feature Vorbilder ausweist; das Vorbild wird ihr als `vgl. <Inventar-ID>` im Herkunftssatz beigegeben. Wo **beide** Spalten `0` zeigen, kann es solche Rückverweise gar nicht geben.

| Zielspec | Flutter (L) | Android (AND) | Anmerkung |
|---|---|---|---|
| SHELL | 5 | 5 | Rahmen und Startverhalten; Android ergänzt Willkommensablauf, Splash, serverseitige Hinweise, Fernkonfiguration, Zweisprachigkeit |
| SCHED | 29 | 7 | Android ergänzt Kalender-Export ins Gerät (AND-012), Rückfallliste der Studiengänge (AND-008) und Semestertermine (AND-013) |
| NEWS | 13 | 5 | Android ergänzt zweite Quelle (AND-023), Blättern über ältere Seiten (AND-022) und lokale Datenhaltung (AND-025); Anpinnen fehlt dort |
| MENSA | 10 | 5 | Android ergänzt Öffnungszeiten (AND-018), eigene Reihenfolge (AND-020) und zweisprachige Schlüsselverzeichnisse (AND-019) |
| TICKET | 12 | 5 | Android ergänzt automatischen Download (AND-027, für die Neuentwicklung ausgeschlossen) und ferngepflegten Bildzuschnitt (AND-030) |
| NOTEN | 10 | 0 | Nur in der Flutter-App vorhanden; die Android-App nutzt den Portalzugang ausschließlich für das Ticket |
| SET | 6 | 3 | Android führt Links und Downloads ferngepflegt statt fest hinterlegt (AND-032); Feedback per Mail-Intent (AND-036) bestätigt L-074 unverändert |
| RAUM | 0 | 3 | **Korrektur 2026-08-25:** zuvor als „ohne Entsprechung in den Alt-Apps" geführt. Die Android-App enthält eine vollwertige Raumsuche (AND-014 bis AND-016) einschließlich Raumgröße und E-Key-Eignung |
| RATE | 0 | 0 | Ohne Vorbild in beiden Alt-Apps |
| FOTO | 0 | 0 | Ohne Vorbild in beiden Alt-Apps; Zeile ergänzt 2026-09-05, zuvor fehlend. Weder Kamera-, Bildwahl- noch Upload-Code in einer der Alt-Apps auffindbar |
| EVENT | 0 | 0 | Ohne Vorbild in beiden Alt-Apps |
| HELFER | 0 | 0 | Ohne Vorbild in beiden Alt-Apps |
| WIKI | 0 | 0 | Ohne Vorbild in beiden Alt-Apps |
| EKEY | 0 | 1 | Die E-Key-Eignung je Raum (AND-015) ist der einzige Berührungspunkt; die Verwaltung selbst ist ohne Vorbild |
| ADMIN | 0 | 1 | Die Fernkonfiguration (AND-004) ist der fachliche Vorläufer der Stammdatenpflege; eine Oberfläche dafür gibt es in keiner Alt-App |
