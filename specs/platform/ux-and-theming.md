---
id: ux-and-theming
titel: Gestaltung und Barrierefreiheit
praefix: UX
status: accepted
version: 0.6.2
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/config/themes/color_consts.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/main.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_list.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_card.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/screens/canteen_overview_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/news/screens/news_overview_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/utils/ui/icons/fb4app_icons.dart
implemented_in:
  - app/src/ui             # UX-F-100, UX-F-110, UX-F-130, UX-F-140 (Grundstruktur); UX-F-070, UX-F-180/F-185, UX-N-020 (Bedienelemente); UX-F-190 (Einführungshinweis)
  - app/src/ui/primitives.test.tsx   # UX-F-070, UX-F-130, UX-F-140, UX-F-180/F-185, UX-N-020
  - app/src/theme          # UX-F-010 (Akzentfarbe im Farbsystem), UX-F-020/F-030 (Laufzeitreaktion, manuelle Übersteuerung; Navigations-Theme-Brücke app/src/theme/navigationTheme.ts, Test navigationTheme.test.ts), UX-F-220 (Statusleiste: app/src/theme/statusBar.tsx, Test: app/src/theme/statusBar.test.tsx)
  - app/app                # UX-F-170 (Bildschirmtitel aus den _layout-Optionen), UX-F-200/UX-N-030 (Navigations-Werkzeug), UX-F-220 (ThemedStatusBar im Wurzel-Layout), UX-F-020/F-030 (Navigations-Theme im Wurzel-Layout gesetzt)
  - app/src/i18n           # UX-F-210 (Anrede „du" in de.json), Test: app/src/i18n/anrede.test.ts
  - app/src/areas/canteen  # UX-F-160 (Aktualisierungsgeste: Herunterziehen im Mensaplan, MENSA-F-240) — erster Konsument, Test: screens/CanteenScreen.test.tsx
related:
  - ../features/schedule/spec.md
  - ../features/canteen/spec.md
  - ../features/news/spec.md
  - ../features/settings/spec.md
  - ../product/glossary.md
---

# Gestaltung und Barrierefreiheit

## Zweck

Dieses Dokument legt die querschnittlichen Gestaltungs- und Barrierefreiheitsanforderungen fest, die für alle Ansichten der neuen App gelten: Markenidentität, Hell-/Dunkelmodus, Farbkontrast, Barrierefreiheit, Gestensteuerung, Ansichtszustände, wiederkehrende Bedienmuster sowie Typografie und Symbolik. Feature-Specs verweisen hierher, statt diese Anforderungen zu wiederholen. Grundlage ist die Analyse der Alt-App (`alte apps/fb4_app-main/fb4_app-main/`); mehrere dort gefundene Muster werden bewusst nicht übernommen.

## Befunde aus der Alt-App

