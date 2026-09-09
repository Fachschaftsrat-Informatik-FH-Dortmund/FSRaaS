## Purpose

Ermöglicht dem FSR FB4, signierte Android-Testversionen der App vor der eigentlichen Store-Auslieferung (`specs/product/roadmap.md` Schritt 10) direkt über die FSR-Webseite zum Download bereitzustellen.

## ADDED Requirements

### Requirement: Signierter Release-Build statt Debug-Signatur

Das System muss Android-Release-Builds für diesen Vertriebsweg mit einem eigenen Upload-Keystore signieren, nicht mit dem Debug-Keystore. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-09).

#### Scenario: Bau einer Testversion
- **WHEN** eine Release-APK für den Direktdownload gebaut wird
- **THEN** ist sie mit dem dedizierten Upload-Keystore signiert, nicht mit dem Debug-Keystore

### Requirement: app.json als Quelle für versionCode und versionName

Das System muss `versionCode` und `versionName` des Android-Builds aus `app.json` ableiten; ein Versions-Bump ändert zuerst `app.json`, der daraus per `expo prebuild` entstehende Diff in `android/app/build.gradle` wird im selben Merge committet. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-09).

#### Scenario: Versions-Bump vor einem neuen Testbuild
- **WHEN** eine neue Testversion vorbereitet wird
- **THEN** wird zuerst `expo.android.versionCode` bzw. `expo.version` in `app.json` erhöht und der resultierende `expo prebuild`-Diff in `android/app/build.gradle` im selben Merge committet, bevor der Build ausgelöst wird

### Requirement: Eindeutig aufsteigende Versionsnummer je Testbuild

Jeder über diesen Weg veröffentlichte Build muss einen `versionCode` tragen, der strikt größer ist als der des vorherigen, damit ein Fehlerbericht eindeutig einer Quellcode-Version zuordenbar bleibt. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-09).

#### Scenario: Zwei aufeinanderfolgende Testbuilds
- **WHEN** ein zweiter Testbuild nach einem ersten veröffentlicht wird
- **THEN** trägt er einen `versionCode`, der strikt größer ist als der des ersten Builds

### Requirement: Öffentlich erreichbarer Download ohne Anmeldung

Das System muss die jeweils aktuelle signierte Testversion unter einer öffentlich erreichbaren URL bereitstellen, die ohne GitHub-Anmeldung und unabhängig von der Sichtbarkeit des Quellcode-Repositories abrufbar ist. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-09).

#### Scenario: Abruf durch eine testende Person
- **WHEN** eine testende Person die auf der FSR-Webseite verlinkte Download-URL aufruft
- **THEN** lädt der Browser die aktuelle signierte APK herunter, ohne dass eine GitHub-Anmeldung oder Zugriff auf das Quellcode-Repository nötig ist

### Requirement: Bereitstellung unabhängig vom Backend-Deployment

Die Ablage der Testversion muss von der bestehenden Backend-Auslieferung (`deploy.yml`) unabhängig sein, sodass ein Backend-Deployment die zuletzt veröffentlichte Testversion nicht entfernt oder unerreichbar macht. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-09).

#### Scenario: Backend-Deployment nach Veröffentlichung eines Testbuilds
- **WHEN** nach der Veröffentlichung eines Testbuilds ein Backend-Deployment über `deploy.yml` läuft
- **THEN** bleibt die zuvor veröffentlichte Testversion unter derselben URL weiterhin abrufbar

### Requirement: Manuelle Auslösung des Build- und Veröffentlichungsvorgangs

Der Workflow, der eine signierte Testversion baut und veröffentlicht, muss ausschließlich manuell ausgelöst werden, nicht automatisch bei jedem Merge. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-09).

#### Scenario: Merge auf den Hauptzweig
- **WHEN** ein Merge auf den Hauptzweig erfolgt
- **THEN** löst das allein keinen neuen Testbuild aus

### Requirement: Kein Geheimnis im Quellcode-Repository

Der Upload-Keystore und die zugehörigen Passwörter dürfen zu keinem Zeitpunkt im Quellcode-Repository liegen; sie werden ausschließlich als CI-Geheimnisse verwaltet. Herkunft: NEU (Entscheidung FSR FB4, 2026-09-09).

#### Scenario: Prüfung eines Commits
- **WHEN** ein Commit im Repository auf enthaltene Geheimnisse geprüft wird
- **THEN** enthält er weder die Upload-Keystore-Datei noch deren Passwörter

### Requirement: Kein Ersatz für die offizielle Auslieferung

Dieser Downloadweg gilt nicht als vierter, dauerhafter Vertriebsweg im Sinne von ADR 0008 und muss keine der dortigen Store-Auflagen erfüllen (z. B. Google-Play-Testauflage, F-Droids Anforderung an einen reproduzierbaren, secret-losen Build). Herkunft: NEU (Entscheidung FSR FB4, 2026-09-09).

#### Scenario: Abgrenzung zu den drei offiziellen Vertriebswegen
- **WHEN** dieser Downloadweg mit App Store, Play Store oder F-Droid verglichen wird
- **THEN** gilt er als eigenständiger, informeller Testkanal ohne deren Auflagen, und ADR 0008 bleibt unverändert
