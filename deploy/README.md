# Betrieb und Auslieferung des Backends

Runbook für den FB4-Backend-Dienst auf dem Hetzner-VPS. Spec-Grundlage:
`../specs/platform/backend-and-api.md` Abschnitt 6 (API-N-200 automatisierte
Auslieferung, API-N-090 Betriebszustand, API-N-160 bis API-N-190 Sicherung und
Zugriff) und `../specs/decisions/0017-zugriff-und-datensicherung-vps.md`.

Produktive Domain: **`api.fb4.it`** (Wildcard-DNS `*.fb4.it` auf den VPS).

Ziel dieses Dokuments: Der Betrieb hängt an keinem einzelnen Kopf. Wer den
Zugang hat und dieses Dokument liest, kann ausliefern, wiederherstellen und
übergeben.

---

## 1. Wie ein Deployment abläuft

```
push auf main  ──►  CI (.github/workflows/ci.yml)  ──►  grün?
                                                          │ ja
                          .github/workflows/deploy.yml  ◄──┘
                                    │
   build + test + expo-web-export + dotnet publish (auf dem GitHub-Runner)
                                    │
              scp  ──►  /opt/fb4/incoming   (auf dem VPS)
                                    │
   ssh: systemctl stop fb4 → nach /var/www/fb4 verschieben → chown fb4 → start → /health prüfen
```

- Auslöser: **nur ein grüner CI-Lauf auf `main`** (`workflow_run`), oder manuell
  über *Actions → Deploy Backend (Hetzner) → Run workflow*.
- EF-Core-Migrationen laufen beim Dienststart automatisch über den
  `DbInitializer` — kein eigener Migrationsschritt.
- Schlägt `/health` nach dem Neustart fehl, bricht der Job mit den letzten
  60 Journal-Zeilen ab. Der alte Stand ist dann schon weg — Rollback: Abschnitt 7.

---

## 2. Server-Ersteinrichtung (einmalig)

Alles als Nutzer mit `sudo` auf dem VPS (`fsr@…`). Reihenfolge einhalten.

### 2.1 Dienstnutzer und Verzeichnisse

```bash
# Dienstkonto — läuft die Anwendung, kein Login, kein Home
sudo useradd --system --no-create-home --shell /usr/sbin/nologin fb4

sudo mkdir -p /var/www/fb4 /var/lib/fb4 /var/log/fb4 /etc/fb4 /opt/fb4
sudo chown -R fb4:fb4 /var/www/fb4 /var/lib/fb4 /var/log/fb4
sudo chmod 750 /etc/fb4
```

### 2.2 .NET-Laufzeit prüfen

```bash
dotnet --list-runtimes | grep Microsoft.AspNetCore.App
```

Erwartet: `Microsoft.AspNetCore.App 9.x` (bereits vorhanden: 9.0.17). Das
Deployment ist framework-dependent. Fehlt die Laufzeit:

```bash
sudo apt-get update && sudo apt-get install -y aspnetcore-runtime-9.0
```

### 2.3 Datenbank einrichten

PostgreSQL läuft bereits auf dem VPS. Nur Rolle und Datenbank für FB4 anlegen,
minimal berechtigt, nur lokal erreichbar.

```bash
# 1. Passwort-Hash-Verfahren prüfen (scram-sha-256 ist Default seit PG 14)
sudo -u postgres psql -c "SHOW password_encryption;"      # erwartet: scram-sha-256
```

```bash
# 2. Passwort erzeugen und sofort notieren — kommt in fb4.env UND ins Vaultwarden-Depot
openssl rand -base64 24
```

```bash
# 3. Rolle + Datenbank. Das Passwort aus Schritt 2 einsetzen.
sudo -u postgres psql <<'SQL'
CREATE ROLE fb4 WITH LOGIN PASSWORD 'ERZEUGTES_PASSWORT_HIER';
CREATE DATABASE fb4 OWNER fb4 ENCODING 'UTF8' TEMPLATE template0;
\connect fb4
-- öffentliches Schema abschotten, nur fb4 darf darin arbeiten
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO fb4;
ALTER DATABASE fb4 SET timezone TO 'Europe/Berlin';
SQL
```

