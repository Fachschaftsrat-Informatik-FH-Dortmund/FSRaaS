# Betrieb und Auslieferung des Backends

Runbook für den Backend-Dienst `fsrfb4aas` auf dem Hetzner-VPS. Spec-Grundlage:
`../specs/platform/backend-and-api.md` Abschnitt 6 (API-N-200 automatisierte
Auslieferung, API-N-090 Betriebszustand, API-N-160 bis API-N-190 Sicherung und
Zugriff) und `../specs/decisions/0017-zugriff-und-datensicherung-vps.md`.

- Produktive Domain: **`api.fb4.it`** (Wildcard-DNS `*.fb4.it` auf den VPS).
- Dienst / Linux-Nutzer / DB / Pfade: **`fsrfb4aas`**.
- Die veröffentlichte Assembly heißt weiterhin `Fb4.Backend.dll` und der
  Konfigurationsschlüssel der Verbindungszeichenfolge weiterhin `Fb4` — beides
  sind Code-Bezeichner, keine Betriebsnamen.

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
              scp  ──►  /opt/fsrfb4aas/incoming   (auf dem VPS)
                                    │
   ssh: systemctl stop → nach /var/www/fsrfb4aas verschieben → chown → start → /health prüfen
```

- Auslöser: **nur ein grüner CI-Lauf auf `main`** (`workflow_run`), oder manuell
  über *Actions → Deploy Backend (Hetzner) → Run workflow*.
- EF-Core-Migrationen laufen beim Dienststart automatisch über den
  `DbInitializer` — kein eigener Migrationsschritt.
- Nach dem Neustart pollt der Job `/health` bis zu 120 s (der erste Start macht
  Migration + Seed). Kommt es nicht hoch, bricht er mit `systemctl status` und
  den letzten 80 Journal-Zeilen ab. Der alte Stand ist dann schon weg —
  Rollback: Abschnitt 7.

---

## 2. Server-Ersteinrichtung (einmalig)

Alles als Nutzer mit `sudo` auf dem VPS (`fsr@…`). Reihenfolge einhalten.

### 2.1 Dienstnutzer und Verzeichnisse

```bash
# Dienstkonto — führt die Anwendung aus, kein Login, kein Home
sudo useradd --system --no-create-home --shell /usr/sbin/nologin fsrfb4aas

sudo mkdir -p /var/www/fsrfb4aas /var/lib/fsrfb4aas /var/log/fsrfb4aas /etc/fsrfb4aas /opt/fsrfb4aas
sudo chown -R fsrfb4aas:fsrfb4aas /var/www/fsrfb4aas /var/lib/fsrfb4aas /var/log/fsrfb4aas
sudo chmod 750 /etc/fsrfb4aas
```

### 2.2 .NET-Laufzeit prüfen

```bash
dotnet --list-runtimes | grep Microsoft.AspNetCore.App
```

Erwartet: `Microsoft.AspNetCore.App 9.x` (auf dem VPS vorhanden: 9.0.17). Das
Deployment ist framework-dependent. Fehlt die Laufzeit:

```bash
sudo apt-get update && sudo apt-get install -y aspnetcore-runtime-9.0
```

### 2.3 Datenbank einrichten

PostgreSQL läuft bereits auf dem VPS. Nur Rolle und Datenbank `fsrfb4aas` anlegen,
minimal berechtigt, nur lokal erreichbar.

```bash
# 1. Passwort-Hash-Verfahren prüfen (scram-sha-256 ist Default seit PG 14)
sudo -u postgres psql -c "SHOW password_encryption;"      # erwartet: scram-sha-256
```

```bash
# 2. Passwort erzeugen und sofort notieren — kommt in die .env UND ins Vaultwarden-Depot
openssl rand -base64 24
```

```bash
# 3. Rolle + Datenbank. Das Passwort aus Schritt 2 einsetzen.
sudo -u postgres psql <<'SQL'
CREATE ROLE fsrfb4aas WITH LOGIN PASSWORD 'ERZEUGTES_PASSWORT_HIER';
CREATE DATABASE fsrfb4aas OWNER fsrfb4aas ENCODING 'UTF8' TEMPLATE template0;
\connect fsrfb4aas
-- öffentliches Schema abschotten, nur die Rolle fsrfb4aas darf darin arbeiten
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO fsrfb4aas;
ALTER DATABASE fsrfb4aas SET timezone TO 'Europe/Berlin';
SQL
```

```bash
# 4. Zugang auf genau diese Rolle/DB von localhost beschränken
HBA=$(sudo -u postgres psql -tAc 'SHOW hba_file;')
printf 'host    fsrfb4aas    fsrfb4aas    127.0.0.1/32    scram-sha-256\nhost    fsrfb4aas    fsrfb4aas    ::1/128         scram-sha-256\n' | sudo tee -a "$HBA"
sudo systemctl reload postgresql
```

```bash
# 5. Gegenproben
sudo ss -tlnp | grep 5432    # nur 127.0.0.1:5432 und ::1:5432 — niemals 0.0.0.0
PGPASSWORD='ERZEUGTES_PASSWORT_HIER' psql -h 127.0.0.1 -U fsrfb4aas -d fsrfb4aas -c '\conninfo'
```

Läuft PostgreSQL im Container / auf anderem Host: statt der `pg_hba`-Zeilen den
Netzzugang dort einschränken und `Host=` in der `.env` anpassen.

### 2.4 Geheimnisse — `/etc/fsrfb4aas/fsrfb4aas.env`

Vorlage: [`fsrfb4aas.env.example`](fsrfb4aas.env.example). Auf den Server bringen:

```bash
# aus einem Repo-Checkout auf dem Server:
sudo install -m 640 -o root -g fsrfb4aas deploy/fsrfb4aas.env.example /etc/fsrfb4aas/fsrfb4aas.env
sudo nano /etc/fsrfb4aas/fsrfb4aas.env
```

Endzustand (Werte einsetzen, keine Anführungszeichen, kein `export`):

```ini
ConnectionStrings__Fb4=Host=localhost;Port=5432;Database=fsrfb4aas;Username=fsrfb4aas;Password=<DB-Passwort aus 2.3>

