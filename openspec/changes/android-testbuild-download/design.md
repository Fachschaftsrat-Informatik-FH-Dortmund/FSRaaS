## Context

Siehe `proposal.md` – Why für die Motivation. Ausgangslage, die den Ansatz einschränkt:

- `app/android/app/build.gradle` kennt nur `signingConfigs.debug`; `buildTypes.release` signiert bewusst-provisorisch damit (Zeile 115).
- Es existiert noch kein Android-Build-Schritt in `.github/workflows/` — `ci.yml` baut und testet nur Backend/Contract, keinen Android-Build.
- `deploy.yml` liefert ausschließlich das Backend aus; sein VPS-Skript räumt `/var/www/fsrfb4aas` per `sudo rm -rf` weg und benötigt `sudo`, weil der Dienstnutzer `fsrfb4aas` nicht der Deploy-Nutzer ist. Dieses Muster (Secrets, `scp`/`ssh`-Actions, Zielverzeichnis) ist die einzige vorhandene Vorlage für Serverzugriff aus CI.
- `app/app.json` verwaltet bereits `expo.android.package` und `expo.android.permissions`, aber kein `versionCode`; die native Quelle (`android/app/build.gradle`) trägt ihn aktuell direkt.
- `app/android/gradle.properties` enthält bislang keine geheimen Werte — nur Build-Flags.

## Goals / Non-Goals

**Goals:**
- Ein `workflow_dispatch`-Workflow erzeugt eine mit einem dedizierten Upload-Keystore signierte Release-APK und legt sie unter einer festen, öffentlichen URL ab, ohne das Backend-Deployment zu berühren.
- Der `versionCode` jedes veröffentlichten Testbuilds ist automatisch und nachprüfbar strikt größer als der des vorherigen — ohne dass eine Person das von Hand sicherstellen muss.
- Das Zielverzeichnis auf dem VPS ist so isoliert, dass `deploy.yml` es nachweislich nie berührt.

**Non-Goals:**
- Kein reproduzierbarer, secret-loser Build (F-Droid-Anforderung) — bewusst nicht Ziel dieses Changes (siehe proposal.md – Impact).
- Keine Versionshistorie/Archivierung älterer Testbuilds — fester Dateiname, Überschreiben ist gewollt.
- Keine Verlinkung von der FSR-Webseite (separates Repo).

## Decisions

### Signing-Secrets als Umgebungsvariablen, nicht als eingecheckte `gradle.properties`

Der Workflow dekodiert das base64-kodierte Keystore-Secret in eine Datei im (flüchtigen) Runner-Workspace und setzt Store-Passwort, Key-Alias und Key-Passwort als Umgebungsvariablen, die die neue `signingConfigs.release`-Closure in `build.gradle` über `System.getenv(...)` liest (Standardmuster für React-Native-Release-Signing). Alternative — Secrets direkt in eine `keystore.properties` im Workspace schreiben und per `file(...)` laden — wurde verworfen, weil das eine zusätzliche Datei mit Klartext-Passwörtern auf Disk erzeugt, ohne Vorteil gegenüber Umgebungsvariablen.

Die vorhandene `signingConfigs.debug` bleibt unverändert bestehen; `buildTypes.release.signingConfig` wechselt von `signingConfigs.debug` auf die neue `signingConfigs.release`.

### `versionCode`-Monotonie über eine Sidecar-Datei, nicht über APK-Introspektion

Damit „strikt größer als der vorherige“ (Requirement in `specs/android-test-distribution/spec.md`) automatisch geprüft werden kann, legt der Workflow neben `app-latest.apk` eine zweite Datei `app-latest.versioncode` (reiner Text, der `versionCode`) im selben Verzeichnis ab. Vor dem Upload liest der Workflow diese Datei per SSH; existiert sie nicht (erster Lauf), gilt die Prüfung als bestanden. Ist der neue `versionCode` nicht strikt größer, bricht der Workflow ab, bevor irgendetwas hochgeladen wird.

Alternative — den `versionCode` aus der zuvor veröffentlichten APK selbst auslesen (`aapt dump badging`) — wurde verworfen: sie bräuchte zusätzlich die Android-Build-Tools auf dem VPS oder einen Rücktransport der alten APK zum Runner, für einen Wert, der ohnehin schon als Klartext in `app.json`/`build.gradle` vorliegt. Die Sidecar-Datei ist der einfachere Mechanismus mit demselben Ergebnis; sie ist kein Sicherheitsmerkmal (SSH-Zugriff hat ohnehin nur der FSR-Vorstand), sondern eine Prozesssicherung gegen versehentlich vergessene Versions-Bumps.

