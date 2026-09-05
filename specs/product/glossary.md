---
status: accepted
version: 0.5.0
owner: FSR FB4
last_reviewed: 2026-09-05
---

# Domänenglossar

Verbindliche Begriffsdefinitionen für alle Specs unter `specs/`. Bei Widerspruch zwischen einer Formulierung in einer Feature-Spec und diesem Glossar gilt das Glossar. Änderungen an Definitionen, die bereits von einer Spec im Status `accepted` oder `implemented` verwendet werden, sind eine inhaltliche Änderung dieser Spec (siehe `specs/README.md`, Abschnitt 8) und entsprechend zu behandeln.

Die Bedeutungen der Begriffe aus dem FBWS- und Alt-App-Kontext stammen aus der Analyse des Alt-Codes unter `alte apps/fb4_app-main/fb4_app-main/`.

Alphabetisch sortiert.

---

**ADR (Architecture Decision Record)**
Kurzdokument, das eine einzelne architektur- oder produktrelevante Entscheidung mit Kontext, Alternativen und Konsequenzen festhält. Vorlage: `_templates/adr.md`. Ablage unter `decisions/`.

**Aktive Mensa**
Die Mensa, deren Abschnitt gerade oben im sichtbaren Bereich der Gerichtsliste steht (Ankernavigation). Sie ergibt sich fortlaufend aus der Scrollposition oder aus dem zuletzt angetippten Chip und bestimmt ausschließlich die Hervorhebung in der Chip-Leiste — nicht die maßgebliche Mensa, nicht Reihenfolge oder Zuordnung der Gerichte, nicht die angezeigten Preise. Sie wird nicht gerätelokal gemerkt. Von der maßgeblichen Mensa zu unterscheiden. Auftritt: `openspec/specs/canteen/spec.md`.

**Alt-App**
Sammelbegriff für die beiden abzulösenden Apps, deren Quellcode vollständig im Repo liegt: die Flutter/iOS-App unter `alte apps/fb4_app-main/fb4_app-main/` und die Android-App unter `alte apps/android-fb4/` (nachgereicht am 2026-08-25). Beide sind Quelle für die per `Alt: …` markierten Anforderungen. Die Markierung `Android: unbekannt` stammt aus der Zeit davor und ist seitdem nur noch historisch (siehe `product/legacy-inventory.md`, Abschnitt 4). Korrigiert 2026-09-05: dieser Eintrag führte die Android-App zuvor als nicht vorliegend.

**Anker (spec-anchored)**
Die nachweisbare Verbindung zwischen einer Anforderung und ihrer Umsetzung: Anforderungs-ID im Testnamen, Quellverzeichnis in `implemented_in:` der Spec, sowie die Merge-Regel „kein Merge ohne Spec-Delta". Details: `README.md`, Abschnitt 7.

**Beilagen**
Eigene Speisenkategorie im Mensaplan (Ausgabestelle `counter`/`counterNames` mit Wert `Beilagen` in INT-015; vormals Feld `type` in INT-004), die in der Darstellung von den Hauptspeisen (z. B. `Menü 1`, `Tagesgericht`, `Vegetarisches Menü`) getrennt wird. Auftritt: `openspec/specs/canteen/spec.md`.

**Bewertungsstufe**
Eine der drei Stufen, in denen ein Gericht bewertet werden kann: schlecht, gut oder sehr gut — dargestellt als Daumen nach unten, Daumen nach oben und doppelter Daumen nach dem Vorbild von Streaming-Diensten. Für Berechnungen zählen sie als 1, 2 und 3. Bewusst grob statt als feine Sterneskala. Auftritt: `openspec/specs/canteen-ratings/spec.md`.

**BookStack**
Die vom FSR betriebene Wiki-Software. Inhaltshierarchie: Shelf (Regal) › Book (Buch) › Chapter (Kapitel) › Page (Seite). API-Zugang bestätigt, Berechtigungsmodell für interne Inhalte offen, siehe INT-007 in `openspec/specs/integrations/spec.md`. Auftritt: `openspec/specs/wiki/spec.md`.

