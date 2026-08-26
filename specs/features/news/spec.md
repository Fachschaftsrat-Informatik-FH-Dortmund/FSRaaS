---
id: news
titel: News
praefix: NEWS
status: accepted
prioritaet: kern
version: 1.0.0
owner: FSR FB4
last_reviewed: 2026-08-25
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
  - ../../platform/ux-and-theming.md
  - ../../platform/quality-and-testing.md
  - ../settings/spec.md
  - ../events/spec.md
---

# News

## 1. Zweck & Nutzen

Die News-Funktion informiert Studierende über drei Klassifizierungen von Meldungen: FSR-News (Redaktionsmeldungen des FSR), FB-Aktuelles (Mitteilungen des Fachbereichs, importiert aus `aktuelles-ni`) und Event-Erinnerungen (automatisch aus dem Event-Kalender abgeleitet). Sie ersetzt das bisherige Einzel-Feed-Modell der Flutter-App durch einen über das eigene Backend vermittelten, robusteren Zugang und behebt einen bekannten Datumsfehler der Alt-App. Entscheidung FSR FB4, 2026-08-25, siehe `specs/open-questions.md` (Archiv).

## 2. Scope / Nicht-Scope

### Scope

- Anzeige von Meldungen aller drei Klassifizierungen (FSR-News, FB-Aktuelles, Event-Erinnerungen) in einer gemeinsamen, erkennbar unterscheidbaren Liste.
- FSR-News: Redaktion über das eigene Backend (INT-008, ursprünglich INT-003).
- FB-Aktuelles: Import aus der Fachbereichsseite `aktuelles-ni` (INT-010), rein lesend, keine FSR-Redaktion.
- Event-Erinnerungen: automatisch aus `features/events/spec.md` abgeleitet, keine eigene Redaktion.
- Anpinnen/Ablösen einzelner Meldungen zur dauerhaften lokalen Sichtbarkeit.
- Suche über die geladenen Meldungen.
- Nachladen älterer Meldungen über die zuletzt geladene Seite hinaus.
- Push-Benachrichtigung bei neuen Meldungen, Opt-in (siehe `features/settings/spec.md`).

### Nicht-Scope

- Zweite News-Quelle „Wirtschaftsfachbereich" (FB9). Am 2026-08-25 als eigenständige Quelle mit eigenem Endpunkt und eigener Auswertung bestätigt (INT-016), bewusst nicht übernommen: Die Zielgruppe der App ist laut `product/vision.md` der Fachbereich Informatik, FB9-Meldungen betreffen nur einen Teil der Studierenden. Bei Bedarf als eigene Klassifizierung nachrüstbar, ohne dass NEWS-F-080 dafür geändert werden müsste.
- Kommentar- oder Reaktionsfunktion auf Meldungen — nicht Teil des aktuellen Umfangs.
- Redaktionelle Bearbeitung von FB-Aktuelles-Inhalten durch den FSR — diese Klassifizierung ist reiner Import, siehe INT-010.

## 3. Nutzergeschichten

- Als Studierende möchte ich aktuelle FSR-Meldungen lesen, ohne eine externe Website aufzusuchen.
- Als Studierende möchte ich Fachbereichs-Mitteilungen (Prüfungsinfos, Raumänderungen) in derselben App sehen wie FSR-News, ohne eine zweite Quelle prüfen zu müssen.
- Als Studierende möchte ich auf einen Blick erkennen, ob eine Meldung vom FSR oder vom Fachbereich stammt.
- Als Studierende möchte ich an ein bevorstehendes FSR-Event erinnert werden, ohne den Event-Kalender separat zu prüfen.
- Als Studierende möchte ich eine wichtige Meldung anpinnen, damit ich sie wiederfinde, auch wenn neuere Meldungen nachrücken.
- Als Studierende möchte ich bei neuen Meldungen optional benachrichtigt werden, ohne dass ich die App aktiv öffnen muss.

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
| NEWS-F-110 | Das System kann das Filtern der Meldungsliste nach einzelnen Klassifizierungen ermöglichen. | NEU |
| NEWS-F-120 | Das System muss eine Suche über Titel und Text der geladenen Meldungen anbieten. | Alt: bewusst verworfen |
| NEWS-F-130 | Das System muss bei der Suche Groß- und Kleinschreibung unberücksichtigt lassen. | Alt: bewusst verworfen |
| NEWS-F-140 | Wenn die Nutzerin über das Ende der geladenen Meldungen hinaus blättert, muss das System ältere Meldungen nachladen. | Recherche: alte apps/android-fb4, model/LoadMoreItem.java, 2026-08-25 |

