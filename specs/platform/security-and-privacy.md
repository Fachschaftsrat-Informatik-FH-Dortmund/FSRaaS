---
id: security-and-privacy
titel: Sicherheit und Datenschutz
praefix: SEC
status: accepted
version: 1.0.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/main_view_model.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/viewmodels/canteen_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/assets/privacy
implemented_in: []
related:
  - data-and-storage.md
  - identity-and-moderation.md
  - backend-and-api.md
  - integrations.md
  - ../features/canteen-ratings/spec.md
  - ../features/event-volunteers/spec.md
  - ../features/settings/spec.md
  - ../features/e-key/spec.md
  - ../features/room-finder/spec.md
  - ../features/schedule/spec.md
---

# Sicherheit und Datenschutz

## 1. Zweck und Schutzziele

Die Neuentwicklung wandelt einen reinen Lese-Client in eine Anwendung mit nutzergenerierten Inhalten, personenbezogenen Daten und Schreibpfaden. Dieses Dokument legt fest, was dabei geschützt wird und welche Befunde aus der Alt-App nicht wiederholt werden dürfen.

| Schutzziel | Konkret zu schützen |
|---|---|
| Vertraulichkeit | Zugangsdaten/Sitzungsmerkmale, Semesterticket-Bild, Klarnamen und Kontaktwege aus Helfer-Anmeldungen, Konto-Kennungen (SSO/E-Mail) |
| Integrität | Bewertungen, Stundenplandaten, Helferbedarf-Zusagen — keine unbemerkte Verfälschung oder doppelte Übertragung |
| Verfügbarkeit je Bereich | Ausfall eines Fremdsystems (siehe `integrations.md`) darf nur den betroffenen Bereich beeinträchtigen, nie die ganze App — siehe `non-functional.md` |
| Nachvollziehbarkeit ohne Personenbezug | Protokolle erlauben Fehleranalyse, ohne personenbezogene Inhalte offenzulegen |

## 2. Befunde aus den Alt-Apps, die nicht wiederholt werden dürfen

### 2.1 Befunde aus der Android-Alt-App (2026-08-25)

Die Android-Alt-App ist im Funktionsumfang der zu übertreffende Stand (`../product/legacy-inventory.md` Abschnitt 4), enthält sicherheitlich aber vier Befunde, die nicht übernommen werden. Vollständige Mängelliste dort unter 4.5.

| Befund | Quelle | Konsequenz für die Neuentwicklung |
|---|---|---|
| Hochschul-Zugangsdaten werden geräteseitig vorgehalten und von einem Hintergrund-Worker wiederholt erneut gesendet, um das Semesterticket zu beziehen | `alte apps/android-fb4/…/util/UserCredentialsHelper.java`, `worker/TicketDownloadWorker.java` | Passwort-Replay bleibt ausgeschlossen, siehe SEC-F-040 und INT-017; der automatische Ticket-Bezug entfällt zugunsten des manuellen Imports |
| Der Stundenplandienst wird über `http://` aufgerufen, obwohl `https://` funktioniert (live geprüft 2026-08-25) | `alte apps/android-fb4/…/module/NetworkModule.java` | TLS ausnahmslos, siehe SEC-N-030 |
| Das Ticket-PDF liegt unverschlüsselt im externen App-Verzeichnis | `alte apps/android-fb4/…/util/TicketUtil.java` | Verschlüsselte Ablage im App-eigenen Bereich, siehe DATA-F-040 und DATA-F-170 |
| Absturzberichte und Nutzungsereignisse gehen an einen Drittanbieterdienst | `alte apps/android-fb4/…/util/FirebaseAnalyticsEvents.java` | Nicht übernehmen, siehe SEC-F-125; zusätzlich unvereinbar mit NFR-N-170 |

Ein Befund ist ausdrücklich **positiv** und wird übernommen: Die Android-Alt-App löst das Problem ungültiger Hochschulzertifikate, indem sie deren Aussteller als zusätzlichen Vertrauensanker mitliefert (`util/AdditionalKeyStoresSSLSocketFactory.java`, `assets/fh.cer`), statt die Prüfung abzuschalten. Damit ist zugleich der bislang unbestätigte Befund M-013 aus der Flutter-App geklärt: Das Zertifikatsproblem der FH ist real, hat aber eine Lösung, die die Prüfung intakt lässt. Aufgenommen als SEC-N-105.

### 2.2 Befunde aus der Flutter-Alt-App

