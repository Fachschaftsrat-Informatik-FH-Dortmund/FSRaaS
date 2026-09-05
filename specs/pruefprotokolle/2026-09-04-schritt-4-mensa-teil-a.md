---
status: draft
version: 0.2.0
owner: FSR FB4
last_reviewed: 2026-09-04
---

# Prüfprotokoll — Roadmap-Schritt 4, Nachlauf „Teil A" (Mensaplan-Überarbeitung 2.6.0)

Datum: 2026-09-04
Prüfer: Umsetzung (technische Leitung)
Grundlage: `../features/canteen/spec.md` 2.6.0, `../features/settings/spec.md` 0.6.0,
`../platform/backend-and-api.md` 3.4.0 (API-F-076), `../platform/quality-and-testing.md` Abschnitt 3,
`../platform/ux-and-theming.md` UX-F-160/UX-F-090/UX-N-010/UX-N-020.

Dieses Protokoll deckt die Punkte des Schnitts ab, für die nach `quality-and-testing.md`
Abschnitt 3 ein datiertes Prüfprotokoll statt eines automatisierten Tests zulässig ist
(Gestaltung, Barrierefreiheit, Geräteverhalten) sowie die Punkte, deren Verifikation ein
Gerät oder ein Fremdsystem benötigt. Die Fachlogik (Zusammenfassung, Datumsgrenzen, Filter,
Preisgruppe) ist über ID-tragende Einheitentests abgesichert (siehe Abschnitt 5).

## 1. Zusammengefasste Gerichtsliste und Alle-Mensen-Ansicht auf Gerät

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Zwei gewählte Mensen → eine Liste, jedes Gericht einmal, anbietende Mensen genannt (MENSA-F-012/F-014) | Einheitentest `consolidate.test.ts` + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Wechsel der aktiven Mensa ändert Hervorhebung und maßgeblichen Preis, nicht den Listenumfang (MENSA-F-016/F-018) | Einheitentest `consolidate.test.ts`, Screen-Test `CanteenScreen.test.tsx` + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Handlung „Alle Mensen anzeigen" öffnet die getrennte Ansicht; Rückkehr lässt Tag, Auswahl, Reihenfolge und aktive Mensa unverändert (MENSA-F-130/F-150) | Screen-Test `CanteenAllScreen.test.tsx` + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Geschlossen-Hinweis je nicht anbietender gewählter Mensa am Seitenende (MENSA-F-049) | Screen-Test + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |

## 2. Datumsgrenzen und Wischgeste

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Am heutigen Tag ist „Tag zurück" nicht auslösbar, Pfeil abgeblendet (MENSA-F-042) | Screen-Test `CanteenScreen.test.tsx`, Einheitentest `tageswahl.test.ts` | **bestanden** |
| Wochenende ohne Angebot wird beim Blättern übersprungen, mit Angebot angezeigt (MENSA-F-044) | Einheitentest `tageswahl.test.ts` | **bestanden** |
| Waagerechtes Wischen wechselt den Tag; Pfeile bleiben zweiter, sichtbarer Weg (MENSA-F-046, UX-F-090) | Einheitentest `gesten.test.ts` (Richtungslogik) + Verdrahtung über `PanResponder` | **bestanden** (Logik); **Wischgefühl auf Gerät ausstehend Gerät** — Prüfung, dass die Geste das senkrechte Scrollen nicht blockiert |

## 3. Unverträglichkeiten-Filter

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Zugang oben rechts in der Hauptansicht (MENSA-F-170) | Screen-Test `CanteenScreen.test.tsx` + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Hinweis auf ausschließlich lokale Verarbeitung, bevor eine Auswahl getroffen wird (MENSA-F-175) | Screen-Test `IntoleranceScreen.test.tsx` | **bestanden** |
| Betroffene Gerichte in der Hauptansicht ausgeblendet, Anzahl am Seitenende (MENSA-F-190/F-200) | Screen-Test + Einheitentest `intoleranceFilter.test.ts` | **bestanden** |
| In der Alle-Mensen-Ansicht ausgegraut statt ausgeblendet (MENSA-F-210) | Screen-Test `CanteenAllScreen.test.tsx` | **bestanden** (im Baum, `accessibilityState.disabled`); Kontrast/Erkennbarkeit der Ausgrauung **ausstehend Gerät** (UX-N-010) |
| Kein Aufruf gegen INT-008 oder eine andere Schnittstelle trägt die gewählten Codes (MENSA-F-215) | Statische Prüfung `intolerances.test.ts` (kein API-/Netz-Import); **Netzwerkmitschnitt bei aktivem Filter** | **bestanden** (statisch); **Netzwerkmitschnitt ausstehend Gerät** |

## 4. Preisgruppe

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Hauptansicht zeigt genau den Preis der gewählten Preisgruppe (MENSA-F-220) | Screen-Test `CanteenScreen.test.tsx` | **bestanden** |
| Alle-Mensen-Ansicht zeigt weiterhin alle drei Preise (MENSA-F-230) | Screen-Test `CanteenAllScreen.test.tsx` | **bestanden** |
| Einstellung `priceGroup`, Voreinstellung Studierende (SET-F-180/F-190) | Einheitentest `priceGroup.test.ts`, Screen-Test `SettingsScreen.test.tsx` | **bestanden** |

