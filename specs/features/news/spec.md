---
id: news
titel: News
praefix: NEWS
status: accepted
prioritaet: kern
version: 2.0.0
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/news/NewsFragment.java
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/NewsParserImpl.java
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/news/models/news_item.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/news/screens/news_overview_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/push_notification_manager.dart
implemented_in: []
related:
  - ../../platform/integrations.md
  - ../../platform/backend-and-api.md
  - ../../platform/data-and-storage.md
  - ../../platform/security-and-privacy.md
  - ../../platform/ux-and-theming.md
  - ../../platform/quality-and-testing.md
  - ../settings/spec.md
  - ../events/spec.md
---

# News

## 1. Zweck & Nutzen

Die News-Funktion informiert Studierende über drei Klassifizierungen von Meldungen: FSR-News (Redaktionsmeldungen des FSR), FB-Aktuelles (Mitteilungen des Fachbereichs, importiert aus `aktuelles-ni`) und Event-Erinnerungen (automatisch aus dem Event-Kalender abgeleitet). Sie ersetzt das bisherige Einzel-Feed-Modell der Flutter-App durch einen über das eigene Backend vermittelten, robusteren Zugang und behebt einen bekannten Datumsfehler der Alt-App. Entscheidung FSR FB4, 2026-08-25, siehe `specs/open-questions.md` (Archiv).

Mit der Erweiterung vom 2026-09-04 (Anforderung FSR FB4) kommen drei Bausteine hinzu: eine verbindliche, mit der Suche kombinierbare Filterung des geladenen Meldungsbestands; ein erweiterter Suchmodus mit regulären Ausdrücken für Nutzerinnen mit entsprechender Vorkenntnis; und eine geräteseitige Positiv- und Sperrliste, die steuert, welche neuen Meldungen eine Benachrichtigung auslösen, ohne die Meldungsliste selbst einzuschränken.

## 2. Scope / Nicht-Scope

### Scope

- Anzeige von Meldungen aller drei Klassifizierungen (FSR-News, FB-Aktuelles, Event-Erinnerungen) in einer gemeinsamen, erkennbar unterscheidbaren Liste.
- FSR-News: Redaktion über das eigene Backend (INT-008, ursprünglich INT-003).
- FB-Aktuelles: Import aus der Fachbereichsseite `aktuelles-ni` (INT-010), rein lesend, keine FSR-Redaktion.
- Event-Erinnerungen: automatisch aus `features/events/spec.md` abgeleitet, keine eigene Redaktion.
- Anpinnen/Ablösen einzelner Meldungen zur dauerhaften lokalen Sichtbarkeit.
- Filterung der Meldungsliste nach Klassifizierung, Quelle/Verteiler und Veröffentlichungszeitraum.
- Suche über die geladenen Meldungen, wahlweise als einfache Textsuche oder als erweiterte Suche mit regulärem Ausdruck.
- Nachladen älterer Meldungen über die zuletzt geladene Seite hinaus.
- Push-Benachrichtigung bei neuen Meldungen, Opt-in (siehe `features/settings/spec.md`).
- Geräteseitige Positiv- und Sperrliste, die steuert, welche neuen Meldungen eine Benachrichtigung auslösen.

### Nicht-Scope

- Zweite News-Quelle „Wirtschaftsfachbereich" (FB9). Am 2026-08-25 als eigenständige Quelle mit eigenem Endpunkt und eigener Auswertung bestätigt (INT-016), bewusst nicht übernommen: Die Zielgruppe der App ist laut `product/vision.md` der Fachbereich Informatik, FB9-Meldungen betreffen nur einen Teil der Studierenden. Bei Bedarf als eigene Klassifizierung nachrüstbar, ohne dass NEWS-F-080 dafür geändert werden müsste.
- Kommentar- oder Reaktionsfunktion auf Meldungen — nicht Teil des aktuellen Umfangs.
- Redaktionelle Bearbeitung von FB-Aktuelles-Inhalten durch den FSR — diese Klassifizierung ist reiner Import, siehe INT-010.
- Serverseitiger Suchendpunkt oder serverseitige Volltextindizierung — Suche und erweiterte Suche arbeiten ausschließlich auf dem geräteseitig geladenen Bestand, siehe Erläuterung zu NEWS-F-120.
- Serverseitige Auswertung der Positiv- und Sperrliste oder deren Übertragung an das Backend — die Regeln bleiben auf dem Gerät, siehe NEWS-F-270.
- Ausblenden von Meldungen aus der Liste anhand der Benachrichtigungsregeln — Positiv- und Sperrliste wirken ausschließlich auf Benachrichtigungen, siehe NEWS-F-265.

