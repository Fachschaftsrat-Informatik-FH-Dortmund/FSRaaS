## ADDED Requirements

### Requirement: INT-020 — Mensa-API des FSR (mensa.fb4.it)

**Status: bestätigt, live erprobt.** Das System muss Speisepläne, Öffnungszeiten, Schließtage, Mensa-Stammdaten und das Verzeichnis der Kennzeichnungen über die vom FSR betriebene Mensa-API laden. Ersetzt INT-015. Herkunft: Recherche: `mensa.fb4.it`, OpenAPI 3.1 unter `/openapi.json` (Fassung 0.2.0), live abgefragt und Feldstruktur verifiziert am 2026-09-22.

**Aufruf**
```
GET https://mensa.fb4.it/canteens
GET https://mensa.fb4.it/canteens/{id}
GET https://mensa.fb4.it/canteens/{id}/menu
GET https://mensa.fb4.it/canteens/{id}/menu/{date}
GET https://mensa.fb4.it/canteens/{id}/hours
GET https://mensa.fb4.it/legend
GET https://mensa.fb4.it/health
GET https://mensa.fb4.it/openapi.json
```
`{id}` ist die Verbrauchsortnummer des Studierendenwerks (z. B. `341` für die Hauptmensa) — **dieselbe Kennung wie das Feld `quelleId` der Mensa-Stammdaten und wie die Mensakennung von INT-015**, weshalb die Ablösung keine Neuschlüsselung bestehender Auswahlen erfordert. `{date}` ist ein Datum `YYYY-MM-DD` oder das Schlüsselwort `today`.

**Antwortstruktur (verifiziert 2026-09-22)**

`GET /canteens` → `{ updated, canteens[] }`. Mensa-Objekt:

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | Zahl | Verbrauchsortnummer |
| `name` | String | Name aus dem CMS, ersatzweise der Küchenname der Quelle |
| `slug` | String \| fehlt | Kurzkennung der Website |
| `address` | String \| fehlt | Anschrift |
| `description` | String \| fehlt | Beschreibung der Mensa |
| `url` | String \| fehlt | Seite der Mensa auf `stwdo.de` |
| `mapsUrl` | String \| fehlt | Verweis auf die Lage in einem Kartendienst |
| `hasMenu` | Boolean | ob die Mensa der Speiseplan-API bekannt ist. Sagt **nicht**, ob gerade Gerichte angeboten werden |

`GET /canteens/{id}/menu` → `{ canteen, days[] }` über die vorliegenden Tage; `GET /canteens/{id}/menu/{date}` → `{ canteen, date, categories[] }` für einen Tag. Ein Tag ohne Angebot ist kein Fehler, sondern liefert `categories: []`. Kategorie-Objekt: `{ id, name, meals[] }`. Gericht-Objekt:

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | Zahl | eindeutig über alle Mensen und Tage. **Nicht stabil**: dasselbe Gericht trägt an einem anderen Tag eine andere Kennung — als Bindeglied zu Bewertungen und Fotos untauglich |
| `name` | String | erste Beschreibungszeile ohne Allergencodes |
| `nameEn` | String \| fehlt | englische Fassung; fehlte am 2026-09-22 bei 10 von 73 geprüften Gerichten |
| `lines` | Liste von Strings | Beschreibung, eine Komponente je Eintrag. Entspricht zusammengefügt mit ` \| ` dem Rohtitel von INT-015 |
| `linesEn` | Liste von Strings \| fehlt | englische Fassung |
| `prices` | Objekt `{student, staff, guest}` | Preise als **Zahl** in Euro — anders als bei INT-015 nicht als String zu parsen |
| `tags` | Liste von Strings | Ernährungs- und Herkunftskennzeichen, Klartext über `/legend` |
| `additives` | Liste von Strings | Zusatzstoff- **und** Allergennummern, Klartext über `/legend` |
| `co2Class` | `A` \| `B` \| `C` \| `E` \| fehlt | CO₂-Klasse. Nur `A` gilt als Klimateller und erscheint zusätzlich als Tag `climate-plate` |

