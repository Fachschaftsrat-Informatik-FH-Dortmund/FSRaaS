## Why

Roadmap-Schritt 6 (Raumsuche) hat mit dem Change `raumplan-zwischenspeicher`
(PR #144) seinen tragenden Backend-Teil bekommen: einen stündlich gefüllten
Bestand der Raumplan-Termine aus INT-009 samt `/raeume/uebersicht` und
`/raumplan/termine`. In der App ist der Raum-Tab trotzdem bis heute ein
Platzhalter (`RoomFinderScreen` zeigt „Kommt bald"). Damit fehlt die Funktion,
mit der die Android-Alt-App 1.4.11 am deutlichsten punktet (AND-014 bis AND-016),
und die beiden neuen Sichten, die der Zwischenspeicher erst möglich macht.

## What Changes

Dieser Schnitt bringt den App-Teil von Schritt 6. Er bleibt durchgehend lesend
und kontofrei.

- **Drei Sichten im Raum-Tab mit Umschalter**: Freie-Raum-Suche,
  Raumübersicht und laufende Veranstaltungen. Gewechselt wird innerhalb des
  Bereichs, ohne den Tab zu verlassen.
- **Freie-Raum-Suche** über einen gewählten Zeitraum: Startzeit und Dauer.
  Die Ergebnisse sind auf die kuratierte Raumliste aus `/stammdaten`
  beschränkt. Je Raum zeigt die Suche Größenklasse, E-Key-Kennzeichen und
  „frei bis". Ohne Folgetermin gilt als „frei bis" die gepflegte
  Gebäudeschließzeit. Gefiltert wird nach Größenklasse und „nur E-Key". Ein
  leeres Ergebnis bekommt einen Hinweis und den Vorschlag eines späteren
  Zeitfensters. Die Suche wird in der App aus `/raeume/uebersicht` (mit
  `zeitpunkt`) und den Stammdaten abgeleitet, nicht über `/raeume/frei`.
- **Raumübersicht** aller Raumplan-Räume mit Belegungszustand. Belegte Räume
  zeigen die laufende Veranstaltung mit Bezeichnung und Ende. Freie Räume
  zeigen „frei bis". Für kuratierte Räume kommen Größenklasse und E-Key dazu,
  bei gesetztem Feld `note` auch der Freitext. Die Übersicht hat einen Filter
  nach Zustand (zurücksetzbar) und eine Suche nach Raumkennung.
- **Laufende Veranstaltungen**: die nach Veranstaltung gruppierte Sicht auf die
  belegten Räume, mit Raum, Bezeichnung und Endzeitpunkt. Läuft gerade nichts,
  erscheint ein Hinweis.
- **Tagesbelegung eines Raums**: Der Raum kann per Kennung gewählt oder aus
  Übersicht bzw. laufenden Veranstaltungen angetippt werden. Ist die Kennung
  unbekannt, erscheint „Raum unbekannt" statt eines technischen Fehlers.
- **Backend: `GET /v1/raeume/{roomId}/belegung`** auf dem bestehenden
  Zwischenspeicher. Der Vertrag beschreibt den Endpunkt bereits, umgesetzt ist
  er noch nicht. Aus Übersicht oder Serienform lässt sich die Tagesbelegung
  nicht exakt ableiten. Der Endpunkt kennt jeden Raum des Raumplans und nicht
  nur die kuratierten, weil Übersicht und laufende Veranstaltungen auch
  nicht kuratierte Räume öffnen. Die 404-Beschreibung im Vertrag wird
  entsprechend berichtigt.
- **Altershinweis**: Ist der Bestand beim Abruf älter als der stündliche
  Abruftakt, zeigen alle Raumsichten sein Alter an.
- **Offline**: Ohne Netz kennzeichnet der Bereich sich als nicht verfügbar,
  statt einen zwischengespeicherten Stand zu zeigen (Capability
  `architecture`, „Raumsuche offline nicht verfügbar").

### Nicht-Ziele

- Besetzt-Meldungen (Melden, Anzahl, Zurückziehen, Anzeige in der Übersicht)
  samt Offline-Warteschlange. Das Feld `besetztMeldungen` wird nicht angezeigt.
- Nächstgelegener freier Raum über Laufwege und Referenzraum-Eingabe.
- Stundenplan-Abgleich gegen den Raumplan (SCHED-F-410 bis SCHED-F-450).
- `/raeume/frei` im Backend. Die App leitet die Suche selbst ab (siehe
  `design.md`). `/raeume` bleibt ebenfalls ungenutzt, weil die kuratierte
  Liste in `/stammdaten` schon enthalten ist.
- Ein frei wählbarer Bezugszeitpunkt für die Raumübersicht. Für den ersten
  Umfang gilt „jetzt", wie in der Capability `room-finder` unter „Offene
  Fragen" angenommen.

### Offene Entscheidungen, die dieser Schnitt nicht trifft

- Tab-Label und -Symbol bleiben „Raumsuche". Eine Umbenennung in „Räume" ist
  eine SHELL-Entscheidung.
- Feiertage bildet der Raumplan nicht ab (Spike 2026-09-07). An einem
  Feiertag zeigt die Ansicht laufender Veranstaltungen deshalb den Sollplan.
  Wie damit umzugehen ist, bleibt offen. Der Schnitt zeigt an, was der
  Bestand führt.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `room-finder`: Mehrere Requirements werden geschärft.
  - „Belegung eines gewählten Raums anzeigen": auch nicht kuratierte Räume,
    Fall „Raum unbekannt".
  - „Suche nach freien Räumen": Bedeutung von „frei im Zeitraum", Räume ohne
    Raumplan-Eintrag, Vorschlag eines späteren Zeitfensters.
  - „Gepflegte Gebäudeschließzeit statt fester Wert": Fall „keine
    Schließzeit gepflegt".
  - „Alter eines veralteten Raumplan-Stands anzeigen": stündlicher Takt,
    gemessen beim Abruf, gilt für alle Raumsichten.
- `backend-and-api`: neues Requirement „Tagesbelegung eines Raums aus dem
  Raumplan-Zwischenspeicher".

## Impact

- `app/src/areas/room-finder/`: Datenzugriff (`api.ts`), reine Ableitungslogik
  (freie Räume, laufende Veranstaltungen, Filter, Standalter), Bildschirme
  und Tests. Der Platzhalter `RoomFinderScreen` wird ersetzt.
- `app/app/(tabs)/rooms`: wird zum verschachtelten Stack (Sichten +
  Tagesbelegung), wie Mensaplan und Stundenplan.
- `app/src/ui/state/AsyncStates.tsx`: optionaler Hinweistext je Quelle, weil
  der bisherige Text fest auf die Mensa-Schnittstelle lautet.
- `app/src/cache/ttl.ts`: Abruftakt des Raumplans als benannte Größe.
- `app/src/i18n/de.json`, `en.json`: Texte des Raum-Bereichs.
- `backend/src/Fb4.Backend/Endpoints/RaumplanEndpoints.cs`: neuer Endpunkt
  `/raeume/{roomId}/belegung`, Tests in `Fb4.Backend.Tests`.
- `openspec/specs/api-contract.yaml`: nur die Beschreibung der 404-Antwort von
  `/raeume/{roomId}/belegung`. Schemas und Pfade bleiben unverändert.
