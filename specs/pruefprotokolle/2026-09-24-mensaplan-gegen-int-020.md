---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-24
---

# Prüfprotokoll — Mensaplan gegen die Live-Schnittstelle INT-020

Datum: 2026-09-24
Prüfer: Umsetzung (technische Leitung), Gerätetest auf Android
Grundlage: `openspec/changes/mensa-api-abloesung/` (proposal, design, specs, tasks)
Aufgabe 10.2: „Gerätetest des Mensaplans gegen die Live-Schnittstelle: Tagwechsel,
geschlossene Mensa, geöffnete Mensa ohne Speiseplan, Filtermenü, Sortierung."
Zulässig als Prüfprotokoll statt eines automatisierten Tests nach
`openspec/specs/quality-and-testing/spec.md` Abschnitt 3 (Gestaltung, Bedienung,
Geräteverhalten).

**Ergebnis in einem Satz:** Der Mensaplan läuft auf dem Android-Gerät gegen die
Live-Schnittstelle durch; die geprüften Punkte wurden ohne Befund abgenommen.

## 1. Geprüfte Punkte

| Prüfpunkt | Ergebnis |
|---|---|
| Tagwechsel (Blättern und Wischen, Wochenend-Überspringen nach Öffnungsangabe) | **bestanden** |
| Geschlossene Mensa — Geschlossen-Hinweis, Grund, Zeitraum, Wiedereröffnung | **bestanden** |
| Geöffnete Mensa ohne Speiseplan — eigener Hinweis statt Geschlossen-Hinweis, Öffnungszeit sichtbar | **bestanden** |
| Filtermenü — getrennte Abschnitte für Allergene und Zusatzstoffe, Sammelschalter, CO₂-Ausschluss | **bestanden** |
| Sortierung und Gruppierung, einschließlich CO₂-Klasse | **bestanden** |

Der Prüfer hat den Lauf als bestanden gemeldet, ohne Einzelbefunde. Dieses Protokoll
gibt diese Meldung wieder; über die Zeilen der Tabelle hinausgehende Beobachtungen
(Gerätemodell, Erscheinungsbild, Einzelmessungen) wurden nicht festgehalten.

## 2. Zustand der Quelle zum Prüfzeitpunkt

Stichprobe gegen `https://mensa.fb4.it` am 2026-09-24, unmittelbar vor der Abnahme:

| Angabe | Wert |
|---|---|
| Standorte (`GET /canteens`) | 15 |
| Speiseplan der Hauptmensa (`GET /canteens/341/menu`) | 11 Tage, 84 Gerichte |
| davon mit `co2Class` | 83 |
| Gerichte ohne `linesEn` | 0 |
| Legende (`GET /legend`) | `labelEn` bei allen Einträgen vorhanden, CO₂-Klassen `A`, `B`, `C`, `E` |
| Öffnungsangaben (`GET /canteens/341/hours`) | `today`, `week`, `forecast`, `closures` vorhanden |
| `Cache-Control` der Quelle | `public, max-age=300` |
| `GET /health` | `status: ok`, Speiseplan-Stand vom Prüftag |

Damit traf der Gerätetest auf eine Quelle, deren Struktur seit der Verifikation vom
2026-09-22 und der Legenden-Erweiterung vom 2026-09-24 unverändert ist.

## 3. Abgrenzung

Die Fachlogik dieses Changes ist über automatisierte Tests abgesichert, die den
Requirement-Titel im `describe`-Namen tragen — Öffnungs- und Schließzustände,
Gerichtsdarstellung, Filter, Sortierung und Gruppierung, Datenalter. Dieses Protokoll
deckt allein ab, was sich nur am Gerät und gegen die laufende Quelle zeigt.
