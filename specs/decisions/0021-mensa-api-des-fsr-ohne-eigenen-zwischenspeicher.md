---
nummer: 0021
titel: Mensa-Daten aus der FSR-eigenen Mensa-API, ohne eigenen Zwischenspeicher
status: angenommen
datum: 2026-09-22
betrifft:
  - 0007-datenquellen-mensa-und-news.md
  - ../../openspec/specs/canteen/spec.md
  - ../../openspec/specs/backend-and-api/spec.md
  - ../../openspec/specs/architecture/spec.md
  - ../../openspec/specs/admin/spec.md
  - ../../openspec/specs/integrations/spec.md
---

# ADR 0021: Mensa-Daten aus der FSR-eigenen Mensa-API, ohne eigenen Zwischenspeicher

## Kontext

ADR 0007 hat 2026-08-24 entschieden, News und Speisepläne über das eigene Backend zu beziehen, das „die jeweiligen Primärquellen anspricht, zwischenspeichert und TLS erzwingt". Für die Mensa wurde daraufhin INT-015 gewählt, die Speiseplan-API des ITMC der TU Dortmund, und im Backend ein Zwischenspeicher samt Hintergrund-Job und Abrufzeitplan gebaut.

Zwei Dinge haben sich seither geändert.

**Erstens hat sich die damalige Ersatzlösung für Öffnungszeiten als Fehlerquelle erwiesen.** INT-015 stellt Öffnungszeiten nicht bereit — `GET /canteens/{id}/openings/all` antwortete bei der Verifikation am 2026-09-03 mit HTTP 500. Ersatzweise wurde entschieden, sie von Hand in den Stammdaten zu pflegen, je Mensa als fünf Zeichenketten. Am 2026-09-22 stand dort für die Hauptmensa freitags `11:30 - 14:00`; tatsächlich schließt sie um `14:15`. Niemand hatte die Abweichung bemerkt. Das ist derselbe Verfall, der `app.fsrfb4.de` bis heute mit Daten aus dem Wintersemester 2023/24 laufen lässt und der der Anlass für die spec-verankerte Arbeitsweise dieses Projekts war.

**Zweitens betreibt der FSR seit kurzem selbst einen Dienst, der das Problem löst.** Unter `mensa.fb4.it` läuft ein Caching-Proxy vor der Speiseplan-API des Studierendenwerks Dortmund (Quellcode: `Fachschaftsrat-Informatik-FH-Dortmund/mensa-api`, ein Go-Binary ohne Abhängigkeiten außerhalb der Standardbibliothek, OpenAPI 3.1 unter `/openapi.json`). Er liefert alles, was INT-015 liefert, und zusätzlich Öffnungszeiten, getrennte Ausgabezeiten, Schließtage mit Klartextgrund und Zeitraum, Standortangaben aus dem CMS des Studierendenwerks, die Trennung von Allergenen und Zusatzstoffen sowie CO₂-Klassen. Die Mensa-Kennungen sind identisch, weil beide Quellen die Verbrauchsortnummer des Studierendenwerks führen.

Vor der Entscheidung wurden die Öffnungsangaben gegen den Speiseplan geprüft (2026-09-22, alle 15 Standorte, 105 Tag/Mensa-Paare): kein Fall, in dem die Schnittstelle eine Mensa als geschlossen führte, während ihr Speiseplan Gerichte enthielt. Zwei unabhängige Felder stimmen taggenau überein — die Betriebsferien der Mensa Süd enden am 04.10., ihr Speiseplan beginnt am 05.10.

Damit stellt sich zugleich die Frage nach dem eigenen Zwischenspeicher neu: `mensa.fb4.it` ist selbst ein Cache, im selben Verantwortungsbereich betrieben, und setzt auf jede Antwort `Cache-Control: public, max-age=300`.

## Entscheidung

Die Mensa-Daten kommen künftig aus der FSR-eigenen Mensa-API (`mensa.fb4.it`). Sie bekommt mit dem Change `mensa-api-abloesung` einen eigenen Eintrag im Schnittstellenregister; INT-015 wird abgelöst und bleibt dort als abgelöster Eintrag dokumentiert. Die Registerkennung wird hier nachgetragen, sobald der Eintrag im Bestand steht — ein Verweis darauf vor dem Archivieren des Changes würde die Verweisprüfung (`tools/spec-check`) brechen.

Das eigene Backend bleibt in der Kette — die App spricht weiterhin kein Fremdsystem unmittelbar an —, **hält aber keinen eigenen Bestand der Mensa-Daten mehr vor**. Es reicht je Anfrage pro Tag und Mensa durch und darf dabei die von der Quelle gesetzte Gültigkeitsdauer beachten. Der serverseitige Speiseplan-Zwischenspeicher samt Tabelle, Hintergrund-Job und Abrufzeitplan entfällt ersatzlos. Der gerätelokale Zwischenspeicher der App bleibt unverändert; er trägt die Offline-Anzeige und den Altershinweis.