`GET /canteens/{id}/hours` → `{ canteen, today, forecast[], week[], closures[] }`. `today` ist `{ date, isOpen, reason? }` mit einem Klartextgrund wie `"Restaurant-Schließtag: Betriebsferien"`. `forecast` sind sieben Tage ab heute, `week` der reguläre Wochenplan ohne Datumsbezug. Ein Tageseintrag trägt `isOpen` sowie, wenn geöffnet, `open`/`close` und — **nur bei Abweichung** — zusätzlich `servingOpen`/`servingClose` für die Essensausgabe. `closures` sind die Schließtage der nächsten 30 Tage als `{ label, date? , from?, to?, isHoliday, scope }`; `scope` ist `global` (alle Häuser) oder `canteen` (nur diese Mensa), und entweder `date` oder das Paar `from`/`to` ist gesetzt.

`GET /legend` → `{ tags[], additives[], allergens[], climate[], note?, noteEn? }`, je Eintrag `{ code, label, labelEn? }`. Stand 2026-09-22: 10 Kennzeichen, 11 Zusatzstoffe (`1`–`11`), 27 Allergene (`20`–`33`, mit Unterschlüsseln `20a`–`20f` für Gluten und `27a`–`27h` für Nüsse) und 4 CO₂-Klassen. **Diese Quelle trennt Allergene von Zusatzstoffen**, was INT-015 nicht tat; im Gericht-Objekt stehen beide gemeinsam unter `additives` und werden erst über die Legende zugeordnet.