## 3. Nutzergeschichten

- Als Studierende möchte ich aktuelle FSR-Meldungen lesen, ohne eine externe Website aufzusuchen.
- Als Studierende möchte ich Fachbereichs-Mitteilungen (Prüfungsinfos, Raumänderungen) in derselben App sehen wie FSR-News, ohne eine zweite Quelle prüfen zu müssen.
- Als Studierende möchte ich auf einen Blick erkennen, ob eine Meldung vom FSR oder vom Fachbereich stammt.
- Als Studierende möchte ich an ein bevorstehendes FSR-Event erinnert werden, ohne den Event-Kalender separat zu prüfen.
- Als Studierende möchte ich eine wichtige Meldung anpinnen, damit ich sie wiederfinde, auch wenn neuere Meldungen nachrücken.
- Als Studierende möchte ich bei neuen Meldungen optional benachrichtigt werden, ohne dass ich die App aktiv öffnen muss.
- Als Studierende möchte ich die Meldungsliste nach Klassifizierung, Verteiler oder Zeitraum eingrenzen, damit ich bei vielen Meldungen schneller die für mich relevanten finde.
- Als Studierende möchte ich innerhalb der geladenen Meldungen nach einem Stichwort suchen, ohne auf Groß- und Kleinschreibung achten zu müssen.
- Als Studierende mit Informatik-Vorkenntnissen möchte ich einen regulären Ausdruck als Suchbegriff verwenden, damit ich gezielt nach Mustern wie Modulkürzeln oder Raumnummern suchen kann.
- Als Studierende möchte ich festlegen, welche Meldungen mir eine Benachrichtigung schicken dürfen und welche nicht, damit ich nur zu für mich wichtigen Themen gestört werde und nicht etwa bei jeder Fundsachen-Meldung.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| NEWS-F-010 | Das System muss die aktuellen Meldungen aus dem eigenen Backend (INT-008, Zwischenspeicher von INT-003/INT-010) laden und in absteigender chronologischer Reihenfolge anzeigen. | Alt: lib/areas/news/repositories/news_repository.dart |
| NEWS-F-020 | Das System muss den Zeitstempel jeder Meldung im 24-Stunden-Format auswerten. | Alt: bewusst verworfen |
| NEWS-F-030 | Falls der News-Dienst nicht erreichbar ist, muss das System eine Fehlermeldung mit Wiederholen-Option anzeigen. | NEU |
| NEWS-F-040 | Das System muss der Nutzerin das Anpinnen und Ablösen einzelner Meldungen über einen sichtbaren Bedienweg ermöglichen. | Alt: bewusst verworfen |
| NEWS-F-050 | Das System muss angepinnte Meldungen unabhängig von ihrem Alter dauerhaft oberhalb der übrigen Meldungen anzeigen. | Alt: lib/areas/news/screens/news_overview_page.dart |
| NEWS-F-060 | Sofern die Nutzerin Push-Benachrichtigungen für News aktiviert hat, muss das System bei neuen Meldungen eine Benachrichtigung auslösen. | Alt: lib/utils/plugins/push_notification_manager.dart |
| NEWS-F-070 | Wenn eine Push-Benachrichtigung zu einer Meldung angetippt wird, muss das System direkt zur betreffenden Meldung navigieren. | NEU |
| NEWS-F-080 | Das System muss jede Meldung genau einer der drei Klassifizierungen FB-Aktuelles, FSR-News oder Event-Erinnerung zuordnen und diese Klassifizierung in der Liste sichtbar kennzeichnen. | NEU |
| NEWS-F-090 | Das System muss FB-Aktuelles-Meldungen aus INT-010 (Fachbereichsseite `aktuelles-ni`) über das eigene Backend laden. | NEU |
| NEWS-F-100 | Wenn ein Event aus `features/events/spec.md` innerhalb der konfigurierten Vorlaufzeit beginnt, muss das System dafür eine Meldung der Klassifizierung Event-Erinnerung in der Liste anzeigen. | NEU |
| NEWS-F-110 | Das System muss eine kombinierbare Filterung der Meldungsliste nach mindestens den Merkmalen Klassifizierung, Quelle/Verteiler und Veröffentlichungszeitraum anbieten. | NEU |
| NEWS-F-120 | Das System muss eine Suche über Titel und Text der geladenen Meldungen anbieten. | Alt: bewusst verworfen |
| NEWS-F-130 | Das System muss bei der Suche Groß- und Kleinschreibung unberücksichtigt lassen. | Alt: bewusst verworfen |
| NEWS-F-140 | Wenn die Nutzerin über das Ende der geladenen Meldungen hinaus blättert, muss das System ältere Meldungen nachladen. | Recherche: alte apps/android-fb4, model/LoadMoreItem.java, 2026-08-25 |
| NEWS-F-150 | Das System muss die Textsuche zusätzlich zu Titel und Text auch über die Quelle/den Verteiler jeder Meldung ausführen. | NEU |
| NEWS-F-160 | Solange gleichzeitig ein Filter und eine Suche aktiv sind, muss das System nur Meldungen anzeigen, die allen gesetzten Filtermerkmalen und dem Suchbegriff entsprechen. | NEU |
| NEWS-F-170 | Solange mindestens ein Filter oder eine Suche aktiv ist, muss das System dies sichtbar kennzeichnen und einen Bedienweg bereitstellen, der alle Einschränkungen auf einmal aufhebt. | NEU |
| NEWS-F-180 | Falls bei aktiver Suche oder aktivem Filter noch nicht alle Meldungen nachgeladen sind, muss das System darauf hinweisen, dass sich das Ergebnis nur auf die bereits geladenen Meldungen bezieht. | NEU |
| NEWS-F-190 | Sofern die Nutzerin den erweiterten Suchmodus aktiviert, muss das System den eingegebenen Suchbegriff als regulären Ausdruck über Titel, Text und Verteiler der geladenen Meldungen auswerten. | NEU |
| NEWS-F-200 | Falls der im erweiterten Suchmodus eingegebene reguläre Ausdruck syntaktisch ungültig ist, muss das System dies als Eingabefehler kennzeichnen und die zuletzt gültige Trefferliste unverändert lassen. | NEU |
| NEWS-F-210 | Das System muss die Auswertung eines von der Nutzerin eingegebenen regulären Ausdrucks nach einer festen Obergrenze für Laufzeit oder Verarbeitungsaufwand abbrechen, ohne dass die Bedienoberfläche währenddessen blockiert. | NEU |
| NEWS-F-215 | Wenn die Auswertung eines regulären Ausdrucks nach NEWS-F-210 abgebrochen wurde, muss das System dies der Nutzerin kenntlich machen, statt ein unvollständiges Ergebnis wie ein reguläres darzustellen. | NEU |
| NEWS-F-220 | Solange der erweiterte Suchmodus aktiv ist, muss das System der Nutzerin die Wahl lassen, ob die Suche Groß- und Kleinschreibung beachtet; NEWS-F-130 gilt in diesem Modus nur als Voreinstellung. | NEU |
| NEWS-F-230 | Sofern Push-Benachrichtigungen für News aktiviert sind, muss das System der Nutzerin ermöglichen, eine Positivliste und eine Sperrliste aus Regeln zu pflegen, die bestimmen, welche neuen Meldungen eine Benachrichtigung auslösen. | NEU |
| NEWS-F-240 | Das System muss als Regel für die Positiv- und die Sperrliste mindestens die Merkmale Klassifizierung, Quelle/Verteiler und Stichwort in Titel oder Text unterstützen. | NEU |
| NEWS-F-250 | Wenn eine neue Meldung eintrifft und Push-Benachrichtigungen für News aktiviert sind, muss das System genau dann eine Benachrichtigung auslösen, wenn die Meldung keiner Regel der Sperrliste entspricht und zusätzlich die Positivliste entweder leer ist oder die Meldung mindestens einer ihrer Regeln entspricht. | NEU |
| NEWS-F-260 | Das System muss die Positiv- und die Sperrliste ausschließlich auf das Auslösen von Benachrichtigungen anwenden. | NEU |
| NEWS-F-265 | Das System muss alle Meldungen in der Meldungsliste anzeigen, unabhängig davon, ob sie durch die Positiv- oder die Sperrliste von einer Benachrichtigung ausgeschlossen sind. | NEU |
| NEWS-F-270 | Das System muss die Auswertung der Positiv- und der Sperrliste ausschließlich auf dem Gerät vornehmen; die Regeln dürfen das Gerät nicht verlassen. | NEU |
| NEWS-F-280 | Sofern das System ohne Push-Infrastruktur In-App-Hinweise auf neue Meldungen anzeigt (INT-005), muss es dieselbe Auswertung der Positiv- und der Sperrliste darauf anwenden wie auf Push-Benachrichtigungen. | NEU |
| NEWS-F-290 | Sofern eine Regel der Positiv- oder der Sperrliste als regulärer Ausdruck gekennzeichnet ist, muss das System sie unter denselben Schutzmaßnahmen wie NEWS-F-210 auswerten. | NEU |

