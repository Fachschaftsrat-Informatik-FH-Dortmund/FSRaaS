## Purpose

Bündelt gerätebezogene Voreinstellungen, Datenschutz-Einwilligung, Erscheinungsbild und rechtliche Angaben an einem Ort und übernimmt die acht fachlichen Einstellungsschlüssel der Alt-App. Vormals `specs/features/settings/spec.md` (Präfix `SET`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Push-Benachrichtigungen für News ein-/ausschalten

Das System muss der Nutzerin das Ein- und Ausschalten von Push-Benachrichtigungen für News ermöglichen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (`notificationOnNews`) (vormals SET-F-010).

#### Scenario: Push für News ausschalten
- **WHEN** die Nutzerin Push-Benachrichtigungen für News ausschaltet
- **THEN** löst das System bei neuen Meldungen keine Push-Benachrichtigung mehr aus

### Requirement: Wahl des Erscheinungsbilds

Das System muss der Nutzerin die Wahl zwischen hellem, dunklem und systemabhängigem Erscheinungsbild ermöglichen. Herkunft: NEU (vormals SET-F-020). Umgesetzt in Roadmap-Schritt 2 (Schlüssel `appearanceMode`).

#### Scenario: Systemabhängiges Erscheinungsbild
- **WHEN** die Nutzerin „systemabhängig" wählt und das Gerät zwischen hell und dunkel wechselt
- **THEN** folgt das Erscheinungsbild der App der Systemeinstellung, siehe Capability `ux-and-theming` (UX-F-030/UX-F-020)

### Requirement: Auswahl der angezeigten Mensen

Das System muss der Nutzerin die Auswahl der angezeigten Mensen ermöglichen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (`settingsEnabledCanteenIds`) (vormals SET-F-030). Umgesetzt in Roadmap-Schritt 4, fachlich verortet in Capability `canteen` (MENSA-F-020/F-025), auch aus dem Leerzustand des Mensaplans erreichbar.

#### Scenario: Mensa abwählen
- **WHEN** die Nutzerin eine Mensa aus der Auswahl entfernt
- **THEN** erscheint diese Mensa nicht mehr im Mensaplan

### Requirement: Sprung zum aktuellen Wochentag im Stundenplan

Das System muss der Nutzerin die Einstellung „beim Öffnen des Stundenplans zum aktuellen Wochentag springen" ermöglichen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (`goToCurrentDayInSchedule`) (vormals SET-F-040).

#### Scenario: Einstellung aktiviert
- **WHEN** die Einstellung aktiviert ist und der Stundenplan geöffnet wird
- **THEN** springt das System direkt zum aktuellen Wochentag

### Requirement: Erhöhte Bildschirmhelligkeit in der Ticketansicht

Das System muss der Nutzerin die Einstellung „Bildschirmhelligkeit in der Ticketansicht erhöhen" ermöglichen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (`increaseDisplayBrightnessInTicketView`) (vormals SET-F-050). Wirkt über Capability `semester-ticket`.

#### Scenario: Einstellung deaktiviert
- **WHEN** die Einstellung deaktiviert ist und die Ticketansicht geöffnet wird
- **THEN** erhöht das System die Bildschirmhelligkeit nicht

### Requirement: Datenschutzerklärung und Einwilligungsstatus anzeigen

Das System muss die aktuelle Datenschutzerklärung sowie den Zeitpunkt und die Version der zuletzt erteilten Einwilligung anzeigen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/privacy_page.dart (vormals SET-F-060).

#### Scenario: Einwilligungsstatus einsehen
- **WHEN** die Nutzerin den Datenschutzbereich der Einstellungen öffnet
- **THEN** zeigt das System Zeitpunkt und Version der zuletzt erteilten Einwilligung an

### Requirement: Alle lokalen Daten löschen

Das System muss eine Aktion „Alle lokalen Daten löschen" mit vorheriger Bestätigung bereitstellen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart:37 (vormals SET-F-070).

#### Scenario: Löschung mit Bestätigung
- **WHEN** die Nutzerin „Alle lokalen Daten löschen" auslöst und bestätigt
- **THEN** entfernt das System alle in Capability `data-and-storage` Abschnitt 2 gelisteten lokalen Datenklassen

### Requirement: Übersicht der verwendeten Open-Source-Bibliotheken

Das System muss eine Übersicht der verwendeten Open-Source-Bibliotheken mit Lizenzhinweisen bereitstellen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/licenses_page.dart (vormals SET-F-080).

#### Scenario: Lizenzübersicht öffnen
- **WHEN** die Nutzerin die Lizenzübersicht öffnet
- **THEN** listet das System die verwendeten Open-Source-Bibliotheken mit ihren Lizenzhinweisen

### Requirement: Einstiegspunkt zur Kontolöschung

Das System muss einen Einstiegspunkt zur Löschung des eigenen Kontos und aller serverseitig gespeicherten personenbezogenen Daten bereitstellen. Herkunft: NEU (vormals SET-F-090). Der Ablauf selbst ist Sache von Capability `identity-and-moderation` (IDENT-F-130).

#### Scenario: Kontolöschung anstoßen
- **WHEN** die Nutzerin den Einstiegspunkt zur Kontolöschung auslöst
- **THEN** stößt das System den entsprechenden Vorgang über das eigene Backend an

### Requirement: Wahl der Oberflächensprache

Das System muss der Nutzerin die Wahl der Oberflächensprache zwischen Deutsch und Englisch ermöglichen. Herkunft: NEU (vormals SET-F-100). Löst die bis 2026-08-25 offene Frage, wo die in Capability `non-functional` (NFR-F-115) geforderte Sprachwahl getroffen wird; umgesetzt in Roadmap-Schritt 2.

#### Scenario: Sprache ohne Neustart wechseln
- **WHEN** die Nutzerin die Oberflächensprache wechselt
- **THEN** wirkt sich die Wahl ohne Neustart der App aus

### Requirement: Systemsprache als Voreinstellung

Solange die Nutzerin keine Sprache gewählt hat, muss das System die Sprache der Systemeinstellung verwenden. Herkunft: NEU (vormals SET-F-110). Übernimmt das Verhalten der Android-Alt-App (Systemressourcen `res/values`/`res/values-de`) als Voreinstellung, ergänzt um die ausdrückliche Wahl in „Wahl der Oberflächensprache".

#### Scenario: Keine Sprache gewählt
- **WHEN** die Nutzerin noch keine Sprache ausgewählt hat
- **THEN** verwendet das System die Sprache der Systemeinstellung des Geräts

### Requirement: Ferngepflegte Liste externer Links und Downloads

Das System muss eine Liste externer Links und Downloads anzeigen, die serverseitig gepflegt wird. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/links_downloads_page.dart (vormals SET-F-120). Die Flutter-Alt-App hinterlegt zehn Links fest im Quellcode (L-073); die ferngepflegte Variante der Android-Alt-App wird übernommen, damit ein geänderter Link kein App-Update erfordert. Pflege über Capability `admin`, Auslieferung über API-F-230 in Capability `backend-and-api`.

#### Scenario: Geänderter Link ohne App-Update
- **WHEN** der FSR einen Link in der Verwaltungsoberfläche ändert
- **THEN** zeigt die App den geänderten Link, ohne dass ein App-Update nötig ist

### Requirement: Version und Build-Nummer aus dem Build

Das System muss die Anzeigeversion und die Build-Nummer der laufenden App anzeigen, aus dem Build gelesen. Herkunft: Alt: bewusst verworfen (vormals SET-F-130). Die Flutter-Alt-App zeigt eine fest einprogrammierte Versionsnummer (`more_list_page.dart:157`, M-006), die von der installierten Version abweichen kann; Capability `non-functional` (NFR-N-230) verlangt eindeutige Zuordenbarkeit eines Fehlerberichts zu einer Quellcode-Version.

#### Scenario: Angezeigte Version stimmt mit Build überein
- **WHEN** die Angaben zur App geöffnet werden
- **THEN** stimmt die angezeigte Version mit der installierten Build-Nummer überein

### Requirement: Rückmeldeweg an den FSR

Das System muss einen Rückmeldeweg an den FSR bereitstellen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/more_list_page.dart:47 (vormals SET-F-140).

#### Scenario: Rückmeldung absenden
- **WHEN** die Nutzerin den Rückmeldeweg öffnet
- **THEN** bietet das System einen Weg an, eine Rückmeldung an den FSR zu senden

### Requirement: Reihenfolge der angezeigten Mensen festlegen

Das System muss der Nutzerin das Festlegen der Reihenfolge der angezeigten Mensen ermöglichen (siehe Capability `canteen`, MENSA-F-025). Herkunft: Recherche: alte apps/android-fb4, activities/MenuSortActivity.java, 2026-08-25 (vormals SET-F-150). Umgesetzt in Roadmap-Schritt 4.

#### Scenario: Mensen umsortieren
- **WHEN** die Nutzerin die Reihenfolge der angezeigten Mensen ändert
- **THEN** übernimmt der Mensaplan die neue Reihenfolge

### Requirement: Wahl der Startansicht

Das System muss der Nutzerin die Wahl der Startansicht ermöglichen: einer der vier Tab-Bereiche oder „zuletzt genutzt". Herkunft: NEU (vormals SET-F-160). Umgesetzt in Roadmap-Schritt 2, Voreinstellung ist der Stundenplan (Capability `app-shell`, SHELL-F-070).

#### Scenario: Startansicht „zuletzt genutzt"
- **WHEN** die Startansicht auf „zuletzt genutzt" gesetzt ist
- **THEN** startet die App im zuletzt aktiven Tab

### Requirement: Benachrichtigung über verfügbare Lieblingsgerichte ein-/ausschalten

Das System muss der Nutzerin das Ein- und Ausschalten der Benachrichtigung über verfügbare Lieblingsgerichte ermöglichen (siehe Capability `canteen`, MENSA-F-105). Herkunft: NEU (vormals SET-F-170). Aufgenommen am 2026-09-04, seit die Lieblingseigenschaft aus der eigenen Höchstbewertung folgt (MENSA-F-085) statt aus einem eigenen Merker; der Schalter ist von der Systemberechtigung für Benachrichtigungen unabhängig. Voreinstellung: eingeschaltet.

#### Scenario: Schalter ausgeschaltet
- **WHEN** die Benachrichtigung über Lieblingsgerichte ausgeschaltet ist
- **THEN** löst das System auch bei verfügbarem Lieblingsgericht keine Benachrichtigung aus

### Requirement: Wahl der eigenen Preisgruppe

Das System muss der Nutzerin die Wahl der eigenen Preisgruppe (Studierende, Mitarbeitende, Gäste) ermöglichen. Herkunft: NEU (vormals SET-F-180). Aufgenommen am 2026-09-04, umgesetzt mit Abschluss von Roadmap-Schritt 4; wirkt über Capability `canteen` (MENSA-F-220) auf die Hauptansicht.

#### Scenario: Preisgruppe wechseln
- **WHEN** die Nutzerin die Preisgruppe auf „Mitarbeitende" ändert
- **THEN** zeigt der Mensaplan fortan den Preis für Mitarbeitende

### Requirement: Studierende als Voreinstellung der Preisgruppe

Solange die Nutzerin keine Preisgruppe gewählt hat, muss das System Studierende als Preisgruppe verwenden. Herkunft: NEU (vormals SET-F-190). Studierende sind die Zielgruppe der App (`specs/product/vision.md`).

#### Scenario: Keine Preisgruppe gewählt
- **WHEN** die Nutzerin noch keine Preisgruppe gewählt hat
- **THEN** verwendet das System „Studierende" als Preisgruppe

## Erläuterungen

**Umsetzungsstand (Roadmap-Schritt 2, ergänzt Schritt 4).** Umgesetzt sind „Wahl des Erscheinungsbilds", „Wahl der Oberflächensprache"/„Systemsprache als Voreinstellung" und „Wahl der Startansicht" aus Schritt 2 sowie „Auswahl der angezeigten Mensen" und „Reihenfolge der angezeigten Mensen festlegen" aus Schritt 4; alle wirken sofort, ohne separaten Speichern-Schritt. Die übrigen Requirements folgen mit ihren jeweiligen Funktionen (Stundenplan-Schalter mit Schritt 5, Ticket-Helligkeit mit Schritt 8, Push mit der zweiten Ausbaustufe, Links/Downloads mit Schritt 7, Datenschutz-/Lösch-/Lizenz-/Rückmelde-Ansichten mit Schritt 10 bzw. den betroffenen Features). „Benachrichtigung über verfügbare Lieblingsgerichte ein-/ausschalten" folgt gemeinsam mit den Bewertungen in Roadmap-Schritt 9. „Wahl der eigenen Preisgruppe"/„Studierende als Voreinstellung der Preisgruppe" wurden mit dem Abschluss von Roadmap-Schritt 4 am 2026-09-04 umgesetzt (Segmentregler im Einstellungsbildschirm, Schlüssel `priceGroup`).

`implemented_in` (Konvention, kein von OpenSpec erzwungenes Feld): `app/src/theme` (Erscheinungsbild, Schlüssel `appearanceMode`), `app/src/i18n` (Sprachwahl, Schlüssel `uiLanguage`), `app/src/navigation` (Startansicht-Wahl, Schlüssel `startView`), `app/src/areas/settings` (Einstellungsbildschirm: Erscheinungsbild, Sprache, Startansicht, Preisgruppe, Mensen-Auswahl-Einstieg), `app/src/areas/canteen` (Auswahl/Reihenfolge der Mensen, Preisgruppen-Speicher `priceGroup`).

## Datenmodell

Einstellungsschlüssel: siehe Capability `data-and-storage` Abschnitt 3, ergänzt um Schlüssel aus der Neuentwicklung:

| Schlüssel | Werte | Bedeutung |
|---|---|---|
| `appearanceMode` | `system` \| `light` \| `dark` | Erscheinungsbild-Wahl, siehe Capability `ux-and-theming` (UX-F-030); `system` folgt der Systemeinstellung zur Laufzeit (UX-F-020) |
| `uiLanguage` | `system` \| `de` \| `en` | Oberflächensprache; `system` folgt der Systemsprache |
| `startView` | `schedule` \| `canteen` \| `news` \| `rooms` \| `last` | Startansicht beim regulären Start, siehe Capability `app-shell` (SHELL-F-070) |
| `favoriteDishNotification` | `an` \| `aus` | Benachrichtigung über verfügbare Lieblingsgerichte, wirksam über Capability `canteen` (MENSA-F-105); Voreinstellung `an` |
| `priceGroup` | `student` \| `staff` \| `guest` | Eigene Preisgruppe im Mensaplan, wirksam über Capability `canteen` (MENSA-F-220); Voreinstellung `student` |
| `lastTab` | `schedule` \| `canteen` \| `news` \| `rooms` \| `more` | Zuletzt aktiver Tab, nur ausgewertet wenn `startView` = `last` |

## Externe Schnittstellen

Nutzt INT-005 (Push-Benachrichtigungen) für das Opt-in. Die Kontolöschung löst serverseitig einen Vorgang gemäß Capability `identity-and-moderation` (IDENT-F-130) über das eigene Backend INT-008 aus. Keine Endpunktdetails hier — siehe Capability `integrations`.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Regulär | Liste der Einstellungen, sofortige Wirkung ohne separaten Speichern-Schritt |
| Löschbestätigung | Bestätigungsdialog vor „Alle lokalen Daten löschen" bzw. Kontolöschung (siehe Capability `ux-and-theming`, UX-F-120) |

## Offline-Verhalten

Alle lokalen Einstellungen sind offline änderbar. Die Kontolöschung erfordert Netzzugriff; ohne Verbindung wird die Anfrage in die Offline-Warteschlange eingereiht (analog Capability `data-and-storage` Abschnitt 5).

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Push-Aktivierung ohne erteilte Systemberechtigung für Benachrichtigungen | Hinweis auf fehlende Systemberechtigung mit Verweis auf die Systemeinstellungen |
| Kontolöschung schlägt serverseitig fehl | Fehlermeldung mit Wiederholen-Option, lokale Daten bleiben bis zum bestätigten Erfolg unverändert |

## Nicht-funktionale Anforderungen

Keine über Capability `non-functional` hinausgehenden Anforderungen.

## Bewusst nicht übernommenes Altverhalten

- Fest einprogrammierte Versionsangabe im Über-Dialog — Grund: kann von der installierten Version abweichen und macht Fehlerberichte unzuverlässig, siehe Requirement „Version und Build-Nummer aus dem Build".
- Fest im Quellcode hinterlegte Links-Liste — Grund: jede Änderung erforderte ein App-Update über drei Vertriebswege, siehe Requirement „Ferngepflegte Liste externer Links und Downloads".
- Wirkungsloses Datenschutz-Gate (Capability `security-and-privacy`, SEC-F-010) — hier nur als Einstiegspunkt betroffen, nicht als eigener Befund.

## Offene Fragen

- Ob die News-Benachrichtigungsregeln (Capability `news`, Positiv-/Sperrliste) aus den Einstellungen heraus bearbeitbar sind oder ob von hier nur ein Verweis in den News-Bereich führt — Arbeitsziel ist die Bearbeitung im News-Bereich mit Einstiegspunkt hier; die Regeln liegen fachlich und datenseitig bei Capability `news` und Capability `data-and-storage` (DATA-F-180).
- Technische Orchestrierung der Kontolöschung über mehrere Backend-Ressourcen hinweg (Bewertungen, E-Key, Push-Kennung) — das Ergebnis ist bereits generisch festgelegt (Capability `identity-and-moderation`, IDENT-F-130: alle personenbezogenen Daten der Person löschen, entkoppelte Bewertungsinhalte ausgenommen), offen ist nur die Umsetzung im Backend.