Authentik__Authority=https://auth.tobtech.de/application/o/fb4-app/
Authentik__Audience=fb4-app
Authentik__RedaktionGruppe=FSR-Redaktion
Authentik__ModerationGruppe=Moderation
Authentik__ManagementApiBaseUrl=https://auth.tobtech.de/api/v3/
Authentik__ManagementApiToken=<Authentik-Dienstkonto-Token>
```

`ConnectionStrings__Fb4` behält den Schlüssel `Fb4` (der Backend-Code liest
`GetConnectionString("Fb4")`); Datenbank und Rolle heißen `fsrfb4aas`.
`fb4-app` ist der Slug der Authentik-Anwendung — bleibt ebenfalls.

Datei ist `root:fsrfb4aas 0640` — der Dienst liest sie, sonst niemand. Dieselben
Werte ins Vaultwarden-/Bitwarden-Organisationsdepot (ADR 0017).

`Authentik__Management*` weglassen ist zulässig — dann meldet nur die Rollenpflege
(ADMIN-F-070) sich als nicht verfügbar (503), der Rest läuft.

### 2.5 systemd-Dienst

```bash
sudo cp deploy/fsrfb4aas.service /etc/systemd/system/fsrfb4aas.service
sudo systemctl daemon-reload
sudo systemctl enable fsrfb4aas
```

Noch **nicht** starten — `/var/www/fsrfb4aas` ist bis zum ersten Deployment leer.

### 2.6 Deploy-Nutzer und eingeschränktes sudo

Empfohlen: ein eigenes, schlüssel-only Konto `deploy-fsrfb4aas` nur für die CI —
getrennt von den persönlichen `sudo`-Konten (ADR 0017: Offboarding = Schlüssel
entfernen, ohne ein Menschenkonto anzufassen). Wer es einfacher will, legt den
Deploy-Key in `~/.ssh/authorized_keys` eines bestehenden Kontos (z. B. `fsr`) und
setzt unten überall dessen Namen ein; alles andere bleibt gleich.

```bash
sudo useradd --create-home --shell /bin/bash deploy-fsrfb4aas
sudo -u deploy-fsrfb4aas install -d -m 700 /home/deploy-fsrfb4aas/.ssh
# öffentlichen Deploy-Schlüssel eintragen (Erzeugung: Abschnitt 3):
echo 'ssh-ed25519 AAAA... deploy@fsrfb4aas-ci' | sudo -u deploy-fsrfb4aas tee -a /home/deploy-fsrfb4aas/.ssh/authorized_keys
sudo -u deploy-fsrfb4aas chmod 600 /home/deploy-fsrfb4aas/.ssh/authorized_keys

