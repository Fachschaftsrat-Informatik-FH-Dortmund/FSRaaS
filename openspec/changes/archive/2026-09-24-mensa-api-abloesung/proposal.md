## Why

Der Speiseplan kommt seit Roadmap-Schritt 4 aus der ITMC-Schnittstelle der TU Dortmund (INT-015), zwischengespeichert im eigenen Backend. Diese Quelle liefert Gerichte, aber sonst wenig: `GET /canteens/{id}/openings/all` antwortete bei der Verifikation am 2026-09-03 mit HTTP 500, weshalb die Öffnungszeiten seither **von Hand** in den Stammdaten gepflegt werden — je Mensa fünf Zeichenketten. Am 2026-09-22 stand dort für die Hauptmensa freitags `11:30 - 14:00`; tatsächlich schließt sie um `14:15`. Niemand hat die Abweichung bemerkt. Genau dieser Verfall gepflegter Daten hat das Vorgängerprojekt zum Stillstand gebracht: `app.fsrfb4.de` läuft bis heute mit Daten aus dem Wintersemester 2023/24.

Der FSR betreibt seit kurzem unter `mensa.fb4.it` einen eigenen Caching-Proxy vor der Speiseplan-API des Studierendenwerks Dortmund (Quellcode: `Fachschaftsrat-Informatik-FH-Dortmund/mensa-api`, ein Go-Binary ohne Fremdabhängigkeiten, OpenAPI 3.1 unter `/openapi.json`). Er liefert alles, was INT-015 liefert, und darüber hinaus Öffnungszeiten, Ausgabezeiten, Schließtage samt Grund, Standortangaben aus dem CMS, nach Allergenen und Zusatzstoffen getrennte Kennzeichnungen sowie CO₂-Klassen. Die Mensa-Kennungen sind identisch (`341`, `456`, `455` …), weil beide Quellen die Verbrauchsortnummer des Studierendenwerks verwenden — die Umstellung erfordert damit keinerlei Neuschlüsselung bestehender Nutzerinnen-Auswahlen.

Die Öffnungsangaben wurden vor dieser Entscheidung gegen den Speiseplan geprüft (2026-09-22, alle 15 Standorte, 105 Tag/Mensa-Paare): **kein einziger Fall** „geschlossen laut Öffnungszeiten, aber Gerichte im Plan". Zwei unabhängige Felder der Quelle stimmen taggenau überein — die Betriebsferien der Mensa Süd enden am 04.10., ihr Speiseplan beginnt am 05.10.; die des Max-Ophüls-Platzes enden am 27.09., ihre Öffnungsvorschau meldet den 28.09. als ersten offenen Tag.

Mit dem Wegfall der eigenen Zwischenspeicherung entfällt zugleich eine Doppelung: `mensa.fb4.it` ist bereits ein Cache, im selben Verantwortungsbereich betrieben. Ein zweiter Cache davor bringt keinen Gewinn, sondern eine weitere Stelle, an der ein veralteter Stand hängen bleiben kann.

## What Changes

**Quellenablösung**

- INT-015 (ITMC) wird als Speiseplanquelle abgelöst; `mensa.fb4.it` kommt als neuer Registereintrag in `integrations/spec.md`. INT-015 bleibt als abgelöster Eintrag stehen.
- **BREAKING (nur backend-intern):** Der serverseitige Speiseplan-Zwischenspeicher entfällt ersatzlos — Tabelle, Hintergrund-Job und Abrufzeitplan. Das Backend reicht pro Tag und Mensa durch und beachtet dabei das `Cache-Control: public, max-age=300`, das die Quelle selbst setzt. Der **geräte­lokale** Zwischenspeicher der App bleibt unverändert; an ihm hängen die Offline-Anzeige und der Altershinweis.
- Das Backend reicht das `updated`-Feld der Quelle durch, damit der bestehende Altershinweis auch dann greift, wenn die Quelle selbst veraltete Daten liefert. Bei einer Messung am 2026-09-22 waren die Speisepläne dort 6,7 Tage alt, während `/health` weiterhin `ok` meldete — die Quelle lädt erst auf Anfrage, und `degraded` zeigt nur fehlgeschlagene Abrufe an, nicht Überalterung.

**Öffnungszeiten und Schließtage**

