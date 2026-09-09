## 1. Signing-Konfiguration

- [ ] 1.1 Neue `signingConfigs.release`-Closure in `app/android/app/build.gradle` ergänzen, die Keystore-Pfad, Store-Passwort, Key-Alias und Key-Passwort aus Umgebungsvariablen liest; `buildTypes.release.signingConfig` von `signingConfigs.debug` auf `signingConfigs.release` umstellen. Verifizieren: `./gradlew assembleRelease` bricht ohne gesetzte Umgebungsvariablen mit einer klaren Fehlermeldung ab statt still auf den Debug-Keystore zurückzufallen (Requirement „Signierter Release-Build statt Debug-Signatur").
- [ ] 1.2 Namen der vier neuen GitHub-Secrets festlegen (Upload-Keystore base64, Store-Passwort, Key-Alias, Key-Passwort) und im neuen Workflow referenzieren. Verifizieren: `actionlint` bzw. `gh workflow view` meldet keine unbekannten Secret-Referenzen.

## 2. Versionsverwaltung über app.json

- [ ] 2.1 `app/app.json`: `expo.android.versionCode` ergänzen, Startwert = aktueller Wert aus `android/app/build.gradle`. Verifizieren: `npx expo prebuild` erzeugt in `android/app/build.gradle` ausschließlich den erwarteten `versionCode`-Diff, sonst keine Abweichung (Requirement „app.json als Quelle für versionCode und versionName").
- [ ] 2.2 Versions-Bump-Ablauf (`app.json` ändern → `expo prebuild` → Diff in `android/app/build.gradle` im selben Merge committen) in `deploy/README.md` dokumentieren. Verifizieren: Abschnitt vorhanden und von einer Person ohne Vorwissen nachvollziehbar (Review).

## 3. Workflow: Build und Monotonie-Prüfung

- [ ] 3.1 Neuen Workflow `.github/workflows/android-testbuild.yml` anlegen, ausschließlich mit `workflow_dispatch` als Trigger. Verifizieren: YAML enthält keinen `push`- oder `workflow_run`-Trigger (Requirement „Manuelle Auslösung des Build- und Veröffentlichungsvorgangs").
- [ ] 3.2 Build-Schritte ergänzen: Checkout, `npm ci` in `app/`, `npx expo prebuild --platform android`, `./gradlew assembleRelease` mit den Signing-Umgebungsvariablen aus den Secrets. Verifizieren: ein manuell ausgelöster Lauf erzeugt eine signierte APK als Workflow-Ergebnis.
- [ ] 3.3 Monotonie-Prüfungsschritt vor dem Upload: per SSH `app-latest.versioncode` vom VPS lesen (fehlt die Datei, gilt die Prüfung als bestanden), mit dem neuen `versionCode` vergleichen, bei nicht strikt größerem Wert den Workflow mit Fehlermeldung abbrechen, bevor hochgeladen wird. Verifizieren: ein Testlauf mit gleichem oder kleinerem `versionCode` bricht ab, einer mit größerem läuft durch (Requirement „Eindeutig aufsteigende Versionsnummer je Testbuild").
- [ ] 3.4 Upload-Schritte in der Reihenfolge APK-zuerst, Sidecar-Datei danach: `scp` von `app-latest.apk` nach `/var/www/fsrfb4aas-downloads/`, anschließend per SSH `app-latest.versioncode` aktualisieren. Verifizieren: nach einem Lauf liegen beide Dateien auf dem VPS und sind zueinander konsistent.

## 4. Serverseitige Bereitstellung

- [ ] 4.1 `/var/www/fsrfb4aas-downloads/` auf dem VPS einmalig anlegen, Eigentümer = Deploy-Nutzer (nicht `fsrfb4aas`). Verifizieren: `ls -la /var/www/` zeigt den korrekten Eigentümer.
- [ ] 4.2 `deploy/nginx-fsrfb4aas.conf`: neue `location /downloads/` mit `alias /var/www/fsrfb4aas-downloads/;` und `add_header Cache-Control "no-cache";` ergänzen. Verifizieren: `nginx -t` erfolgreich, `curl -I https://api.fb4.it/downloads/app-latest.apk` liefert `200` ohne Anmeldung und den `Cache-Control`-Header (Requirement „Öffentlich erreichbarer Download ohne Anmeldung").
- [ ] 4.3 Prüfen, dass `deploy.yml` das neue Verzeichnis strukturell nicht erreichen kann (anderer Pfad, anderer Eigentümer als `/var/www/fsrfb4aas`). Verifizieren: ein Backend-Deployment über `deploy.yml` nach einem veröffentlichten Testbuild lässt `app-latest.apk` unter derselben URL weiterhin abrufbar — datiertes Prüfprotokoll (Requirement „Bereitstellung unabhängig vom Backend-Deployment").

## 5. Dokumentation und Geheimnis-Handling

- [ ] 5.1 `deploy/README.md` um Ersteinrichtung des Downloads-Verzeichnisses und die Liste der vier neuen GitHub-Secrets samt Rotationshinweis ergänzen. Verifizieren: Abschnitt folgt der bestehenden Gliederung des Dokuments.
- [ ] 5.2 Sicherstellen, dass keine Keystore-Datei oder Passwörter im Commit landen (`.gitignore`-Eintrag für lokal erzeugte Keystore-/Properties-Dateien, falls für die lokale Erstellung des Upload-Keystores nötig). Verifizieren: `git grep` nach `.keystore`/`.jks`-Dateiendungen im Commit liefert keine Treffer (Requirement „Kein Geheimnis im Quellcode-Repository").

## 6. Abnahme

- [ ] 6.1 Gesamten Ablauf einmal manuell durchspielen: Workflow auslösen, `https://api.fb4.it/downloads/app-latest.apk` laden, auf einem Testgerät installieren. Datiertes Prüfprotokoll ablegen (Requirements „Bau einer Testversion" und „Abruf durch eine testende Person").
- [ ] 6.2 Prüfen, dass ADR 0008 und die NFR-Spec „Store-Veröffentlichung" durch diesen Change unverändert bleiben. Verifizieren: `git diff` zeigt keine Änderung an `specs/decisions/0008-*.md` oder den entsprechenden Store-Veröffentlichungs-Requirements in `openspec/specs/non-functional/spec.md` (Requirement „Kein Ersatz für die offizielle Auslieferung").
