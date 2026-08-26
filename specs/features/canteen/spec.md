---
id: canteen
titel: Mensaplan
praefix: MENSA
status: accepted
prioritaet: kern
version: 1.0.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/MenuApi.java
  - alte apps/android-fb4/FB4/fB4/src/main/assets/canteens.json
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/MenuSortActivity.java
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/canteens_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/models/meal.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/viewmodels/canteen_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/select_canteens_page.dart
implemented_in: []
related:
  - ../../platform/integrations.md
  - ../../platform/backend-and-api.md
  - ../../platform/data-and-storage.md
  - ../../platform/security-and-privacy.md
  - ../../platform/non-functional.md
  - ../canteen-ratings/spec.md
  - ../settings/spec.md
---

# Mensaplan

## 1. Zweck & Nutzen

Zeigt Studierenden den Speiseplan der von ihnen gewählten Mensen des Studierendenwerks Dortmund. Übernimmt die Kernfunktion beider Alt-Apps, löst dabei aber die unverschlüsselte, an eine private Vermittler-Infrastruktur gebundene Altimplementierung ab. Ergänzend können Studierende Lieblingsgerichte markieren und werden vormittags benachrichtigt, wenn eines davon am aktuellen Tag angeboten wird, statt den Speiseplan selbst danach durchsuchen zu müssen.

## 2. Scope / Nicht-Scope

### Scope

- Anzeige des Tages-Speiseplans für eine oder mehrere gewählte Mensen, mit Blättern über benachbarte Tage.
- Auswahl der angezeigten Mensen aus der vom Backend gelieferten Liste, einschließlich eigener Reihenfolge.
- Anzeige der Öffnungszeiten je Mensa und Wochentag.
- Anzeige von Preisen (Studierende/Mitarbeitende/Gäste) und Zusatzstoff-/Allergenhinweisen.
- Markieren von Gerichten als Lieblingsgericht und lokale Benachrichtigung, wenn eines davon am aktuellen Tag im Speiseplan einer gewählten Mensa auftaucht.

### Nicht-Scope

- Bewertung einzelner Gerichte — eigene Spec, aber als Handlung je Gericht innerhalb dieser Ansicht erreichbar, kein eigener Navigationspunkt, siehe `features/canteen-ratings/spec.md`.
- Bestellung, Bezahlung oder Guthabenabfrage — die Schnittstelle ist rein lesend.
- Serverseitige Speicherung der Lieblingsgerichte-Liste — ausdrücklich lokal gehalten, siehe Erläuterung zu MENSA-F-090.
- Versand der Lieblingsgerichte-Benachrichtigung über INT-005 (UnifiedPush/FCM) — die Benachrichtigung entsteht ausschließlich lokal auf dem Gerät, siehe Erläuterung zu MENSA-F-100.

## 3. Nutzergeschichten