| Befund | Quelle | Konsequenz für die Neuentwicklung |
|---|---|---|
| Datenschutz-Gate wirkungslos: `shouldShowPrivacyPolicy` wird korrekt aus Einstellung und Versionsvergleich ermittelt und unmittelbar danach fest auf `false` überschrieben | `alte apps/fb4_app-main/fb4_app-main/lib/main_view_model.dart:8-22` (Überschreibung in Zeile 22) | Wirksames, versioniertes Zustimmungs-Gate erforderlich, siehe SEC-F-010 |
| Unverschlüsselter Abruf des Mensa-Endpunkts über `http://` | INT-004 in `integrations.md` | TLS ausnahmslos erzwingen, siehe SEC-N-030 |
| Zugangsdaten zum Notenportal im Klartext im Secure Storage, bei jedem Tokenablauf erneut gesendet | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart:14-19` | Für die Neuentwicklung ausgeschlossen; SSO oder offizielle Schnittstelle statt Passwort-Replay, siehe SEC-F-040, INT-006 |
| Fest verdrahtete interne IP-Adresse `10.11.15.121` im Anmeldeformular | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart:11` | Zielsysteme über Konfiguration ansprechen, keine internen Adressen im Quellcode, siehe SEC-F-050 |
| Semesterticket unverschlüsselt im Dateisystem der App | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82-89` | Verschlüsselte Ablage bereits als DATA-F-040 gefordert; hier nur als Sicherheitsbefund geführt |
| Stillschweigend verschluckte Fehler: `try`-Block mit leerem `finally`, ohne `catch` | `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/viewmodels/canteen_overview_viewmodel.dart:60-66` | Fehler müssen behandelt oder protokolliert werden, dürfen nie stillschweigend verschwinden, siehe SEC-F-060 |

## 3. Verarbeitungsverzeichnis (personenbezogene Daten)

Nutzergenerierte Inhalte und personenbezogene Daten sind gegenüber dem Bestand neu; die Alt-App sammelte laut ihrer Datenschutzerklärung keine personenbezogenen Daten (siehe Abschnitt 4).

| Datenart | Zweck | Rechtsgrundlage | Empfänger | Speicherdauer | Betroffene Feature-Spec |
|---|---|---|---|---|---|
| Helfer-Anmeldung (Name, Kontaktweg) | Koordination von Helferbedarf bei FSR-Events | Einwilligung | Eigenes Backend (INT-008), FSR-Eventorganisation | 30 Tage nach Eventende, danach Löschung (`identity-and-moderation.md`, IDENT-N-020) | `features/event-volunteers/spec.md` |
| Konto (SSO-Kennung oder E-Mail-Adresse, siehe INT-012) | Anmeldung für das Verfassen von Bewertungen und für die E-Key-Verwaltung | Einwilligung | Eigenes Backend (INT-008), ggf. Hochschul-SSO-Dienst | bis Löschung durch Nutzerin, siehe `identity-and-moderation.md` IDENT-F-130 | `platform/identity-and-moderation.md`, `features/canteen-ratings/spec.md`, `features/e-key/spec.md` |
| Bewertung (Konto-Referenz, angezeigtes Pseudonym, Sternebewertung, optionaler Kommentar) | Community-Bewertung von Mensa-Gerichten | Einwilligung | Eigenes Backend (INT-008), andere Nutzerinnen (Anzeige nur des Pseudonyms) | dauerhaft bis Löschung durch Nutzerin, siehe `identity-and-moderation.md` | `features/canteen-ratings/spec.md` |
| Push-Kennung, iOS (Firebase-Geräte-ID) | Zustellung von Push-Benachrichtigungen | Einwilligung (Opt-in) | Google/Firebase als Bridge zu Apple/APNs (INT-005) | bis Abmeldung vom Thema bzw. Firebase-Standardfristen | `features/news/spec.md`, `features/settings/spec.md` |
| Push-Endpunkt, Android (UnifiedPush-Endpunkt-URL) | Zustellung von Push-Benachrichtigungen | Einwilligung (Opt-in) | Eigenes Backend (INT-008) sowie der von der Nutzerin gewählte Distributor (INT-005) | bis Abmeldung, danach Löschung des Endpunkts | `features/news/spec.md`, `features/settings/spec.md` |
| Push-Kennung bei Helfer-Anmeldung | Benachrichtigung angemeldeter Helfender bei Absage eines Events (HELFER-F-060) | Einwilligung | Eigenes Backend (INT-008), Zustellweg wie oben | mit der zugehörigen Anmeldung, spätestens 30 Tage nach Eventende | `features/event-volunteers/spec.md` |
| Konto- und Rollenverwaltung (Kennung, E-Mail-Adresse, Gruppenzugehörigkeit) | Anmeldung und Rollenprüfung für Bewertungen, E-Key und Verwaltung | Einwilligung | Eigenbetriebene Authentik-Instanz (INT-012); bei aktiver Federation zusätzlich der Microsoft-Mandant der FH Dortmund | bis Löschung durch Nutzerin, siehe IDENT-F-130 | `platform/identity-and-moderation.md`, `features/admin/spec.md` |
| Verwaltungsprotokoll (Zeitpunkt, handelndes Konto, betroffener Datensatz) | Nachvollziehbarkeit von Redaktions- und Moderationshandlungen über den Wechsel der FSR-Besetzung hinweg | Berechtigtes Interesse | Eigenes Backend (INT-008), Zugriff auf Rolle FSR-Redaktion beschränkt | 12 Monate (ADMIN-N-020) | `features/admin/spec.md` |
| Zugriff auf den Gerätekalender (Schreibzugriff) | Übertragen ausgewählter Stundenplan-Termine in einen von der Nutzerin gewählten Kalender | Einwilligung | Verbleibt auf dem Gerät, keine Übermittlung an das Backend oder Dritte | nicht zutreffend, kein Datenbestand beim Verantwortlichen | `features/schedule/spec.md` |
| Technische Protokolle des Backends (z. B. IP-Adresse, Zeitstempel, aufgerufener Endpunkt) | Betrieb, Fehleranalyse, Missbrauchserkennung | Berechtigtes Interesse | Eigener Backend-Betrieb (INT-008) | 30 Tage (Arbeitsziel, siehe Abschnitt 9) | `backend-and-api.md` |
| E-Key-Verknüpfung, App-seitig (E-Key-Nummer-Referenz, Konto-Referenz, zwischengespeicherter Status/Berechtigungen, Bestätigungs-Zeitstempel) | Anzeige von Status/Berechtigungen in der App | Einwilligung | Eigenes Backend (INT-008) | Bis Löschung durch Nutzerin (Konto-Löschung, IDENT-F-130) | `features/e-key/spec.md` |
| E-Key-Stammdaten (E-Key-Nummer, Matrikelnummer, Berechtigungen) | Verwaltung des vom FSR verliehenen physischen Zugangsschlüssels | Einwilligung | Bestehendes E-Key-Verwaltungstool des FSR (INT-014, außerhalb der Datenhoheit dieser App) | Verwaltet durch das bestehende Tool/FSR-Mitglieder, nicht durch diese App | `features/e-key/spec.md` |

## 4. Datenschutzerklärung

Die Erklärung der Alt-App liegt unter `alte apps/fb4_app-main/fb4_app-main/assets/privacy`. Sie beschreibt fünf Themen: keine Sammlung persönlicher Daten, Übermittlung der Stundenplan-Formulardaten an die FBWS-API ohne Identifizierbarkeit, lokale und nie übertragene Gruppenkennung, ODS-Zugangsdaten nur lokal in der iOS Keychain, sowie OpenMensa- und Firebase-Cloud-Messaging-Hinweise.

| Abschnitt der Alt-Erklärung | Status für die Neuentwicklung |
|---|---|
| Keine Sammlung persönlicher Daten (allgemeine Aussage) | entfällt als Gesamtaussage — die neue App sammelt personenbezogene Daten, siehe Abschnitt 3 |
| Übermittlung an FBWS-API für Stundenplan | inhaltlich übernehmbar, Formulierung an neuen Backend-Vermittler (INT-002/INT-008) anzupassen |
| Gruppenkennung nie übertragen, nur lokal | inhaltlich übernehmbar unverändert |
| ODS-Zugangsdaten | entfällt vollständig zugunsten von HISinOne (INT-006, `decisions/0006-abloesung-ods-durch-hisinone.md`) |
| Mensa/OpenMensa | neu zu formulieren: Abruf läuft über das eigene Backend (INT-008), nicht mehr direkt vom Gerät |
| Firebase Cloud Messaging | inhaltlich übernehmbar, sofern INT-005 unverändert fortgeführt wird |
| Bewertungen, Events, Helfer-Anmeldungen, eigenes Backend allgemein | vollständig neu zu schreiben, kein Vorbild in der Alt-Erklärung |

## 5. Berechtigungen auf dem Gerät

| Berechtigung | Wofür | Anforderung |
|---|---|---|
| Dateiauswahl | Import des Semesterticket-PDFs (TICKET-F-010) | vorhanden in beiden Alt-Apps |
| Benachrichtigungen | Lieblingsgericht-Hinweis (MENSA-F-100, rein lokal) sowie Push (INT-005, zweite Ausbaustufe) | Opt-in |
| Kalender, ausschließlich schreibend | Übertragen ausgewählter Stundenplan-Termine in einen gewählten Gerätekalender (SCHED-F-175) | Opt-in, erst bei tatsächlicher Nutzung anzufragen (SEC-F-080) |
| Standort | – | wird nicht benötigt und nicht angefragt; die Raumsuche arbeitet mit manueller Referenzraum-Eingabe (RAUM-F-050) |

**Korrektur vom 2026-08-25 zum Kalenderzugriff.** Abschnitt 9 hielt am selben Tag fest, es werde keine Kalenderberechtigung benötigt, weil der iCal-Export nur eine Datei erzeuge. Die anschließende Auswertung des Android-Quellcodes zeigt, dass die Android-Alt-App Termine direkt in einen von der Nutzerin gewählten Gerätekalender schreibt (`READ_CALENDAR`/`WRITE_CALENDAR`, `dialog/CalendarExportDialog.java`) und damit über den zuvor angenommenen Umfang hinausgeht. Entscheidung FSR FB4, 2026-08-25: Der Schreibzugriff wird aufgenommen, der Datei-Export bleibt als Rückfallweg bestehen. Lesezugriff auf bestehende Kalendereinträge bleibt ausgeschlossen — die Berechtigung wird ausschließlich zum Anlegen eigener Einträge und zum Auflisten der verfügbaren Zielkalender genutzt, nicht zum Auswerten fremder Termine.

## 6. Transportsicherheit, Geheimnisse, Protokollierung

Alle Netzaufrufe laufen über TLS mit ungeprüfter Zertifikatsvalidierung im Produktivbuild; eine Deaktivierung der Prüfung ist ausgeschlossen. Hinweis zur Prüfung: `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart:7` enthält einen Codekommentar, der eine Ignorierung von Zertifikatsvertrauen nahelegt; im Code selbst wurde keine tatsächliche Zertifikatsumgehung gefunden (kein `badCertificateCallback`, kein `HttpOverrides` im gesamten `lib`-Verzeichnis). Der Kommentar ist damit kein bestätigter Befund, aber ein Hinweis, die Zertifikatsprüfung in der Neuentwicklung ausdrücklich zu testen. Geheimnisse (API-Token, Schlüssel) dürfen nicht im Klartext im Quellcode oder Repository liegen, sondern werden über einen gesicherten Build- oder Laufzeitmechanismus bereitgestellt. Protokolle enthalten keine personenbezogenen Inhalte wie Klartext-Zugangsdaten oder vollständige Nutzerbeiträge.

## 7. Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SEC-F-010 | Das System muss vor der Nutzung von Funktionen mit personenbezogenen oder nutzergenerierten Daten eine wirksame, versionierte Einwilligung zur Datenschutzerklärung einholen. | Alt: bewusst verworfen |
| SEC-F-020 | Wenn sich der Inhalt der Datenschutzerklärung inhaltlich ändert, muss das System die Einwilligung erneut einholen, bevor betroffene Funktionen weiter genutzt werden können. | NEU |
| SEC-N-030 | Das System muss alle Netzwerkabrufe ausschließlich über TLS (https://) durchführen, ausnahmslos. | Alt: bewusst verworfen |
| SEC-F-040 | Das System muss für die Anbindung an Notenportale SSO oder eine offizielle Schnittstellen-Authentifizierung verwenden, statt Zugangsdaten der Nutzerin zwischenzuspeichern und bei Tokenablauf erneut zu senden. | Alt: bewusst verworfen |
| SEC-F-050 | Das System muss Zielsysteme ausschließlich über Konfiguration ansprechen, nicht über fest im Quellcode verdrahtete interne Adressen. | Alt: bewusst verworfen |
| SEC-F-060 | Falls ein Fehler beim Lesen oder Schreiben lokaler oder entfernter Daten auftritt, muss das System ihn behandeln oder protokollieren; er darf nicht stillschweigend verschwinden. | Alt: bewusst verworfen |
| SEC-F-070 | Das System muss für jede Verarbeitung personenbezogener Daten aus dem Verarbeitungsverzeichnis (Abschnitt 3) Zweck, Rechtsgrundlage und Speicherdauer in der Datenschutzerklärung ausweisen. | NEU |
| SEC-F-080 | Das System muss jede Systemberechtigung erst im Moment ihres tatsächlichen Bedarfs mit einer für die Nutzerin verständlichen Begründung anfragen. | NEU |
| SEC-F-090 | Falls eine optionale Systemberechtigung nicht erteilt wird, muss das System ohne diese Berechtigung nutzbar bleiben, mit eingeschränkter Funktionalität nur im betroffenen Bereich. | NEU |
| SEC-N-100 | Das System muss TLS-Zertifikate der aufgerufenen Server ohne Ausnahme validieren; eine Deaktivierung der Zertifikatsprüfung ist im Produktivbuild ausgeschlossen. | NEU |
| SEC-N-105 | Sofern ein Hochschulsystem ein Zertifikat verwendet, dem die Systemvertrauensliste nicht folgt, muss das System dessen Aussteller als zusätzlichen Vertrauensanker aufnehmen, statt die Prüfung abzuschalten oder abzuschwächen. | Recherche: alte apps/android-fb4, util/AdditionalKeyStoresSSLSocketFactory.java, 2026-08-25 |
| SEC-F-125 | Das System muss darauf verzichten, Absturzberichte oder Nutzungsereignisse an Dritte zu übermitteln. | Alt: bewusst verworfen |
| SEC-N-110 | Das System muss Geheimnisse (API-Token, Schlüssel) über einen gesicherten Build- oder Laufzeitmechanismus bereitstellen, niemals im Klartext im Quellcode. | NEU |
| SEC-N-120 | Das System muss Protokolle so gestalten, dass sie keine personenbezogenen Inhalte enthalten. | NEU |

## 8. Bewusst nicht übernommenes Altverhalten

- Wirkungsloses, fest deaktiviertes Datenschutz-Gate — Grund: verstößt gegen die Einwilligungspflicht, siehe SEC-F-010.
- Unverschlüsselter Mensa-Abruf über `http://` — Grund: überträgt Anfragedaten im Klartext, siehe SEC-N-030.
- Passwort-Replay am Notenportal — Grund: unsicheres Verfahren, durch SSO/offizielle Schnittstelle ersetzt, siehe SEC-F-040.
- Fest verdrahtete interne IP-Adresse — Grund: Betriebsdetail gehört nicht in den Quellcode, siehe SEC-F-050.
- Stillschweigend verschluckte Fehler beim Lesen von Einstellungen — Grund: verdeckt Fehlerzustände, siehe SEC-F-060.