Reihenfolge beim Veröffentlichen: **zuerst** `app-latest.apk` hochladen/überschreiben, **danach** `app-latest.versioncode` aktualisieren — bricht der Upload der APK ab, bleibt die Sidecar-Datei auf dem alten, korrekten Stand stehen.

### Getrenntes VPS-Verzeichnis, direkt dem Deploy-Nutzer gehörend

`/var/www/fsrfb4aas-downloads/` gehört dem Deploy-Nutzer selbst (nicht `fsrfb4aas`), analog zu `/opt/fsrfb4aas/incoming`. Das erlaubt `scp` ohne anschließenden `sudo chown`/`ssh`-Schritt und macht durch die Namens- und Besitzverschiedenheit zu `/var/www/fsrfb4aas` strukturell sichtbar, dass `deploy.yml`s `sudo rm -rf /var/www/fsrfb4aas` dieses Verzeichnis nicht erreichen kann (anderer Pfad, anderer Eigentümer).

### Nginx liefert das Verzeichnis statisch aus, mit `Cache-Control: no-cache`

Neue `location /downloads/ { alias /var/www/fsrfb4aas-downloads/; add_header Cache-Control "no-cache"; }` in `deploy/nginx-fsrfb4aas.conf`. `no-cache` verhindert, dass Browser oder zwischengeschaltete Proxys eine ältere `app-latest.apk` unter demselben Dateinamen weiterhin ausliefern, nachdem ein neuer Testbuild veröffentlicht wurde (Requirement „Abruf durch eine testende Person“ verlangt implizit die *aktuelle* Version).

### Workflow-Auslösung ausschließlich `workflow_dispatch`

Kein `push`- oder `workflow_run`-Trigger — deckt das Requirement „Manuelle Auslösung“ direkt ab und unterscheidet den neuen Workflow strukturell von `deploy.yml` (das automatisch nach grüner CI läuft).

## Risks / Trade-offs

- [Upload-Keystore geht verloren] → Android verweigert danach die Installation eines neuen Testbuilds über eine bestehende App-Installation hinweg (Signaturwechsel). Mitigation: Keystore-Backup im Passwort-Depot des FSR-Vorstands, dokumentiert in `deploy/README.md` als Teil der Ersteinrichtung.
- [Sidecar-Datei und APK laufen auseinander, z. B. weil jemand manuell im Verzeichnis hantiert] → Monotonie-Prüfung greift ins Leere oder blockiert fälschlich. Mitigation: Reihenfolge APK-vor-Sidecar (s. o.); das Verzeichnis ist nur per SSH mit demselben Zugang wie das Backend erreichbar, kein zusätzlicher Angriffsvektor.
- [GitHub-Secrets für den Upload-Keystore verfallen/rotieren unbemerkt] → Testbuilds schlagen fehl, ohne dass jemand es bemerkt, bis eine testende Person nachfragt. Mitigation: außerhalb dieses Changes, aber in `deploy/README.md` vermerkt (Teil des Proposals).
- [Trade-off: keine kryptographische Prüfung der APK-Signatur im Workflow] Die Monotonie-Prüfung verifiziert nur den `versionCode`, nicht, dass die Signatur tatsächlich vom Upload-Keystore stammt. Akzeptiert, weil Gradle selbst den Build abbricht, wenn `signingConfigs.release` keine gültigen Zugangsdaten bekommt — ein falsch signierter Build kann diesen Workflow gar nicht durchlaufen.

## Migration Plan

1. Upload-Keystore manuell erzeugen (`keytool`), im Passwort-Depot des FSR-Vorstands ablegen (außerhalb dieses Changes).
2. `/var/www/fsrfb4aas-downloads/` auf dem VPS anlegen, dem Deploy-Nutzer zuordnen (Ergänzung in `deploy/README.md`).
3. `deploy/nginx-fsrfb4aas.conf` ausrollen (`nginx -t && systemctl reload nginx`), da bereits derselbe `server_name` bestehen bleibt, ist kein neues Zertifikat nötig.
4. GitHub-Secrets für Keystore (base64), Store-Passwort, Key-Alias, Key-Passwort anlegen.
5. Code-Änderungen mergen: `signingConfigs.release` in `build.gradle`, `versionCode` in `app.json`, neuer Workflow.
6. Ersten Testbuild manuell auslösen — die Monotonie-Prüfung lässt diesen ersten Lauf automatisch durch, da noch keine `app-latest.versioncode` existiert.

Rollback: Workflow-Datei und `nginx`-`location`-Block entfernen bzw. zurücksetzen; `/var/www/fsrfb4aas-downloads/` kann folgenlos gelöscht werden, da kein anderer Teil des Systems davon liest.
