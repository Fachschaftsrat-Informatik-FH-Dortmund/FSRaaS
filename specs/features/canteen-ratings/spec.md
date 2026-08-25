---
id: canteen-ratings
titel: Mensa-Bewertungen
praefix: RATE
status: draft
prioritaet: kern
version: 0.3.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from: []
implemented_in: []
related:
  - ../../platform/backend-and-api.md
  - ../../platform/identity-and-moderation.md
  - ../../platform/security-and-privacy.md
  - ../../platform/data-and-storage.md
  - ../../platform/quality-and-testing.md
  - ../../platform/integrations.md
  - ../canteen/spec.md
---

# Mensa-Bewertungen

## 1. Zweck & Nutzen

Ermöglicht Studierenden, Gerichte des Mensaplans zu bewerten, und anderen Studierenden, sich vor der Essensauswahl an diesen Bewertungen zu orientieren. Vollständige Neuentwicklung ohne Vorbild in einer der Alt-Apps — der erste Schreibpfad und die erste nutzergenerierte Inhaltsart der neuen App.

## 2. Scope / Nicht-Scope

### Scope

- Sternebewertung (1–5) je Gericht, optionaler Freitext-Kommentar — Verfassen erfordert ein Konto (siehe `platform/identity-and-moderation.md` Abschnitt 2, `decisions/0004-identitaet-und-anmeldung.md`).
- Lesen von Bewertungen und der Gesamtbewertung ohne Konto, für jede Nutzerin.
- Anzeige der Gesamtbewertung (Durchschnitt über alle Tage) und der Anzahl abgegebener Bewertungen je Gericht in der Übersicht (Mensaplan).
- Detailansicht je Gericht mit zusätzlicher, auf den aktuellen Tag beschränkter Durchschnittsbewertung, da sich dieselbe Gerichtsbezeichnung je nach Zubereitungstag unterscheiden kann.
- Melden und Moderation missbräuchlicher Kommentare.
- Einstiegspunkt ausschließlich innerhalb des Mensaplans je Gericht, kein eigener Navigationspunkt in der App-weiten Navigationsstruktur (siehe `platform/architecture.md` ARCH-F-090).

### Nicht-Scope

- Bewertung der Mensa als Ganzes (Ambiente, Service) — Scope ist ausschließlich das einzelne Gericht.
- Separate Bewertung je Mensa-Standort für dasselbe Gericht — als Idee erkannt (Entscheidung FSR FB4, 2026-08-25), aber bewusst nicht in diesem Umfang; siehe Abschnitt 13.
- Konto-Erstellung/-Verwaltung selbst (Anmeldeweg, SSO-Anbindung) — `platform/identity-and-moderation.md`, `platform/integrations.md` INT-012.

## 3. Nutzergeschichten

- Als Studierende möchte ich ein Gericht mit Sternen bewerten, damit andere von meiner Einschätzung profitieren.
- Als Studierende möchte ich vor der Essensauswahl sehen, wie andere ein Gericht bewertet haben.
- Als Studierende möchte ich in einer Detailansicht sehen, wie das Gericht speziell heute bewertet wurde, da sich die Zubereitung von Tag zu Tag unterscheiden kann.
- Als Studierende möchte ich einen unangemessenen Kommentar melden können.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| RATE-F-010 | Das System muss der Nutzerin eine Sternebewertung von 1 bis 5 für ein einzelnes Gericht ermöglichen. | NEU |
| RATE-F-020 | Das System muss der Nutzerin einen optionalen Freitext-Kommentar zu einer Bewertung ermöglichen. | NEU |
| RATE-F-030 | Das System muss zu jedem Gericht die Gesamtbewertung (Durchschnittswert über alle Tage) und die Anzahl abgegebener Bewertungen in der Übersicht anzeigen. | NEU |
| RATE-F-040 | Wenn eine Person für ein Gericht an einem Tag bereits eine Bewertung abgegeben hat, muss das System eine weitere Bewertung derselben Person für dasselbe Gericht am selben Tag ablehnen. | NEU |
| RATE-F-050 | Das System muss Gerichtsbezeichnungen vor der Verknüpfung mit Bewertungen normalisieren, sodass dasselbe Gericht an verschiedenen Tagen demselben Bewertungsziel zugeordnet wird. | NEU |
| RATE-F-060 | Das System muss der Nutzerin das Melden eines Bewertungskommentars ermöglichen. | NEU |
| RATE-F-070 | Das System muss der Nutzerin das Löschen der eigenen Bewertung ermöglichen. | NEU |
| RATE-F-080 | Wenn die Nutzerin ein Gericht antippt, muss das System eine Detailansicht mit der auf den aktuellen Tag beschränkten Durchschnittsbewertung zusätzlich zur Gesamtbewertung (RATE-F-030) anzeigen. | NEU |
| RATE-F-090 | Das System muss das Lesen von Bewertungen ohne Konto ermöglichen und ein Konto ausschließlich beim Verfassen, Bearbeiten oder Löschen einer eigenen Bewertung verlangen. | NEU |

