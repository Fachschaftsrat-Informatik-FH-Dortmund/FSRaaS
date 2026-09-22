## ADDED Requirements

### Requirement: Mensa-Daten durchreichen statt zwischenspeichern

Das System muss Speisepläne, Öffnungszeiten und das Verzeichnis der Kennzeichnungen bei jeder Anfrage der App aus der Mensa-Schnittstelle beziehen und darf sie nicht in einem eigenen Bestand vorhalten. Die von der Schnittstelle gesetzte Gültigkeitsdauer einer Antwort darf dabei beachtet werden; eine eigene Aufbewahrung über diese Dauer hinaus, eine eigene Auffrischungslogik oder ein eigener Datenbestand sind ausgeschlossen. Herkunft: NEU, entschieden 2026-09-22. Die Mensa-Schnittstelle ist selbst ein Zwischenspeicher im Verantwortungsbereich des FSR; ein zweiter davor bringt keinen Gewinn, sondern eine weitere Stelle, an der ein veralteter Stand hängen bleiben kann.

#### Scenario: Speiseplan-Abruf
- **WHEN** die App den Speiseplan eines Tages anfragt
- **THEN** bezieht das Backend ihn aus der Mensa-Schnittstelle und liefert ihn aus, ohne ihn in einem eigenen Bestand abzulegen

#### Scenario: Gültigkeitsdauer der Quelle
- **WHEN** die Mensa-Schnittstelle zu einer Antwort eine Gültigkeitsdauer angibt
- **THEN** darf das Backend die Antwort für diese Dauer wiederverwenden, ohne darüber hinaus eine eigene Aufbewahrung zu führen

#### Scenario: Kein eigener Auffrischungslauf
- **WHEN** geprüft wird, ob das Backend Mensa-Daten selbsttätig auffrischt
- **THEN** findet kein eigener Auffrischungslauf statt, und der Bestand entsteht allein aus den Anfragen der App

### Requirement: Weitergabe des Datenalters der Mensa-Schnittstelle

Das System muss den von der Mensa-Schnittstelle gemeldeten Stand ihrer Daten an die App weitergeben. Herkunft: Recherche: mensa.fb4.it, Feld `updated` sowie `GET /health`, 2026-09-22. Die Schnittstelle lädt erst auf Anfrage: bei einer Messung am 2026-09-22 waren ihre Speisepläne 6,7 Tage alt, während ihr Zustandsendpunkt weiterhin `ok` meldete — ihre Überalterung ist aus dem Zustand allein nicht erkennbar, wohl aber aus dem mitgelieferten Stand.

#### Scenario: Antwort mit gemeldetem Stand
- **WHEN** die Mensa-Schnittstelle zu einer Antwort den Stand ihrer Daten meldet
- **THEN** gibt das Backend diesen Stand mit der eigenen Antwort an die App weiter

### Requirement: Sichtbarer Fehler bei nicht erreichbarer Mensa-Schnittstelle

Falls die Mensa-Schnittstelle nicht erreichbar ist oder eine unbrauchbare Antwort liefert, muss das System der App einen Fehler melden und darf keine Leerantwort als gültiges Ergebnis ausliefern. Herkunft: NEU, entschieden 2026-09-22. Mit dem Wegfall des eigenen Zwischenspeichers hat das Backend bei einem Ausfall der Quelle keinen letzten guten Stand mehr; die Rückfallebene ist der gerätelokale Bestand der App, der nur greift, wenn der Fehler als solcher erkennbar ist.

#### Scenario: Quelle nicht erreichbar
- **WHEN** die Mensa-Schnittstelle bei einer Anfrage der App nicht erreichbar ist
- **THEN** meldet das Backend einen Fehler, statt eine leere Gerichtsliste als gültiges Ergebnis auszuliefern

## REMOVED Requirements

### Requirement: Mensa-Speisepläne aus Zwischenspeicher ausliefern

**Reason**: Der eigene Speiseplan-Zwischenspeicher entfällt mit der Ablösung von INT-015. Die neue Mensa-Schnittstelle ist selbst ein Zwischenspeicher im Verantwortungsbereich des FSR und setzt auf jede Antwort eine eigene Gültigkeitsdauer; ein zweiter Bestand davor brächte keinen Gewinn.

**Migration**: Ersetzt durch das Requirement „Mensa-Daten durchreichen statt zwischenspeichern" in derselben Capability. Für die App ändert sich nichts: sie fragt weiterhin ausschließlich das eigene Backend (Capability `architecture`).

### Requirement: Öffnungszeiten, Kategorien und Zusatzstoffe aus Zwischenspeicher

**Reason**: Dieselbe Begründung wie beim Speiseplan-Zwischenspeicher. Zusätzlich entfällt die Grundlage der bisherigen Fassung: Öffnungszeiten wurden mangels abrufbarer Quelle aus gepflegten Stammdaten bedient, während die neue Schnittstelle sie samt Ausgabezeiten und Schließtagen liefert.

**Migration**: Ersetzt durch das Requirement „Mensa-Daten durchreichen statt zwischenspeichern" in derselben Capability. Die Öffnungszeiten kommen nicht mehr aus den Stammdaten, sondern aus der Schnittstelle (Capability `canteen`, Requirement „Öffnungszeiten je Mensa und Wochentag"; Capability `admin`, entfallenes Pflegerecht).

### Requirement: Auffrischungszeitplan des Speiseplan-Zwischenspeichers

**Reason**: Ohne eigenen Zwischenspeicher gibt es nichts aufzufrischen. Der Zeitplan war darauf angelegt, den eigenen Bestand vor den studentischen Nutzungsspitzen aktuell zu halten; beim Durchreichen entsteht der Stand unmittelbar bei der Anfrage und ist damit stets so aktuell wie die Quelle.

**Migration**: Ersatzlos. Die Aktualität wird durch das Durchreichen hergestellt. Erweist sich die Quelle als überaltert, wird das über das weitergegebene Datenalter sichtbar (Requirement „Weitergabe des Datenalters der Mensa-Schnittstelle") und führt zum Altershinweis in der App (Capability `data-and-storage`).
