---
id: data-and-storage
titel: Daten und Persistenz
praefix: DATA
status: accepted
version: 0.5.2
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/core/settings/settings_service.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/viewmodels/login_page_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart
implemented_in:
  - app/src/cache           # DATA-F-080, DATA-N-150
  - app/src/ui/state        # DATA-F-090 (Altershinweis, Test: AsyncStates.test.tsx)
  - app/src/state           # Zwischenspeicher-Persistenz (ADR 0013)
  - app/src/auth            # DATA-F-120, DATA-F-130 (Sitzungsmerkmal im gesicherten Systemspeicher, Entfernen bei Abmeldung)
  - app/src/areas/canteen   # DATA-F-070 (Speiseplan-Zwischenspeicher je Mensa/Tag), Lieblingsgerichte-Liste (Schlüssel favoriteDishes), Mensaauswahl/-reihenfolge (Schlüssel selectedCanteens)
related:
  - backend-and-api.md
  - security-and-privacy.md
  - identity-and-moderation.md
  - integrations.md
  - ../features/schedule/spec.md
  - ../features/semester-ticket/spec.md
  - ../features/settings/spec.md
  - ../features/news/spec.md
  - ../features/canteen-ratings/spec.md
  - ../features/canteen-photos/spec.md
  - ../features/event-volunteers/spec.md
---

# Daten und Persistenz

## 1. Zweck