- Als Studierende möchte ich sehen, was heute in meiner Mensa angeboten wird, ohne die Mensa-Website zu besuchen.
- Als Studierende möchte ich mehrere Mensen (z. B. am Wohn- und am Studienort) auswählen und zwischen ihnen wechseln.
- Als Studierende mit Unverträglichkeit möchte ich Zusatzstoff-/Allergenhinweise je Gericht sehen.
- Als Studierende möchte ich mein Lieblingsgericht markieren und morgens benachrichtigt werden, wenn es heute angeboten wird, damit ich es nicht verpasse, ohne täglich selbst im Speiseplan nachzusehen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| MENSA-F-010 | Das System muss den Speiseplan des aktuellen Tages für die zuletzt gewählte Mensa anzeigen. | Alt: lib/areas/canteen/repositories/meals_repository.dart |
| MENSA-F-020 | Das System muss der Nutzerin die Auswahl einer oder mehrerer Mensen aus der vom Backend gelieferten Mensa-Liste ermöglichen. | Alt: lib/areas/more/screens/select_canteens_page.dart |
| MENSA-F-025 | Das System muss der Nutzerin das Festlegen der Reihenfolge ermöglichen, in der die gewählten Mensen angezeigt werden. | Recherche: alte apps/android-fb4, activities/MenuSortActivity.java, 2026-08-25 |
| MENSA-F-030 | Das System muss zu jedem Gericht Kategorie, Bezeichnung, Preis für Studierende, Mitarbeitende und Gäste sowie Zusatzstoff-/Allergenhinweise anzeigen. | Alt: lib/areas/canteen/models/meal.dart |
| MENSA-F-040 | Das System muss `Beilagen` als eigene Kategorie von den Hauptspeisen getrennt darstellen. | Alt: lib/areas/canteen/models/meal.dart |
| MENSA-F-045 | Das System muss der Nutzerin das Blättern zu benachbarten Tagen des Speiseplans ermöglichen. | Alt: lib/areas/canteen/screens/canteen_overview_page.dart:39 |
| MENSA-F-047 | Das System muss zu jeder gewählten Mensa deren Öffnungszeiten für den angezeigten Wochentag ausweisen. | Recherche: alte apps/android-fb4, model/OpeningsDto.java, 2026-08-25 |
| MENSA-F-048 | Das System muss Gerichtskategorien und Zusatzstoffhinweise in der gewählten Oberflächensprache anzeigen, sofern die Quelle sie in dieser Sprache liefert. | Recherche: alte apps/android-fb4, model/MenuInformationDto.java, 2026-08-25 |
| MENSA-F-050 | Solange keine Netzwerkverbindung besteht, muss das System den zuletzt geladenen Speiseplan anzeigen. | Alt: lib/areas/canteen/repositories/meals_repository.dart |
| MENSA-F-060 | Falls beim Laden des Speiseplans ein Fehler auftritt, muss das System ihn der Nutzerin sichtbar machen, statt ihn stillschweigend zu verwerfen. | Alt: bewusst verworfen |
| MENSA-F-070 | Das System muss den Speiseplan ausschließlich über eine TLS-gesicherte Verbindung abrufen. | Alt: bewusst verworfen |
| MENSA-F-075 | Falls die Mensa-Liste nicht vom Backend geladen werden kann, muss das System mit dem im Anwendungspaket mitgelieferten Ausgangsbestand arbeiten. | Recherche: alte apps/android-fb4, assets/canteens.json, 2026-08-25 |
| MENSA-F-080 | Das System muss der Nutzerin ermöglichen, ein Gericht im Speiseplan als Lieblingsgericht zu markieren und die Markierung wieder aufzuheben. | NEU |
| MENSA-F-090 | Das System muss eine Markierung als Lieblingsgericht anhand der normalisierten Gerichtsbezeichnung (RATE-F-050, `features/canteen-ratings/spec.md`) vornehmen, damit dieselbe Markierung unabhängig vom Zubereitungstag wiedererkannt wird. | NEU |
| MENSA-F-100 | Wenn der Tages-Speiseplan einer gewählten Mensa (MENSA-F-020) ein als Lieblingsgericht markiertes Gericht enthält, muss das System die Nutzerin per lokaler Gerätebenachrichtigung darüber informieren. | NEU |
| MENSA-F-110 | Das System darf für dasselbe Gericht an derselben Mensa am selben Tag höchstens eine Benachrichtigung auslösen. | NEU |

### Erläuterungen

**`MENSA-F-060`** — `canteen_overview_viewmodel.dart:60-66` enthält einen `try`-Block mit leerem `finally` ohne `catch`; ein Fehler beim Laden des Speiseplans verschwindet dadurch kommentarlos (dokumentiert in `platform/security-and-privacy.md` SEC-F-060). Für die Neuentwicklung ist sichtbare Fehlerbehandlung verbindlich.