### Erläuterungen

**`NEWS-F-020`** — Die Alt-App parst den Zeitstempel mit dem Muster `dd.MM.yyyy - hh:mm:ss` (12-Stunden-Stunde `hh`), obwohl das Rohformat keine AM/PM-Angabe liefert (`news_item.dart:26`, dokumentiert als INT-003 in `platform/integrations.md`). Zeiten ab 13:00 Uhr werden dadurch falsch interpretiert. Für die Neuentwicklung ist 24-Stunden-Parsing (`HH`) verbindlich.

**`NEWS-F-070`** — Die Alt-App verarbeitet eingehende Push-Nachrichten nicht (Handler auskommentiert, siehe INT-005 in `platform/integrations.md`). Deep-Linking zur betreffenden Meldung ist daher Neuentwicklung ohne Alt-Vorbild.

**`NEWS-F-120`/`NEWS-F-130` — Suche.** Beide Alt-Apps bieten eine Suche über die Meldungen; die Android-App sogar getrennt für beide Nachrichtenbereiche. Sie fehlte bis zum 2026-08-25 in dieser Spec, wodurch die Neuentwicklung hinter beiden Alt-Apps zurückgeblieben wäre. Die Herkunftsmarkierung `Alt: bewusst verworfen` bezieht sich auf einen konkreten Mangel der Flutter-Umsetzung, nicht auf die Suche selbst: Dort ist sie eine reine Teilzeichenketten-Suche ohne Normalisierung der Groß-/Kleinschreibung (`news_overview_viewmodel.dart:95-101`, dokumentiert als M-017), sodass eine Suche nach „Klausur" eine Meldung mit „klausur" nicht findet. NEWS-F-130 korrigiert das ausdrücklich. Die Suche arbeitet auf dem geladenen Bestand; ein serverseitiger Suchendpunkt ist nicht vorgesehen, da der Bestand geräteseitig ohnehin vollständig vorliegt. Dieselbe geräteseitige Arbeitsweise gilt für Filter (NEWS-F-110) und erweiterten Suchmodus (NEWS-F-190 ff.); der optionale Klassifizierungs-Parameter der Meldungs-Abfrage (`platform/api-contract.yaml`) kann den Abruf zusätzlich serverseitig eingrenzen, ersetzt die geräteseitige Filterung aber nicht. Solange noch nicht alle Seiten nachgeladen sind (NEWS-F-140), beziehen sich Filter- und Suchergebnis nur auf den geladenen Teil — NEWS-F-180 macht das sichtbar, damit kein irreführendes Leerergebnis entsteht.

