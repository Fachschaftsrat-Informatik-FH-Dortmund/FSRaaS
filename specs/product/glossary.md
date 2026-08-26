---
status: accepted
version: 0.4.0
owner: FSR FB4
last_reviewed: 2026-08-26
---

# Domänenglossar

Verbindliche Begriffsdefinitionen für alle Specs unter `specs/`. Bei Widerspruch zwischen einer Formulierung in einer Feature-Spec und diesem Glossar gilt das Glossar. Änderungen an Definitionen, die bereits von einer Spec im Status `accepted` oder `implemented` verwendet werden, sind eine inhaltliche Änderung dieser Spec (siehe `specs/README.md`, Abschnitt 8) und entsprechend zu behandeln.

Die Bedeutungen der Begriffe aus dem FBWS- und Alt-App-Kontext stammen aus der Analyse des Alt-Codes unter `alte apps/fb4_app-main/fb4_app-main/`.

Alphabetisch sortiert.

---

**ADR (Architecture Decision Record)**
Kurzdokument, das eine einzelne architektur- oder produktrelevante Entscheidung mit Kontext, Alternativen und Konsequenzen festhält. Vorlage: `_templates/adr.md`. Ablage unter `decisions/`.

**Alt-App**
Die abzulösende Flutter/iOS-App, deren Quellcode unter `alte apps/fb4_app-main/fb4_app-main/` liegt. Dient als einzige Quelle für die per `[Alt: …]` markierten Anforderungen. Zu unterscheiden von der Android-Alt-App, deren Quellcode nicht vorliegt (siehe `product/legacy-inventory.md`, Markierung `[Android: unbekannt]`).

**Anker (spec-anchored)**
Die nachweisbare Verbindung zwischen einer Anforderung und ihrer Umsetzung: Anforderungs-ID im Testnamen, Quellverzeichnis in `implemented_in:` der Spec, sowie die Merge-Regel „kein Merge ohne Spec-Delta". Details: `README.md`, Abschnitt 7.

**Beilagen**
Eigene Speisenkategorie im Mensaplan (Feld `type` mit Wert `Beilagen` in INT-004), die in der Darstellung von den Hauptspeisen (z. B. `Menü 1`, `Tagesgericht`, `Vegetarisches Menü`) getrennt wird. Auftritt: `features/canteen/spec.md`.

**BookStack**
Die vom FSR betriebene Wiki-Software. Inhaltshierarchie: Shelf (Regal) › Book (Buch) › Chapter (Kapitel) › Page (Seite). API-Zugang bestätigt, Berechtigungsmodell für interne Inhalte offen, siehe INT-007 in `platform/integrations.md`. Auftritt: `features/wiki/spec.md`.

**courseType**
Kürzel der Veranstaltungsart im FBWS-Termindatensatz (INT-002), z. B. `V` für Vorlesung, `Ü` für Übung, `P` für Praktikum. Selbst angelegte Einträge der Alt-App (eigene, nicht vom FBWS gelieferte Termine) tragen den Wert `C`. Auftritt: `features/schedule/spec.md`, `platform/integrations.md` (INT-002).

**CourseOfStudy / Studiengang**
Studiengang im FBWS. Datensatz mit `name` (Klarname), `sname` (Kurzname, wird als Pfadsegment in INT-002 verwendet) und einer Liste `grades`. Quelle: INT-001. Auftritt: `features/schedule/spec.md`.

**EARS (Easy Approach to Requirements Syntax)**
Satz von Formulierungsmustern für einzeln prüfbare Anforderungen (ubiquitär, ereignisgesteuert, zustandsabhängig, Fehlerfall, optional). Details und Beispiele: `README.md`, Abschnitt 5.

**Ausbaustufe**
Zeitliche Gruppierung der Umsetzung in zwei Stufen, siehe `product/roadmap.md`. Ordnet zu, *wann* eine bereits spezifizierte Anforderung umgesetzt wird — sie ändert nie die Anforderung selbst. Auftritt: `specs/README.md` Abschnitt 10, `product/roadmap.md`, Frontmatter aller Feature-Specs.

**E-Key**
Vom FSR verliehener elektronischer Zugangsschlüssel für Räume außerhalb offizieller Zeiten — physisch ein vom bestehenden E-Key-Verwaltungstool (INT-014) verwaltetes Gerät, das die App selbst nicht ausgibt oder technisch schaltet. Auftritt: `features/e-key/spec.md`.

**FBWS**
Der Webservice des Fachbereichs Informatik unter `ws.inf.fh-dortmund.de/timetable/` (Pfadkorrektur 2026-08-25, siehe INT-001 in `platform/integrations.md` — der zuvor dokumentierte Pfad `/fbws/` wird nicht weiterverwendet). Quelle für Studiengänge (INT-001) und Termine (INT-002). Auftritt: `platform/integrations.md`, `features/schedule/spec.md`, `features/room-finder/spec.md`.

**FCM (Firebase Cloud Messaging)**
Von Google betriebener Push-Benachrichtigungsdienst. Die Alt-App abonniert darüber das Thema `Aktuelles` für News-Benachrichtigungen. Seit `decisions/0008-vertrieb-ueber-drei-app-stores.md` nur noch für iOS vorgesehen (als Bridge zu Apples APNs); Android nutzt stattdessen UnifiedPush. Auftritt: `platform/integrations.md` (INT-005), `features/news/spec.md`, `features/settings/spec.md`.

**FSR**
Fachschaftsrat Informatik der FH Dortmund. Fachlicher Auftraggeber der App und Redaktion für News, Events und Wiki-Inhalte. Auftritt: projektweit, insbesondere als `owner`-Angabe in Spec-Frontmatter.

