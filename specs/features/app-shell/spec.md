---
id: app-shell
titel: App-Rahmen & Navigation
praefix: SHELL
status: accepted
prioritaet: kern
version: 0.6.0
owner: FSR FB4
last_reviewed: 2026-09-02
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/main.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/main_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/quick_actions_manager.dart
implemented_in:
  - app/src/consent         # SHELL-F-030 (Erststart-Zustimmungs-Gate), SHELL-F-110 (Sperr-Erklärung)
  - app/app                 # SHELL-F-050 (datei-basierte Routen), SHELL-F-010/F-060/F-080 (Tab-Leiste + „Mehr" + Tab-Stacks)
  - app/src/areas           # Bildschirmkomponenten je Bereich, Ziel der Routendateien (SHELL-F-050)
  - app/src/navigation      # SHELL-F-010/F-020/F-060/F-070/F-090/F-100 (Navigationsmodell, Startansicht), SHELL-F-040 (Schnellzugriffe)
related:
  - ../../platform/architecture.md
  - ../../platform/ux-and-theming.md
  - ../../platform/non-functional.md
  - ../../product/vision.md
  - ../../decisions/0013-zustand-navigation-und-netzwerkschicht.md
---

# App-Rahmen & Navigation

## 1. Zweck & Nutzen

Bietet die übergeordnete Navigationsstruktur, über die alle Features erreichbar sind. Löst die Randbedingung aus `platform/architecture.md` Abschnitt 3: Die Alt-App zeigte fünf gleichrangige Tabs, die neue App muss deutlich mehr Bereiche (vierzehn Feature-Specs, davon sieben mit eigenem Kernfeature-Einstiegspunkt gemäß ARCH-F-090) aufnehmen, ohne sie alle gleichrangig in einer Tab-Leiste zu häufen.

## 2. Scope / Nicht-Scope

### Scope

