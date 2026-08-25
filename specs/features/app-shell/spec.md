---
id: app-shell
titel: App-Rahmen & Navigation
praefix: SHELL
status: draft
prioritaet: bestand
version: 0.2.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/main.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/main_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/quick_actions_manager.dart
implemented_in: []
related:
  - ../../platform/architecture.md
  - ../../platform/ux-and-theming.md
  - ../../platform/non-functional.md
  - ../../product/vision.md
---

# App-Rahmen & Navigation

## 1. Zweck & Nutzen

Bietet die übergeordnete Navigationsstruktur, über die alle Features erreichbar sind. Löst die Randbedingung aus `platform/architecture.md` Abschnitt 3: Die Alt-App zeigte fünf gleichrangige Tabs, die neue App muss deutlich mehr Bereiche (elf Feature-Specs, davon sieben mit eigenem Kernfeature-Einstiegspunkt gemäß ARCH-F-090) aufnehmen, ohne sie alle gleichrangig in einer Tab-Leiste zu häufen.

## 2. Scope / Nicht-Scope

### Scope

- Navigationsstruktur (Tab-Leiste, ggf. zusätzliches Menü/Drawer für nachrangige Bereiche).
- App-Start, Erststart-Erkennung, Zustimmung zur Datenschutzerklärung als Einstiegspunkt.
- Betriebssystem-Schnellzugriffe (Quick Actions).

### Nicht-Scope

- Inhalt der einzelnen Features — jeweils eigene Feature-Spec.
- Theming/Barrierefreiheit im Detail — `platform/ux-and-theming.md`.

## 3. Nutzergeschichten

- Als Studierende möchte ich jedes Kernfeature in höchstens zwei Interaktionsschritten von der Startseite aus erreichen.
- Als neue Nutzerin möchte ich beim ersten Start verständlich zur Datenschutzerklärung geführt werden, bevor ich Funktionen mit personenbezogenen Daten nutze.
- Als Studierende möchte ich per Betriebssystem-Schnellzugriff direkt zu einer häufig genutzten Ansicht springen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SHELL-F-010 | Das System muss eine Navigationsstruktur aus einer Tab-Leiste mit den meistgenutzten Kernbereichen sowie einem zusätzlichen Sammel-Einstieg („Mehr") für alle übrigen Bereiche bereitstellen, statt alle Bereiche als gleichrangige Einträge einer einzigen Tab-Leiste zu häufen. | Alt: bewusst verworfen |
| SHELL-F-020 | Das System muss jedes Kernfeature von der Startseite aus in höchstens zwei Interaktionsschritten erreichbar machen. | NEU |
| SHELL-F-030 | Wenn die App zum ersten Mal gestartet wird, muss das System vor der Nutzung von Funktionen mit personenbezogenen Daten eine Zustimmung zur Datenschutzerklärung einholen. | Alt: bewusst verworfen |
| SHELL-F-040 | Das System muss Betriebssystem-Schnellzugriffe auf mindestens die Ansichten Stundenplan und Semesterticket bereitstellen. | Alt: lib/utils/plugins/quick_actions_manager.dart |

### Erläuterungen

**`SHELL-F-010`** — Entscheidung FSR FB4, 2026-08-25: Muster „Tab-Leiste + Mehr-Sammelpunkt" statt Drawer/Seitenmenü oder Hybrid — die FSR-Vorgabe war, keine 1:1-Kopie der alten fünf gleichrangigen Tabs, sondern eine UI-technisch sinnvolle Struktur zu wählen. Bei inzwischen elf Feature-Specs ist eine flache Tab-Leiste nicht mehr tragfähig (siehe `platform/architecture.md` ARCH-N-010); „Tab-Leiste + Mehr" ist das etablierte Muster für genau diesen Fall, hält die täglich genutzten Bereiche (voraussichtlich Stundenplan, Mensaplan, News) einen Klick entfernt und erreicht seltener genutzte Bereiche über einen zusätzlichen Schritt — konform mit SHELL-F-020 (höchstens zwei Interaktionsschritte für Kernfeatures). Konkrete Zuordnung, welche Bereiche in die Tab-Leiste selbst kommen, ist Teil der Bildschirmgestaltung (siehe Abschnitt 13). Die Liste der sieben Kernfeatures übernimmt `platform/architecture.md` ARCH-F-090 unverändert. Zur bewussten Auslassung von Mensa-Bewertungen (RATE) als eigenem Navigationsziel siehe die Anmerkung dort.

**`SHELL-F-030`** — Die Alt-App ermittelt `shouldShowPrivacyPolicy` korrekt aus Einstellung und Versionsvergleich, überschreibt das Ergebnis aber unmittelbar danach fest auf `false` (`main_view_model.dart:8-22`, dokumentiert in `platform/security-and-privacy.md` SEC-F-010). Das Zustimmungs-Gate der Alt-App ist damit wirkungslos; für die Neuentwicklung ist ein tatsächlich wirksames Gate verbindlich.

## 5. Datenmodell

Kein eigenes Datenmodell über die Einstellungsschlüssel aus `platform/data-and-storage.md` hinaus (`privacyPolicyAccepted`, `privacyPolicyAcceptedVersion`).

## 6. Externe Schnittstellen

Keine.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Erststart | Zustimmungs-Dialog vor Zugriff auf Funktionen mit personenbezogenen Daten (SHELL-F-030) |
| Regulärer Start | Direkter Einstieg in die zuletzt genutzte oder konfigurierte Startansicht |
| Datenschutzerklärung geändert | Erneute Zustimmung eingefordert, siehe `platform/security-and-privacy.md` SEC-F-020 |

## 8. Offline-Verhalten

Die Navigationsstruktur selbst ist unabhängig vom Netzzugriff nutzbar; einzelne Ziele können laut ihrer jeweiligen Feature-Spec offline eingeschränkt sein (z. B. Raumsuche, siehe `platform/architecture.md` ARCH-F-110).

## 9. Fehlerfälle

Keine über die Fehlerzustände der einzelnen Features hinausgehenden Fälle.

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SHELL-N-010 | Die Startzeit bis zur ersten nutzbaren Ansicht muss die Zielwerte aus `platform/non-functional.md` (NFR-N-030) einhalten. | NEU |

## 11. Akzeptanzkriterien

- Jedes der sieben Kernfeatures ist von der Startseite aus in höchstens zwei Interaktionsschritten erreichbar (SHELL-F-020, löst ARCH-F-090 ein).
- Ohne erteilte Zustimmung sind Funktionen mit personenbezogenen Daten nicht nutzbar.

## 12. Bewusst nicht übernommenes Altverhalten

- Fünf gleichrangige Tabs als alleinige Navigationsstruktur — Grund: reicht für den erweiterten Funktionsumfang nicht aus, siehe `platform/architecture.md` ARCH-N-010.
- Wirkungsloses, fest auf `false` überschriebenes Datenschutz-Gate — Grund: verstößt gegen die Einwilligungspflicht, siehe SHELL-F-030.

## 13. Offene Fragen

- Konkrete Zuordnung der Bereiche zur Tab-Leiste vs. zum „Mehr"-Sammelpunkt (Navigationsmuster selbst ist entschieden, siehe SHELL-F-010) — Klärung durch FSR FB4 und UX im Zuge der Bildschirmgestaltung.
