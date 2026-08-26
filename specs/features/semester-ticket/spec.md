---
id: semester-ticket
titel: Semesterticket
praefix: TICKET
status: accepted
prioritaet: bestand
version: 1.0.2
owner: FSR FB4
last_reviewed: 2026-08-26
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/TicketUtil.java
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/ticket/TicketViewActivity.java
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
| TICKET-F-070 | Das System muss das angezeigte Ticket zoom- und verschiebbar darstellen. | Alt: lib/areas/ticket/screens/ticket_viewer_page.dart:77-104 |
| TICKET-F-080 | Das System muss den für die Anzeige verwendeten Bildausschnitt aus einer serverseitig gepflegten Angabe beziehen, statt ihn fest im Quellcode zu hinterlegen. | Recherche: alte apps/android-fb4, util/TicketUtil.java, 2026-08-25 |
| TICKET-F-090 | Falls der importierte Fahrausweis nicht dem erwarteten Aufbau entspricht, muss das System ihn dennoch vollständig anzeigen, statt einen leeren oder falsch beschnittenen Ausschnitt zu zeigen. | Alt: bewusst verworfen |

### Erläuterungen

**`TICKET-F-080`/`TICKET-F-090` — Bildausschnitt.** Die Flutter-Alt-App schneidet den Fahrausweis mit fest im Quellcode stehenden Pixelwerten aus der ersten PDF-Seite (`ticket_overview_viewmodel.dart:66-73`, dokumentiert als M-010) und bricht damit bei jeder Layoutänderung des Ausstellers. Die Android-Alt-App löst dasselbe Problem besser: Die Koordinaten kommen als Fernkonfiguration vom Backend (Schlüssel `ticket_rect_coordinates`, siehe `platform/integrations.md` INT-008/INT-017 für den beobachteten Wert) und lassen sich ohne App-Update anpassen. Dieses Muster wird übernommen (TICKET-F-080, entspricht API-F-230). TICKET-F-090 ergänzt es um das Verhalten für den Fall, dass auch die gepflegte Angabe nicht passt — ein vollständig angezeigtes Dokument ist bei einer Fahrscheinkontrolle brauchbar, ein leerer Ausschnitt nicht.

**Automatischer Ticket-Bezug — geprüft und zurückgestellt.** Die Android-Alt-App lädt das NRW-Ticket automatisch aus dem Hochschulportal (`activities/ticket/TicketDownloadActivity.java`, `worker/TicketDownloadWorker.java`) und beantwortet damit die zuvor hier offene Frage nach der Datenquelle: Sie ist bekannt und dokumentiert als INT-017. Das Verfahren ist für die Neuentwicklung dennoch ausgeschlossen, weil es Benutzername und Passwort des Hochschulkontos entgegennimmt, geräteseitig vorhält und von einem Hintergrund-Worker wiederholt erneut sendet — genau das, was `platform/security-and-privacy.md` SEC-F-040 und `platform/backend-and-api.md` API-F-110 untersagen. Entscheidung FSR FB4, 2026-08-25: Zunächst wird mit der Authentik-Federation (INT-012) geprüft, ob sich das Ticket über einen offiziellen, tokenbasierten Weg beziehen lässt; bis dahin bleibt es beim manuellen Import (TICKET-F-010). Der Komfortverlust gegenüber dem Stand der Android-Alt-App ist bewusst in Kauf genommen.

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

- Unverschlüsselte Ablage des Ticket-Bilds im Dateisystem — Grund: personenbezogener Fahrausweis erfordert Verschlüsselung, siehe TICKET-F-030. Gilt für beide Alt-Apps; die Android-Alt-App legt das PDF zusätzlich im externen App-Verzeichnis ab (N-003).
- Automatischer Ticket-Bezug über Formular-Login am Hochschulportal — Grund: erfordert dauerhaftes Vorhalten und wiederholtes Senden des Hochschulpassworts, siehe INT-017 und SEC-F-040.
- Fest im Quellcode hinterlegter Bildausschnitt — Grund: bricht bei jeder Layoutänderung des Ausstellers, siehe TICKET-F-080.
- Push-Benachrichtigung „neues Ticket verfügbar" (Android-Alt-App, Thema `Ticket`, AND-029 in `product/legacy-inventory.md`) — Grund: unmittelbare Folge des ausgeschlossenen automatischen Bezugs (INT-017); ohne serverseitige Portalabfrage kann das Backend das Erscheinen eines neuen Tickets nicht erkennen. Siehe Offene Frage in Abschnitt 13 zu einer leichtgewichtigen Alternative.

## 13. Offene Fragen

- ~~Ob ein direkter NRW-Ticket-Download unterstützt werden soll — hängt von einer bestätigten Datenquelle ab.~~ Datenquelle am 2026-08-25 identifiziert und dokumentiert (INT-017); Nutzung des dortigen Verfahrens ausgeschlossen, siehe Erläuterung oben. Offen bleibt allein, ob die Authentik-Federation einen tokenbasierten Weg zum selben Dokument eröffnet — zu prüfen, sobald die Federation steht.
- Die WhatsApp-Recherche (`product/whatsapp-feedback-inventory.md`) bestätigt akuten Bedarf an genau diesem automatisierten Download: Studis berichten von Fehlern beim Laden des digitalen Tickets und nennen die Dritt-App „Yourwallet" als funktionierende Alternative — ein möglicher Hinweis auf die zugrunde liegende Datenquelle. **Vor jeder funktionalen Anforderung zu automatisiertem Ticket-Download muss zuerst der Endpunkt/die Datenquelle geklärt werden** (Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25) — analog zum Vorgehen bei NOTEN/INT-006 empfiehlt sich ein eigener Spike, bevor Anforderungen mit fester ID formuliert werden. **Priorisierung entschieden (FSR FB4, 2026-08-25): Spike wird priorisiert verfolgt**, nicht auf unbestimmte Zeit zurückgestellt — Ergebnis bestimmt, ob und mit welcher Herkunftsmarkierung neue `TICKET-F-###`-Anforderungen für einen automatisierten Download entstehen.
- Ob eine leichtgewichtige, portalunabhängige Erinnerung zum Semesterwechsel sinnvoll ist (analog SCHED-F-180: Hinweis „neues Semester begonnen, Ticket ggf. neu importieren" statt einer echten „neues Ticket verfügbar"-Erkennung wie bei AND-029) — vom FSR FB4 zu entscheiden, keine Anforderung mit fester ID, solange nicht entschieden.
