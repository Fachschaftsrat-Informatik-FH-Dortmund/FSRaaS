---
id: legacy-inventory
titel: Funktionsinventar der Alt-Apps
status: draft
version: 0.2.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib
related:
  - vision.md
  - glossary.md
  - ../platform/integrations.md
  - ../open-questions.md
---

# Funktionsinventar der Alt-Apps

## 1. Zweck und Vorgehen

Dieses Inventar erfasst den Funktionsumfang der beiden abzulösenden Apps auf Ebene einzelner Nutzerfunktionen, nicht auf Ebene von Bildschirmen. Für die iOS/Flutter-App wurde der vollständige Quellcode unter `alte apps/fb4_app-main/fb4_app-main/lib/` (rund 6.700 Zeilen Dart) gelesen und jede erkennbare Funktion einzeln erfasst (Abschnitt 2); begleitend wurden bekannte Code-Mängel am Quellcode nachvollzogen (Abschnitt 3). Für die native Android-App liegt kein Quellcode vor; ihr Funktionsumfang ist aus Code nicht rekonstruierbar, sondern nur über externe Quellen wie den Play-Store-Eintrag zu erschließen (Abschnitt 4). Beide Ableitungsarten sind fehleranfällig — Code-Verhalten und beabsichtigtes Verhalten fallen nicht immer zusammen, eine Store-Beschreibung beschreibt nicht zwingend das tatsächliche Verhalten (siehe `README.md` Abschnitt 6) —, weshalb jede Zeile eine Fundstelle trägt. Dieses Dokument ist die Referenz für die spätere Prüfung, ob jede Bestandsfunktion in einer Feature-Spec abgedeckt oder bewusst verworfen wurde (Abschnitt 5).

## 2. Funktionsinventar iOS/Flutter

Pfade sind relativ ab `lib/` angegeben. Endpunktdetails der genutzten Schnittstellen stehen ausschließlich in `platform/integrations.md` (INT-001 bis INT-005) und werden hier nicht wiederholt. Die Spalte `Android` ist durchgängig `unbekannt`, siehe Abschnitt 4 — das gilt unverändert für jede Zeile dieser Tabelle, auch wenn Abschnitt 4 inzwischen einzelne Android-Funktionen aus externer Quelle benennt: Ob eine konkrete iOS-Funktion unter Android identisch, abweichend oder gar nicht vorhanden war, bleibt pro Zeile ungeklärt.

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

## 4. Android-Lückenregister

Für die Android-Alt-App liegt kein Quellcode vor; ihr Verhalten ist nicht aus Code ableitbar. Jede Zeile in Abschnitt 2 trägt deshalb weiterhin durchgängig `unbekannt` in der Spalte `Android` — das bleibt der tatsächliche Kenntnisstand zur iOS-Funktionsliste. Ergänzend dazu liegt jedoch eine Recherche der öffentlichen Play-Store-Beschreibung vor, die eigenständige Funde liefert, welche in Abschnitt 2 keine Entsprechung haben. Beide Quellenarten bleiben klar getrennt: Ableitung aus Store-Text ist keine Bestätigung von Code-Verhalten, sondern eine andere, schwächere Evidenzstufe (Markierung `Recherche: …, 2026-08-24` bzw. bei Übernahme in Feature-Specs `[Android: unbekannt]`).

### 4.1 Play-Store-Befund

Die Android-App ist identifiziert: Paket `de.fsrfb4.fb4`, Titel „FH Dortmund FB4", Entwickler Fachschaftsrat Informatik, Version 1.4.10, 5.000+ Installationen, ausschließlich für Android. Quelle: [FH Dortmund FB4 – Google Play](https://play.google.com/store/apps/details?id=de.fsrfb4.fb4), Recherche 2026-08-24 — öffentliche Store-Beschreibung, kein Quellcode-Zugriff.

| Funktion laut Store-Beschreibung | Vergleich zur Flutter/iOS-App | Herkunft |
|---|---|---|
| Offizielle FB4-Stundenpläne, filterbar nach Gruppenbuchstabe | Entspricht L-011–L-020 | Recherche: Play Store, 2026-08-24 |
| Eigene/offizielle Termine hinzufügen und bearbeiten | Entspricht L-021–L-025 | Recherche: Play Store, 2026-08-24 |
| Stundenplan-Teilen per NFC | Kein Pendant unter L-001–L-032 — neuer Fund ohne iOS-Entsprechung | Recherche: Play Store, 2026-08-24 |
| News aus IT- und Wirtschaftsfachbereich | Flutter-App liest nur einen Feed (INT-003); ob zwei echte Quellen oder ein gemeinsamer Absender, ist ungeklärt | Recherche: Play Store, 2026-08-24 |
| Mensa-Speisepläne und Öffnungszeiten der Mensen des Studierendenwerks | Entspricht L-046–L-053, Öffnungszeiten ohne iOS-Entsprechung | Recherche: Play Store, 2026-08-24 |
| Links zu ILIAS, ODS, SmartAssign | ODS entspricht L-073; „SmartAssign" wird als einfacher externer Link geführt (Entscheidung FSR FB4, 2026-08-25, siehe `specs/open-questions.md` Archiv), kein eigener `INT-###`-Eintrag nötig | Recherche: Play Store, 2026-08-24 |
| NRW-Ticket-Download | Entspricht sinngemäß L-054 (PDF-Import), abweichender Beschaffungsweg | Recherche: Play Store, 2026-08-24 |

