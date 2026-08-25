---
id: semester-ticket
titel: Semesterticket
praefix: TICKET
status: draft
prioritaet: bestand
version: 0.2.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ticket/screens/ticket_viewer_page.dart
implemented_in: []
related:
  - ../../platform/data-and-storage.md
  - ../../platform/security-and-privacy.md
  - ../../platform/backend-and-api.md
  - ../../product/whatsapp-feedback-inventory.md
---

# Semesterticket

## 1. Zweck & Nutzen

Ermöglicht Studierenden den schnellen Zugriff auf ihr Semesterticket (NRW-Ticket) als Bilddatei, ohne bei jeder Fahrscheinkontrolle eine externe App oder PDF-Ablage öffnen zu müssen. Übernimmt die Kernfunktion der Flutter-Alt-App, behebt dabei den Befund unverschlüsselter Ablage.

## 2. Scope / Nicht-Scope

### Scope

- Import eines Semesterticket-Bilds (aus PDF oder Bilddatei).
- Anzeige mit erhöhter Bildschirmhelligkeit für Kontrollsituationen.
- Löschen des hinterlegten Tickets.

### Nicht-Scope

- Serverseitige Speicherung des Tickets — ausdrücklich ausgeschlossen, siehe `platform/backend-and-api.md` API-F-120.
- Digitale Ausstellung oder Validierung des Tickets — die App zeigt nur ein von der Nutzerin importiertes Bild, prüft es nicht.

## 3. Nutzergeschichten

- Als Studierende möchte ich mein Semesterticket einmalig importieren, damit ich es bei jeder Fahrt griffbereit habe.
- Als Studierende möchte ich das Ticket bei einer Kontrolle mit gut lesbarer, heller Anzeige vorzeigen können.
- Als Studierende möchte ich mein Ticket per Schnellzugriff öffnen, ohne durch die App zu navigieren.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| TICKET-F-010 | Das System muss der Nutzerin den Import eines Semesterticket-Bilds aus einer PDF- oder Bilddatei ermöglichen. | Alt: lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:59 |
| TICKET-F-020 | Das System muss das importierte Ticket lokal auf dem Gerät speichern. | Alt: lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82 |
| TICKET-F-030 | Das System muss das gespeicherte Ticket verschlüsselt ablegen. | Alt: bewusst verworfen |
| TICKET-F-040 | Das System muss beim Anzeigen des Tickets die Bildschirmhelligkeit erhöhen und beim Verlassen der Ansicht zurücksetzen. | Alt: lib/areas/ticket/screens/ticket_viewer_page.dart |
| TICKET-F-050 | Das System muss der Nutzerin das Löschen des hinterlegten Tickets über einen sichtbaren Bedienweg mit vorheriger Bestätigung ermöglichen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart:62 |
| TICKET-F-060 | Das System muss einen Betriebssystem-Schnellzugriff auf die Ticketansicht bereitstellen. | Alt: lib/utils/plugins/quick_actions_manager.dart |

### Erläuterungen

**`TICKET-F-030`** — Die Alt-App legt das Ticket unverschlüsselt im Dokumentenverzeichnis ab (`ticket_overview_viewmodel.dart:82-89`, dokumentiert in `platform/security-and-privacy.md` und `platform/data-and-storage.md` DATA-F-040). Für die Neuentwicklung ist verschlüsselte Ablage verbindlich, da das Ticket ein personenbezogener Fahrausweis ist.

## 5. Datenmodell

Ticket-Bild: Binärdaten, Importzeitpunkt. Speicherregeln: `platform/data-and-storage.md` (DATA-F-030/040).

## 6. Externe Schnittstellen

Keine — der Import erfolgt ausschließlich aus lokal auf dem Gerät verfügbaren Dateien, keine Anbindung an ein Ticketsystem.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Leer (kein Ticket hinterlegt) | Hinweis auf den Import als nächsten Schritt |
| Anzeige | Erhöhte Helligkeit, siehe TICKET-F-040 |
| Import fehlgeschlagen (ungültiges Dateiformat) | Fehlermeldung mit Hinweis auf unterstützte Formate |

## 8. Offline-Verhalten

Das Ticket ist laut `platform/architecture.md` (ARCH-F-100) vollständig offline verfügbar, da rein lokal gespeichert.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Importierte Datei ist kein unterstütztes Bild-/PDF-Format | Fehlermeldung, kein Ticket gespeichert |
| Gerätespeicher voll beim Import | Fehlermeldung, bestehendes Ticket bleibt unverändert erhalten |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Ein importiertes Ticket ist nach App-Neustart weiterhin verfügbar und verschlüsselt abgelegt.
- Die Bildschirmhelligkeit wird beim Verlassen der Ticketansicht zuverlässig zurückgesetzt.

## 12. Bewusst nicht übernommenes Altverhalten

- Unverschlüsselte Ablage des Ticket-Bilds im Dateisystem — Grund: personenbezogener Fahrausweis erfordert Verschlüsselung, siehe TICKET-F-030.

## 13. Offene Fragen

- Ob ein direkter NRW-Ticket-Download (laut Android-Alt-App-Beschreibung) statt manuellem PDF-Import unterstützt werden soll — Klärung durch FSR FB4, hängt von einer bestätigten Datenquelle ab (bislang nicht identifiziert).
- Die WhatsApp-Recherche (`product/whatsapp-feedback-inventory.md`) bestätigt akuten Bedarf an genau diesem automatisierten Download: Studis berichten von Fehlern beim Laden des digitalen Tickets und nennen die Dritt-App „Yourwallet" als funktionierende Alternative — ein möglicher Hinweis auf die zugrunde liegende Datenquelle. **Vor jeder funktionalen Anforderung zu automatisiertem Ticket-Download muss zuerst der Endpunkt/die Datenquelle geklärt werden** (Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25) — analog zum Vorgehen bei NOTEN/INT-006 empfiehlt sich ein eigener Spike, bevor Anforderungen mit fester ID formuliert werden. **Priorisierung entschieden (FSR FB4, 2026-08-25): Spike wird priorisiert verfolgt**, nicht auf unbestimmte Zeit zurückgestellt — Ergebnis bestimmt, ob und mit welcher Herkunftsmarkierung neue `TICKET-F-###`-Anforderungen für einen automatisierten Download entstehen.