**`NEWS-F-140` — Nachladen.** Die Quelle liefert Meldungen seitenweise (INT-010, Pfad `/aktuelles-ni/seite/{page}`). Ohne Nachladen endet die Liste beim zuletzt geladenen Stand, was insbesondere bei der Suche zu irreführenden Leerergebnissen führt.

**`NEWS-F-080` bis `NEWS-F-100`** — Aus der Redaktionsweg-Entscheidung des FSR FB4 vom 2026-08-25 (siehe `specs/open-questions.md`, Archiv): drei Klassifizierungen statt eines einzelnen FSR-News-Feeds. `NEWS-F-100` benötigt eine konfigurierte Vorlaufzeit (z. B. 24 Stunden vor Event-Beginn); konkreter Wert und ob er FSR-weit fest oder je Nutzerin einstellbar ist, ist bei Umsetzung festzulegen (siehe Abschnitt 13).

**`NEWS-F-110`, `NEWS-F-150` bis `NEWS-F-180` — Filter und Suche als eine Ansicht.** Anforderung FSR FB4, 2026-09-04. News und „FB-Aktuelles" werden aktiv zur Ausfall- und Terminkommunikation genutzt (`../../product/whatsapp-feedback-inventory.md` Abschnitt 4); bei vielen Meldungen je Tag braucht es einen schnelleren Weg zur relevanten Meldung als das Durchblättern. Die vorige Fassung von NEWS-F-110 sah eine Filterung nur nach Klassifizierung und nur als „kann" vor — die neue Fassung macht die Filterung verbindlich, erweitert sie um Verteiler und Zeitraum und lässt sie mit der Suche kombinieren (NEWS-F-160). Weil eine Umsetzung, die die alte „kann"-Fassung erfüllte (gar kein Filter), die neue „muss"-Fassung verletzt, ist das eine Major-Änderung dieser Spec (Version 2.0.0, `specs/README.md` Abschnitt 8). Das Kennzeichnen aktiver Einschränkungen samt Rücksetzweg (NEWS-F-170) folgt dem Grundsatz aus `../../platform/ux-and-theming.md` UX-F-110 (der Leerzustand nennt den nächsten Schritt) und verhindert, dass ein vergessener Filter wie ein leerer Meldungsbestand wirkt — dieselbe Sorge, die schon die Erläuterung zu NEWS-F-140 nennt.

