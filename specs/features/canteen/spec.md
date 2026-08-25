---
id: canteen
titel: Mensaplan
praefix: MENSA
status: draft
prioritaet: kern
version: 0.1.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
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
  - ../canteen-ratings/spec.md
---

# Mensaplan

## 1. Zweck & Nutzen

Zeigt Studierenden den Speiseplan der von ihnen gewählten Mensen des Studierendenwerks Dortmund. Übernimmt die Kernfunktion beider Alt-Apps, löst dabei aber die unverschlüsselte, an eine private Vermittler-Infrastruktur gebundene Altimplementierung ab.

## 2. Scope / Nicht-Scope

### Scope

- Anzeige des Tages-Speiseplans für eine oder mehrere gewählte Mensen.
- Auswahl der angezeigten Mensen aus der verfügbaren Liste.
- Anzeige von Preisen (Studierende/Mitarbeitende/Gäste) und Zusatzstoff-/Allergenhinweisen.

### Nicht-Scope

- Bewertung einzelner Gerichte — eigene Spec, aber als Handlung je Gericht innerhalb dieser Ansicht erreichbar, kein eigener Navigationspunkt, siehe `features/canteen-ratings/spec.md`.
- Öffnungszeiten der Mensen — laut Android-Alt-App-Beschreibung möglicherweise vorhanden (siehe `product/legacy-inventory.md`), aber ohne bestätigte Datenquelle; nicht Teil dieses Umfangs, bis eine Quelle identifiziert ist.

## 3. Nutzergeschichten

- Als Studierende möchte ich sehen, was heute in meiner Mensa angeboten wird, ohne die Mensa-Website zu besuchen.
- Als Studierende möchte ich mehrere Mensen (z. B. am Wohn- und am Studienort) auswählen und zwischen ihnen wechseln.
- Als Studierende mit Unverträglichkeit möchte ich Zusatzstoff-/Allergenhinweise je Gericht sehen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| MENSA-F-010 | Das System muss den Speiseplan des aktuellen Tages für die zuletzt gewählte Mensa anzeigen. | Alt: lib/areas/canteen/repositories/meals_repository.dart |
| MENSA-F-020 | Das System muss der Nutzerin die Auswahl einer oder mehrerer Mensen aus der verfügbaren Liste ermöglichen. | Alt: lib/areas/more/screens/select_canteens_page.dart |
| MENSA-F-030 | Das System muss zu jedem Gericht Kategorie, Bezeichnung, Preis für Studierende, Mitarbeitende und Gäste sowie Zusatzstoff-/Allergenhinweise anzeigen. | Alt: lib/areas/canteen/models/meal.dart |
| MENSA-F-040 | Das System muss `Beilagen` als eigene Kategorie von den Hauptspeisen getrennt darstellen. | Alt: lib/areas/canteen/models/meal.dart |
| MENSA-F-050 | Solange keine Netzwerkverbindung besteht, muss das System den zuletzt geladenen Speiseplan anzeigen. | Alt: lib/areas/canteen/repositories/meals_repository.dart |
| MENSA-F-060 | Falls beim Laden des Speiseplans ein Fehler auftritt, muss das System ihn der Nutzerin sichtbar machen, statt ihn stillschweigend zu verwerfen. | Alt: bewusst verworfen |
| MENSA-F-070 | Das System muss den Speiseplan ausschließlich über eine TLS-gesicherte Verbindung abrufen. | Alt: bewusst verworfen |

### Erläuterungen

**`MENSA-F-060`** — `canteen_overview_viewmodel.dart:60-66` enthält einen `try`-Block mit leerem `finally` ohne `catch`; ein Fehler beim Laden des Speiseplans verschwindet dadurch kommentarlos (dokumentiert in `platform/security-and-privacy.md` SEC-F-060). Für die Neuentwicklung ist sichtbare Fehlerbehandlung verbindlich.

**`MENSA-F-070`** — Der Altaufruf erfolgt unverschlüsselt über `http://fb4app.hemacode.de/...` (`meals_repository.dart:21`, dokumentiert als INT-004 in `platform/integrations.md`, Risiko „hoch"). Für die Neuentwicklung ist TLS ausnahmslos verbindlich (siehe auch `platform/security-and-privacy.md` SEC-N-030).

## 5. Datenmodell

Gericht: `type`, `title`, `priceStudent`, `priceEmployee`, `priceGuests`, `supplies` — Felder wie in INT-004 (`platform/integrations.md`) dokumentiert. Mensaauswahl der Nutzerin: lokal persistiert, siehe `platform/data-and-storage.md`.

## 6. Externe Schnittstellen

Nutzt INT-004 (Mensa-Speisepläne) über das eigene Backend INT-008 (siehe `platform/architecture.md` ARCH-F-050). Keine Endpunktdetails hier — siehe `platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des Abrufs |
| Leer (keine Mensa gewählt) | Hinweis auf die Mensaauswahl als nächsten Schritt |
| Leer (Mensa geschlossen/kein Angebot) | Hinweis „heute kein Angebot", keine Fehlermeldung |
| Fehler | Fehlermeldung mit Wiederholen-Option (MENSA-F-060) |
| Offline | Zuletzt geladener Speiseplan mit Alters-Hinweis |

## 8. Offline-Verhalten

Speisepläne gelten laut `platform/data-and-storage.md` Abschnitt 4 bis Tagesende als aktuell genug und werden bei fehlendem Netzzugriff aus dem Zwischenspeicher angezeigt (siehe auch `platform/architecture.md` ARCH-F-100).

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Gewählte Mensa liefert an einem Tag keine Daten | Leerzustand „heute kein Angebot", kein Fehlerzustand |
| INT-004 liefert unerwartetes Antwortformat | Fehler protokollieren, Fehlermeldung mit Wiederholen-Option anzeigen (siehe `platform/quality-and-testing.md` QA-N-070) |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Für eine gewählte Mensa mit bekanntem Tagesangebot werden alle Gerichte mit vollständigen Preisangaben angezeigt.
- Ein simulierter Ladefehler führt zu einer sichtbaren Fehlermeldung, nicht zu einer stillen leeren Ansicht.

## 12. Bewusst nicht übernommenes Altverhalten

- Stillschweigend verschluckter Ladefehler (leeres `finally` ohne `catch`) — Grund: verdeckt Fehlerzustände, siehe MENSA-F-060.
- Unverschlüsselter Abruf über `http://` — Grund: überträgt Standort-/Mensawahl im Klartext, siehe MENSA-F-070.

## 13. Offene Fragen

- Datenquelle für Mensa-Öffnungszeiten (falls dieser Umfang später ergänzt wird): keine bestätigte Quelle identifiziert. Klärung durch FSR FB4.
