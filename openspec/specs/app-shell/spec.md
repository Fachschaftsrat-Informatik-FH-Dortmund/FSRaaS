## Purpose

Bietet die übergeordnete Navigationsstruktur, über die alle Features erreichbar sind, und löst die Randbedingung, dass die neue App deutlich mehr Bereiche als die fünf gleichrangigen Tabs der Alt-App aufnehmen muss, ohne sie alle gleichrangig in einer Tab-Leiste zu häufen. Vormals `specs/features/app-shell/spec.md` (Präfix `SHELL`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Tab-Leiste mit Sammel-Einstieg statt gleichrangiger Tabs

Das System muss eine Navigationsstruktur aus einer Tab-Leiste mit den meistgenutzten Kernbereichen sowie einem zusätzlichen Sammel-Einstieg („Mehr") für alle übrigen Bereiche bereitstellen, statt alle Bereiche als gleichrangige Einträge einer einzigen Tab-Leiste zu häufen. Herkunft: Alt: bewusst verworfen (vormals SHELL-F-010). Entscheidung FSR FB4, 2026-08-25: Muster „Tab-Leiste + Mehr-Sammelpunkt" statt Drawer/Seitenmenü oder Hybrid — bei inzwischen vierzehn Feature-Capabilities ist eine flache Tab-Leiste nicht mehr tragfähig (siehe Capability `architecture`, ARCH-N-010).

#### Scenario: Vierzehn Bereiche, vier Tabs
- **WHEN** die App vierzehn Feature-Bereiche umfasst
- **THEN** zeigt die Tab-Leiste nur die meistgenutzten Kernbereiche, alle übrigen sind ausschließlich über „Mehr" erreichbar

### Requirement: Kernfeatures in höchstens zwei Interaktionsschritten

Das System muss jedes Kernfeature von der Startseite aus in höchstens zwei Interaktionsschritten erreichbar machen. Herkunft: NEU (vormals SHELL-F-020).

#### Scenario: Kernfeature aus „Mehr" erreichen
- **WHEN** ein Kernfeature nicht in der Tab-Leiste liegt
- **THEN** ist es über „Mehr" mit höchstens einem weiteren Antippen erreichbar

### Requirement: Zustimmungs-Gate beim Erststart

Wenn die App zum ersten Mal gestartet wird, muss das System vor der Nutzung von Funktionen mit personenbezogenen Daten eine Zustimmung zur Datenschutzerklärung einholen. Herkunft: Alt: bewusst verworfen (vormals SHELL-F-030). Die Alt-App ermittelt `shouldShowPrivacyPolicy` korrekt aus Einstellung und Versionsvergleich, überschreibt das Ergebnis aber unmittelbar danach fest auf `false` (`main_view_model.dart:8-22`, dokumentiert in Capability `security-and-privacy`, SEC-F-010); das Zustimmungs-Gate der Alt-App ist damit wirkungslos, für die Neuentwicklung ist ein tatsächlich wirksames Gate verbindlich. Der Erststart-Dialog darf zurückgestellt werden („Später — nur Basisfunktionen"): Die App bleibt dann mit allen Bereichen ohne Personenbezug (Stundenplan, Mensaplan, News, Raumsuche) nutzbar, Funktionen mit personenbezogenen oder nutzergenerierten Daten bleiben bis zur Zustimmung gesperrt (SEC-F-010).

#### Scenario: Zustimmung zurückgestellt
- **WHEN** eine Nutzerin beim Erststart „Später — nur Basisfunktionen" wählt
- **THEN** bleiben Stundenplan, Mensaplan, News und Raumsuche nutzbar, während Funktionen mit personenbezogenen Daten gesperrt bleiben

### Requirement: Betriebssystem-Schnellzugriffe

Das System muss Betriebssystem-Schnellzugriffe auf mindestens die Ansichten Stundenplan und Semesterticket bereitstellen. Herkunft: Alt: lib/utils/plugins/quick_actions_manager.dart (vormals SHELL-F-040). Umgesetzt als dynamische Verknüpfungen (`QuickActions.setItems`, Android `ShortcutManagerCompat`, iOS `UIApplicationShortcutItem`), nicht als statische Manifest-Einträge — die Ziele Stundenplan (`/`) und Semesterticket (`/more/ticket`) sind datenbeschrieben (`app/src/navigation/quickActions.ts`), ihre Titel übersetzt (Capability `non-functional`, NFR-F-115). Die Alt-App verdrahtete Titel und Ziel fest.

#### Scenario: Schnellzugriff auf das Semesterticket
- **WHEN** eine Nutzerin den Betriebssystem-Schnellzugriff „Semesterticket anzeigen" antippt
- **THEN** navigiert die App direkt zur Semesterticket-Ansicht

### Requirement: Datei-basierte Navigationsstruktur

Das System muss die Navigationsstruktur datei-basiert abbilden, wobei jede Routendatei auf eine Bildschirmkomponente des zugehörigen `areas/<bereich>`-Moduls verweist, statt Fachlogik in der Routendatei selbst zu implementieren. Herkunft: NEU (vormals SHELL-F-050). Löst die Werkzeugwahl für Navigation über `specs/decisions/0013-zustand-navigation-und-netzwerkschicht.md` (Expo Router) auf. Ändert nichts am Navigationsmuster selbst oder an der Bereichs-Zuordnung, nur an dessen technischer Umsetzung.

#### Scenario: Routendatei ohne Fachlogik
- **WHEN** eine neue Route für einen Bereich angelegt wird
- **THEN** verweist die Routendatei ausschließlich auf eine Bildschirmkomponente aus `areas/<bereich>`, ohne eigene Fachlogik zu enthalten

### Requirement: Bereichszuordnung der Tab-Leiste

Das System muss die Tab-Leiste mit genau den Bereichen Stundenplan, Mensaplan, News und Raumsuche besetzen; alle übrigen Bereiche sind ausschließlich über „Mehr" erreichbar. Herkunft: NEU (vormals SHELL-F-060). Entscheidung FSR FB4/technische Leitung, 2026-08-26: Die vier meistgenutzten Kernfunktionen der ersten Ausbaustufe besetzen die Tab-Leiste. Semesterticket, Einstellungen und Verwaltung liegen unter „Mehr", ebenso — sobald Ausbaustufe 2 beginnt — Events, Helfer-Anmeldung, Wiki, Notenübersicht und E-Key-Verwaltung.

#### Scenario: Feste vier Tabs
- **WHEN** die Tab-Leiste dargestellt wird
- **THEN** zeigt sie genau Stundenplan, Mensaplan, News, Raumsuche und den Sammel-Einstieg „Mehr", keinen weiteren Bereich

### Requirement: Konfigurierte Startansicht beim regulären Start

Beim regulären Start muss das System die in den Einstellungen konfigurierte Startansicht öffnen; ohne Konfiguration den Stundenplan. Herkunft: NEU (vormals SHELL-F-070). Die Alt-App öffnete fest den Stundenplan. Die Neuentwicklung behält den Stundenplan als Voreinstellung (meistgenutzte Funktion beider Alt-Apps, siehe `specs/product/roadmap.md` Abschnitt 6), erlaubt aber die Wahl einer anderen Startansicht in den Einstellungen (Capability `settings`, SET-F-160). Die Option „zuletzt genutzt" ist eingeschlossen; der zuletzt aktive Tab wird dafür lokal vermerkt. Kein eigener Dashboard-/Home-Bildschirm — er wäre eine zusätzliche Ebene, die mit den Tabs um dieselbe Aufgabe konkurriert.

#### Scenario: Start ohne Konfiguration
- **WHEN** die App ohne konfigurierte Startansicht regulär gestartet wird
- **THEN** öffnet sie den Stundenplan

#### Scenario: Start mit konfigurierter Startansicht
- **WHEN** in den Einstellungen „zuletzt genutzt" als Startansicht gewählt ist
- **THEN** öffnet die App beim regulären Start den zuletzt aktiven Tab

### Requirement: Eigenständiger Navigations-Stack je Tab

Das System muss je Tab einen eigenständigen Navigations-Stack führen, der bei einem Tab-Wechsel erhalten bleibt. Herkunft: NEU (vormals SHELL-F-080). Verhalten des Navigations-Werkzeugs (Expo Router / React Navigation): Jeder Tab hält seinen eigenen Stack, der bei Tab-Wechsel nicht verworfen wird.

#### Scenario: Stack bleibt bei Tab-Wechsel erhalten
- **WHEN** eine Nutzerin im Stundenplan-Tab zwei Ebenen tief navigiert und zum Mensaplan-Tab wechselt
- **THEN** bleibt der Stundenplan-Stack bestehen und zeigt bei Rückkehr wieder dieselbe Ebene

### Requirement: Rücksprung auf die Wurzel bei erneutem Tab-Tap

Wenn der bereits aktive Tab erneut angetippt wird, muss das System dessen Navigations-Stack auf die Wurzel zurücksetzen. Herkunft: NEU (vormals SHELL-F-085).

#### Scenario: Erneutes Antippen des aktiven Tabs
- **WHEN** eine Nutzerin im aktiven Tab zwei Ebenen tief navigiert ist und denselben Tab erneut antippt
- **THEN** springt die Navigation zur Wurzel dieses Tabs zurück

### Requirement: „Mehr" als gruppierte Liste ohne tote Einträge

Das System muss „Mehr" als nach Themen gruppierte Liste darstellen und einen Bereich einer künftigen Ausbaustufe erst mit dessen Umsetzung in die Liste aufnehmen, statt ihn ausgegraut anzuzeigen. Herkunft: NEU (vormals SHELL-F-090). „Mehr" ist ein eigener Stack mit einer nach Themen gruppierten Liste (Zwischenüberschriften), damit sie bei wachsendem Funktionsumfang lesbar bleibt (Capability `architecture`, ARCH-N-010). Gruppen: „Mein Studium" (Semesterticket; ab Ausbaustufe 2 Notenübersicht, E-Key), „Fachschaft" (ab Ausbaustufe 2: Events, Helfer-Anmeldung, Wiki), „App" (Einstellungen; später Rückmeldung, Über die App, Datenschutzerklärung, Lizenzhinweise), „Verwaltung" (Capability `admin`, ab Schritt 3 rollenabhängig sichtbar). Ausgegraute Einträge für noch nicht umgesetzte Bereiche sind untersagt — ein toter Eintrag führt in die Irre.

#### Scenario: Bereich einer künftigen Ausbaustufe
- **WHEN** ein Bereich der zweiten Ausbaustufe noch nicht umgesetzt ist
- **THEN** fehlt er vollständig in der „Mehr"-Liste, statt ausgegraut angezeigt zu werden

### Requirement: Rückweg bei Einsprung über Schnellzugriff oder Deep Link

Wenn ein Bereich über einen Betriebssystem-Schnellzugriff oder einen Deep Link geöffnet wird, muss das System einen Navigations-Stack aufbauen, der einen Rückweg in die reguläre Navigationsstruktur bietet. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/quick_actions_manager.dart (vormals SHELL-F-100). Das datei-basierte Routing baut den Stack über dem Ziel auf (z. B. „Mehr" → Semesterticket), sodass Zurück in die reguläre Struktur führt. Die Alt-App sprang bei einem Schnellzugriff nur auf einen Tab-Index, ohne einen Rückweg über einen Zwischenschritt aufzubauen.

#### Scenario: Deep Link zu einer News-Meldung
- **WHEN** eine News-Meldung über einen Deep Link geöffnet wird
- **THEN** baut das System den Stack so auf, dass ein Zurück-Schritt zur News-Übersicht führt

### Requirement: Erklärung und Freischaltweg bei gesperrter Ansicht

Wenn eine Ansicht wegen fehlender Einwilligung oder fehlender Anmeldung gesperrt ist, muss das System den Grund nennen, einen direkten Weg zur Freischaltung anbieten und nach erfolgter Freischaltung dieselbe Ansicht anzeigen. Herkunft: NEU (vormals SHELL-F-110). Konkretisiert die Führungsseite der Capability `security-and-privacy` (SEC-F-010/SEC-F-020): Die Sperre einer einwilligungs- oder anmeldepflichtigen Funktion ist kein toter Bildschirm, sondern nennt den Grund in einem Satz und bietet einen Knopf, der direkt zum Zustimmungs- bzw. Anmeldeschritt führt. Bei der bestehenden Umsetzung (`app/src/consent/RequiresConsent.tsx`) ergibt sich das daraus, dass die Sperrkomponente den Inhalt umschließt und bei erteilter Einwilligung auf ihn umschaltet.

#### Scenario: Freischaltung aus gesperrter Ansicht
- **WHEN** eine Nutzerin eine gesperrte Ansicht öffnet und über den angebotenen Weg die Zustimmung erteilt
- **THEN** zeigt das System danach dieselbe Ansicht, ohne dass die Nutzerin erneut navigieren muss

### Requirement: Startzeit bis zur ersten nutzbaren Ansicht

Die Startzeit bis zur ersten nutzbaren Ansicht muss die Zielwerte aus Capability `non-functional` (NFR-N-030) einhalten. Herkunft: NEU (vormals SHELL-N-010). Leistungswert; eine automatisierte Messung im CI ist unverhältnismäßig, weil die Startzeit bis zur ersten nutzbaren Ansicht nur auf einem echten Gerät (Kaltstart, JS-Bundle-Ladezeit, Hermes) aussagekräftig ist. Nachweis daher über ein datiertes Prüfprotokoll (Capability `quality-and-testing`, „Prüfprotokoll statt Test bei Gestaltung, Barrierefreiheit und Leistungswerten"): `specs/pruefprotokolle/2026-09-02-app-rahmen.md`. Die Gerätemessung steht noch aus (siehe Prüfprotokoll).

#### Scenario: Kaltstart auf echtem Gerät
- **WHEN** die App auf einem echten Gerät kalt gestartet wird
- **THEN** ist die erste nutzbare Ansicht innerhalb der Zielwerte aus NFR-N-030 sichtbar, nachgewiesen durch das datierte Prüfprotokoll

## Scope / Nicht-Scope

### Scope

- Navigationsstruktur (Tab-Leiste, „Mehr" als gruppierter Sammel-Einstieg für nachrangige Bereiche).
- App-Start, Erststart-Erkennung, Zustimmung zur Datenschutzerklärung als Einstiegspunkt, wählbare Startansicht.
- Betriebssystem-Schnellzugriffe (Quick Actions), Einsprünge über Deep Links.
- Führung an einwilligungs- und anmeldepflichtige Funktionen (Sperr-Ansicht mit Freischaltweg).

### Nicht-Scope

- Inhalt der einzelnen Features — jeweils eigene Feature-Capability.
- Theming/Barrierefreiheit im Detail — Capability `ux-and-theming`.

## Nutzergeschichten

- Als Studierende möchte ich jedes Kernfeature in höchstens zwei Interaktionsschritten von der Startseite aus erreichen.
- Als neue Nutzerin möchte ich beim ersten Start verständlich zur Datenschutzerklärung geführt werden, bevor ich Funktionen mit personenbezogenen Daten nutze.
- Als Studierende möchte ich per Betriebssystem-Schnellzugriff direkt zu einer häufig genutzten Ansicht springen.

## Umsetzungsstand (Roadmap-Schritt 2)

Navigation über Expo Router: `app/app/(tabs)/` trägt die Tab-Leiste, `app/app/(tabs)/more/` den verschachtelten, nach Themen gruppierten „Mehr"-Stack. Alle Routendateien außer den `_layout`-Dateien sind reine Re-Exporte einer `areas/<bereich>`-Bildschirmkomponente. Tab-Stacks bleiben bei Tab-Wechsel erhalten, erneutes Antippen kehrt zur Wurzel zurück (Verhalten des Navigations-Werkzeugs). Die konfigurierbare Startansicht liegt in `app/src/navigation/startView.ts`, gespeichert unter `startView`. Die Bereichsinhalte selbst bleiben leer, bis ihr jeweiliger Roadmap-Schritt sie füllt — erreichbar sind sie bereits. Alle funktionalen Requirements dieser Capability sind umgesetzt und durch Requirement-Titel-tragende Tests bzw. das Prüfprotokoll belegt; die Gerätemessung zur Startzeit steht noch aus.

## Datenmodell

Kein eigenes Datenmodell über die Einstellungsschlüssel aus Capability `data-and-storage` hinaus (`privacyPolicyAccepted`, `privacyPolicyAcceptedVersion`).

## Externe Schnittstellen

Keine.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Erststart | Zustimmungs-Dialog vor Zugriff auf Funktionen mit personenbezogenen Daten; zurückstellbar, Basisfunktionen bleiben nutzbar |
| Regulärer Start | Direkter Einstieg in die konfigurierte Startansicht, ohne Konfiguration den Stundenplan |
| Datenschutzerklärung geändert | Erneute Zustimmung eingefordert, siehe Capability `security-and-privacy` (SEC-F-020) |

## Offline-Verhalten

Die Navigationsstruktur selbst ist unabhängig vom Netzzugriff nutzbar; einzelne Ziele können laut ihrer jeweiligen Feature-Capability offline eingeschränkt sein (z. B. Raumsuche, siehe Capability `architecture`, ARCH-F-110).

## Fehlerfälle

Keine über die Fehlerzustände der einzelnen Features hinausgehenden Fälle.

## Akzeptanzkriterien

- Jedes der sieben Kernfeatures ist von der Startseite aus in höchstens zwei Interaktionsschritten erreichbar (löst Capability `architecture`, ARCH-F-090 ein).
- Ohne erteilte Zustimmung sind Funktionen mit personenbezogenen Daten nicht nutzbar.
- Der reguläre Start öffnet die konfigurierte Startansicht, ohne Konfiguration den Stundenplan.
- „Mehr" zeigt keine ausgegrauten Einträge für Bereiche künftiger Ausbaustufen.
- Ein Sprung über Schnellzugriff oder Deep Link endet nie ohne Rückweg in die reguläre Struktur.

## Bewusst nicht übernommenes Altverhalten

- Fünf gleichrangige Tabs als alleinige Navigationsstruktur — Grund: reicht für den erweiterten Funktionsumfang nicht aus, siehe Capability `architecture` (ARCH-N-010).
- Wirkungsloses, fest auf `false` überschriebenes Datenschutz-Gate — Grund: verstößt gegen die Einwilligungspflicht.

## Offene Fragen

- Ob die Tab-Leiste auf Bildschirmen ab 1024 px Breite (Capability `non-functional`, NFR-N-150, adaptives Layout) zu einer Seitenleiste wird — klärt sich mit der Tablet-Gestaltung.
- Verhalten des Kopfzeilen-Menüs (⋯) bei nur einer Sekundäraktion: Menü oder direkter Knopf.
