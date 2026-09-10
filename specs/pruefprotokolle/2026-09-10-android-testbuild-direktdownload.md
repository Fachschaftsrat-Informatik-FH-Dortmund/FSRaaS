---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-10
---

# Prüfprotokoll — Android-Testbuild-Direktdownload

Datum: 2026-09-10
Prüfer: Umsetzung (technische Leitung)
Grundlage: `../../openspec/changes/android-testbuild-download/` (Proposal, Spec-Delta, Design, Tasks), `../../openspec/specs/android-test-distribution/spec.md`

Abnahme von Task 6.1 der Änderung `android-testbuild-download`: gesamten Ablauf
einmal manuell durchspielen — Workflow auslösen, APK laden, auf einem
Testgerät installieren.

## 1. Ablauf

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| `versionCode` ist eine gültige Ganzzahl in `app.json` (Voraussetzung für einen buildbaren Release) | Ursprünglicher Wert `1.1` (ungültig, Android verlangt `int`) auf `2` korrigiert, PR #90 | **behoben** — siehe Abschnitt 2 |
| Workflow `Android-Testbuild (Direktdownload)` manuell ausgelöst | `workflow_dispatch` auf `main`, Run 34456686885 | **bestanden** — `success`, 28m47s |
| Signierte Release-APK gebaut | `gradlew assembleRelease` innerhalb des Laufs | **bestanden** — `BUILD SUCCESSFUL` |
| Monotonie-Prüfung akzeptiert einen echten Versionsanstieg | `versionCode 2` gegen zuvor veröffentlichten `versionCode 1` | **bestanden** — Upload lief durch |
| Monotonie-Prüfung lehnt eine unveränderte Version ab | Erneuter Lauf mit unverändertem `versionCode 2` (Run 34457721905) | **bestanden** — Abbruch vor dem Upload mit Fehlermeldung |
| APK öffentlich ohne Anmeldung abrufbar | `curl -I https://api.fb4.it/downloads/app-latest.apk` | **bestanden** — `200`, kein Login nötig |
| Download auf einem Android-Testgerät installierbar | Vom Nutzer geladen und installiert | **bestanden** — App startet und läuft |
| Ein Backend-Deployment (`deploy.yml`) berührt das Downloads-Verzeichnis nicht | `deploy.yml` real ausgelöst (Run 34480170071, `success`, 2m0s) nach veröffentlichtem Testbuild; Download danach erneut geprüft | **bestanden** — weiterhin unverändert erreichbar |

## 2. Aufgetretene Probleme und Behebung

- **`versionCode` als Dezimalzahl gesetzt.** Ein manueller Versuch, die Version
  zu erhöhen, setzte `app.json` `expo.android.versionCode` auf `1.1` statt
  einer Ganzzahl. Android/Gradle akzeptieren das nicht — jeder Build scheiterte.
  Behoben durch Korrektur auf `2` (PR #90), `android/app/build.gradle` per
  `npx expo prebuild` neu erzeugt statt von Hand editiert.
- **`appleboy/ssh-action` (drone-ssh 1.8.0) führt ein mehrzeiliges
  `if/then/.../fi` außerhalb einer `for/done`-Schleife bei `script_stop: true`
  fehlerhaft aus** — bricht sofort nach der `if`-Zeile ab, ohne jede
  Fehlermeldung. Reproduziert und eingegrenzt über einen temporären, isolierten
  SSH-Testworkflow. Behoben, indem die betroffenen `if`-Konstrukte im Workflow
  auf je eine physische Zeile gezogen wurden; Ursache als Kommentar im Workflow
  festgehalten, damit niemand die Zusammenziehung versehentlich rückgängig
  macht.

## 3. Bewertung

Der gesamte Ablauf — Build, Signierung, Monotonie-Prüfung (in beide
Richtungen), Upload, öffentlicher Download ohne Anmeldung, Installation auf
einem Android-Testgerät, sowie die Unabhängigkeit vom Backend-Deployment — ist
am 2026-09-10 real durchgespielt und bestätigt. Die Requirements „Bau einer
Testversion" und „Abruf durch eine testende Person"
(`openspec/specs/android-test-distribution/spec.md`) gelten als nachgewiesen.
Damit sind alle 15 Tasks der Änderung `android-testbuild-download` erledigt.
