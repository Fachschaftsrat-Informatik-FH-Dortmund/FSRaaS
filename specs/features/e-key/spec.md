---
id: e-key
titel: E-Key-Verwaltung
praefix: EKEY
status: draft
prioritaet: bestand
version: 2.0.0
owner: FSR FB4
last_reviewed: 2026-08-26
derived_from: []
implemented_in: []
related:
  - ../../platform/backend-and-api.md
  - ../../platform/identity-and-moderation.md
  - ../../platform/security-and-privacy.md
  - ../../platform/integrations.md
  - ../room-finder/spec.md
  - ../wiki/spec.md
  - ../settings/spec.md
---

# E-Key-Verwaltung

## 1. Zweck & Nutzen

Der FSR verleiht Studierenden elektronische Schlüssel (E-Keys) für den Zugang zu Räumen außerhalb offizieller Zeiten. Bisher ist das ausschließlich über die FSR-Webseite/das Wiki organisiert (Kategorie „E-KEYS" auf `fsrfb4.de`). Diese Spec ergänzt die App um die kontogebundene Verwaltung eines bereits ausgegebenen E-Keys — Status, Berechtigungen, Verlustmeldung, semesterweise Bestätigung der fortbestehenden Berechtigung. Die Ausgabe selbst (Termin, Formular) bleibt bewusst außerhalb der App. Entscheidung FSR FB4, 2026-08-25, siehe `specs/open-questions.md` (Archiv).

## 2. Scope / Nicht-Scope

### Scope

- Hinweis auf die Möglichkeit, beim FSR einen E-Key auszuleihen, sichtbar in der Raumsuche (`features/room-finder/spec.md`).
- Verknüpfung eines bereits erhaltenen E-Keys mit dem eigenen Konto.
- Anzeige von Status und Berechtigungen (freigeschaltete Räume/Zeiten) des eigenen E-Keys.
- Melden des eigenen E-Keys als verloren.
- Jährliche/semesterweise Selbstbestätigung, dass die Berechtigung weiterhin benötigt wird; automatische Sperrung bei ausbleibender Bestätigung.

### Nicht-Scope

- Terminvereinbarung und Formular zur Erstausgabe eines E-Keys — bleibt auf der FSR-Webseite bzw. im Wiki (`features/wiki/spec.md`), dorthin verweist die App (EKEY-F-020).
- Technische Sperrung im physischen/elektronischen Schließsystem selbst (z. B. Deaktivierung eines RFID-Chips) — die App markiert den Status ausschließlich administrativ im eigenen Backend; die tatsächliche Umsetzung der Sperre liegt beim FSR bzw. einem eigenständigen Zugangskontrollsystem außerhalb dieser Spec.
- Vorab-Dateneingabe mit QR-Code-gestützter Formular-Vorausfüllung durch den FSR bei der Ausgabe — vom FSR als denkbare künftige Erweiterung benannt, nicht Teil dieses Umfangs (siehe Abschnitt 13).

## 3. Nutzergeschichten

- Als Studierende möchte ich in der Raumsuche erfahren, dass es ausleihbare E-Keys gibt, damit ich weiß, wie ich außerhalb offizieller Zeiten Zugang zu Räumen bekomme.
- Als Studierende möchte ich meinen beim FSR erhaltenen E-Key mit meinem Konto verknüpfen, damit ich seinen Status jederzeit in der App einsehen kann.
- Als Studierende möchte ich sehen, für welche Räume und Zeiten mein E-Key berechtigt.
- Als Studierende möchte ich meinen E-Key als verloren melden können, damit er zeitnah gesperrt wird.
- Als Studierende möchte ich jedes Semester einfach bestätigen können, dass ich den E-Key noch brauche, damit er nicht unnötig gesperrt wird.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| EKEY-F-010 | Das System muss in der Raumsuche einen Hinweis auf die Möglichkeit anzeigen, beim FSR einen E-Key auszuleihen. | NEU |
| EKEY-F-020 | Wenn die Nutzerin einen Termin zur E-Key-Ausgabe vereinbaren möchte, muss das System auf die FSR-Webseite bzw. das Wiki verweisen, statt eine eigene Terminvereinbarung anzubieten. | NEU |
| EKEY-F-030 | Das System muss der Nutzerin das Verknüpfen eines beim FSR erhaltenen E-Keys mit dem eigenen Konto durch Eingabe von Matrikelnummer und E-Key-Nummer ermöglichen. | NEU |
| EKEY-F-035 | Das System muss eine eingegebene Kombination aus Matrikelnummer und E-Key-Nummer gegen das bestehende E-Key-Verwaltungstool des FSR (INT-014) prüfen und die Verknüpfung nur bei Übereinstimmung herstellen. | NEU |
| ~~EKEY-F-045~~ | ~~Das System muss der FSR-Redaktion das Anlegen eines E-Key-Datensatzes (E-Key-Nummer, Matrikelnummer, Berechtigungen) bei Ausgabe eines E-Keys ermöglichen.~~ — entfallen | NEU |
| EKEY-F-040 | Das System muss der Nutzerin nach erfolgter Verknüpfung Status und Berechtigungen (freigeschaltete Räume/Zeiten) des eigenen E-Keys anzeigen, wie im bestehenden E-Key-Verwaltungstool (INT-014) hinterlegt. | NEU |
| EKEY-F-050 | Das System muss der Nutzerin das Melden des eigenen E-Keys als verloren ermöglichen. | NEU |
| EKEY-F-060 | Wenn ein E-Key als verloren gemeldet wird, muss das System dies im bestehenden E-Key-Verwaltungstool (INT-014) vermerken und den E-Key in der App unmittelbar als gesperrt kennzeichnen. | NEU |
| EKEY-F-070 | Das System muss die Nutzerin einmal je Semester zur Bestätigung auffordern, dass die Berechtigung weiterhin benötigt wird. | NEU |
| EKEY-F-080 | Falls die semesterweise Bestätigung nicht innerhalb der vorgesehenen Frist erfolgt, muss das System dies im bestehenden E-Key-Verwaltungstool (INT-014) vermerken und den E-Key in der App als gesperrt kennzeichnen. | NEU |

### Erläuterungen

**`EKEY-F-030`/`EKEY-F-035`** — Entscheidung FSR FB4, 2026-08-25: Die vom FSR intern geführte Ausleihnummer je Ausleihvorgang ist nicht an Studierende ausgehändigt und deshalb als Bindungsmerkmal ungeeignet. Stattdessen gibt die Studentin Matrikelnummer und E-Key-Nummer ein; das System stellt die Verknüpfung nur bei exakter Übereinstimmung mit einem Datensatz im bestehenden E-Key-Verwaltungstool (INT-014) her. Das erfordert eine ausdrückliche Ausnahme vom Datensparsamkeits-Grundsatz aus `platform/identity-and-moderation.md` (IDENT-F-030) — dort als bewusste Ausnahme für EKEY vermerkt (IDENT-F-035).

**Architektur-Klarstellung, 2026-08-25 (FSR FB4):** Der FSR betreibt bereits ein eigenständiges E-Key-Verwaltungstool mit Postgres-Datenhaltung, in dem E-Key-Ausgabe und Berechtigungen gepflegt werden — unabhängig vom neuen App-Backend. Diese Spec baut **keine** parallele E-Key-Datenhaltung auf; das neue Backend (INT-008) integriert sich stattdessen mit diesem bestehenden Tool (INT-014) für Prüfung (EKEY-F-035), Statusanzeige (EKEY-F-040) und das Eintragen von Statusänderungen (EKEY-F-060/080). Ursprünglich vorgesehene Anforderungen zum eigenständigen Anlegen von E-Key-Datensätzen durch die FSR-Redaktion im neuen Backend sind damit entfallen — das bestehende Tool bleibt alleiniges System, in dem der FSR E-Key-Datensätze anlegt und pflegt.

**`EKEY-F-060`/`EKEY-F-080`** — „Gesperrt" ist in der App ausschließlich ein angezeigter Statuswert, kein Eingriff in ein physisches Schließsystem (siehe Abschnitt 2, Nicht-Scope). Das eigentliche Sperren sowie alle Folgeschritte (Kontakt zur Studentin, physische Deaktivierung) übernehmen der FSR und dessen bestehendes E-Key-Verwaltungstool außerhalb der App — die App trägt lediglich den auslösenden Vorfall dort ein.

## 5. Datenmodell

System der Wahrheit für E-Key-Nummer, Matrikelnummer, Berechtigungen und deren Pflege ist das bestehende E-Key-Verwaltungstool des FSR (INT-014), nicht das neue App-Backend. Das App-Backend hält lediglich die Verknüpfung zum Konto vor: E-Key-Nummer-Referenz, verknüpftes Konto (Referenz auf die Identität aus `platform/identity-and-moderation.md`, erst nach erfolgreicher Verknüpfung gemäß EKEY-F-035 gesetzt), zuletzt bei INT-014 gelesener Status/Berechtigungen (Zwischenspeicher für die Anzeige, EKEY-F-040), Zeitpunkt der letzten semesterweisen Bestätigung, Frist der nächsten fälligen Bestätigung.

## 6. Externe Schnittstellen

Über das eigene Backend INT-008 (siehe `platform/backend-and-api.md` API-F-175), das sich seinerseits mit dem bestehenden E-Key-Verwaltungstool (INT-014) für Prüfung, Statusanzeige und das Eintragen von Statusänderungen integriert. Konto-Anmeldung nutzt INT-012 (Hochschul-SSO) bzw. dessen Ersatzoption, siehe `platform/integrations.md`. Keine weiteren externen Schnittstellen.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Kein E-Key verknüpft | Hinweis auf die Verknüpfungsmöglichkeit und Verweis auf FSR-Webseite/Wiki zur Erstausgabe (EKEY-F-020) |
| Verknüpfen | Eingabeformular für Matrikelnummer und E-Key-Nummer, Ladeanzeige während der Prüfung |
| Verknüpft, aktiv | Anzeige von Status und Berechtigungen |
| Verknüpft, gesperrt | Status „gesperrt" mit Grund (verloren gemeldet oder Bestätigung ausgeblieben) |
| Bestätigung fällig | Banner/Hinweis vor Ablauf der Bestätigungsfrist |
| Fehler | Fehlermeldung mit Wiederholen-Option beim Laden des Status |
| Offline | Zuletzt geladener Status bleibt sichtbar mit Alters-Hinweis; Verknüpfen wird sofort abgelehnt, Verloren-Melden und Bestätigen sind Schreibpfade und landen in der Offline-Warteschlange, siehe Abschnitt 8 |

## 8. Offline-Verhalten

Die Statusanzeige (EKEY-F-040) ist ein Lesepfad mit zuletzt geladenem Stand, offline verfügbar wie andere Lesepfade. Verloren-Melden (EKEY-F-050) und die semesterweise Bestätigung (EKEY-F-070) sind Schreibpfade und werden gemäß `platform/architecture.md` (ARCH-F-120) und `platform/data-and-storage.md` (DATA-F-100) in die lokale Offline-Warteschlange eingereiht, analog `features/canteen-ratings/spec.md` Abschnitt 8. Das Verknüpfen (EKEY-F-030) ist davon ausgenommen: Eine eingegebene E-Key-Nummer kann zwischenzeitlich bereits mit einem anderen Konto verknüpft worden sein (siehe Abschnitt 9), weshalb die App diesen Vorgang bei fehlender Verbindung gemäß `platform/architecture.md` (ARCH-F-125) ablehnen muss, statt ihn einzureihen.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Eingegebene Matrikelnummer/E-Key-Nummer-Kombination stimmt mit keinem Datensatz im E-Key-Verwaltungstool (INT-014) überein | Fehlermeldung, Hinweis auf Rücksprache mit dem FSR — kein Hinweis, welcher der beiden Werte falsch war (Missbrauchsschutz gegen Erraten) |
| E-Key-Verwaltungstool (INT-014) bei Prüfung/Statuseintrag nicht erreichbar | Fehlermeldung mit Wiederholen-Option; Schreibvorgänge (Verloren-Melden, Bestätigen) landen in der Offline-Warteschlange wie bei sonstigem Netzausfall |
| E-Key-Nummer bereits mit einem anderen Konto verknüpft | Ablehnung, Hinweis auf Rücksprache mit dem FSR (Missbrauchsschutz) |
| Verloren-Meldung für einen bereits gesperrten E-Key | Keine Fehlermeldung, Status bleibt unverändert gesperrt |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| EKEY-N-010 | Das System muss Versuche, eine E-Key-Kennung durch wiederholtes Ausprobieren zu erraten, gemäß `platform/backend-and-api.md` (API-N-010) begrenzen. | NEU |

## 11. Akzeptanzkriterien

- Eine gültige, noch nicht verknüpfte Kombination aus Matrikelnummer und E-Key-Nummer lässt sich mit dem eigenen Konto verknüpfen; eine bereits verknüpfte E-Key-Nummer wird abgelehnt.
- Eine Verloren-Meldung sperrt den E-Key unmittelbar und ist danach nicht rückgängig zu machen.
- Ein E-Key ohne fristgerechte semesterweise Bestätigung wird nach Fristablauf automatisch gesperrt.

## 12. Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet E-Key-Verwaltung.

## 13. Offene Fragen

- Technische Integrationsart mit dem bestehenden E-Key-Verwaltungstool (INT-014): direkter Zugriff auf dessen Postgres-Datenbank oder eine vom Tool bereitgestellte Schnittstelle? Direkter Datenbankzugriff zweier unabhängiger Anwendungen ohne vermittelnde API birgt das Risiko, dass Schema-Änderungen im bestehenden Tool das neue Backend unbemerkt brechen — Klärung durch technische Leitung vor Umsetzung, siehe `platform/integrations.md` INT-014.
- Genauer Kalendertermin/-zeitraum der semesterweisen Bestätigung (EKEY-F-070/080) — fester Zeitpunkt je Semester ist entschieden (FSR FB4, 2026-08-25), konkretes Datum sowie Vorlaufzeit der Erinnerung legt der FSR operativ je Semester fest.
- Ob Hochschul-SSO als Konto-Anmeldeweg verfügbar ist — `platform/integrations.md` INT-012. Die Kontopflicht selbst ist entschieden (`decisions/0004-identitaet-und-anmeldung.md`), offen ist nur noch, ob SSO oder die Ersatzoption (eigenes Konto, z. B. E-Mail-Verifizierung) zum Einsatz kommt.
- QR-Code-gestützte Vorausfüllung des Ausgabeformulars: bewusst zurückgestellt (Entscheidung FSR FB4, 2026-08-25), keine Anforderung in diesem Umfang. Wäre ohnehin am bestehenden E-Key-Verwaltungstool zu verorten, nicht an dieser Spec, sollte sie künftig aufgenommen werden. Empfehlung aus der Spec-Prüfung vom 2026-08-26: Bei Umsetzung von EKEY erneut prüfen, ob diese Option gegenüber der aktuellen Zwei-Zahlen-Eingabe (EKEY-F-030) vorgezogen werden sollte — das Erraten zweier mäßig geheimer Zahlen ist strukturell schwächer als ein bei Ausgabe gescannter Code. Keine Änderung der aktuellen Anforderung, nur eine Entscheidungsgrundlage für den FSR bei Umsetzung.