Die Handpflege der Öffnungszeiten entfällt. Sie kommen samt Ausgabezeiten und Schließtagen aus der Schnittstelle.

Diese Entscheidung **löst ADR 0007 in Bezug auf die Mensa ab**. Für die News gilt ADR 0007 unverändert weiter: dort bleibt es beim Zwischenspeicher im eigenen Backend, weil die dortige Quelle keine eigene Vorhaltung mitbringt.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **`mensa.fb4.it` ohne eigenen Zwischenspeicher (gewählt)** | mittel | Öffnungszeiten, Schließtage und Standortangaben ohne Handpflege; ein Cache statt zwei; Quelle im eigenen Verantwortungsbereich | bei Ausfall der Quelle hat das Backend keinen letzten guten Stand mehr; mehr Last auf der Quelle als bei einem Hintergrund-Job |
| `mensa.fb4.it` mit eigenem Zwischenspeicher beibehalten | mittel bis hoch | letzter guter Stand im Backend auch bei Ausfall der Quelle | dupliziert, was die Quelle bereits tut; zweite Stelle, an der ein veralteter Stand hängen bleibt; Hintergrund-Job und Abrufzeitplan bleiben zu pflegen |
| App ruft `mensa.fb4.it` unmittelbar auf | gering | ein Netzsprung weniger; die Quelle erlaubt es technisch (`Access-Control-Allow-Origin: *`) | Bewertungen und Fotos müssten clientseitig an Gerichte geknüpft werden; die Kuration der Mensa-Auswahl bräuchte einen zweiten Ort; die Regel „App spricht kein Fremdsystem direkt an" bekäme eine Ausnahme |
| Bei INT-015 bleiben | keiner | kein Umsetzungsaufwand | Öffnungszeiten weiterhin von Hand, mit belegtem Verfall; keine Schließtage, keine Standortangaben, keine Trennung von Allergenen und Zusatzstoffen |
| Unmittelbar gegen die Stwdo-API | hoch | keine Zwischenschicht | genau die Aufbereitung selbst bauen, die `mensa-api` bereits leistet; die Legende liegt dort nur als Webseite vor, nicht in der API |

## Konsequenzen

Die Handpflege von Öffnungszeiten entfällt aus der Verwaltungsoberfläche, aus dem Vertrag und aus dem mitgelieferten Ausgangsbestand der App. Anzeigereihenfolge und Standardauswahl der Mensen bleiben gepflegt — sie haben keine externe Quelle.

Im Backend entfallen rund 333 Zeilen (Speicher, Job, Zeitplan) samt der zugehörigen Tabelle; eine Migration entfernt sie. Da es ein reiner Lesecache war, entsteht kein Datenverlust. `GerichtNormalisierung` bleibt unverändert: der Gerichtsschlüssel wird aus den mit ` | ` zusammengefügten Komponenten der neuen Quelle gebildet und ist damit zeichengleich mit dem bisherigen, sodass bestehende Bewertungen, Lieblingsgerichte und Fotos ihren Gerichten zugeordnet bleiben.

Das Ausfallverhalten verschiebt sich bewusst: fällt `mensa.fb4.it` aus, hat das Backend nichts auszuliefern und meldet einen Fehler; die Rückfallebene ist der gerätelokale Bestand der App. Vertretbar, weil die Quelle im eigenen Verantwortungsbereich liegt und damit reparierbar ist.

Die Quelle lädt träge: bei der Messung am 2026-09-22 waren ihre Speisepläne 6,7 Tage alt und wurden erst durch die Anfrage aufgefrischt, während ihr Zustandsendpunkt `ok` meldete — dieser kennt nur fehlgeschlagene Abrufe, nicht Überalterung. Das Backend reicht deshalb den gemeldeten Datenstand an die App weiter, und der Altershinweis greift auch bei bestehender Netzverbindung. Im laufenden Betrieb hält der Durchreichverkehr die Quelle ohnehin warm.

Die Aufteilung in „geschlossen" und „offen, aber kein Speiseplan" wird erst durch diese Quelle möglich und betrifft drei der 15 Standorte, die bislang fälschlich als geschlossen angezeigt worden wären.

## Offene Punkte

- Ab welchem gemeldeten Datenalter der Altershinweis greift, ist Konfiguration und bei der Umsetzung festzulegen.
- Eine Verfügbarkeitszusage für `mensa.fb4.it` gegenüber den Nutzenden ist, wie beim eigenen Backend (INT-008), noch nicht definiert.
- Ob `mensa-api` langfristig im eigenen Backend aufgehen oder als eigenständiger Dienst bestehen bleiben soll, ist offen. Für die App ist das unerheblich, weil sie in beiden Fällen nur das eigene Backend anspricht.