**courseType**
Kürzel der Veranstaltungsart im FBWS-Termindatensatz (INT-002), z. B. `V` für Vorlesung, `Ü` für Übung, `P` für Praktikum. Selbst angelegte Einträge der Alt-App (eigene, nicht vom FBWS gelieferte Termine) tragen den Wert `C`. Auftritt: `openspec/specs/schedule/spec.md`, `openspec/specs/integrations/spec.md` (INT-002).

**CourseOfStudy / Studiengang**
Studiengang im FBWS. Datensatz mit `name` (Klarname), `sname` (Kurzname, wird als Pfadsegment in INT-002 verwendet) und einer Liste `grades`. Quelle: INT-001. Auftritt: `openspec/specs/schedule/spec.md`.

**EARS (Easy Approach to Requirements Syntax)**
Satz von Formulierungsmustern für einzeln prüfbare Anforderungen (ubiquitär, ereignisgesteuert, zustandsabhängig, Fehlerfall, optional). Details und Beispiele: `README.md`, Abschnitt 5.

**Ausbaustufe**
Zeitliche Gruppierung der Umsetzung in zwei Stufen, siehe `product/roadmap.md`. Ordnet zu, *wann* eine bereits spezifizierte Anforderung umgesetzt wird — sie ändert nie die Anforderung selbst. Auftritt: `specs/README.md` Abschnitt 10, `product/roadmap.md`, Frontmatter aller Feature-Specs.

**E-Key**
Vom FSR verliehener elektronischer Zugangsschlüssel für Räume außerhalb offizieller Zeiten — physisch ein vom bestehenden E-Key-Verwaltungstool (INT-014) verwaltetes Gerät, das die App selbst nicht ausgibt oder technisch schaltet. Auftritt: `openspec/specs/e-key/spec.md`.

**FBWS**
Der Webservice des Fachbereichs Informatik unter `ws.inf.fh-dortmund.de/timetable/` (Pfadkorrektur 2026-08-25, siehe INT-001 in `openspec/specs/integrations/spec.md` — der zuvor dokumentierte Pfad `/fbws/` wird nicht weiterverwendet). Quelle für Studiengänge (INT-001) und Termine (INT-002). Auftritt: `openspec/specs/integrations/spec.md`, `openspec/specs/schedule/spec.md`, `openspec/specs/room-finder/spec.md`.

**FCM (Firebase Cloud Messaging)**
Von Google betriebener Push-Benachrichtigungsdienst. Die Alt-App abonniert darüber das Thema `Aktuelles` für News-Benachrichtigungen. Seit `decisions/0008-vertrieb-ueber-drei-app-stores.md` nur noch für iOS vorgesehen (als Bridge zu Apples APNs); Android nutzt stattdessen UnifiedPush. Auftritt: `openspec/specs/integrations/spec.md` (INT-005), `openspec/specs/news/spec.md`, `openspec/specs/settings/spec.md`.

**FSR**
Fachschaftsrat Informatik der FH Dortmund. Fachlicher Auftraggeber der App und Redaktion für News, Events und Wiki-Inhalte. Auftritt: projektweit, insbesondere als `owner`-Angabe in Spec-Frontmatter.

**grade / Semester**
Fachsemester innerhalb eines Studiengangs. Zweites Pfadsegment beim Terminabruf (INT-002), z. B. `.../CourseOfStudy/inf/3/Events`. Nicht zu verwechseln mit der Note (`grade` als Notenwert taucht in INT-006 in anderer Bedeutung auf, dort als Spaltenname im ODS-Ergebnis). Auftritt: `openspec/specs/schedule/spec.md`.

**Gruppenkennung**
Vom Studierenden angegebene, rein lokal verwendete Kennung aus genau einem Großbuchstaben und mindestens einer Ziffer, z. B. `C8`. Muster `^[A-Z][0-9]+$`. Wird nie an einen Server übertragen (siehe `openspec/specs/security-and-privacy/spec.md`), sondern lokal gegen das `studentSet` eines Termins abgeglichen. Auftritt: `openspec/specs/schedule/spec.md`.

