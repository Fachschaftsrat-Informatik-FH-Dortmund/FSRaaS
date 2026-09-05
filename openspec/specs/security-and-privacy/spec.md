## Purpose

Legt fest, was in der Neuentwicklung — dem Wandel eines reinen Lese-Clients zu einer Anwendung mit nutzergenerierten Inhalten, personenbezogenen Daten und Schreibpfaden — geschützt wird und welche Befunde aus den Alt-Apps nicht wiederholt werden dürfen. Vormals `specs/platform/security-and-privacy.md` (Präfix `SEC`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Wirksame, versionierte Einwilligung vor Nutzung

Das System muss vor der Nutzung von Funktionen mit personenbezogenen oder nutzergenerierten Daten eine wirksame, versionierte Einwilligung zur Datenschutzerklärung einholen. Herkunft: Alt: bewusst verworfen (vormals SEC-F-010).

#### Scenario: Erste Nutzung einer betroffenen Funktion
- **WHEN** eine Nutzerin erstmals eine Funktion mit personenbezogenen oder nutzergenerierten Daten aufruft und noch keine Einwilligung vorliegt
- **THEN** holt das System zuerst eine wirksame, versionierte Einwilligung ein, bevor die Funktion nutzbar wird

### Requirement: Erneute Einwilligung bei inhaltlicher Änderung der Erklärung

Wenn sich der Inhalt der Datenschutzerklärung inhaltlich ändert, muss das System die Einwilligung erneut einholen, bevor betroffene Funktionen weiter genutzt werden können. Herkunft: NEU (vormals SEC-F-020).

#### Scenario: Inhaltliche Änderung der Datenschutzerklärung
- **WHEN** die Datenschutzerklärung inhaltlich geändert wird und eine Nutzerin eine betroffene Funktion erneut aufruft
- **THEN** holt das System die Einwilligung erneut ein, bevor die Funktion weiter nutzbar ist

### Requirement: Ausschließlich TLS für alle Netzwerkabrufe

Das System muss alle Netzwerkabrufe ausschließlich über TLS (https://) durchführen, ausnahmslos. Herkunft: Alt: bewusst verworfen (vormals SEC-N-030).

#### Scenario: Abruf eines Fremdsystems
- **WHEN** das System einen beliebigen Netzwerkabruf durchführt, auch gegen ein Fremdsystem, das historisch über `http://` erreichbar war
- **THEN** erfolgt der Abruf ausschließlich über `https://`

### Requirement: SSO oder offizielle Schnittstelle statt Passwort-Replay bei Notenportalen

Das System muss für die Anbindung an Notenportale SSO oder eine offizielle Schnittstellen-Authentifizierung verwenden, statt Zugangsdaten der Nutzerin zwischenzuspeichern und bei Tokenablauf erneut zu senden. Herkunft: Alt: bewusst verworfen (vormals SEC-F-040).

#### Scenario: Tokenablauf bei der Notenübersicht
- **WHEN** das Zugriffstoken für ein Notenportal abläuft
- **THEN** erneuert das System den Zugriff über SSO oder die offizielle Schnittstellen-Authentifizierung, ohne zwischengespeicherte Hochschul-Zugangsdaten erneut zu senden

### Requirement: Zielsysteme nur über Konfiguration ansprechen

Das System muss Zielsysteme ausschließlich über Konfiguration ansprechen, nicht über fest im Quellcode verdrahtete interne Adressen. Herkunft: Alt: bewusst verworfen (vormals SEC-F-050).

#### Scenario: Änderung einer Zielsystem-Adresse
- **WHEN** sich die Adresse eines Zielsystems ändert
- **THEN** genügt eine Konfigurationsänderung, ohne dass eine im Quellcode verdrahtete Adresse angepasst werden muss

### Requirement: Keine stillschweigend verschwindenden Fehler

Falls ein Fehler beim Lesen oder Schreiben lokaler oder entfernter Daten auftritt, muss das System ihn behandeln oder protokollieren; er darf nicht stillschweigend verschwinden. Herkunft: Alt: bewusst verworfen (vormals SEC-F-060).

#### Scenario: Fehler beim Lesen von Einstellungen
- **WHEN** beim Lesen oder Schreiben lokaler oder entfernter Daten ein Fehler auftritt
- **THEN** behandelt oder protokolliert das System den Fehler, statt ihn zu verschlucken

### Requirement: Zweck, Rechtsgrundlage und Speicherdauer in der Datenschutzerklärung

Das System muss für jede Verarbeitung personenbezogener Daten aus dem Verarbeitungsverzeichnis Zweck, Rechtsgrundlage und Speicherdauer in der Datenschutzerklärung ausweisen. Herkunft: NEU (vormals SEC-F-070).

#### Scenario: Neue Verarbeitung personenbezogener Daten
- **WHEN** eine neue Verarbeitung personenbezogener Daten in das Verarbeitungsverzeichnis aufgenommen wird
- **THEN** weist die Datenschutzerklärung dafür Zweck, Rechtsgrundlage und Speicherdauer aus

### Requirement: Berechtigungsanfrage erst bei tatsächlichem Bedarf

Das System muss jede Systemberechtigung erst im Moment ihres tatsächlichen Bedarfs mit einer für die Nutzerin verständlichen Begründung anfragen. Herkunft: NEU (vormals SEC-F-080).

#### Scenario: Erste Nutzung einer berechtigungspflichtigen Funktion
- **WHEN** eine Nutzerin erstmals eine Funktion nutzt, die eine Systemberechtigung voraussetzt
- **THEN** fragt das System die Berechtigung in diesem Moment mit einer verständlichen Begründung an, nicht vorab

### Requirement: Nutzbarkeit ohne optionale Berechtigung

Falls eine optionale Systemberechtigung nicht erteilt wird, muss das System ohne diese Berechtigung nutzbar bleiben, mit eingeschränkter Funktionalität nur im betroffenen Bereich. Herkunft: NEU (vormals SEC-F-090).

#### Scenario: Verweigerte Berechtigung
- **WHEN** eine Nutzerin eine optionale Systemberechtigung verweigert
- **THEN** bleibt die App insgesamt nutzbar, nur der von der Berechtigung abhängige Bereich ist eingeschränkt

### Requirement: Ausnahmslose TLS-Zertifikatsvalidierung

Das System muss TLS-Zertifikate der aufgerufenen Server ohne Ausnahme validieren; eine Deaktivierung der Zertifikatsprüfung ist im Produktivbuild ausgeschlossen. Herkunft: NEU (vormals SEC-N-100).

#### Scenario: Ungültiges Zertifikat eines Servers
- **WHEN** ein aufgerufener Server ein ungültiges oder nicht vertrauenswürdiges TLS-Zertifikat vorweist
- **THEN** lehnt das System die Verbindung ab, statt die Prüfung zu umgehen

### Requirement: Zusätzlicher Vertrauensanker statt abgeschalteter Prüfung

Sofern ein Hochschulsystem ein Zertifikat verwendet, dem die Systemvertrauensliste nicht folgt, muss das System dessen Aussteller als zusätzlichen Vertrauensanker aufnehmen, statt die Prüfung abzuschalten oder abzuschwächen. Herkunft: Recherche: alte apps/android-fb4, util/AdditionalKeyStoresSSLSocketFactory.java, 2026-08-25 (vormals SEC-N-105).

#### Scenario: Hochschulsystem mit unbekanntem Zertifikatsaussteller
- **WHEN** ein Hochschulsystem ein Zertifikat vorweist, dessen Aussteller der Systemvertrauensliste des Geräts nicht bekannt ist
- **THEN** nimmt das System diesen Aussteller als zusätzlichen Vertrauensanker auf, die Zertifikatsprüfung selbst bleibt aktiv

### Requirement: Kein Absturzbericht an Dritte

Das System muss darauf verzichten, Absturzberichte oder Nutzungsereignisse an Dritte zu übermitteln. Herkunft: Alt: bewusst verworfen (vormals SEC-F-125).

#### Scenario: Absturz der App
- **WHEN** die App abstürzt oder ein Nutzungsereignis anfällt
- **THEN** übermittelt das System dazu keine Daten an einen Drittanbieterdienst

### Requirement: Fehlertelemetrie nur mit Opt-in

Sofern eine Nutzerin der Übermittlung von Fehlerberichten zugestimmt hat (Opt-in), darf das System technische Fehlerdaten an die selbstbetriebene Fehlertelemetrie-Instanz übermitteln; ohne Zustimmung unterbleibt jede Übermittlung. Herkunft: NEU (vormals SEC-F-130). Siehe `specs/decisions/0014-selbstbetriebene-fehlertelemetrie.md`.

#### Scenario: Fehlerbericht ohne Opt-in
- **WHEN** ein technischer Fehler anfällt und die Nutzerin der Übermittlung von Fehlerberichten nicht zugestimmt hat
- **THEN** übermittelt das System keine Fehlerdaten an die Fehlertelemetrie-Instanz

### Requirement: Geheimnisse über gesicherten Mechanismus

Das System muss Geheimnisse (API-Token, Schlüssel) über einen gesicherten Build- oder Laufzeitmechanismus bereitstellen, niemals im Klartext im Quellcode. Herkunft: NEU (vormals SEC-N-110).

#### Scenario: Einbindung eines neuen API-Tokens
- **WHEN** ein neues API-Token oder ein neuer Schlüssel für das System benötigt wird
- **THEN** wird er über einen gesicherten Build- oder Laufzeitmechanismus bereitgestellt, nicht im Klartext in den Quellcode geschrieben

### Requirement: Protokolle ohne personenbezogene Inhalte

Das System muss Protokolle so gestalten, dass sie keine personenbezogenen Inhalte enthalten. Herkunft: NEU (vormals SEC-N-120). Zur Durchsetzung des Requirements „Keine stillschweigend verschwindenden Fehler" verbietet die Lint-Konfiguration (`app/eslint.config.js`) `console`-Aufrufe außerhalb der Fehlerschicht (`no-console`, Ausnahme nur für `console.error`/`console.warn`); ein still verschluckter Fehler ohne Protokollierung fällt damit bereits im CI-Job `app` auf.

#### Scenario: Protokollierung eines Fehlers
- **WHEN** das System einen Fehler protokolliert
- **THEN** enthält der Protokolleintrag keine personenbezogenen Inhalte wie Klartext-Zugangsdaten oder vollständige Nutzerbeiträge

### Requirement: Auskunftsrecht innerhalb eines Monats

Wenn eine Nutzerin Auskunft über ihre beim Verantwortlichen gespeicherten personenbezogenen Daten verlangt, muss das System diese Auskunft innerhalb eines Monats bereitstellen. Herkunft: NEU (vormals SEC-F-140). Konkretisiert das in Capability `identity-and-moderation` referenzierte Auskunftsrecht (Art. 15 DSGVO).

#### Scenario: Auskunftsersuchen
- **WHEN** eine Nutzerin Auskunft über ihre gespeicherten personenbezogenen Daten verlangt
- **THEN** stellt das System diese Auskunft innerhalb eines Monats bereit

### Requirement: Berichtigungsrecht

Wenn eine Nutzerin die Berichtigung unzutreffender, sie betreffender personenbezogener Daten verlangt, muss das System die Berichtigung vornehmen. Herkunft: NEU (vormals SEC-F-150). Konkretisiert das Berichtigungsrecht (Art. 16 DSGVO).

#### Scenario: Berichtigungsersuchen
- **WHEN** eine Nutzerin die Berichtigung unzutreffender, sie betreffender personenbezogener Daten verlangt
- **THEN** nimmt das System die Berichtigung vor

### Requirement: Datenportabilität

Wenn eine Nutzerin die Übertragung ihrer bereitgestellten personenbezogenen Daten in einem gängigen, maschinenlesbaren Format verlangt, muss das System diese Daten in einem solchen Format bereitstellen. Herkunft: NEU (vormals SEC-F-160). Konkretisiert das Recht auf Datenübertragbarkeit (Art. 20 DSGVO).

#### Scenario: Ersuchen um Datenübertragbarkeit
- **WHEN** eine Nutzerin die Übertragung ihrer bereitgestellten personenbezogenen Daten in einem gängigen, maschinenlesbaren Format verlangt
- **THEN** stellt das System diese Daten in einem solchen Format bereit

### Requirement: Widerspruchsrecht

Wenn eine Nutzerin der Verarbeitung ihrer auf berechtigtem Interesse beruhenden personenbezogenen Daten widerspricht, muss das System die Verarbeitung prüfen und, sofern keine vorrangigen Gründe entgegenstehen, einstellen. Herkunft: NEU (vormals SEC-F-170). Konkretisiert das Widerspruchsrecht (Art. 21 DSGVO). Das Löschrecht (Art. 17) ist bereits über Capability `identity-and-moderation` (IDENT-F-130) abgedeckt.

#### Scenario: Widerspruch gegen eine auf berechtigtem Interesse beruhende Verarbeitung
- **WHEN** eine Nutzerin der Verarbeitung ihrer auf berechtigtem Interesse beruhenden personenbezogenen Daten widerspricht und keine vorrangigen Gründe entgegenstehen
- **THEN** stellt das System die Verarbeitung ein

### Requirement: Codierung nutzergenerierten Freitexts gegen aktiven Inhalt

Das System muss nutzergenerierten Freitext (z. B. Bewertungskommentare, Meldungstexte) bei der Anzeige so codieren, dass er nicht als aktiver Inhalt ausgeführt werden kann. Herkunft: NEU (vormals SEC-F-180). Betrifft insbesondere die Anzeige in der Verwaltungsoberfläche (Capability `admin`), die laut `specs/decisions/0018-verwaltungsoberflaeche-react-native-web.md` ein Browser-Rendering-Kontext ist.

#### Scenario: Anzeige eines Bewertungskommentars mit eingebettetem Skriptcode
- **WHEN** ein nutzergenerierter Freitext Zeichen enthält, die als aktiver Inhalt (z. B. HTML/Skript) interpretiert werden könnten
- **THEN** zeigt das System den Text codiert an, ohne ihn auszuführen

## Schutzziele

| Schutzziel | Konkret zu schützen |
|---|---|
| Vertraulichkeit | Zugangsdaten/Sitzungsmerkmale, Semesterticket-Bild, Klarnamen und Kontaktwege aus Helfer-Anmeldungen, Konto-Kennungen (SSO/E-Mail) |
| Integrität | Bewertungen, Stundenplandaten, Helferbedarf-Zusagen — keine unbemerkte Verfälschung oder doppelte Übertragung |
| Verfügbarkeit je Bereich | Ausfall eines Fremdsystems (siehe Capability `integrations`) darf nur den betroffenen Bereich beeinträchtigen, nie die ganze App — siehe Capability `non-functional` |
| Nachvollziehbarkeit ohne Personenbezug | Protokolle erlauben Fehleranalyse, ohne personenbezogene Inhalte offenzulegen |

## Befunde aus den Alt-Apps, die nicht wiederholt werden dürfen

### Befunde aus der Android-Alt-App (2026-08-25)

Die Android-Alt-App ist im Funktionsumfang der zu übertreffende Stand (`specs/product/legacy-inventory.md` Abschnitt 4), enthält sicherheitlich aber vier Befunde, die nicht übernommen werden. Vollständige Mängelliste dort unter 4.5.

| Befund | Quelle | Konsequenz für die Neuentwicklung |
|---|---|---|
| Hochschul-Zugangsdaten werden geräteseitig vorgehalten und von einem Hintergrund-Worker wiederholt erneut gesendet, um das Semesterticket zu beziehen | `alte apps/android-fb4/…/util/UserCredentialsHelper.java`, `worker/TicketDownloadWorker.java` | Passwort-Replay bleibt ausgeschlossen, siehe Requirement „SSO oder offizielle Schnittstelle statt Passwort-Replay bei Notenportalen" und Capability `integrations` (INT-017); der automatische Ticket-Bezug entfällt zugunsten des manuellen Imports |
| Der Stundenplandienst wird über `http://` aufgerufen, obwohl `https://` funktioniert (live geprüft 2026-08-25) | `alte apps/android-fb4/…/module/NetworkModule.java` | TLS ausnahmslos, siehe Requirement „Ausschließlich TLS für alle Netzwerkabrufe" |
| Das Ticket-PDF liegt unverschlüsselt im externen App-Verzeichnis | `alte apps/android-fb4/…/util/TicketUtil.java` | Verschlüsselte Ablage im App-eigenen Bereich, siehe Capability `data-and-storage` (DATA-F-040 und DATA-F-170) |
| Absturzberichte und Nutzungsereignisse gehen an einen Drittanbieterdienst | `alte apps/android-fb4/…/util/FirebaseAnalyticsEvents.java` | Nicht übernehmen, siehe Requirement „Kein Absturzbericht an Dritte"; zusätzlich unvereinbar mit Capability `non-functional` (NFR-N-170) |

Ein Befund ist ausdrücklich **positiv** und wird übernommen: Die Android-Alt-App löst das Problem ungültiger Hochschulzertifikate, indem sie deren Aussteller als zusätzlichen Vertrauensanker mitliefert (`util/AdditionalKeyStoresSSLSocketFactory.java`, `assets/fh.cer`), statt die Prüfung abzuschalten. Damit ist zugleich der bislang unbestätigte Befund M-013 aus der Flutter-App geklärt: Das Zertifikatsproblem der FH ist real, hat aber eine Lösung, die die Prüfung intakt lässt. Aufgenommen als Requirement „Zusätzlicher Vertrauensanker statt abgeschalteter Prüfung".

### Befunde aus der Flutter-Alt-App

| Befund | Quelle | Konsequenz für die Neuentwicklung |
|---|---|---|
| Datenschutz-Gate wirkungslos: `shouldShowPrivacyPolicy` wird korrekt aus Einstellung und Versionsvergleich ermittelt und unmittelbar danach fest auf `false` überschrieben | `alte apps/fb4_app-main/fb4_app-main/lib/main_view_model.dart:8-22` (Überschreibung in Zeile 22) | Wirksames, versioniertes Zustimmungs-Gate erforderlich, siehe Requirement „Wirksame, versionierte Einwilligung vor Nutzung" |
| Unverschlüsselter Abruf des Mensa-Endpunkts über `http://` | INT-004 in Capability `integrations` | TLS ausnahmslos erzwingen, siehe Requirement „Ausschließlich TLS für alle Netzwerkabrufe" |
| Zugangsdaten zum Notenportal im Klartext im Secure Storage, bei jedem Tokenablauf erneut gesendet | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart:14-19` | Für die Neuentwicklung ausgeschlossen; SSO oder offizielle Schnittstelle statt Passwort-Replay, siehe Requirement „SSO oder offizielle Schnittstelle statt Passwort-Replay bei Notenportalen", Capability `integrations` (INT-006) |
| Fest verdrahtete interne IP-Adresse `10.11.15.121` im Anmeldeformular | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart:11` | Zielsysteme über Konfiguration ansprechen, keine internen Adressen im Quellcode, siehe Requirement „Zielsysteme nur über Konfiguration ansprechen" |
| Semesterticket unverschlüsselt im Dateisystem der App | `alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82-89` | Verschlüsselte Ablage bereits in Capability `data-and-storage` (DATA-F-040) gefordert; hier nur als Sicherheitsbefund geführt |
| Stillschweigend verschluckte Fehler: `try`-Block mit leerem `finally`, ohne `catch` | `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/viewmodels/canteen_overview_viewmodel.dart:60-66` | Fehler müssen behandelt oder protokolliert werden, dürfen nie stillschweigend verschwinden, siehe Requirement „Keine stillschweigend verschwindenden Fehler" |

## Verarbeitungsverzeichnis (personenbezogene Daten)

Nutzergenerierte Inhalte und personenbezogene Daten sind gegenüber dem Bestand neu; die Alt-App sammelte laut ihrer Datenschutzerklärung keine personenbezogenen Daten (siehe „Datenschutzerklärung").

| Datenart | Zweck | Rechtsgrundlage | Empfänger | Speicherdauer | Betroffene Capability |
|---|---|---|---|---|---|
| Helfer-Anmeldung (Name, Kontaktweg) | Koordination von Helferbedarf bei FSR-Events | Einwilligung | Eigenes Backend (INT-008), FSR-Eventorganisation | 30 Tage nach Eventende, danach Löschung (Capability `identity-and-moderation`, IDENT-N-020) | `event-volunteers` |
| Konto (SSO-Kennung oder E-Mail-Adresse, siehe INT-012) | Anmeldung für das Verfassen von Bewertungen und für die E-Key-Verwaltung | Einwilligung | Eigenes Backend (INT-008), ggf. Hochschul-SSO-Dienst | bis Löschung durch Nutzerin, siehe Capability `identity-and-moderation` (IDENT-F-130) | `identity-and-moderation`, `canteen-ratings`, `e-key` |
| Bewertung (Konto-Referenz, angezeigtes Pseudonym, Bewertungsstufe, optionaler Kommentar) | Community-Bewertung von Mensa-Gerichten | Einwilligung | Eigenes Backend (INT-008), andere Nutzerinnen (Anzeige nur des Pseudonyms) | dauerhaft bis Löschung durch Nutzerin, siehe Capability `identity-and-moderation` | `canteen-ratings` |
| Gerichtsfoto (Bilddatei, Konto-Referenz, Freigabestand) | Nutzergenerierte Bebilderung des Mensaplans | Einwilligung | Eigenes Backend (INT-008), andere Nutzerinnen (öffentliche Anzeige nach Freigabe) | dauerhaft bis Löschung durch die hochladende Person, Moderation oder Kontolöschung (Capability `canteen-photos`, FOTO-F-100/F-160) | `canteen-photos` |
| Push-Kennung, iOS (Firebase-Geräte-ID) | Zustellung von Push-Benachrichtigungen | Einwilligung (Opt-in) | Google/Firebase als Bridge zu Apple/APNs (INT-005) | bis Abmeldung vom Thema bzw. Firebase-Standardfristen | `news`, `settings` |
| Push-Endpunkt, Android (UnifiedPush-Endpunkt-URL) | Zustellung von Push-Benachrichtigungen | Einwilligung (Opt-in) | Eigenes Backend (INT-008) sowie der von der Nutzerin gewählte Distributor (INT-005) | bis Abmeldung, danach Löschung des Endpunkts | `news`, `settings` |
| Push-Kennung bei Helfer-Anmeldung | Benachrichtigung angemeldeter Helfender bei Absage eines Events (HELFER-F-060) | Einwilligung | Eigenes Backend (INT-008), Zustellweg wie oben | mit der zugehörigen Anmeldung, spätestens 30 Tage nach Eventende | `event-volunteers` |
| Konto- und Rollenverwaltung (Kennung, E-Mail-Adresse, Gruppenzugehörigkeit) | Anmeldung und Rollenprüfung für Bewertungen, E-Key und Verwaltung | Einwilligung | Eigenbetriebene Authentik-Instanz (INT-012); bei aktiver Federation zusätzlich der Microsoft-Mandant der FH Dortmund | bis Löschung durch Nutzerin, siehe IDENT-F-130 | `identity-and-moderation`, `admin` |
| Verwaltungsprotokoll (Zeitpunkt, handelndes Konto, betroffener Datensatz) | Nachvollziehbarkeit von Redaktions- und Moderationshandlungen über den Wechsel der FSR-Besetzung hinweg | Berechtigtes Interesse | Eigenes Backend (INT-008), Zugriff auf Rolle FSR-Redaktion beschränkt | 12 Monate (ADMIN-N-020) | `admin` |
| Zugriff auf den Gerätekalender (Schreibzugriff) | Übertragen ausgewählter Stundenplan-Termine in einen von der Nutzerin gewählten Kalender | Einwilligung | Verbleibt auf dem Gerät, keine Übermittlung an das Backend oder Dritte | nicht zutreffend, kein Datenbestand beim Verantwortlichen | `schedule` |
| Technische Protokolle des Backends (z. B. IP-Adresse, Zeitstempel, aufgerufener Endpunkt) | Betrieb, Fehleranalyse, Missbrauchserkennung | Berechtigtes Interesse | Eigener Backend-Betrieb (INT-008) | 30 Tage (Arbeitsziel, siehe „Offene Fragen") | `backend-and-api` |
| E-Key-Verknüpfung, App-seitig (E-Key-Nummer-Referenz, Konto-Referenz, zwischengespeicherter Status/Berechtigungen, Bestätigungs-Zeitstempel) | Anzeige von Status/Berechtigungen in der App | Einwilligung | Eigenes Backend (INT-008) | Bis Löschung durch Nutzerin (Konto-Löschung, IDENT-F-130) | `e-key` |
| E-Key-Stammdaten (E-Key-Nummer, Matrikelnummer, Berechtigungen) | Verwaltung des vom FSR verliehenen physischen Zugangsschlüssels | Einwilligung | Bestehendes E-Key-Verwaltungstool des FSR (INT-014, außerhalb der Datenhoheit dieser App) | Verwaltet durch das bestehende Tool/FSR-Mitglieder, nicht durch diese App | `e-key` |
| E-Key-Verifizierung (eingegebene Matrikelnummer und E-Key-Nummer, nur zum Abgleich) | Prüfung einer eingegebenen Kombination gegen das bestehende E-Key-Verwaltungstool (Capability `identity-and-moderation`, IDENT-F-035) | Einwilligung | Eigenes Backend (INT-008, verarbeitet, aber nicht gespeichert), bestehendes E-Key-Verwaltungstool (INT-014) | Nicht gespeichert — ausschließlich transiente Verarbeitung während des Abgleichs | `e-key` |
| Fehlerbericht (Gerätemodell, Betriebssystemversion, Absturz-Stacktrace, App-/Backend-Version) | Fehleranalyse durch das FSR-Team | Einwilligung (Opt-in) | Selbstbetriebene Fehlertelemetrie-Instanz (INT-018) | 30 Tage (Arbeitsziel, analog technische Protokolle) | `backend-and-api`, `specs/decisions/0014-selbstbetriebene-fehlertelemetrie.md` |

**Auftragsverarbeitung.** Hetzner (Hosting von INT-008/INT-012/INT-018) und, für die iOS-Push-Bridge, Google/Firebase (INT-005) verarbeiten personenbezogene Daten im Auftrag bzw. als Empfänger. Für Hetzner ist vor Produktivbetrieb ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO) abzuschließen; für die iOS-Push-Bridge ist zu prüfen, ob Googles Standardvertragsbedingungen dafür ausreichen. Organisatorische Nachverfolgung: `specs/product/roadmap.md` Abschnitt 5.

## Datenschutzerklärung

Die Erklärung der Alt-App liegt unter `alte apps/fb4_app-main/fb4_app-main/assets/privacy`. Sie beschreibt fünf Themen: keine Sammlung persönlicher Daten, Übermittlung der Stundenplan-Formulardaten an die FBWS-API ohne Identifizierbarkeit, lokale und nie übertragene Gruppenkennung, ODS-Zugangsdaten nur lokal in der iOS Keychain, sowie OpenMensa- und Firebase-Cloud-Messaging-Hinweise.

| Abschnitt der Alt-Erklärung | Status für die Neuentwicklung |
|---|---|
| Keine Sammlung persönlicher Daten (allgemeine Aussage) | entfällt als Gesamtaussage — die neue App sammelt personenbezogene Daten, siehe „Verarbeitungsverzeichnis" |
| Übermittlung an FBWS-API für Stundenplan | inhaltlich übernehmbar, Formulierung an neuen Backend-Vermittler (INT-002/INT-008) anzupassen |
| Gruppenkennung nie übertragen, nur lokal | inhaltlich übernehmbar unverändert |
| ODS-Zugangsdaten | entfällt vollständig zugunsten von HISinOne (INT-006, `specs/decisions/0006-abloesung-ods-durch-hisinone.md`) |
| Mensa/OpenMensa | neu zu formulieren: Abruf läuft über das eigene Backend (INT-008), nicht mehr direkt vom Gerät |
| Firebase Cloud Messaging | inhaltlich übernehmbar, sofern INT-005 unverändert fortgeführt wird |
| Bewertungen, Events, Helfer-Anmeldungen, eigenes Backend allgemein | vollständig neu zu schreiben, kein Vorbild in der Alt-Erklärung |

## Berechtigungen auf dem Gerät

| Berechtigung | Wofür | Anforderung |
|---|---|---|
| Dateiauswahl | Import des Semesterticket-PDFs (TICKET-F-010) | vorhanden in beiden Alt-Apps |
| Benachrichtigungen | Lieblingsgericht-Hinweis (MENSA-F-100, Auslösung rein lokal — Berechtigung wird erst bei der ersten Höchstbewertung angefragt, siehe Requirement „Berechtigungsanfrage erst bei tatsächlichem Bedarf"; ohne Berechtigung bleibt das Bewerten nutzbar, siehe Requirement „Nutzbarkeit ohne optionale Berechtigung"; zusätzlich global abschaltbar über SET-F-170/MENSA-F-105) sowie Push (INT-005, zweite Ausbaustufe) | Opt-in |
| Fotoauswahl bzw. Kamera | Hochladen eines Gerichtsfotos (Capability `canteen-photos`, FOTO-F-050), zweite Ausbaustufe; Metadaten werden vor der Übertragung entfernt (FOTO-F-140) | Opt-in, erst bei tatsächlicher Nutzung anzufragen (siehe Requirement „Berechtigungsanfrage erst bei tatsächlichem Bedarf") |
| Kalender, ausschließlich schreibend | Übertragen ausgewählter Stundenplan-Termine in einen gewählten Gerätekalender (SCHED-F-175) | Opt-in, erst bei tatsächlicher Nutzung anzufragen (siehe Requirement „Berechtigungsanfrage erst bei tatsächlichem Bedarf") |
| Standort | – | wird nicht benötigt und nicht angefragt; die Raumsuche arbeitet mit manueller Referenzraum-Eingabe (RAUM-F-050) |

**Korrektur vom 2026-08-25 zum Kalenderzugriff.** Es galt zunächst als geklärt, dass keine Kalenderberechtigung benötigt werde, weil der iCal-Export nur eine Datei erzeuge. Die anschließende Auswertung des Android-Quellcodes zeigt, dass die Android-Alt-App Termine direkt in einen von der Nutzerin gewählten Gerätekalender schreibt (`READ_CALENDAR`/`WRITE_CALENDAR`, `dialog/CalendarExportDialog.java`) und damit über den zuvor angenommenen Umfang hinausgeht. Entscheidung FSR FB4, 2026-08-25: Der Schreibzugriff wird aufgenommen, der Datei-Export bleibt als Rückfallweg bestehen. Lesezugriff auf bestehende Kalendereinträge bleibt ausgeschlossen — die Berechtigung wird ausschließlich zum Anlegen eigener Einträge und zum Auflisten der verfügbaren Zielkalender genutzt, nicht zum Auswerten fremder Termine.

## Transportsicherheit, Geheimnisse, Protokollierung

Alle Netzaufrufe laufen über TLS mit ungeprüfter Zertifikatsvalidierung im Produktivbuild; eine Deaktivierung der Prüfung ist ausgeschlossen. Hinweis zur Prüfung: `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart:7` enthält einen Codekommentar, der eine Ignorierung von Zertifikatsvertrauen nahelegt; im Code selbst wurde keine tatsächliche Zertifikatsumgehung gefunden (kein `badCertificateCallback`, kein `HttpOverrides` im gesamten `lib`-Verzeichnis). Der Kommentar ist damit kein bestätigter Befund, aber ein Hinweis, die Zertifikatsprüfung in der Neuentwicklung ausdrücklich zu testen. Geheimnisse (API-Token, Schlüssel) dürfen nicht im Klartext im Quellcode oder Repository liegen, sondern werden über einen gesicherten Build- oder Laufzeitmechanismus bereitgestellt. Protokolle enthalten keine personenbezogenen Inhalte wie Klartext-Zugangsdaten oder vollständige Nutzerbeiträge. Zur Durchsetzung des Requirements „Keine stillschweigend verschwindenden Fehler" verbietet die Lint-Konfiguration (`app/eslint.config.js`) `console`-Aufrufe außerhalb der Fehlerschicht (`no-console`, Ausnahme nur für `console.error`/`console.warn`); ein still verschluckter Fehler ohne Protokollierung fällt damit bereits im CI-Job `app` auf.

## Bewusst nicht übernommenes Altverhalten

- Wirkungsloses, fest deaktiviertes Datenschutz-Gate — Grund: verstößt gegen die Einwilligungspflicht, siehe Requirement „Wirksame, versionierte Einwilligung vor Nutzung".
- Unverschlüsselter Mensa-Abruf über `http://` — Grund: überträgt Anfragedaten im Klartext, siehe Requirement „Ausschließlich TLS für alle Netzwerkabrufe".
- Passwort-Replay am Notenportal — Grund: unsicheres Verfahren, durch SSO/offizielle Schnittstelle ersetzt, siehe Requirement „SSO oder offizielle Schnittstelle statt Passwort-Replay bei Notenportalen".
- Fest verdrahtete interne IP-Adresse — Grund: Betriebsdetail gehört nicht in den Quellcode, siehe Requirement „Zielsysteme nur über Konfiguration ansprechen".
- Stillschweigend verschluckte Fehler beim Lesen von Einstellungen — Grund: verdeckt Fehlerzustände, siehe Requirement „Keine stillschweigend verschwindenden Fehler".

## Offene Fragen

- Speicherdauer und Löschfrist von Helfer-Anmeldungen nach Zweckerfüllung des Events: bereits durch Capability `identity-and-moderation` (IDENT-N-020, 30 Tage nach Eventende) beantwortet; das Verarbeitungsverzeichnis wurde entsprechend aktualisiert, keine offene Frage mehr.
- Aufbewahrungsdauer technischer Backend-Protokolle: 30 Tage als Arbeitsziel, zu validieren im ersten Betrieb.
- ~~Geklärt (FSR FB4, 2026-08-25): Weder Kalender- noch Standort-Geräteberechtigung wird für den aktuellen Umfang benötigt.~~ **Teilweise revidiert am selben Tag** nach Auswertung des Android-Quellcodes: Für den Standort gilt die Aussage unverändert — die Raumsuche ermittelt Nähe über eine manuelle Referenzraum-Eingabe und serverseitige Laufwege-Daten statt GPS (Capability `room-finder`, RAUM-F-050/060). Für den Kalender gilt sie nicht mehr: Schreibzugriff wird aufgenommen, siehe „Berechtigungen auf dem Gerät" und Capability `schedule` (SCHED-F-175).
- Geklärt (FSR FB4, 2026-08-25): Speicherdauer und Löschfrist der E-Key-Stammdaten (E-Key-Nummer, Matrikelnummer, Berechtigungen) liegen in der Verantwortung des bestehenden E-Key-Verwaltungstools (INT-014) und der FSR-Mitglieder, außerhalb der Datenhoheit dieser App. Die App-seitige Verknüpfung (Konto-Referenz) unterliegt der regulären Konto-Löschung (IDENT-F-130).