### Erläuterungen

**`RATE-F-040`** — Setzt IDENT-F-050 (`platform/identity-and-moderation.md`) technisch um; das Konto grenzt die „Person" ab, siehe dort.

**`RATE-F-090`** — Entscheidung FSR FB4, 2026-08-25 (`decisions/0004-identitaet-und-anmeldung.md`): Vor dieser Entscheidung genügte für jede Bewertung ein reines, gerätegebundenes Pseudonym, auch zum Verfassen. Ersetzt durch eine Kontopflicht ausschließlich für den Schreibpfad — Lesen bleibt uneingeschränkt kontofrei. Löst die bisherige Offene Frage zur Umgehbarkeit der Einmal-pro-Tag-Sperre bei Gerätewechsel (siehe Abschnitt 13): Ein Konto ist nicht gerätegebunden.

**`RATE-F-050`** — Rohtitel aus INT-004 (`meals[].title`) sind nicht garantiert stabil formatiert (siehe `platform/quality-and-testing.md` Abschnitt 5, „Normalisierung der Gerichtsbezeichnungen"). Ohne Normalisierung würde geringfügig unterschiedlich geschriebene, aber identische Gerichte als getrennte Bewertungsziele geführt. Normalisierungsregel: Kleinschreibung, Vereinheitlichung von Mehrfach-Leerzeichen auf ein einzelnes, Entfernen von führendem/nachgestelltem Whitespace, Entfernen führender Tagesnummerierungen (Muster `^\d+\.\s*`). Diese Regel ist der verbindliche Ausgangspunkt für die in `platform/quality-and-testing.md` (QA) geforderten Tests; eine Erweiterung bei Umsetzung (z. B. um weitere beobachtete Schreibvarianten) bleibt möglich, ohne dass diese Kernregel entfällt.

**`RATE-F-080`** — Entscheidung FSR FB4, 2026-08-25 (siehe `product/whatsapp-feedback-inventory.md` Abschnitt 8, dort als offene Frage geführt und nun direkt vom FSR beantwortet statt über eine gesonderte Nutzerumfrage): Dieselbe normalisierte Gerichtsbezeichnung (RATE-F-050) kann an verschiedenen Tagen unterschiedlich zubereitet und entsprechend unterschiedlich bewertet werden. Die tagesaktuelle Durchschnittsbewertung ergibt sich durch Filterung der vorhandenen Bewertungen (Zeitstempel, siehe Datenmodell) auf den aktuellen Tag — kein zusätzliches Datenfeld nötig.

## 5. Datenmodell

Bewertung: Konto-Referenz (siehe `platform/identity-and-moderation.md`), öffentlich angezeigtes Pseudonym (Anzeigename, vom Konto entkoppelbar), Gericht-Referenz (normalisierter Titel), Sterne (1–5), Kommentar (optional), Zeitstempel, Moderationsstatus (sichtbar/gemeldet/entfernt). Der Zeitstempel dient sowohl der Einmal-pro-Tag-Sperre (RATE-F-040) als auch der Berechnung der tagesaktuellen Durchschnittsbewertung (RATE-F-080, Filterung auf den aktuellen Tag) — kein separates Feld für die Standortzuordnung, siehe Abschnitt 2 Nicht-Scope. Rollen- und Moderationsmodell: `platform/identity-and-moderation.md`. Verarbeitungsverzeichnis-Eintrag: `platform/security-and-privacy.md` Abschnitt 3.

## 6. Externe Schnittstellen

Schreibpfad ausschließlich über das eigene Backend INT-008 (siehe `platform/architecture.md` ARCH-F-030). Konto-Anmeldung nutzt INT-012 (Hochschul-SSO) bzw. dessen Ersatzoption, siehe `platform/integrations.md`. Keine weiteren externen Schnittstellen.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen bestehender Bewertungen |
| Leer | Hinweis „noch keine Bewertungen — sei die/der Erste" |
| Fehler | Fehlermeldung mit Wiederholen-Option beim Laden; beim Absenden: Hinweis, dass die Bewertung in der Warteschlange verbleibt (siehe Abschnitt 8) |
| Offline | Absenden landet in der lokalen Offline-Warteschlange, siehe Abschnitt 8 |

## 8. Offline-Verhalten

Wenn eine Bewertung ohne Netzwerkverbindung abgesendet wird, reiht die App sie gemäß `platform/architecture.md` (ARCH-F-120) und `platform/data-and-storage.md` (DATA-F-100) in die lokale Offline-Warteschlange ein und überträgt sie bei wiederhergestellter Verbindung automatisch. Idempotenz bei erneuter Übertragung sichert `platform/backend-and-api.md` (API-F-140).

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Doppelte Bewertung desselben Gerichts am selben Tag | Ablehnung mit Hinweis auf die bereits bestehende eigene Bewertung, Angebot zum Bearbeiten statt Neuanlage |
| Gemeldeter Kommentar | Verbleibt sichtbar bis zur Moderationsprüfung (siehe `platform/identity-and-moderation.md` IDENT-F-090) |
| Massenhafte Bewertungen von derselben Quelle in kurzer Zeit | Zur Prüfung markiert, siehe `platform/identity-and-moderation.md` IDENT-F-060 |
| Kein Beleg einer Bewertung für den aktuellen Tag beim Öffnen der Detailansicht | Tagesaktuelle Bewertung als „noch keine Bewertung heute" kennzeichnen statt 0 Sterne auszugeben |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| RATE-N-010 | Das System muss die Normalisierung von Gerichtsbezeichnungen (RATE-F-050) automatisiert testen. | Alt: bewusst verworfen |

## 11. Akzeptanzkriterien

- Eine zweite Bewertung derselben Person für dasselbe Gericht am selben Tag wird abgelehnt.
- Ein gemeldeter Kommentar bleibt bis zur Moderationsentscheidung sichtbar.
- Eine offline abgesendete Bewertung wird nach Wiederherstellung der Verbindung genau einmal gezählt.
- Die Detailansicht eines Gerichts zeigt korrekt sowohl die Gesamtbewertung als auch die tagesaktuelle Bewertung; existieren für den aktuellen Tag noch keine Bewertungen, zeigt die Detailansicht dies erkennbar an statt einer irreführenden Null-Bewertung.

## 12. Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet Bewertungen.

## 13. Offene Fragen

- Speicherdauer/Löschverhalten von Bewertungen nach Kontolöschung — bereits in `platform/identity-and-moderation.md` (IDENT-F-120/130) geregelt, hier nur referenziert.
- Ob Hochschul-SSO als Konto-Anmeldeweg verfügbar ist — `platform/integrations.md` INT-012, betrifft direkt, wie leichtgewichtig das Konto für RATE-F-090 tatsächlich ausfällt.
- Standortbezogene Bewertung (dasselbe Gericht unterschiedlich je Mensa-Standort bewertet): vom FSR FB4 am 2026-08-25 als mögliche künftige Erweiterung benannt, aber ausdrücklich nicht in diesem Umfang zu implementieren. Bei künftiger Aufnahme: eigene ID-Vergabe und Datenmodell-Erweiterung (Mensa-Referenz je Bewertung) nötig, kein Nachtrag zu RATE-F-080.