# Staging-Verzeichnis dem Deploy-Nutzer geben (Nachtrag zu 2.1):
sudo chown deploy-fsrfb4aas:deploy-fsrfb4aas /opt/fsrfb4aas
sudo -u deploy-fsrfb4aas mkdir -p /opt/fsrfb4aas/incoming
```

Nur die für den Rollout nötigen Befehle ohne Passwort erlauben. Das Staging
selbst (`/opt/fsrfb4aas/incoming` anlegen und befüllen) läuft ohne sudo, weil der
Nutzer `/opt/fsrfb4aas` besitzt:

```bash
sudo tee /etc/sudoers.d/deploy-fsrfb4aas > /dev/null <<'EOF'
deploy-fsrfb4aas ALL=(root) NOPASSWD: /usr/bin/systemctl stop fsrfb4aas, /usr/bin/systemctl start fsrfb4aas, /usr/bin/systemctl restart fsrfb4aas, /usr/bin/rm -rf /var/www/fsrfb4aas, /usr/bin/mv /opt/fsrfb4aas/incoming /var/www/fsrfb4aas, /usr/bin/chown -R fsrfb4aas\:fsrfb4aas /var/www/fsrfb4aas, /usr/bin/journalctl -u fsrfb4aas *
EOF
sudo visudo -c -f /etc/sudoers.d/deploy-fsrfb4aas
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
sudo cp deploy/nginx-fsrfb4aas.conf /etc/nginx/sites-available/api.fb4.it
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
| `SERVER_USER` | `deploy-fsrfb4aas` (oder das in 2.6 gewählte Konto) |
| `SSH_PRIVATE_KEY` | privater Schlüssel des Deploy-Paars, vollständig mit `-----BEGIN…` / `-----END…` |

Deploy-Schlüsselpaar lokal erzeugen — **ohne Passphrase** (die CI kann keine
eingeben). Danach mit `ssh-keygen -y -f ./deploy-fsrfb4aas` prüfen: gibt es
sofort den Public Key aus statt nach einer Passphrase zu fragen, ist er richtig.

```bash
# Linux / macOS / Git-Bash:
ssh-keygen -t ed25519 -f ./deploy-fsrfb4aas -C deploy@fsrfb4aas-ci -N ''
```
```cmd
:: Windows cmd.exe — hier ist '' eine LITERALE Passphrase; doppelte Quotes nehmen:
ssh-keygen -t ed25519 -f deploy-fsrfb4aas -C deploy@fsrfb4aas-ci -N ""
```
```
  ./deploy-fsrfb4aas.pub  → authorized_keys von deploy-fsrfb4aas auf dem Server (Abschnitt 2.6)
  ./deploy-fsrfb4aas      → GitHub-Secret SSH_PRIVATE_KEY, danach lokal löschen
```

Bei einem bereits erzeugten, passphrasegeschützten Schlüssel:
`ssh-keygen -p -f ./deploy-fsrfb4aas` und bei „new passphrase" zweimal Enter —
der Public Key bleibt gleich, nur das Secret muss neu gesetzt werden.

Die Produktiv-Geheimnisse (DB-Passwort, Authentik-Token) gehören **nicht** zu
GitHub — nur nach `/etc/fsrfb4aas/fsrfb4aas.env` und ins Vaultwarden-Depot
(SEC-N-110, ADR 0017).

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
sudo systemctl status fsrfb4aas
```

`/health` nennt Version und je Hintergrund-Job den letzten Lauf (API-F-260).
Der erste Mensa-Speiseplan-Lauf (INT-015) kann einige Minuten dauern.

Die App zeigt standardmäßig auf `https://api.fb4.it/v1` (`app/src/config.ts`,
`app/app.json`). Für lokale Tests gegen ein anderes Ziel:
`EXPO_PUBLIC_API_BASE_URL=https://… npx expo start`.

### 4.1 Verwaltungsoberfläche (ADR 0018)

Der Deploy baut den Expo-Web-Export (`experiments.baseUrl='/admin'` in
`app/app.json`) nach `wwwroot/admin`; das Backend liefert ihn unter
`https://api.fb4.it/admin` aus, der Reverse-Proxy leitet `/admin` → `/admin/`.
Kein zusätzlicher Schritt auf dem Server.

Einmalig in **Authentik** nötig, damit der Browser-Login durchläuft: in der
Anwendung `fb4-app` die Redirect-URI `https://api.fb4.it/admin` (und
`https://api.fb4.it/admin/`) ergänzen — sonst bricht der OIDC-Rücksprung ab.

Prüfen: `curl -fsS https://api.fb4.it/admin/ | grep -o '/admin/_expo[^"]*'` muss
den JS-Pfad zeigen; im Browser lädt die Oberfläche.

