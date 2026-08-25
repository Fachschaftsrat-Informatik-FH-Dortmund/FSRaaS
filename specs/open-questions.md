---
status: draft
version: 0.3.0
owner: FSR FB4
last_reviewed: 2026-08-25
---

# Projektweite offene Fragen

Fragen ohne festen Platz in einer Einzel-Spec, weil sie mehrere Specs gleichzeitig betreffen oder deren Beantwortung den Zuschnitt einer künftigen Spec erst festlegt. Feature- oder themenlokale offene Fragen stehen stattdessen im Abschnitt „Offene Fragen" der jeweiligen Spec.

Aktuell keine unbeantworteten Einträge — siehe Archiv unten für den Verlauf. Neue Einträge werden hier ergänzt, sobald sie auftreten.

## Beantwortete Fragen (Archiv)

Frühere Einträge dieser Tabelle, deren Klärung inzwischen erfolgt ist. Die Entscheidung ist in der jeweils zuständigen Spec dokumentiert; hier nur als Nachweis, dass die Frage gestellt und beantwortet wurde.

| Frage | Antwort | Dokumentiert in |
|---|---|---|
| Wer betreibt das eigene Backend (INT-008) und trägt die Betriebsverantwortung (Hosting, Kosten, Verfügbarkeit)? | FSR FB4 betreibt selbst, auf einem eigenen Hetzner-VPS. | `backend-and-api.md` Abschnitt 6, `platform/integrations.md` INT-008, Entscheidung FSR FB4, 2026-08-25 |
| Redaktionsweg für Events und FSR-News: eigene Verwaltungsoberfläche im Backend oder Wiederverwendung bestehender Werkzeuge? | Events über ICS-Kalender (extern gepflegt, vom Backend importiert). News differenziert nach Klassifizierung: FB-Aktuelles wird aus der Fachbereichsseite `aktuelles-ni` importiert, FSR-News weiterhin über eine eigene Redaktionsoberfläche im Backend, Event-Erinnerungen automatisch aus EVENT abgeleitet. | `backend-and-api.md` Abschnitt 7, `features/events/spec.md`, `features/news/spec.md`, Entscheidung FSR FB4, 2026-08-25 |
| Wird die Fachbereichs-Nachrichtenseite `aktuelles-ni` als zusätzliche Quelle in NEWS integriert? | Ja, als eigene Klassifizierung „FB-Aktuelles" (INT-010). | `features/news/spec.md`, `platform/integrations.md` INT-010, Entscheidung FSR FB4, 2026-08-25 |
| Verhältnis der beiden gefundenen Android-Play-Store-Einträge (`de.fsrfb4.fb4` vs. `fh.dortmund.imslFB4`) zueinander? | Für den Rollout unerheblich, zurückgestellt. Beide Store-Einträge werden beim Launch unabhängig vom genauen Verhältnis als abgelöst gekennzeichnet. | `product/legacy-inventory.md` Abschnitt 4, Entscheidung FSR FB4, 2026-08-25 |
| Einordnung von „SmartAssign" (laut Android-Store-Beschreibung von der Alt-App verlinkt): eigenständiges Hochschulsystem mit `INT-###`-Eintrag oder verzichtbarer Alt-Link? | Nur als externer Link, wie die übrigen Einträge der Links/Downloads-Liste (L-073) und wie ILIAS/Discord u. a. in `vision.md` §5 — kein eigener `INT-###`-Eintrag. Formale `SET-F-###`-Anforderung für die Links/Downloads-Liste noch ausstehend, unabhängig von dieser Entscheidung. | `product/legacy-inventory.md` Abschnitt 4, Entscheidung FSR FB4, 2026-08-25 |
| Wird „E-Key" ein eigenständiges Feature mit eigenem Präfix, oder Inhalt innerhalb von WIKI bzw. SET? | Eigenständiges Feature (Präfix EKEY): Konto-Verknüpfung, Status/Berechtigungen, Verloren-Meldung, semesterweise Bestätigung. Terminvereinbarung zur Ausgabe bleibt externer Verweis auf FSR-Webseite/Wiki. Hinweis auf die Möglichkeit erscheint zusätzlich in RAUM. | `features/e-key/spec.md`, `specs/README.md` §4/§10, Entscheidung FSR FB4, 2026-08-25 |
| Konkreter ICS-Kalenderdienst für die Redaktion von Events (INT-011)? | Google Calendar, mit vorgemerkter Option auf spätere Ablösung durch ein selbstgehostetes Produkt. | `platform/integrations.md` INT-011, Entscheidung FSR FB4, 2026-08-25 |