### Erläuterungen

**`NEWS-F-020`** — Die Alt-App parst den Zeitstempel mit dem Muster `dd.MM.yyyy - hh:mm:ss` (12-Stunden-Stunde `hh`), obwohl das Rohformat keine AM/PM-Angabe liefert (`news_item.dart:26`, dokumentiert als INT-003 in `platform/integrations.md`). Zeiten ab 13:00 Uhr werden dadurch falsch interpretiert. Für die Neuentwicklung ist 24-Stunden-Parsing (`HH`) verbindlich.

**`NEWS-F-070`** — Die Alt-App verarbeitet eingehende Push-Nachrichten nicht (Handler auskommentiert, siehe INT-005 in `platform/integrations.md`). Deep-Linking zur betreffenden Meldung ist daher Neuentwicklung ohne Alt-Vorbild.

**`NEWS-F-120`/`NEWS-F-130` — Suche.** Beide Alt-Apps bieten eine Suche über die Meldungen; die Android-App sogar getrennt für beide Nachrichtenbereiche. Sie fehlte bis zum 2026-08-25 in dieser Spec, wodurch die Neuentwicklung hinter beiden Alt-Apps zurückgeblieben wäre. Die Herkunftsmarkierung `Alt: bewusst verworfen` bezieht sich auf einen konkreten Mangel der Flutter-Umsetzung, nicht auf die Suche selbst: Dort ist sie eine reine Teilzeichenketten-Suche ohne Normalisierung der Groß-/Kleinschreibung (`news_overview_viewmodel.dart:95-101`, dokumentiert als M-017), sodass eine Suche nach „Klausur" eine Meldung mit „klausur" nicht findet. NEWS-F-130 korrigiert das ausdrücklich. Die Suche arbeitet auf dem geladenen Bestand; ein serverseitiger Suchendpunkt ist nicht vorgesehen, da der Bestand geräteseitig ohnehin vollständig vorliegt.

**`NEWS-F-140` — Nachladen.** Die Quelle liefert Meldungen seitenweise (INT-010, Pfad `/aktuelles-ni/seite/{page}`). Ohne Nachladen endet die Liste beim zuletzt geladenen Stand, was insbesondere bei der Suche zu irreführenden Leerergebnissen führt.

**`NEWS-F-080` bis `NEWS-F-100`** — Aus der Redaktionsweg-Entscheidung des FSR FB4 vom 2026-08-25 (siehe `specs/open-questions.md`, Archiv): drei Klassifizierungen statt eines einzelnen FSR-News-Feeds. `NEWS-F-100` benötigt eine konfigurierte Vorlaufzeit (z. B. 24 Stunden vor Event-Beginn); konkreter Wert und ob er FSR-weit fest oder je Nutzerin einstellbar ist, ist bei Umsetzung festzulegen (siehe Abschnitt 13).

## 5. Datenmodell

Meldung: Titel, Text, Veröffentlichungszeitpunkt, Quelle/Verteiler, Klassifizierung (`FB-Aktuelles` | `FSR-News` | `Event-Erinnerung`). Rohfelder FSR-News/FB-Aktuelles: siehe INT-003/INT-010 in `platform/integrations.md`. Event-Erinnerungen entstehen ausschließlich aus dem Event-Datenmodell (`features/events/spec.md`), keine eigenen Rohfelder. Angepinnter Zustand ist ein rein lokales Attribut, siehe `platform/data-and-storage.md` (DATA-F-060).

## 6. Externe Schnittstellen

