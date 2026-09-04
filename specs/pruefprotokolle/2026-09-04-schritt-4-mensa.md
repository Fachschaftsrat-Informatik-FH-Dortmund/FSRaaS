---
status: draft
version: 0.2.0
owner: FSR FB4
last_reviewed: 2026-09-04
---

# Prüfprotokoll — Roadmap-Schritt 4 (Mensaplan)

Datum: 2026-09-04
Prüfer: Umsetzung (technische Leitung)
Grundlage: `../features/canteen/spec.md` 1.1.0, `../platform/quality-and-testing.md` Abschnitt 3, `../platform/non-functional.md` Abschnitt 11

**Nachtrag vom 2026-09-04, nach Abschluss dieser Prüfung.** Die Mensa-Spec wurde am selben Tag auf Fassung 2.0.0 überarbeitet (zusammengefasste Gerichtsliste, Datumsgrenzen, Wischen, Ansicht aller Mensen; MENSA-F-080 entfallen zugunsten der Höchstbewertung MENSA-F-085). Dieses Protokoll bleibt als datierter Befund zur Fassung 1.1.0 unverändert bestehen und wird **nicht** rückwirkend angepasst. Die hier geprüften Punkte zu MENSA-N-010, MENSA-F-100 und MENSA-F-110 gelten fachlich weiter, ihre Auslösung wechselt jedoch mit Roadmap-Schritt 9 von der Stern-Markierung auf die Höchstbewertung — die Prüfpunkte „Berechtigung beim ersten Markieren" und „Markieren bleibt nutzbar" sind dann auf die Bewertung zu beziehen und erneut zu prüfen.

Dieses Protokoll deckt die Anforderungen des Schnitts ab, für die nach `quality-and-testing.md` Abschnitt 3 ein datiertes Prüfprotokoll statt eines automatisierten Tests zulässig ist (Leistungswerte, Geräteverhalten), sowie die Punkte, deren Verifikation Geräte oder Fremdsysteme benötigt.

## 1. MENSA-N-010 — Lieblingsgericht-Abgleich bis 11:00 Uhr Ortszeit

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Hintergrundaufgabe wird registriert | `expo-background-fetch` / `expo-task-manager`, Registrierung beim ersten Markieren eines Lieblingsgerichts | **bestanden** (Registrierung), Ausführungszeitpunkt siehe unten |
| Abgleichlogik (Treffer nur für gewählte Mensen, genau eine Meldung je Gericht/Mensa/Tag) | Einheitentest `backgroundCheck.test.ts` (`MENSA-F-100`, `MENSA-F-110` im Testnamen) | **bestanden** |
| Tatsächliche Ausführung der Hintergrundaufgabe vor 11:00 Uhr auf Gerät | Beobachtung über mehrere Tage, Android und iOS | **ausstehend Gerät** — betriebssystemgesteuert (WorkManager / BGTaskScheduler), best effort; kein garantierter Zeitpunkt |
| Vordergrund-Nachholung beim App-Öffnen vor 11:00 Uhr | Einheitentest + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Kein Nachholen am Nachmittag | Einheitentest `backgroundCheck.test.ts` | **bestanden** |

Bewertung: Die Abgleich- und Nachhollogik ist automatisiert abgesichert. MENSA-N-010 bleibt ein Zielwert (`non-functional.md` Abschnitt 11) — die exakte Ausführungszeit der Hintergrundaufgabe liegt beim Betriebssystem; die Vordergrund-Nachholung deckt verpasste Weckrufe innerhalb des Vormittags. Mehrtägige Gerätebeobachtung steht aus.

## 2. MENSA-F-100 — Lokale Gerätebenachrichtigung

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Benachrichtigung erscheint bei einem Lieblingsgericht im Tagesplan | manuelle Prüfung auf Android-Emulator/-Gerät mit verkürztem Test-Intervall | **ausstehend Gerät** |
| Kein Firebase / kein Google-Play-Services im Android-Build (NFR-N-170) | `./gradlew :app:dependencies --configuration releaseRuntimeClasspath` am 2026-09-03, Suche nach `firebase`/`play-services`/`gms` | **bestanden** — keine Treffer; `@notifee/react-native` zieht `app.notifee:core` (Firebase-frei) aus dem lokalen Maven-Repo des npm-Pakets, `expo-background-fetch`/`expo-task-manager` nutzen WorkManager/BGTaskScheduler |
| Android-Debug-Build baut mit den neuen nativen Modulen | `./gradlew :app:assembleDebug` am 2026-09-03 | **bestanden** — BUILD SUCCESSFUL; nur Deprecation-Warnungen aus Expo-Internals. Der Config-Plugin `plugins/withNotifeeMaven.js` trägt das notifee-Maven-Repo in `android/build.gradle` ein (notifees eigener `rootProject.allprojects`-Eintrag greift mit configure-on-demand zu spät) |
| Berechtigung wird erst beim ersten Markieren angefragt (SEC-F-080) | manuelle Prüfung | **ausstehend Gerät** |
| Markieren bleibt bei verweigerter Berechtigung nutzbar (SEC-F-090) | Komponententest + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |

## 3. MENSA-Anzeige auf Gerät (Gestaltung)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Speiseplan lädt, Tagesblätterung, Gruppierung nach Ausgabestelle, Beilagen abgesetzt | manuelle Prüfung | **ausstehend Gerät** |
| Offline: letzter Stand mit Altershinweis statt Leeransicht | manuelle Prüfung (Flugmodus) | **ausstehend Gerät** |
| Ausgangsbestand greift bei nicht erreichbarem Backend (MENSA-F-075) | Einheitentest `stammdatenFallback.test.ts` + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |

## 4. iOS

iOS-Prebuild und alle iOS-Geräteprüfungen **ausstehend** — auf diesem Rechner (Windows) nicht durchführbar, benötigt macOS. Gilt unverändert seit Schritt 2.

## 5. Backend gegen INT-015 (Live)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Feldstruktur der INT-015-Antworten (Gericht, `/types`, `/additives`) | Live-Abfrage `mobil.itmc.tu-dortmund.de/canteen-menu/v3/` am 2026-09-03 | **bestanden** — in `../platform/integrations.md` INT-015 dokumentiert; `openings/all` → HTTP 500, wird nicht genutzt |
| Vertragstest gegen die dokumentierte Struktur (QA-N-070) | `ItmcMensaClientTests` mit aufgezeichneter Antwort | **bestanden** |
| Erster Job-Lauf füllt den Zwischenspeicher, Ergebnis im `/health` | manuelle Prüfung gegen echte DB + INT-015 | **ausstehend** — braucht laufende PostgreSQL-Instanz |