**Helferbedarf / Rolle / Schicht**
Planungsstruktur für die Helfer-Anmeldung zu FSR-Events: Ein Event definiert einen Helferbedarf je Kombination aus Rolle (z. B. Aufbau, Ausschank, Abbau) und Schicht (Zeitfenster), jeweils mit einer benötigten Personenzahl. Auftritt: `openspec/specs/event-volunteers/spec.md`.

**HISinOne**
Das aktuelle Campus-Management-System der FH Dortmund, Nachfolger von ODS für die Notenübersicht. Zugangsweg ist offen, siehe INT-006 in `openspec/specs/integrations/spec.md` und `decisions/0006-abloesung-ods-durch-hisinone.md`. Auftritt: `openspec/specs/grades/spec.md`.

**Höchstbewertung**
Die beste der drei Bewertungsstufen („sehr gut"), vergeben durch den doppelten Daumen. Sie ist zugleich die Lieblingsgericht-Markierung: ein so bewertetes Gericht wird als Lieblingsgericht geführt und löst die lokale Benachrichtigung aus; wird die Stufe zurückgenommen oder herabgesetzt, entfällt beides. Ein eigenständiger Merker existiert bewusst nicht. Auftritt: `openspec/specs/canteen-ratings/spec.md`, `openspec/specs/canteen/spec.md`.

**Kennzeichnung (Mensa)**
Ernährungs- oder Herkunftsmerkmal eines Gerichts (z. B. vegan, vegetarisch, Klimateller), von INT-015 im Feld `type` als Kürzel geliefert und über das `/types`-Verzeichnis zweisprachig aufgelöst. Von den Zusatzstoff-/Allergenhinweisen (`additives`) zu unterscheiden. Auftritt: `openspec/specs/canteen/spec.md` (MENSA-F-035).

**Laufwege**
Vom FSR gepflegte Distanz-/Nachbarschaftsstruktur zwischen Räumen, Grundlage der Nächster-freier-Raum-Suche. Ein Eintrag verbindet zwei Raumkennungen mit einem Distanzmaß (Arbeitsziel: Fußweg-Minuten). Auftritt: `openspec/specs/room-finder/spec.md`, `openspec/specs/admin/spec.md`, `openspec/specs/backend-and-api/spec.md`.

**Maßgebliche Mensa**
Die Mensa, deren Preis-, Kennzeichnungs- und Zusatzstoffangaben zu einem zusammengefassten Gericht angezeigt werden: die Mensa des Abschnitts, in dem das Gericht steht, also die in der Auswahlreihenfolge erste anbietende. Sie hängt nicht von der aktiven Mensa ab — ein Wechsel der aktiven Mensa verschiebt kein Gericht und ändert keinen angezeigten Preis. Auftritt: `openspec/specs/canteen/spec.md`.

**Normalisierter Gerichtsschlüssel**
Aus der Gerichtsbezeichnung abgeleiteter Schlüssel, der dasselbe Gericht über Tage, Mensen und wechselnde Schreibweisen der Quelle hinweg wiedererkennbar macht. Trägt die Zusammenfassung zu einem Listeneintrag, die Zuordnung von Bewertungen und Fotos sowie die Lieblingsgerichte. Der am breitesten geteilte Begriff der drei Mensa-Capabilities. Auftritt: `openspec/specs/canteen/spec.md`, `openspec/specs/canteen-ratings/spec.md`, `openspec/specs/canteen-photos/spec.md`.

**ODS**
Das durch HISinOne abgelöste Notenportal der FH Dortmund. Die Alt-App griff darauf per HTML-Scraping einer formularbasierten Sitzung zu (Details: INT-006 in `openspec/specs/integrations/spec.md`). Dient hier nur noch als Referenz für das abgelöste Verfahren.

**OpenMensa**
Offenes Verzeichnisprojekt für Mensa-Speisepläne deutscher Hochschulen. Datenquelle hinter dem von der Alt-App genutzten Vermittler (INT-004). Auftritt: `openspec/specs/integrations/spec.md`, `openspec/specs/canteen/spec.md`.

**Raumplan**
Die raumbezogene Sicht des FBWS auf die Veranstaltungstermine (INT-009, Platzhalter-Form `Room/*/AllEvents`) — dieselben Termine wie im studiengangsbezogenen Terminplan (INT-002), nur nach `roomId` statt nach Studiengang/Fachsemester geordnet. Das Backend hält den Raumplan als Zwischenspeicher vor; daraus leiten sich Freie-Raum-Suche, Raumübersicht, Ansicht laufender Veranstaltungen und der Stundenplan-Raumabgleich ab. Auftritt: `openspec/specs/room-finder/spec.md`, `openspec/specs/schedule/spec.md`, `openspec/specs/integrations/spec.md` (INT-009).

**SIDD**
Sitzungstoken des ODS-Systems, aus einem Meta-Refresh-Tag der Login-Antwort extrahiert und für nachfolgende Anfragen als Query-Parameter mitgeschickt. Teil des abgelösten ODS-Verfahrens, siehe INT-006. Kein Bestandteil der Neuentwicklung.

**Spike**
Zeitlich begrenzte technische Untersuchung zur Klärung einer offenen Frage vor einer verbindlichen Entscheidung, hier insbesondere für INT-006 (HISinOne-Zugang), INT-007 (BookStack-API) und INT-008 (Umfang des eigenen Backends). Ergebnis eines Spikes ist in der Regel ein ADR oder eine Aktualisierung des betroffenen Registereintrags.

**studentSet**
Angabe im FBWS-Termindatensatz (INT-002), für welche Studierendengruppen ein Termin gilt. Entweder ein Einzelwert oder ein Bereich der Form `A1-C9` (Muster `^([A-Z])([0-9]*)-([A-Z])([0-9]*)$`). `*` steht für alle Gruppen. Wird lokal gegen die Gruppenkennung abgeglichen. Auftritt: `openspec/specs/schedule/spec.md`, `openspec/specs/integrations/spec.md` (INT-002).

**UnifiedPush**
Offenes, dezentrales Push-Protokoll ohne zentralen Betreiber: Die App registriert sich bei einem auf dem Gerät installierten „Distributor" (z. B. ein FCM-basierter Distributor oder das quelloffene ntfy), der die Zustellung übernimmt. Ersetzt seit `decisions/0008-vertrieb-ueber-drei-app-stores.md` FCM als Zustellweg für Android, da F-Droid proprietäre Abhängigkeiten wie Firebase im Build ausschließt. Auftritt: `openspec/specs/integrations/spec.md` (INT-005), `openspec/specs/non-functional/spec.md`.

**Wahlpflicht / Wahlpflichtmodul**
Lehrveranstaltung, die eine Studentin aus mehreren zulässigen Optionen wählt, statt sie wie eine Pflichtveranstaltung fest im eigenen Fachsemester zugeordnet zu bekommen. Der eigene Planungsmodus des Stundenplans bezieht die Liste automatisch aus der FBWS-Sammelkategorie `WFPB` (siehe `openspec/specs/integrations/spec.md` INT-002). Auftritt: `openspec/specs/schedule/spec.md` (SCHED-F-400 ff.).

**Vermittler-Infrastruktur**
Die von der Alt-App genutzten Dienste unter `hemacode.de` (INT-003 News, INT-004 Mensa), die selbst keine Primärquelle sind, sondern Daten anderer Systeme (FSR-Redaktion bzw. OpenMensa) weiterreichen. Privat betrieben, ohne bekannten Vertrag oder zugesagte Verfügbarkeit — daher als Risiko in `openspec/specs/integrations/spec.md` geführt und Gegenstand von `decisions/0007-datenquellen-mensa-und-news.md`.
