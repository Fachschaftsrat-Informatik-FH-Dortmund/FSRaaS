## Why

Der FSR FB4 möchte jetzt schon lauffähige Zwischenstände der Android-App an Testende weitergeben können, indem eine signierte APK direkt von der FSR-Webseite herunterladbar ist — deutlich vor der eigentlichen Auslieferung (`specs/product/roadmap.md` Schritt 10: Store-Auflagen, F-Droid-Recipe, geschlossener Google-Play-Test). Aktuell fehlt dafür jede Voraussetzung: Der `release`-Build-Typ signiert mit dem Debug-Schlüssel (`app/android/app/build.gradle`, Kommentar „Caution! In production, you need to generate your own keystore file."), `versionCode`/`versionName` sind fest im nativen Ordner statt in `app.json` verwaltet, und es gibt keinen CI-Workflow, der überhaupt einen Android-Build erzeugt.

## What Changes

- Neuer GitHub-Actions-Workflow, ausgelöst per `workflow_dispatch`, baut eine signierte Android-Release-APK.
- Neue `release`-`signingConfig` in `app/android/app/build.gradle`, getrennt von der bestehenden `debug`-Config; liest Keystore-Datei und Passwörter aus Umgebungsvariablen/Gradle-Properties, die der Workflow aus neuen GitHub-Secrets setzt (Keystore-Datei base64-kodiert, Store-Passwort, Key-Alias, Key-Passwort — analog zum bestehenden Secret-Muster in `deploy.yml`).
- Der Upload-Keystore selbst wird einmalig manuell erzeugt (`keytool`) und außerhalb dieses Changes in die GitHub-Secrets und ein Passwort-Depot eingetragen — kein Bestandteil des Merges.
- `app/app.json` bekommt `expo.android.versionCode` als Quelle der Wahrheit; ein Versions-Bump läuft künftig über `app.json` plus lokal ausgeführten `npx expo prebuild`, dessen Diff in `android/app/build.gradle` im selben Merge committet wird (ADR 0009 — `android/` liegt im Repo und ist Teil des Review-Umfangs).
- Der Workflow überträgt die gebaute APK per `scp` (bestehende Secrets `SERVER_HOST`/`SERVER_USER`/`SSH_PRIVATE_KEY` aus `deploy.yml`) in ein neues Verzeichnis `/var/www/fsrfb4aas-downloads/` auf dem bestehenden Hetzner-VPS, das dem Deploy-Nutzer direkt gehört (kein `sudo` nötig) und **nicht** von `deploy.yml`s `rm -rf /var/www/fsrfb4aas` betroffen ist. Fester Dateiname `app-latest.apk`, wird bei jedem Lauf überschrieben.
- `deploy/nginx-fsrfb4aas.conf` bekommt eine neue `location /downloads/`, die dieses Verzeichnis direkt ausliefert (`https://api.fb4.it/downloads/app-latest.apk`).
- `deploy/README.md` wird um die Ersteinrichtung dieses Verzeichnisses und der zusätzlichen GitHub-Secrets ergänzt.

**Nicht Teil dieses Changes:** die Verlinkung von der FSR-Webseite selbst (Repo `fsrfb4.de-mkdocs`, separates Repository, nicht Teil dieses Monorepos) und jede Änderung an ADR 0008 oder der NFR-Spec „Store-Veröffentlichung" — dieser Weg tritt bewusst nicht als vierter, dauerhafter Vertriebsweg neben App Store/Play Store/F-Droid an, sondern als informeller, vorübergehender Testkanal ohne Anspruch auf Vollständigkeit oder Store-Konformität.

## Capabilities

### New Capabilities
- `android-test-distribution`: signierter Release-Build der Android-App, verbindliche `versionCode`/`versionName`-Herkunft aus `app.json`, und Direktdownload-Bereitstellung für frühe, nicht-store-gebundene Testversionen vor der eigentlichen Auslieferung.

### Modified Capabilities
(keine — die bestehenden Anforderungen zu den drei offiziellen Vertriebswegen in `openspec/specs/non-functional/spec.md` ändern sich inhaltlich nicht; dieser Change fügt einen davon unabhängigen, separaten Mechanismus hinzu)

## Impact

- **Code:** `app/app.json` (neues Feld `expo.android.versionCode`), `app/android/app/build.gradle` (neue `release`-`signingConfig`).
- **CI/Infra:** neuer Workflow unter `.github/workflows/`, `deploy/nginx-fsrfb4aas.conf` (neue `location`), `deploy/README.md` (Ersteinrichtung, neue Secrets).
- **Secrets:** neue GitHub-Secrets für den Upload-Keystore; deren Erzeugung ist ein manueller Schritt außerhalb dieses Changes.
- **Extern, nicht Teil dieses Repos:** `fsrfb4.de-mkdocs` müsste die Downloadseite mit dem Link `https://api.fb4.it/downloads/app-latest.apk` ergänzen — hier nur als Abhängigkeit vermerkt.
- **Roadmap:** `specs/product/roadmap.md` bleibt unverändert. Dieser Change ist keinem Schritt der Umsetzungsreihenfolge zugeordnet, sondern läuft parallel dazu, ähnlich den in Abschnitt 5 der Roadmap gelisteten unabhängigen Klärungen — er zieht Schritt 10 nicht vor und ersetzt ihn nicht.
- **Bewusst weggelassen:** F-Droids Anforderung an einen reproduzierbaren, secret-losen Build (NFR „Reproduzierbarer F-Droid-Build") wird hier nicht gelöst — die neue `release`-`signingConfig` darf einen künftigen F-Droid-Build nicht von vornherein verbauen, muss ihn aber noch nicht unterstützen. Die Google-Play-Testauflage (NFR-N-200) und alles Weitere aus der NFR-Spec „Store-Veröffentlichung" gilt hier nicht, da kein offizieller Vertriebsweg. Archivierung älterer Testversionen entfällt durch den festen Dateinamen bewusst.