**Zweitfund, Klärung zurückgestellt:** Ein zweiter Play-Store-Eintrag „Official FB4-App FHDo" (Paket `fh.dortmund.imslFB4`) wurde bei derselben Recherche gefunden. Das genaue Verhältnis zu `de.fsrfb4.fb4` — Vorgängerversion, Parallelentwicklung eines anderen Fachbereichs oder Fehltreffer — ist weiterhin ungeklärt; der FSR FB4 hat die Klärung am 2026-08-25 als für den Rollout unerheblich zurückgestellt (siehe `specs/open-questions.md`, Archiv). Für die Nutzerkommunikation beim Launch werden beide Store-Einträge unabhängig vom genauen Verhältnis als abgelöst gekennzeichnet.

### 4.2 Offene Klärungspunkte

Die folgende Tabelle hält fest, was durch den Play-Store-Befund (4.1) beantwortet ist und was offen bleibt. Store-Text ersetzt keine Verhaltensprüfung — auch beantwortete Zeilen bleiben bis zu einer Bestätigung durch frühere Entwickler oder Screenshots von Nutzenden mit Vorbehalt zu lesen.

| Nr | Offene Frage | Stand nach 4.1 | Klärungsweg | Verantwortlich |
|---|---|---|---|---|
| A-001 | Welche Funktionen gab es nur unter Android, die dieses Inventar dadurch nicht erfasst? | Teilweise beantwortet: NFC-Teilen, Mensa-Öffnungszeiten, SmartAssign-Link (4.1). Vollständigkeit nicht gesichert. | Vergleich Store-Beschreibungen; Befragung von Studierenden/FSR mit Android-Erfahrung | FSR FB4 |
| A-002 | Wich der Funktionsumfang zwischen Android- und iOS-Version ab? | Teilweise beantwortet, siehe Tabelle 4.1. | Screenshots von Nutzenden | FSR FB4 |
| A-003 | Gab es Homescreen-Widgets? | Weiterhin offen — Store-Beschreibung nennt keine. | Screenshots von Nutzenden | FSR FB4 |
| A-004 | Wie wurde das Semesterticket unter Android gehandhabt? | Teilweise beantwortet: „NRW-Ticket-Download" statt manuellem PDF-Import (4.1). Genauer Ablauf offen. | Screenshots von Nutzenden; Befragung | FSR FB4 |
| A-005 | War die Notenübersicht (ODS) in der Android-App enthalten? | Teilweise beantwortet: ODS-Link vorhanden (4.1). Natives Anzeigen oder reiner Link unklar. | Nachfrage bei früheren Entwicklern | FSR FB4 |
| A-006 | Gab es Push-Benachrichtigungen unter Android? | Weiterhin offen — Store-Beschreibung äußert sich nicht dazu. | Nachfrage bei früheren Entwicklern | FSR FB4 |
| A-007 | Wie viele aktive Nutzende hatte die Android-App im Verhältnis zur iOS-App? | Teilweise beantwortet: 5.000+ Installationen laut Play Store (4.1) — Installationen sind kein Maß für aktive Nutzung. | Nachfrage bei früheren Entwicklern (Play-Console/Firebase-Zugang) | FSR FB4 |
| A-008 | Welche Berechtigungen fragte die Android-App ab? | Weiterhin offen. | Screenshots von Nutzenden | FSR FB4 |

## 5. Abdeckungsübersicht

Grundlage der späteren Vollständigkeitsprüfung: wie viele Inventarzeilen jede Feature-Spec abzudecken hat. Zielspec-Werte ohne Alt-App-Entsprechung (RAUM, RATE, EVENT, HELFER, WIKI) sind vollständig neu und tragen deshalb keine Herkunftsmarkierung `Alt:` in den jeweiligen Feature-Specs. Die Android-Zusatzfunde aus 4.1 (NFC-Teilen, Mensa-Öffnungszeiten, SmartAssign, zweite News-Quelle) haben keine eigene Zielspec-Zuordnung, solange die zugehörigen Fragen in `specs/open-questions.md` offen sind.

| Zielspec | Anzahl Inventarzeilen | Anmerkung |
|---|---|---|
| SHELL | 5 | App-Rahmen, Navigation, Startverhalten. |
| SCHED | 29 | 27 aus dem Stundenplan-Bereich, 2 aus Einstellungen (L-078, L-080). |
| NEWS | 13 | Vollständig aus dem News-Bereich; zweite Quelle laut 4.1 noch nicht eingearbeitet. |
| MENSA | 10 | 8 aus dem Mensa-Bereich, 2 aus Einstellungen (L-082, L-083); Öffnungszeiten laut 4.1 noch nicht eingearbeitet. |
| TICKET | 12 | 10 aus dem Semesterticket-Bereich, 2 aus Einstellungen (L-079, L-081). |
| NOTEN | 10 | 9 aus dem Noten-Bereich, 1 aus Einstellungen (L-084). |
| SET | 6 | Verbleibende, nicht bereichsspezifische Einstellungen (Links/Downloads, Feedback, Über, Lizenzen, Datenschutz-Ansicht, Push-Opt-in); SmartAssign führt SET als einfacher externer Link (Entscheidung FSR FB4, 2026-08-25), formale Anforderung für die Links/Downloads-Liste in `features/settings/spec.md` noch nachzutragen. |
| RAUM | 0 | Keine Entsprechung in den Alt-Apps; vollständig neu, basiert auf Aggregation aus INT-002 bzw. INT-009. |
| RATE | 0 | Keine Entsprechung in den Alt-Apps; vollständig neu. |
| EVENT | 0 | Keine Entsprechung in den Alt-Apps; vollständig neu. |
| HELFER | 0 | Keine Entsprechung in den Alt-Apps; vollständig neu. |
| WIKI | 0 | Keine Entsprechung in den Alt-Apps; vollständig neu. |
