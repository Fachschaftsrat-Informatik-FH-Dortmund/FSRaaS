## MODIFIED Requirements

### Requirement: Raum als belegt kennzeichnen

Das System muss einen Raum als belegt kennzeichnen, wenn zum abgefragten Zeitpunkt ein Termin mit diesem Raum existiert, unabhängig davon, ob der Termin vom Typ `Course` oder `Event` (z. B. Prüfung) ist. Als Raum eines Termins gilt dabei nicht nur das Feld `roomId`: Trägt ein Termin die Pseudo-Raumkennung `*`, so gilt der Raum, den sein Namensfeld als Freitext nennt. Herkunft: NEU (vormals RAUM-F-030); um den Pseudoraum ergänzt nach dem INT-009-Spike, 2026-09-07.

Grund für den Zusatz: 59 % der Kursinstanzen einer Vorlesungszeit tragen `roomId: "*"` und nennen ihren Raum nur im Namensfeld (`… (in Raum C.E.44)`). Eine Belegungsauskunft, die allein `roomId` auswertet, übersieht rund ein Drittel der belegten Zeit und meldet Räume als frei, in denen eine Veranstaltung läuft — der schwerste denkbare Fehler dieser Funktion, weil die Nutzerin vor verschlossener oder besetzter Tür steht.

#### Scenario: Prüfungstermin belegt den Raum
- **WHEN** zum abgefragten Zeitpunkt ein Termin vom Typ `Event` mit diesem Raum existiert
- **THEN** kennzeichnet das System den Raum als belegt, ebenso wie bei einem Termin vom Typ `Course`

#### Scenario: Raum nur im Namensfeld genannt
- **WHEN** ein Termin die Raumkennung `*` trägt und seinen Raum als Freitext im Namensfeld nennt
- **THEN** kennzeichnet das System diesen Raum zur Terminzeit als belegt

### Requirement: Raumtermine über den Backend-Zwischenspeicher beziehen

Das System muss die Raumtermine über den Zwischenspeicher des Backends (INT-008) beziehen, das sie seinerseits über den Platzhalter-Aufruf `Room/*/AllEvents` aus INT-009 mit ausdrücklich gesetztem Zeitraum abruft. Herkunft: Recherche: alte apps/android-fb4, retrofit/TimetableApi.java, 2026-08-25; Quellenbeschreibung berichtigt nach dem INT-009-Spike, 2026-09-07 (vormals RAUM-F-045).

An die App stellt das keine neue Anforderung: Sie bezieht unverändert alles aus dem Backend-Zwischenspeicher und führt keine eigenen Abfragen gegen den FBWS. Berichtigt wird die Begründung, die bisher besagte, der Platzhalter-Aufruf liefere schlicht „alle Raumtermine". Er liefert die Termine des angeforderten Zeitraums — und ohne die Parameter `From`/`To` nur sieben Tage. Die entfallenen Anforderungen zur clientseitigen Aggregation bleiben entfallen; siehe Capability `integrations`, INT-009.

#### Scenario: Raumtermine aus dem Zwischenspeicher
- **WHEN** die App Raumtermine anfragt
- **THEN** bezieht sie diese aus dem Zwischenspeicher des Backends, nicht durch eigene Abfragen gegen den FBWS
