## 1. Abhängigkeiten umstellen

- [ ] 1.1 `@react-native-vector-icons/ionicons` zu `app/package.json` hinzufügen; `@expo/vector-icons` entfernen. Verifikation: `npm ls @react-native-vector-icons/ionicons` zeigt das Paket, `npm ls @expo/vector-icons` meldet „not found".
- [ ] 1.2 `npx @react-native-vector-icons/codemod` im Verzeichnis `app/` ausführen. Verifikation: Codemod-Lauf beendet ohne Fehler; `git diff` zeigt geänderte Importe in den in `proposal.md` gelisteten Dateien.

## 2. Verbleibende manuelle Anpassungen

- [ ] 2.1 `app/src/navigation/tabIcons.tsx` prüfen und ggf. anpassen: Die Symboltabelle referenziert Icon-Namen als Werte eines `Record`, nicht als direkten Import-Aufruf — vom Codemod möglicherweise nicht erfasst. Verifikation: Datei importiert nicht mehr aus `@expo/vector-icons`; bestehender Test `tabIcons.test.tsx` läuft weiterhin grün.
- [ ] 2.2 Alle übrigen in `proposal.md` („Impact") gelisteten Dateien (`EinrichtungHeaderZugang.tsx`, `VerwaltungsblattZugang.tsx`, `PlanungSpeichernZugang.tsx`, `ModulauswahlVerwerfenZugang.tsx`, `SortierZugang.tsx`, `FilterZugang.tsx`) durchsehen. Verifikation: `grep -r "@expo/vector-icons" app/` liefert keinen Treffer mehr im gesamten `app/`-Verzeichnis (außerhalb von `node_modules`).
- [ ] 2.3 `app/app/_layout.tsx`: `useFonts()`-Aufruf auf das neue Paket umstellen (exaktes Argument anhand der zu diesem Zeitpunkt aktuellen `@react-native-vector-icons/ionicons`-Dokumentation prüfen, siehe `design.md` „Offene Fragen"). Verifikation: App startet ohne Laufzeitfehler bezüglich Font-Ladung (Prüfschritt in Abschnitt 4).

## 3. Alte Einbettung entfernen

- [ ] 3.1 `expo-font`-Plugin-Eintrag für `assets/fonts/ionicons.ttf` aus `app/app.json` entfernen. Verifikation: `app.json` enthält keinen Verweis mehr auf `assets/fonts/ionicons.ttf`.
- [ ] 3.2 `app/assets/fonts/ionicons.ttf` und `app/assets/fonts/README.md` löschen. Verifikation: Dateien existieren nicht mehr; `git status` zeigt sie als gelöscht.
- [ ] 3.3 `npx expo prebuild --clean` ausführen, damit `android/` (und bei vorhandenem iOS-Projekt `ios/`) das Autolinking/Config-Plugin des neuen Pakets übernehmen. Verifikation: Prebuild beendet ohne Fehler; `android/app/src/main/assets/fonts/` enthält keine `ionicons.ttf` mehr aus der alten manuellen Einbettung.

## 4. Gerätegeprüft verifizieren

- [ ] 4.1 Android: Clean-Build durchführen (`android/app/build`, `android/app/.cxx`, `android/build` manuell löschen statt `gradlew clean`, siehe `design.md` „Migration Plan" Schritt 6 zum bekannten Gradle-Clean-Ordnungsproblem bei diesem Projekt), danach `npx expo run:android`. Verifikation: alle in `proposal.md` gelisteten Symbolstellen (Tab-Leiste, Kopfzeilen-Zugänge Stundenplan, Mensa-Filtertrichter) zeigen das erwartete Symbol — datiertes Prüfprotokoll nach `openspec/specs/quality-and-testing/spec.md`, sofern kein automatisierter Bildvergleichstest existiert.
- [ ] 4.2 iOS, sofern zum Zeitpunkt der Umsetzung ein iOS-Prebuild existiert (ADR 0009: entsteht erst mit dem ersten iOS-Prebuild) — sonst diesen Task mit Begründung „kein iOS-Projekt vorhanden" als erledigt markieren. Verifikation: dieselben Symbolstellen wie 4.1, auf iOS-Simulator oder -Gerät geprüft.
- [ ] 4.3 Web-Export (PC-Verwaltungsoberfläche, ADR 0018) prüfen: `npx expo start --web` bzw. `npx expo export --platform web`, dieselben Symbolstellen im Browser prüfen. Verifikation: Symbole erscheinen im Web-Export identisch zu Android/iOS.
- [ ] 4.4 `npx expo doctor` ausführen. Verifikation: keine Warnung zu gemischten Icon-Font-Paketen (`@expo/vector-icons`, `react-native-vector-icons`, `@react-native-vector-icons/*` gemeinsam im Projekt).

## 5. Spec-Text nachziehen

- [ ] 5.1 `openspec/specs/ux-and-theming/spec.md`, Abschnitt „Begründungen": Absatz zur Bibliothekswahl (aktuell `@expo/vector-icons` samt Korrekturhistorie von Commit `a2dda60`) kürzen und durch einen Verweis auf diesen archivierten Change ersetzen (siehe `proposal.md` „Was ändert sich"). Verifikation: Abschnitt nennt `@react-native-vector-icons`, verweist auf den archivierten Change statt die volle Fehlerhistorie auszuformulieren; die Requirement-Tabelle (Tab → Bedeutung → Glyphe) bleibt unverändert.
- [ ] 5.2 Change archivieren (`openspec archive`). Verifikation: `openspec/changes/archive/` enthält den abgeschlossenen Change; `openspec status` führt ihn nicht mehr als offen.