```bash
# 4. Zugang auf genau diese Rolle/DB von localhost beschränken
HBA=$(sudo -u postgres psql -tAc 'SHOW hba_file;')
printf 'host    fb4    fb4    127.0.0.1/32    scram-sha-256\nhost    fb4    fb4    ::1/128         scram-sha-256\n' | sudo tee -a "$HBA"
sudo systemctl reload postgresql
```

```bash
# 5. Gegenproben
sudo ss -tlnp | grep 5432    # nur 127.0.0.1:5432 und ::1:5432 — niemals 0.0.0.0
PGPASSWORD='ERZEUGTES_PASSWORT_HIER' psql -h 127.0.0.1 -U fb4 -d fb4 -c '\conninfo'
```

Läuft PostgreSQL im Container / auf anderem Host: statt der `pg_hba`-Zeilen den
Netzzugang dort einschränken und `Host=` in `fb4.env` anpassen.

### 2.4 Geheimnisse — `/etc/fb4/fb4.env`

Vorlage: [`fb4.env.example`](fb4.env.example). Auf den Server bringen:

```bash
# aus einem Repo-Checkout auf dem Server:
sudo install -m 640 -o root -g fb4 deploy/fb4.env.example /etc/fb4/fb4.env
sudo nano /etc/fb4/fb4.env
```

Endzustand (Werte einsetzen, keine Anführungszeichen, kein `export`):

```ini
ConnectionStrings__Fb4=Host=localhost;Port=5432;Database=fb4;Username=fb4;Password=<DB-Passwort aus 2.3>

Authentik__Authority=https://auth.tobtech.de/application/o/fb4-app/
Authentik__Audience=fb4-app
Authentik__RedaktionGruppe=FSR-Redaktion
Authentik__ModerationGruppe=Moderation
Authentik__ManagementApiBaseUrl=https://auth.tobtech.de/api/v3/
Authentik__ManagementApiToken=<Authentik-Dienstkonto-Token>
```

Datei ist `root:fb4 0640` — der Dienst liest sie, sonst niemand. Dieselben Werte
ins Vaultwarden-/Bitwarden-Organisationsdepot (ADR 0017).

`Authentik__Management*` weglassen ist zulässig — dann meldet nur die Rollenpflege
(ADMIN-F-070) sich als nicht verfügbar (503), der Rest läuft.

### 2.5 systemd-Dienst

```bash
sudo cp deploy/fb4.service /etc/systemd/system/fb4.service
sudo systemctl daemon-reload
sudo systemctl enable fb4
```

Noch **nicht** starten — `/var/www/fb4` ist bis zum ersten Deployment leer.

### 2.6 Deploy-Nutzer und eingeschränktes sudo

Empfohlen: ein eigenes, schlüssel-only Konto `deploy-fb4` nur für die CI —
getrennt von den persönlichen `sudo`-Konten (ADR 0017: Offboarding = Schlüssel
entfernen, ohne ein Menschenkonto anzufassen). Wer es einfacher will, legt den
Deploy-Key in `~/.ssh/authorized_keys` eines bestehenden Kontos (z. B. `fsr`) und
setzt unten überall dessen Namen ein; alles andere bleibt gleich.

```bash
sudo useradd --create-home --shell /bin/bash deploy-fb4
sudo -u deploy-fb4 install -d -m 700 /home/deploy-fb4/.ssh
# öffentlichen Deploy-Schlüssel eintragen (Erzeugung: Abschnitt 3):
echo 'ssh-ed25519 AAAA... deploy@fb4-ci' | sudo -u deploy-fb4 tee -a /home/deploy-fb4/.ssh/authorized_keys
sudo -u deploy-fb4 chmod 600 /home/deploy-fb4/.ssh/authorized_keys

# jetzt /opt/fb4 dem Deploy-Nutzer geben (Nachtrag zu 2.1):
sudo chown deploy-fb4:deploy-fb4 /opt/fb4
sudo -u deploy-fb4 mkdir -p /opt/fb4/incoming
```

