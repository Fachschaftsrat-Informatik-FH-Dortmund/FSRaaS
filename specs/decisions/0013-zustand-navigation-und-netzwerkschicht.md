---
nummer: 0013
titel: Zustands-, Navigations- und Netzwerkschicht der App
status: angenommen
datum: 2026-08-26
betrifft:
  - ../platform/architecture.md
  - ../features/app-shell/spec.md
  - 0001-react-native-als-plattform.md
  - 0009-expo-werkzeugkasten.md
---

# ADR 0013: Zustands-, Navigations- und Netzwerkschicht der App

## Kontext

`decisions/0001-react-native-als-plattform.md` verweist die Frage nach State-Management und Navigation ausdrücklich an `platform/architecture.md` weiter. `platform/architecture.md` Abschnitt 7 schließt „Bibliothekswahl (State-Management, Navigation, Netzwerk-Client)" jedoch ausdrücklich aus der eigenen Zuständigkeit aus. Damit entscheidet an keiner Stelle im Spec-Bestand jemand über diese Frage — obwohl mehrere bereits akzeptierte Anforderungen technisch anspruchsvolles Verhalten verlangen, das von genau dieser Wahl abhängt: ARCH-F-100 (offline zuletzt geladenen Stand anzeigen), ARCH-F-120/125 (Offline-Warteschlange für Schreibvorgänge, mit einer Ausnahme für zustandsabhängige Vorgänge), ARCH-F-130/N-020 (wiederverwendbare Lade-/Leer-/Fehler-/Offline-Zustände über alle Ansichten hinweg) und ARCH-F-080 (Zustandshaltung an den Bildschirm-Lebenszyklus gebunden, ausdrücklich nicht als app-weites Singleton — der in der Alt-App gefundene und verworfene Fehler). `features/app-shell/spec.md` (SHELL-F-010) verlangt zusätzlich eine Tab-plus-„Mehr"-Navigation, die deutlich mehr Bereiche aufnehmen muss als die fünf Tabs der Alt-App. ADR 0009 legt fest, dass die App auf Expo mit Dev-Client statt Expo Go/EAS läuft; welche Bibliotheken darauf für Datenabruf, Navigation und lokalen Zustand zum Einsatz kommen, bleibt davon unberührt offen.

## Entscheidung

Drei Bausteine, als zusammenhängendes Paket, nicht einzeln austauschbar:

- **Server-Zustand:** TanStack Query. Deckt Caching, Hintergrund-Aktualisierung und je-Datenart unterschiedliche Gültigkeitsdauer (`data-and-storage.md` Abschnitt 4) über `staleTime`/`gcTime` je Abfrage ab, mit `@tanstack/query-async-storage-persister` für den Neustart-Fall (ARCH-F-100). Die eingebaute Mutation-Pause/Resume-Funktion bildet die Offline-Warteschlange (ARCH-F-120) ab; für die ARCH-F-125-Ausnahme (Verwaltung, Moderation, Kontolöschung) sorgt `networkMode: 'online'`, das den Vorgang offline sofort fehlschlagen statt warten lässt.
- **Navigation:** Expo Router — datei-basiert, von Expo selbst gepflegt, konsistent mit der in ADR 0009 etablierten Präferenz für von Expo verwaltete statt selbst verdrahtete Bausteine. `app/(tabs)/_layout.tsx` bildet SHELL-F-010 ab; „Mehr" ist selbst ein verschachtelter Stack mit einer Liste weiterer Bereiche (ARCH-N-010). Routendateien bleiben dünne Verweise auf Screens unter `areas/<bereich>/screens/`, damit ARCH-F-140 (Modulschnitt nach Fachbereich) nicht unterlaufen wird.
- **Lokaler UI-Zustand:** React-eigene Mittel (`useState`/`useReducer`/`useContext`) als Standard — erfüllt ARCH-F-080 automatisch, weil der Zustand mit der Komponente verschwindet. Zustand (die Bibliothek) ist als schmale Ausnahme zulässig, wenn mehrere Komponenten *innerhalb eines* Feature-Moduls Zustand teilen müssen, ausdrücklich ein Store je Modul, nie ein app-weiter Store.
- **HTTP-Client:** `openapi-typescript` (Typgenerierung) + `openapi-fetch` (schlanker typisierter Fetch-Wrapper) gegen `api-contract.yaml`, eingesetzt als `queryFn`/`mutationFn` unter TanStack Query. Löst den TypeScript-Anteil des in ADR 0011 offen gelassenen Punkts „Werkzeug für die Codeerzeugung je Zielsprache"; die C#-seitige Werkzeugwahl für das Backend bleibt davon unberührt.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **TanStack Query + Expo Router + React-State/Zustand-Ausnahme + openapi-fetch (gewählt)** | mittel | gepflegte, community-übliche Bausteine mit eingebauter Lösung für genau die geforderten Verhaltensweisen (Offline-Queue, Cache-Invalidierung, Datei-Routing) | Mutation-Pause/Resume ist weniger bekannt als eine selbstgebaute Warteschlange, verlangt Einarbeitung |
| Redux Toolkit + RTK Query | hoch | ein Werkzeug für Server- und Client-State gleichzeitig | ein globaler Store widerspricht der Stoßrichtung von ARCH-F-080; höherer Boilerplate- und Lernaufwand für ein wechselndes Laienteam als TanStack Query |
| React Navigation direkt (ohne Expo Router) | mittel | maximale Kontrolle | Navigationsbaum, Deep-Linking und Typisierung müssen von Hand gepflegt werden — widerspricht der in ADR 0009 etablierten Präferenz |
| Eigene Warteschlangen-/Cache-Implementierung | hoch | volle Kontrolle | löst ein bereits gelöstes Problem neu; Wartungslast bleibt dauerhaft beim wechselnden FSR-Team statt bei einem Upstream-Projekt |
| Vollständiger OpenAPI-SDK-Generator (z. B. `openapi-generator-cli`) | mittel | ein Aufruf erzeugt fertige Client-Klassen | eigene SDK-Konventionen zusätzlich zu TanStack Query zu lernen; passt schlechter zu Hooks-basiertem React als ein schlanker Fetch-Wrapper |

## Konsequenzen

- `platform/architecture.md` Abschnitt 7 wird von einem Ausschluss zu einem Verweis auf dieses ADR; neue Anforderungen ARCH-F-150, ARCH-F-160, ARCH-N-030.
- `features/app-shell/spec.md` erhält SHELL-F-050 (datei-basierte Navigation); die bisher offene Frage in Abschnitt 13 zur Bereichs-Zuordnung bleibt bestehen, betrifft aber nur noch die konkrete Aufteilung, nicht mehr das Navigationswerkzeug selbst.
- Der Modulschnitt aus ARCH-F-140 (`areas/<bereich>/{models,repositories,viewmodels,screens}`) gilt unverändert; TanStack-Query-Hooks und Zustand-Stores (wo ausnahmsweise verwendet) leben je Modul unter `areas/<bereich>/`, nicht zentral.
- Die 50-MB-Obergrenze für Zwischenspeicher (`data-and-storage.md` DATA-N-150) schließt den TanStack-Query-Persister-Cache ein, nicht nur handgeschriebene Caches.

## Offene Punkte

- Konkrete Versionspinning von TanStack Query, Expo Router, `openapi-typescript`/`openapi-fetch` bei Einrichtung von Schritt 0 (`product/roadmap.md`).
- Ob eine Obergrenze für die Anzahl gleichzeitig persistierter Queries nötig ist, um die 50-MB-Obergrenze aus DATA-N-150 einzuhalten — bei Umsetzung mit realen Datengrößen zu prüfen.
