---
nummer: 0018
titel: Vereinheitlichung der Verwaltungsoberfläche über React Native Web
status: angenommen
datum: 2026-08-26
betrifft:
  - ../../openspec/specs/admin/spec.md
  - ../../openspec/specs/ux-and-theming/spec.md
  - 0011-monorepo-und-openapi-vertrag.md
  - 0013-zustand-navigation-und-netzwerkschicht.md
---

# ADR 0018: Vereinheitlichung der Verwaltungsoberfläche über React Native Web

## Kontext

`decisions/0011-monorepo-und-openapi-vertrag.md` legt für die Verwaltungsoberfläche zwei getrennte Frontend-Codebasen fest: den geschützten Bereich innerhalb der App (`app/`) und ein eigenständiges React-Projekt (`admin-web/`) für die Bedienung am PC, mit identischem fachlichen Funktionsumfang (`features/admin/spec.md` ADMIN-F-030). Für ein Projekt, das laut `product/roadmap.md` von einer einzelnen Person nebenher umgesetzt wird, bedeutet das dauerhaft doppelten Wartungsaufwand für denselben Funktionsumfang — jede Änderung an einer Verwaltungsfunktion muss in zwei Codebasen nachgezogen werden. Das widerspricht dem in `CLAUDE.md` benannten Kernproblem beider Alt-Projekte: Wissen und Pflegeaufwand, die an eine einzelne, wechselnde Besetzung gebunden sind. Zusätzlich hat `ux-and-theming.md` bislang keine eigene Gestaltungs- oder Barrierefreiheits-Anforderung für `admin-web`, weil das Dokument sich ausschließlich auf die Mobile-App bezieht.

## Entscheidung

Kein eigenständiges `admin-web/`-React-Projekt. ADMIN-Bildschirme leben in `app/` unter einer eigenen Routengruppe, aufbauend auf Expo Router (ADR 0013), und werden per Expo-Web-Export als statische, PC-taugliche Seite ausgeliefert. Eine Codebasis, zwei responsive Layouts — Liste auf dem Telefon, mehrspaltige Tabelle am PC ab 1024 px (ADMIN-N-010) — statt zwei Implementierungen desselben Funktionsumfangs.

**Ergänzung 2026-08-26 — Spike durchgeführt, Entscheidung bestätigt.** Ein Prototyp der Laufwege-Tabelle (18 Zeilen, editierbare Gewichtsspalte, Hinzufügen/Entfernen, responsiver Wechsel zwischen Tabellen- und Listenlayout am 1024-px-Schwellwert aus ADMIN-N-010) wurde unter React Native Web (Expo SDK 57) gebaut und im Browser getestet: mehrspaltige Tabelle, inline editierbare Textfelder und Schaltflächen funktionieren ohne Einschränkung; der Layoutwechsel greift beim Laden korrekt anhand der jeweiligen Fensterbreite. Die zuvor als Vorbehalt formulierte Prüfung entfällt damit — die Entscheidung gilt als vollständig angenommen, kein weiterer Prototyp vor Schritt 3 nötig.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **React Native Web, eine Codebasis (gewählt)** | mittel — Prototyp zur Absicherung nötig, danach geringerer Dauer­aufwand als zwei Codebasen | ein Funktionsumfang, eine Fehlerklasse, ein Test-Satz; ADMIN erbt automatisch `ux-and-theming.md` statt einer eigenen A11y-Spec zu brauchen | RNW-Bibliotheksauswahl für Web-typische Bedienelemente (Tabellen, Datei-Upload für den Prüfungsplan-Import) enger als im reinen Web-Ökosystem |
| Getrennte Codebasen wie in ADR 0011 (Status quo) | hoch, dauerhaft | freie Wahl reichhaltiger Web-Bibliotheken ohne RNW-Einschränkung | doppelter Pflegeaufwand für identischen Funktionsumfang, dauerhaft — das Gegenteil des in `CLAUDE.md` benannten Ziels |
| Reines Web-Frontend für Mobile und PC gemeinsam (z. B. Progressive Web App statt nativer App) | sehr hoch | eine einzige Web-Codebasis für alles | verwirft die bereits getroffene, ADR-0001-begründete Entscheidung für native Distribution über drei App-Stores; nicht verhältnismäßig, um allein die ADMIN-Doppelung zu lösen |

## Konsequenzen

- `decisions/0011-monorepo-und-openapi-vertrag.md`: „Entscheidung" (kein `admin-web/`-Verzeichnis mehr), „Konsequenzen" (ADMIN teilt sich Komponenten, nicht nur Client und Anmeldefluss) und „Offene Punkte" (Frage wird zu „wie wird der Web-Export gehostet", nicht mehr zur Codebasis) werden entsprechend ergänzt.
- `features/admin/spec.md` Abschnitt 1 und die ADMIN-F-030-Erläuterung werden von „zwei Ausprägungen" auf „eine Codebasis, zwei Layouts" umformuliert; Abschnitt 13 entsprechend angepasst.
- `CLAUDE.md` Struktur-Abschnitt: `admin-web/` entfällt als eigener Top-Level-Ordner.
- `ux-and-theming.md` gilt für ADMIN ohne eigene Ergänzung, da dieselbe Codebasis und damit dieselbe Komponentenbasis zum Einsatz kommt.

## Offene Punkte

- ~~Ergebnis des Prototyps~~ Siehe Ergänzung 2026-08-26 — erfolgreich, keine Revision nötig.
- ~~Hosting des Web-Exports: vom Backend mitausgeliefert oder separat als statische Seite gehostet~~ Geklärt bei Einrichtung von Schritt 3 (FSR FB4, 2026-09-02): **vom Backend mitausgeliefert** unter dem Pfad `/admin`. ASP.NET Core stellt die statischen Export-Dateien aus `wwwroot/admin` bereit (`Program.cs`); die CI baut den Expo-Web-Export (`npx expo export --platform web`) und legt ihn dorthin. Eine Auslieferung, eine Domain, gemeinsame TLS-Konfiguration — passt zum Ziel einer für eine wechselnde Ehrenamtsbesetzung minimal zu betreibenden Landschaft.

  **Ergänzung 2026-09-04 — Umsetzung.** Damit der Web-Export unter dem Unterpfad `/admin` lädt, trägt `app/app.json` `experiments.baseUrl` = `/admin`; der Export präfixt dadurch alle Asset-Pfade (`/admin/_expo/…`), ohne Wirkung auf die nativen Builds. Der Deploy-Workflow (`deploy/`, API-N-200) baut den Export in `wwwroot/admin`, `dotnet publish` nimmt ihn in das Publish-Verzeichnis auf, der Reverse-Proxy leitet `/admin` auf `/admin/` um. Erstmals real ausgeliefert 2026-09-04 zusammen mit dem Backend unter `https://api.fb4.it/admin`. Der durchgängige Browser-Anmeldevorgang gegen Authentik setzt zusätzlich `https://api.fb4.it/admin` als zugelassene Redirect-URI in der Authentik-Anwendung voraus (Betriebseinstellung, kein Code).
- Aus dem Spike mitgenommen: `Pressable`-Elemente rendern unter React Native Web ohne explizites `accessibilityRole="button"` als generische statt als Button-ARIA-Rolle — bei Umsetzung je Bedienelement zu setzen, relevant für `ux-and-theming.md` UX-F-060 (für Bildschirmvorleser auswertbare Beschriftung).
