## Why

Nach dem Expo-SDK-Bump 52→57 (Commit `ee546d5`) waren sämtliche Ionicons-Symbole der App unsichtbar — nicht nur einzelne: Tab-Leiste, Kopfzeilen-Icons (Stift, Zahnrad), Mensa-Filtertrichter. Geräteprüfung auf dem Android-Emulator (Screenshots, `logcat`, `uiautomator`-Dump) hat die Ursache eindeutig belegt: `app/assets/fonts/ionicons.ttf` — die Schriftdatei, die seit Commit `a2dda60` (2026-09-04) fest in den nativen Build eingebettet wird — ist eine veraltete, manuell im Repo gepflegte Kopie. Sie unterscheidet sich binär von der Datei, die die aktuell installierte `@expo/vector-icons`-Version (15.1.1, kam mit dem SDK-Bump) mitliefert (442604 Bytes gegenüber 389724 Bytes). Die Codepoint-zu-Glyph-Zuordnung der alten Datei passt nicht mehr zur `glyphmap.json` der neuen Paketversion — ein angefordertes Symbol wie `calendar` trifft in der eingebetteten Schriftdatei ins Leere. `Font.isLoaded('ionicons')` meldet dabei `true`, es gibt keinen Fehler im Log; das Symbol bleibt einfach vollständig leer, kein Ersatzkasten.

Testweises Ersetzen der eingebetteten Datei durch die aktuelle aus `node_modules` hat das Problem sofort behoben (bestätigt per Gerätescreenshot, sowohl mit aktivierter als auch deaktivierter New Architecture — Fabric/New Architecture wurde während der Diagnose testweise als Ursache vermutet und mit einem sauberen A/B-Rebuild widerlegt).

Das ist bereits die zweite unabhängige Ursache für denselben sichtbaren Fehler (leere Icons) innerhalb weniger Tage: Commit `a2dda60` behob am 2026-09-04 das Laufzeit-Nachladeproblem, indem die Schriftdatei fest ins Repo und in den Build eingebettet wurde — genau diese manuell gepflegte Kopie ist jetzt selbst zur Fehlerquelle geworden, weil sie bei einer Versions-Aktualisierung von `@expo/vector-icons` nicht mitgezogen wurde. Ein reiner Dateiaustausch (Minimalfix) würde den akuten Fehler beheben, aber dieselbe Fehlerklasse bei der nächsten `@expo/vector-icons`-Aktualisierung erneut ermöglichen, da nichts erzwingt, dass Bibliotheksversion und eingebettete Schriftdatei zusammenbleiben.

Dieser Change entscheidet sich bewusst für den Strukturfix statt des Minimalfixes: Migration von `@expo/vector-icons` auf die direkte Nutzung der `@react-native-vector-icons`-Pakete (z. B. `@react-native-vector-icons/ionicons`), die native Font-Registrierung über das jeweilige Autolinking/Config-Plugin mitbringen — ohne eine manuell im Repo gepflegte, potenziell veraltete TTF-Kopie. Das schließt diese Fehlerklasse strukturell aus, statt sie nur einmalig zu beheben.

## What Changes

- Ablösen von `@expo/vector-icons` durch die direkten `@react-native-vector-icons`-Pakete für alle im Code verwendeten Icon-Familien (aktuell ausschließlich Ionicons).
- Entfernen der manuell gepflegten `app/assets/fonts/ionicons.ttf` samt `assets/fonts/README.md` und der zugehörigen `expo-font`-Plugin-Konfiguration in `app.json`, sofern das gewählte Paket seine eigene native Font-Registrierung mitbringt (zu klären in `design.md` — siehe Abschnitt „Offene Fragen" dort).
- Anpassen aller Importstellen von `import { Ionicons } from '@expo/vector-icons'` auf den entsprechenden `@react-native-vector-icons`-Import, ohne die verwendeten Icon-Namen oder das sichtbare Symbol zu ändern.
- Entfernen des `useFonts(Ionicons.font)`-Aufrufs im Wurzel-Layout (`app/app/_layout.tsx`), falls die neue Bibliothek keinen entsprechenden Ladevorgang mehr braucht (ebenfalls in `design.md` zu klären).
- Direkte Textänderung (kein Requirement-Delta, siehe unten) im Abschnitt „Begründungen" von `openspec/specs/ux-and-theming/spec.md`: Der dort dokumentierte Absatz zur technischen Wahl von `@expo/vector-icons` (2026-09-04) samt Korrekturhistorie von `a2dda60` wird durch einen kurzen Verweis auf diesen Change ersetzt — die ausführliche Entscheidungs- und Fehlerhistorie lebt ab jetzt im archivierten Change selbst (`openspec/changes/archive/`), nicht mehr ausformuliert im laufenden Spec-Text (CLAUDE.md: „Für Capability-Specs unter `openspec/specs/` ersetzt der archivierte Change diese Historie").