**`MENSA-F-070`** — Der Altaufruf erfolgt unverschlüsselt über `http://fb4app.hemacode.de/...` (`meals_repository.dart:21`, dokumentiert als INT-004 in `platform/integrations.md`, Risiko „hoch"). Für die Neuentwicklung ist TLS ausnahmslos verbindlich (siehe auch `platform/security-and-privacy.md` SEC-N-030).

**`MENSA-F-090` — lokal statt serverseitig (Architekturentscheidung).** Die Lieblingsgerichte-Liste verrät Ernährungsgewohnheiten und -vorlieben und ist damit sensibler als eine reine Mensaauswahl. Analog zur bereits für SCHED getroffenen Entscheidung (kein serverseitiges Speichern persönlicher Auswahl, siehe `features/schedule/spec.md` Erläuterung zu SCHED-F-220, `platform/backend-and-api.md` API-F-100) bleibt die Liste ausschließlich gerätelokal (`platform/data-and-storage.md` DATA-F-010). Das Backend (INT-008) erfährt nichts über individuelle Vorlieben.

**`MENSA-F-100` — lokale Benachrichtigung statt INT-005 (UnifiedPush/FCM).** INT-005 ist ein Themen-/Endpunkt-Abonnement für alle Nutzerinnen gleichermaßen und für Inhalte gedacht, die der FSR selbst veröffentlicht (News); es eignet sich nicht für eine pro Nutzerin unterschiedliche, personenbezogene Auswahl wie Lieblingsgerichte, ohne diese Auswahl an das Backend zu übertragen — was MENSA-F-090 gerade ausschließt. Der Abgleich (MENSA-F-100) erfolgt daher rein clientseitig gegen den ohnehin abgerufenen Tages-Speiseplan (MENSA-F-010), die Benachrichtigung wird über die geräteeigene lokale Benachrichtigungs-API ausgelöst, ohne Netzwerkbeteiligung. Dafür ist wie bei INT-005 die vom Betriebssystem erteilte allgemeine Benachrichtigungsberechtigung erforderlich (siehe Abschnitt 9 „Fehlerfälle"), aber kein Push-Abonnement.

**`MENSA-F-100` — Zeitpunkt „vormittags" und Plattformgrenzen.** Damit die Benachrichtigung für die Tagesplanung nutzbar ist, muss der Abgleich vor der Mittagszeit erfolgen (Zielwert siehe MENSA-N-010). Ein zu einer festen Uhrzeit garantiert ausgeführter Hintergrundabruf ist auf mobilen Betriebssystemen (insbesondere iOS) nicht zugesichert (vgl. bereits dokumentierte Zurückhaltung zu Hintergrundabrufen in `platform/non-functional.md` NFR-N-090). Trifft der Hintergrundabruf nicht rechtzeitig ein, holt das System den Abgleich beim nächsten Öffnen der App nach, sofern es noch vormittags ist (siehe Abschnitt 9 „Fehlerfälle") — es gibt keine rückwirkende Benachrichtigung am Nachmittag.

## 5. Datenmodell

Gericht: Kategorie, Bezeichnung, Preise für Studierende/Mitarbeitende/Gäste, Zusatzstoffhinweise — Felder wie in INT-015 (`platform/integrations.md`) dokumentiert. Mensa-Stammdaten: siehe `platform/backend-and-api.md` Abschnitt 5. Mensaauswahl und -reihenfolge der Nutzerin: lokal persistiert, siehe `platform/data-and-storage.md`.

Lieblingsgerichte-Liste (lokal): Menge normalisierter Gerichtsbezeichnungen (RATE-F-050), rein gerätegespeichert, kein serverseitiges Pendant (siehe Erläuterung zu MENSA-F-090). Benachrichtigungsverlauf (lokal): je Kombination aus Gericht, Mensa und Datum ein Merker, ob bereits benachrichtigt wurde (Grundlage für MENSA-F-110).

## 6. Externe Schnittstellen

Nutzt INT-015 (Mensa-API des ITMC) über das eigene Backend INT-008 (siehe `platform/architecture.md` ARCH-F-050). Die Mensa-Stammdaten (Kennung, Anzeigename, Öffnungszeiten, Standardauswahl, Reihenfolge) liefert das Backend selbst, siehe `platform/backend-and-api.md` API-F-230. Der Lieblingsgerichte-Abgleich (MENSA-F-100) nutzt ausschließlich die bereits über INT-015 abgerufenen Daten sowie die geräteeigene lokale Benachrichtigungs-API — ausdrücklich **nicht** INT-005, siehe Erläuterung zu MENSA-F-100. Keine weiteren Endpunktdetails hier — siehe `platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des Abrufs |
| Leer (keine Mensa gewählt) | Hinweis auf die Mensaauswahl als nächsten Schritt |
| Leer (Mensa geschlossen/kein Angebot) | Hinweis „heute kein Angebot", keine Fehlermeldung |
| Fehler | Fehlermeldung mit Wiederholen-Option (MENSA-F-060) |
| Offline | Zuletzt geladener Speiseplan mit Alters-Hinweis |
| Lieblingsgericht heute verfügbar | Gericht im Speiseplan zusätzlich visuell hervorgehoben (unabhängig davon, ob die Benachrichtigung MENSA-F-100 bereits ausgelöst wurde) |

## 8. Offline-Verhalten

Speisepläne gelten laut `platform/data-and-storage.md` Abschnitt 4 bis Tagesende als aktuell genug und werden bei fehlendem Netzzugriff aus dem Zwischenspeicher angezeigt (siehe auch `platform/architecture.md` ARCH-F-100). Die Lieblingsgerichte-Liste selbst ist wie jede lokale Auswahl unabhängig vom Netzzugriff verfügbar; der Abgleich gegen den Tagesplan (MENSA-F-100) setzt jedoch einen zuvor erfolgreich geladenen Speiseplan voraus.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Gewählte Mensa liefert an einem Tag keine Daten | Leerzustand „heute kein Angebot", kein Fehlerzustand |
| INT-015 liefert unerwartetes Antwortformat | Fehler protokollieren, Fehlermeldung mit Wiederholen-Option anzeigen (siehe `platform/quality-and-testing.md` QA-N-070) |
| Markieren eines Lieblingsgerichts ohne erteilte Systemberechtigung für Benachrichtigungen | Markierung wird dennoch gespeichert (MENSA-F-080), Hinweis auf fehlende Systemberechtigung mit Verweis auf die Systemeinstellungen (analog `features/settings/spec.md` Abschnitt 9) |
| Hintergrundabruf vor dem Zielzeitpunkt aus MENSA-N-010 nicht ausgeführt (Plattformeinschränkung) | Abgleich und Benachrichtigung erfolgen beim nächsten App-Öffnen nach, sofern es noch vormittags ist; andernfalls entfällt die Benachrichtigung für diesen Tag ersatzlos, das Gericht bleibt im Speiseplan normal sichtbar |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| MENSA-N-010 | Der Lieblingsgerichte-Abgleich (MENSA-F-100) sollte spätestens um 11:00 Uhr Ortszeit erfolgt sein, sofern ein Hintergrundabruf bis dahin durch das Betriebssystem zugelassen wurde. | NEU |

## 11. Akzeptanzkriterien

- Für eine gewählte Mensa mit bekanntem Tagesangebot werden alle Gerichte mit vollständigen Preisangaben angezeigt.
- Ein simulierter Ladefehler führt zu einer sichtbaren Fehlermeldung, nicht zu einer stillen leeren Ansicht.
- Ein als Lieblingsgericht markiertes Gericht wird über mehrere Tage hinweg trotz wechselnder roher Gerichtsbezeichnung wiedererkannt (MENSA-F-090).
- Erscheint ein Lieblingsgericht im Tages-Speiseplan, erfolgt genau eine Benachrichtigung für diese Gericht-Mensa-Tag-Kombination, keine wiederholte (MENSA-F-110).
- Die Lieblingsgerichte-Liste bleibt nach einem simulierten Offline-Start der App vollständig erhalten (lokale Persistenz, MENSA-F-090/Datenmodell).

## 12. Bewusst nicht übernommenes Altverhalten

- Stillschweigend verschluckter Ladefehler (leeres `finally` ohne `catch`) — Grund: verdeckt Fehlerzustände, siehe MENSA-F-060.
- Unverschlüsselter Abruf über `http://` — Grund: überträgt Standort-/Mensawahl im Klartext, siehe MENSA-F-070.

## 13. Offene Fragen

- ~~Datenquelle für Mensa-Öffnungszeiten: keine bestätigte Quelle identifiziert.~~ Beantwortet am 2026-08-25: INT-015 liefert Öffnungszeiten je Mensa; zusätzlich enthalten die Mensa-Stammdaten eine gepflegte Angabe je Wochentag. Aufgenommen als MENSA-F-047.
- Welche der beiden Öffnungszeit-Quellen führend ist — die Schnittstelle (INT-015, `openings/all`) oder die gepflegten Stammdaten — bei Umsetzung zu entscheiden; die Android-Alt-App führt beide nebeneinander.
- Zuverlässigkeit zeitgesteuerter Hintergrundabrufe je Plattform (insbesondere iOS Background App Refresh) für den Zielwert aus MENSA-N-010 — vor Umsetzung anhand eines frühen Prototyps zu validieren, vgl. `platform/non-functional.md` Abschnitt 11 zum generellen Umgang mit Leistungszielwerten.
- Ob ein zusätzlicher, globaler Ein-/Ausschalter für Lieblingsgerichte-Benachrichtigungen in `features/settings/spec.md` sinnvoll ist (unabhängig vom Entfernen einzelner Markierungen, MENSA-F-080) — für den ersten Umfang genügt das Markieren/Entmarkieren selbst als Opt-in/Opt-out, siehe Abschnitt 4.
