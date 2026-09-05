## Purpose

Legt fest, wie die App Nutzeridentität für Mensa-Bewertungen, Helfer-Anmeldungen und die E-Key-Verwaltung handhabt, welche Rollen es gibt und wie mit gemeldeten Inhalten umgegangen wird. Die datenschutzrechtliche Einordnung steht in Capability `security-and-privacy`, nicht hier. Vormals `specs/platform/identity-and-moderation.md` (Präfix `IDENT`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Pseudonym für Mensa-Bewertungen (entfallen)

Das System sollte ursprünglich für eine Mensa-Bewertung ausschließlich ein Pseudonym als Identitätsmerkmal verlangen. Entfallen: Vor der Entscheidung ADR 0004 (2026-08-25) verlangte diese Anforderung für jede Bewertung ausschließlich ein Pseudonym, auch zum Verfassen. Ersetzt durch die Requirements „Kein Identitätsmerkmal beim Lesen von Bewertungen“ (Lesen, kontofrei) und „Konto für das Verfassen einer Bewertung“ (Schreiben, Konto erforderlich) — die Kontopflicht für den Schreibpfad ist eine inhaltliche Verschärfung gegenüber dem ursprünglichen reinen Pseudonym-Modell, kein reines Umbenennen. Das im Konto hinterlegte Identitätsmerkmal (SSO-Kennung oder E-Mail-Adresse) tritt an die Stelle des bisherigen Pseudonyms als Grundlage für die Einmal-pro-Tag-Sperre; ein öffentlich angezeigtes Pseudonym (Anzeigename) bleibt davon unabhängig bestehen. Herkunft: NEU (vormals IDENT-F-010, entfallen).

#### Scenario: Nachweis der Ablösung
- **WHEN** geprüft wird, ob eine Mensa-Bewertung mit einem reinen Pseudonym ohne Konto verfasst werden kann
- **THEN** trifft das nicht mehr zu — das Verfassen erfordert ein Konto

### Requirement: Kein Identitätsmerkmal beim Lesen von Bewertungen

Das System muss für das Lesen von Mensa-Bewertungen kein Identitätsmerkmal verlangen. Herkunft: NEU (vormals IDENT-F-012).

#### Scenario: Bewertungen ansehen
- **WHEN** eine Person Mensa-Bewertungen ansehen will
- **THEN** verlangt die App dafür kein Identitätsmerkmal

### Requirement: Konto für das Verfassen einer Bewertung

Das System muss für das Verfassen einer Mensa-Bewertung ein Konto verlangen (siehe Abschnitt „Entscheidung“). Herkunft: NEU (vormals IDENT-F-015).

#### Scenario: Bewertung ohne Konto
- **WHEN** eine Person ohne Konto eine Bewertung verfassen will
- **THEN** verlangt die App zuerst die Anmeldung mit einem Konto

### Requirement: Name und ein Kontaktweg für Helfer-Anmeldung

Das System muss für eine Helfer-Anmeldung ausschließlich einen Namen und genau einen Kontaktweg verlangen, kein Konto. Herkunft: NEU (vormals IDENT-F-020).

#### Scenario: Helfer meldet sich an
- **WHEN** eine Person sich als Helferin anmeldet
- **THEN** verlangt die App dafür nur Namen und genau einen Kontaktweg, kein Konto

### Requirement: Verzicht auf Matrikelnummer, Geburtsdatum und Adresse

Das System muss darauf verzichten, für eine Helfer-Anmeldung oder für das Bewertungs-Konto Matrikelnummer, Geburtsdatum oder Adresse zu erheben. Herkunft: NEU (vormals IDENT-F-030).

#### Scenario: Formularfelder prüfen
- **WHEN** das Formular für Helfer-Anmeldung oder Bewertungs-Konto geprüft wird
- **THEN** enthält es keine Felder für Matrikelnummer, Geburtsdatum oder Adresse

### Requirement: Matrikelnummer ausnahmsweise für E-Key-Verknüpfung

Das System muss für die E-Key-Verknüpfung ausnahmsweise die Matrikelnummer erheben, ausschließlich zum Abgleich gegen den vom FSR angelegten E-Key-Datensatz (siehe Capability `e-key`). Herkunft: NEU (vormals IDENT-F-035).

#### Scenario: E-Key-Verknüpfung anlegen
- **WHEN** eine Nutzerin eine E-Key-Verknüpfung anlegt
- **THEN** erhebt die App die Matrikelnummer ausschließlich zum Abgleich gegen den vom FSR angelegten E-Key-Datensatz

### Requirement: Zugriffsbeschränkung auf Helferlisten und Moderation

Das System muss den Zugriff auf Helferlisten auf die Rolle FSR-Redaktion und die Bearbeitung gemeldeter Inhalte auf die Rolle Moderation beschränken. Herkunft: NEU (vormals IDENT-F-040).

#### Scenario: Zugriff ohne passende Rolle
- **WHEN** eine Person ohne die Rolle FSR-Redaktion auf eine Helferliste zugreifen will
- **THEN** verweigert das System den Zugriff

### Requirement: Rollenzugehörigkeit aus dem Identitätsanbieter

Das System muss die Rollenzugehörigkeit einer Person aus dem Identitätsanbieter beziehen, statt sie eigenständig zu verwalten. Herkunft: NEU (vormals IDENT-F-045). Rollen werden als Gruppen in Authentik geführt und als Claim im Token übertragen. Das Backend prüft diesen Claim, hält aber keine eigene Rollentabelle. Die Zuweisung selbst erfolgt über die Verwaltungsoberfläche (Capability `admin`), die auf Authentik wirkt — damit bleibt genau eine Stelle maßgeblich, und ein entzogener Zugang wirkt sofort für alle Anwendungen.

#### Scenario: Rollenprüfung im Backend
- **WHEN** das Backend die Rolle einer Person prüft
- **THEN** liest es sie aus dem Claim des Identitätsanbieters, ohne eine eigene Rollentabelle zu führen

### Requirement: Sperre bei Mehrfachbewertung desselben Gerichts

Wenn eine Person für ein Gericht an einem Tag bereits eine Bewertung abgegeben hat, muss das System eine weitere Bewertung derselben Person für dasselbe Gericht am selben Tag ablehnen. Herkunft: NEU (vormals IDENT-F-050).

#### Scenario: Zweite Bewertung am selben Tag
- **WHEN** dieselbe Person am selben Tag ein zweites Mal dasselbe Gericht bewertet
- **THEN** lehnt das System die zweite Bewertung ab

### Requirement: Erkennung massenhafter kontogebundener Beiträge

Das System muss Muster massenhafter, in kurzer Zeit von derselben Quelle eingehender Bewertungen erkennen und zur Prüfung markieren. Herkunft: NEU (vormals IDENT-F-060).

#### Scenario: Bewertungsflut von einer Quelle
- **WHEN** in kurzer Zeit ungewöhnlich viele Bewertungen von derselben Quelle eingehen
- **THEN** markiert das System sie zur Prüfung durch die Moderation

### Requirement: Erkennung massenhafter kontofreier Beiträge

Das System muss Muster massenhafter, in kurzer Zeit von derselben Quelle eingehender kontofreier Beiträge erkennen und zur Prüfung markieren. Herkunft: NEU (vormals IDENT-F-065). Das Merkmal, auf das sich „Quelle“ bei kontofreien Beiträgen stützt (Netzadresse, geräteseitige Kennung oder beides), ist bei Umsetzung festzulegen, unter Beachtung der Capability `security-and-privacy` und der Aufbewahrungsfrist technischer Protokolle.

#### Scenario: Flut kontofreier Helfer-Anmeldungen
- **WHEN** in kurzer Zeit ungewöhnlich viele kontofreie Beiträge von derselben Quelle eingehen
- **THEN** markiert das System sie zur Prüfung durch die Moderation

### Requirement: Kontosperre bei bestätigtem Missbrauch

Wenn Moderation einen Missbrauchsfall bestätigt, muss das System das zugehörige Konto für 30 Tage sperren, mit Widerspruchsmöglichkeit für die betroffene Person. Herkunft: NEU (vormals IDENT-F-070).

#### Scenario: Bestätigter Missbrauchsfall
- **WHEN** die Moderation einen Missbrauchsfall bestätigt
- **THEN** sperrt das System das zugehörige Konto für 30 Tage und bietet der betroffenen Person eine Widerspruchsmöglichkeit

### Requirement: Serverseitige Abmeldung beim Identitätsanbieter

Wenn sich eine Nutzerin abmeldet, muss das System zusätzlich zum lokalen Entfernen der Zugangsdaten eine serverseitige Abmeldung (RP-Initiated Logout) beim Identitätsanbieter auslösen, die die Sitzung dort invalidiert. Herkunft: NEU (vormals IDENT-F-140). Ohne serverseitige Invalidierung bliebe ein entwendetes Token nach „Abmelden“ clientseitig weiter gültig. Ergänzt Capability `data-and-storage`, Requirement „Entfernen des Sitzungsmerkmals bei Abmeldung“, das für sich allein nicht ausreicht.

#### Scenario: Abmeldung auslösen
- **WHEN** eine Nutzerin sich abmeldet
- **THEN** löst das System zusätzlich zum lokalen Entfernen eine serverseitige Abmeldung beim Identitätsanbieter aus

### Requirement: Kurzlebige Zugriffstoken mit Refresh-Erneuerung

Das System muss kurzlebige Zugriffstoken mit Refresh-Token-Erneuerung verwenden, statt ein Zugriffstoken unverändert bis zu seinem Ablauf vorzuhalten. Herkunft: NEU (vormals IDENT-N-030). Ergänzt das Requirement „Serverseitige Abmeldung beim Identitätsanbieter“: Ohne serverseitige Invalidierung bliebe ein entwendetes Token nach „Abmelden“ sonst clientseitig weiter gültig.

#### Scenario: Zugriffstoken läuft ab
- **WHEN** ein kurzlebiges Zugriffstoken abläuft, während die Sitzung fortbesteht
- **THEN** erneuert das System es über das Refresh-Token, ohne dass sich die Nutzerin erneut anmelden muss

### Requirement: Zusätzliche Registrierungsbegrenzung ohne aktive Föderation

Solange die FH-Föderation für Authentik nicht aktiv ist, muss das System Kontoregistrierungen zusätzlich zur Anfragequelle (IP-Adresse) begrenzen, um eine Umgehung der Ratenbegrenzung durch Mehrfachregistrierung zu erschweren. Herkunft: NEU (vormals IDENT-F-150). Betrifft insbesondere die für die erste Ausbaustufe vorgesehene Missbrauchserkennung bei Bewertungen — ein kontobezogenes Ratenlimit (Capability `backend-and-api`) ist wirkungslos, solange ein Konto durch bloße E-Mail-Verifizierung günstig neu angelegt werden kann.

#### Scenario: Mehrfachregistrierung von einer Adresse
- **WHEN** dieselbe Anfragequelle ohne aktive FH-Föderation mehrere Konten kurz hintereinander registriert
- **THEN** begrenzt das System weitere Registrierungen von dieser Quelle

### Requirement: Unmittelbare Veröffentlichung ohne Vorprüfung

Das System muss eingereichte Bewertungskommentare unmittelbar nach dem Absenden veröffentlichen, ohne redaktionelle Vorprüfung. Herkunft: NEU (vormals IDENT-F-080). Vorprüfung vor Veröffentlichung (Prämoderation) wurde erwogen und verworfen: Der FSR betreibt die Moderation ehrenamtlich und kann keine durchgängige Prüfzeit vor Veröffentlichung zusagen; eine Prämoderationswarteschlange würde Bewertungen tage- statt minutenaktuell machen und die Beteiligung dämpfen. Nachträgliche Prüfung mit niedrigschwelligem Meldeweg ist der für ehrenamtlich betriebene Communitys übliche Ansatz und wird hier übernommen.

#### Scenario: Kommentar absenden
- **WHEN** eine Nutzerin einen Bewertungskommentar absendet
- **THEN** veröffentlicht das System ihn unmittelbar, ohne redaktionelle Vorprüfung

### Requirement: Markierung gemeldeter Kommentare ohne automatisches Ausblenden

Wenn eine Nutzerin oder ein Nutzer einen Kommentar meldet, muss das System ihn zur Prüfung durch die Moderation markieren, ohne ihn automatisch auszublenden. Herkunft: NEU (vormals IDENT-F-090).

#### Scenario: Kommentar melden
- **WHEN** ein Kommentar gemeldet wird
- **THEN** markiert das System ihn zur Prüfung, bleibt aber weiterhin sichtbar

### Requirement: Prüfung gemeldeter Inhalte innerhalb von fünf Werktagen

Das System muss gemeldete Inhalte innerhalb von fünf Werktagen prüfen. Herkunft: NEU (vormals IDENT-N-010).

#### Scenario: Meldung liegt vor
- **WHEN** ein Inhalt gemeldet wurde
- **THEN** ist er innerhalb von fünf Werktagen durch die Moderation geprüft

### Requirement: Benachrichtigung bei Entfernung eines Kommentars

Wenn die Moderation einen gemeldeten Kommentar entfernt, muss das System die einreichende Person über die Entfernung und den Grund benachrichtigen. Herkunft: NEU (vormals IDENT-F-100).

#### Scenario: Kommentar entfernt
- **WHEN** die Moderation einen gemeldeten Kommentar entfernt
- **THEN** benachrichtigt das System die einreichende Person über Entfernung und Grund

### Requirement: Widerspruchsmöglichkeit gegen Entfernung

Das System muss der einreichenden Person die Möglichkeit bieten, der Entfernung ihres Kommentars zu widersprechen. Herkunft: NEU (vormals IDENT-F-110).

#### Scenario: Widerspruch einlegen
- **WHEN** eine Person der Entfernung ihres Kommentars widersprechen will
- **THEN** bietet das System ihr dafür eine Möglichkeit

### Requirement: Löschfrist für Helfer-Kontaktdaten nach Event-Ende

Wenn ein Event beendet ist, muss das System die zugehörigen Helfer-Kontaktdaten spätestens nach 30 Tagen löschen. Herkunft: NEU (vormals IDENT-N-020). 30 Tage sind als Frist gewählt, weil der FSR nach einem Event üblicherweise noch Dank, Nachbesprechung oder Abrechnung mit den Helfenden organisiert; danach besteht kein fachlicher Bedarf mehr, Name und Kontaktweg vorzuhalten.

#### Scenario: 30 Tage nach Event-Ende
- **WHEN** seit dem Ende eines Events 30 Tage vergangen sind
- **THEN** löscht das System die zugehörigen Helfer-Kontaktdaten

### Requirement: Bewertungen bleiben nach Kontolöschung entkoppelt sichtbar

Das System muss Bewertungen nach Löschung des zugehörigen Kontos weiterhin anzeigen, wobei das angezeigte Pseudonym vom gelöschten Konto entkoppelt bleibt. Herkunft: NEU (vormals IDENT-F-120).

#### Scenario: Konto gelöscht
- **WHEN** ein Konto gelöscht wird, dem Bewertungen zugeordnet waren
- **THEN** bleiben die Bewertungen mit einem vom gelöschten Konto entkoppelten Pseudonym sichtbar

### Requirement: Löschung personenbezogener Daten auf Antrag

Wenn eine Nutzerin oder ein Nutzer die Löschung des eigenen Kontos beantragt, muss das System alle personenbezogenen Daten dieser Person löschen, mit Ausnahme bereits entkoppelter Bewertungsinhalte. Herkunft: NEU (vormals IDENT-F-130).

#### Scenario: Kontolöschung beantragt
- **WHEN** eine Person die Löschung ihres Kontos beantragt
- **THEN** löscht das System alle ihre personenbezogenen Daten außer bereits entkoppelten Bewertungsinhalten

## Zielkonflikt

Der Fachbereich wünscht ausdrücklich eine „einfache Möglichkeit für Studierende, sich als Helfer einzutragen“ — jede Anmeldehürde arbeitet dagegen. Gleichzeitig sind Bewertungen ohne jede Identität nicht gegen Mehrfach- und Spam-Abgabe zu schützen, eine Helferliste ohne verlässliche Zuordnung ist für den FSR wertlos, und die E-Key-Verwaltung (Capability `e-key`) braucht ein über Semestergrenzen hinweg wiedererkennbares Konto für die semesterweise Bestätigung. Diese Capability löst den Konflikt nicht durch eine einheitliche Lösung, sondern durch Abstufung je Funktion (Abschnitt „Entscheidung“).

## Entscheidung (ADR 0004)

Entschieden in `specs/decisions/0004-identitaet-und-anmeldung.md`, FSR FB4, 2026-08-25:

| Funktion | Identitätsstufe | Hürde |
|---|---|---|
| Alle Lesefunktionen (Stundenplan, Mensaplan, News, Raumsuche, Wiki, Event-Kalender, Notenübersicht), Mensa-Bewertungen lesen | keine — vollständig kontofrei | keine |
| Helfer-Anmeldung | Name + ein Kontaktweg, kein Konto | niedrig |
| Mensa-Bewertung verfassen | Konto erforderlich | mittel |
| E-Key-Verwaltung | Konto erforderlich | mittel |

Zusätzlich kontogebunden ist der Zugang zur Verwaltungs- und Redaktionsoberfläche (Capability `admin`), dort über die Rollen aus Abschnitt „Rollen“.

Das Konto entsteht über eine eigenbetriebene Authentik-Instanz als einzigen Identitätsanbieter, angebunden per OpenID Connect im Systembrowser. Authentik meldet sich seinerseits gegen den Microsoft-Mandanten der FH Dortmund an, sobald die dafür nötige App-Registrierung erteilt ist; bis dahin führt Authentik eigene Konten mit E-Mail-Verifizierung. Für App und Backend ist dieser Unterschied unsichtbar. Passwort-Replay gegen ein Hochschulsystem bleibt in beiden Fällen ausgeschlossen. Entscheidung FSR FB4, 2026-08-25, siehe `specs/decisions/0010-authentik-als-identitaetsanbieter.md`; Zielkonflikt und Abstufung siehe ADR 0004.

## Rollen

| Rolle | Bewertungen | Events / News | Helferlisten | Moderation |
|---|---|---|---|---|
| Studierende | abgeben, eigene löschen | lesen | eigene Anmeldung abgeben | Inhalte melden |
| FSR-Redaktion | lesen | pflegen | einsehen | – |
| Moderation | gemeldete prüfen und entfernen | – | – | bearbeiten |

## Moderation nutzergenerierter Inhalte

Lebenszyklus eines Bewertungskommentars: eingereicht → sichtbar → gemeldet → geprüft → sichtbar/entfernt.

## Verweis Datenschutz

Die datenschutzrechtliche Einordnung (Rechtsgrundlage, Betroffenenrechte, Auftragsverarbeitung) steht in Capability `security-and-privacy`.

## Offene Fragen

- Zeitpunkt und Ergebnis der App-Registrierung im Microsoft-Mandanten der FH Dortmund, die Authentik für die Federation benötigt — Capability `integrations`, Eintrag INT-012, Klärung durch FSR FB4 mit der Hochschul-IT. Die Umsetzung ist davon nicht blockiert, da Authentik bis dahin eigene Konten führt.
- Ob bei aktiver Federation zuvor angelegte eigene Konten migriert oder parallel weiterbetrieben werden — offener Punkt in `specs/decisions/0010-authentik-als-identitaetsanbieter.md`.
- Auf welches Merkmal die Erkennung massenhafter kontofreier Beiträge die „Quelle“ stützt (Netzadresse, geräteseitige Kennung oder beides) — bei Umsetzung festzulegen, unter Beachtung von Capability `security-and-privacy` und der Aufbewahrungsfrist technischer Protokolle.