**Kein Requirement-Delta nötig:** Die formale Anforderung „Einheitliches Symbolsystem für wiederkehrende fachliche Bedeutungen" (`openspec/specs/ux-and-theming/spec.md:131`, vormals UX-F-150) nennt keine Bibliothek und keinen Dateipfad — sie verlangt nur, dass dieselbe fachliche Bedeutung überall dasselbe Symbol aus demselben Symbolsystem erhält. Das bleibt unverändert wahr, unabhängig davon, welche Bibliothek das Symbolsystem technisch bereitstellt. Der Absatz, der `@expo/vector-icons` nennt, steht im Abschnitt „Begründungen" (Rationale-Prosa), nicht im Requirement-Text selbst — genau die Art von Implementierungsdetail, die laut Spec-Anleitung nicht in einem Requirement stehen soll. Dieser Change setzt daher `skip_specs: true`.

## Capabilities

Keine — weder neue noch fachlich geänderte. Die einzige betroffene Anforderung (`ux-and-theming`, „Einheitliches Symbolsystem für wiederkehrende fachliche Bedeutungen") ändert sich inhaltlich nicht; nur die Rationale-Prosa im selben Spec-Dokument wird gekürzt (siehe „Was ändert sich" und `design.md`).

## Impact

**Betroffener Code** (Stand der Diagnose, vor der Umsetzung noch vollständig zu prüfen — siehe `tasks.md`):

- `app/src/navigation/tabIcons.tsx` — Tab-Symbole (`calendar`, `restaurant`, `newspaper`, `search`, `ellipsis-horizontal`, je mit `-outline`-Variante)
- `app/app/_layout.tsx` — `useFonts(Ionicons.font)` im Wurzel-Layout
- `app/src/areas/schedule/ui/EinrichtungHeaderZugang.tsx` (`pencil`)
- `app/src/areas/schedule/ui/VerwaltungsblattZugang.tsx` (`settings-outline`)
- `app/src/areas/schedule/ui/PlanungSpeichernZugang.tsx`, `ModulauswahlVerwerfenZugang.tsx` — weitere Ionicons-Nutzung, im Detail noch zu prüfen
- `app/src/areas/canteen/ui/SortierZugang.tsx`, `FilterZugang.tsx` (`funnel` / `funnel-outline`)
- `app/app.json` — `expo-font`-Plugin-Eintrag für `assets/fonts/ionicons.ttf`
- `app/assets/fonts/ionicons.ttf`, `app/assets/fonts/README.md` — entfallen voraussichtlich
- `app/package.json` — Abhängigkeit `@expo/vector-icons` durch `@react-native-vector-icons/ionicons` (oder gleichwertig) ersetzen
- `openspec/specs/ux-and-theming/spec.md` — Kürzung der Rationale-Prosa im Abschnitt „Begründungen" (kein Requirement-Delta, siehe oben)

**Nicht betroffen:** Backend, API-Vertrag, andere Capabilities. Kein Einfluss auf Nutzer-Zugangsdaten, Netzwerkverhalten oder Datenhaltung.

**Zuordnung zur Roadmap:** Kein neuer Schritt aus `specs/product/roadmap.md` — das einheitliche Symbolsystem ist bereits Teil von Schritt 2 (App-Rahmen) und in weiteren Schritten (5 Stundenplan, 4 Mensaplan) genutzt. Dieser Change ist eine querschnittliche technische Korrektur eines bereits ausgelieferten Bestandteils, kein neuer fachlicher Schnitt. Bewusst weggelassen: keine neuen Icon-Familien, keine neuen Symbole, keine Änderung der fachlichen Symbolzuordnung — ausschließlich der Austausch der technischen Icon-Bibliothek.
