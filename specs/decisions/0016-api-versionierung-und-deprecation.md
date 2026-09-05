---
nummer: 0016
titel: API-Versionierungs- und Deprecation-Politik
status: angenommen
datum: 2026-08-26
betrifft:
  - ../../openspec/specs/backend-and-api/spec.md
  - ../../openspec/specs/api-contract.yaml
  - 0011-monorepo-und-openapi-vertrag.md
  - 0008-vertrieb-ueber-drei-app-stores.md
---

# ADR 0016: API-Versionierungs- und Deprecation-Politik

## Kontext

`backend-and-api.md` API-N-030 fordert nur „Version eindeutig kennzeichnen", ohne Mechanismus. `api-contract.yaml` nutzt bereits einen Pfad `/v1`, aber ohne Regel, wann eine neue Version nötig wird oder wie lange eine alte erreichbar bleibt. Das Backend ist jederzeit deploybar; ältere App-Versionen bleiben dagegen unterschiedlich lange im Umlauf, je nach Vertriebsweg (App Store und Play Store mit Review-Verzögerung, F-Droid zusätzlich verzögert durch dessen eigene, nicht terminierbare Reproduktions-Build-Pipeline, `decisions/0008-vertrieb-ueber-drei-app-stores.md`). Ohne Regel kann ein Backend-Deploy im Umlauf befindliche Altversionen unbemerkt brechen.

## Entscheidung

Pfad-basierte Major-Versionierung bleibt (`/v1`), ergänzt um zwei Regeln: Eine neue Version bekommt einen eigenen Pfad nur bei tatsächlich brechenden Änderungen (Feld/Endpunkt entfernt oder umbenannt, Typ geändert, Validierung verschärft); rein additive Änderungen bleiben unter derselben Version. Eine als veraltet markierte Version bleibt mindestens 90 Tage **und** bis der Zugriff darauf nachweisbar auf ein vernachlässigbares Niveau gefallen ist erreichbar — die feste Frist allein reicht wegen F-Droids nicht terminierbarer Pipeline nicht aus, ein reiner Evidenz-Check allein böte keine Planungssicherheit für den Abschalttermin.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **Pfad-Major-Versionierung + Breaking/Additiv-Regel + Mindestfrist (90 Tage) mit Evidenz-Check (gewählt)** | gering bis mittel | hält `/v1` möglichst lange additiv erweiterbar; schützt insbesondere langsam nachziehende F-Droid-Nutzerinnen vor stillem Bruch | erfordert Protokollierung der Client-Version je Aufruf |
| Header-/Content-Type-basierte Versionierung je Endpunkt | hoch | feingranular | für einen einzigen Erstanbieter-Client unnötige Komplexität |
| Unbegrenzt viele Versionen parallel betreiben | hoch, wachsend | keine Nutzerin verliert je Zugriff | jede parallele Version ist dauerhaft zu pflegender Code für ein Team ohne Kapazität dafür |
| Fester Abschalttermin ohne Evidenz-Prüfung | gering | einfachste Regel | riskiert, F-Droid-Nutzerinnen auszusperren, deren Update strukturell später ankommt |
| Kein Mechanismus (Status quo) | keiner | kein Aufwand | ein Deploy kann im Umlauf befindliche Altversionen brechen |

## Konsequenzen

- `backend-and-api.md` Abschnitt 4 erhält API-N-130 (additiv vs. brechend unterscheiden), API-F-270 (Client-Version je Aufruf protokollieren), API-N-140 (Mindestfrist 90 Tage) und API-N-150 (Abschaltung erst nach Frist **und** nachgewiesen vernachlässigbarem Zugriff).
- Löst API-N-030 konkret auf, ohne dessen Wortlaut zu ändern.

## Offene Punkte

- Konkreter Schwellenwert für „vernachlässigbaren Zugriff" (z. B. unter 1 % der Aufrufe über 7 Tage) — bei Einrichtung der Protokollauswertung festzulegen.
