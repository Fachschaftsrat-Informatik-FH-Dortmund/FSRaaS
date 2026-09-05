## Purpose

Beschreibt die Verwaltungsoberfläche, über die der FSR FB4 Inhalte pflegt — FSR-News redigieren, Laufwege pflegen, Helferbedarf verwalten, Stammdaten ändern und gemeldete Bewertungskommentare moderieren —, als eine Codebasis mit zwei responsiven Layouts (App und PC-Weboberfläche). Vormals `specs/features/admin/spec.md` (Präfix `ADMIN`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Ablehnung des Zugriffs ohne Verwaltungsrolle

Falls eine Person ohne die Rolle FSR-Redaktion oder Moderation eine Verwaltungsfunktion aufruft, muss das System den Zugriff ablehnen. Herkunft: NEU (vormals ADMIN-F-010).

#### Scenario: Direktaufruf ohne Rolle
- **WHEN** ein Konto ohne die Rolle FSR-Redaktion oder Moderation einen Verwaltungspfad direkt aufruft
- **THEN** lehnt das Backend den Zugriff ab, unabhängig von der Sichtbarkeit in der Oberfläche

### Requirement: Sichtbarkeit des Verwaltungsbereichs nur mit Rolle

Das System muss den Verwaltungsbereich nur Konten mit mindestens einer Verwaltungsrolle überhaupt sichtbar machen. Herkunft: NEU (vormals ADMIN-F-020).

#### Scenario: Konto ohne Verwaltungsrolle
- **WHEN** ein angemeldetes Konto keine Verwaltungsrolle trägt
- **THEN** blendet die Oberfläche den Verwaltungsbereich vollständig aus

### Requirement: Gleicher Funktionsumfang in App und Weboberfläche

Das System muss denselben fachlichen Funktionsumfang in der App und in der Weboberfläche bereitstellen. Herkunft: NEU (vormals ADMIN-F-030).

#### Scenario: Meldung in beiden Oberflächen bearbeitbar
- **WHEN** eine Verwaltungshandlung in der App verfügbar ist
- **THEN** steht dieselbe Handlung mit gleichem Ergebnis auch in der Weboberfläche zur Verfügung

### Requirement: Meldungsredaktion für FSR-News

Das System muss der Rolle FSR-Redaktion das Anlegen, Bearbeiten, Veröffentlichen und Zurückziehen von Meldungen der Klassifizierung „FSR-News" ermöglichen. Herkunft: NEU (vormals ADMIN-F-040).

#### Scenario: Meldung anlegen und veröffentlichen
- **WHEN** ein Konto mit Rolle FSR-Redaktion eine neue Meldung anlegt und veröffentlicht
- **THEN** erscheint die Meldung als FSR-News in der Meldungsliste der App

### Requirement: Entfernen zurückgezogener Meldungen aus der Liste

Wenn eine Meldung zurückgezogen wird, muss das System sie aus der Meldungsliste der App entfernen und angepinnte Verweise darauf als zurückgezogen kennzeichnen. Herkunft: NEU (vormals ADMIN-F-050).

#### Scenario: Angepinnte Meldung wird zurückgezogen
- **WHEN** eine angepinnte Meldung zurückgezogen wird
- **THEN** entfernt das System sie aus der Meldungsliste und kennzeichnet den angepinnten Verweis als zurückgezogen statt ihn kommentarlos verschwinden zu lassen

### Requirement: Vorschau vor Veröffentlichung

Das System muss vor dem Veröffentlichen einer Meldung eine Vorschau in der Darstellung der App anbieten. Herkunft: NEU (vormals ADMIN-F-060).

#### Scenario: Vorschau vor dem Veröffentlichen
- **WHEN** eine Redaktionsperson eine Meldung fertig verfasst hat und veröffentlichen will
- **THEN** zeigt das System zunächst eine Vorschau in der App-Darstellung, bevor die Veröffentlichung ausgelöst wird

### Requirement: Zuweisen und Entziehen von Verwaltungsrollen

Das System muss der Rolle FSR-Redaktion das Zuweisen und Entziehen der Rollen FSR-Redaktion und Moderation für einzelne Konten ermöglichen. Herkunft: NEU (vormals ADMIN-F-070). Konten mit bestehender Verwaltungsrolle listet die Oberfläche aus Authentik (siehe Capability `integrations`, INT-012). Ein Konto ohne bisherige Rolle wird über seinen Benutzernamen benannt; das Backend löst diesen vor der Aussperrprüfung und dem Protokolleintrag zur stabilen Authentik-Konto-Id auf (`core/users/?username=`, siehe Capability `integrations`, INT-012). Eine bereits numerische Kennung gilt unverändert. Ein unbekannter Benutzername wird als Fehler zurückgemeldet, nicht stillschweigend übergangen (siehe Capability `security-and-privacy`, SEC-F-060).

#### Scenario: Rolle einem neuen Konto zuweisen
- **WHEN** eine Redaktionsperson einem Konto ohne bisherige Rolle über dessen Benutzernamen die Rolle Moderation zuweist
- **THEN** löst das Backend den Benutzernamen zur Authentik-Konto-Id auf und weist die Rolle dieser Id zu

#### Scenario: Unbekannter Benutzername
- **WHEN** eine Rollenzuweisung einen Benutzernamen nennt, der in Authentik nicht existiert
- **THEN** meldet das System einen Fehler, statt die Zuweisung stillschweigend zu übergehen

### Requirement: Aussperrschutz bei letzter Redaktionsrolle

Falls eine Person sich selbst die letzte verbleibende Zuweisung der Rolle FSR-Redaktion entziehen will, muss das System den Vorgang ablehnen. Herkunft: NEU (vormals ADMIN-F-080). Ohne diese Regel könnte sich der FSR versehentlich vollständig aus der eigenen Verwaltung aussperren; die Wiederherstellung wäre nur mit Serverzugang möglich und damit an einzelne Personen gebunden.

#### Scenario: Letzte Zuweisung entziehen
- **WHEN** das einzige Konto mit der Rolle FSR-Redaktion sich selbst diese Rolle entziehen will
- **THEN** lehnt das System den Vorgang ab

### Requirement: Pflege von Laufwege-Einträgen

Das System muss der Rolle FSR-Redaktion das Anlegen, Ändern und Entfernen von Laufwege-Einträgen zwischen zwei Raumkennungen mit zugehörigem Distanzmaß ermöglichen. Herkunft: NEU (vormals ADMIN-F-090).

#### Scenario: Laufwege-Eintrag anlegen
- **WHEN** eine Redaktionsperson zwei Raumkennungen und ein Distanzmaß eingibt
- **THEN** legt das System den Laufwege-Eintrag an

### Requirement: Hinweis bei unbekannter Raumkennung im Laufweg

Falls ein Laufwege-Eintrag eine Raumkennung nennt, die in den aggregierten Raumdaten nicht vorkommt, muss das System darauf hinweisen und den Eintrag dennoch speichern. Herkunft: NEU (vormals ADMIN-F-100). Die aggregierten Raumdaten sind ein Abbild der FBWS-Termine (siehe Capability `integrations`, INT-002/INT-009) und enthalten nur Räume, in denen tatsächlich Veranstaltungen stattfinden; ein Verbindungsgang oder ein Treppenhaus taucht dort nie auf, ist für einen Nachbarschaftsgraphen aber sinnvoll.

#### Scenario: Raumkennung ohne Termine
- **WHEN** ein Laufwege-Eintrag eine Raumkennung enthält, zu der keine FBWS-Termine vorliegen
- **THEN** speichert das System den Eintrag und zeigt einen Hinweis auf die unbekannte Raumkennung

### Requirement: Protokollierung verändernder Verwaltungshandlungen

Das System muss jede verändernde Verwaltungshandlung mit Zeitpunkt, handelndem Konto und betroffenem Datensatz protokollieren. Herkunft: NEU (vormals ADMIN-F-110). Protokolliert werden Zeitpunkt, Konto und betroffener Datensatz, nicht der Inhalt nutzergenerierter Beiträge — Capability `security-and-privacy` (SEC-N-120) untersagt personenbezogene Inhalte in Protokollen, und Capability `backend-and-api` (API-N-080) verlangt Datensparsamkeit.

#### Scenario: Moderationsentscheidung protokollieren
- **WHEN** die Moderation einen Kommentar entfernt
- **THEN** hält das Verwaltungsprotokoll Zeitpunkt, handelndes Konto und Referenz auf den Kommentar fest, nicht dessen Wortlaut

### Requirement: Liste gemeldeter Bewertungskommentare für Moderation

Das System muss der Rolle Moderation eine Liste der gemeldeten Bewertungskommentare mit den Handlungsmöglichkeiten Entfernen und Verwerfen der Meldung bereitstellen. Herkunft: NEU (vormals ADMIN-F-120).

#### Scenario: Gemeldeten Kommentar entfernen
- **WHEN** ein Kommentar in der Liste der gemeldeten Kommentare als unangemessen erkannt wird
- **THEN** kann die Moderation ihn direkt aus der Liste heraus entfernen

### Requirement: Kontosperrung und Widerspruchsbearbeitung durch Moderation

Das System muss der Rolle Moderation das Sperren eines Kontos gemäß der Capability `identity-and-moderation` (IDENT-F-070) sowie das Bearbeiten eines Widerspruchs gemäß IDENT-F-110 ermöglichen. Herkunft: NEU (vormals ADMIN-F-130).

#### Scenario: Konto sperren
- **WHEN** die Moderation ein Konto wegen wiederholten Missbrauchs sperrt
- **THEN** greift die Sperre gemäß IDENT-F-070 aus der Verwaltungsoberfläche heraus

### Requirement: Anlegen von Helferbedarf je Event

Das System muss der Rolle FSR-Redaktion das Anlegen und Ändern von Helferbedarf je Event, gegliedert nach Rolle, Schicht und benötigter Personenzahl, ermöglichen. Herkunft: NEU (vormals ADMIN-F-140).

#### Scenario: Helferbedarf anlegen
- **WHEN** eine Redaktionsperson für ein Event eine Schicht mit Rolle und benötigter Personenzahl anlegt
- **THEN** übernimmt das System den Bedarf in die Event-Verwaltung

### Requirement: Übersicht der Besetzung je Event

Das System muss der Rolle FSR-Redaktion eine Übersicht aller Rollen/Schichten eines Events mit besetzten und offenen Plätzen bereitstellen. Herkunft: NEU (vormals ADMIN-F-150).

#### Scenario: Offene Plätze erkennen
- **WHEN** eine Redaktionsperson die Übersicht eines Events öffnet
- **THEN** zeigt das System je Rolle/Schicht die Anzahl besetzter und offener Plätze

### Requirement: Prüfungsplan-Upload mit Importergebnis

Das System muss der Rolle FSR-Redaktion den Upload einer Prüfungsplan-Datei sowie die Anzeige des Importergebnisses (übernommene Einträge, verworfene Zeilen mit Grund) ermöglichen. Herkunft: NEU (vormals ADMIN-F-160).

#### Scenario: Import mit Ergebnisbericht
- **WHEN** eine Redaktionsperson eine Prüfungsplan-Datei hochlädt
- **THEN** zeigt das System nach dem Import die Anzahl übernommener Einträge und die verworfenen Zeilen mit Grund

### Requirement: Abschluss des Imports trotz unlesbarer Zeilen

Wenn ein Prüfungsplan-Upload Zeilen enthält, die nicht ausgewertet werden konnten, muss das System den Import dennoch abschließen und die betroffenen Zeilen einzeln benennen. Herkunft: NEU (vormals ADMIN-F-170).

#### Scenario: Einzelne unlesbare Zeile
- **WHEN** eine Prüfungsplan-Datei eine nicht auswertbare Zeile neben sonst gültigen Zeilen enthält
- **THEN** schließt das System den Import der gültigen Zeilen ab und benennt die unlesbare Zeile einzeln im Ergebnisbericht

### Requirement: Pflege der Stammdaten-Listen

Das System muss der Rolle FSR-Redaktion das Anlegen, Ändern und Entfernen von Einträgen der Mensa-Liste, der Raumliste und der Links-/Downloads-Liste ermöglichen. Herkunft: NEU (vormals ADMIN-F-180). Das abgelöste Backend `app.fsrfb4.de` pflegte diese Daten über ein Formular ohne Übersicht, Validierung oder Historie und veraltete dadurch (siehe Capability `integrations`, INT-008, „Lese-/Schreibtrennung bei `/data`"). Gespeichert wird je Liste als Ganzes (vollständige Ersetzung), abgesichert gegen gleichzeitige Bearbeitung durch dieselbe optimistische Nebenläufigkeitskontrolle wie bei Meldungsentwürfen (`If-Match`, siehe Abschnitt „Fehlerfälle"). Strukturell fehlerhafte Eingaben (leere oder doppelte Kennungen) werden als `400` abgewiesen, nicht erst beim Speichern.

#### Scenario: Raum-Eintrag entfernen
- **WHEN** eine Redaktionsperson einen Eintrag aus der Raumliste entfernt
- **THEN** speichert das System die Raumliste ohne diesen Eintrag als neue Gesamtfassung

### Requirement: Ändern von Semesterterminen und Ticket-Bildausschnitt

Das System muss der Rolle FSR-Redaktion das Ändern der Semestertermine und des Ticket-Bildausschnitts ermöglichen. Herkunft: NEU (vormals ADMIN-F-190). Der App wird derselbe Bestand kontofrei ausgeliefert (siehe Capability `backend-and-api`, API-F-230), mit einem im Anwendungspaket mitgelieferten Ausgangsbestand als Rückfall (API-F-235).

#### Scenario: Semestertermine aktualisieren
- **WHEN** eine Redaktionsperson die Semestertermine für das kommende Semester einträgt
- **THEN** übernimmt das System die neuen Termine und liefert sie kontofrei an die App aus

### Requirement: Ablehnung bei gleichzeitiger Änderung einer Stammdaten-Liste

Wenn eine Stammdaten-Liste gespeichert wird, während sie zwischenzeitlich von einer anderen Person geändert wurde, muss das System den Speichervorgang ablehnen und den neueren Stand zur erneuten Bearbeitung anbieten. Herkunft: NEU (vormals ADMIN-F-200). Die Prüfung greift zweistufig: der `If-Match`-Vergleich vor der Änderung und eine Nebenläufigkeitskennung auf Datenbankebene, die das Zeitfenster bis zum Festschreiben abdeckt — beide Wege münden in dieselbe Antwort (`412`), die App lädt daraufhin den neueren Stand nach und bietet ihn zur erneuten Bearbeitung an.

#### Scenario: Gleichzeitige Bearbeitung derselben Liste
- **WHEN** zwei Personen dieselbe Stammdaten-Liste gleichzeitig bearbeiten und die zweite Person speichert
- **THEN** lehnt das System den zweiten Speichervorgang mit `412` ab und bietet den zwischenzeitlich neueren Stand zur erneuten Bearbeitung an

### Requirement: Bedienbarkeit der Weboberfläche ab 1024 Pixeln

Das System muss die Weboberfläche auf Bildschirmbreiten ab 1024 Pixeln vollständig bedienbar machen, ohne die Hochformat-Vorgabe der App (Capability `non-functional`, NFR-N-150) zu berühren. Herkunft: NEU (vormals ADMIN-N-010).

#### Scenario: PC-Bildschirm ab 1024 Pixel
- **WHEN** die Weboberfläche auf einem Bildschirm mit mindestens 1024 Pixel Breite geöffnet wird
- **THEN** sind alle Verwaltungsfunktionen vollständig bedienbar, ohne dass die Hochformat-Vorgabe der App dadurch verändert wird

### Requirement: Aufbewahrung der Verwaltungsprotokolle über zwölf Monate

Das System muss Verwaltungsprotokolle mindestens zwölf Monate vorhalten, damit eine Handlung über einen Wechsel der FSR-Besetzung hinweg nachvollziehbar bleibt. Herkunft: NEU (vormals ADMIN-N-020). Zwölf Monate sind gewählt, weil die FSR-Besetzung jährlich wechselt; eine kürzere Frist würde bedeuten, dass die neue Besetzung Handlungen der vorherigen nicht mehr nachvollziehen kann. Die Frist steht nicht im Widerspruch zu den dreißig Tagen für technische Betriebsprotokolle (Capability `security-and-privacy`, Abschnitt 3): Dort geht es um IP-Adressen und aufgerufene Endpunkte, hier um Verwaltungshandlungen ohne personenbezogene Inhalte.

#### Scenario: Protokoll nach Besetzungswechsel
- **WHEN** eine neue FSR-Besetzung ein zehn Monate altes Verwaltungsprotokoll einsehen will
- **THEN** liegt es noch vor, weil die Aufbewahrungsfrist mindestens zwölf Monate beträgt

## Scope / Nicht-Scope

### Scope

- Zugangsschutz und Rollenprüfung für alle Verwaltungsfunktionen.
- Redaktion von FSR-News: anlegen, bearbeiten, veröffentlichen, zurückziehen.
- Zuweisung der Rollen FSR-Redaktion und Moderation an Konten.
- Pflege der Stammdaten ohne externes Quellsystem: Mensa-Liste, Raumliste, Links-/Downloads-Liste, Semestertermine und Ticket-Bildausschnitt (API-F-230).
- Pflege der Laufwege-Datenstruktur zwischen Räumen (Grundlage für RAUM-F-060, Capability `room-finder`).
- Moderation gemeldeter Bewertungskommentare (zweite Ausbaustufe, siehe `specs/decisions/0012-zuschnitt-der-ersten-ausbaustufe.md`).
- Anlegen von Helferbedarf und Übersicht der Besetzung (zweite Ausbaustufe).
- Import des offiziellen Prüfungsplans (zweite Ausbaustufe).
- Bereitstellung derselben Funktionen in der App und in einer eigenständigen Weboberfläche.

### Nicht-Scope

- Anlegen und Verwalten der Konten selbst (Registrierung, Passwörter, Anmeldeverfahren) — das leistet Authentik, siehe `specs/decisions/0010-authentik-als-identitaetsanbieter.md`. Diese Spec weist lediglich Rollen zu.
- Redaktion von Events — erfolgt im externen ICS-Kalender (INT-011), siehe Capability `events`.
- Redaktion von FB-Aktuelles — reiner Import aus INT-010 ohne FSR-Redaktion, siehe Capability `news`.
- Pflege von E-Key-Datensätzen — bleibt im bestehenden Verwaltungstool des FSR (INT-014), siehe Capability `e-key`.
- Pflege von Wiki-Inhalten — bleibt in BookStack, siehe Capability `wiki`.
- Auswertungen und Nutzungsstatistiken — nicht Teil dieses Umfangs.

## Nutzergeschichten

- Als FSR-Mitglied möchte ich eine kurze Meldung unterwegs vom Handy aus veröffentlichen, ohne dafür an einen Rechner zu müssen.
- Als FSR-Mitglied möchte ich den Prüfungsplan und die Laufwege-Daten am Rechner pflegen, weil beides Fließarbeit mit vielen Einträgen ist.
- Als FSR-Vorsitz möchte ich einem neuen Mitglied die Redaktionsrolle geben und einem ausgeschiedenen wieder entziehen, ohne dafür jemanden mit Serverzugang zu brauchen.
- Als Moderation möchte ich gemeldete Kommentare an einer Stelle sehen und entscheiden können, statt sie in der Datenbank zu suchen.
- Als FSR-Mitglied möchte ich vor dem Veröffentlichen sehen, wie eine Meldung in der App aussehen wird.

## Datenmodell

Meldungsentwurf (FSR-News): Titel, Text, geplanter Veröffentlichungszeitpunkt, Zustand (Entwurf, veröffentlicht, zurückgezogen), verfassendes Konto. Nach Veröffentlichung entsteht daraus eine Meldung im Sinne der Capability `news` (Abschnitt Datenmodell), Klassifizierung „FSR-News".

Rollenzuweisung: Konto-Referenz und Rolle. Führendes System ist Authentik; das Backend hält keine eigene Kopie, sondern liest die Zuweisung aus dem Token und schreibt Änderungen über Authentik zurück.

Laufwege-Eintrag: zwei Raumkennungen und ein Distanzmaß (Arbeitsziel Fußweg-Minuten, siehe Capability `room-finder`). Grobe Felder bereits in Capability `backend-and-api` vorgedacht.

Stammdaten: Mensa-Liste, Raumliste, Links-/Downloads-Liste, Semestertermine und Ticket-Bildausschnitt. Feldstruktur je Ressource in Capability `backend-and-api` und im Vertrag (`openspec/specs/api-contract.yaml`, Schemata `Mensa`, `Raum`, `Link`, `Semestertermine`, `Bildausschnitt`). Führendes System ist das eigene Backend; es gibt keine externe Quelle.

Verwaltungsprotokoll: Zeitpunkt, handelndes Konto, Art der Handlung, Referenz auf den betroffenen Datensatz. Kein Inhalt nutzergenerierter Beiträge.

Helferbedarf und Prüfungsplan haben kein eigenes Datenmodell in dieser Capability — sie werden in Capability `event-volunteers` beziehungsweise Capability `backend-and-api` geführt und hier nur bearbeitet.

## Externe Schnittstellen

Alle Verwaltungsfunktionen laufen über das eigene Backend INT-008; der Vertrag steht in `openspec/specs/api-contract.yaml`. Anmeldung und Rollenzuweisung nutzen INT-012 (Authentik). Der Prüfungsplan-Upload verarbeitet eine Datei aus INT-013, ruft diese Quelle aber nicht selbst ab — der Download aus dem Hochschul-Intranet bleibt ein manueller Schritt außerhalb des Systems. Keine Endpunktdetails hier — siehe Capability `integrations`.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Nicht angemeldet | Anmeldeaufforderung; der Verwaltungsbereich ist nicht sichtbar |
| Angemeldet ohne Verwaltungsrolle | Verwaltungsbereich bleibt unsichtbar; ein direkt aufgerufener Verwaltungspfad wird abgelehnt |
| Laden | Ladeanzeige beim Abrufen von Entwürfen, Rollen, Laufwegen, Stammdaten oder Meldungen |
| Leer | Je Bereich benannter Leerzustand mit dem nächsten Schritt, etwa „noch keine Entwürfe — neue Meldung anlegen" (Capability `ux-and-theming`, UX-F-110) |
| Fehler | Fehlermeldung mit Wiederholen-Option; ein nicht gespeicherter Entwurf bleibt erhalten |
| Offline | Verwaltungsfunktionen sind nicht verfügbar, siehe Abschnitt „Offline-Verhalten" |
| Vorschau | Darstellung der Meldung in der Ansicht der App vor dem Veröffentlichen |
| Import läuft | Fortschrittsanzeige beim Prüfungsplan-Upload, danach Ergebnisbericht |

## Offline-Verhalten

Verwaltungsfunktionen sind ausschließlich online nutzbar und werden ohne Netzzugriff als nicht verfügbar gekennzeichnet. Sie werden ausdrücklich **nicht** in die Offline-Warteschlange aufgenommen (Capability `architecture`, ARCH-F-120): Anders als eine Mensa-Bewertung ist eine Redaktions- oder Moderationshandlung an einen Zustand gebunden, der sich zwischen Auslösung und Übertragung geändert haben kann — eine Meldung wurde inzwischen von jemand anderem bearbeitet, ein Kommentar bereits entfernt, eine Rolle bereits entzogen. Eine verzögert übertragene Handlung würde in diesen Fällen einen fremden, neueren Stand überschreiben.

Ein lokal begonnener, noch nicht abgesendeter Meldungsentwurf bleibt davon unberührt und geht bei Verbindungsverlust nicht verloren.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Zwei Personen bearbeiten denselben Meldungsentwurf gleichzeitig | Der zweite Speichervorgang wird abgelehnt, mit Hinweis auf die zwischenzeitliche Änderung und Anzeige des neueren Stands |
| Zwei Personen bearbeiten dieselbe Stammdaten-Liste gleichzeitig | Der zweite Speichervorgang wird abgelehnt; der neuere Stand wird erneut geladen und zur Bearbeitung angeboten |
| Rollenänderung schlägt fehl, weil Authentik nicht erreichbar ist | Fehlermeldung mit Wiederholen-Option; die bisherige Rollenzuweisung bleibt unverändert |
| Prüfungsplan-Datei hat ein unerwartetes Format | Import abbrechen, bisherigen Bestand unverändert lassen, erkannte Abweichung benennen |
| Prüfungsplan-Datei enthält einzelne unlesbare Zeilen | Import abschließen, unlesbare Zeilen einzeln im Ergebnisbericht benennen |
| Laufwege-Eintrag verweist zweimal auf dieselbe Raumkennung | Ablehnen mit Hinweis; ein Weg von einem Raum zu sich selbst hat kein Distanzmaß |
| Gemeldeter Kommentar wurde von der verfassenden Person bereits gelöscht | Meldung als erledigt kennzeichnen, keine Fehlermeldung |

## Akzeptanzkriterien

- Ein Konto ohne Verwaltungsrolle erhält bei direktem Aufruf eines Verwaltungspfads eine Ablehnung vom Server, nicht nur eine ausgeblendete Schaltfläche.
- Dieselbe Meldung lässt sich in der App und in der Weboberfläche anlegen, bearbeiten und veröffentlichen, mit gleichem Ergebnis.
- Eine veröffentlichte und anschließend zurückgezogene Meldung erscheint nicht mehr in der Meldungsliste; war sie angepinnt, ist sie dort als zurückgezogen erkennbar.
- Der Versuch, die letzte verbleibende Zuweisung der Rolle FSR-Redaktion zu entziehen, wird abgelehnt.
- Ein Laufwege-Eintrag mit unbekannter Raumkennung wird gespeichert und dabei sichtbar als unbekannt gekennzeichnet.
- Jede verändernde Handlung erscheint im Verwaltungsprotokoll mit Zeitpunkt und Konto, ohne den Inhalt nutzergenerierter Beiträge.

## Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet Verwaltungs- oder Redaktionsfunktionen. Die Alt-Apps waren reine Lese-Clients (`specs/product/vision.md` Abschnitt 2); Inhalte entstanden außerhalb.

## Offene Fragen

- Ob Meldungsentwürfe eine geplante Veröffentlichung zu einem künftigen Zeitpunkt unterstützen sollen oder nur sofortiges Veröffentlichen; für die erste Ausbaustufe ist das Feld im Datenmodell vorgesehen, eine zeitgesteuerte Auslieferung aber nicht gefordert.
- Ob das Verwaltungsprotokoll in der Oberfläche einsehbar sein soll oder nur serverseitig geführt wird — für die erste Ausbaustufe genügt die serverseitige Führung.

## Umsetzungsstand (Roadmap-Schritt 3)

| Anforderung | Stand |
|---|---|
| Ablehnung des Zugriffs ohne Verwaltungsrolle, Sichtbarkeit des Verwaltungsbereichs nur mit Rolle, Gleicher Funktionsumfang in App und Weboberfläche | umgesetzt (Backend-Rollenprüfung, App-Sichtbarkeit an Rolle gebunden, Unterseiten zusätzlich mit Umleitung bei Direktaufruf ohne Rolle; gemeinsame Codebasis App + Web-Export) |
| Zuweisen und Entziehen von Verwaltungsrollen | **teilweise** — App/Web-Fluss, Backend-Endpunkt und `IAuthentikDirectory` vorhanden; Konten ohne bisherige Rolle werden über den Benutzernamen benannt und backendseitig zur Konto-Id aufgelöst (`core/users/?username=`, INT-012). Vertragstest gegen die INT-012-Struktur grün. Der **Lesepfad** der Authentik-Verwaltungs-API ist am 2026-09-03 live gegen `auth.tobtech.de` bestätigt. Ausstehend: erster schreibender Rollenwechsel und ein durchgängiger Anmeldevorgang über den Browser (Prüfprotokoll `specs/pruefprotokolle/2026-09-02-schritt-3-verwaltung.md`). |
| Aussperrschutz bei letzter Redaktionsrolle | umgesetzt (Ablehnung beim Entzug der letzten FSR-Redaktions-Zuweisung, als reine Funktion getestet; App zeigt den Grund an) |
| Pflege von Laufwege-Einträgen, Hinweis bei unbekannter Raumkennung | umgesetzt (Laufwege-Pflege mit Hinweis auf unbekannte Raumkennungen) |
| Protokollierung verändernder Verwaltungshandlungen, Aufbewahrung der Verwaltungsprotokolle über zwölf Monate | umgesetzt (Verwaltungsprotokoll je verändernder Handlung; Aufbewahrung 12 Monate über periodischen Aufräum-Job) |
| Pflege der Stammdaten-Listen, Ändern von Semesterterminen und Ticket-Bildausschnitt | umgesetzt (Mensa-, Raum- und Links-Liste anlegen/ändern/entfernen; Semestertermine und Ticket-Bildausschnitt änderbar; Backend- und Komponententests je Anforderung) |
| Ablehnung bei gleichzeitiger Änderung einer Stammdaten-Liste | umgesetzt (zweistufig: `If-Match`-Prüfung und Nebenläufigkeitskennung auf Datenbankebene → `412`; die App lädt daraufhin den neueren Stand nach) |
| Bedienbarkeit der Weboberfläche ab 1024 Pixeln | **teilweise** — Schwellwertlogik (1024 px) festgelegt und getestet; die Kartenliste ist auf breiten Bildschirmen bereits vollständig bedienbar. Das eigene **mehrspaltige Tabellen-Rendering** ab 1024 px steht noch aus (Prüfprotokoll `specs/pruefprotokolle/2026-09-02-schritt-3-verwaltung.md`). |
| Meldungsredaktion, Entfernen zurückgezogener Meldungen, Vorschau vor Veröffentlichung | offen — News-Redaktion, Roadmap-Schritt 7 (Capability `news`) |
| Liste gemeldeter Bewertungskommentare bis Abschluss des Imports trotz unlesbarer Zeilen | offen — zweite Ausbaustufe |
| Web-Export-Auslieferung (`specs/decisions/0018-verwaltungsoberflaeche-react-native-web.md`) | umgesetzt — der Deploy-Workflow baut den Expo-Web-Export mit `experiments.baseUrl='/admin'` nach `wwwroot/admin`, das Backend liefert ihn unter `https://api.fb4.it/admin` aus (`Program.cs`, `deploy/nginx-fsrfb4aas.conf`). Erstmals real 2026-09-04. **Ausstehend:** `https://api.fb4.it/admin` als Redirect-URI in der Authentik-Anwendung eintragen, damit der Browser-Anmeldevorgang durchläuft (Betriebseinstellung); danach der erste schreibende Rollenwechsel über den Browser. |