Nur die für den Rollout nötigen Befehle ohne Passwort erlauben. Das Staging
selbst (`/opt/fb4/incoming` anlegen und befüllen) läuft ohne sudo, weil der
Nutzer `/opt/fb4` besitzt:

```bash
sudo tee /etc/sudoers.d/deploy-fb4 > /dev/null <<'EOF'
deploy-fb4 ALL=(root) NOPASSWD: /usr/bin/systemctl stop fb4, /usr/bin/systemctl start fb4, /usr/bin/systemctl restart fb4, /usr/bin/rm -rf /var/www/fb4, /usr/bin/mv /opt/fb4/incoming /var/www/fb4, /usr/bin/chown -R fb4\:fb4 /var/www/fb4, /usr/bin/journalctl -u fb4 *
EOF
sudo visudo -c -f /etc/sudoers.d/deploy-fb4
```

Pfade prüfen, falls die Distribution abweicht: `command -v systemctl rm mv chown journalctl`
(auf Ubuntu 24.04 alle unter `/usr/bin`).

### 2.7 Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'      # 80 + 443
sudo ufw enable
sudo ufw status                  # 5432 darf NICHT auftauchen
```

### 2.8 nginx und TLS

Wildcard-DNS `*.fb4.it` zeigt schon auf den VPS — `api.fb4.it` ist damit
erreichbar (`dig +short api.fb4.it` gegenprüfen).

```bash
sudo cp deploy/nginx-fb4.conf /etc/nginx/sites-available/api.fb4.it
sudo ln -s /etc/nginx/sites-available/api.fb4.it /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.fb4.it       # trägt ssl_* + http→https-Weiterleitung ein
```

`certbot` erneuert automatisch (systemd-Timer `certbot.timer`, `sudo certbot renew --dry-run`).

---

## 3. GitHub-Secrets (Repo `FSRaaS`)

*Settings → Secrets and variables → Actions → New repository secret*

| Secret | Wert |
|---|---|
| `SERVER_HOST` | IP oder Hostname des VPS |
| `SERVER_USER` | `deploy-fb4` (oder das in 2.6 gewählte Konto) |
| `SSH_PRIVATE_KEY` | privater Schlüssel des Deploy-Paars, vollständig mit `-----BEGIN…` / `-----END…` |

Deploy-Schlüsselpaar lokal erzeugen (nicht der persönliche Schlüssel):

```bash
ssh-keygen -t ed25519 -f ./deploy-fb4 -C 'deploy@fb4-ci' -N ''
#  ./deploy-fb4.pub  → authorized_keys von deploy-fb4 auf dem Server (Abschnitt 2.6)
#  ./deploy-fb4      → GitHub-Secret SSH_PRIVATE_KEY, danach lokal löschen
```

Die Produktiv-Geheimnisse (DB-Passwort, Authentik-Token) gehören **nicht** zu
GitHub — nur nach `/etc/fb4/fb4.env` und ins Vaultwarden-Depot (SEC-N-110, ADR 0017).

Optional: *Settings → Environments → `production`* mit *required reviewers* —
dann pausiert jeder Rollout bis zur Bestätigung. Der Workflow referenziert
`environment: production` bereits.

---

## 4. Erstes Deployment

1. Abschnitte 2 und 3 vollständig.
2. Auf `main` pushen (oder *Run workflow* manuell).
3. Nach grüner CI startet „Deploy Backend (Hetzner)" von selbst.
4. Prüfen:

```bash
curl -fsS https://api.fb4.it/health | jq
sudo systemctl status fb4
```

`/health` nennt Version und je Hintergrund-Job den letzten Lauf (API-F-260).
Der erste Mensa-Speiseplan-Lauf (INT-015) kann einige Minuten dauern.

Die App zeigt standardmäßig auf `https://api.fb4.it/v1` (`app/src/config.ts`,
`app/app.json`). Für lokale Tests gegen ein anderes Ziel:
`EXPO_PUBLIC_API_BASE_URL=https://… npx expo start`.

---

## 5. Laufender Betrieb

```bash
sudo systemctl status fb4
sudo journalctl -u fb4 -f                 # Live-Log
sudo journalctl -u fb4 --since '1 hour ago'
sudo systemctl restart fb4                # Neustart ohne Deployment
curl -fsS https://api.fb4.it/health | jq
```

