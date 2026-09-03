---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-03
---

# Prüfprotokoll — Backend-Auslieferung (API-N-200)

Datum: 2026-09-03
Prüfer: Umsetzung (technische Leitung)
Grundlage: `../platform/backend-and-api.md` 3.3.0 Abschnitt 6, `../platform/api-contract.yaml` 0.5.1 (Server-URL), `../platform/quality-and-testing.md` Abschnitt 3, `../decisions/0017-zugriff-und-datensicherung-vps.md`

API-N-200 ist eine nicht-funktionale „muss"-Anforderung außerhalb der Sonderfälle
von Abschnitt 3. Nachweis über dieses datierte Prüfprotokoll statt eines
automatisierten Tests (QA-F-015); Begründung in `backend-and-api.md` Abschnitt 6
zu API-N-200: Ein Test des Auslieferungswegs setzte einen realen Zielserver mit
Datenbank und Reverse-Proxy voraus.

## 1. Bestandteile im Repository

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Workflow löst nur nach grüner CI aus | `.github/workflows/deploy.yml` — `workflow_run` auf `["CI"]` + `conclusion == 'success'`, zusätzlich `workflow_dispatch` | **bestanden** (statisch) |
| Ablauf umfasst Build, Test, Übertragung, Neustart | Workflow-Schritte: Vertragstypen → `dotnet build` → `dotnet test` → `dotnet publish` → `scp` → `ssh: systemctl stop/mv/start` | **bestanden** (statisch) |
| Betriebszustand wird nach dem Neustart geprüft | Workflow-Schritt fragt `http://127.0.0.1:5100/health` ab, bricht bei Fehlschlag mit Journal-Auszug ab | **bestanden** (statisch) |
| Geheimnisse nicht im Repo / nicht im CI-Runner (SEC-N-110) | Workflow nutzt nur `SERVER_HOST`/`SERVER_USER`/`SSH_PRIVATE_KEY`; DB- und Authentik-Werte ausschließlich in `/etc/fsrfb4aas/fsrfb4aas.env` (`deploy/fsrfb4aas.env.example`, `deploy/fsrfb4aas.service` `EnvironmentFile=`) | **bestanden** (statisch) |
| EF-Migrationen ohne manuellen Schritt | `DbInitializer` als Hosted Service migriert beim Start; Workflow enthält bewusst keinen Migrationsschritt | **bestanden** (statisch) |
| Server-Einrichtung dokumentiert und nachvollziehbar | `deploy/README.md` — Nutzer/Verzeichnisse, .NET-Laufzeit, PostgreSQL-Setup, Secrets, systemd, Firewall, nginx/TLS, sudo-Beschränkung, Onboarding/Offboarding | **bestanden** (statisch) |
| Produktive Domain im Vertrag und in der App gleich | `api-contract.yaml` `servers[0].url` = `https://api.fb4.it/v1`, `app/src/config.ts` + `app/app.json` Default ebenso | **bestanden** (statisch) |

## 2. Erste echte Auslieferung

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Server nach `deploy/README.md` Abschnitt 2 eingerichtet | manuell auf dem Hetzner-VPS | **ausstehend** — braucht Server-Zugang und DNS für `api.fb4.it` |
| GitHub-Secrets gesetzt, Deploy-Schlüsselpaar angelegt | Repo-Einstellungen | **ausstehend** |
| Push auf `main` → CI grün → Deployment läuft durch | GitHub Actions | **ausstehend** |
| `https://api.fb4.it/health` liefert `status: ok` mit Version und Job-Ständen (API-F-260) | `curl` nach dem ersten Deployment | **ausstehend** |
| Erster INT-015-Job-Lauf füllt den Speiseplan-Zwischenspeicher, sichtbar im `/health` | Beobachtung nach dem ersten Deployment | **ausstehend** |
| Rollback (voriger Commit erneut ausgeliefert) getestet | `deploy/README.md` Abschnitt 7 | **ausstehend** |

## 3. Sicherung (API-N-160 bis API-N-180)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Täglicher `pg_dump` auf organisatorisch getrenntes Ziel (Storage Box) eingerichtet | `deploy/README.md` Abschnitt 6, systemd-Timer `fsrfb4aas-backup.timer` | **ausstehend** — Storage-Box-Zugang nötig |
| Wiederherstellungsprobe in Testumgebung | je Semester, eigenes Prüfprotokoll (API-N-180) | **ausstehend** |

Bewertung: Der automatisierte Auslieferungsweg ist vollständig im Repository
beschrieben und statisch geprüft. Die betriebliche Abnahme (Abschnitte 2 und 3)
steht aus, bis der VPS-Zugang und der DNS-Eintrag für `api.fb4.it` vorliegen.
Bis dahin bleibt `backend-and-api.md` bei `status: accepted`, API-N-200 gilt als
teilweise nachgewiesen.
