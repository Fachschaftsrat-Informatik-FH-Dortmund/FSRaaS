---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-08
---

# Prüfprotokoll — Lizenzprüfung neuer Abhängigkeiten für den Planungsmodus

Datum: 2026-09-08
Prüfer: Umsetzung (technische Leitung)
Grundlage: `openspec/changes/stundenplan-planungsmodus-feinauswahl/design.md` Entscheidung 5
und Risiken, `openspec/specs/non-functional/spec.md` (F-Droid-Auflage: reproduzierbare
Builds ohne proprietäre Abhängigkeiten), Aufgabe 1.1.

Geprüft werden die beiden für die native Zeit-, Datums- und Wochentagsauswahl
vorgesehenen Pakete, bevor sie in `app/package.json` aufgenommen werden.

## 1. `@react-native-community/datetimepicker`

| Prüfpunkt | Befund |
|---|---|
| Version | `9.2.1` (aktuell zum Prüfzeitpunkt, kompatibel mit Expo `~52.0.0` laut `peerDependencies`) |
| Lizenz | MIT (`npm view` bestätigt) |
| Quelle | https://github.com/react-native-datetimepicker/datetimepicker — Teil der React-Native-Community-Organisation |
| Laufzeitabhängigkeiten (`dependencies`) | `invariant@^2.2.4` (MIT) — einzige transitive Abhängigkeit |
| Peer-Abhängigkeiten | `expo`, `react`, `react-native`, `react-native-windows` — alle bereits im Projekt vorhanden oder plattformbedingt ungenutzt |
| Google-Play-Services-Bindung | keine — die Android-Implementierung nutzt ausschließlich `android.app.DatePickerDialog`/`TimePickerDialog` aus AndroidX, kein `com.google.android.gms.*` |
| Reproduzierbarkeit des Android-Builds | unverändert gegeben — kein proprietäres Binärartefakt, kein Netzwerkzugriff beim Build |

**Ergebnis: bestanden.** Vereinbar mit den F-Droid-Auflagen der Capability `non-functional`.

## 2. `@react-native-picker/picker`

| Prüfpunkt | Befund |
|---|---|
| Version | `2.11.4` |
| Lizenz | MIT (`npm view` bestätigt) |
| Quelle | https://github.com/react-native-picker/picker — Teil der React-Native-Community-Organisation |
| Laufzeitabhängigkeiten (`dependencies`) | keine |
| Peer-Abhängigkeiten | `react`, `react-native` — bereits im Projekt vorhanden |
| Google-Play-Services-Bindung | keine — reines UI-Steuerelement (natives `Spinner`-Widget unter Android) |
| Reproduzierbarkeit des Android-Builds | unverändert gegeben |

**Ergebnis: bestanden.** Vereinbar mit den F-Droid-Auflagen der Capability `non-functional`.

## 3. Zusammenfassung

Beide Pakete sind MIT-lizenziert, ohne Google-Play-Services-Abhängigkeit und ohne
transitive Abhängigkeiten außerhalb von `invariant` (ebenfalls MIT). Der Aufnahme in
`app/package.json` und der Verwendung in `TerminEditorScreen.tsx` steht nichts entgegen.
`npx expo prebuild` wird im Anschluss (Aufgabe 1.2) verifiziert.

## 4. Offene Punkte

Keine.
