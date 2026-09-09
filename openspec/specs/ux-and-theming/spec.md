## Purpose

Legt die querschnittlichen Gestaltungs- und Barrierefreiheitsanforderungen fest, die für alle Ansichten der neuen App gelten: Markenidentität, Hell-/Dunkelmodus, Farbkontrast, Barrierefreiheit, Gestensteuerung, Ansichtszustände, wiederkehrende Bedienmuster sowie Typografie und Symbolik. Vormals `specs/platform/ux-and-theming.md` (Präfix `UX`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Akzentfarbe des Farbsystems

Das System muss `#FF6600` als Akzentfarbe des Farbsystems verwenden (u. a. Navigationsleisten, Trennlinien, Standardfarbe von Stundenplan-Einträgen), nicht als flächendeckende Hintergrundfarbe jeder Ansicht. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/config/themes/color_consts.dart:4 (vormals UX-F-010).

#### Scenario: Verwendung der Akzentfarbe
- **WHEN** eine Navigationsleiste, eine Trennlinie oder ein Stundenplan-Eintrag ohne individuelle Farbwahl dargestellt wird
- **THEN** verwendet das System `#FF6600` als Akzentfarbe, nicht als Flächenfarbe der gesamten Ansicht

### Requirement: Laufzeitreaktion auf Systemänderung des Erscheinungsbilds

Wenn sich die Systemeinstellung für helles oder dunkles Erscheinungsbild ändert, während die App aktiv ist, dann muss das System das Erscheinungsbild unmittelbar entsprechend anpassen. Herkunft: Alt: bewusst verworfen (vormals UX-F-020).

#### Scenario: Systemweiter Wechsel bei laufender App
- **WHEN** die Nutzerin die Systemeinstellung für helles oder dunkles Erscheinungsbild ändert, während die App im Vordergrund läuft
- **THEN** passt das System sein Erscheinungsbild unmittelbar an, ohne Neustart

### Requirement: Manuelle Übersteuerung des Erscheinungsbilds

Sofern die Nutzerin in den Einstellungen eine manuelle Übersteuerung des Erscheinungsbilds (hell, dunkel oder systemabhängig) wählt, muss das System dieser Wahl unabhängig vom Systemzustand folgen. Herkunft: NEU (vormals UX-F-030).

#### Scenario: Manuelle Wahl entgegen dem Systemzustand
- **WHEN** die Nutzerin „dunkel" wählt, während das Systemerscheinungsbild hell eingestellt ist
- **THEN** zeigt das System das dunkle Erscheinungsbild

### Requirement: Automatische Textfarbenableitung für Stundenplan-Einträge

Das System muss die Textfarbe eines Stundenplan-Eintrags automatisch aus der Helligkeit seiner Hintergrundfarbe ableiten. Herkunft: Alt: bewusst verworfen (vormals UX-F-040).

#### Scenario: Heller Eintraghintergrund
- **WHEN** ein Stundenplan-Eintrag eine helle Hintergrundfarbe wie Gelb oder Limette trägt
- **THEN** leitet das System eine dunkle Textfarbe ab, statt fest Weiß zu verwenden

### Requirement: Übernahme der dynamischen Systemschriftgröße

Das System muss die vom Betriebssystem eingestellte Textgröße (dynamische Schriftgröße) für Textinhalte übernehmen. Herkunft: NEU (vormals UX-F-050).

#### Scenario: Vergrößerte Systemschrift
- **WHEN** die Nutzerin in den Systemeinstellungen eine größere Schriftgröße wählt
- **THEN** übernimmt das System diese Größe für seine Textinhalte

### Requirement: Beschriftung für Bildschirmvorleser

Das System muss jedes Bedienelement mit einer für Bildschirmvorleser auswertbaren Beschriftung versehen. Herkunft: NEU (vormals UX-F-060).

#### Scenario: Bedienung mit aktiviertem Bildschirmvorleser
- **WHEN** ein Bildschirmvorleser ein Bedienelement fokussiert
- **THEN** liest er eine sinnvolle, dem Element entsprechende Beschriftung vor

### Requirement: Bedeutung nicht allein über Farbe

Das System muss jede Bedeutung, die im Entwurf über Farbe vermittelt wird, zusätzlich über Text oder Symbol erkennbar machen. Herkunft: NEU (vormals UX-F-070).

#### Scenario: Farbcodierte Bedeutung
- **WHEN** eine Ansicht eine Bedeutung ausschließlich über Farbe vermitteln würde
- **THEN** ergänzt das System dieselbe Bedeutung zusätzlich über Text oder Symbol

### Requirement: Unterscheidung abgeleiteter Angaben von Quelldaten

Das System muss Angaben, die es selbst aus vorhandenen Daten geschlossen hat, in derselben Ansicht von den unverändert übernommenen Angaben eines Fremdsystems unterscheidbar darstellen. Die Unterscheidung muss ohne Farbwahrnehmung erkennbar sein — durch Anordnung, Auszeichnung, Symbol oder eine benannte Zuschreibung — und sie muss in jeder Ansicht, in der beide Arten nebeneinanderstehen, auf dieselbe Weise erfolgen. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Im Planungsmodus stehen Zeit, Raum, Bezeichnung, Gruppenmenge und lehrende Person — sämtlich aus INT-002 übernommen — in derselben Zeile und derselben Gestalt wie „noch nicht eingeplant", „bereits zugewiesen", „eigene Gruppe" und der Kollisionshinweis, die allesamt Schlussfolgerungen der App sind. Eine Nutzerin kann damit nicht erkennen, was der Fachbereich sagt und was die App meint; bei einer falschen Schlussfolgerung — etwa aus einer unsicheren Gruppenkennung — wendet sie sich an den Fachbereich statt an die App. Das bestehende Requirement „Kennzeichnung als unbestätigte Ableitung" der Capability `schedule` regelt denselben Gedanken für den Raumplan-Abgleich; diese Anforderung hebt ihn auf die gesamte Oberfläche.

#### Scenario: Abgeleitete und übernommene Angabe nebeneinander
- **WHEN** eine Ansicht eine aus vorhandenen Daten geschlossene Angabe neben einer unverändert übernommenen Angabe eines Fremdsystems zeigt
- **THEN** stellt das System beide unterscheidbar dar, und die Unterscheidung ist ohne Farbwahrnehmung erkennbar

#### Scenario: Dieselbe Unterscheidung in zwei Ansichten
- **WHEN** dieselbe Art abgeleiteter Angabe in zwei verschiedenen Ansichten erscheint
- **THEN** verwendet das System dafür dieselbe Form der Unterscheidung

### Requirement: Kennzeichnung fremder Gruppenzugehörigkeit zusätzlich zur Farbe

Wenn ein Stundenplan-Termin nicht zur von der Nutzerin angegebenen Gruppenkennung gehört, dann muss das System dies zusätzlich zur Farbe durch Text oder Symbol kennzeichnen. Herkunft: Alt: bewusst verworfen (vormals UX-F-080).

#### Scenario: Termin außerhalb der eigenen Gruppe
- **WHEN** ein Stundenplan-Termin angezeigt wird, der nicht zur Gruppenkennung der Nutzerin gehört
- **THEN** kennzeichnet das System dies zusätzlich zur reduzierten Farbdeckkraft durch Text oder Symbol

### Requirement: Zweiter sichtbarer Bedienweg statt reiner Geste

Wenn eine Aktion ausschließlich über eine Geste wie langes Drücken erreichbar ist, dann muss das System zusätzlich einen zweiten, sichtbaren Bedienweg für dieselbe Aktion bereitstellen. Herkunft: Alt: bewusst verworfen (vormals UX-F-090).

#### Scenario: Aktion nur über langes Drücken
- **WHEN** eine Aktion wie Farbe ändern, Eintrag entfernen oder News anpinnen konzipiert ist
- **THEN** bietet das System dafür zusätzlich zur Geste einen sichtbaren Bedienweg an

### Requirement: Lade-, Leer-, Fehler- und Offline-Zustand je Ansicht

Das System muss für jede Ansicht einen definierten Lade-, Leer-, Fehler- und Offline-Zustand bereitstellen. Herkunft: NEU (vormals UX-F-100).

#### Scenario: Ansicht ohne Daten
- **WHEN** eine Ansicht keine Daten zum Anzeigen hat, weil sie noch lädt, leer ist, einen Fehler hatte oder offline ist
- **THEN** zeigt das System den jeweils passenden, definierten Zustand

### Requirement: Nächster Schritt im Leerzustand

Wenn eine Ansicht ihren Leerzustand zeigt, dann muss das System den nächsten sinnvollen Schritt zur Behebung nennen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart:127 (vormals UX-F-110).

#### Scenario: Leerer Stundenplan
- **WHEN** der Stundenplan keine Einträge enthält
- **THEN** nennt das System den nächsten sinnvollen Schritt (z. B. Hinweis auf das Hinzufügen-Symbol)

### Requirement: Bestätigung vor zerstörender Aktion

Wenn die Nutzerin eine zerstörende Aktion auslöst, dann muss das System vor deren Ausführung eine Bestätigung einholen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart:37 (vormals UX-F-120).

#### Scenario: Löschen des Stundenplans
- **WHEN** die Nutzerin das Löschen des Stundenplans oder Tickets auslöst
- **THEN** fragt das System vor der Ausführung nach Bestätigung

### Requirement: Einheitliche Gestaltung von Fehlermeldungen

Das System muss Fehlermeldungen über alle Ansichten hinweg einheitlich gestalten. Herkunft: NEU (vormals UX-F-130).

#### Scenario: Fehler in zwei verschiedenen Bereichen
- **WHEN** in zwei unterschiedlichen Bereichen der App ein Fehlerzustand auftritt
- **THEN** gestaltet das System beide Fehlermeldungen nach demselben Muster

### Requirement: Einheitliche Gestaltung von Ladeanzeigen

Das System muss Ladeanzeigen über alle Ansichten hinweg einheitlich gestalten. Herkunft: NEU (vormals UX-F-140).

#### Scenario: Ladezustand in zwei verschiedenen Bereichen
- **WHEN** in zwei unterschiedlichen Bereichen der App ein Ladezustand angezeigt wird
- **THEN** gestaltet das System beide Ladeanzeigen nach demselben Muster

### Requirement: Einheitliches Symbolsystem für wiederkehrende fachliche Bedeutungen

Sofern eine fachliche Bedeutung wiederkehrend durch ein Symbol dargestellt wird (z. B. Essen, Vegetarisch), muss das System dafür ein einheitliches Symbolsystem verwenden. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/utils/ui/icons/fb4app_icons.dart:31 (vormals UX-F-150).

#### Scenario: Fachliches Symbol in zwei Bereichen
- **WHEN** dieselbe fachliche Bedeutung (z. B. „vegetarisch") in zwei verschiedenen Bereichen der App dargestellt wird
- **THEN** verwendet das System dafür dasselbe Symbol aus demselben Symbolsystem

### Requirement: Manuelle Aktualisierungsgeste für abrufbare entfernte Daten

Das System muss für jede Ansicht mit direkt abrufbaren entfernten Daten eine manuelle Aktualisierungsgeste oder eine gleichwertige, sichtbare Aktualisieren-Aktion bereitstellen. Herkunft: NEU (vormals UX-F-160).

#### Scenario: Herunterziehen im Mensaplan
- **WHEN** die Nutzerin im Mensaplan die Ansicht nach unten zieht
- **THEN** löst das System eine Aktualisierung der angezeigten Daten aus

### Requirement: Bildschirmtitel entsprechend dem Einstiegspunkt

Das System muss auf jedem Bildschirm einen Titel führen, der der Bezeichnung des Einstiegspunkts entspricht, über den der Bildschirm erreicht wurde. Herkunft: NEU (vormals UX-F-170).

#### Scenario: Aufruf über einen Tab
- **WHEN** ein Bildschirm über einen bestimmten Tab erreicht wird
- **THEN** entspricht der angezeigte Bildschirmtitel der Bezeichnung dieses Tabs

### Requirement: Höchstens eine hervorgehobene Primäraktion je Ansicht

Das System muss je Ansicht höchstens eine visuell hervorgehobene Primäraktion vorsehen. Herkunft: NEU (vormals UX-F-180).

#### Scenario: Ansicht mit mehreren Aktionen
- **WHEN** eine Ansicht mehrere mögliche Aktionen anbietet
- **THEN** hebt das System höchstens eine davon visuell als Primäraktion hervor

### Requirement: Keine zerstörende Aktion als Primäraktion

Das System darf eine zerstörende Aktion nicht als hervorgehobene Primäraktion darstellen. Herkunft: NEU (vormals UX-F-185).

#### Scenario: Zerstörende Aktion neben einer Primäraktion
- **WHEN** eine Ansicht sowohl eine zerstörende Aktion als auch eine hervorgehobene Primäraktion anbietet
- **THEN** stellt das System die zerstörende Aktion nicht in der hervorgehobenen Primärgestaltung dar

### Requirement: Höchstens ein schließbarer Einführungshinweis je Bereich

Wenn ein Bereich zum ersten Mal geöffnet wird, darf das System höchstens einen schließbaren Einführungshinweis zeigen und diesen nach dem Schließen nicht erneut anzeigen. Herkunft: Alt: bewusst verworfen (vormals UX-F-190).

#### Scenario: Erster Aufruf eines Bereichs
- **WHEN** ein Bereich zum ersten Mal geöffnet wird
- **THEN** zeigt das System höchstens einen schließbaren Einführungshinweis, der nach dem Schließen nicht erneut erscheint

### Requirement: Vorlesefokus auf den neuen Bildschirmtitel

Wenn der angezeigte Bildschirm wechselt, muss das System den Bedienfokus für Bildschirmvorleser auf den Titel des neuen Bildschirms setzen. Herkunft: NEU (vormals UX-F-200).

#### Scenario: Navigation zu einem neuen Bildschirm
- **WHEN** die Nutzerin zu einem neuen Bildschirm navigiert und ein Bildschirmvorleser aktiv ist
- **THEN** setzt das System den Vorlesefokus auf den Titel des neuen Bildschirms

### Requirement: Anrede „du" in deutschen Texten

Das System muss nutzerseitige deutsche Texte durchgängig in der Anrede „du" formulieren. Herkunft: NEU (vormals UX-F-210).

#### Scenario: Deutscher Oberflächentext
- **WHEN** ein nutzerseitiger deutscher Text in der Oberfläche angezeigt wird
- **THEN** verwendet er durchgängig die Anrede „du"

### Requirement: Statusleisten-Kontrast an das Erscheinungsbild anpassen

Das System muss die Darstellung der Betriebssystem-Statusleiste (Kontrast der Symbole) an das wirksame Erscheinungsbild anpassen, sodass ihre Inhalte in hellem wie dunklem Erscheinungsbild sichtbar bleiben. Herkunft: NEU (vormals UX-F-220).

#### Scenario: Dunkles Erscheinungsbild
- **WHEN** das wirksame Erscheinungsbild dunkel ist
- **THEN** zeigt das System die Statusleisten-Symbole in einem auf dunklem Grund sichtbaren Kontrast

### Requirement: Mindestkontrast für Stundenplan-Einträge

Das System muss zwischen Textfarbe und Hintergrundfarbe eines Stundenplan-Eintrags einen Kontrast von mindestens 4,5:1 einhalten. Herkunft: NEU (vormals UX-N-010).

#### Scenario: Prüfung eines Stundenplan-Eintrags
- **WHEN** Text- und Hintergrundfarbe eines Stundenplan-Eintrags gemessen werden
- **THEN** beträgt der Kontrast mindestens 4,5:1

### Requirement: Mindestgröße für Bedienelemente

Das System muss für Bedienelemente eine Mindestgröße von 44×44 dp bzw. dem plattformüblichen Äquivalent einhalten. Herkunft: NEU (vormals UX-N-020).

#### Scenario: Prüfung eines Bedienelements
- **WHEN** die Größe eines Bedienelements gemessen wird
- **THEN** beträgt sie mindestens 44×44 dp bzw. das plattformübliche Äquivalent

### Requirement: Reduzierte Bewegung respektieren

Das System muss die Systemeinstellung „Bewegung reduzieren" respektieren und Übergangsanimationen bei aktivierter Einstellung reduzieren oder abschalten. Herkunft: NEU (vormals UX-N-030).

#### Scenario: Aktivierte Systemeinstellung „Bewegung reduzieren"
- **WHEN** die Systemeinstellung „Bewegung reduzieren" aktiviert ist und ein Bildschirmwechsel stattfindet
- **THEN** reduziert oder unterlässt das System die Übergangsanimation

## Befunde aus der Alt-App

| Befund | Quelle | Konsequenz |
|---|---|---|
| Orange (`#FF6600`) als einzige Akzentfarbe, u. a. für Navigationsleisten, Trennlinien und Standardfarbe von Stundenplan-Einträgen | `lib/config/themes/color_consts.dart:4`; Verwendung z. B. `lib/areas/more/screens/settings_page.dart:18` | Übernahme als Akzentfarbe eines Farbsystems, nicht als Flächenfarbe jeder Ansicht (Requirement „Akzentfarbe des Farbsystems") |
| Hell-/Dunkelmodus wird einmalig beim Start aus der Systemhelligkeit gewählt und reagiert danach nicht auf Laufzeitänderungen | `lib/main.dart:111-112` | Laufzeitreaktion und manuelle Übersteuerung gefordert (Requirements „Laufzeitreaktion auf Systemänderung des Erscheinungsbilds", „Manuelle Übersteuerung des Erscheinungsbilds") |
| Palette von 22 Farben für Stundenplan-Einträge, darunter helle Töne (Gelb, Limette); Textfarbe in allen vier Textelementen fest auf Weiß gesetzt | Palette: `lib/areas/schedule/widgets/schedule_list.dart:89-112`; Textfarbe: `lib/areas/schedule/widgets/schedule_card.dart:72,80,98,107,114` | Automatische Ableitung der Textfarbe und Mindestkontrast gefordert (Requirements „Automatische Textfarbenableitung für Stundenplan-Einträge", „Mindestkontrast für Stundenplan-Einträge") |
| Termine außerhalb der eigenen Gruppe werden ausschließlich durch reduzierte Deckkraft der Akzentfarbe markiert (`mainOrange.withAlpha(168)`), ohne Text oder Symbol | `lib/areas/schedule/widgets/schedule_card.dart:52-54` | Verstoß gegen „keine Bedeutung allein über Farbe"; zusätzliches Merkmal gefordert (Requirements „Bedeutung nicht allein über Farbe", „Kennzeichnung fremder Gruppenzugehörigkeit zusätzlich zur Farbe") |
| Farbe ändern und Eintrag entfernen im Stundenplan nur über langes Drücken (Kontextmenü) erreichbar | `lib/areas/schedule/widgets/schedule_list.dart:39-42,64-149` | Zweiter, sichtbarer Bedienweg gefordert (Requirement „Zweiter sichtbarer Bedienweg statt reiner Geste") |
| News anpinnen und ablösen nur über langes Drücken erreichbar | `lib/areas/news/screens/news_overview_page.dart:199-241` | Zweiter, sichtbarer Bedienweg gefordert (Requirement „Zweiter sichtbarer Bedienweg statt reiner Geste") |
| Leerzustände benennen bereits den nächsten Schritt (Stundenplan: Hinweis auf Plus-Symbol; Mensa: Hinweis auf Einstellungen) | `lib/areas/schedule/screens/schedule_overview_page.dart:127`; `lib/areas/canteen/screens/canteen_overview_page.dart:89` | Positives Vorbild, Muster wird übernommen (Requirement „Nächster Schritt im Leerzustand") |
| Löschen von Stundenplan und Ticket fragt vor Ausführung nach Bestätigung | `lib/areas/more/screens/settings_page.dart:37-48,62-72` | Muster wird für alle zerstörenden Aktionen verbindlich gemacht (Requirement „Bestätigung vor zerstörender Aktion") |
| Eigene Symbolschrift `Fb4App` für fachliche Symbole (Essen, Vegetarisch) | `assets/fonts/Fb4app.ttf`; `lib/utils/ui/icons/fb4app_icons.dart:31-32` | Bedarf an einheitlichem Symbolsystem übernommen, Umsetzung offen (Requirement „Einheitliches Symbolsystem für wiederkehrende fachliche Bedeutungen") |
| Durchgängige Verwendung der iOS-Widgetbibliothek (Cupertino) auf beiden Plattformen, z. B. `CupertinoApp`, `CupertinoNavigationBar`, `CupertinoActionSheet` | `lib/main.dart:119`; durchgängig u. a. in `lib/areas/more/screens/settings_page.dart` | Plattformtreue als offene Entscheidung mit Empfehlung (siehe „Begründungen") |

## Begründungen

**Zu Laufzeitreaktion / manuelle Übersteuerung (Hell-/Dunkelmodus).** Die Alt-App liest die Systemhelligkeit nur einmalig in `FB4App.build()` aus (`lib/main.dart:111-112`) und besitzt keinen Beobachter für spätere Änderungen; ein Wechsel der Systemeinstellung wirkt sich erst nach Neustart der App aus. Das entspricht nicht mehr dem, was Nutzerinnen und Nutzer von Betriebssystemen mit systemweitem Dunkelmodus erwarten. Die manuelle Übersteuerung ist zusätzlich nötig, weil einzelne Personen unabhängig von der Systemeinstellung ein bestimmtes Erscheinungsbild bevorzugen können.

Umgesetzt (Roadmap-Schritt 2) über `app/src/theme`: ein `ThemeProvider` löst bei jedem Rendern aus dem abonnierenden `useColorScheme()` und der gespeicherten Wahl (`appearanceMode`) das wirksame Farbschema auf — die Systemhelligkeit wird also nicht mehr beim Start eingefroren, und eine Wahl `light`/`dark` gilt vor dem Systemzustand. Das On-Device-Umschalten der Systemeinstellung bei laufender App ist zusätzlich im Prüfprotokoll `specs/pruefprotokolle/2026-09-02-app-rahmen.md` festgehalten (QA-F-020).

Das Navigations-Werkzeug (Expo Router / React Navigation) führt über einen internen Container ein eigenes Theme, das ohne Zutun auf der hellen Voreinstellung bleibt. Damit das wirksame Farbschema auch für die vom Navigator gezeichneten Flächen gilt — Navigator- und Szenengrund, Kopf- und Tab-Leiste, die Fläche hinter Szenenübergängen —, überführt `app/src/theme/navigationTheme.ts` das Farbsystem in ein React-Navigation-Theme, das das Wurzel-Layout `app/app/_layout.tsx` setzt (ergänzt um einen `contentStyle`-Grund am Wurzel-Stack, wie ihn die verschachtelten Stacks bereits tragen). Vor dieser Brücke blitzte beim Tab-Wechsel im Dunkelmodus kurz ein heller Rand durch die während des Übergangs teiltransparenten Szenen; der Befund ist im selben Prüfprotokoll festgehalten (visuelle Bestätigung am Gerät ausstehend).

**Zu Bildschirmtitel entsprechend dem Einstiegspunkt / reduzierte Bewegung — ruhiger Titelwechsel beim Tab-Wechsel (2026-09-04).** Der Tab-Navigator lief zunächst mit der Übergangsart `shift`, die die ein- und ausgehende Szene samt ihrer Kopfzeile waagerecht verschiebt. Weil die Bereiche unterschiedliche Kopfzeilen führen — die meisten die Tab-eigene, der Mensaplan die seines verschachtelten Stapels — wirkte der gleichzeitige Auf- und Abbau zweier verschiedener Kopfzeilen beim Umschalten unruhig („Titel verhält sich komisch"). Der Navigator nutzt daher jetzt `fade` (bzw. `none` bei aktiver Systemeinstellung „Bewegung reduzieren"): die Kopfzeile blendet an Ort und Stelle über, statt zu wandern. `app/app/(tabs)/_layout.tsx`.

**Zu Statusleisten-Kontrast.** Die App zeichnet ihre Ansichten themengefärbt, die Betriebssystem-Statusleiste (Uhr, Akku, Empfang) bleibt davon aber unberührt, solange sie nicht ausdrücklich gesetzt wird. Der native Android-Rahmen liefert eine hell voreingestellte Statusleiste; im Dunkelmodus zeichnet das System dort helle Symbole auf hellen Grund, sodass die gesamte Statuszeile unsichtbar wird — ein Befund aus der Geräteprüfung des App-Rahmens. Das Requirement verlangt daher, die Statusleiste dem wirksamen Erscheinungsbild anzugleichen. Umgesetzt über `app/src/theme/statusBar.tsx` (`ThemedStatusBar`), einmalig im Wurzel-Layout `app/app/_layout.tsx` gerendert: die Symbolfarbe folgt dem vom `ThemeProvider` aufgelösten Schema (also auch einer manuellen Übersteuerung), der Hintergrund bleibt durchscheinend, sodass der themengefärbte Hintergrund der jeweiligen Ansicht trägt. Die Sichtprüfung in hellem und dunklem Erscheinungsbild ist im Prüfprotokoll `specs/pruefprotokolle/2026-09-02-app-rahmen.md` festgehalten.

**Zu Bedeutung nicht allein über Farbe / Kennzeichnung fremder Gruppenzugehörigkeit.** Menschen mit Farbsinnstörung oder in hellem Umgebungslicht können eine reine Opazitätsabstufung derselben Farbe nicht zuverlässig von der Vollfarbe unterscheiden. Der konkrete Befund in `schedule_card.dart:52-54` — Gruppenzugehörigkeit wird ausschließlich über `mainOrange.withAlpha(168)` signalisiert — ist ein Beispiel für diesen allgemeinen Mangel und wird im Requirement „Kennzeichnung fremder Gruppenzugehörigkeit zusätzlich zur Farbe" gezielt adressiert.

**Zu Gestensteuerung.** Langes Drücken hat in mobilen Betriebssystemen keine einheitliche Entdeckungsmethode; es gibt keinen visuellen Hinweis darauf, dass eine Aktion dahinter verborgen ist. Sowohl das Ändern der Farbe/Entfernen von Stundenplan-Einträgen als auch das Anpinnen/Ablösen von News sind dadurch in der Alt-App nur durch Ausprobieren oder Weitergabe von Wissen auffindbar.

**Zu Plattformtreue (entschieden).** Eigenständige, plattformübergreifende Gestaltung statt getrennter nativer Gestaltungssprachen je Plattform — Entscheidung FSR FB4, 2026-08-25, wie empfohlen. Begründung: Die Alt-App bildet ohnehin nur die iOS-Sprache nach, unabhängig von der Zielplattform — es gibt also kein etabliertes Android-Vorbild, das fortgeführt werden müsste. Eine einheitliche Gestaltung senkt zudem den Pflegeaufwand für ein kleines, ehrenamtlich getragenes Projekt und stärkt die Wiedererkennbarkeit der FSR-Marke unabhängig vom Gerät.

**Zu manueller Aktualisierungsgeste.** Die Flutter-Alt-App bot Pull-to-Refresh (`specs/product/legacy-inventory.md`, L-034); für die Neuentwicklung war dafür bislang keine Anforderung mehr formuliert, obwohl mehrere Ansichten (NEWS, MENSA, EVENT) direkt abrufbare entfernte Daten zeigen. Ergänzt das bisher nur im Fehlerzustand vorgesehene „Wiederholen" (siehe jeweilige Feature-Capability) um eine reguläre, jederzeit verfügbare Aktualisierungsmöglichkeit.

**Zu einheitlichem Symbolsystem (entschieden und begonnen).** Bestehende Open-Source-Icon-Bibliothek statt eigener Schriftart oder eigenem SVG-Set — Entscheidung FSR FB4, 2026-08-25. Konkrete Wahl der technischen Leitung, 2026-09-04: **Ionicons** über das mit dem Expo-SDK mitgelieferte Paket `@expo/vector-icons` (Icon-Schrift lokal im Anwendungspaket, MIT-Lizenz, kein Netz- oder Fremddienstabruf — verträglich mit Capability `non-functional`, NFR-N-170/210). Erste Nutzung: die Tab-Leiste (Symboltabelle in `app/src/navigation/tabIcons.tsx`, eingebunden in `app/app/(tabs)/_layout.tsx`) und der Zugang zum Filtermenü des Mensaplans (`funnel`); fachliche Symbole (Essen, Vegetarisch u. a.) folgen mit den jeweiligen Features aus derselben Bibliothek.

Die Icon-Schrift liegt als `app/assets/fonts/ionicons.ttf` (unveränderte Kopie aus `@expo/vector-icons`, Dateiname absichtlich kleingeschrieben — siehe `assets/fonts/README.md`) im Repo und wird über das `expo-font`-Config-Plugin (`app.json`) fest in den nativen Build von Android und iOS eingebettet. Grund der Korrektur, 2026-09-04: Der zunächst gewählte Weg — kein separater Font im Repo, stattdessen `Font.loadAsync(Ionicons.font)` einmalig im Wurzel-Layout — lud die Schrift zur Laufzeit über Metro nach; auf einem Android-Dev-Client blieben die Tab-Symbole dadurch leer, sobald Metro nicht erreichbar war oder — reproduzierbar auch bei laufendem Metro — die Schrift nicht rechtzeitig vor dem ersten Rendern eines `Text`-Knotens mit `fontFamily: 'ionicons'` angewendet war (Geräteprüfung, Android-Emulator, 2026-09-04: Tab-Symbole vollständig leer, `TextView`-Breite der Glyphe nahe null statt der erwarteten Symbolbreite — Systemschrift statt Ionicons wurde verwendet). Die feste Einbettung macht die Schrift beim allerersten Rendern verfügbar, unabhängig von Metro oder dem Netz.

Im Wurzel-Layout (`app/app/_layout.tsx`) lädt `useFonts(Ionicons.font)` aus `expo-font` die Schrift weiterhin einmalig vor dem ersten Rendern der eigentlichen App — auf Android/iOS kehrt der Aufruf dank der Einbettung sofort zurück (kein Netzabruf); im Web-Export, den das Config-Plugin nicht abdeckt, lädt derselbe Aufruf die Schrift wie zuvor zur Laufzeit nach und erzeugt den nötigen `@font-face`-Block. Ein Ladefehler wird protokolliert (Capability `security-and-privacy`, Requirement „Keine stillschweigend verschwindenden Fehler"), blockiert den Start aber nicht.

Fachliche Symbolzuordnung der Tab-Leiste (Bedeutung, dahinter die umgesetzte Ionicons-Glyphe — `specs/features/app-shell/nutzerfuehrung-konzept.md` Abschnitt 3.1, künftig Capability `app-shell`):

| Tab | Bedeutung des Symbols | Glyphe (umrissen / gefüllt) |
|---|---|---|
| Stundenplan | Kalender / Raster | `calendar-outline` / `calendar` |
| Mensaplan | Besteck | `restaurant-outline` / `restaurant` |
| News | Sprechblase / Zeitung | `newspaper-outline` / `newspaper` |
| Raumsuche | Lupe / Grundriss | `search-outline` / `search` |
| Mehr | Punkte-Menü | `ellipsis-horizontal-outline` / `ellipsis-horizontal` |

Der aktive Tab ist zusätzlich zur Akzentfarbe durch das gefüllte (statt umrissene) Symbol markiert (Requirement „Bedeutung nicht allein über Farbe"). Die Beschriftung bleibt immer sichtbar (kein reines Icon-Tab). Ebenfalls aus Ionicons: der Zugang zum Filtermenü des Mensaplans (`funnel` / `funnel-outline`, Capability `canteen`, MENSA-F-170).

**Zu Bildschirmtitel, Primäraktion, Einführungshinweis, Vorlesefokus, Anrede, reduzierte Bewegung (Nutzerführung).** Diese Anforderungen entstammen dem Konzept `specs/features/app-shell/nutzerfuehrung-konzept.md` Abschnitt 12 (2026-09-02) und ergänzen die Führung im Rahmen der App: ein Bildschirm ist an seinem Titel wiedererkennbar, trägt höchstens eine hervorgehobene Aktion, und eine zerstörende Aktion wird nie hervorgehoben, damit sie nicht versehentlich als der erwartete nächste Schritt wirkt (verwandt mit Requirement „Bestätigung vor zerstörender Aktion"). Statt eines Onboarding-Karussells — das in beiden Alt-Apps fehlte bzw. übersprungen worden wäre — erklärt die App eine Funktion höchstens mit einem einzigen, schließbaren Hinweis im Bereich selbst. Vorlesefokus auf den neuen Titel und „Bewegung reduzieren" sind Barrierefreiheits-Anforderungen, die das Navigations-Werkzeug (Expo Router / React Navigation) weitgehend selbst erfüllt; ihre Wirkung wird per Prüfprotokoll am Gerät bestätigt (QA-F-020). Die Anrede „du" ist verbindlich festgeschrieben (Entscheidung FSR FB4, 2026-09-02, Begründung im Konzept Abschnitt 10) — im Englischen ohnehin „you", die Anforderung betrifft daher die deutschen Kataloge.

**Zu Primäraktion / zerstörender Aktion (Umsetzung).** Das Bedienelement `AppButton` (`app/src/ui/primitives.tsx`) kennt die Varianten `primary` (hervorgehoben, Akzentfläche), `secondary` und `destructive` (Warnfarbe als Text, ohne Akzentfläche). Die „höchstens eine"-Regel je Ansicht ist eine Bildschirm-Gestaltungsregel und wird beim Bau der einzelnen Ansichten im Prüfprotokoll geführt; die Primitive stellt nur sicher, dass eine zerstörende Aktion nicht als `primary` darstellbar ist.

## Bewusst nicht übernommenes Altverhalten

| Verhalten | Grund |
|---|---|
| Hell-/Dunkelmodus wird nur einmalig beim Start gewählt und reagiert nicht auf Laufzeitänderungen | Widerspricht dem Verhalten, das moderne Betriebssysteme nahelegen; siehe Requirement „Laufzeitreaktion auf Systemänderung des Erscheinungsbilds" |
| Textfarbe von Stundenplan-Einträgen ist unabhängig von der Hintergrundfarbe fest Weiß | Führt zu Kontrastproblemen auf hellen Farben wie Gelb und Limette; siehe Requirements „Automatische Textfarbenableitung für Stundenplan-Einträge", „Mindestkontrast für Stundenplan-Einträge" |
| Gruppenzugehörigkeit wird ausschließlich über abgeschwächte Farbe markiert | Verstößt gegen den Grundsatz, Bedeutung nicht allein über Farbe zu vermitteln; siehe Requirement „Kennzeichnung fremder Gruppenzugehörigkeit zusätzlich zur Farbe" |
| Farbe ändern/Eintrag entfernen (Stundenplan) sowie News anpinnen/ablösen sind nur über langes Drücken erreichbar | Ohne Vorwissen nicht auffindbar; siehe Requirement „Zweiter sichtbarer Bedienweg statt reiner Geste" |

## Offene Fragen

- Entschieden (FSR FB4, 2026-08-25, ergänzt 2026-08-26): Für gewöhnliche Smartphones keine Ausnahmen von der Hochformat-Vorgabe (Capability `non-functional`, NFR-N-150) — breite Inhalte wie Wiki-Tabellen (WIKI) oder Raumpläne (RAUM) werden horizontal scrollbar gestaltet. Auf Bildschirmen ab 1024 px Breite (Tablets, Faltgeräte) ist seit der Ergänzung zu NFR-N-150 adaptives Layout zulässig; ob und wie davon Gebrauch gemacht wird, klärt sich im Zuge der jeweiligen Bildschirmgestaltung. Offen bleibt außerdem die konkrete Umsetzung des horizontalen Scrollens je betroffener Ansicht auf Smartphones.
