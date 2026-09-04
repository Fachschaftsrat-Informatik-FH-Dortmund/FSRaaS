---
status: draft
version: 0.3.0
owner: FSR FB4
last_reviewed: 2026-09-04
---

# Prüfprotokoll — Backend-Auslieferung (API-N-200)

Datum: 2026-09-03
Prüfer: Umsetzung (technische Leitung)
Grundlage: `../platform/backend-and-api.md` Abschnitt 6 (API-N-200), `../platform/api-contract.yaml` (Server-URL `api.fb4.it`), `../decisions/0018-verwaltungsoberflaeche-react-native-web.md` (Web-Export unter /admin), `../platform/quality-and-testing.md` Abschnitt 3, `../decisions/0017-zugriff-und-datensicherung-vps.md`

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
| Betriebszustand wird nach dem Neustart geprüft | Workflow-Schritt pollt `http://127.0.0.1:5100/health` bis zu 120 s (Erststart = Migration + Seed), bricht sonst mit `systemctl status` + Journal-Auszug ab | **bestanden** (statisch) |
| Geheimnisse nicht im Repo / nicht im CI-Runner (SEC-N-110) | Workflow nutzt nur `SERVER_HOST`/`SERVER_USER`/`SSH_PRIVATE_KEY`; DB- und Authentik-Werte ausschließlich in `/etc/fsrfb4aas/fsrfb4aas.env` (`deploy/fsrfb4aas.env.example`, `deploy/fsrfb4aas.service` `EnvironmentFile=`) | **bestanden** (statisch) |
| EF-Migrationen ohne manuellen Schritt | `DbInitializer` als Hosted Service migriert beim Start; Workflow enthält bewusst keinen Migrationsschritt | **bestanden** (statisch) |
| Server-Einrichtung dokumentiert und nachvollziehbar | `deploy/README.md` — Nutzer/Verzeichnisse, .NET-Laufzeit, PostgreSQL-Setup, Secrets, systemd, Firewall, nginx/TLS, sudo-Beschränkung, Onboarding/Offboarding | **bestanden** (statisch) |
| Produktive Domain im Vertrag und in der App gleich | `api-contract.yaml` `servers[0].url` = `https://api.fb4.it/v1`, `app/src/config.ts` + `app/app.json` Default ebenso | **bestanden** (statisch) |

## 2. Erste echte Auslieferung

Erstmals durchgeführt 2026-09-03 (VPS `ubuntu-4gb-nbg1-1`, Hetzner nbg1).

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Server nach `deploy/README.md` Abschnitt 2 eingerichtet | manuell auf dem Hetzner-VPS (Dienstnutzer, PostgreSQL-Rolle/DB `fsrfb4aas`, `.env`, systemd, nginx, certbot) | **bestanden** |
| GitHub-Secrets gesetzt, Deploy-Schlüsselpaar angelegt | `SERVER_HOST`/`SERVER_USER`/`SSH_PRIVATE_KEY`; ed25519 **ohne Passphrase** (zwei Fehlversuche mit passphrasegeschütztem Schlüssel — `cmd.exe` nimmt `-N ''` als literale Passphrase; Lehre in `deploy/README.md` Abschnitt 3 festgehalten) | **bestanden** |
| Deployment läuft durch | GitHub Actions „Deploy Backend (Hetzner)" | **teilweise** — Übertragung, Umschalten, Dienststart erfolgreich; der Workflow-Schritt scheiterte am Health-Check (fester `sleep 4` vor der Migration/Seed des Erststarts). Behoben: Health-Check pollt jetzt bis 120 s. |
| `https://api.fb4.it/health` liefert `status: ok` mit Version und Job-Ständen (API-F-260) | `curl` nach dem Deployment | **bestanden** — `version 1.0.0+dbf0950`, TLS über nginx/Let’s Encrypt |
| Erster INT-015-Job-Lauf füllt den Speiseplan-Zwischenspeicher, sichtbar im `/health` | Beobachtung nach dem Deployment | **bestanden** — `mensa-speiseplan` `succeeded: true`, `verwaltungsprotokoll-aufraeumen` `succeeded: true` |
| Rollback (voriger Commit erneut ausgeliefert) getestet | `deploy/README.md` Abschnitt 7 | **ausstehend** |

## 3. Verwaltungsoberfläche unter /admin (ADR 0018)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Web-Export trägt das `/admin`-Präfix | `app/app.json` `experiments.baseUrl='/admin'`; lokaler `npx expo export --platform web` am 2026-09-04 → `index.html` referenziert `/admin/_expo/static/js/web/entry-*.js` | **bestanden** |
| Workflow baut den Export nach `wwwroot/admin` und prüft ihn | `.github/workflows/deploy.yml` Schritt „Verwaltungsoberfläche bauen" (+ `test -f index.html`, `grep /admin/_expo/`) | **bestanden** (statisch) |
| `dotnet publish` nimmt `wwwroot/admin` auf | Web-SDK-Standard-Glob `wwwroot/**`, Export läuft vor `dotnet publish` | **bestanden** (statisch) |
| Backend liefert die Seite aus | `Program.cs` — `UseDefaultFiles`/`UseStaticFiles`/`MapFallback` unter `RequestPath=/admin` wenn `wwwroot/admin` existiert | **bestanden** (statisch) |
| Aufruf ohne Schrägstrich | `deploy/nginx-fsrfb4aas.conf` — `location = /admin { return 308 /admin/; }` | **bestanden** (statisch) |
| `https://api.fb4.it/admin` lädt im Browser | Aufruf nach dem Deploy | **ausstehend** — nächster Deploy |
| Browser-Anmeldung gegen Authentik | `https://api.fb4.it/admin` als Redirect-URI in der Authentik-Anwendung `fb4-app` eintragen, dann Login → Rolle → Rollenliste | **ausstehend** — Betriebseinstellung in Authentik |

## 4. Sicherung (API-N-160 bis API-N-180)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Täglicher `pg_dump` auf organisatorisch getrenntes Ziel (Storage Box) eingerichtet | `deploy/README.md` Abschnitt 6, systemd-Timer `fsrfb4aas-backup.timer` | **ausstehend** — Storage-Box-Zugang nötig |
| Wiederherstellungsprobe in Testumgebung | je Semester, eigenes Prüfprotokoll (API-N-180) | **ausstehend** |

Bewertung: Der automatisierte Auslieferungsweg ist im Repository beschrieben,
statisch geprüft und am 2026-09-03 erstmals real ausgeführt — das Backend läuft
unter `https://api.fb4.it` mit funktionierenden Hintergrund-Jobs. API-N-200 gilt
als nachgewiesen. Die Verwaltungsoberfläche (Abschnitt 3) ist im Auslieferungsweg
verdrahtet und der Export lokal verifiziert; die Browser-Abnahme folgt mit dem
nächsten Deploy. Offen bleiben Rollback-Probe (Abschnitt 2), Authentik-Redirect-URI
für den Admin-Login (Abschnitt 3) und die Sicherung auf getrenntem Ziel (Abschnitt 4).
