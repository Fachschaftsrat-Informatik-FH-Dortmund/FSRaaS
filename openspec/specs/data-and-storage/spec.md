## Purpose

Legt fest, welche Datenklassen die App verarbeitet, wo sie liegen, wie lange sie gelten und wie sie gelöscht werden. Gilt geräteweit für alle Features; Feature-Capabilities verweisen hierher statt Regeln zu wiederholen. Vormals `specs/platform/data-and-storage.md` (Präfix `DATA`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Ausschließlich lokale Speicherung des Stundenplans

Das System muss den Stundenplan der Nutzerin ausschließlich lokal auf dem Gerät persistent speichern. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:93 (vormals DATA-F-010).

#### Scenario: Stundenplan bearbeiten
- **WHEN** eine Nutzerin ihren Stundenplan bearbeitet
- **THEN** speichert die App die Änderung ausschließlich lokal auf dem Gerät

### Requirement: Kein kommentarloses Löschen bei inkonsistentem Bestand

Falls beim Laden des lokal gespeicherten Stundenplans eine unerwartete oder inkonsistente Datenmenge festgestellt wird, muss das System den Fehler protokollieren und die Nutzerin informieren, statt den Bestand kommentarlos zu löschen. Herkunft: Alt: bewusst verworfen (vormals DATA-F-020). Die Flutter-Alt-App löscht bei einer unerwarteten Eintragsanzahl den gesamten Bestand kommentarlos und legt ihn neu an — Datenverlust ohne Rückfrage, ausdrücklich nicht übernommen.

#### Scenario: Inkonsistenter Stundenplan-Bestand
- **WHEN** beim Laden des lokal gespeicherten Stundenplans eine inkonsistente Datenmenge festgestellt wird
- **THEN** protokolliert das System den Fehler und informiert die Nutzerin, statt den Bestand zu löschen

### Requirement: Lokale Speicherung des Semesterticket-Bilds

Das System muss das Bild des Semestertickets lokal auf dem Gerät speichern. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82 (vormals DATA-F-030).

#### Scenario: Ticket-Bild hinterlegen
- **WHEN** eine Nutzerin ein Semesterticket-Bild hinterlegt
- **THEN** speichert die App es lokal auf dem Gerät

### Requirement: Verschlüsselte Ablage des Semesterticket-Bilds

Das System muss das gespeicherte Semesterticket-Bild verschlüsselt ablegen. Herkunft: Alt: bewusst verworfen (vormals DATA-F-040). Beide Alt-Apps legen das Ticket unverschlüsselt ab (Flutter-App im Dokumentenverzeichnis, Android-App sogar im externen, app-fremd zugreifbaren Speicher); für die Neuentwicklung ausgeschlossen.

#### Scenario: Ticket-Bild auf dem Gerät
- **WHEN** das Semesterticket-Bild auf dem Gerät liegt
- **THEN** liegt es verschlüsselt vor

### Requirement: Persistente Schlüssel-Wert-Ablage für Einstellungen

Das System muss Einstellungen lokal auf dem Gerät als persistente Schlüssel-Wert-Ablage speichern. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/core/settings/settings_service.dart:7 (vormals DATA-F-050).

#### Scenario: Einstellung ändern
- **WHEN** eine Nutzerin eine Einstellung ändert
- **THEN** speichert die App sie lokal in der persistenten Schlüssel-Wert-Ablage

### Requirement: Persistente Speicherung angepinnter News

Das System muss angepinnte News-Meldungen lokal auf dem Gerät persistent speichern, bis die Nutzerin sie entpinnt. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (vormals DATA-F-060).

#### Scenario: News-Meldung anpinnen
- **WHEN** eine Nutzerin eine News-Meldung anpinnt
- **THEN** bleibt sie lokal gespeichert, bis die Nutzerin sie entpinnt

### Requirement: Lokaler Speiseplan-Zwischenspeicher je Mensa und Tag

Das System muss Speisepläne je Mensa und Tag lokal zwischenspeichern, um wiederholte Netzabrufe zu vermeiden. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:9 (vormals DATA-F-070).

#### Scenario: Speiseplan erneut anzeigen
- **WHEN** ein bereits geladener Speiseplan für Mensa und Tag erneut angezeigt wird
- **THEN** bedient die App ihn aus dem lokalen Zwischenspeicher statt aus einem erneuten Netzabruf

### Requirement: Begrenzte Gültigkeitsdauer für News, Raumbelegung und Wiki

Das System muss News-Meldungen, Raumbelegungsdaten und Wiki-Inhalte lokal mit einer je Datenart begrenzten Gültigkeitsdauer zwischenspeichern (siehe Abschnitt „Zwischenspeicher-Regeln“). Herkunft: NEU (vormals DATA-F-080).

#### Scenario: Zwischenspeicher abgelaufen
- **WHEN** die Gültigkeitsdauer des Zwischenspeichers einer dieser Datenarten abläuft
- **THEN** gilt der zwischengespeicherte Stand als veraltet und wird bei nächster Gelegenheit aufgefrischt

### Requirement: Anzeige mit Altershinweis bei abgelaufenem Zwischenspeicher ohne Netz

Solange kein Netzzugriff besteht und der Zwischenspeicher einer Datenart abgelaufen ist, muss das System die zuletzt geladenen Daten mit einem sichtbaren Hinweis auf ihr Alter anzeigen statt einer Leeransicht. Herkunft: NEU (vormals DATA-F-090).

#### Scenario: Kein Netz, Zwischenspeicher abgelaufen
- **WHEN** kein Netzzugriff besteht und der Zwischenspeicher einer Datenart abgelaufen ist
- **THEN** zeigt die App die zuletzt geladenen Daten mit einem sichtbaren Altershinweis, statt eine Leeransicht zu zeigen

### Requirement: Lokale Offline-Warteschlange mit FIFO-Übertragung

Das System muss ausstehende Schreibvorgänge bei fehlendem Netzzugriff in einer lokalen Warteschlange vorhalten und nach Wiederherstellung der Verbindung in Entstehungsreihenfolge übertragen. Herkunft: NEU (vormals DATA-F-100).

#### Scenario: Verbindung wiederhergestellt
- **WHEN** die Netzverbindung nach einer Unterbrechung wiederhergestellt wird
- **THEN** überträgt die App die in der Warteschlange vorgehaltenen Schreibvorgänge in ihrer Entstehungsreihenfolge

### Requirement: Manuelle Entscheidung bei dauerhaft fehlgeschlagenem Schreibvorgang

Falls ein Schreibvorgang in der Offline-Warteschlange auch nach wiederholten Versuchen dauerhaft fehlschlägt, muss das System die Nutzerin informieren und den Vorgang zur manuellen Entscheidung (erneut versuchen oder verwerfen) vorhalten. Herkunft: NEU (vormals DATA-F-110).

#### Scenario: Dauerhafter Fehlschlag
- **WHEN** ein Warteschlangen-Eintrag auch nach der maximalen Anzahl Versuche nicht übertragen werden konnte
- **THEN** informiert die App die Nutzerin und bietet ihr die Wahl zwischen erneutem Versuch und Verwerfen

### Requirement: Zugangsdaten ausschließlich im gesicherten Systemspeicher

Das System muss Zugangsdaten bzw. Sitzungsmerkmale ausschließlich im gesicherten Systemspeicher des Geräts ablegen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart:9 (vormals DATA-F-120).

#### Scenario: Sitzungsmerkmal speichern
- **WHEN** ein Sitzungsmerkmal nach erfolgreicher Anmeldung entsteht
- **THEN** legt die App es ausschließlich im gesicherten Systemspeicher des Geräts ab

### Requirement: Entfernen des Sitzungsmerkmals bei Abmeldung

Wenn eine aktive Sitzung beendet wird, muss das System das gespeicherte Sitzungsmerkmal aus dem gesicherten Systemspeicher entfernen. Herkunft: NEU (vormals DATA-F-130). Ergänzt um die serverseitige Sitzungsinvalidierung beim Abmelden (Capability `identity-and-moderation`, Requirement „Serverseitige Abmeldung beim Identitätsanbieter“) — das lokale Entfernen allein reicht nicht aus, da ein entwendetes Token sonst serverseitig weiter gültig bliebe.

#### Scenario: Abmelden
- **WHEN** eine Nutzerin sich abmeldet
- **THEN** entfernt die App das gespeicherte Sitzungsmerkmal aus dem gesicherten Systemspeicher

### Requirement: Hinweis auf Neuanlage beim ersten Start

Wenn die App zum ersten Mal gestartet wird, muss das System einen Hinweis anzeigen, dass Stundenplan und Semesterticket neu angelegt werden müssen. Herkunft: NEU (vormals DATA-F-140).

#### Scenario: Erster Start
- **WHEN** die App zum ersten Mal gestartet wird
- **THEN** zeigt sie einen Hinweis, dass Stundenplan und Semesterticket neu angelegt werden müssen

### Requirement: Obergrenze des Gesamtspeicherverbrauchs

Der Gesamtspeicherverbrauch aller Zwischenspeicher sollte eine Obergrenze von 50 MB nicht überschreiten. Herkunft: NEU (vormals DATA-N-150). Genauer Wert gilt als Arbeitsziel, zu validieren anhand realer Wiki- und Ticketbildgrößen im ersten Betrieb.

#### Scenario: Zwischenspeicher nähert sich Obergrenze
- **WHEN** der Gesamtspeicherverbrauch aller Zwischenspeicher die Obergrenze von 50 MB überschreitet
- **THEN** gilt das als Abweichung von diesem Requirement, zu prüfen im laufenden Betrieb

### Requirement: Nutzeraktion „Alle lokalen Daten löschen“

Das System muss eine Nutzeraktion „Alle lokalen Daten löschen“ bereitstellen, die alle Datenklassen aus Abschnitt „Datenklassen“ vom Gerät entfernt. Herkunft: NEU (vormals DATA-F-160).

#### Scenario: Aktion auslösen
- **WHEN** eine Nutzerin „Alle lokalen Daten löschen“ auslöst
- **THEN** entfernt die App alle in der Datenklassen-Übersicht gelisteten Datenklassen vom Gerät

### Requirement: Ablage ausschließlich im App-eigenen Speicherbereich

Das System muss alle lokalen Daten aus Abschnitt „Datenklassen“ ausschließlich im App-eigenen Speicherbereich ablegen, sodass eine Deinstallation sie vollständig entfernt. Herkunft: NEU (vormals DATA-F-170).

#### Scenario: Deinstallation
- **WHEN** die App deinstalliert wird
- **THEN** entfernt das Betriebssystem alle lokalen Daten vollständig, weil keine davon außerhalb des App-eigenen Speicherbereichs liegt

### Requirement: Ausschließlich lokale Speicherung der News-Benachrichtigungsregeln

Das System muss die Benachrichtigungsregeln für News (Positiv- und Sperrliste) ausschließlich lokal auf dem Gerät speichern und nicht an das Backend oder Dritte übertragen. Herkunft: NEU (vormals DATA-F-180). Verankert die entsprechende Anforderung der Capability `news` auf Datenhaltungsebene. Die Auswertung der Regeln geschieht geräteseitig auf zugestellten Meldungs-Metadaten (analog zum lokalen Prüfungsplan-Abgleich, Capability `schedule`); das Backend kennt weder die Regeln noch, welche Meldung bei einer einzelnen Nutzerin eine Benachrichtigung ausgelöst hat.

#### Scenario: Regel anlegen
- **WHEN** eine Nutzerin eine Benachrichtigungsregel für News anlegt
- **THEN** speichert die App sie ausschließlich lokal und überträgt sie nicht an das Backend oder Dritte

## Datenklassen

| Datenklasse | Speicherort | Verschlüsselung | Lebensdauer | Löschweg | Personenbezogen |
|---|---|---|---|---|---|
| Stundenplan der Nutzerin | lokal, Gerät | nein | dauerhaft, bis manuell geändert | Bearbeitung im Stundenplan; „Alle lokalen Daten löschen“ | ja (Kursauswahl, optionale Gruppenkennung) |
| Matrikelnummer (Ermittlung der Gruppenkennung) | lokal, Gerät | nein | dauerhaft, bis geändert oder entfernt | Eingabe entfernen; „Alle lokalen Daten löschen“ | ja (Matrikelnummer); ausschließlich geräteseitig, geht an kein anderes Ziel als das Hochschulsystem zur Gruppenermittlung, insbesondere nicht an das eigene Backend |
| Semesterticket-Bild | lokal, Gerät | ja, verpflichtend | dauerhaft, bis neues Ticket hinterlegt oder gelöscht | „Ticket löschen“; „Alle lokalen Daten löschen“ | ja (Fahrausweis) |
| Einstellungen | lokal, Gerät | nein | dauerhaft | „Alle lokalen Daten löschen“; Deinstallation | überwiegend nein |
| Angepinnte News | lokal, Gerät | nein | dauerhaft, bis entpinnt | manuell entpinnen; „Alle lokalen Daten löschen“ | nein |
| Benachrichtigungsregeln für News (Positiv-/Sperrliste) | lokal, Gerät | nein | dauerhaft, bis geändert | Regel entfernen; „Alle lokalen Daten löschen“ | ja (Regelinhalte können auf Interessen oder belegte Fächer hindeuten); ausschließlich geräteseitig, keine Übermittlung |
| Zwischengespeicherte Fremddaten (Speisepläne, News, Raumbelegung, Wiki-Inhalte) | lokal, Gerät | nein | begrenzt, siehe Abschnitt „Zwischenspeicher-Regeln“ | automatischer Ablauf; „Alle lokalen Daten löschen“ | nein |
| Lieblingsgerichte (abgeleitet aus den eigenen Höchstbewertungen) | lokal, Gerät — abgeleitet aus serverseitigen Bewertungen | nein | dauerhaft, bis die zugrunde liegende Bewertung geändert oder gelöscht wird | eigene Bewertung herabsetzen oder löschen (Capability `canteen-ratings`); „Alle lokalen Daten löschen“ | ja (Ernährungsvorlieben); seit 2026-09-04 nicht mehr rein gerätelokal, da die Höchstbewertung serverseitig liegt, siehe Capability `canteen` |
| Gerätelokale Spiegelung der eigenen Bewertungen | lokal, Gerät | nein | bis Abmeldung oder nächster Abgleich | Abmeldung; „Alle lokalen Daten löschen“ | ja (Ernährungsvorlieben), siehe Capability `canteen-ratings` |
| Unverträglichkeiten-Filter (Mensaplan) | lokal, Gerät | nein | dauerhaft, bis geändert | Kennzeichnung entfernen; „Alle lokalen Daten löschen“ | ja, besondere Kategorie nach Art. 9 DSGVO (Gesundheitsangabe); ausschließlich geräteseitig, keine Übermittlung, siehe Capability `canteen` |
| Lebensstil-/Ausschluss-Vorgabe (Mensaplan) | lokal, Gerät | nein | dauerhaft, bis geändert | Kennzeichnung entfernen; „Alle lokalen Daten löschen“ | ja (Ernährungsvorlieben), keine besondere Kategorie; ausschließlich geräteseitig, keine Übermittlung, siehe Capability `canteen` |
| Preisfilter-Höchstpreis (Mensaplan) | lokal, Gerät | nein | dauerhaft, bis geändert | Höchstpreis auf „Kein Limit“ senken; „Alle lokalen Daten löschen“ | nein (reine Anzeigeeinstellung); ausschließlich geräteseitig, keine Übermittlung, siehe Capability `canteen` |
| Sortier-/Gruppierpresets (Mensaplan), vordefiniert + eigene, aktives Preset | lokal, Gerät | nein | dauerhaft, bis geändert/gelöscht | eigenes Preset löschen; „Alle lokalen Daten löschen“ | nein (reine Anzeigeeinstellung); ausschließlich geräteseitig, siehe Capability `canteen` |
| Gerichtsfotos (hochgeladen) | serverseitig, Ablagebereich des Backends | nein (öffentlich sichtbarer Inhalt); Metadaten vor Übertragung entfernt | dauerhaft, bis Löschung durch die hochladende Person, Moderation oder Kontolöschung | eigenes Foto löschen; Moderationsentscheidung; Kontolöschung, siehe Capability `canteen-photos` | ja (Beitrag ist einem Konto zugeordnet), siehe Capability `canteen-photos` |
| Prüfungsauswahl und Wahlpflicht-Planungsauswahl | lokal, Gerät | nein | dauerhaft, bis geändert | Bearbeitung im Stundenplan; „Alle lokalen Daten löschen“ | ja (Studienverlauf) |
| Ferngepflegte Stammdaten (Mensen, Räume, Links, Semestertermine) | lokal, Gerät | nein | bis zur nächsten Aktualisierung; Ausgangsbestand aus dem Anwendungspaket als Rückfall | automatischer Ersatz bei Aktualisierung; „Alle lokalen Daten löschen“ | nein |
| Offline-Warteschlange (Bewertungen, Helfer-Anmeldungen, Besetzt-Meldungen, E-Key-Schreibvorgänge) | lokal, Gerät | nein, außer personenbezogene Helfer- und E-Key-Angaben: ja | bis Übertragung oder Verfall, siehe Abschnitt „Offline-Warteschlange für Schreibvorgänge“ | automatisch nach Übertragung; Verfall; „Alle lokalen Daten löschen“ | ja bei Helfer-Anmeldungen und E-Key-Verknüpfung |
| Zugangsdaten bzw. Sitzungsmerkmal | lokal, Gerät, gesicherter Systemspeicher | ja, verpflichtend | bis Abmeldung oder Sitzungsablauf | Abmeldung; „Alle lokalen Daten löschen“ | ja |

## Verhalten der Alt-App

Grundlage ist überwiegend die Flutter/iOS-Alt-App. Ergänzung 2026-08-25/26: Der Android-Quellcode liegt inzwischen ebenfalls vor (`alte apps/android-fb4/`, siehe `specs/product/legacy-inventory.md` Abschnitt 4); die folgende Tabelle nennt dort, wo der Android-Befund die Bewertung bestätigt oder ergänzt.

| Bereich | Quelle | Befund | Bewertung |
|---|---|---|---|
| Stundenplan | `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:93-152` | Lokale Datenbank über fünf Einträge, Schlüsselmuster `schedule-<Wochentag>`; je Wochentag eine Abbildung von Hashwert auf Termin (Zeile 105-121, 154-167) | Lokale Haltung übernehmenswert. Bei einer unerwarteten Eintragsanzahl (Zeile 136-147) wird der gesamte Bestand kommentarlos gelöscht und neu angelegt — Datenverlust ohne Rückfrage, nicht übernehmenswert |
| Einstellungen | `alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:19-35`, `.../lib/core/settings/settings_service.dart:7-42` | Einfache Schlüssel-Wert-Ablage über `SharedPreferences`, acht fachliche Schlüssel (siehe Tabelle unten) | Fachliche Bedeutung der Schlüssel übernehmenswert; konkretes Speicherformat ist Sache der Neuentwicklung |
| Semesterticket | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:22-95` | Bilddatei `semester_ticket.dat` im Dokumentenverzeichnis der App, unverschlüsselt per `File.writeAsBytes` abgelegt | Lokale Bildhaltung übernehmenswert; unverschlüsselte Ablage eines Fahrausweises nicht übernehmenswert, siehe Capability `security-and-privacy` |
| Semesterticket (Android) | `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/TicketUtil.java`, dokumentiert als N-003 in `specs/product/legacy-inventory.md` | Ticket-PDF liegt unverschlüsselt im externen, app-fremd zugreifbaren App-Verzeichnis — ein weitergehender Mangel als bei der Flutter-App | Bestätigt und verschärft den bereits über die Flutter-App begründeten Befund; ändert nichts am Requirement „Verschlüsselte Ablage des Semesterticket-Bilds“, macht es aber dringlicher |
| Zugangsdaten Notenportal (ODS) | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/viewmodels/login_page_viewmodel.dart:34-39`, `.../lib/areas/ods/repositories/ods_repository.dart:14-19` | Zugangsdaten liegen im verschlüsselten Systemspeicher (`FlutterSecureStorage`), aber im Klartext und werden bei jedem Tokenablauf erneut an den Server gesendet | Für die Neuentwicklung ausgeschlossen — siehe Capability `identity-and-moderation`, Capability `security-and-privacy` |
| Zugangsdaten Hochschulportal (Android) | `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/UserCredentialsHelper.java`, `util/Cryptography.java`, dokumentiert in Capability `integrations` (INT-017) | Analoges Muster für den (ausgeschlossenen) automatischen Ticket-Bezug: Android-Keystore-verschlüsselt, aber reversibel und bei jedem Sitzungsablauf erneut versandt | Bestätigt dasselbe Altmuster für einen zweiten Zweck (Ticket statt Noten); dieselbe Ausschlussentscheidung gilt, siehe Capability `semester-ticket` |

Fachliche Bedeutung der acht Einstellungsschlüssel aus `app_constants.dart`, für Capability `settings` zu übernehmen:

| Schlüssel (Alt-App) | Fachliche Bedeutung |
|---|---|
| `goToCurrentDayInSchedule` | Beim Öffnen des Stundenplans automatisch zum aktuellen Wochentag springen |
| `increaseDisplayBrightnessInTicketView` | Bildschirmhelligkeit in der Ticketansicht erhöhen |
| `notificationOnNews` | Push-Benachrichtigungen bei neuen News aktiviert |
| `settingsEnabledCanteenIds` | Auswahl der angezeigten Mensen |
| `pinnedNewsItems` | Vom Nutzer angepinnte News-Meldungen |
| `privacyPolicyAccepted` | Zustimmung zur Datenschutzerklärung erteilt |
| `privacyPolicyAcceptedVersion` | Version der zuletzt akzeptierten Datenschutzerklärung |
| `quickActionTicket` | Betriebssystem-Schnellzugriff auf die Ticketansicht |

## Zwischenspeicher-Regeln

| Datenart | Gültigkeitsdauer | Quelle der Regel |
|---|---|---|
| Speisepläne | bis Tagesende, mit manueller Aktualisierung durch Herunterziehen (Capability `canteen`, Capability `ux-and-theming`) | Mensa-Feed, Cache-Regel-Vorschlag |
| Öffnungszeiten, Gerichtskategorien, Zusatzstoffverzeichnis | ein Tag | Mensa-Feed, ändern sich selten |
| News | 15 Minuten | News-Quellen, Cache-Regel-Vorschlag |
| Raumtermine | 15 Minuten | Hochschulsystem über eigenes Backend, gekoppelt an das Abrufintervall des Backends |
| Ferngepflegte Stammdaten (Mensen, Räume, Links, Semestertermine) | ein Tag, mit Ausgangsbestand aus dem Anwendungspaket als Rückfall | Capability `backend-and-api` |
| Events | ein Tag | ICS-Kalender über eigenes Backend |
| E-Key-Status | 15 Minuten | E-Key-Verwaltungstool über eigenes Backend |
| Wiki-Inhalte | ein Tag, mit manueller Aktualisierung | BookStack, Cache-Regel-Vorschlag, unter Vorbehalt der Spike-Verifikation |

Solange kein Netzzugriff besteht und der Zwischenspeicher einer Datenart abgelaufen ist, zeigt die App die zuletzt geladenen Daten mit einem sichtbaren Hinweis auf ihr Alter statt einer Leeransicht. Obergrenze für den gesamten Zwischenspeicher: 50 MB je Gerät (Arbeitsziel, siehe Abschnitt „Offene Fragen“).

## Offline-Warteschlange für Schreibvorgänge

Betrifft Mensa-Bewertungen, Helfer-Anmeldungen, Besetzt-Meldungen der Raumsuche und die E-Key-Schreibvorgänge Verloren-Melden und semesterweise Bestätigen. Ausdrücklich nicht betroffen sind Verwaltungs- und Moderationshandlungen, die Kontolöschung sowie die E-Key-Verknüpfung (kann zwischenzeitlich bereits mit einem anderen Konto verknüpft worden sein, siehe Capability `architecture`, Erläuterung zum Requirement „Ablehnung bei zustandsabhängigen Schreibvorgängen“) — sie hängen von einem serverseitigen Zustand ab, der sich bis zur Übertragung ändern kann, und werden bei fehlender Verbindung abgelehnt statt eingereiht. Reihenfolge: Übertragung in Entstehungsreihenfolge (FIFO). Wiederholversuche: mit steigendem Abstand (Backoff), Obergrenze zu bestätigen im Zuge der Capability `backend-and-api`. Verfallsfrist: ein Eintrag, der auch nach der maximalen Anzahl Versuche nicht übertragen werden konnte, verfällt nach 7 Tagen (vorgeschlagen, zu bestätigen) und wird der Nutzerin zur manuellen Entscheidung vorgelegt. Sichtbarkeit: die Warteschlange und ihr Status sind für die Nutzerin einsehbar, nicht nur im Hintergrund. Wiederholungen dürfen keine doppelten Wirkungen erzeugen — die Idempotenz von Schreibvorgängen ist Anforderung der Capability `backend-and-api`, nicht dieser Capability.

## Migration

Es gibt keine Datenübernahme aus den Alt-Apps. Gründe: andere Plattform (Flutter/iOS bzw. natives Android ohne Quellcode → React Native), andere Speicherformate (`JsonStore`/`SharedPreferences`/Dateisystem vs. die Persistenzschicht der Neuentwicklung) und ein geringer Nutzen gegenüber dem Aufwand einer Übernahme für zwei technisch getrennte Alt-Bestände, von denen einer nicht einmal im Quellcode vorliegt.

## Löschkonzept

„Alle lokalen Daten löschen“ ist eine Nutzeraktion, die sämtliche in der Datenklassen-Übersicht gelisteten Datenklassen vom Gerät entfernt. Bei Deinstallation entfernt das Betriebssystem alle App-eigenen Daten automatisch, sofern die App keine Daten außerhalb ihres eigenen Speicherbereichs ablegt. Löschung serverseitig gespeicherter personenbezogener Daten (Konto, Bewertungen, Helfer-Anmeldungen) ist Sache der Capability `identity-and-moderation`, nicht dieser Capability.

## Offene Fragen

- Genauer Wert der Obergrenze des Gesamtspeicherverbrauchs (50 MB) gilt als Arbeitsziel, zu validieren anhand realer Wiki- und Ticketbildgrößen im ersten Betrieb; Anpassung nach dieser Validierung bleibt möglich, ohne dass das Requirement selbst entfällt.
- Gültigkeitsdauer der Raumbelegung im Gerätecache: gekoppelt an das vorgeschlagene Aggregationsintervall des eigenen Backends von 15 Minuten (Capability `room-finder`) — Vorschlag ebenfalls 15 Minuten, zu bestätigen sobald der Backend-Betrieb steht.
- Obergrenze und Backoff-Parameter der Offline-Warteschlange: 7 Tage Verfallsfrist gilt als Arbeitsziel, zu validieren im ersten Betrieb.