---

## 5. Laufender Betrieb

```bash
sudo systemctl status fsrfb4aas
sudo journalctl -u fsrfb4aas -f                 # Live-Log
sudo journalctl -u fsrfb4aas --since '1 hour ago'
sudo systemctl restart fsrfb4aas                # Neustart ohne Deployment
curl -fsS https://api.fb4.it/health | jq
```

Konfiguration in `/etc/fsrfb4aas/fsrfb4aas.env` geändert? → `sudo systemctl restart fsrfb4aas`.

---

## 6. Sicherung (API-N-160 bis API-N-180)

Zusätzlich zum automatischen Hetzner-Server-Backup ein täglicher `pg_dump` auf
eine räumlich getrennte Hetzner Storage Box (RPO ≤ 24 h):

```bash
sudo tee /usr/local/bin/fsrfb4aas-pg-backup.sh > /dev/null <<'EOF'
#!/bin/bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
DUMP="/var/backups/fsrfb4aas-${STAMP}.dump"
sudo -u postgres pg_dump -Fc fsrfb4aas > "$DUMP"
find /var/backups -name 'fsrfb4aas-*.dump' -mtime +14 -delete
# auf die Storage Box spiegeln (SFTP/rsync-Zugang der Box vorausgesetzt):
rsync -e 'ssh -p 23' /var/backups/fsrfb4aas-*.dump uXXXXXX@uXXXXXX.your-storagebox.de:fsrfb4aas/
EOF
sudo chmod +x /usr/local/bin/fsrfb4aas-pg-backup.sh
sudo mkdir -p /var/backups
```

```bash
sudo tee /etc/systemd/system/fsrfb4aas-backup.service > /dev/null <<'EOF'
[Unit]
Description=fsrfb4aas PostgreSQL-Dump
[Service]
Type=oneshot
ExecStart=/usr/local/bin/fsrfb4aas-pg-backup.sh
EOF
sudo tee /etc/systemd/system/fsrfb4aas-backup.timer > /dev/null <<'EOF'
[Unit]
Description=Taeglicher fsrfb4aas-Dump
[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true
[Install]
WantedBy=timers.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now fsrfb4aas-backup.timer
```

Wiederherstellungsprobe je Semester in einer Testumgebung, datiertes Prüfprotokoll
unter `../specs/pruefprotokolle/` (API-N-180).

Wiederherstellung:

```bash
sudo systemctl stop fsrfb4aas
sudo -u postgres dropdb fsrfb4aas && sudo -u postgres createdb -O fsrfb4aas fsrfb4aas
sudo -u postgres pg_restore -d fsrfb4aas --no-owner /var/backups/fsrfb4aas-<STAMP>.dump
sudo systemctl start fsrfb4aas
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
(GitHub-Actions-Artefakt oder lokales `dotnet publish`) nach
`/opt/fsrfb4aas/incoming` schieben, dann:

```bash
sudo systemctl stop fsrfb4aas
sudo rm -rf /var/www/fsrfb4aas
sudo mv /opt/fsrfb4aas/incoming /var/www/fsrfb4aas
sudo chown -R fsrfb4aas:fsrfb4aas /var/www/fsrfb4aas
mkdir -p /opt/fsrfb4aas/incoming
sudo systemctl start fsrfb4aas
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
| DB-Passwort | `sudo -u postgres psql -c "ALTER ROLE fsrfb4aas WITH PASSWORD '…';"` → `/etc/fsrfb4aas/fsrfb4aas.env` → `sudo systemctl restart fsrfb4aas` |
| Authentik-Management-Token | in Authentik neu ausstellen → `.env` → Neustart |
| Deploy-Schlüsselpaar | neues Paar; `authorized_keys` von `deploy-fsrfb4aas` ersetzen; GitHub-Secret `SSH_PRIVATE_KEY` ersetzen |
| Hetzner-Konsole / Storage-Box | in der Hetzner-Oberfläche |

Beim jährlichen FSR-Technik-Wechsel ohnehin alle vier.

---

## 9. Android-Testbuild-Direktdownload

Informeller, vorübergehender Testkanal für Zwischenstände der Android-App vor
der eigentlichen Store-Auslieferung (Roadmap Schritt 10) — kein Ersatz für App
Store/Play Store/F-Droid (ADR 0008). Spec-Grundlage:
`../openspec/specs/android-test-distribution/spec.md`.