**`NEWS-F-190` bis `NEWS-F-220` — Erweiterter Suchmodus.** Anforderung FSR FB4, 2026-09-04. Die Zielgruppe der App sind Informatik-Studierende; ein Teil von ihnen kann und will mit regulären Ausdrücken gezielter suchen als mit einer Teilzeichenketten-Suche. Der erweiterte Modus ist ausdrücklich optional und als solcher gekennzeichnet — die einfache Suche (NEWS-F-120/F-130) bleibt der voreingestellte Weg. Zwei Punkte sind robustheits- und sicherheitsrelevant:

- Ein ungültiger Ausdruck darf nicht wie „keine Treffer" wirken, sondern wird als Eingabefehler gezeigt, ohne die letzte gültige Trefferliste zu verwerfen (NEWS-F-200). Das ist dieselbe Linie wie SEC-F-060 (keine stillschweigend verschluckten Fehler) und DATA-F-020 (kein kommentarloser Verlust bei unerwarteter Eingabe).
- Ein von der Nutzerin eingegebener regulärer Ausdruck kann bei ungünstiger Konstruktion katastrophales Backtracking auslösen und die Auswertung faktisch endlos laufen lassen (ReDoS). NEWS-F-210 verlangt daher eine harte Obergrenze und eine Auswertung, die die Bedienoberfläche nicht blockiert; NEWS-F-215 verlangt, den Abbruch sichtbar zu machen; NEWS-N-010 nennt den vorgeschlagenen Zeitwert. Die konkrete Umsetzung (Auswertung abseits des UI-Strangs, Zeitscheiben oder eine Ausdrucks-Engine mit garantiert linearer Laufzeit) ist bei Umsetzung zu wählen, siehe Abschnitt 13.

**`NEWS-F-230` bis `NEWS-F-290` — Positiv- und Sperrliste für Benachrichtigungen.** Anforderung FSR FB4, 2026-09-04. „FB-Aktuelles" bündelt sehr unterschiedliche Meldungsarten (Prüfungsinfos, Raumänderungen, Stellenausschreibungen, Fundsachen, siehe INT-010); wer Push aktiviert, möchte oft nur zu einem Teil davon gestört werden. Die Nutzerin pflegt dafür zwei Regellisten: eine Sperrliste (diese Meldungen lösen nie eine Benachrichtigung aus) und eine Positivliste (ist sie befüllt, lösen nur noch dazu passende Meldungen eine Benachrichtigung aus). NEWS-F-250 fasst beide zu einer einzigen prüfbaren Bedingung zusammen; die Beispieltabelle unten ist die verbindliche Vorgabe für die zugehörigen Tests (`../../platform/quality-and-testing.md` QA-F-010).

Die Auswertung läuft ausschließlich auf dem Gerät (NEWS-F-270), nach demselben Muster wie SCHED-F-220: Das Backend stellt die Meldung samt Metadaten zu, die App entscheidet anhand ihrer nur lokal gespeicherten Regeln, ob daraus eine Benachrichtigung wird. Gründe: Die Regeln (etwa Stichwörter zu belegten Fächern) sind für sich genommen personenbeziehbar und haben auf dem Server nichts zu suchen; die Android-Zustellung über UnifiedPush kennt ohnehin keine serverseitigen Themen je Nutzerin (INT-005); und derselbe Weg trägt die In-App-Hinweise, die ohne Push-Infrastruktur als Rückfall dienen (NEWS-F-280). Damit die App geräteseitig entscheiden kann, muss die Push-Nutzlast die nötigen Metadaten tragen (Klassifizierung, Verteiler, Titel) — festgehalten in `../../platform/integrations.md` INT-005.