Nutzt INT-003 (News-Feed, Klassifizierung FSR-News) und INT-010 (Fachbereichsseite `aktuelles-ni`, Klassifizierung FB-Aktuelles) ausschließlich über das eigene Backend INT-008 (siehe `platform/architecture.md` ARCH-F-050) sowie INT-005 (Push-Benachrichtigungen) für die Zustellung. Event-Erinnerungen nutzen keine eigene externe Schnittstelle, sondern die interne Event-Ressource des Backends (siehe `features/events/spec.md`). Keine Endpunktdetails hier — siehe `platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des Abrufs, zuletzt geladene Meldungen bleiben sichtbar |
| Leer | Hinweis „keine aktuellen Meldungen" |
| Fehler | Fehlermeldung mit Wiederholen-Option (NEWS-F-030) |
| Offline | Zuletzt geladener Stand mit Alters-Hinweis, siehe Abschnitt 8 |

## 8. Offline-Verhalten

News gehört zu den in `platform/architecture.md` (ARCH-F-100) benannten Bereichen mit garantiertem Offline-Zugriff auf den zuletzt geladenen, geräteseitig gecachten Stand (Cache-Regel: 15 Minuten laut INT-003, siehe `platform/data-and-storage.md` Abschnitt 4).

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Meldung mit unlesbarem Zeitstempel | Meldung dennoch anzeigen, Zeitstempel als „unbekannt" kennzeichnen statt die gesamte Meldung zu verwerfen |
| Push-Zustellung schlägt fehl | Kein Fehler in der App sichtbar — die Meldung ist beim nächsten regulären Abruf trotzdem verfügbar |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Ein Testfall mit Zeitangabe ab 13:00 Uhr wird korrekt als Nachmittag/Abend ausgewertet (siehe `platform/quality-and-testing.md` QA-F-050).
- Angepinnte Meldungen bleiben nach App-Neustart angepinnt.
- Jede angezeigte Meldung trägt sichtbar genau eine der drei Klassifizierungen; eine FB-Aktuelles-Meldung erscheint ohne redaktionelle Bearbeitungsmöglichkeit durch den FSR (NEWS-F-080, NEWS-F-090).
- Ein Event innerhalb der konfigurierten Vorlaufzeit erzeugt genau eine Event-Erinnerung, kein Duplikat bei wiederholtem Laden der Liste (NEWS-F-100).

## 12. Bewusst nicht übernommenes Altverhalten

- 12-Stunden-Datumsparsing ohne AM/PM-Angabe im Rohformat — Grund: führt zu falscher Zeitanzeige ab 13:00 Uhr, siehe NEWS-F-020.
- Anpinnen/Ablösen ausschließlich über langes Drücken erreichbar — Grund: nicht auffindbar ohne Vorwissen, siehe `platform/ux-and-theming.md` UX-F-090.
- Suche ohne Normalisierung der Groß-/Kleinschreibung — Grund: liefert je nach Schreibweise unvollständige Treffer, siehe NEWS-F-130.

## 13. Offene Fragen

- Vorlaufzeit für Event-Erinnerungen (NEWS-F-100): 24 Stunden vor Event-Beginn (Arbeitsziel, fester Wert; je-Nutzerin-Einstellbarkeit als mögliche spätere Erweiterung, nicht im ersten Umfang).
- Technische Machbarkeit des Imports von `aktuelles-ni` (strukturierter Feed vs. Scraping) — `platform/integrations.md` INT-010.
- Visuelle Unterscheidung der drei Klassifizierungen (NEWS-F-080): Arbeitsziel Icon plus Textlabel je Klassifizierung (nicht Farbe allein, konsistent mit `platform/ux-and-theming.md` UX-F-070) — konkrete Icon-/Farbwahl bei Bildschirmgestaltung.
- ~~Ob die Android-Alt-App tatsächlich zwei getrennte News-Quellen konsolidiert.~~ Beantwortet am 2026-08-25: Ja, zwei getrennte Quellen mit eigenen Endpunkten und Auswertungen (INT-010 und INT-016). FB9 wird bewusst nicht übernommen, siehe Nicht-Scope.
- Wie viele Seiten beim Nachladen (NEWS-F-140) höchstens abgerufen werden, bevor die Liste endet — bei Umsetzung anhand des tatsächlichen Bestands festzulegen.