**grade / Semester**
Fachsemester innerhalb eines Studiengangs. Zweites Pfadsegment beim Terminabruf (INT-002), z. B. `.../CourseOfStudy/inf/3/Events`. Nicht zu verwechseln mit der Note (`grade` als Notenwert taucht in INT-006 in anderer Bedeutung auf, dort als Spaltenname im ODS-Ergebnis). Auftritt: `features/schedule/spec.md`.

**Gruppenkennung**
Vom Studierenden angegebene, rein lokal verwendete Kennung aus genau einem Großbuchstaben und mindestens einer Ziffer, z. B. `C8`. Muster `^[A-Z][0-9]+$`. Wird nie an einen Server übertragen (siehe `platform/security-and-privacy.md`), sondern lokal gegen das `studentSet` eines Termins abgeglichen. Auftritt: `features/schedule/spec.md`.

**Helferbedarf / Rolle / Schicht**
Planungsstruktur für die Helfer-Anmeldung zu FSR-Events: Ein Event definiert einen Helferbedarf je Kombination aus Rolle (z. B. Aufbau, Ausschank, Abbau) und Schicht (Zeitfenster), jeweils mit einer benötigten Personenzahl. Auftritt: `features/event-volunteers/spec.md`.

**HISinOne**
Das aktuelle Campus-Management-System der FH Dortmund, Nachfolger von ODS für die Notenübersicht. Zugangsweg ist offen, siehe INT-006 in `platform/integrations.md` und `decisions/0006-abloesung-ods-durch-hisinone.md`. Auftritt: `features/grades/spec.md`.

**Laufwege**
Vom FSR gepflegte Distanz-/Nachbarschaftsstruktur zwischen Räumen, Grundlage der Nächster-freier-Raum-Suche. Ein Eintrag verbindet zwei Raumkennungen mit einem Distanzmaß (Arbeitsziel: Fußweg-Minuten). Auftritt: `features/room-finder/spec.md`, `features/admin/spec.md`, `platform/backend-and-api.md`.

**ODS**
Das durch HISinOne abgelöste Notenportal der FH Dortmund. Die Alt-App griff darauf per HTML-Scraping einer formularbasierten Sitzung zu (Details: INT-006 in `platform/integrations.md`). Dient hier nur noch als Referenz für das abgelöste Verfahren.

**OpenMensa**
Offenes Verzeichnisprojekt für Mensa-Speisepläne deutscher Hochschulen. Datenquelle hinter dem von der Alt-App genutzten Vermittler (INT-004). Auftritt: `platform/integrations.md`, `features/canteen/spec.md`.

**SIDD**
Sitzungstoken des ODS-Systems, aus einem Meta-Refresh-Tag der Login-Antwort extrahiert und für nachfolgende Anfragen als Query-Parameter mitgeschickt. Teil des abgelösten ODS-Verfahrens, siehe INT-006. Kein Bestandteil der Neuentwicklung.

**Spike**
Zeitlich begrenzte technische Untersuchung zur Klärung einer offenen Frage vor einer verbindlichen Entscheidung, hier insbesondere für INT-006 (HISinOne-Zugang), INT-007 (BookStack-API) und INT-008 (Umfang des eigenen Backends). Ergebnis eines Spikes ist in der Regel ein ADR oder eine Aktualisierung des betroffenen Registereintrags.

**studentSet**
Angabe im FBWS-Termindatensatz (INT-002), für welche Studierendengruppen ein Termin gilt. Entweder ein Einzelwert oder ein Bereich der Form `A1-C9` (Muster `^([A-Z])([0-9]*)-([A-Z])([0-9]*)$`). `*` steht für alle Gruppen. Wird lokal gegen die Gruppenkennung abgeglichen. Auftritt: `features/schedule/spec.md`, `platform/integrations.md` (INT-002).

**UnifiedPush**
Offenes, dezentrales Push-Protokoll ohne zentralen Betreiber: Die App registriert sich bei einem auf dem Gerät installierten „Distributor" (z. B. ein FCM-basierter Distributor oder das quelloffene ntfy), der die Zustellung übernimmt. Ersetzt seit `decisions/0008-vertrieb-ueber-drei-app-stores.md` FCM als Zustellweg für Android, da F-Droid proprietäre Abhängigkeiten wie Firebase im Build ausschließt. Auftritt: `platform/integrations.md` (INT-005), `platform/non-functional.md`.

**Wahlpflicht / Wahlpflichtmodul**
Lehrveranstaltung, die eine Studentin aus mehreren zulässigen Optionen wählt, statt sie wie eine Pflichtveranstaltung fest im eigenen Fachsemester zugeordnet zu bekommen. Wahlpflichtmodule sind organisatorisch oft einem anderen Fachsemester zugeordnet als dem der wählenden Person, was den eigenen Planungsmodus des Stundenplans motiviert. Auftritt: `features/schedule/spec.md` (SCHED-F-270 ff.).

**Vermittler-Infrastruktur**
Die von der Alt-App genutzten Dienste unter `hemacode.de` (INT-003 News, INT-004 Mensa), die selbst keine Primärquelle sind, sondern Daten anderer Systeme (FSR-Redaktion bzw. OpenMensa) weiterreichen. Privat betrieben, ohne bekannten Vertrag oder zugesagte Verfügbarkeit — daher als Risiko in `platform/integrations.md` geführt und Gegenstand von `decisions/0007-datenquellen-mensa-und-news.md`.