- `/hours` wird maßgeblich für „offen oder geschlossen"; die Handpflege der Öffnungszeiten in den Stammdaten entfällt. Damit wird die am 2026-09-03 getroffene Entscheidung zugunsten der gepflegten Stammdaten revidiert — ihr Grund (INT-015 antwortete mit HTTP 500) ist entfallen.
- Ausgabezeiten werden zusätzlich ausgewiesen, wo sie von den Öffnungszeiten abweichen (Mensa Max-Ophüls-Platz: geöffnet ab 08:00, Essensausgabe ab 11:30).
- **Neue Unterscheidung:** „geschlossen" und „offen, aber kein Speiseplan" sind künftig zwei verschiedene Aussagen. Drei der 15 Standorte führen grundsätzlich nie einen Speiseplan und würden heute fälschlich als geschlossen angezeigt.
- Schließtage werden ausgewertet und sichtbar gemacht — mit Grund und Zeitraum („geschlossen wegen Betriebsferien bis 04.10."). Sie lösen zugleich den Speiseplan als Datengrundlage des Wiedereröffnungshinweises ab: dessen Horizont schwankt je Mensa zwischen 4 und 11 Tagen, und für Standorte ohne Speiseplan existiert er gar nicht.
- Das Überspringen angebotsfreier Wochenendtage richtet sich künftig nach der **Öffnung** statt nach dem Angebot. Canapé (Iserlohn) und Snack it (Hagen) haben samstags geöffnet; der Speiseplan enthält grundsätzlich keine Wochenendtage und kann das weder bestätigen noch widerlegen.

**Neue Gerichtsangaben**

- Allergene (27 Codes, u. a. `20a`–`20f` Gluten, `27a`–`27h` Nüsse) werden von den Zusatzstoffen (11 Codes) getrennt geführt. Das Filtermenü bekommt zwei Abschnitte und je einen Sammelschalter für Gluten und Nüsse. Die bestehende Nutzerinnen-Auswahl bleibt gültig, weil die Codes dieselben sind.
- CO₂-Klasse und der Tag „Klimateller" kommen hinzu — als Abzeichen am Gericht, als Filterkriterium und als Sortier-/Gruppierbaustein. Damit wird ein Teil der offenen Frage „Weitere Gruppierungs-/Sortier-Bausteine" aus `canteen` beantwortet.
- Gerichte werden in ihre Komponenten zerlegt dargestellt: erste Komponente hervorgehoben, Beiwerk darunter, statt einer Zeile mit `|`-Trennern.
- Der Gerichtsschlüssel für Bewertungen, Lieblingsgerichte und Fotos entsteht künftig aus den mit ` | ` zusammengefügten Komponenten. Das reproduziert den bisherigen Schlüssel zeichengenau — bestehende Bewertungen und Fotos bleiben verbunden, ein Migrationsschritt entfällt. Das Feld `name` allein wäre dafür untauglich, da es nur die erste Komponente trägt.

**Standortangaben**

- Adresse, Karten-Link und Beschreibung der Mensen kommen aus der Quelle und werden angezeigt. Bislang gab es sie nicht.
- Alle 15 Standorte bleiben wählbar; der Admin pflegt weiterhin Reihenfolge und Standardauswahl, nicht mehr aber Öffnungszeiten.

**Ausdrücklich nicht Teil dieses Changes**

- Die Endpunkte `/legend` und `/health` werden genutzt, aber nicht als eigene App-Ansicht aufbereitet.
- Das Feld `slug` und die Mensa-Seite auf `stwdo.de` (`url`) bleiben intern; es entsteht kein Absprung aus der App.
- Der Vertrag wird nach ADR 0016 **additiv** unter `/v1` erweitert. Ein `/v2` mit sauberem Schnitt — insbesondere die Verengung von `zusatzstoffe` auf echte Zusatzstoffe — wird bewusst nicht gezogen, weil F-Droid-Nutzerinnen strukturell später nachziehen.

## Capabilities

### New Capabilities

(keine)

### Modified Capabilities

- `canteen`: Öffnungszeiten wechseln die Datengrundlage und werden um Ausgabezeiten erweitert; der Geschlossen-Hinweis wird von „ohne Angebot" auf „geschlossen" umgestellt und um den Fall „offen ohne Speiseplan" ergänzt; der Wiedereröffnungshinweis stützt sich auf Öffnungsvorschau und Schließtage statt auf den Speiseplan; das Wochenend-Überspringen richtet sich nach der Öffnung; Allergene werden getrennt gefiltert; CO₂-Klasse kommt als Kennzeichnung, Filter- und Sortierkriterium hinzu; Gerichtskomponenten und Standortangaben werden angezeigt; der Zwischenspeicher-Aktualisierungszeitplan entfällt (REMOVED).
- `canteen-ratings`: die Normalisierung der Gerichtsbezeichnung bekommt die zusammengefügten Komponenten als Eingang, damit der Schlüssel über die Quellenablösung hinweg gleich bleibt.
- `backend-and-api`: Speisepläne sowie Öffnungszeiten, Kategorien und Zusatzstoffe werden durchgereicht statt aus einem Zwischenspeicher ausgeliefert (REMOVED, ersetzt); der Auffrischungszeitplan entfällt (REMOVED); das Datenalter der Quelle wird weitergereicht.
- `architecture`: die Formulierung „aus dem Backend-Zwischenspeicher" wird auf „über das Backend" umgestellt — die Regel, dass die App nie direkt die Mensa-Quelle anspricht, bleibt unverändert.
- `admin`: die Pflege der Öffnungszeiten je Mensa und Wochentag entfällt (REMOVED); Reihenfolge und Standardauswahl bleiben.
- `data-and-storage`: der Altershinweis berücksichtigt zusätzlich das von der Quelle gemeldete Datenalter.
- `integrations`: neuer Registereintrag für `mensa.fb4.it`; INT-015 wird als abgelöst geführt; der Nutzungshinweis zu INT-008 verliert den Mensa-Zwischenspeicher-Anteil.

## Impact

**Roadmap.** Nachlauf zu Schritt 4 (Mensaplan), analog zur Überarbeitung vom 2026-09-04. Kein neuer Schritt: der Funktionsumfang bleibt derselbe Ausschnitt, er wird nur auf eine tragfähigere Quelle gestellt und um das erweitert, was diese Quelle zusätzlich hergibt. Der an Schritt 9 gebundene Teil B (Lieblingsgerichte aus Bewertungen) bleibt unberührt; der Gerichtsschlüssel wird bewusst zeichengleich gehalten, damit dieser Nachlauf nicht zusätzlich belastet wird.

**Backend.** `ItmcMensaClient.cs` wird durch einen Client gegen `mensa.fb4.it` ersetzt. `SpeiseplanStore.cs`, `SpeiseplanAktualisierungJob.cs` und `SpeiseplanAbrufZeitplan.cs` entfallen (zusammen 333 Zeilen), ebenso die Tabelle aus Migration `20260903194814_MensaSpeiseplanZwischenspeicher` und das Persistenzmodell `MensaVerzeichnisEintrag`. `GerichtNormalisierung.cs` bleibt unverändert — sie behält ihre Regex zum Entfernen inline stehender Zusatzstoff-Codes als Netz: 5 von 73 geprüften englischen Gerichtszeilen tragen sie noch, darunter den in der Legende nicht existierenden Code `281`.

**Vertrag.** `openspec/specs/api-contract.yaml` wird additiv erweitert (Komponentenliste, getrennte Allergene, CO₂-Klasse, neue Öffnungszeitenform, Standortangaben, Datenalter). Typen werden daraus erzeugt.

**App.** Capability `canteen` in Gerichtskachel, Filtermenü, Sortier-/Gruppierauswahl, Mensa-Auswahl und Tagesnavigation. Der mitgelieferte Stammdaten-Ausgangsbestand (`stammdaten-ausgangsbestand.json`) verliert seine handgepflegten Öffnungszeiten.

**Entscheidungen.** Ein neuer ADR hält die Quellenablösung und den Wegfall des Zwischenspeichers fest und löst ADR 0007 in diesem Punkt ab — dieser entscheidet wörtlich, das eigene Backend spreche die Primärquellen an und *zwischenspeichere*. ADR 0007 bleibt als Historie bestehen und bekommt einen Verweis.

**Beantwortete offene Fragen.** `specs/open-questions.md` („Woher stammt die Mensa-Liste, und bleibt der Speiseplan an `hemacode.de` gebunden?") wird auf die neue Quelle nachgeführt; in `canteen` wird die Frage nach der führenden Öffnungszeit-Quelle neu entschieden und der Sortier-/Gruppierbaustein-Punkt um die CO₂-Klasse ergänzt.

**Fremdsysteme.** Keine neue Abhängigkeit außerhalb des eigenen Verantwortungsbereichs: `mensa.fb4.it` wird vom FSR selbst betrieben, und die dahinterliegende Primärquelle (Studierendenwerk Dortmund) ist dieselbe, die das Studierendenwerk auch für `stwdo.de` verwendet. TLS durchgängig.
