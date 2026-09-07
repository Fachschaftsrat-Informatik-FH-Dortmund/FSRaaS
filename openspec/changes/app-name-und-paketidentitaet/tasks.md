# Aufgaben

## 1. Neue Requirements

- [x] 1.1 „Fester Store-Titel der App" — „FSR Informatik – FH Dortmund" auf allen drei Vertriebswegen, 28 Zeichen innerhalb der Play-Grenze
- [x] 1.2 „Unveränderlicher Paket-Identifikator" — `de.fsrfb4.app` für Android und iOS, Abgrenzung zum Alt-Identifikator `de.fsrfb4.fb4`
- [x] 1.3 „Vom Store-Titel getrennter Gerätename" — „FSR Informatik" unter dem App-Symbol

## 2. Fortgeschriebene Abschnitte der Haupt-Spec

- [x] 2.1 `non-functional`, Abschnitt „Store-Veröffentlichung": Absatz „Name und Identifikator" ergänzt, mit der Unwiderruflichkeit des Identifikators, der Abgrenzung zur Alt-App und der Trennung von Store-Titel und Gerätename

## 3. Umsetzung

- [x] 3.1 `app/app.json`: `expo.name` von `FB4` auf `FSR Informatik`. `bundleIdentifier` und `package` standen bereits auf `de.fsrfb4.app` und blieben unverändert — die Änderung am Identifikator ist ausschließlich eine der Spec, nicht des Codes
- [x] 3.2 `app/android/app/src/main/res/values/strings.xml`: `app_name` auf `FSR Informatik` nachgeführt, damit der im Repository geführte native Ordner (ADR 0009) ohne Prebuild zum Vertrag passt
- [x] 3.3 `app/src/i18n/de.json` und `en.json`: Schlüssel `app.name` von `FB4` auf `FSR Informatik`. Der Schlüssel wird derzeit an keiner Stelle im Code gelesen, trägt aber den Anzeigenamen und hätte sonst als einziger Ort den alten Namen weitergeführt. In beiden Sprachen gleich, da Eigenname
- [x] 3.4 `slug` (`fb4-app`) und `scheme` (`fb4`) bewusst unverändert: Der `scheme` trägt die Deep Links und den OIDC-Rücksprung (ADR 0010); eine Änderung dort wäre eine Verhaltensänderung ohne Anlass

## 4. Prüfung

- [x] 4.1 `openspec validate app-name-und-paketidentitaet --strict`: keine Fehler. Die drei Warnungen „should contain SHALL or MUST" betreffen die englische RFC-2119-Konvention und greifen bei deutschsprachigen Requirements (`muss`) durchgängig, nicht nur hier
- [x] 4.2 `node tools/spec-check/src/cli.js`: alle drei Prüfungen bestanden — Titeleindeutigkeit, Herkunftsnachweis, Verweisziele
- [x] 4.3 Alle drei geänderten JSON-Dateien parsen und tragen den neuen Namen

## Nicht Gegenstand dieser Änderung

- Der Store-Titel wird in der Google Play Console und im App Store Connect eingetragen, nicht im Repository. Diese Änderung legt ihn fest; das Eintragen geschieht beim Anlegen der Store-Einträge.
- `targetSdkVersion` steht auf 34 und verletzt damit das Requirement „Einhaltung der Google-Play-Ziel-API-Stufe" (Play verlangt seit dem 31.08.2026 API 36). Eigener Change, siehe Proposal.
