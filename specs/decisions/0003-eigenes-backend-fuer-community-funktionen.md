---
nummer: 0003
titel: Eigenes Backend für Community-Funktionen
status: angenommen
datum: 2026-08-24
betrifft:
  - ../platform/backend-and-api.md
  - ../platform/architecture.md
  - ../platform/integrations.md
  - ../features/canteen-ratings/spec.md
  - ../features/events/spec.md
  - ../features/event-volunteers/spec.md
  - ../features/room-finder/spec.md
---

# ADR 0003: Eigenes Backend für Community-Funktionen

## Kontext

Aus einem reinen Lese-Client über öffentliche Hochschul-Schnittstellen wird eine Anwendung mit nutzergenerierten Inhalten, personenbezogenen Daten und Schreibpfaden. Vier voneinander unabhängige Anforderungen lassen sich mit der bisherigen Architektur (App ruft externe Quellen direkt auf) nicht erfüllen: Mensa-Bewertungen und Helfer-Anmeldungen brauchen serverseitige Persistenz, Identitätsprüfung und Moderation; die Raumsuche braucht eine Aggregation der FBWS-Termine über alle Studiengang/Semester-Kombinationen, die der FBWS selbst nicht anbietet; News (INT-003) und Mensa (INT-004) hängen an `fb4app.hemacode.de`, privater Infrastruktur unklarer Trägerschaft, beim Mensa-Aufruf zusätzlich unverschlüsselt; Events und FSR-News müssen redaktionell gepflegt werden. Details: `../platform/backend-and-api.md`, Abschnitt 1.

## Entscheidung

Ein eigenes Backend (INT-008) wird eingeführt. Es trägt die Schreibpfade für Bewertungen und Helfer-Anmeldungen, aggregiert periodisch die Raumbelegung aus den FBWS-Terminen, dient als vorgelagerter Zwischenspeicher für News und Mensa-Speisepläne und bietet der FSR-Redaktion eine Pflegemöglichkeit für Events und News.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| Rein clientseitig (kein Backend) | keiner | kein zusätzlicher Betrieb | Schreibpfade nicht realisierbar: keine Persistenz, keine Missbrauchskontrolle, keine Moderation; Raumsuche bliebe auf Dutzende Einzelanfragen je Suche angewiesen |
| Fremdanbieter-Baukasten (z. B. Backend-as-a-Service) | mittel | schneller Start, kein eigener Betrieb der Kerninfrastruktur | Abhängigkeit vom Anbieter; Datenschutzfragen bei Verarbeitung außerhalb eigener Kontrolle; laufende Kosten; wenig Flexibilität für die Raumaggregation |
| Ausbau der bestehenden `hemacode.de`-Lösung | gering bis mittel | vorhandene Struktur nutzbar | unklare Trägerschaft, kein Einfluss auf Weiterentwicklung, schreibt das bestehende Risiko fort statt es zu lösen |
| Nutzung vorhandener FSR-Infrastruktur | zu prüfen | ggf. geringe Zusatzkosten | Eignung (Kapazität, Verfügbarkeit, Zugriffsrechte) ungeklärt |

## Konsequenzen

Das Projekt übernimmt Betrieb, Kosten und Verantwortung für eine zusätzliche Infrastrukturkomponente sowie die daraus entstehenden Datenschutzpflichten als datenverarbeitende Stelle. Im Gegenzug entfällt die Abhängigkeit von `hemacode.de`, und die Raumsuche wird erst dadurch alltagstauglich. Alle Feature-Specs mit Schreibpfaden oder Aggregationsbedarf (RATE, EVENT, HELFER, RAUM) setzen dieses Backend als gegeben voraus.

## Offene Punkte

- ~~Betreiber~~ — geklärt: FSR FB4 selbst, siehe `../platform/backend-and-api.md` Abschnitt 6.
- ~~Hosting~~ — geklärt: eigener Hetzner-VPS.
- ~~Technologie~~ — geklärt: .NET/C#, siehe `../platform/backend-and-api.md` Abschnitt 8.
- Finanzierung
- Konkreter Server-Zuschnitt, Zugriffsverwaltung und Backup-Ziel auf dem Hetzner-VPS
