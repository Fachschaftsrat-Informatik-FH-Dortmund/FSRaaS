# Aufgaben

## 1. Spike durchführen (Issue #28, Vorbedingung von Roadmap-Schritt 6)

- [x] 1.1 Endpunktverhalten von `Room/{roomId}/AllEvents` und `Room/*/AllEvents` gegen den Live-Dienst vermessen
- [x] 1.2 Zeitraum-Parameter `From`/`To` aus der HTML-Repräsentation gewonnen und verifiziert; stilles Ignorieren unbekannter Parameter festgehalten
- [x] 1.3 Rechtzeitigkeit der Prüfungstermine über `modified` bestimmt — Median 55 Tage Vorlauf, 87 % mindestens 42 Tage
- [x] 1.4 Vollständigkeit gegen `resources/pplan(4).xlsx` (SoSe 2026) bestimmt — 64 von 91 Modulen, 70 % Abdeckung, Lücke systematisch bei den wirtschaftswissenschaftlichen Modulen
- [x] 1.5 Erkennbarkeit des Namensmusters bestimmt — 142 von 149 Einträgen (95 %), zwei belegte Abweichungsformen
- [x] 1.6 Leitfrage aus Roadmap-Schritt 6 differenziert beantwortet: kalendarisch feststehende Ausfälle (Feiertage) **nicht** abgebildet, Nachweis über Pfingstmontag und Fronleichnam — kurzfristige Einzelabsagen dagegen **ja**, nach Rückmeldung FSR FB4 (2026-09-07) auf Instanzebene nachvollzogen: sechs Fälle über neun Vorlesungswochen, alle drei zuvor als Rauschen gewerteten Tagesabweichungen vollständig erklärt
- [x] 1.7 Pseudoraum `*` als Träger von 59 % der Kursinstanzen erkannt, Belegungszuwachs von 30 % gemessen
- [x] 1.8 Ressourcen `Room/` und `Room/{roomId}/Events` erfasst, Wirkungslosigkeit des Pfadsegments vor `/rest/` festgestellt

## 2. Geänderte Requirements

- [x] 2.1 `integrations` INT-009 — `From`/`To`, Standardfenster, Bedeutung des Sterns je Ressource, Pseudoraum im Namensfeld, Serien gegen Einzeltermine, Ausfallabbildung differenziert (Feiertage nein, Einzelabsagen ja), Grenzen als Prüfungsquelle
- [x] 2.2 `backend-and-api` „Raumtermine über Platzhalter-Aufruf beziehen" — Zeitraum ausdrücklich setzen, Antwort auf Abdeckung prüfen, Raum aus dem Namensfeld lesen
- [x] 2.3 `backend-and-api` „Ableitung des Prüfungsbestands aus dem Raumplan" — gemessene Abdeckung aufgenommen, Unvollständigkeit wird Teil des ausgelieferten Bestands
- [x] 2.4 `room-finder` „Raum als belegt kennzeichnen" — Pseudoraum mit Raumangabe im Namensfeld zählt als Belegung
- [x] 2.5 `room-finder` „Raumtermine über den Backend-Zwischenspeicher beziehen" — Begründung berichtigt

## 3. Roadmap und Issue

- [x] 3.1 `specs/product/roadmap.md`, Schritt 6: Spike als durchgeführt vermerkt, Ergebnis und Folgen für den Raumabgleich festgehalten
- [x] 3.2 Issue #28 mit dem Ergebnis kommentiert

## 4. Entscheidungen (getroffen 2026-09-10, Rücksprache FSR FB4)

- [x] 4.1 Prüfungsbestand: 70 % Abdeckung hinnehmen und ausweisen, kein Excel-Reaktivierung — Ursache strukturell (Prüfungen teils außerhalb der FB4-eigenen Gebäude, dort nicht im Raumplan gebucht), nicht durch Nachfrage oder zweite Quelle behebbar. Festgehalten in `specs/backend-and-api/spec.md` und `proposal.md`.
- [x] 4.2 Stundenplan-Raumabgleich (`schedule`, vormals SCHED-F-410 bis F-450): alle sechs Requirements bleiben unverändert. Requirement 440 kennzeichnet jeden Hinweis ohnehin als unbestätigte Ableitung; kalendarisch feststehende Ausfälle bleiben separat behandelt (siehe „Feiertags-Hinweis im Stundenplan", eigene Idee, nicht Teil dieses Changes).

## 5. Offene Nachprüfungen

- [x] 5.1 Ursache der fehlenden wirtschaftswissenschaftlichen Prüfungen — beantwortet ohne Fachbereichsanfrage: andere Gebäude, außerhalb des FB4-Raumplans
- [ ] 5.2 ~~Abdeckung gegen die vier weiteren Jahrgangsdateien unter `resources/` prüfen~~ — bewusst nicht weiterverfolgt (Entscheidung 2026-09-10): Die Ursache ist strukturell bekannt, eine Schwankung über Jahrgänge würde daran nichts ändern
- [x] 5.3 Einzelfall-Nachweis an einer bekannten Absage, ob der Termin im Bestand stehen bleibt — erledigt am 2026-09-07, sechs Fälle gefunden, alle entfernt statt markiert
- [ ] 5.4 Einzelfall-Nachweis an einer bekannten Verlegung, ob ein Raumwechsel derselben Sitzung im Bestand ankommt — dauerhaft unbelegt akzeptiert (Entscheidung 2026-09-10), nicht weiterverfolgt
