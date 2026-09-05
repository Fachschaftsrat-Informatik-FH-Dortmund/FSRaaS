## Purpose

Ermöglicht Studierenden die kontogebundene Verwaltung eines bereits beim FSR ausgegebenen E-Keys — Status, Berechtigungen, Verlustmeldung, semesterweise Bestätigung der fortbestehenden Berechtigung; die Ausgabe selbst bleibt bewusst außerhalb der App. Vormals `specs/features/e-key/spec.md` (Präfix `EKEY`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Hinweis auf E-Key-Ausleihe in der Raumsuche

Das System muss in der Raumsuche einen Hinweis auf die Möglichkeit anzeigen, beim FSR einen E-Key auszuleihen. Herkunft: NEU (vormals EKEY-F-010).

#### Scenario: Hinweis in der Raumsuche
- **WHEN** die Nutzerin die Raumsuche (Capability `room-finder`) öffnet
- **THEN** zeigt das System einen Hinweis auf die Möglichkeit, beim FSR einen E-Key auszuleihen

### Requirement: Verweis auf externe Terminvereinbarung

Wenn die Nutzerin einen Termin zur E-Key-Ausgabe vereinbaren möchte, muss das System auf die FSR-Webseite bzw. das Wiki verweisen, statt eine eigene Terminvereinbarung anzubieten. Herkunft: NEU (vormals EKEY-F-020).

#### Scenario: Verweis statt eigener Terminvereinbarung
- **WHEN** die Nutzerin einen Termin zur E-Key-Ausgabe vereinbaren möchte
- **THEN** verweist das System auf die FSR-Webseite bzw. das Wiki (Capability `wiki`), statt eine eigene Terminvereinbarung anzubieten

### Requirement: Verknüpfung des E-Keys mit dem Konto

Das System muss der Nutzerin das Verknüpfen eines beim FSR erhaltenen E-Keys mit dem eigenen Konto durch Eingabe von Matrikelnummer und E-Key-Nummer ermöglichen. Herkunft: NEU (vormals EKEY-F-030).

#### Scenario: Verknüpfung per Eingabe
- **WHEN** die Nutzerin Matrikelnummer und E-Key-Nummer eingibt
- **THEN** ermöglicht das System die Verknüpfung des E-Keys mit dem eigenen Konto

### Requirement: Prüfung der Verknüpfung gegen das E-Key-Verwaltungstool

Das System muss eine eingegebene Kombination aus Matrikelnummer und E-Key-Nummer gegen das bestehende E-Key-Verwaltungstool des FSR (INT-014, Capability `integrations`) prüfen und die Verknüpfung nur bei Übereinstimmung herstellen. Herkunft: NEU (vormals EKEY-F-035).

#### Scenario: Prüfung gegen das E-Key-Verwaltungstool
- **WHEN** eine eingegebene Kombination aus Matrikelnummer und E-Key-Nummer vorliegt
- **THEN** prüft das System sie gegen das bestehende E-Key-Verwaltungstool des FSR (INT-014) und stellt die Verknüpfung nur bei exakter Übereinstimmung her

### Requirement: Anzeige von Status und Berechtigungen

Das System muss der Nutzerin nach erfolgter Verknüpfung Status und Berechtigungen (freigeschaltete Räume/Zeiten) des eigenen E-Keys anzeigen, wie im bestehenden E-Key-Verwaltungstool (INT-014) hinterlegt. Herkunft: NEU (vormals EKEY-F-040).

#### Scenario: Statusanzeige nach Verknüpfung
- **WHEN** die Verknüpfung erfolgreich war
- **THEN** zeigt das System Status und Berechtigungen des eigenen E-Keys wie im E-Key-Verwaltungstool (INT-014) hinterlegt an

### Requirement: Melden als verloren

Das System muss der Nutzerin das Melden des eigenen E-Keys als verloren ermöglichen. Herkunft: NEU (vormals EKEY-F-050).

#### Scenario: Verloren-Meldung
- **WHEN** die Nutzerin ihren E-Key als verloren melden möchte
- **THEN** ermöglicht das System diese Meldung

### Requirement: Sofortige Sperrung bei Verlustmeldung

Wenn ein E-Key als verloren gemeldet wird, muss das System dies im bestehenden E-Key-Verwaltungstool (INT-014) vermerken und den E-Key in der App unmittelbar als gesperrt kennzeichnen. Herkunft: NEU (vormals EKEY-F-060).

#### Scenario: Sperrung nach Verlustmeldung
- **WHEN** ein E-Key als verloren gemeldet wird
- **THEN** vermerkt das System dies im E-Key-Verwaltungstool (INT-014) und kennzeichnet den E-Key in der App unmittelbar als gesperrt

### Requirement: Semesterweise Bestätigungsaufforderung

Das System muss die Nutzerin einmal je Semester zur Bestätigung auffordern, dass die Berechtigung weiterhin benötigt wird. Herkunft: NEU (vormals EKEY-F-070).

#### Scenario: Aufforderung zur Bestätigung
- **WHEN** ein neues Semester beginnt und noch keine Bestätigung für dieses Semester vorliegt
- **THEN** fordert das System die Nutzerin einmal zur Bestätigung auf, dass die Berechtigung weiterhin benötigt wird

### Requirement: Automatische Sperrung bei ausbleibender Bestätigung

Falls die semesterweise Bestätigung nicht innerhalb der vorgesehenen Frist erfolgt, muss das System dies im bestehenden E-Key-Verwaltungstool (INT-014) vermerken und den E-Key in der App als gesperrt kennzeichnen. Herkunft: NEU (vormals EKEY-F-080).

#### Scenario: Fristablauf ohne Bestätigung
- **WHEN** die semesterweise Bestätigung nicht innerhalb der vorgesehenen Frist erfolgt
- **THEN** vermerkt das System dies im E-Key-Verwaltungstool (INT-014) und kennzeichnet den E-Key in der App als gesperrt

### Requirement: Begrenzung von Rateversuchen auf die E-Key-Kennung

Das System muss Versuche, eine E-Key-Kennung durch wiederholtes Ausprobieren zu erraten, gemäß Capability `backend-and-api` (API-N-010) begrenzen. Herkunft: NEU (vormals EKEY-N-010).

#### Scenario: Wiederholtes Ausprobieren
- **WHEN** wiederholt Kombinationen aus Matrikelnummer und E-Key-Nummer ausprobiert werden
- **THEN** begrenzt das System diese Versuche gemäß Capability `backend-and-api` (API-N-010)

## Entfallene Anforderungen (historisch)

**EKEY-F-045 (entfallen).** „Das System muss der FSR-Redaktion das Anlegen eines E-Key-Datensatzes (E-Key-Nummer, Matrikelnummer, Berechtigungen) bei Ausgabe eines E-Keys ermöglichen." Herkunft: NEU. Grund (Architektur-Klarstellung, 2026-08-25, FSR FB4): Der FSR betreibt bereits ein eigenständiges E-Key-Verwaltungstool mit Postgres-Datenhaltung (INT-014), in dem E-Key-Ausgabe und Berechtigungen gepflegt werden. Diese Capability baut keine parallele E-Key-Datenhaltung auf; das bestehende Tool bleibt alleiniges System, in dem der FSR E-Key-Datensätze anlegt und pflegt.

## Scope / Nicht-Scope

### Scope

- Hinweis auf die Möglichkeit, beim FSR einen E-Key auszuleihen, sichtbar in der Raumsuche (Capability `room-finder`).
- Verknüpfung eines bereits erhaltenen E-Keys mit dem eigenen Konto.
- Anzeige von Status und Berechtigungen (freigeschaltete Räume/Zeiten) des eigenen E-Keys.
- Melden des eigenen E-Keys als verloren.
- Jährliche/semesterweise Selbstbestätigung, dass die Berechtigung weiterhin benötigt wird; automatische Sperrung bei ausbleibender Bestätigung.

### Nicht-Scope

- Terminvereinbarung und Formular zur Erstausgabe eines E-Keys — bleibt auf der FSR-Webseite bzw. im Wiki (Capability `wiki`), dorthin verweist die App.
- Technische Sperrung im physischen/elektronischen Schließsystem selbst (z. B. Deaktivierung eines RFID-Chips) — das System markiert den Status ausschließlich administrativ im eigenen Backend; die tatsächliche Umsetzung der Sperre liegt beim FSR bzw. einem eigenständigen Zugangskontrollsystem außerhalb dieser Capability.
- Vorab-Dateneingabe mit QR-Code-gestützter Formular-Vorausfüllung durch den FSR bei der Ausgabe — vom FSR als denkbare künftige Erweiterung benannt, nicht Teil dieses Umfangs (siehe Abschnitt „Offene Fragen").

## Nutzergeschichten

- Als Studierende möchte ich in der Raumsuche erfahren, dass es ausleihbare E-Keys gibt, damit ich weiß, wie ich außerhalb offizieller Zeiten Zugang zu Räumen bekomme.
- Als Studierende möchte ich meinen beim FSR erhaltenen E-Key mit meinem Konto verknüpfen, damit ich seinen Status jederzeit in der App einsehen kann.
- Als Studierende möchte ich sehen, für welche Räume und Zeiten mein E-Key berechtigt.
- Als Studierende möchte ich meinen E-Key als verloren melden können, damit er zeitnah gesperrt wird.
- Als Studierende möchte ich jedes Semester einfach bestätigen können, dass ich den E-Key noch brauche, damit er nicht unnötig gesperrt wird.

## Erläuterungen

Entscheidung FSR FB4, 2026-08-25: Die vom FSR intern geführte Ausleihnummer je Ausleihvorgang ist nicht an Studierende ausgehändigt und deshalb als Bindungsmerkmal ungeeignet. Stattdessen gibt die Studentin Matrikelnummer und E-Key-Nummer ein; das System stellt die Verknüpfung nur bei exakter Übereinstimmung mit einem Datensatz im bestehenden E-Key-Verwaltungstool (INT-014) her. Das erfordert eine ausdrückliche Ausnahme vom Datensparsamkeits-Grundsatz aus Capability `identity-and-moderation` (vormals IDENT-F-030) — dort als bewusste Ausnahme für die E-Key-Verwaltung vermerkt (vormals IDENT-F-035).

Architektur-Klarstellung, 2026-08-25 (FSR FB4): Der FSR betreibt bereits ein eigenständiges E-Key-Verwaltungstool mit Postgres-Datenhaltung, in dem E-Key-Ausgabe und Berechtigungen gepflegt werden — unabhängig vom neuen App-Backend. Diese Capability baut keine parallele E-Key-Datenhaltung auf; das neue Backend (INT-008) integriert sich stattdessen mit diesem bestehenden Tool (INT-014) für Prüfung, Statusanzeige und das Eintragen von Statusänderungen. Ursprünglich vorgesehene Anforderungen zum eigenständigen Anlegen von E-Key-Datensätzen durch die FSR-Redaktion im neuen Backend sind damit entfallen (siehe „Entfallene Anforderungen (historisch)") — das bestehende Tool bleibt alleiniges System, in dem der FSR E-Key-Datensätze anlegt und pflegt.

„Gesperrt" ist in der App ausschließlich ein angezeigter Statuswert, kein Eingriff in ein physisches Schließsystem (siehe „Nicht-Scope"). Das eigentliche Sperren sowie alle Folgeschritte (Kontakt zur Studentin, physische Deaktivierung) übernehmen der FSR und dessen bestehendes E-Key-Verwaltungstool außerhalb der App — die App trägt lediglich den auslösenden Vorfall dort ein.

## Datenmodell

System der Wahrheit für E-Key-Nummer, Matrikelnummer, Berechtigungen und deren Pflege ist das bestehende E-Key-Verwaltungstool des FSR (INT-014), nicht das neue App-Backend. Das App-Backend hält lediglich die Verknüpfung zum Konto vor: E-Key-Nummer-Referenz, verknüpftes Konto (Referenz auf die Identität aus Capability `identity-and-moderation`, erst nach erfolgreicher Verknüpfung gesetzt), zuletzt bei INT-014 gelesener Status/Berechtigungen (Zwischenspeicher für die Anzeige), Zeitpunkt der letzten semesterweisen Bestätigung, Frist der nächsten fälligen Bestätigung.

## Externe Schnittstellen

Über das eigene Backend INT-008 (siehe Capability `backend-and-api`, vormals API-F-175), das sich seinerseits mit dem bestehenden E-Key-Verwaltungstool (INT-014) für Prüfung, Statusanzeige und das Eintragen von Statusänderungen integriert. Konto-Anmeldung nutzt INT-012 (Hochschul-SSO) bzw. dessen Ersatzoption, siehe Capability `integrations`. Keine weiteren externen Schnittstellen.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Kein E-Key verknüpft | Hinweis auf die Verknüpfungsmöglichkeit und Verweis auf FSR-Webseite/Wiki zur Erstausgabe |
| Verknüpfen | Eingabeformular für Matrikelnummer und E-Key-Nummer, Ladeanzeige während der Prüfung |
| Verknüpft, aktiv | Anzeige von Status und Berechtigungen |
| Verknüpft, gesperrt | Status „gesperrt" mit Grund (verloren gemeldet oder Bestätigung ausgeblieben) |
| Bestätigung fällig | Banner/Hinweis vor Ablauf der Bestätigungsfrist |
| Fehler | Fehlermeldung mit Wiederholen-Option beim Laden des Status |
| Offline | Zuletzt geladener Status bleibt sichtbar mit Alters-Hinweis; Verknüpfen wird sofort abgelehnt, Verloren-Melden und Bestätigen sind Schreibpfade und landen in der Offline-Warteschlange, siehe „Offline-Verhalten" |

## Offline-Verhalten

Die Statusanzeige ist ein Lesepfad mit zuletzt geladenem Stand, offline verfügbar wie andere Lesepfade. Verloren-Melden und die semesterweise Bestätigung sind Schreibpfade und werden gemäß Capability `architecture` (vormals ARCH-F-120) und Capability `data-and-storage` (vormals DATA-F-100) in die lokale Offline-Warteschlange eingereiht, analog Capability `canteen-ratings`. Das Verknüpfen ist davon ausgenommen: Eine eingegebene E-Key-Nummer kann zwischenzeitlich bereits mit einem anderen Konto verknüpft worden sein, weshalb die App diesen Vorgang bei fehlender Verbindung gemäß Capability `architecture` (vormals ARCH-F-125) ablehnen muss, statt ihn einzureihen.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Eingegebene Matrikelnummer/E-Key-Nummer-Kombination stimmt mit keinem Datensatz im E-Key-Verwaltungstool (INT-014) überein | Fehlermeldung, Hinweis auf Rücksprache mit dem FSR — kein Hinweis, welcher der beiden Werte falsch war (Missbrauchsschutz gegen Erraten) |
| E-Key-Verwaltungstool (INT-014) bei Prüfung/Statuseintrag nicht erreichbar | Fehlermeldung mit Wiederholen-Option; Schreibvorgänge (Verloren-Melden, Bestätigen) landen in der Offline-Warteschlange wie bei sonstigem Netzausfall |
| E-Key-Nummer bereits mit einem anderen Konto verknüpft | Ablehnung, Hinweis auf Rücksprache mit dem FSR (Missbrauchsschutz) |
| Verloren-Meldung für einen bereits gesperrten E-Key | Keine Fehlermeldung, Status bleibt unverändert gesperrt |

## Akzeptanzkriterien

- Eine gültige, noch nicht verknüpfte Kombination aus Matrikelnummer und E-Key-Nummer lässt sich mit dem eigenen Konto verknüpfen; eine bereits verknüpfte E-Key-Nummer wird abgelehnt.
- Eine Verloren-Meldung sperrt den E-Key unmittelbar und ist danach nicht rückgängig zu machen.
- Ein E-Key ohne fristgerechte semesterweise Bestätigung wird nach Fristablauf automatisch gesperrt.

## Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet E-Key-Verwaltung.

## Offene Fragen

- Technische Integrationsart mit dem bestehenden E-Key-Verwaltungstool (INT-014): direkter Zugriff auf dessen Postgres-Datenbank oder eine vom Tool bereitgestellte Schnittstelle? Direkter Datenbankzugriff zweier unabhängiger Anwendungen ohne vermittelnde API birgt das Risiko, dass Schema-Änderungen im bestehenden Tool das neue Backend unbemerkt brechen — Klärung durch technische Leitung vor Umsetzung, siehe Capability `integrations`, INT-014.
- Genauer Kalendertermin/-zeitraum der semesterweisen Bestätigung — fester Zeitpunkt je Semester ist entschieden (FSR FB4, 2026-08-25), konkretes Datum sowie Vorlaufzeit der Erinnerung legt der FSR operativ je Semester fest.
- Ob Hochschul-SSO als Konto-Anmeldeweg verfügbar ist — Capability `integrations`, INT-012. Die Kontopflicht selbst ist entschieden (`specs/decisions/0004-identitaet-und-anmeldung.md`), offen ist nur noch, ob SSO oder die Ersatzoption (eigenes Konto, z. B. E-Mail-Verifizierung) zum Einsatz kommt.
- QR-Code-gestützte Vorausfüllung des Ausgabeformulars: bewusst zurückgestellt (Entscheidung FSR FB4, 2026-08-25), keine Anforderung in diesem Umfang. Wäre ohnehin am bestehenden E-Key-Verwaltungstool zu verorten, nicht an dieser Capability, sollte sie künftig aufgenommen werden. Empfehlung aus der Spec-Prüfung vom 2026-08-26: Bei Umsetzung erneut prüfen, ob diese Option gegenüber der aktuellen Zwei-Zahlen-Eingabe vorgezogen werden sollte — das Erraten zweier mäßig geheimer Zahlen ist strukturell schwächer als ein bei Ausgabe gescannter Code. Keine Änderung der aktuellen Anforderung, nur eine Entscheidungsgrundlage für den FSR bei Umsetzung.