Wichtig ist die Trennung zwischen Benachrichtigung und Liste: Positiv- und Sperrliste blenden keine Meldung aus der Meldungsliste aus (NEWS-F-265). Wer eine Benachrichtigung unterdrückt hat, findet die Meldung beim nächsten Blick in die App trotzdem; das Eingrenzen der Liste selbst leisten NEWS-F-110 und die Suche.

**`NEWS-F-250` — Beispieltabelle.** „Sperrliste befüllt" bzw. „Positivliste befüllt" heißt: enthält mindestens eine Regel. „löst aus" heißt: eine Benachrichtigung wird erzeugt (Push oder In-App-Hinweis).

| Sperrliste | Positivliste | Meldung passt zu Sperrlisten-Regel | Meldung passt zu Positivlisten-Regel | Benachrichtigung |
|---|---|---|---|---|
| leer | leer | (entfällt) | (entfällt) | löst aus |
| leer | befüllt | (entfällt) | ja | löst aus |
| leer | befüllt | (entfällt) | nein | unterdrückt — nicht von der Positivliste erfasst |
| befüllt | leer | ja | (entfällt) | unterdrückt — Sperrliste |
| befüllt | leer | nein | (entfällt) | löst aus |
| befüllt | befüllt | ja | ja | unterdrückt — Sperrliste hat Vorrang |
| befüllt | befüllt | nein | ja | löst aus |
| befüllt | befüllt | nein | nein | unterdrückt — nicht von der Positivliste erfasst |

## 5. Datenmodell

Meldung: Titel, Text, Veröffentlichungszeitpunkt, Quelle/Verteiler, Klassifizierung (`FB-Aktuelles` | `FSR-News` | `Event-Erinnerung`). Rohfelder FSR-News/FB-Aktuelles: siehe INT-003/INT-010 in `platform/integrations.md`. Event-Erinnerungen entstehen ausschließlich aus dem Event-Datenmodell (`features/events/spec.md`), keine eigenen Rohfelder. Angepinnter Zustand ist ein rein lokales Attribut, siehe `platform/data-and-storage.md` (DATA-F-060).

Filter- und Suchzustand (flüchtig): gewählte Klassifizierungen, Verteiler und Zeitraum (NEWS-F-110), Suchbegriff und Suchmodus einfach/erweitert (NEWS-F-120/NEWS-F-190), Wahl der Groß-/Kleinschreibung im erweiterten Modus (NEWS-F-220). Sitzungslokal, keine dauerhafte Speicherung nötig.

Benachrichtigungsregeln (lokal): Positivliste und Sperrliste als je eine Liste von Regeln. Eine Regel besteht aus einem Merkmalstyp (Klassifizierung, Verteiler oder Stichwort), dem Vergleichswert und einer Kennzeichnung, ob der Wert als Teilzeichenkette oder als regulärer Ausdruck ausgewertet wird (NEWS-F-240/NEWS-F-290). Ausschließlich geräteseitig gespeichert und nie übertragen (NEWS-F-270), siehe `platform/data-and-storage.md` Abschnitt 2 und DATA-F-180.

## 6. Externe Schnittstellen