- Navigationsstruktur (Tab-Leiste, „Mehr" als gruppierter Sammel-Einstieg für nachrangige Bereiche).
- App-Start, Erststart-Erkennung, Zustimmung zur Datenschutzerklärung als Einstiegspunkt, wählbare Startansicht.
- Betriebssystem-Schnellzugriffe (Quick Actions), Einsprünge über Deep Links.
- Führung an einwilligungs- und anmeldepflichtige Funktionen (Sperr-Ansicht mit Freischaltweg).

### Nicht-Scope

- Inhalt der einzelnen Features — jeweils eigene Feature-Spec.
- Theming/Barrierefreiheit im Detail — `platform/ux-and-theming.md`.

## 3. Nutzergeschichten

- Als Studierende möchte ich jedes Kernfeature in höchstens zwei Interaktionsschritten von der Startseite aus erreichen.
- Als neue Nutzerin möchte ich beim ersten Start verständlich zur Datenschutzerklärung geführt werden, bevor ich Funktionen mit personenbezogenen Daten nutze.
- Als Studierende möchte ich per Betriebssystem-Schnellzugriff direkt zu einer häufig genutzten Ansicht springen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SHELL-F-010 | Das System muss eine Navigationsstruktur aus einer Tab-Leiste mit den meistgenutzten Kernbereichen sowie einem zusätzlichen Sammel-Einstieg („Mehr") für alle übrigen Bereiche bereitstellen, statt alle Bereiche als gleichrangige Einträge einer einzigen Tab-Leiste zu häufen. | Alt: bewusst verworfen |
| SHELL-F-020 | Das System muss jedes Kernfeature von der Startseite aus in höchstens zwei Interaktionsschritten erreichbar machen. | NEU |
| SHELL-F-030 | Wenn die App zum ersten Mal gestartet wird, muss das System vor der Nutzung von Funktionen mit personenbezogenen Daten eine Zustimmung zur Datenschutzerklärung einholen. | Alt: bewusst verworfen |
| SHELL-F-040 | Das System muss Betriebssystem-Schnellzugriffe auf mindestens die Ansichten Stundenplan und Semesterticket bereitstellen. | Alt: lib/utils/plugins/quick_actions_manager.dart |
| SHELL-F-050 | Das System muss die Navigationsstruktur datei-basiert abbilden, wobei jede Routendatei auf eine Bildschirmkomponente des zugehörigen `areas/<bereich>`-Moduls verweist, statt Fachlogik in der Routendatei selbst zu implementieren. | NEU |
| SHELL-F-060 | Das System muss die Tab-Leiste mit genau den Bereichen Stundenplan, Mensaplan, News und Raumsuche besetzen; alle übrigen Bereiche sind ausschließlich über „Mehr" erreichbar. | NEU |
| SHELL-F-070 | Beim regulären Start muss das System die in den Einstellungen konfigurierte Startansicht öffnen; ohne Konfiguration den Stundenplan. | NEU |
| SHELL-F-080 | Das System muss je Tab einen eigenständigen Navigations-Stack führen, der bei einem Tab-Wechsel erhalten bleibt. | NEU |
| SHELL-F-085 | Wenn der bereits aktive Tab erneut angetippt wird, muss das System dessen Navigations-Stack auf die Wurzel zurücksetzen. | NEU |
| SHELL-F-090 | Das System muss „Mehr" als nach Themen gruppierte Liste darstellen und einen Bereich einer künftigen Ausbaustufe erst mit dessen Umsetzung in die Liste aufnehmen, statt ihn ausgegraut anzuzeigen. | NEU |
| SHELL-F-100 | Wenn ein Bereich über einen Betriebssystem-Schnellzugriff oder einen Deep Link geöffnet wird, muss das System einen Navigations-Stack aufbauen, der einen Rückweg in die reguläre Navigationsstruktur bietet. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/quick_actions_manager.dart |
| SHELL-F-110 | Wenn eine Ansicht wegen fehlender Einwilligung oder fehlender Anmeldung gesperrt ist, muss das System den Grund nennen, einen direkten Weg zur Freischaltung anbieten und nach erfolgter Freischaltung dieselbe Ansicht anzeigen. | NEU |

### Erläuterungen

**`SHELL-F-050`** — Löst die Werkzeugwahl für Navigation über `../../decisions/0013-zustand-navigation-und-netzwerkschicht.md` (Expo Router) auf. Ändert nichts am Navigationsmuster selbst (SHELL-F-010) oder an der Bereichs-Zuordnung (SHELL-F-060), nur an dessen technischer Umsetzung.

**`SHELL-F-060`** — Entscheidung FSR FB4/technische Leitung, 2026-08-26: Die vier meistgenutzten Kernfunktionen der ersten Ausbaustufe besetzen die Tab-Leiste. Semesterticket, Einstellungen und Verwaltung liegen unter „Mehr", ebenso — sobald Ausbaustufe 2 beginnt — Events, Helfer-Anmeldung, Wiki, Notenübersicht und E-Key-Verwaltung. Löst die zuvor offene Frage in Abschnitt 13.

**`SHELL-F-010`** — Entscheidung FSR FB4, 2026-08-25: Muster „Tab-Leiste + Mehr-Sammelpunkt" statt Drawer/Seitenmenü oder Hybrid — die FSR-Vorgabe war, keine 1:1-Kopie der alten fünf gleichrangigen Tabs, sondern eine UI-technisch sinnvolle Struktur zu wählen. Bei inzwischen vierzehn Feature-Specs ist eine flache Tab-Leiste nicht mehr tragfähig (siehe `platform/architecture.md` ARCH-N-010); „Tab-Leiste + Mehr" ist das etablierte Muster für genau diesen Fall, hält die täglich genutzten Bereiche (voraussichtlich Stundenplan, Mensaplan, News) einen Klick entfernt und erreicht seltener genutzte Bereiche über einen zusätzlichen Schritt — konform mit SHELL-F-020 (höchstens zwei Interaktionsschritte für Kernfeatures). Konkrete Zuordnung, welche Bereiche in die Tab-Leiste selbst kommen, ist Teil der Bildschirmgestaltung (siehe Abschnitt 13). Die Liste der sieben Kernfeatures übernimmt `platform/architecture.md` ARCH-F-090 unverändert. Zur bewussten Auslassung von Mensa-Bewertungen (RATE) als eigenem Navigationsziel siehe die Anmerkung dort.

**`SHELL-F-030`** — Die Alt-App ermittelt `shouldShowPrivacyPolicy` korrekt aus Einstellung und Versionsvergleich, überschreibt das Ergebnis aber unmittelbar danach fest auf `false` (`main_view_model.dart:8-22`, dokumentiert in `platform/security-and-privacy.md` SEC-F-010). Das Zustimmungs-Gate der Alt-App ist damit wirkungslos; für die Neuentwicklung ist ein tatsächlich wirksames Gate verbindlich.

Der Erststart-Dialog darf zurückgestellt werden („Später — nur Basisfunktionen"): Die App bleibt dann mit allen Bereichen ohne Personenbezug (Stundenplan, Mensaplan, News, Raumsuche) nutzbar, Funktionen mit personenbezogenen oder nutzergenerierten Daten bleiben bis zur Zustimmung gesperrt (SEC-F-010, Akzeptanzkriterium in Abschnitt 11). Ein Vollbild-Zwang zur Zustimmung vor jeglicher Nutzung wäre stärker als SEC-F-010 verlangt und würde kontofreie Kernfunktionen grundlos blockieren.

**`SHELL-F-040`** — Umgesetzt als dynamische Verknüpfungen (`QuickActions.setItems`, Android `ShortcutManagerCompat`, iOS `UIApplicationShortcutItem`), nicht als statische Manifest-Einträge — die Ziele Stundenplan (`/`) und Semesterticket (`/more/ticket`) sind datenbeschrieben (`app/src/navigation/quickActions.ts`), ihre Titel übersetzt (NFR-F-115). Die Alt-App verdrahtete Titel und Ziel fest (`quick_actions_manager.dart`: „Ticket anzeigen", Sprung auf Tab-Index 3). Das Antippen wird über `expo-quick-actions/router` behandelt und navigiert zum hinterlegten Pfad.

**`SHELL-F-070` / `SET-F-160`** — Die Alt-App öffnete fest den Stundenplan. Die Neuentwicklung behält den Stundenplan als Voreinstellung (meistgenutzte Funktion beider Alt-Apps, `../../product/roadmap.md` Abschnitt 6), erlaubt aber die Wahl einer anderen Startansicht in den Einstellungen (`../settings/spec.md` SET-F-160). Die Option „zuletzt genutzt" ist eingeschlossen; der zuletzt aktive Tab wird dafür lokal vermerkt. Kein eigener Dashboard-/Home-Bildschirm — er wäre eine zusätzliche Ebene, die mit den Tabs um dieselbe Aufgabe konkurriert.

**`SHELL-F-080` / `SHELL-F-085`** — Verhalten des Navigations-Werkzeugs (Expo Router / React Navigation): Jeder Tab hält seinen eigenen Stack, der bei Tab-Wechsel nicht verworfen wird; erneutes Antippen des aktiven Tabs kehrt an dessen Wurzel zurück. In EARS-Form zwei getrennte Aussagen (Bestehen des Stacks; Rücksprung auf die Wurzel).

**`SHELL-F-090`** — „Mehr" ist ein eigener Stack mit einer nach Themen gruppierten Liste (Zwischenüberschriften), damit sie bei wachsendem Funktionsumfang lesbar bleibt (`platform/architecture.md` ARCH-N-010). Gruppen: „Mein Studium" (Semesterticket; ab Ausbaustufe 2 Notenübersicht, E-Key), „Fachschaft" (ab Ausbaustufe 2: Events, Helfer-Anmeldung, Wiki), „App" (Einstellungen; später Rückmeldung, Über die App, Datenschutzerklärung, Lizenzhinweise), „Verwaltung" (ADMIN, ab Schritt 3 rollenabhängig sichtbar). Ausgegraute Einträge für noch nicht umgesetzte Bereiche sind untersagt — ein toter Eintrag führt in die Irre.

**`SHELL-F-100`** — Ein Einsprung von außen (Schnellzugriff, Deep Link) darf nicht in einer Sackgasse enden. Das datei-basierte Routing baut den Stack über dem Ziel auf (z. B. „Mehr" → Semesterticket), sodass Zurück in die reguläre Struktur führt. Die Alt-App sprang bei einem Schnellzugriff nur auf einen Tab-Index (`quick_actions_manager.dart`), ohne einen Rückweg über einen Zwischenschritt aufzubauen.

**`SHELL-F-110`** — Konkretisiert die Führungsseite von SEC-F-010/SEC-F-020: Die Sperre einer einwilligungs- oder anmeldepflichtigen Funktion ist kein toter Bildschirm, sondern nennt den Grund in einem Satz und bietet einen Knopf, der direkt zum Zustimmungs- bzw. Anmeldeschritt führt. Nach erfolgter Freischaltung erscheint dieselbe Ansicht, an der die Nutzerin war — bei der bestehenden Umsetzung (`app/src/consent/RequiresConsent.tsx`) ergibt sich das daraus, dass die Sperrkomponente den Inhalt umschließt und bei erteilter Einwilligung auf ihn umschaltet.

**`SHELL-N-010`** — Leistungswert; eine automatisierte Messung im CI ist unverhältnismäßig, weil die Startzeit bis zur ersten nutzbaren Ansicht nur auf einem echten Gerät (Kaltstart, JS-Bundle-Ladezeit, Hermes) aussagekräftig ist. Nachweis daher über ein datiertes Prüfprotokoll (QA-F-015/QA-F-020): `specs/pruefprotokolle/2026-09-02-app-rahmen.md`. Die Gerätemessung steht noch aus (siehe Prüfprotokoll).

**Umsetzungsstand (Roadmap-Schritt 2).** Navigation über Expo Router: `app/app/(tabs)/` trägt die Tab-Leiste (SHELL-F-060), `app/app/(tabs)/more/` den verschachtelten, nach Themen gruppierten „Mehr"-Stack (SHELL-F-010/F-090). Alle Routendateien außer den `_layout`-Dateien sind reine Re-Exporte einer `areas/<bereich>`-Bildschirmkomponente (SHELL-F-050). Tab-Stacks bleiben bei Tab-Wechsel erhalten, erneutes Antippen kehrt zur Wurzel zurück (SHELL-F-080/F-085, Verhalten des Navigations-Werkzeugs). Die konfigurierbare Startansicht (SHELL-F-070) liegt in `app/src/navigation/startView.ts`, gespeichert unter `startView`. Die Bereichsinhalte selbst bleiben leer, bis ihr jeweiliger Roadmap-Schritt sie füllt — erreichbar sind sie bereits. Alle funktionalen SHELL-Anforderungen (F-010 bis F-110) sind umgesetzt und durch ID-tragende Tests bzw. das Prüfprotokoll belegt; `status` bleibt `accepted`, bis die SHELL-N-010-Gerätemessung vorliegt.

## 5. Datenmodell

Kein eigenes Datenmodell über die Einstellungsschlüssel aus `platform/data-and-storage.md` hinaus (`privacyPolicyAccepted`, `privacyPolicyAcceptedVersion`).

## 6. Externe Schnittstellen

Keine.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Erststart | Zustimmungs-Dialog vor Zugriff auf Funktionen mit personenbezogenen Daten (SHELL-F-030); zurückstellbar, Basisfunktionen bleiben nutzbar |
| Regulärer Start | Direkter Einstieg in die konfigurierte Startansicht, ohne Konfiguration den Stundenplan (SHELL-F-070) |
| Datenschutzerklärung geändert | Erneute Zustimmung eingefordert, siehe `platform/security-and-privacy.md` SEC-F-020 |

## 8. Offline-Verhalten

Die Navigationsstruktur selbst ist unabhängig vom Netzzugriff nutzbar; einzelne Ziele können laut ihrer jeweiligen Feature-Spec offline eingeschränkt sein (z. B. Raumsuche, siehe `platform/architecture.md` ARCH-F-110).

## 9. Fehlerfälle

Keine über die Fehlerzustände der einzelnen Features hinausgehenden Fälle.

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SHELL-N-010 | Die Startzeit bis zur ersten nutzbaren Ansicht muss die Zielwerte aus `platform/non-functional.md` (NFR-N-030) einhalten. | NEU |

## 11. Akzeptanzkriterien

- Jedes der sieben Kernfeatures ist von der Startseite aus in höchstens zwei Interaktionsschritten erreichbar (SHELL-F-020, löst ARCH-F-090 ein).
- Ohne erteilte Zustimmung sind Funktionen mit personenbezogenen Daten nicht nutzbar.
- Der reguläre Start öffnet die konfigurierte Startansicht, ohne Konfiguration den Stundenplan (SHELL-F-070).
- „Mehr" zeigt keine ausgegrauten Einträge für Bereiche künftiger Ausbaustufen (SHELL-F-090).
- Ein Sprung über Schnellzugriff oder Deep Link endet nie ohne Rückweg in die reguläre Struktur (SHELL-F-100).

## 12. Bewusst nicht übernommenes Altverhalten

- Fünf gleichrangige Tabs als alleinige Navigationsstruktur — Grund: reicht für den erweiterten Funktionsumfang nicht aus, siehe `platform/architecture.md` ARCH-N-010.
- Wirkungsloses, fest auf `false` überschriebenes Datenschutz-Gate — Grund: verstößt gegen die Einwilligungspflicht, siehe SHELL-F-030.

## 13. Offene Fragen

- ~~Konkrete Zuordnung der Bereiche zur Tab-Leiste vs. zum „Mehr"-Sammelpunkt~~ Entschieden 2026-08-26, siehe SHELL-F-060.
- ~~Welche Anforderungen aus dem Nutzerführungs-Konzept werden verbindlich?~~ SHELL-F-070 bis F-110 aufgenommen 2026-09-02, hergeleitet in `nutzerfuehrung-konzept.md` Abschnitt 12.
- Ob die Tab-Leiste auf Bildschirmen ab 1024 px Breite (`platform/non-functional.md` NFR-N-150, adaptives Layout) zu einer Seitenleiste wird — klärt sich mit der Tablet-Gestaltung.
- Verhalten des Kopfzeilen-Menüs (⋯) bei nur einer Sekundäraktion: Menü oder direkter Knopf.
