---
status: draft
version: 0.2.1
owner: FSR FB4
last_reviewed: 2026-09-03
---

# Prüfprotokoll — App-Rahmen (Roadmap-Schritt 2)

Datiertes Prüfprotokoll für Anforderungen, die nach `platform/quality-and-testing.md`
Abschnitt 3 statt durch einen automatisierten Test durch eine Prüfung mit Datum
nachgewiesen werden dürfen (Gestaltung, Barrierefreiheit, Leistungswerte).

| Feld | Wert |
|---|---|
| Datum | 2026-09-02 |
| Prüfer | FSR FB4 / technische Leitung |
| Prüfgegenstand | `app/` nach Umsetzung von Roadmap-Schritt 2 (Navigation, Erscheinungsbild, Sprachwahl, Nutzerführung aus `../features/app-shell/nutzerfuehrung-konzept.md` Abschnitt 12) |
| Build | `npx expo export --platform android` erfolgreich (JS-Bundle ~2,86 MB Hermes); `tsc`, ESLint, Jest (294 Tests, Stand 2026-09-03), spec-check (4/4), audit-ci — alles grün |

## 1. Automatisiert abgedeckt (hier nur zur Einordnung)

| Anforderung | Test |
|---|---|
| UX-F-020 / UX-F-030 | `app/src/theme/ThemeProvider.test.tsx`, `appearanceMode.test.ts`, `navigationTheme.test.ts` (Navigations-Theme folgt dem Schema); `app/src/areas/more/screens/MoreScreen.test.tsx` (Einträge im Dunkelmodus nach Farbsystem) |
| UX-F-220 | `app/src/theme/statusBar.test.tsx` (Symbolfarbe folgt dem Schema, auch bei manueller Übersteuerung) |
| UX-F-070 / UX-F-130 / UX-F-140 / UX-N-020 | `app/src/ui/primitives.test.tsx` |
| UX-F-180 / UX-F-185 | `app/src/ui/primitives.test.tsx` (Primitive: nur `primary` trägt die Akzentfläche, `destructive` nie) |
| UX-F-190 | `app/src/ui/IntroHint.test.tsx` |
| UX-F-210 | `app/src/i18n/anrede.test.ts` |
| UX-N-030 | `app/src/ui/reducedMotion.test.ts` |
| SHELL-F-070 / F-080 / F-085 / F-090 / F-100 / F-110 | `app/src/navigation/*.test.ts`, `app/src/consent/ConsentGate.test.tsx` |

## 2. Durch Sichtprüfung / Messung nachzuweisen

