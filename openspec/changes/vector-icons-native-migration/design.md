## Context

Siehe `proposal.md` (Abschnitt „Why") für die vollständige Fehlerdiagnose. Kurz zusammengefasst als Ausgangslage für dieses Design: `@expo/vector-icons` liefert die Ionicons-Schriftdatei selbst mit; das Projekt hat zusätzlich eine eigene Kopie dieser Datei (`app/assets/fonts/ionicons.ttf`) im Repo, die über das `expo-font`-Config-Plugin fest in den nativen Build eingebettet wird (Commit `a2dda60`, 2026-09-04). Nichts erzwingt, dass diese Kopie mit der `@expo/vector-icons`-Version im `package.json` synchron bleibt — genau das ist beim SDK-57-Bump auseinandergelaufen.

Laut offizieller Expo-Migrationsanleitung (`docs.expo.dev/guides/icons`, verwiesener Blogbeitrag „Moving away from @expo/vector-icons", Stand 2026-07-29) ist `@expo/vector-icons` seit SDK 56 nicht mehr empfohlen; der offizielle Ersatz sind die `@react-native-vector-icons/<familie>`-Pakete, die nativ mit `expo-font` integrieren (eigenes Autolinking/Config-Plugin je Paket, keine manuell gepflegte TTF-Kopie im Anwendungsrepo mehr nötig).

Aktuell verwendet die App ausschließlich Ionicons (Tab-Symbole, Kopfzeilen-Zugänge, Mensa-Filtertrichter — vollständige Liste in `proposal.md` Abschnitt „Impact").

## Goals / Non-Goals

**Goals:**
- Die Bug-Klasse „eingebettete Schriftdatei und `glyphmap.json` der Bibliothek laufen bei einem Versions-Update auseinander" strukturell ausschließen, indem die Font-Registrierung vollständig der Bibliothek selbst überlassen wird.
- Alle bestehenden Ionicons-Symbole an allen bestehenden Stellen unverändert sichtbar erhalten (kein optischer oder fachlicher Unterschied).
- Sowohl Android- als auch iOS-Build (letzterer entsteht laut `CLAUDE.md`/ADR 0009 erst mit dem ersten iOS-Prebuild, ist aber bei der Paketwahl mitzudenken) sowie den Web-Export (PC-Verwaltungsoberfläche, ADR 0018) weiterhin unterstützen.

**Non-Goals:**
- Keine neuen Icon-Familien oder zusätzlichen Symbole.
- Keine Änderung der fachlichen Symbolzuordnung (Tab → Bedeutung → Glyphe bleibt exakt wie in `openspec/specs/ux-and-theming/spec.md` Zeile 268 ff. dokumentiert).
- Kein genereller Umbau der Icon-Architektur (z. B. SVG-Icons statt Icon-Schrift) — das wäre eine eigene, größere Entscheidung außerhalb dieses Changes.
- Keine Migration auf die experimentellen „Native Tabs" von `expo-router` — die App nutzt weiterhin die klassische `<Tabs>`-Komponente; das ist unabhängig von der Icon-Bibliothek.

## Decisions

**Paket je Icon-Familie statt Sammelpaket.** `@react-native-vector-icons/ionicons` statt eines Gesamtpakets — das ist das offizielle Verteilungsmodell der neuen Pakete (ein npm-Paket pro Icon-Familie) und reduziert nebenbei die App-Größe, da nicht mehr versehentlich alle Icon-Sets gebündelt werden (laut Expo-Blogbeitrag bis zu 4 MB Ersparnis bei Apps, die nur ein bis zwei Sets nutzen). Da die App ausschließlich Ionicons verwendet, wird nur dieses eine Paket installiert.

**Migration per offiziellem Codemod.** `npx @react-native-vector-icons/codemod` führt die Importumstellung automatisiert durch (`import { Ionicons } from '@expo/vector-icons'` → `import Ionicons from '@react-native-vector-icons/ionicons'` o. ä., exakte Zielsyntax prüft der Codemod-Lauf selbst). Alternative wäre eine manuelle Umstellung aller in `proposal.md` gelisteten Fundstellen — der Codemod ist vorzuziehen, weil er das offizielle, getestete Werkzeug für genau diese Migration ist und das Risiko von Tippfehlern in Icon-Namen ausschließt, die sonst zu genau dem Symptom führen würden, das dieser Change beheben soll.

**`expo-font`-Plugin-Eintrag für die eigene TTF-Kopie entfernen, nicht ersetzen.** Die offizielle Anleitung warnt ausdrücklich davor, Pfade aus `node_modules/@react-native-vector-icons/` in die `expo-font`-Plugin-Konfiguration einzutragen — das führe zu einem Build-Fehler, weil das neue Paket seine Schriftregistrierung bereits selbst über sein eigenes Config-Plugin/Autolinking erledigt. Der bestehende Eintrag in `app.json` (`assets/fonts/ionicons.ttf`) wird daher ersatzlos entfernt, ebenso die Datei selbst und `assets/fonts/README.md`.

**`useFonts()` im Wurzel-Layout bleibt, Argument ändert sich.** Laut Anleitung bleibt der `useFonts()`-Aufruf aus `expo-font` weiterhin nötig; die neuen Pakete integrieren sich automatisch damit. Das genaue Argument (weiterhin `Ionicons.font`-artiges Objekt oder ein anderer, vom neuen Paket exportierter Wert) klärt sich beim Ausführen des Codemods bzw. beim Lesen der Paket-Dokumentation zum Zeitpunkt der Umsetzung — siehe „Offene Fragen".

**Kein Spec-Delta, siehe `proposal.md`.** Begründung dort ausgeführt: Die formale Anforderung nennt keine Bibliothek, nur die Rationale-Prosa in „Begründungen" wird direkt gekürzt.

## Risks / Trade-offs

- **[Risiko] Der Codemod trifft nicht alle Fundstellen** (z. B. dynamische Icon-Namen aus `src/navigation/tabIcons.tsx`s Symboltabelle, die als String-Literale in einem `Record` stehen, nicht als direkte JSX-Aufrufe) → **Mitigation:** Nach dem Codemod-Lauf gezielt nach verbliebenen `@expo/vector-icons`-Importen suchen (`grep -r "@expo/vector-icons" app/`) und `npx expo doctor` ausführen (von der offiziellen Anleitung empfohlen, um Icon-Font-Konflikte durch gemischte Paketwelten zu erkennen).
- **[Risiko] iOS/Web-Export sind aktuell nicht gerätegeprüft** (nur Android-Emulator-Diagnose in diesem Change) → **Mitigation:** `tasks.md` enthält für beide Plattformen einen expliziten Prüfschritt vor Abschluss, keine Annahme „wird schon auf allen Plattformen gleich funktionieren".
- **[Risiko] Erneuter Rückfall in dieselbe Bug-Klasse, falls künftig doch wieder eine Bibliotheksdatei manuell kopiert wird** (z. B. bei einem weiteren Icon-Bedarf, der nicht über `@react-native-vector-icons` abgedeckt ist) → **Mitigation:** Der Verzicht auf jede manuell im Repo gepflegte Font-Kopie ist der Kern dieses Changes; ein künftiger Bedarf an einer nicht in `@react-native-vector-icons` verfügbaren Icon-Familie sollte in einem eigenen Change bewusst gegen dieses Risiko abgewogen werden, statt stillschweigend eine TTF-Datei einzuchecken.
- **[Trade-off] Ein separates npm-Paket je Icon-Familie statt eines Sammelpakets** bedeutet bei künftigem Bedarf an einer zusätzlichen Icon-Familie eine weitere `package.json`-Abhängigkeit — akzeptiert, da die App aktuell ohnehin nur eine Familie (Ionicons) nutzt und die App-Größen-Ersparnis überwiegt.

## Migration Plan

1. `@expo/vector-icons` aus `app/package.json` entfernen, `@react-native-vector-icons/ionicons` hinzufügen.
2. `npx @react-native-vector-icons/codemod` im `app/`-Verzeichnis ausführen.
3. Verbleibende manuelle Anpassungen an den in `proposal.md` gelisteten Fundstellen vornehmen, die der Codemod nicht erfasst (insbesondere `src/navigation/tabIcons.tsx`, wo Icon-Namen als Werte einer Zuordnungstabelle stehen, nicht als direkter Import-Aufruf).
4. `app.json`: `expo-font`-Plugin-Eintrag für `assets/fonts/ionicons.ttf` entfernen; `app/assets/fonts/ionicons.ttf` und `app/assets/fonts/README.md` löschen.
5. `app/app/_layout.tsx`: `useFonts()`-Aufruf auf das neue Paket umstellen (exaktes Argument beim Umsetzen anhand der Paket-Dokumentation prüfen).
6. `npx expo prebuild --clean` (native Projekte neu generieren, damit das neue Paket sein eigenes Autolinking/Config-Plugin greifen lässt) und Clean-Build auf Android durchführen (siehe `specs/README.md`-Hinweis zu `gradlew clean`-Ordnungsproblemen — im Zweifel `android/app/build`, `android/app/.cxx`, `android/build` manuell löschen statt `gradlew clean`, siehe Sitzungsprotokoll dieses Changes).
7. Gerätegeprüft (Android-Emulator, per Prüfprotokoll wie in `openspec/specs/quality-and-testing/spec.md` vorgesehen, sofern kein automatisierter Test die reine Bildwiedergabe abdeckt): alle in `proposal.md` gelisteten Symbolstellen zeigen das erwartete Symbol.
8. `npx expo doctor` ausführen, um sicherzustellen, dass keine Reste von `@expo/vector-icons` oder `react-native-vector-icons` verbleiben.
9. `openspec/specs/ux-and-theming/spec.md`, Abschnitt „Begründungen": Absatz zur Bibliothekswahl kürzen und auf diesen (archivierten) Change verweisen.

**Rollback:** Ein `git revert` des Merge-Commits stellt `@expo/vector-icons` samt der (zu diesem Zeitpunkt korrigierten, siehe Minimalfix-Option in der Nutzerentscheidung) eingebetteten Schriftdatei wieder her. Da keine Datenmigration und kein Backend-Bezug involviert sind, ist ein Rollback risikofrei möglich.

## Open Questions

- Exaktes Argument für `useFonts()` nach der Migration (z. B. weiterhin ein `.font`-Objekt vom neuen Paket, oder entfällt der Aufruf für Ionicons ganz, weil das Paket die Registrierung vollständig selbst übernimmt) — klärt sich beim Ausführen des Codemods bzw. beim Lesen der `@react-native-vector-icons/ionicons`-Paket-Dokumentation zum Zeitpunkt der Umsetzung. Ändert weder Spec noch Vorgehen noch Task-Zuschnitt, nur eine Codezeile in `app/app/_layout.tsx`.
