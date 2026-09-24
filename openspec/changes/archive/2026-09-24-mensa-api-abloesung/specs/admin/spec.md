## MODIFIED Requirements

### Requirement: Pflege der Stammdaten-Listen

Das System muss der Rolle FSR-Redaktion das Anlegen, Ändern und Entfernen von Einträgen der Mensa-Liste, der Raumliste und der Links-/Downloads-Liste ermöglichen. Zu einer Mensa sind dabei Anzeigereihenfolge und Zugehörigkeit zur Standardauswahl zu pflegen; Öffnungszeiten, Anschrift, Beschreibung und Kartenverweis sind es nicht — sie stammen aus der Mensa-Schnittstelle und dürfen in der Verwaltung nicht als pflegbare Felder erscheinen. Herkunft: NEU (vormals ADMIN-F-180), Öffnungszeiten und die aus der Schnittstelle stammenden Standortangaben am 2026-09-22 aus dem Pflegeumfang genommen. Das abgelöste Backend `app.fsrfb4.de` pflegte diese Daten über ein Formular ohne Übersicht, Validierung oder Historie und veraltete dadurch (siehe Capability `integrations`, INT-008, „Lese-/Schreibtrennung bei `/data`"). Gespeichert wird je Liste als Ganzes (vollständige Ersetzung), abgesichert gegen gleichzeitige Bearbeitung durch dieselbe optimistische Nebenläufigkeitskontrolle wie bei Meldungsentwürfen (`If-Match`, siehe Abschnitt „Fehlerfälle"). Strukturell fehlerhafte Eingaben (leere oder doppelte Kennungen) werden als `400` abgewiesen, nicht erst beim Speichern.

#### Scenario: Raum-Eintrag entfernen
- **WHEN** eine Redaktionsperson einen Eintrag aus der Raumliste entfernt
- **THEN** speichert das System die Raumliste ohne diesen Eintrag als neue Gesamtfassung

#### Scenario: Mensa-Eintrag bearbeiten
- **WHEN** eine Redaktionsperson einen Eintrag der Mensa-Liste bearbeitet
- **THEN** bietet das System Anzeigereihenfolge und Standardauswahl zur Bearbeitung an, aber keine Öffnungszeiten, Anschrift, Beschreibung oder Kartenverweise