| Anforderung | Prüfmethode | Ergebnis |
|---|---|---|
| SHELL-N-010 — Startzeit bis zur ersten nutzbaren Ansicht < 2 s (NFR-N-030, „vorgeschlagen") | Kaltstart auf Referenzgerät (Release-Build), Startup-Trace, fünf Messungen, Median | **ausstehend Gerät** — Release-Build noch nicht vermessen; Debug-Build (Emulator) startet sichtbar unter der Schwelle |
| UX-F-020 — Umschalten der System-Hell/Dunkel-Einstellung bei laufender App | Gerät: App im Vordergrund, Systemeinstellung umschalten | **ausstehend Gerät** — Logik testautomatisiert belegt (kein Einfrieren des Startwerts); visuelle Bestätigung offen |
| UX-F-220 — Statusleiste bleibt in hellem und dunklem Erscheinungsbild sichtbar | Emulator (Pixel 9 Pro, Android 16): App in „hell", „dunkel" und bei manueller Übersteuerung öffnen, Statuszeile (Uhr, Akku, Empfang) prüfen | **erfüllt** (2026-09-02) — vor der Umsetzung war die Statuszeile im Dunkelmodus vollständig unsichtbar (weiße Symbole auf weißem Grund); nach `ThemedStatusBar` im Dunkelmodus helle Symbole auf durchscheinendem Grund, im Hellmodus dunkle, jeweils klar lesbar; folgt der manuellen Wahl „dunkel" bei hellem System |
| UX-F-020 — „Mehr"-Liste im Dunkelmodus lesbar | Emulator: „Mehr" im Dunkelmodus öffnen, Einträge prüfen | **erfüllt** (2026-09-02) — die Listeneinträge erschienen zuvor dunkel auf dunklem Grund, weil `<Link asChild>` um ein `<Text>` das Style-Array beim Zusammenführen zerlegte und `color` verwarf; nach Umstellung auf `<Link style={…}>` tragen die Einträge die Textfarbe des Farbsystems, Navigation unverändert |
| UX-F-020 — Szenenübergänge im Dunkelmodus ohne hellen Rand | Emulator: im Dunkelmodus zwischen den Tabs wechseln (u. a. Stundenplan ↔ News), `shift`-Animation beobachten | **ausstehend Gerät** (Befund 2026-09-03) — Ursache im Code nachvollzogen: Expo Router hält über einen internen Container ein eigenes React-Navigation-Theme, das auf der hellen Voreinstellung stand; diese Fläche schien beim Übergang durch die kurz teiltransparenten Szenen als heller Rand durch. Behoben durch die Theme-Brücke `app/src/theme/navigationTheme.ts` (im Wurzel-Layout gesetzt) samt `contentStyle`-Grund am Wurzel-Stack; die Ableitung ist testautomatisiert belegt (`app/src/theme/navigationTheme.test.ts`). Visuelle Bestätigung am Gerät offen |
| UX-F-170 — Bildschirmtitel entspricht dem Einstiegspunkt | Gerät/Emulator: jeden Tab und jeden „Mehr"-Eintrag öffnen, Kopfzeilentitel mit Listen-/Tab-Bezeichnung vergleichen | statische Prüfung der Layout-Titel grün (`routeFiles.test.ts`); Kopfzeilen-Darstellung am Gerät **ausstehend** |
| UX-F-180 — höchstens eine hervorgehobene Primäraktion je Ansicht | Sichtprüfung je Bildschirm beim Bau des jeweiligen Features | für die bisherigen Bildschirme (Zustimmungs-Gate, Sperr-Ansicht, Einstellungen, Platzhalter) erfüllt — je höchstens ein `primary`-Knopf; wird je Feature fortgeschrieben |
| UX-F-200 — Vorlesefokus nach Screenwechsel auf den neuen Titel | Gerät mit TalkBack/VoiceOver: Navigation, Fokusposition prüfen | **ausstehend Gerät** — wird vom Navigator (React Navigation Header) grundsätzlich geleistet, Bestätigung am Gerät offen |
| UX-N-010 — Kontrast ≥ 4,5:1 | Kontrastrechner auf `app/src/theme/tokens.ts` | hell: `text` auf `background` ≈ 16,1:1, auf `surface` ≈ 15,0:1. dunkel: ≈ 18,9:1 bzw. ≈ 15,6:1. Akzentfläche `#FF6600`/`#FFFFFF` (nur fette Knopfbeschriftung) ≈ 2,9:1 — **Anmerkung:** vor Schritt 10 prüfen, keine Bedeutung hängt allein daran (UX-F-070) |
| SHELL-F-040 — Schnellzugriffe erscheinen und öffnen das richtige Ziel | Gerät: Launcher-Icon lange drücken, Einträge antippen | **ausstehend Gerät** — Ziel-Zuordnung testautomatisiert belegt |
| SHELL-F-100 — Einsprung endet nicht in einer Sackgasse | Gerät: über Schnellzugriff `Semesterticket` öffnen, Zurück drücken → „Mehr"-Liste | statisch belegt (`initialRouteName: 'index'` im „Mehr"-Stack); Verhalten am Gerät **ausstehend** |

## 3. Offene Punkte

- Die mit „ausstehend Gerät" markierten Zeilen werden nachgetragen, sobald ein Release-Build auf dem Referenzgerät läuft. Bis dahin bleibt `features/app-shell/spec.md` auf `status: accepted`.
- Dieses Protokoll wechselt auf `status: accepted`, sobald alle Zeilen aus Abschnitt 2 ein Ergebnis tragen.