`labelEn` kam am 2026-09-24 hinzu (nachgeprüft am selben Tag: alle 52 Einträge tragen sie) und ist damit die einzige Feldänderung der Quelle seit der Verifikation vom 2026-09-22; die Fassung blieb `0.2.0`. `label` ist die maßgebliche, deutsche Fassung, `labelEn` eine Übersetzung der Quelle selbst — fehlt sie zu einem Code, tritt `label` an ihre Stelle. Damit trägt die Quelle die Zweisprachigkeit der Klartexte wieder selbst, wie es INT-015 mit `{de, en}` tat, und die App braucht keine eigene Übersetzung der 48 Klartexte (Capability `canteen`, Requirement „Gerichtskategorien und Zusatzstoffhinweise in Oberflächensprache").

`GET /health` → `{ status, canteens, meals, cache, lastFailure? }`. `status` ist `ok`, `degraded` (ein Abruf schlug fehl) oder `cold` (noch nichts geladen). **Überalterung zeigt `status` nicht an:** bei der Prüfung am 2026-09-22 meldete er `ok`, während die Speisepläne 6,7 Tage alt waren. Maßgeblich für das Datenalter ist deshalb `cache.<gruppe>.updated` beziehungsweise das `updated` der jeweiligen Antwort, nicht `status`.

**Befunde der Datenprüfung vom 2026-09-22** (alle 15 Standorte, 105 Tag/Mensa-Paare, Öffnungsangaben gegen Speiseplan abgeglichen): Kein Fall, in dem die Schnittstelle eine Mensa als geschlossen führte, während ihr Speiseplan Gerichte enthielt. Drei Standorte führen `hasMenu: false` und sind dennoch geöffnet. Die Schließtagsangaben stimmen taggenau mit dem Speiseplanbeginn überein (Mensa Süd: Betriebsferien bis 04.10., Speiseplan ab 05.10.). Der Speiseplan enthält **nie** Wochenendtage, auch nicht für die samstags geöffneten Standorte Canapé (Iserlohn) und Snack it (Hagen) — er kann eine Wochenendöffnung weder bestätigen noch widerlegen. Der Speiseplan-Horizont schwankt je Mensa zwischen 4 und 11 Tagen. 5 von 73 geprüften englischen Komponentenzeilen trugen entgegen der Zusage der Quelle noch inline stehende Code-Klammern, darunter den in der Legende nicht vorhandenen Code `281`.

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** FSR FB4 selbst; Quellcode unter `Fachschaftsrat-Informatik-FH-Dortmund/mensa-api` (ein Go-Binary ohne Abhängigkeiten außerhalb der Standardbibliothek). Die dahinterliegende Primärquelle ist die Speiseplan-API des Studierendenwerks Dortmund, ergänzt um Standortangaben aus dessen CMS. **Verfügbarkeit:** Eigener Verantwortungsbereich, keine Zusage gegenüber Dritten nötig.

**Cache-Regel:** Die Schnittstelle ist selbst ein Zwischenspeicher und setzt auf jede Antwort `Cache-Control: public, max-age=300`. Das eigene Backend hält **keinen** eigenen Bestand vor und führt keinen eigenen Auffrischungslauf, sondern reicht je Anfrage durch und darf dabei die angegebene Gültigkeitsdauer beachten (Capability `backend-and-api`). Die App ruft INT-020 nie selbst ab (Capability `architecture`). Zu beachten: die Schnittstelle lädt **erst auf Anfrage**; nach einer längeren Ruhephase dauert der erste Abruf rund eine Sekunde, jeder weitere wenige Millisekunden (gemessen 0,11 s am 2026-09-22).

**Risiko:** Gering. Eigener Betrieb statt Fremdabhängigkeit, TLS, Quellcode offen und ohne Fremdabhängigkeiten. Verbleibend: die Schnittstelle ist ein einzelner Dienst ohne Ausfallsicherung, und da das eigene Backend keinen Bestand mehr vorhält, ist die einzige Rückfallebene bei ihrem Ausfall der gerätelokale Zwischenspeicher der App.

**Ersatzoption:** Die Speiseplanseiten des Studierendenwerks (`stwdo.de`) oder OpenMensa. INT-015 bleibt als abgelöster Eintrag dokumentiert und wäre technisch weiterhin verfügbar.

**Zugehörige Stammdaten:** Anzeigereihenfolge und Standardauswahl der Mensen sind **nicht** Teil dieser Schnittstelle, sondern werden vom eigenen Backend gepflegt (siehe INT-008 und Capability `admin`). Öffnungszeiten, Anschrift, Beschreibung und Kartenverweis stammen dagegen aus dieser Schnittstelle und werden nicht mehr gepflegt.

Quelle: `https://mensa.fb4.it/openapi.json` (Fassung 0.2.0), Repository `Fachschaftsrat-Informatik-FH-Dortmund/mensa-api`; live abgefragt, Feldstruktur und Öffnungsangaben verifiziert am 2026-09-22, Legende nach ihrer Erweiterung um `labelEn`/`noteEn` erneut verifiziert am 2026-09-24

#### Scenario: Standort ohne Speiseplan
- **WHEN** ein Standort `hasMenu: false` führt und seine Öffnungsangaben ihn als geöffnet ausweisen
- **THEN** verarbeitet das System ihn als geöffnete Mensa ohne Speiseplan, nicht als geschlossene

#### Scenario: Klartext ohne englische Fassung
- **WHEN** die Legende zu einem Code keine englische Fassung führt und die Oberflächensprache Englisch ist
- **THEN** zeigt das System die deutsche Fassung dieses Codes an, statt den Klartext leer zu lassen

#### Scenario: Datenalter trotz unauffälligem Zustand
- **WHEN** `GET /health` den Zustand `ok` meldet, der gemeldete Stand der Daten aber älter ist als deren Gültigkeitsdauer
- **THEN** wertet das System den gemeldeten Stand aus und nicht den Zustand allein

## RENAMED Requirements

- FROM: `### Requirement: INT-015 — Mensa-API des ITMC (TU Dortmund)`
- TO: `### Requirement: INT-015 — Mensa-API des ITMC (TU Dortmund) (abgelöst durch INT-020)`

## MODIFIED Requirements

### Requirement: INT-015 — Mensa-API des ITMC (TU Dortmund) (abgelöst durch INT-020)

**Status: abgelöst durch INT-020 (Entscheidung FSR FB4, 2026-09-22).** Das System hat Speisepläne, Gerichtskategorien und Zusatzstoff-/Allergenschlüssel über die ITMC-API geladen. Ersetzte INT-004, ersetzt durch INT-020. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/MenuApi.java.

**Aufruf**
```
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/canteens/{id}/{date}
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/canteens/{id}
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/types
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/additives
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/categories
```
`{id}` ist die ITMC-Mensakennung (Feld `quelleId` der Mensa-Stammdaten, z. B. `341` für die Hauptmensa), `{date}` ein Datum `YYYY-MM-DD`. INT-020 verwendet dieselbe Kennung, weil beide Quellen die Verbrauchsortnummer des Studierendenwerks führen.

**Antwortstruktur (verifiziert 2026-09-03)**
`GET /canteens/{id}/{date}` → JSON-**Liste** von Gerichten. `GET /canteens/{id}` → JSON-**Objekt**, Schlüssel = Datum `YYYY-MM-DD`, Wert = dieselbe Gerichtsliste.

Gericht-Objekt:

| Feld | Typ | Bedeutung |
|---|---|---|
| `title` | Objekt `{de, en}` | Bezeichnung des Gerichts. Zusatzstoff-/Allergen-Codes stehen zusätzlich inline in Klammern; mehrteilige Gerichte trennen die Komponenten mit ` \| ` |
| `type` | Liste von Strings | Kennzeichnungen des Gerichts, Schlüssel aus `/types` |
| `additives` | Liste von Strings | Zusatzstoff-/Allergen-Codes, Schlüssel aus `/additives` |
| `category` | String | numerischer Kategorie-Code (nicht anzeigetauglich; für die Anzeige dient `counterNames`). Über `/categories` teilweise auflösbar, aber nicht vollständig |
| `price` | Objekt `{student, staff, guest}` | Preise als **String** mit Komma-Dezimaltrennung und Euro-Zeichen, Beispiel `"3,30 €"` — clientseitig zu parsen |
| `counter` | String \| fehlt | Ausgabestelle, unlokalisiert. Bei manchen Verbrauchsorten (Food Fakultät, Kennung 474) fehlt das Feld ganz |
| `counterNames` | Objekt `{de, en}` \| `null` | zweisprachige Anzeigekategorie; für die getrennte Beilagen-Darstellung maßgeblich. Bei der Food Fakultät durchgängig `null` |
| `dispoId` | String | interne Kennung des Dispositionssatzes |
| `position` | Zahl | Sortierreihenfolge innerhalb des Tages |

`GET /types`, `GET /additives` und `GET /categories` → je JSON-Liste von `{ "id": String, "name": { "de": String, "en": String } }`. Damit trug diese Quelle die Zweisprachigkeit ohne eigene Übersetzungsarbeit. `/categories` (Stand 2026-09-04: elf Einträge) deckte die `category`-Codes der Food-Fakultät-Gerichte nicht ab und wurde deshalb nicht als Kategoriequelle genutzt — die Anzeigekategorie kam aus `counterNames`/`counter`, fehlte beides, entfiel sie.

`GET /canteens/474` (Food Fakultät), Prüfung 2026-09-04: lieferte für den aktuellen Tag 27 Gerichte mit vollständigen `title`, `type`, `additives`, `price` und `position`, aber ohne `counter` und mit `counterNames: null`.

`GET /canteens/{id}/openings/all` antwortete am 2026-09-03 mit **HTTP 500** und wurde nicht verwendet. Die Öffnungszeiten je Mensa und Wochentag kamen deshalb aus gepflegten Stammdaten — genau diese Ersatzlösung verfiel und ist mit INT-020 entfallen.

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** ITMC (IT und Medien Centrum) der TU Dortmund. Offizieller Hochschulbetrieb, keine private Infrastruktur. **Verfügbarkeit:** Nicht vertraglich zugesagt, aber institutionell betrieben und produktiv von der Android-Alt-App genutzt. Live-Abfrage am 2026-08-25: Status 200 in rund 0,2 Sekunden.

**Cache-Regel:** Gegenstandslos. Der serverseitige Zwischenspeicher, auf den sie sich bezog, ist mit INT-020 entfallen.

**Risiko:** Gering bis mittel. Deutlich niedriger als INT-004: offizieller Hochschulbetreiber statt privater Vermittler, TLS statt Klartext, Primärquelle statt Weiterreichung. Verbleibend: keine erkennbare Versionszusage über `v3` hinaus, kein SLA.

**Ablösegrund (2026-09-22):** INT-020 liefert dieselben Inhalte und zusätzlich Öffnungszeiten, Ausgabezeiten, Schließtage samt Klartextgrund, Standortangaben aus dem CMS, die Trennung von Allergenen und Zusatzstoffen sowie CO₂-Klassen. Damit entfällt die Handpflege der Öffnungszeiten, deren Verfall am 2026-09-22 belegt wurde (Hauptmensa freitags: gepflegt `11:30 - 14:00`, tatsächlich `11:30 - 14:15`). Zudem liegt INT-020 im eigenen Verantwortungsbereich des FSR, während INT-015 die Versionszusage über `v3` hinaus offenließ.

**Ersatzoption:** **INT-020** (Mensa-API des FSR). Weiterhin denkbar: OpenMensa oder die Speiseplanseiten des Studierendenwerks (`stwdo.de`).

**Zugehörige Stammdaten:** Die Zuordnung von Mensa-Kennung zu Anzeigename, Standardauswahl und Anzeigereihenfolge wird weiterhin vom eigenen Backend gepflegt (siehe INT-008 und Capability `admin`); Öffnungszeiten werden es nicht mehr, sie kommen aus INT-020.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/MenuApi.java`, `service/MenuService.java`, `module/NetworkModule.java`, `assets/canteens.json`; live abgefragt am 2026-08-25, Feldstruktur verifiziert am 2026-09-03, Food-Fakultät (474) verifiziert am 2026-09-04; abgelöst am 2026-09-22

#### Scenario: Verbrauchsort ohne Ausgabestellen-Gliederung
- **WHEN** ein Verbrauchsort wie die Food Fakultät (474) `counter` und `counterNames` nicht liefert
- **THEN** verarbeitet das System die Gerichte trotzdem vollständig, ohne Kategorieüberschrift

#### Scenario: Nachweis der Ablösung
- **WHEN** geprüft wird, ob die Neuentwicklung Mensa-Speisepläne über INT-015 lädt
- **THEN** trifft das nicht mehr zu — der Bezug läuft über INT-020

### Requirement: INT-008 — Eigenes Backend

**Status: Betreiber geklärt, Vertrag in `api-contract.yaml` spezifiziert.** Das System muss die Community- und Aggregationsfunktionen, für die es keine geeignete externe Schnittstelle gibt, über ein eigenes Backend tragen. Herkunft: NEU, der Mensa-Anteil am 2026-09-22 vom Zwischenspeichern auf Durchreichen umgestellt.

Aufgaben: Entgegennahme und Auslieferung der Mensa-Bewertungen (RATE). Verwaltung der Events und Helfer-Anmeldungen (EVENT, HELFER). Vermittlung der E-Key-Verknüpfungen (EKEY) an das bestehende E-Key-Verwaltungstool des FSR (INT-014) — keine eigene E-Key-Datenhaltung, siehe dort. Periodischer Abruf und Zwischenspeicherung der Raumtermine aus INT-009 (Wildcard-Form); **keine** Zusammenführung über Studiengang/Semester-Kombinationen mehr — siehe Nutzungshinweis bei INT-009. Vorgelagerter Zwischenspeicher für INT-003 und INT-010 zur Ablösung der Abhängigkeit von `hemacode.de` und zur Entkopplung der App von HTML-Auswertungen. Für die Mensa-Daten aus INT-020 **kein** Zwischenspeicher, sondern Durchreichen je Anfrage (siehe INT-020 und Capability `backend-and-api`). Pflege und Auslieferung der Stammdaten, die keine externe Quelle hat: Mensa-Liste, Raumliste, Links- und Downloads-Liste, Semestertermine, Ticket-Bildzuschnitt.

**Aufruf**
`openspec/specs/api-contract.yaml` — versionierte OpenAPI-Beschreibung, Quelle der Wahrheit für jeden Aufruf zwischen App beziehungsweise Admin-Oberfläche und Backend (`specs/decisions/0011-monorepo-und-openapi-vertrag.md`). Aufgabenschnitt und Prinzipien: Capability `backend-and-api`.

**Antwortstruktur**
Siehe `openspec/specs/api-contract.yaml`.

**Vorgänger: `app.fsrfb4.de` (abzulösen)**
Der FSR betreibt bereits ein Backend unter `https://app.fsrfb4.de`, das die Android-Alt-App bedient. Es ist am 2026-08-25 erreichbar und liefert drei von der App genutzte Ressourcen. **Ergänzung 2026-08-26:** Der Quellcode dieses Backends (`alte apps/app.fsrfb4.de/`) liegt inzwischen ebenfalls vor — ein schlankes PHP-System ohne Framework, MySQL als Datenhaltung. Er bestätigt und verfeinert den zuvor nur live erprobten Befund:

| Aufruf | Zweck |
|---|---|
| `GET /data`, `POST /data` (Feld `Key`) | Ferngepflegte Stammdaten als Liste von Schlüssel-Wert-Paaren |
| `POST /messages/messages.php` (Felder `Sprache`, `API`, `VersionCode`) | Serverseitige Hinweise an die App, abhängig von Sprache und App-Version |
| `GET /studiengaenge.json` | Rückfallliste der Studiengänge, falls INT-001 nicht erreichbar ist |

Beobachtete Schlüssel unter `/data`: `semester_beginning`, `semester_end`, `ws_start`, `ss_start`, `examplan`, `timeplan`, `ticket_rect_coordinates`, `canteens`, `rooms`, `links`, `file_downloads`, `news_url`.

**Lese-/Schreibtrennung bei `/data` (Quellcode-Befund).** `data/index.php` (Lesepfad, von der App aufgerufen) und `data/admin/data.php` (Schreibpfad) sind zwei getrennte Skripte gegen dieselbe MySQL-Tabelle `app_data` (Spalten `datakey`/`Value`, `INSERT … ON DUPLICATE KEY UPDATE`). Der Schreibpfad liegt hinter HTTP-Basic-Auth (`.htaccess`/`.htpasswd`) und wird über ein einfaches HTML-Formular bedient, das je Aufruf genau ein Schlüssel-Wert-Paar setzt — keine Übersicht, keine Validierung, keine Historie. Das ist die technische Ursache des veralteten Bestands (siehe unten) und stützt konkret, warum Capability `admin` eine echte Pflegeoberfläche statt eines Formulars vorsieht.

**Feinstruktur von `/messages/messages.php` (Quellcode-Befund).** Ein Hinweis ist reichhaltiger als ein einzelner Datensatz: `ID`, zweisprachiger `Titel`/`Text` (Spaltenpaare `_de`/`_en`), bis zu zwei Buttons mit je eigenem zweisprachigem Text und einer serverseitig hinterlegten Aktion (`Button1Action`/`Button2Action` — Bedeutung aus dem PHP-Code allein nicht ableitbar, vermutlich ein clientseitig interpretierter Aktionscode), eine `Dauerhaft`-Kennzeichnung sowie Gültigkeit über Bereiche von Android-API-Level (`Min_API`/`Max_API`) und `VersionCode` (`Min_VersionCode`/`Max_VersionCode`), gefiltert auf `Aktiv = TRUE`. Das ist eine gezielte Handlungsaufforderung, kein Nachrichtentext — relevant für die offene Frage in `specs/open-questions.md`, ob dieser Mechanismus eigenständig fortgeführt oder in NEWS aufgelöst wird.

**Verwaiste Endpunkte (Quellcode-Befund, nicht zuvor bekannt).** `feedback/feedback.php` nimmt POST-Daten (`Name`, `Feedback`, `Api`, `VersionCode`) entgegen und legt sie in der Tabelle `app_feedback` ab, die serverseitig zusätzlich `Nr` (fortlaufend, Primärschlüssel) und `Zeit` (Zeitstempel) führt. Zwei weitere, per HTTP-Basic-Auth geschützte Skripte lesen diesen Bestand lesend aus: `feedback/admin/api.php` (JSON, alle Spalten) und `feedback/admin/index.php` (dieselben Daten als HTML-Tabelle, ohne Lösch- oder Bearbeitungsfunktion — reine Anzeige). Beide Alt-Apps rufen `feedback.php` jedoch **nicht** auf — Android wie Flutter öffnen für „Feedback" stattdessen den Mail-Client (`specs/product/legacy-inventory.md`, AND-036/L-074). Der gesamte Feedback-Pfad ist damit ohne Client und braucht in der Neuentwicklung keine Entsprechung.

**Vollständigkeitsprüfung 2026-08-26.** Der abgelegte Codestand von `app.fsrfb4.de` enthält, außerhalb der vendorierten Drittbibliothek `*/admin/passwd/` (Login-Oberfläche der Admin-Bereiche, Fremdcode), genau sechs PHP-Dateien — alle oben genannt, keine weiteren. Die `.htaccess`-Dateien beider Admin-Verzeichnisse erzwingen HTTPS und HTTP-Basic-Auth, enthalten aber keine Rewrite-Regeln auf weitere, hier nicht erfasste Routen.

**Der Datenbestand ist veraltet:** Die live abgefragte Antwort vom 2026-08-25 liefert `semester_beginning: 25.09.2023` und `semester_end: 19.01.2024` — Werte aus dem Wintersemester 2023/24. Der Dienst läuft, wird aber nicht mehr gepflegt.

Entscheidung FSR FB4, 2026-08-25: Das fachliche Konzept der ferngepflegten Stammdaten wird übernommen, die technische Umsetzung neu gebaut. Die Pflege wandert in die Admin-Oberfläche (Capability `admin`), die Auslieferung in den OpenAPI-Vertrag. `app.fsrfb4.de` wird nach der Umstellung abgeschaltet; die dort verlinkte private Domain `hoolycraap.de` entfällt damit ebenfalls.

Der Rückfallmechanismus `studiengaenge.json` ist übernehmenswert: Er macht die Studiengangsauswahl unabhängig von der Erreichbarkeit des Hochschulsystems und gehört als Muster in den Zwischenspeicher-Anteil des neuen Backends. Anmerkung 2026-08-26: Im abgelegten Quellcode-Stand von `app.fsrfb4.de` ist keine `studiengaenge.json` als statische Datei auffindbar — möglicherweise, weil die vorliegende Ablage nicht jede statische Asset-Datei enthält. Live-Erreichbarkeit war am 2026-08-25 nicht Gegenstand der Prüfung; vor Umsetzung kurz zu bestätigen, dass der Rückfallbestand tatsächlich noch existiert.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/module/NetworkModule.java`, `service/DataService.java`, `retrofit/DataUpdateApi.java`, `retrofit/ServerMessageApi.java`, `retrofit/TimeTableFallbackApi.java`; live abgefragt am 2026-08-25; Backend-Quellcode vollständig ausgewertet 2026-08-26: `alte apps/app.fsrfb4.de/data/index.php`, `data/admin/data.php`, `messages/messages.php`, `feedback/feedback.php`, `feedback/admin/api.php`, `feedback/admin/index.php`

**Authentifizierung:** Über INT-012 (Authentik, OpenID Connect) — siehe dort für den Ablauf; dieser Eintrag verweist nur, um Endpunktdetails nicht zu duplizieren.

**Eigentümer/Betreiber:** FSR FB4 selbst, auf einem eigenen Hetzner-VPS. Zugriffsverwaltung und Backup-Ziel: `specs/decisions/0017-zugriff-und-datensicherung-vps.md`.

**Verfügbarkeit:** Betriebsverantwortung liegt beim FSR FB4 selbst, nicht bei einem Dritten. Konkrete Verfügbarkeitszusage (SLA gegenüber den Nutzenden) noch zu definieren.

**Cache-Regel (Vorschlag):** Für den Zwischenspeicher-Anteil (News): serverseitiger Abruf der Ursprungsquellen in festem Intervall, App fragt ausschließlich das eigene Backend ab, nie direkt `hemacode.de` oder OpenMensa. Mensa-Daten werden nicht zwischengespeichert: sie werden aus INT-020 durchgereicht, wobei die von dieser Quelle gesetzte Gültigkeitsdauer beachtet werden darf (Capability `backend-and-api`).

**Risiko:** Liegt im eigenen Verantwortungsbereich (Betrieb, Kapazität, Sicherheit), anders als bei den übrigen, extern betriebenen Schnittstellen. Kein Fremdbetriebsrisiko, aber voller Aufwand für Bau und Betrieb selbst zu tragen.

**Ersatzoption:** Nicht zutreffend — dies ist selbst die Ersatzoption für INT-003/INT-004 und die einzige Option für RATE/EVENT/HELFER.

**Status:** Betreiber geklärt (FSR FB4, Hetzner-VPS). Aufruf und Antwortstruktur stehen im OpenAPI-Vertrag, Authentifizierung über INT-012. Siehe Capability `backend-and-api` und `specs/decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

#### Scenario: App fragt nie Drittquellen direkt ab
- **WHEN** die App News, Mensa-Speisepläne oder Raumtermine anzeigt
- **THEN** ruft sie ausschließlich das eigene Backend ab, nie `hemacode.de`, OpenMensa oder den FBWS direkt