## 5. Herunterziehen zum Aktualisieren (MENSA-F-240, UX-F-160)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Herunterziehen löst einen erneuten Abruf der Tagespläne aus dem Backend-Zwischenspeicher aus | Screen-Test `CanteenScreen.test.tsx` (`RefreshControl` → `refetch`) | **bestanden** (Logik) |
| Ladeanzeige am oberen Listenrand; bei Fehlschlag bleibt der bisherige Stand mit Alters-/Fehlerhinweis | manuelle Prüfung | **ausstehend Gerät** |
| Kein synchroner INT-015-Abruf durch das Herunterziehen | Codeprüfung (`useSpeisepläne` liest nur `/mensen/{id}/speiseplan/{datum}`) | **bestanden** |

## 6. Barrierefreiheit / Gestaltung (UX)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Hervorhebung der aktiven Mensa zusätzlich zur Farbe (Rahmen/Schriftgewicht, UX-F-070) | Codeprüfung + manuelle Prüfung | **bestanden** (Code: 2-px-Rahmen zusätzlich zur Akzentfarbe); Geräteprüfung **ausstehend Gerät** |
| Bedienelemente ≥ 44×44 dp (Pfeile, Filter-Zugang, Stern, Chips, Segmentregler, UX-N-020) | Codeprüfung (`minWidth/minHeight: 44`) | **bestanden** (Code); Geräteprüfung **ausstehend Gerät** |
| Mindestkontrast 4,5:1 für Text und ausgegraute Gerichte (UX-N-010) | manuelle Prüfung | **ausstehend Gerät** |

## 7. Backend — Speiseplan-Job-Zeitplan (API-F-076, MENSA-N-020)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Nächster Lauf fällt vor die Morgen- und vor die Mittagsspitze sowie nach Mensaschluss; Grundintervall deckelt die Lücke | Einheitentest `SpeiseplanAbrufZeitplanTests.cs` (`API_F_076_*`) | **bestanden** |
| Uhrzeiten und Zeitzone aus der Konfiguration, Rückfall auf Vorgaben | Einheitentest `SpeiseplanAbrufZeitplanTests.cs` | **bestanden** |
| Tatsächlicher Lauf zur erwarteten Ortszeit gegen echte DB + INT-015; Ergebnis im `/health` | manuelle Prüfung mit laufender PostgreSQL-Instanz | **ausstehend** — braucht laufende Instanz; Verifikation gemeinsam mit dem nächsten Deployment |

## 8. iOS

iOS-Prebuild und alle iOS-Geräteprüfungen **ausstehend** — auf diesem Rechner (Windows) nicht
durchführbar, benötigt macOS. Gilt unverändert seit Schritt 2.

## 9. Gestaltungs-Überarbeitung 2026-09-04 (canteen 2.7.0)

Nachtrag auf Wunsch des FSR FB4 („Layout sieht nicht clean aus").

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| MENSA-F-250/F-260 — Lebensstil-Vorgabe (UND) und Ausschluss über die Kennzeichnungen | Einheitentest `dietFilter.test.ts` (`MENSA-F-250`, `MENSA-F-260`) | **bestanden** |
| MENSA-F-275 — Lebensstil-Vorgabe/​Ausschluss werden nie übertragen | Quelltextprüfung `dietPreference.test.ts` (`MENSA-F-275`) | **bestanden** |
| MENSA-F-270 — Lebensstil, Ausschluss und Unverträglichkeiten in einer Ansicht | Komponententest `IntoleranceScreen.test.tsx` (`MENSA-F-270`) | **bestanden** |
| MENSA-F-170/F-280 — Filterzugang in der Kopfzeile (headerRight), nicht in der Datumszeile | Komponententest `FilterZugang.test.tsx` (`MENSA-F-170`), `CanteenScreen.test.tsx` (`MENSA-F-280`) | **bestanden** |
| MENSA-F-290 — geschlossene Mensa ohne Öffnungszeit-Zeile | Komponententest `CanteenScreen.test.tsx` (`MENSA-F-290`) | **bestanden** |
| MENSA-F-280/F-285 — Leerraum Titel↔Datum, mittige Datumszeile, einzeilige Chip-Leiste; ruhiger Titelwechsel beim Tab-Wechsel (UX-F-170) | Sichtprüfung am Gerät | **ausstehend Gerät** |

## Bewertung

Die Fachlogik des Schnitts ist vollständig über ID-tragende automatisierte Tests abgesichert
(App: `consolidate`, `tageswahl`, `gesten`, `intoleranceFilter`, `priceGroup`, `intolerances`,
`CanteenScreen`, `CanteenAllScreen`, `IntoleranceScreen`, `SettingsScreen`; Backend:
`SpeiseplanAbrufZeitplanTests`). Offen bleiben ausschließlich Geräte- und Gestaltungsprüfungen
sowie der erste Live-Lauf des Job-Zeitplans gegen INT-015 — festzuhalten beim nächsten
Deployment und der ersten Android-Geräteabnahme.
