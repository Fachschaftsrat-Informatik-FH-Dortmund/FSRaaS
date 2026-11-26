## Why

Roadmap-Schritt 6 (Raumsuche) nennt als Besonderheit „erster kontofreier
Schreibpfad, erste Offline-Warteschlange". Raumplan-Zwischenspeicher und
Raumsuche-App sind umgesetzt (Changes `raumplan-zwischenspeicher`,
`raumsuche-app`). Was fehlt, sind die Besetzt-Meldungen. Der offizielle
Raumplan zeigt nicht, ob eine Lerngruppe einen offiziell freien Raum schon
belegt. Studierende stehen dann vor einer besetzten Tür. Das Feld
`besetztMeldungen` der Raumübersicht ist im Vertrag vorhanden, das Backend
liefert dort bisher fest `0`.

## What Changes

- **Vertrag**: `POST /raeume/{roomId}/besetzt-meldungen` bekommt einen
  Anfragerumpf mit dem Auslösezeitpunkt `gemeldetAm` und eine Quittung als
  Antwort. Dazu kommen die Antworten 400, 404 und 409. Neu ist
  `DELETE /raeume/{roomId}/besetzt-meldungen/{meldungId}` zum Zurückziehen.
  Die Vertragsfassung steigt auf 0.9.0 (nach 0.8.0 aus dem Change `pruefungsbestand-aus-raumplan`). Die Typen werden danach neu
  erzeugt.
- **Backend**:
  - Besetzt-Meldungen werden gespeichert, ohne Konto- und Personenbezug und
    ohne Netzadresse. Gespeichert werden nur die Meldungskennung (der
    Idempotenz-Schlüssel), der Raum, der Auslösezeitpunkt und gegebenenfalls
    der Zeitpunkt der Rücknahme.
  - Die Raumübersicht zählt die gültigen Meldungen je Raum. Gültig ist eine
    Meldung 90 Minuten ab ihrer Auslösung.
  - Ein periodischer Job löscht abgelaufene Meldungen.
  - Eine wiederholte Meldung mit demselben Idempotenz-Schlüssel zählt nicht
    doppelt.
  - Beide Schreibpfade sind je Netzadresse begrenzt. Die Zählung liegt nur
    flüchtig im Arbeitsspeicher. Bei Überschreitung antwortet das Backend mit
    429 und `Retry-After`.
- **App, generische Offline-Schreib-Warteschlange** unter `app/src/state/`
  auf Basis der Mutation-Pause/Resume von TanStack Query (ADR 0013):
  - Die Einträge laufen über eine gemeinsame Reihenfolge (FIFO).
  - Fehlgeschlagene Versuche werden mit steigendem Abstand wiederholt.
  - Die Warteschlange übersteht einen Neustart der App.
  - Nach dem letzten Fehlversuch entscheidet die Nutzerin: erneut versuchen
    oder verwerfen.
  - Einträge verfallen nach 7 Tagen.
  - Ein Statusbaustein zeigt die Warteschlange an.
  - Ein Schreibvorgang wird mit wenigen Zeilen je Bereich registriert. Spätere
    Schreibpfade nutzen die Warteschlange mit: Bewertungen, Helfer-Anmeldungen
    und E-Key.
- **App, Raumsuche**:
  - Die Tagesbelegung bekommt die Bedienung „Als besetzt melden" bzw.
    „Meldung zurückziehen" und zeigt die Anzahl gültiger Meldungen. Das
    funktioniert auch offline über die Warteschlange.
  - Übersicht und Freie-Raum-Suche zeigen die Anzahl als zusätzlichen
    Hinweis. Der offizielle Belegungszustand bleibt unverändert.
  - Offline bietet der Bereich weiterhin das Melden per Raumkennung an.
  - Eigene Meldungen merkt sich das Gerät nur so lange, wie sie gültig sind.

### Nicht-Ziele

