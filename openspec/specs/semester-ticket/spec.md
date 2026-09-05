## Purpose

Ermöglicht Studierenden den schnellen Zugriff auf ihr Semesterticket (NRW-Ticket) als Bilddatei, ohne bei jeder Fahrscheinkontrolle eine externe App oder PDF-Ablage öffnen zu müssen. Vormals `specs/features/semester-ticket/spec.md` (Präfix `TICKET`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Import eines Semesterticket-Bilds

Das System muss der Nutzerin den Import eines Semesterticket-Bilds aus einer PDF- oder Bilddatei ermöglichen. Herkunft: Alt: lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:59 (vormals TICKET-F-010).

#### Scenario: Import aus PDF
- **WHEN** die Nutzerin eine PDF-Datei mit ihrem Semesterticket importiert
- **THEN** übernimmt das System das Ticket-Bild aus der Datei

### Requirement: Lokale Speicherung des importierten Tickets

Das System muss das importierte Ticket lokal auf dem Gerät speichern. Herkunft: Alt: lib/areas/ticket/viewmodels/ticket_overview_viewmodel.dart:82 (vormals TICKET-F-020).

#### Scenario: Ticket nach Neustart verfügbar
- **WHEN** die App nach einem Import neu gestartet wird
- **THEN** ist das Ticket weiterhin lokal verfügbar

### Requirement: Verschlüsselte Ablage des Tickets

Das System muss das gespeicherte Ticket verschlüsselt ablegen. Herkunft: Alt: bewusst verworfen (vormals TICKET-F-030). Die Alt-App legt das Ticket unverschlüsselt im Dokumentenverzeichnis ab (`ticket_overview_viewmodel.dart:82-89`, siehe Capability `security-and-privacy` und `data-and-storage`, DATA-F-040); für die Neuentwicklung ist verschlüsselte Ablage verbindlich, da das Ticket ein personenbezogener Fahrausweis ist.

#### Scenario: Ticket verschlüsselt gespeichert
- **WHEN** ein Ticket importiert wird
- **THEN** legt das System es verschlüsselt ab, nicht als unverschlüsselte Datei im Dateisystem

### Requirement: Erhöhte Bildschirmhelligkeit bei der Anzeige

Das System muss beim Anzeigen des Tickets die Bildschirmhelligkeit erhöhen und beim Verlassen der Ansicht zurücksetzen. Herkunft: Alt: lib/areas/ticket/screens/ticket_viewer_page.dart (vormals TICKET-F-040).

#### Scenario: Helligkeit beim Verlassen zurückgesetzt
- **WHEN** die Nutzerin die Ticketansicht verlässt
- **THEN** setzt das System die Bildschirmhelligkeit zuverlässig auf den vorherigen Wert zurück

### Requirement: Löschen des hinterlegten Tickets

Das System muss der Nutzerin das Löschen des hinterlegten Tickets über einen sichtbaren Bedienweg mit vorheriger Bestätigung ermöglichen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart:62 (vormals TICKET-F-050).

#### Scenario: Löschen mit Bestätigung
- **WHEN** die Nutzerin das Löschen des Tickets auslöst
- **THEN** fragt das System vor dem Löschen eine Bestätigung ab

### Requirement: Betriebssystem-Schnellzugriff auf die Ticketansicht

Das System muss einen Betriebssystem-Schnellzugriff auf die Ticketansicht bereitstellen. Herkunft: Alt: lib/utils/plugins/quick_actions_manager.dart (vormals TICKET-F-060).

#### Scenario: Schnellzugriff öffnet Ticketansicht
- **WHEN** die Nutzerin den Betriebssystem-Schnellzugriff der App auslöst
- **THEN** öffnet das System direkt die Ticketansicht

### Requirement: Zoom- und verschiebbare Ticketanzeige

Das System muss das angezeigte Ticket zoom- und verschiebbar darstellen. Herkunft: Alt: lib/areas/ticket/screens/ticket_viewer_page.dart:77-104 (vormals TICKET-F-070).

#### Scenario: Ticket vergrößern
- **WHEN** die Nutzerin das angezeigte Ticket vergrößert
- **THEN** lässt das System Zoom und Verschieben des Bildausschnitts zu

### Requirement: Serverseitig gepflegter Bildausschnitt

Das System muss den für die Anzeige verwendeten Bildausschnitt aus einer serverseitig gepflegten Angabe beziehen, statt ihn fest im Quellcode zu hinterlegen. Herkunft: Recherche: alte apps/android-fb4, util/TicketUtil.java, 2026-08-25 (vormals TICKET-F-080). Die Android-Alt-App bezieht die Koordinaten als Fernkonfiguration vom Backend (Schlüssel `ticket_rect_coordinates`, siehe Capability `integrations`, INT-008/INT-017); dieses Muster wird übernommen, entspricht API-F-230 in Capability `backend-and-api`.

#### Scenario: Geänderter Bildausschnitt ohne App-Update
- **WHEN** der FSR die serverseitig gepflegte Ausschnitts-Angabe ändert
- **THEN** verwendet das System den neuen Ausschnitt, ohne dass ein App-Update nötig ist

### Requirement: Vollständige Anzeige bei unerwartetem Fahrausweis-Aufbau

Falls der importierte Fahrausweis nicht dem erwarteten Aufbau entspricht, muss das System ihn dennoch vollständig anzeigen, statt einen leeren oder falsch beschnittenen Ausschnitt zu zeigen. Herkunft: Alt: bewusst verworfen (vormals TICKET-F-090). Ergänzt das Requirement „Serverseitig gepflegter Bildausschnitt" um das Verhalten für den Fall, dass auch die gepflegte Angabe nicht passt — ein vollständig angezeigtes Dokument ist bei einer Fahrscheinkontrolle brauchbar, ein leerer Ausschnitt nicht.

#### Scenario: Unerwarteter Aufbau des importierten Dokuments
- **WHEN** der importierte Fahrausweis nicht dem erwarteten Aufbau entspricht
- **THEN** zeigt das System das vollständige Dokument an, statt eines leeren oder falsch beschnittenen Ausschnitts

## Erläuterungen

**Automatischer Ticket-Bezug — geprüft und zurückgestellt.** Die Android-Alt-App lädt das NRW-Ticket automatisch aus dem Hochschulportal (`activities/ticket/TicketDownloadActivity.java`, `worker/TicketDownloadWorker.java`), dokumentiert als INT-017 in Capability `integrations`. Das Verfahren ist für die Neuentwicklung ausgeschlossen, weil es Benutzername und Passwort des Hochschulkontos entgegennimmt, geräteseitig vorhält und wiederholt erneut sendet — untersagt durch Capability `security-and-privacy` (SEC-F-040) und Capability `backend-and-api` (API-F-110). Entscheidung FSR FB4, 2026-08-25: Zunächst wird mit der Authentik-Federation (INT-012) geprüft, ob sich das Ticket über einen offiziellen, tokenbasierten Weg beziehen lässt; bis dahin bleibt es beim manuellen Import.

## Datenmodell

Ticket-Bild: Binärdaten, Importzeitpunkt. Speicherregeln: Capability `data-and-storage` (DATA-F-030/040).

## Externe Schnittstellen

Keine — der Import erfolgt ausschließlich aus lokal auf dem Gerät verfügbaren Dateien, keine Anbindung an ein Ticketsystem.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Leer (kein Ticket hinterlegt) | Hinweis auf den Import als nächsten Schritt |
| Anzeige | Erhöhte Helligkeit |
| Import fehlgeschlagen (ungültiges Dateiformat) | Fehlermeldung mit Hinweis auf unterstützte Formate |

## Offline-Verhalten

Das Ticket ist laut Capability `architecture` (ARCH-F-100) vollständig offline verfügbar, da rein lokal gespeichert.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Importierte Datei ist kein unterstütztes Bild-/PDF-Format | Fehlermeldung, kein Ticket gespeichert |
| Gerätespeicher voll beim Import | Fehlermeldung, bestehendes Ticket bleibt unverändert erhalten |

## Nicht-funktionale Anforderungen

Keine über Capability `non-functional` hinausgehenden Anforderungen.

## Bewusst nicht übernommenes Altverhalten

- Unverschlüsselte Ablage des Ticket-Bilds im Dateisystem — Grund: personenbezogener Fahrausweis erfordert Verschlüsselung, siehe Requirement „Verschlüsselte Ablage des Tickets". Gilt für beide Alt-Apps; die Android-Alt-App legt das PDF zusätzlich im externen App-Verzeichnis ab (N-003).
- Automatischer Ticket-Bezug über Formular-Login am Hochschulportal — Grund: erfordert dauerhaftes Vorhalten und wiederholtes Senden des Hochschulpassworts, siehe INT-017 und Capability `security-and-privacy` (SEC-F-040).
- Fest im Quellcode hinterlegter Bildausschnitt — Grund: bricht bei jeder Layoutänderung des Ausstellers, siehe Requirement „Serverseitig gepflegter Bildausschnitt".
- Push-Benachrichtigung „neues Ticket verfügbar" (Android-Alt-App, Thema `Ticket`, AND-029) — Grund: unmittelbare Folge des ausgeschlossenen automatischen Bezugs (INT-017); ohne serverseitige Portalabfrage kann das Backend das Erscheinen eines neuen Tickets nicht erkennen.

## Offene Fragen

- Ob die Authentik-Federation einen tokenbasierten Weg zum selben Dokument eröffnet, ist offen — zu prüfen, sobald die Federation steht.
- Die WhatsApp-Recherche (`specs/product/whatsapp-feedback-inventory.md`) bestätigt akuten Bedarf an einem automatisierten Download: Studis berichten von Fehlern beim Laden des digitalen Tickets und nennen die Dritt-App „Yourwallet" als funktionierende Alternative. Vor jeder funktionalen Anforderung zu automatisiertem Ticket-Download muss zuerst der Endpunkt/die Datenquelle geklärt werden (Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25). Priorisierung entschieden (FSR FB4, 2026-08-25): Spike wird priorisiert verfolgt.
- Ob eine leichtgewichtige, portalunabhängige Erinnerung zum Semesterwechsel sinnvoll ist (analog Capability `schedule`, SCHED-F-180: Hinweis „neues Semester begonnen, Ticket ggf. neu importieren" statt einer echten „neues Ticket verfügbar"-Erkennung wie bei AND-029) — vom FSR FB4 zu entscheiden, keine Anforderung mit festem Titel, solange nicht entschieden.