## 9. Offene Fragen

- Speicherdauer und Löschfrist von Helfer-Anmeldungen nach Zweckerfüllung des Events: bereits durch `identity-and-moderation.md` (IDENT-N-020, 30 Tage nach Eventende) beantwortet; das Verarbeitungsverzeichnis in Abschnitt 3 wurde entsprechend aktualisiert, keine offene Frage mehr.
- Aufbewahrungsdauer technischer Backend-Protokolle: 30 Tage als Arbeitsziel, zu validieren im ersten Betrieb.
- ~~Geklärt (FSR FB4, 2026-08-25): Weder Kalender- noch Standort-Geräteberechtigung wird für den aktuellen Umfang benötigt.~~ **Teilweise revidiert am selben Tag** nach Auswertung des Android-Quellcodes: Für den Standort gilt die Aussage unverändert — die Raumsuche ermittelt Nähe über eine manuelle Referenzraum-Eingabe und serverseitige Laufwege-Daten statt GPS (`features/room-finder/spec.md` RAUM-F-050/060). Für den Kalender gilt sie nicht mehr: Schreibzugriff wird aufgenommen, siehe Abschnitt 5 und `features/schedule/spec.md` SCHED-F-175.
- Geklärt (FSR FB4, 2026-08-25): Speicherdauer und Löschfrist der E-Key-Stammdaten (E-Key-Nummer, Matrikelnummer, Berechtigungen) liegen in der Verantwortung des bestehenden E-Key-Verwaltungstools (INT-014) und der FSR-Mitglieder, außerhalb der Datenhoheit dieser App. Die App-seitige Verknüpfung (Konto-Referenz) unterliegt der regulären Konto-Löschung (IDENT-F-130).