| Befund | Quelle | Konsequenz |
|---|---|---|
| Orange (`#FF6600`) als einzige Akzentfarbe, u. a. für Navigationsleisten, Trennlinien und Standardfarbe von Stundenplan-Einträgen | `lib/config/themes/color_consts.dart:4`; Verwendung z. B. `lib/areas/more/screens/settings_page.dart:18` | Übernahme als Akzentfarbe eines Farbsystems, nicht als Flächenfarbe jeder Ansicht (UX-F-010) |
| Hell-/Dunkelmodus wird einmalig beim Start aus der Systemhelligkeit gewählt und reagiert danach nicht auf Laufzeitänderungen | `lib/main.dart:111-112` | Laufzeitreaktion und manuelle Übersteuerung gefordert (UX-F-020, UX-F-030) |
| Palette von 22 Farben für Stundenplan-Einträge, darunter helle Töne (Gelb, Limette); Textfarbe in allen vier Textelementen fest auf Weiß gesetzt | Palette: `lib/areas/schedule/widgets/schedule_list.dart:89-112`; Textfarbe: `lib/areas/schedule/widgets/schedule_card.dart:72,80,98,107,114` | Automatische Ableitung der Textfarbe und Mindestkontrast gefordert (UX-F-040, UX-N-010) |
| Termine außerhalb der eigenen Gruppe werden ausschließlich durch reduzierte Deckkraft der Akzentfarbe markiert (`mainOrange.withAlpha(168)`), ohne Text oder Symbol | `lib/areas/schedule/widgets/schedule_card.dart:52-54` | Verstoß gegen „keine Bedeutung allein über Farbe"; zusätzliches Merkmal gefordert (UX-F-070, UX-F-080) |
| Farbe ändern und Eintrag entfernen im Stundenplan nur über langes Drücken (Kontextmenü) erreichbar | `lib/areas/schedule/widgets/schedule_list.dart:39-42,64-149` | Zweiter, sichtbarer Bedienweg gefordert (UX-F-090) |
| News anpinnen und ablösen nur über langes Drücken erreichbar | `lib/areas/news/screens/news_overview_page.dart:199-241` | Zweiter, sichtbarer Bedienweg gefordert (UX-F-090) |
| Leerzustände benennen bereits den nächsten Schritt (Stundenplan: Hinweis auf Plus-Symbol; Mensa: Hinweis auf Einstellungen) | `lib/areas/schedule/screens/schedule_overview_page.dart:127`; `lib/areas/canteen/screens/canteen_overview_page.dart:89` | Positives Vorbild, Muster wird übernommen (UX-F-110) |
| Löschen von Stundenplan und Ticket fragt vor Ausführung nach Bestätigung | `lib/areas/more/screens/settings_page.dart:37-48,62-72` | Muster wird für alle zerstörenden Aktionen verbindlich gemacht (UX-F-120) |
| Eigene Symbolschrift `Fb4App` für fachliche Symbole (Essen, Vegetarisch) | `assets/fonts/Fb4app.ttf`; `lib/utils/ui/icons/fb4app_icons.dart:31-32` | Bedarf an einheitlichem Symbolsystem übernommen, Umsetzung offen (UX-F-150) |
| Durchgängige Verwendung der iOS-Widgetbibliothek (Cupertino) auf beiden Plattformen, z. B. `CupertinoApp`, `CupertinoNavigationBar`, `CupertinoActionSheet` | `lib/main.dart:119`; durchgängig u. a. in `lib/areas/more/screens/settings_page.dart` | Plattformtreue als offene Entscheidung mit Empfehlung (siehe „Offene Fragen") |

## Anforderungen

Jede Anforderung ist einzeln prüfbar, folgt einem EARS-Muster und trägt genau eine Herkunftsmarkierung (siehe `specs/README.md`, Abschnitt 5+6).

### Funktionale Anforderungen (UX-F)

| ID | Anforderung | Herkunft |
|---|---|---|
| UX-F-010 | Das System muss `#FF6600` als Akzentfarbe des Farbsystems verwenden (u. a. Navigationsleisten, Trennlinien, Standardfarbe von Stundenplan-Einträgen), nicht als flächendeckende Hintergrundfarbe jeder Ansicht. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/config/themes/color_consts.dart:4 |
| UX-F-020 | Wenn sich die Systemeinstellung für helles oder dunkles Erscheinungsbild ändert, während die App aktiv ist, dann muss das System das Erscheinungsbild unmittelbar entsprechend anpassen. | Alt: bewusst verworfen |
| UX-F-030 | Sofern die Nutzerin in den Einstellungen eine manuelle Übersteuerung des Erscheinungsbilds (hell, dunkel oder systemabhängig) wählt, muss das System dieser Wahl unabhängig vom Systemzustand folgen. | NEU |
| UX-F-040 | Das System muss die Textfarbe eines Stundenplan-Eintrags automatisch aus der Helligkeit seiner Hintergrundfarbe ableiten. | Alt: bewusst verworfen |
| UX-F-050 | Das System muss die vom Betriebssystem eingestellte Textgröße (dynamische Schriftgröße) für Textinhalte übernehmen. | NEU |
| UX-F-060 | Das System muss jedes Bedienelement mit einer für Bildschirmvorleser auswertbaren Beschriftung versehen. | NEU |
| UX-F-070 | Das System muss jede Bedeutung, die im Entwurf über Farbe vermittelt wird, zusätzlich über Text oder Symbol erkennbar machen. | NEU |
| UX-F-080 | Wenn ein Stundenplan-Termin nicht zur von der Nutzerin angegebenen Gruppenkennung gehört, dann muss das System dies zusätzlich zur Farbe durch Text oder Symbol kennzeichnen. | Alt: bewusst verworfen |
| UX-F-090 | Wenn eine Aktion ausschließlich über eine Geste wie langes Drücken erreichbar ist, dann muss das System zusätzlich einen zweiten, sichtbaren Bedienweg für dieselbe Aktion bereitstellen. | Alt: bewusst verworfen |
| UX-F-100 | Das System muss für jede Ansicht einen definierten Lade-, Leer-, Fehler- und Offline-Zustand bereitstellen. | NEU |
| UX-F-110 | Wenn eine Ansicht ihren Leerzustand zeigt, dann muss das System den nächsten sinnvollen Schritt zur Behebung nennen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart:127 |
| UX-F-120 | Wenn die Nutzerin eine zerstörende Aktion auslöst, dann muss das System vor deren Ausführung eine Bestätigung einholen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart:37 |
| UX-F-130 | Das System muss Fehlermeldungen über alle Ansichten hinweg einheitlich gestalten. | NEU |
| UX-F-140 | Das System muss Ladeanzeigen über alle Ansichten hinweg einheitlich gestalten. | NEU |
| UX-F-150 | Sofern eine fachliche Bedeutung wiederkehrend durch ein Symbol dargestellt wird (z. B. Essen, Vegetarisch), muss das System dafür ein einheitliches Symbolsystem verwenden. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/utils/ui/icons/fb4app_icons.dart:31 |
| UX-F-160 | Das System muss für jede Ansicht mit direkt abrufbaren entfernten Daten eine manuelle Aktualisierungsgeste oder eine gleichwertige, sichtbare Aktualisieren-Aktion bereitstellen. | NEU |
| UX-F-170 | Das System muss auf jedem Bildschirm einen Titel führen, der der Bezeichnung des Einstiegspunkts entspricht, über den der Bildschirm erreicht wurde. | NEU |
| UX-F-180 | Das System muss je Ansicht höchstens eine visuell hervorgehobene Primäraktion vorsehen. | NEU |
| UX-F-185 | Das System darf eine zerstörende Aktion nicht als hervorgehobene Primäraktion darstellen. | NEU |
| UX-F-190 | Wenn ein Bereich zum ersten Mal geöffnet wird, darf das System höchstens einen schließbaren Einführungshinweis zeigen und diesen nach dem Schließen nicht erneut anzeigen. | Alt: bewusst verworfen |
| UX-F-200 | Wenn der angezeigte Bildschirm wechselt, muss das System den Bedienfokus für Bildschirmvorleser auf den Titel des neuen Bildschirms setzen. | NEU |
| UX-F-210 | Das System muss nutzerseitige deutsche Texte durchgängig in der Anrede „du" formulieren. | NEU |
| UX-F-220 | Das System muss die Darstellung der Betriebssystem-Statusleiste (Kontrast der Symbole) an das wirksame Erscheinungsbild anpassen, sodass ihre Inhalte in hellem wie dunklem Erscheinungsbild sichtbar bleiben. | NEU |

### Nicht-funktionale Anforderungen (UX-N)

| ID | Anforderung | Herkunft |
|---|---|---|
| UX-N-010 | Das System muss zwischen Textfarbe und Hintergrundfarbe eines Stundenplan-Eintrags einen Kontrast von mindestens 4,5:1 einhalten. | NEU |
| UX-N-020 | Das System muss für Bedienelemente eine Mindestgröße von 44×44 dp bzw. dem plattformüblichen Äquivalent einhalten. | NEU |
| UX-N-030 | Das System muss die Systemeinstellung „Bewegung reduzieren" respektieren und Übergangsanimationen bei aktivierter Einstellung reduzieren oder abschalten. | NEU |

### Begründungen

**Zu UX-F-020 / UX-F-030 (Hell-/Dunkelmodus).** Die Alt-App liest die Systemhelligkeit nur einmalig in `FB4App.build()` aus (`lib/main.dart:111-112`) und besitzt keinen Beobachter für spätere Änderungen; ein Wechsel der Systemeinstellung wirkt sich erst nach Neustart der App aus. Das entspricht nicht mehr dem, was Nutzerinnen und Nutzer von Betriebssystemen mit systemweitem Dunkelmodus erwarten. Die manuelle Übersteuerung (UX-F-030) ist zusätzlich nötig, weil einzelne Personen unabhängig von der Systemeinstellung ein bestimmtes Erscheinungsbild bevorzugen können.

Umgesetzt (Roadmap-Schritt 2) über `app/src/theme`: ein `ThemeProvider` löst bei jedem Rendern aus dem abonnierenden `useColorScheme()` und der gespeicherten Wahl (`appearanceMode`) das wirksame Farbschema auf — die Systemhelligkeit wird also nicht mehr beim Start eingefroren (UX-F-020), und eine Wahl `light`/`dark` gilt vor dem Systemzustand (UX-F-030). Das On-Device-Umschalten der Systemeinstellung bei laufender App ist zusätzlich im Prüfprotokoll `specs/pruefprotokolle/2026-09-02-app-rahmen.md` festgehalten (QA-F-020).

Das Navigations-Werkzeug (Expo Router / React Navigation) führt über einen internen Container ein eigenes Theme, das ohne Zutun auf der hellen Voreinstellung bleibt. Damit das wirksame Farbschema auch für die vom Navigator gezeichneten Flächen gilt — Navigator- und Szenengrund, Kopf- und Tab-Leiste, die Fläche hinter Szenenübergängen —, überführt `app/src/theme/navigationTheme.ts` das Farbsystem in ein React-Navigation-Theme, das das Wurzel-Layout `app/app/_layout.tsx` setzt (ergänzt um einen `contentStyle`-Grund am Wurzel-Stack, wie ihn die verschachtelten Stacks bereits tragen). Vor dieser Brücke blitzte beim Tab-Wechsel im Dunkelmodus kurz ein heller Rand durch die während des Übergangs teiltransparenten Szenen; der Befund ist im selben Prüfprotokoll festgehalten (visuelle Bestätigung am Gerät ausstehend).

**Zu UX-F-220 (Statusleiste).** Die App zeichnet ihre Ansichten themengefärbt, die Betriebssystem-Statusleiste (Uhr, Akku, Empfang) bleibt davon aber unberührt, solange sie nicht ausdrücklich gesetzt wird. Der native Android-Rahmen liefert eine hell voreingestellte Statusleiste; im Dunkelmodus zeichnet das System dort helle Symbole auf hellen Grund, sodass die gesamte Statuszeile unsichtbar wird — ein Befund aus der Geräteprüfung des App-Rahmens. UX-F-220 verlangt daher, die Statusleiste dem wirksamen Erscheinungsbild anzugleichen. Umgesetzt über `app/src/theme/statusBar.tsx` (`ThemedStatusBar`), einmalig im Wurzel-Layout `app/app/_layout.tsx` gerendert: die Symbolfarbe folgt dem vom `ThemeProvider` aufgelösten Schema (also auch einer manuellen Übersteuerung, UX-F-030), der Hintergrund bleibt durchscheinend, sodass der themengefärbte Hintergrund der jeweiligen Ansicht trägt. Die Sichtprüfung in hellem und dunklem Erscheinungsbild ist im Prüfprotokoll `specs/pruefprotokolle/2026-09-02-app-rahmen.md` festgehalten.

**Zu UX-F-070 / UX-F-080 (Farbe als alleiniger Bedeutungsträger).** Menschen mit Farbsinnstörung oder in hellem Umgebungslicht können eine reine Opazitätsabstufung derselben Farbe nicht zuverlässig von der Vollfarbe unterscheiden. Der konkrete Befund in `schedule_card.dart:52-54` — Gruppenzugehörigkeit wird ausschließlich über `mainOrange.withAlpha(168)` signalisiert — ist ein Beispiel für diesen allgemeinen Mangel und wird in UX-F-080 gezielt adressiert.

**Zu UX-F-090 (Gestensteuerung).** Langes Drücken hat in mobilen Betriebssystemen keine einheitliche Entdeckungsmethode; es gibt keinen visuellen Hinweis darauf, dass eine Aktion dahinter verborgen ist. Sowohl das Ändern der Farbe/Entfernen von Stundenplan-Einträgen als auch das Anpinnen/Ablösen von News sind dadurch in der Alt-App nur durch Ausprobieren oder Weitergabe von Wissen auffindbar.

**Zu Plattformtreue (entschieden).** Eigenständige, plattformübergreifende Gestaltung statt getrennter nativer Gestaltungssprachen je Plattform — Entscheidung FSR FB4, 2026-08-25, wie empfohlen. Begründung: Die Alt-App bildet ohnehin nur die iOS-Sprache nach, unabhängig von der Zielplattform — es gibt also kein etabliertes Android-Vorbild, das fortgeführt werden müsste. Eine einheitliche Gestaltung senkt zudem den Pflegeaufwand für ein kleines, ehrenamtlich getragenes Projekt und stärkt die Wiedererkennbarkeit der FSR-Marke unabhängig vom Gerät.

**Zu UX-F-160 (Aktualisierungsgeste).** Die Flutter-Alt-App bot Pull-to-Refresh (`product/legacy-inventory.md`, L-034); für die Neuentwicklung war dafür bislang keine Anforderung mehr formuliert, obwohl mehrere Ansichten (NEWS, MENSA, EVENT) direkt abrufbare entfernte Daten zeigen. Ergänzt das bisher nur im Fehlerzustand vorgesehene „Wiederholen" (siehe jeweilige Feature-Spec, Abschnitt 7) um eine reguläre, jederzeit verfügbare Aktualisierungsmöglichkeit.

**Zu UX-F-150 (Symbolsystem, entschieden).** Bestehende Open-Source-Icon-Bibliothek statt eigener Schriftart oder eigenem SVG-Set — Entscheidung FSR FB4, 2026-08-25. Konkrete Bibliothek (z. B. Lucide, Material Symbols, Phosphor) wählt die technische Leitung bei Umsetzung; Kriterium ist lediglich Verfügbarkeit unter offener Lizenz und Abdeckung der benötigten fachlichen Symbole (Essen, Vegetarisch u. a.).

Fachliche Symbolzuordnung der Tab-Leiste (Bedeutung, nicht konkrete Glyphe — `../features/app-shell/nutzerfuehrung-konzept.md` Abschnitt 3.1):

| Tab | Bedeutung des Symbols |
|---|---|
| Stundenplan | Kalender / Raster |
| Mensaplan | Besteck |
| News | Sprechblase / Zeitung |
| Raumsuche | Lupe / Grundriss |
| Mehr | Punkte-Menü |

Der aktive Tab ist zusätzlich zur Akzentfarbe durch das gefüllte (statt umrissene) Symbol markiert (UX-F-070).

**Zu UX-F-170 bis UX-F-210, UX-N-030 (Nutzerführung).** Diese Anforderungen entstammen dem Konzept `../features/app-shell/nutzerfuehrung-konzept.md` Abschnitt 12 (2026-09-02) und ergänzen die Führung im Rahmen der App: ein Bildschirm ist an seinem Titel wiedererkennbar (UX-F-170), trägt höchstens eine hervorgehobene Aktion (UX-F-180), und eine zerstörende Aktion wird nie hervorgehoben, damit sie nicht versehentlich als der erwartete nächste Schritt wirkt (UX-F-185, verwandt mit UX-F-120). Statt eines Onboarding-Karussells — das in beiden Alt-Apps fehlte bzw. übersprungen worden wäre — erklärt die App eine Funktion höchstens mit einem einzigen, schließbaren Hinweis im Bereich selbst (UX-F-190). UX-F-200 (Vorlesefokus auf den neuen Titel) und UX-N-030 („Bewegung reduzieren") sind Barrierefreiheits-Anforderungen, die das Navigations-Werkzeug (Expo Router / React Navigation) weitgehend selbst erfüllt; ihre Wirkung wird per Prüfprotokoll am Gerät bestätigt (QA-F-020). UX-F-210 schreibt die Anrede „du" verbindlich fest (Entscheidung FSR FB4, 2026-09-02, Begründung im Konzept Abschnitt 10) — im Englischen ohnehin „you", die Anforderung betrifft daher die deutschen Kataloge.

**Zu UX-F-180 / UX-F-185 (Umsetzung).** Das Bedienelement `AppButton` (`app/src/ui/primitives.tsx`) kennt die Varianten `primary` (hervorgehoben, Akzentfläche), `secondary` und `destructive` (Warnfarbe als Text, ohne Akzentfläche). Die „höchstens eine"-Regel je Ansicht ist eine Bildschirm-Gestaltungsregel und wird beim Bau der einzelnen Ansichten im Prüfprotokoll geführt; die Primitive stellt nur sicher, dass eine zerstörende Aktion nicht als `primary` darstellbar ist.

## Bewusst nicht übernommenes Altverhalten

| Verhalten | Grund |
|---|---|
| Hell-/Dunkelmodus wird nur einmalig beim Start gewählt und reagiert nicht auf Laufzeitänderungen | Widerspricht dem Verhalten, das moderne Betriebssysteme nahelegen; siehe UX-F-020 |
| Textfarbe von Stundenplan-Einträgen ist unabhängig von der Hintergrundfarbe fest Weiß | Führt zu Kontrastproblemen auf hellen Farben wie Gelb und Limette; siehe UX-F-040, UX-N-010 |
| Gruppenzugehörigkeit wird ausschließlich über abgeschwächte Farbe markiert | Verstößt gegen den Grundsatz, Bedeutung nicht allein über Farbe zu vermitteln; siehe UX-F-080 |
| Farbe ändern/Eintrag entfernen (Stundenplan) sowie News anpinnen/ablösen sind nur über langes Drücken erreichbar | Ohne Vorwissen nicht auffindbar; siehe UX-F-090 |

## Offene Fragen

- Entschieden (FSR FB4, 2026-08-25, ergänzt 2026-08-26): Für gewöhnliche Smartphones keine Ausnahmen von der Hochformat-Vorgabe (`platform/non-functional.md` NFR-N-150) — breite Inhalte wie Wiki-Tabellen (WIKI) oder Raumpläne (RAUM) werden horizontal scrollbar gestaltet. Auf Bildschirmen ab 1024 px Breite (Tablets, Faltgeräte) ist seit der Ergänzung zu NFR-N-150 adaptives Layout zulässig; ob und wie davon Gebrauch gemacht wird, klärt sich im Zuge der jeweiligen Bildschirmgestaltung. Offen bleibt außerdem die konkrete Umsetzung des horizontalen Scrollens je betroffener Ansicht auf Smartphones.