Konfiguration in `/etc/fb4/fb4.env` geändert? → `sudo systemctl restart fb4`.

---

## 6. Sicherung (API-N-160 bis API-N-180)

Zusätzlich zum automatischen Hetzner-Server-Backup ein täglicher `pg_dump` auf
eine räumlich getrennte Hetzner Storage Box (RPO ≤ 24 h):

```bash
sudo tee /usr/local/bin/fb4-pg-backup.sh > /dev/null <<'EOF'
#!/bin/bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
DUMP="/var/backups/fb4-${STAMP}.dump"
sudo -u postgres pg_dump -Fc fb4 > "$DUMP"
find /var/backups -name 'fb4-*.dump' -mtime +14 -delete
# auf die Storage Box spiegeln (SFTP/rsync-Zugang der Box vorausgesetzt):
rsync -e 'ssh -p 23' /var/backups/fb4-*.dump uXXXXXX@uXXXXXX.your-storagebox.de:fb4/
EOF
sudo chmod +x /usr/local/bin/fb4-pg-backup.sh
sudo mkdir -p /var/backups
```

```bash
sudo tee /etc/systemd/system/fb4-backup.service > /dev/null <<'EOF'
[Unit]
Description=FB4 PostgreSQL-Dump
[Service]
Type=oneshot
ExecStart=/usr/local/bin/fb4-pg-backup.sh
EOF
sudo tee /etc/systemd/system/fb4-backup.timer > /dev/null <<'EOF'
[Unit]
Description=Taeglicher FB4-Dump
[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
[Install]
WantedBy=timers.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now fb4-backup.timer
```

Wiederherstellungsprobe je Semester in einer Testumgebung, datiertes Prüfprotokoll
unter `../specs/pruefprotokolle/` (API-N-180).

Wiederherstellung:

```bash
sudo systemctl stop fb4
sudo -u postgres dropdb fb4 && sudo -u postgres createdb -O fb4 fb4
sudo -u postgres pg_restore -d fb4 --no-owner /var/backups/fb4-<STAMP>.dump
sudo systemctl start fb4
```

---

## 7. Rollback

Der Workflow hält keinen Vorstand vor. Schnellster Weg zurück: den vorigen
grünen Commit erneut ausliefern.

```bash
# lokal
git revert <schlechter-commit>     # oder: git reset --hard <letzter-guter> && git push --force-with-lease
git push
```

Manuell auf dem Server (wenn die CI gerade nicht taugt): einen `publish`-Stand
(GitHub-Actions-Artefakt oder lokales `dotnet publish`) nach `/opt/fb4/incoming`
schieben, dann:

```bash
sudo systemctl stop fb4
sudo rm -rf /var/www/fb4
sudo mv /opt/fb4/incoming /var/www/fb4
sudo chown -R fb4:fb4 /var/www/fb4
mkdir -p /opt/fb4/incoming
sudo systemctl start fb4
```

---

## 8. Onboarding / Offboarding (API-N-190)

**Zugang geben:** benanntes Linux-Konto + individueller SSH-Key; Vaultwarden-Depot
freigeben; auf dieses Runbook verweisen.

**Zugang entziehen:** SSH-Key aus `authorized_keys` entfernen; Konto sperren
(`sudo usermod -L <konto>`); aus dem Vaultwarden-Depot entfernen; **alle
geteilten Geheimnisse rotieren:**

| Geheimnis | Rotation |
|---|---|
| DB-Passwort | `sudo -u postgres psql -c "ALTER ROLE fb4 WITH PASSWORD '…';"` → `/etc/fb4/fb4.env` → `sudo systemctl restart fb4` |
| Authentik-Management-Token | in Authentik neu ausstellen → `fb4.env` → Neustart |
| Deploy-Schlüsselpaar | neues Paar; `authorized_keys` von `deploy-fb4` ersetzen; GitHub-Secret `SSH_PRIVATE_KEY` ersetzen |
| Hetzner-Konsole / Storage-Box | in der Hetzner-Oberfläche |

Beim jährlichen FSR-Technik-Wechsel ohnehin alle vier.