```
Actions → Android-Testbuild (Direktdownload) → Run workflow   (nur manuell)
                                    │
   expo prebuild + gradlew assembleRelease (auf dem GitHub-Runner)
                                    │
        Monotonie-Prüfung (SSH: app-latest.versioncode vs. neuer versionCode)
                                    │
              scp app-latest.apk  ──►  /var/www/fsrfb4aas-downloads/
                                    │
                    ssh: app-latest.versioncode aktualisieren
```

Download-URL: `https://api.fb4.it/downloads/app-latest.apk` — öffentlich, ohne
GitHub-Anmeldung.

### 9.1 Versions-Bump vor einem neuen Testbuild

Der Workflow bricht ab, wenn der `versionCode` nicht strikt größer ist als der
des zuletzt veröffentlichten Testbuilds (Sidecar-Datei
`app-latest.versioncode`). Vor jedem neuen Testbuild:

1. In `app/app.json` `expo.android.versionCode` erhöhen (und bei Bedarf
   `expo.version`/`versionName`).
2. `npx expo prebuild --platform android` lokal ausführen.
3. Den resultierenden Diff in `android/app/build.gradle` (nur der
   `versionCode`/`versionName`-Wert sollte sich ändern) im selben Merge wie die
   `app.json`-Änderung committen.
4. Erst danach den Workflow auslösen.

`app.json` ist die Quelle der Wahrheit — `android/app/build.gradle` folgt ihr,
nie umgekehrt.

### 9.2 Ersteinrichtung des Downloads-Verzeichnisses (einmalig)

Auf dem VPS, als Nutzer mit `sudo`. Eigentümer ist bewusst der Deploy-Nutzer
selbst (nicht `fsrfb4aas`), analog zu `/opt/fsrfb4aas/incoming` (Abschnitt
2.6) — dadurch erreicht `deploy.yml`s `sudo rm -rf /var/www/fsrfb4aas` dieses
Verzeichnis strukturell nicht (anderer Pfad, anderer Eigentümer):

```bash
sudo mkdir -p /var/www/fsrfb4aas-downloads
sudo chown deploy-fsrfb4aas:deploy-fsrfb4aas /var/www/fsrfb4aas-downloads
ls -la /var/www/   # Eigentümer gegenprüfen
```

Anschließend die neue `location /downloads/` aus
[`nginx-fsrfb4aas.conf`](nginx-fsrfb4aas.conf) ausrollen (derselbe
`server_name`, kein neues Zertifikat nötig):

```bash
sudo cp deploy/nginx-fsrfb4aas.conf /etc/nginx/sites-available/api.fb4.it
sudo nginx -t && sudo systemctl reload nginx
curl -I https://api.fb4.it/downloads/app-latest.apk   # 404 ist vor dem ersten Testbuild korrekt
```

### 9.3 Upload-Keystore (einmalig, außerhalb dieses Repos)

Der Upload-Keystore selbst wird lokal erzeugt und nie ins Repo aufgenommen:

```bash
keytool -genkeypair -v -keystore upload.keystore -alias fb4-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Danach `upload.keystore` **und** die drei Passwörter/den Alias in das
Vaultwarden-Depot des FSR-Vorstands legen (Backup — geht die Datei verloren,
verweigert Android jede weitere Installation über eine bestehende
Test-Installation hinweg, siehe design.md „Risks").

### 9.4 GitHub-Secrets (zusätzlich zu Abschnitt 3)

*Settings → Secrets and variables → Actions → New repository secret*

| Secret | Wert |
|---|---|
| `ANDROID_RELEASE_KEYSTORE_BASE64` | `base64 -w0 upload.keystore` |
| `ANDROID_RELEASE_STORE_PASSWORD` | Store-Passwort des Upload-Keystores |
| `ANDROID_RELEASE_KEY_ALIAS` | Key-Alias, z. B. `fb4-upload` |
| `ANDROID_RELEASE_KEY_PASSWORD` | Key-Passwort |

`SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY` werden von Abschnitt 3
wiederverwendet — derselbe Deploy-Zugang wie beim Backend-Deployment.

**Rotation:** Wie in Abschnitt 8 — beim jährlichen FSR-Technik-Wechsel und bei
jedem Ausscheiden einer Person mit Zugriff auf das Vaultwarden-Depot rotieren
alle vier Werte (neuer Keystore bedeutet aber einen Signaturwechsel, siehe
9.3 — in der Praxis rotieren meist nur die drei Passwort-/Alias-Secrets, ohne
den Keystore selbst zu ersetzen).