- Nächstgelegener freier Raum über Laufwege und Referenzraum-Eingabe.
- Stundenplan-Raumabgleich SCHED-F-410 bis SCHED-F-450.
- Die Markierung massenhafter kontofreier Beiträge zur Prüfung durch die
  Moderation (Capability `identity-and-moderation`, „Erkennung massenhafter
  kontofreier Beiträge"). Es gibt noch keine Moderationsoberfläche, in der
  eine Markierung ankäme. Eine Markierung setzte außerdem voraus, dass eine
  Quellenkennung zur Meldung gespeichert wird. Dieser Schnitt verzichtet
  bewusst darauf. Bis dahin protokolliert das Backend jede greifende
  Ratenbegrenzung ohne Netzadresse.
- Ratenbegrenzung kontofreier **Lese**pfade. Sie gehört in den eigenen
  API-Härtungs-Schnitt der Roadmap.
- Ein Warteschlangen-Status außerhalb des Raum-Bereichs, etwa in den
  Einstellungen. Er folgt mit dem zweiten Schreibpfad.

### Offene Punkte, die dieser Schnitt mit Arbeitswerten schließt

- Die Gültigkeitsdauer einer Besetzt-Meldung steht in der Capability
  `room-finder` unter „Offene Fragen" als Arbeitsziel von 90 Minuten. Sie
  wird mit diesem Wert umgesetzt und als Requirement festgehalten.
- Worauf die „Quelle" der Ratenbegrenzung beruht, ist offen
  (`identity-and-moderation`, „Offene Fragen"). Dieser Schnitt legt die
  Netzadresse fest: IPv4 vollständig, IPv6 als /64-Präfix. Sie wird nur
  flüchtig im Arbeitsspeicher gezählt und nie gespeichert. Für die
  Mustererkennung bleibt die Frage offen.
- Die Backoff-Parameter der Offline-Warteschlange sind offen
  (`data-and-storage`). Die Arbeitswerte stehen in `design.md`.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `room-finder`: neues Requirement „Gültigkeitsdauer einer Besetzt-Meldung".
  Es legt den Zeitbezug zum Auslösezeitpunkt fest, auch für offline
  eingereihte Meldungen.
- `backend-and-api`:
  - „Ratenbegrenzung kontofreier Schreibpfade" wird geschärft: Quelle ist die
    Netzadresse, nur flüchtig gezählt, Antwort 429 mit `Retry-After`.
  - Neu ist „Idempotente Besetzt-Meldung".
- `data-and-storage`: neues Requirement „Status der Offline-Warteschlange
  einsehbar". Bisher stand das nur im Erläuterungsabschnitt.

## Impact

- `openspec/specs/api-contract.yaml`, danach
  `tools/contract-codegen` (`app/src/api/generated/schema.ts`,
  `backend/src/Fb4.Backend/Contract/Generated/Contract.cs`).
- Backend:
  - neue Entität `BesetztMeldung` mit eigener Migration
  - neue Endpunkte in `Endpoints/BesetztMeldungEndpoints.cs`
  - Zählung in `RaumplanEndpoints.cs` (`/raeume/uebersicht`)
  - Ratenbegrenzung in `Program.cs` (`AddRateLimiter`)
  - Aufräumjob
  - Tests in `Fb4.Backend.Tests`
- App:
  - `app/src/state/schreibwarteschlange.ts` (neu)
  - `queryClient.ts` und `Providers.tsx` (Persistenz und Fortsetzen der
    Mutationen)
  - Statusbaustein unter `app/src/ui/`
  - `app/src/areas/room-finder/` (Melden, Zurückziehen, Anzeige)
  - i18n de/en
- Gerätelokal kommt eine Liste eigener aktiver Meldungen dazu: Kennung, Raum,
  Zeitpunkt. Sie fällt unter „Alle lokalen Daten löschen" (Präfix `fb4:`).
- Kein neues Fremdsystem, keine neue Abhängigkeit.
