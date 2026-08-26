---
nummer: 0015
titel: Resilienz periodischer Hintergrund-Jobs
status: angenommen
datum: 2026-08-26
betrifft:
  - ../platform/backend-and-api.md
  - ../platform/non-functional.md
  - 0011-monorepo-und-openapi-vertrag.md
---

# ADR 0015: Resilienz periodischer Hintergrund-Jobs

## Kontext

ADR 0011 legt periodische Aufgaben (Zwischenspeicher-Auffrischung, Importe) als Hosted Services im selben Prozess wie die Web-API fest. Seit .NET 6 stoppt eine unbehandelte Ausnahme in einem `BackgroundService` per Standardverhalten (`BackgroundServiceExceptionBehavior.StopHost`) den **gesamten** Host — also auch die Web-API für MENSA, RAUM, RATE und alle übrigen Bereiche. Das verletzt unmittelbar den bereits akzeptierten Grundsatz aus `non-functional.md` NFR-N-080: „Ausfall eines Fremdsystems darf nur den davon abhängigen Bereich beeinträchtigen, nie die gesamte App." Mehrere periodisch abgerufene Quellen tragen laut `integrations.md` bereits ein „hohes" oder „mittleres" Risiko (INT-003, INT-009, INT-010, INT-013, INT-015) — ein einzelner brüchiger Abruf darf keine Kettenreaktion auf den gesamten Betrieb auslösen. Weder Fehler-Isolation noch eine Timeout-/Wiederholungsstrategie sind bislang spezifiziert.

## Entscheidung

Zwei Techniken, innerhalb der von ADR 0011 gesetzten Grenze (Hosted Services im selben Prozess, kein Architekturwechsel):

1. **Exception-Boundary je Durchlauf:** Jeder `BackgroundService` fängt Fehler innerhalb seiner Schleife pro Tick ab, protokolliert sie (an die Fehlertelemetrie aus ADR 0014) und lässt nur diesen Durchlauf fehlschlagen, nie den Prozess.
2. **Timeout, Retry mit Backoff, Circuit Breaker je externem Aufruf:** `Microsoft.Extensions.Http.Resilience` (baut auf Polly v8 auf, von Microsoft für genau diesen Zweck gepflegt) über `AddStandardResilienceHandler()` auf den benannten `HttpClient`s je Quellsystem, parametriert nach der in `integrations.md` bereits vorhandenen Risikoeinstufung.

Ergänzt um einen Health-Check je Job (Zeitpunkt/Ergebnis des letzten Laufs über `/health`, ADR 0014), damit ein lautlos fehlschlagender Job sichtbar wird — exakt das Muster, an dem die Semestertermine von `app.fsrfb4.de` seit dem Wintersemester 2023/24 unbemerkt veraltet sind.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **Exception-Boundary je Job + `Microsoft.Extensions.Http.Resilience` + Health-Check je Job (gewählt)** | mittel | verhindert Host-Totalausfall durch eine einzelne brüchige Quelle; macht NFR-N-080 im Ein-Prozess-Modell erst einhaltbar; wenig Eigencode, aktiv von Microsoft gepflegt | zusätzliche Konfiguration je externem Aufruf |
| Kubernetes/Message-Queue je Job als getrennter Dienst | hoch | maximale Isolation | Infrastrukturklasse, für einen Ein-VPS-Betrieb ausgeschlossen; verlagert Wissenserhalt-Problematik auf ein zusätzliches, komplexeres System |
| Nur Prozess-Neustart durch systemd/Docker (`Restart=always`) | gering | einfachste Absicherung | ein einzelner externer Ausfall legt für die Neustartdauer die gesamte API lahm, nicht nur den betroffenen Bereich — verletzt NFR-N-080 |
| Hand-geschriebene Retry-/Timeout-Logik je Job | mittel | keine Zusatzabhängigkeit | Backoff, Circuit-Breaker-Zustand und Timeout-Komposition müssten selbst korrekt gebaut und bei jedem neuen Job erneut geschrieben werden |

## Konsequenzen

- `backend-and-api.md` Abschnitt 6 erhält API-N-110 (Exception-Boundary je Job-Durchlauf), API-N-120 (Timeout/Retry/Circuit-Breaker je externem Aufruf) und API-F-260 (Health-Check zeigt Zeitpunkt/Ergebnis des letzten Job-Laufs).
- Betrifft alle Hosted Services aus API-F-045/060/070/075/150/160 sowie den Prüfungsplan-Import (API-F-180).

## Offene Punkte

- Konkrete Timeout-/Retry-Parameter je Quellsystem (z. B. großzügiger für INT-010, das als HTML-Auswertung bereits als fragiler dokumentiert ist) — bei Umsetzung anhand der Risikoeinstufung in `integrations.md` festzulegen.