Dieses Dokument legt fest, welche Datenklassen die App verarbeitet, wo sie liegen, wie lange sie gelten und wie sie gelöscht werden. Es gilt geräteweit für alle Features; Feature-Specs verweisen hierher statt Regeln zu wiederholen. Endpunktdetails der Datenquellen stehen in `integrations.md` (INT-###), Auth-Mechanik in `identity-and-moderation.md` (IDENT), Schutzmaßnahmen in `security-and-privacy.md` (SEC).

## 2. Datenklassen

| Datenklasse | Speicherort | Verschlüsselung | Lebensdauer | Löschweg | Personenbezogen |
|---|---|---|---|---|---|
| Stundenplan der Nutzerin | lokal, Gerät | nein | dauerhaft, bis manuell geändert | Bearbeitung im Stundenplan; „Alle lokalen Daten löschen" | ja (Kursauswahl, optionale Gruppenkennung) |
| Semesterticket-Bild | lokal, Gerät | ja, verpflichtend | dauerhaft, bis neues Ticket hinterlegt oder gelöscht | „Ticket löschen"; „Alle lokalen Daten löschen" | ja (Fahrausweis) |
| Einstellungen | lokal, Gerät | nein | dauerhaft | „Alle lokalen Daten löschen"; Deinstallation | überwiegend nein |
| Angepinnte News | lokal, Gerät | nein | dauerhaft, bis entpinnt | manuell entpinnen; „Alle lokalen Daten löschen" | nein |
| Benachrichtigungsregeln für News (Positiv-/Sperrliste) | lokal, Gerät | nein | dauerhaft, bis geändert | Regel entfernen; „Alle lokalen Daten löschen" | ja (Regelinhalte können auf Interessen oder belegte Fächer hindeuten); ausschließlich geräteseitig, keine Übermittlung |
| Zwischengespeicherte Fremddaten (Speisepläne, News, Raumbelegung, Wiki-Inhalte) | lokal, Gerät | nein | begrenzt, siehe Abschnitt 4 | automatischer Ablauf; „Alle lokalen Daten löschen" | nein |
| Lieblingsgerichte (abgeleitet aus den eigenen Höchstbewertungen) | lokal, Gerät — abgeleitet aus serverseitigen Bewertungen | nein | dauerhaft, bis die zugrunde liegende Bewertung geändert oder gelöscht wird | eigene Bewertung herabsetzen oder löschen (`../features/canteen-ratings/spec.md` RATE-F-070); „Alle lokalen Daten löschen" | ja (Ernährungsvorlieben); seit 2026-09-04 **nicht mehr rein gerätelokal**, da die Höchstbewertung serverseitig liegt, siehe `../features/canteen/spec.md` MENSA-F-085/F-090 |
| Gerätelokale Spiegelung der eigenen Bewertungen | lokal, Gerät | nein | bis Abmeldung oder nächster Abgleich | Abmeldung; „Alle lokalen Daten löschen" | ja (Ernährungsvorlieben), siehe `../features/canteen-ratings/spec.md` RATE-F-100 |
| Unverträglichkeiten-Filter (Mensaplan) | lokal, Gerät | nein | dauerhaft, bis geändert | Kennzeichnung entfernen; „Alle lokalen Daten löschen" | ja, besondere Kategorie nach Art. 9 DSGVO (Gesundheitsangabe); ausschließlich geräteseitig, keine Übermittlung, siehe `../features/canteen/spec.md` MENSA-F-170 bis F-215 |
| Gerichtsfotos (hochgeladen) | serverseitig, Ablagebereich des Backends | nein (öffentlich sichtbarer Inhalt); Metadaten vor Übertragung entfernt | dauerhaft, bis Löschung durch die hochladende Person, Moderation oder Kontolöschung | eigenes Foto löschen; Moderationsentscheidung; Kontolöschung (`../features/canteen-photos/spec.md` FOTO-F-100/F-160) | ja (Beitrag ist einem Konto zugeordnet), siehe `../features/canteen-photos/spec.md` |
| Prüfungsauswahl und Wahlpflicht-Planungsauswahl | lokal, Gerät | nein | dauerhaft, bis geändert | Bearbeitung im Stundenplan; „Alle lokalen Daten löschen" | ja (Studienverlauf) |
| Ferngepflegte Stammdaten (Mensen, Räume, Links, Semestertermine) | lokal, Gerät | nein | bis zur nächsten Aktualisierung; Ausgangsbestand aus dem Anwendungspaket als Rückfall | automatischer Ersatz bei Aktualisierung; „Alle lokalen Daten löschen" | nein |
| Offline-Warteschlange (Bewertungen, Helfer-Anmeldungen, Besetzt-Meldungen, E-Key-Schreibvorgänge) | lokal, Gerät | nein, außer personenbezogene Helfer- und E-Key-Angaben: ja | bis Übertragung oder Verfall, siehe Abschnitt 5 | automatisch nach Übertragung; Verfall; „Alle lokalen Daten löschen" | ja bei Helfer-Anmeldungen und E-Key-Verknüpfung |
| Zugangsdaten bzw. Sitzungsmerkmal | lokal, Gerät, gesicherter Systemspeicher | ja, verpflichtend | bis Abmeldung oder Sitzungsablauf | Abmeldung; „Alle lokalen Daten löschen" | ja |

## 3. Verhalten der Alt-App

Grundlage ist überwiegend die Flutter/iOS-Alt-App. **Ergänzung 2026-08-25/26:** Der Android-Quellcode liegt inzwischen ebenfalls vor (`alte apps/android-fb4/`, siehe `product/legacy-inventory.md` Abschnitt 4); die folgende Tabelle nennt dort, wo der Android-Befund die Bewertung bestätigt oder ergänzt.

| Bereich | Quelle | Befund | Bewertung |
|---|---|---|---|
| Stundenplan | `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:93-152` | Lokale Datenbank über fünf Einträge, Schlüsselmuster `schedule-<Wochentag>`; je Wochentag eine Abbildung von Hashwert auf Termin (Zeile 105-121, 154-167) | Lokale Haltung übernehmenswert. Bei einer unerwarteten Eintragsanzahl (Zeile 136-147) wird der gesamte Bestand kommentarlos gelöscht und neu angelegt — Datenverlust ohne Rückfrage, nicht übernehmenswert |
| Einstellungen | `alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:19-35`, `.../lib/core/settings/settings_service.dart:7-42` | Einfache Schlüssel-Wert-Ablage über `SharedPreferences`, acht fachliche Schlüssel (siehe Tabelle unten) | Fachliche Bedeutung der Schlüssel übernehmenswert; konkretes Speicherformat ist Sache der Neuentwicklung |
| Semesterticket | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:22-95` | Bilddatei `semester_ticket.dat` im Dokumentenverzeichnis der App, unverschlüsselt per `File.writeAsBytes` abgelegt | Lokale Bildhaltung übernehmenswert; unverschlüsselte Ablage eines Fahrausweises nicht übernehmenswert, siehe SEC |
| Semesterticket (Android) | `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/TicketUtil.java`, dokumentiert als N-003 in `product/legacy-inventory.md` | Ticket-PDF liegt unverschlüsselt im **externen**, app-fremd zugreifbaren App-Verzeichnis — ein weitergehender Mangel als bei der Flutter-App | Bestätigt und verschärft den bereits über die Flutter-App begründeten Befund; ändert nichts an DATA-F-040, macht die Anforderung aber dringlicher |
| Zugangsdaten Notenportal (ODS) | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/viewmodels/login_page_viewmodel.dart:34-39`, `.../lib/areas/ods/repositories/ods_repository.dart:14-19` | Zugangsdaten liegen im verschlüsselten Systemspeicher (`FlutterSecureStorage`), aber im Klartext und werden bei jedem Tokenablauf erneut an den Server gesendet | Für die Neuentwicklung ausgeschlossen — siehe `identity-and-moderation.md`, `security-and-privacy.md` |
| Zugangsdaten Hochschulportal (Android) | `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/UserCredentialsHelper.java`, `util/Cryptography.java`, dokumentiert als INT-017 in `platform/integrations.md` | Analoges Muster für den (ausgeschlossenen) automatischen Ticket-Bezug: Android-Keystore-verschlüsselt, aber reversibel und bei jedem Sitzungsablauf erneut versandt | Bestätigt dasselbe Altmuster für einen zweiten Zweck (Ticket statt Noten); dieselbe Ausschlussentscheidung gilt, siehe `features/semester-ticket/spec.md` |

Fachliche Bedeutung der acht Einstellungsschlüssel aus `app_constants.dart`, für `features/settings/spec.md` zu übernehmen:

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

## 4. Zwischenspeicher-Regeln

| Datenart | Gültigkeitsdauer | Quelle der Regel |
|---|---|---|
| Speisepläne | bis Tagesende, mit manueller Aktualisierung durch Herunterziehen (`features/canteen/spec.md` MENSA-F-240, `platform/ux-and-theming.md` UX-F-160) | INT-015, Cache-Regel-Vorschlag |
| Öffnungszeiten, Gerichtskategorien, Zusatzstoffverzeichnis | ein Tag | INT-015, ändern sich selten |
| News | 15 Minuten | INT-003/INT-010, Cache-Regel-Vorschlag |
| Raumtermine | 15 Minuten | INT-009 über INT-008, gekoppelt an das Abrufintervall des Backends |
| Ferngepflegte Stammdaten (Mensen, Räume, Links, Semestertermine) | ein Tag, mit Ausgangsbestand aus dem Anwendungspaket als Rückfall | INT-008, API-F-230/API-F-235 |
| Events | ein Tag | INT-011 über INT-008 |
| E-Key-Status | 15 Minuten | INT-014 über INT-008 |
| Wiki-Inhalte | ein Tag, mit manueller Aktualisierung | INT-007, Cache-Regel-Vorschlag, unter Vorbehalt der Spike-Verifikation |

Solange kein Netzzugriff besteht und der Zwischenspeicher einer Datenart abgelaufen ist, zeigt die App die zuletzt geladenen Daten mit einem sichtbaren Hinweis auf ihr Alter statt einer Leeransicht. Obergrenze für den gesamten Zwischenspeicher: 50 MB je Gerät (Arbeitsziel, siehe Abschnitt 9).

## 5. Offline-Warteschlange für Schreibvorgänge

Betrifft Mensa-Bewertungen (RATE), Helfer-Anmeldungen (HELFER), Besetzt-Meldungen der Raumsuche (RAUM-F-070) und die E-Key-Schreibvorgänge Verloren-Melden und semesterweise Bestätigen (EKEY). Ausdrücklich **nicht** betroffen sind Verwaltungs- und Moderationshandlungen, die Kontolöschung sowie die E-Key-Verknüpfung (EKEY-F-030 — kann zwischenzeitlich bereits mit einem anderen Konto verknüpft worden sein, siehe `architecture.md` Erläuterung zu ARCH-F-125) — sie hängen von einem serverseitigen Zustand ab, der sich bis zur Übertragung ändern kann, und werden bei fehlender Verbindung abgelehnt statt eingereiht (`architecture.md` ARCH-F-125). Reihenfolge: Übertragung in Entstehungsreihenfolge (FIFO). Wiederholversuche: mit steigendem Abstand (Backoff), Obergrenze zu bestätigen im Zuge von `backend-and-api.md`. Verfallsfrist: ein Eintrag, der auch nach der maximalen Anzahl Versuche nicht übertragen werden konnte, verfällt nach 7 Tagen (vorgeschlagen, zu bestätigen) und wird der Nutzerin zur manuellen Entscheidung vorgelegt. Sichtbarkeit: die Warteschlange und ihr Status sind für die Nutzerin einsehbar, nicht nur im Hintergrund. Wiederholungen dürfen keine doppelten Wirkungen erzeugen — die Idempotenz von Schreibvorgängen ist Anforderung von `backend-and-api.md` (API), nicht dieses Dokuments.

## 6. Migration

Es gibt keine Datenübernahme aus den Alt-Apps. Gründe: andere Plattform (Flutter/iOS bzw. natives Android ohne Quellcode → React Native), andere Speicherformate (`JsonStore`/`SharedPreferences`/Dateisystem vs. die Persistenzschicht der Neuentwicklung) und ein geringer Nutzen gegenüber dem Aufwand einer Übernahme für zwei technisch getrennte Alt-Bestände, von denen einer nicht einmal im Quellcode vorliegt.

## 7. Löschkonzept

„Alle lokalen Daten löschen" ist eine Nutzeraktion, die sämtliche in Abschnitt 2 gelisteten Datenklassen vom Gerät entfernt. Bei Deinstallation entfernt das Betriebssystem alle App-eigenen Daten automatisch, sofern die App keine Daten außerhalb ihres eigenen Speicherbereichs ablegt. Löschung serverseitig gespeicherter personenbezogener Daten (Konto, Bewertungen, Helfer-Anmeldungen) ist Sache von `identity-and-moderation.md` (IDENT), nicht dieses Dokuments.

## 8. Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| DATA-F-010 | Das System muss den Stundenplan der Nutzerin ausschließlich lokal auf dem Gerät persistent speichern. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:93 |
| DATA-F-020 | Falls beim Laden des lokal gespeicherten Stundenplans eine unerwartete oder inkonsistente Datenmenge festgestellt wird, muss das System den Fehler protokollieren und die Nutzerin informieren, statt den Bestand kommentarlos zu löschen. | Alt: bewusst verworfen |
| DATA-F-030 | Das System muss das Bild des Semestertickets lokal auf dem Gerät speichern. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82 |
| DATA-F-040 | Das System muss das gespeicherte Semesterticket-Bild verschlüsselt ablegen. | Alt: bewusst verworfen |
| DATA-F-050 | Das System muss Einstellungen lokal auf dem Gerät als persistente Schlüssel-Wert-Ablage speichern. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/core/settings/settings_service.dart:7 |
| DATA-F-060 | Das System muss angepinnte News-Meldungen lokal auf dem Gerät persistent speichern, bis die Nutzerin sie entpinnt. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 |
| DATA-F-070 | Das System muss Speisepläne je Mensa und Tag lokal zwischenspeichern, um wiederholte Netzabrufe zu vermeiden. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:9 |
| DATA-F-080 | Das System muss News-Meldungen, Raumbelegungsdaten und Wiki-Inhalte lokal mit einer je Datenart begrenzten Gültigkeitsdauer zwischenspeichern (siehe Abschnitt 4). | NEU |
| DATA-F-090 | Solange kein Netzzugriff besteht und der Zwischenspeicher einer Datenart abgelaufen ist, muss das System die zuletzt geladenen Daten mit einem sichtbaren Hinweis auf ihr Alter anzeigen statt einer Leeransicht. | NEU |
| DATA-F-100 | Das System muss ausstehende Schreibvorgänge bei fehlendem Netzzugriff in einer lokalen Warteschlange vorhalten und nach Wiederherstellung der Verbindung in Entstehungsreihenfolge übertragen. | NEU |
| DATA-F-110 | Falls ein Schreibvorgang in der Offline-Warteschlange auch nach wiederholten Versuchen dauerhaft fehlschlägt, muss das System die Nutzerin informieren und den Vorgang zur manuellen Entscheidung (erneut versuchen oder verwerfen) vorhalten. | NEU |
| DATA-F-120 | Das System muss Zugangsdaten bzw. Sitzungsmerkmale ausschließlich im gesicherten Systemspeicher des Geräts ablegen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart:9 |
| DATA-F-130 | Wenn eine aktive Sitzung beendet wird, muss das System das gespeicherte Sitzungsmerkmal aus dem gesicherten Systemspeicher entfernen. | NEU |
| DATA-F-140 | Wenn die App zum ersten Mal gestartet wird, muss das System einen Hinweis anzeigen, dass Stundenplan und Semesterticket neu angelegt werden müssen. | NEU |
| DATA-N-150 | Der Gesamtspeicherverbrauch aller Zwischenspeicher sollte eine Obergrenze von 50 MB nicht überschreiten. | NEU |
| DATA-F-160 | Das System muss eine Nutzeraktion „Alle lokalen Daten löschen" bereitstellen, die alle in Abschnitt 2 gelisteten Datenklassen vom Gerät entfernt. | NEU |
| DATA-F-170 | Das System muss alle in Abschnitt 2 gelisteten lokalen Daten ausschließlich im App-eigenen Speicherbereich ablegen, sodass eine Deinstallation sie vollständig entfernt. | NEU |
| DATA-F-180 | Das System muss die Benachrichtigungsregeln für News (Positiv- und Sperrliste, siehe `../features/news/spec.md`) ausschließlich lokal auf dem Gerät speichern und nicht an das Backend oder Dritte übertragen. | NEU |

Zu DATA-F-130: Ergänzt um die serverseitige Sitzungsinvalidierung beim Abmelden, siehe `identity-and-moderation.md` IDENT-F-140 — das lokale Entfernen allein reicht nicht aus, da ein entwendetes Token sonst serverseitig weiter gültig bliebe.

Zu DATA-F-180: Verankert `../features/news/spec.md` NEWS-F-270 auf Datenhaltungsebene. Die Auswertung der Regeln geschieht geräteseitig auf zugestellten Meldungs-Metadaten (analog zum lokalen Prüfungsplan-Abgleich, SCHED-F-220); das Backend kennt weder die Regeln noch, welche Meldung bei einer einzelnen Nutzerin eine Benachrichtigung ausgelöst hat.

## 9. Offene Fragen

- Genauer Wert von DATA-N-150 (50 MB) gilt als Arbeitsziel, zu validieren anhand realer Wiki- und Ticketbildgrößen im ersten Betrieb; Anpassung nach dieser Validierung bleibt möglich, ohne dass die Anforderung selbst entfällt.
- Gültigkeitsdauer der Raumbelegung im Gerätecache: gekoppelt an das vorgeschlagene Aggregationsintervall des eigenen Backends von 15 Minuten (`features/room-finder/spec.md` Abschnitt 13) — Vorschlag ebenfalls 15 Minuten, zu bestätigen sobald der Backend-Betrieb steht.
- Obergrenze und Backoff-Parameter der Offline-Warteschlange (Abschnitt 5): 7 Tage Verfallsfrist gilt als Arbeitsziel, zu validieren im ersten Betrieb.