Nutzt INT-003 (News-Feed, Klassifizierung FSR-News) und INT-010 (Fachbereichsseite `aktuelles-ni`, Klassifizierung FB-Aktuelles) ausschließlich über das eigene Backend INT-008 (siehe `platform/architecture.md` ARCH-F-050) sowie INT-005 (Push-Benachrichtigungen) für die Zustellung. Die geräteseitige Auswertung der Positiv- und Sperrliste (NEWS-F-250 ff.) setzt voraus, dass die Push-Nutzlast von INT-005 Klassifizierung, Verteiler und Titel der Meldung mitführt; dieser Bedarf ist bei INT-005 vermerkt. Event-Erinnerungen nutzen keine eigene externe Schnittstelle, sondern die interne Event-Ressource des Backends (siehe `features/events/spec.md`). Keine Endpunktdetails hier — siehe `platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des Abrufs, zuletzt geladene Meldungen bleiben sichtbar |
| Leer | Hinweis „keine aktuellen Meldungen" |
| Fehler | Fehlermeldung mit Wiederholen-Option (NEWS-F-030) |
| Offline | Zuletzt geladener Stand mit Alters-Hinweis, siehe Abschnitt 8 |
| Leer wegen Filter/Suche | Hinweis, dass die aktive Einschränkung der Grund ist, mit Rücksetzweg (NEWS-F-170) und, falls zutreffend, Hinweis auf nicht geladene Meldungen (NEWS-F-180) |
| Ungültiger regulärer Ausdruck | Sucheingabe als fehlerhaft markiert, zuletzt gültige Trefferliste bleibt stehen (NEWS-F-200) |
| Suche abgebrochen | Hinweis, dass die Auswertung des Ausdrucks die Zeitgrenze überschritten hat und abgebrochen wurde (NEWS-F-210, NEWS-F-215) |
| Benachrichtigungsregeln bearbeiten | Getrennte Listen für Positiv- und Sperrliste, je Regel Merkmalstyp und Wert; eine als regulärer Ausdruck gekennzeichnete Regel wird beim Speichern auf Gültigkeit geprüft |

## 8. Offline-Verhalten

News gehört zu den in `platform/architecture.md` (ARCH-F-100) benannten Bereichen mit garantiertem Offline-Zugriff auf den zuletzt geladenen, geräteseitig gecachten Stand (Cache-Regel: 15 Minuten laut INT-003, siehe `platform/data-and-storage.md` Abschnitt 4).

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Meldung mit unlesbarem Zeitstempel | Meldung dennoch anzeigen, Zeitstempel als „unbekannt" kennzeichnen statt die gesamte Meldung zu verwerfen |
| Push-Zustellung schlägt fehl | Kein Fehler in der App sichtbar — die Meldung ist beim nächsten regulären Abruf trotzdem verfügbar |
| Ungültiger regulärer Ausdruck in der Suche | Als Eingabefehler anzeigen, zuletzt gültige Trefferliste behalten (NEWS-F-200); nicht als „keine Treffer" darstellen |
| Regulärer Ausdruck überschreitet die Laufzeitgrenze | Auswertung abbrechen und den Abbruch sichtbar kennzeichnen, Bedienoberfläche bleibt bedienbar (NEWS-F-210, NEWS-F-215, NEWS-N-010) |
| Ungültiger regulärer Ausdruck in einer Benachrichtigungsregel | Regel beim Speichern als fehlerhaft kennzeichnen und nicht anwenden, bis sie korrigiert ist; die übrigen Regeln bleiben wirksam |
| Push-Nutzlast ohne die zum Filtern nötigen Metadaten | Im Zweifel benachrichtigen statt unterdrücken, damit keine Meldung wegen unvollständiger Daten stillschweigend übergangen wird; Abweichung protokollieren (SEC-F-060) |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| NEWS-N-010 | Die Auswertung eines Suchbegriffs über den geladenen Meldungsbestand sollte auf einem üblichen aktuellen Gerät innerhalb von 1 Sekunde abgeschlossen oder nach dieser Zeitspanne abgebrochen sein (vorgeschlagen, zu bestätigen). | NEU |

NEWS-N-010 ergänzt NFR-N-040/NFR-N-060 (wahrgenommene Reaktionszeit) um eine harte Obergrenze speziell für die nutzerdefinierte Ausdrucksauswertung (NEWS-F-210). Nachweis über ein datiertes Prüfprotokoll ist nach `platform/quality-and-testing.md` Abschnitt 3 (Leistungswerte) zulässig. Darüber hinaus keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Ein Testfall mit Zeitangabe ab 13:00 Uhr wird korrekt als Nachmittag/Abend ausgewertet (siehe `platform/quality-and-testing.md` QA-F-050).
- Angepinnte Meldungen bleiben nach App-Neustart angepinnt.
- Jede angezeigte Meldung trägt sichtbar genau eine der drei Klassifizierungen; eine FB-Aktuelles-Meldung erscheint ohne redaktionelle Bearbeitungsmöglichkeit durch den FSR (NEWS-F-080, NEWS-F-090).
- Ein Event innerhalb der konfigurierten Vorlaufzeit erzeugt genau eine Event-Erinnerung, kein Duplikat bei wiederholtem Laden der Liste (NEWS-F-100).
- Eine einfache Suche nach „klausur" findet eine Meldung mit „Klausur" (NEWS-F-130); im erweiterten Modus lässt sich diese Normalisierung abwählen (NEWS-F-220).
- Ein Klassifizierungsfilter und ein Suchbegriff wirken zusammen: das Ergebnis erfüllt beide Bedingungen (NEWS-F-160), und der aktive Zustand ist mit einem Schritt rücksetzbar (NEWS-F-170).
- Ein syntaktisch ungültiger regulärer Ausdruck erzeugt eine sichtbare Eingabefehler-Rückmeldung und verwirft die vorige Trefferliste nicht (NEWS-F-200).
- Ein bewusst auf katastrophales Backtracking angelegter regulärer Ausdruck blockiert die Oberfläche nicht und wird nach der Zeitgrenze sichtbar abgebrochen (NEWS-F-210, NEWS-F-215, NEWS-N-010).
- Die Beispieltabelle zu NEWS-F-250 ist vollständig als automatisierter Test abgebildet; eine Meldung auf der Sperrliste löst auch dann keine Benachrichtigung aus, wenn sie zugleich der Positivliste entspricht.
- Eine per Sperrliste von der Benachrichtigung ausgeschlossene Meldung ist in der Meldungsliste weiterhin vorhanden (NEWS-F-265).
- Im Netzverkehr der App ist kein Inhalt der Benachrichtigungsregeln zu beobachten (NEWS-F-270).

## 12. Bewusst nicht übernommenes Altverhalten

- 12-Stunden-Datumsparsing ohne AM/PM-Angabe im Rohformat — Grund: führt zu falscher Zeitanzeige ab 13:00 Uhr, siehe NEWS-F-020.
- Anpinnen/Ablösen ausschließlich über langes Drücken erreichbar — Grund: nicht auffindbar ohne Vorwissen, siehe `platform/ux-and-theming.md` UX-F-090.
- Suche ohne Normalisierung der Groß-/Kleinschreibung — Grund: liefert je nach Schreibweise unvollständige Treffer, siehe NEWS-F-130.
- Suche nur über ein ein-/ausblendbares Lupensymbol ohne sichtbaren Hinweis, dass sie gerade aktiv ist (Flutter-Alt-App, L-040) — Grund: eine vergessene Sucheingrenzung wirkt wie ein leerer Meldungsbestand, siehe NEWS-F-170.

## 13. Offene Fragen

- Vorlaufzeit für Event-Erinnerungen (NEWS-F-100): 24 Stunden vor Event-Beginn (Arbeitsziel, fester Wert; je-Nutzerin-Einstellbarkeit als mögliche spätere Erweiterung, nicht im ersten Umfang).
- Technische Machbarkeit des Imports von `aktuelles-ni` (strukturierter Feed vs. Scraping) — `platform/integrations.md` INT-010.
- Visuelle Unterscheidung der drei Klassifizierungen (NEWS-F-080): Arbeitsziel Icon plus Textlabel je Klassifizierung (nicht Farbe allein, konsistent mit `platform/ux-and-theming.md` UX-F-070) — konkrete Icon-/Farbwahl bei Bildschirmgestaltung.
- ~~Ob die Android-Alt-App tatsächlich zwei getrennte News-Quellen konsolidiert.~~ Beantwortet am 2026-08-25: Ja, zwei getrennte Quellen mit eigenen Endpunkten und Auswertungen (INT-010 und INT-016). FB9 wird bewusst nicht übernommen, siehe Nicht-Scope.
- Wie viele Seiten beim Nachladen (NEWS-F-140) höchstens abgerufen werden, bevor die Liste endet — bei Umsetzung anhand des tatsächlichen Bestands festzulegen.
- Konkrete Ausdrucks-Engine und ReDoS-Schutz für den erweiterten Suchmodus (NEWS-F-210): Auswertung abseits des UI-Strangs mit Zeitscheiben oder eine Engine mit garantiert linearer Laufzeit (RE2-artig). Bei Umsetzung durch die technische Leitung festzulegen; NEWS-N-010 nennt den vorläufigen Zeitwert.
- Ob der erweiterte Suchmodus dieselbe Ausdruckssyntax auch für Regeln der Positiv- und Sperrliste anbietet (NEWS-F-290) oder ob Regeln auf Teilzeichenketten-Stichwörter beschränkt bleiben — abhängig davon, wie tragfähig der ReDoS-Schutz im Hintergrund-Zustellpfad ist.
- Genauer Satz der Filtermerkmale (NEWS-F-110): Klassifizierung, Verteiler und Zeitraum sind gesetzt; ob zusätzlich ein Filter „nur angepinnte" sinnvoll ist, entscheidet sich bei der Bildschirmgestaltung.
- Wo die Benachrichtigungsregeln bedient werden — im News-Bereich, in den Einstellungen (`../settings/spec.md`) oder an beiden Stellen; Arbeitsziel ist der News-Bereich mit einem Einstiegspunkt aus den Einstellungen.
- Wert von NEWS-N-010 (1 Sekunde) ist ein Arbeitsziel, an einem frühen Prototyp auf einem Gerät der Mindestplattform (`platform/non-functional.md` Abschnitt 2) zu validieren.
