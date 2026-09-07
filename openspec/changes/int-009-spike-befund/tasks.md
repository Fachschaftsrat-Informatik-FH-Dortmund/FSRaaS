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

## 4. Offene Entscheidungen — nicht Gegenstand dieses Changes

- [ ] 4.1 Prüfungsbestand: 70 % Abdeckung hinnehmen und ausweisen, Excel-Import als Ergänzung wieder aufnehmen (INT-013, Formatanalyse ist erhalten), oder Herkunft der fehlenden Prüfungen beim Fachbereich klären
- [ ] 4.2 Stundenplan-Raumabgleich (`schedule`, vormals SCHED-F-410 bis F-450): Kalendarisch feststehende Ausfälle sind aus dieser Quelle nicht ableitbar, kurzfristige Einzelabsagen (stilles Verschwinden der Instanz) grundsätzlich schon — Zuschnitt der sechs Requirements in Kenntnis dieser Differenzierung entscheiden

## 5. Offene Nachprüfungen

- [ ] 5.1 Ursache der fehlenden wirtschaftswissenschaftlichen Prüfungen beim Fachbereich erfragen
- [ ] 5.2 Abdeckung gegen die vier weiteren Jahrgangsdateien unter `resources/` prüfen (WiSe 2023/24, SoSe 2024, SoSe 2025); der Raumplan reicht nachweislich bis Februar 2024 zurück
- [x] 5.3 Einzelfall-Nachweis an einer bekannten Absage, ob der Termin im Bestand stehen bleibt — erledigt am 2026-09-07, sechs Fälle gefunden, alle entfernt statt markiert
- [ ] 5.4 Einzelfall-Nachweis an einer bekannten Verlegung, ob ein Raumwechsel derselben Sitzung im Bestand ankommt — im geprüften Fenster kein Beleg, aber auch keine Widerlegung
