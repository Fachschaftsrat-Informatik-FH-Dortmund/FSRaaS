---
id: wiki
titel: Wiki-Anbindung
praefix: WIKI
status: draft
prioritaet: kern
version: 0.1.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from: []
implemented_in: []
related:
  - ../../platform/integrations.md
  - ../../platform/non-functional.md
  - ../../platform/data-and-storage.md
  - ../../decisions/0005-wiki-bookstack-anbindung.md
  - ../e-key/spec.md
---

# Wiki-Anbindung

## 1. Zweck & Nutzen

Zeigt Inhalte des vom FSR betriebenen BookStack-Wikis (`wiki.fsrfb4.de`) in der App, statt Studierende auf eine separate Website zu verweisen. Vollständige Neuentwicklung ohne Vorbild in einer der Alt-Apps; abhängig von der noch offenen Verifikation der BookStack-API (INT-007).

## 2. Scope / Nicht-Scope

### Scope

- Anzeige von Wiki-Inhalten entlang der bestehenden BookStack-Kategorienstruktur (siehe Abschnitt 5).
- Volltextsuche innerhalb der angezeigten Wiki-Inhalte.
- Rückfalloption über eingebettete Webansicht, falls kein tragfähiger API-Zugang verfügbar ist (siehe INT-007, „Ersatzoption").

### Nicht-Scope

- Bearbeitung von Wiki-Inhalten aus der App heraus — die App ist ausschließlich lesend, Redaktion bleibt in BookStack selbst.
- Kontogebundene E-Key-Verwaltung (Verknüpfung, Status/Berechtigungen, Verloren-Meldung, semesterweise Bestätigung) — eigenständiges Feature, siehe `features/e-key/spec.md`. Die allgemeine E-Key-Wiki-Kategorie (Informationstext, Terminvereinbarung zur Ausgabe) bleibt Inhalt dieser Spec wie jede andere BookStack-Kategorie; `features/e-key/spec.md` verweist dorthin (EKEY-F-020).

## 3. Nutzergeschichten

- Als Studierende möchte ich Prüfungsordnungen und Leitfäden direkt in der App nachschlagen, ohne eine separate Website zu öffnen.
- Als Erstsemester möchte ich das Erstiheft in der App finden, wenn ich mich orientieren möchte.
- Als Studierende möchte ich nach einem Stichwort im Wiki suchen, statt die Kategorienstruktur manuell zu durchsuchen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| WIKI-F-010 | Sofern ein API-Token für das Wiki hinterlegt ist, muss das System Wiki-Seiten direkt in der App anzeigen. | NEU |
| WIKI-F-020 | Falls kein tragfähiger API-Zugang verfügbar ist, muss das System eine eingebettete Webansicht der BookStack-Instanz als Rückfalloption anzeigen. | NEU |
| WIKI-F-030 | Das System muss Wiki-Inhalte entlang der Hierarchie Shelf (Regal) › Book (Buch) › Chapter (Kapitel) › Page (Seite) navigierbar machen. | NEU |
| WIKI-F-040 | Das System muss eine Volltextsuche über die angezeigten Wiki-Inhalte anbieten. | NEU |
| WIKI-F-050 | Das System muss der Nutzerin einen direkten Einstiegspunkt zum Erstiheft-Inhalt bereitstellen, unabhängig von dessen Position in der Kategorienstruktur. | Recherche: wiki.fsrfb4.de, 2026-08-24 |

### Erläuterungen

**`WIKI-F-010`/`WIKI-F-020`** — Beide Anforderungen sind bedingt, weil INT-007 (`platform/integrations.md`) als „zu verifizieren" geführt wird: Ob BookStack tatsächlich API-Token bereitstellt und welche Inhalte für Studierende freigegeben sind, klärt der in `decisions/0005-wiki-bookstack-anbindung.md` vorgesehene Spike.

## 5. Datenmodell

Orientiert an der bei der Recherche (2026-08-24) unter `wiki.fsrfb4.de` festgestellten Kategorienstruktur, zu bestätigen im Zuge des INT-007-Spikes: Studium, IT, HoPo (Hochschulpolitik), Erstiheft, E-Key, Dezernate, Rechtliches, Bester Standort, Organisatorisches, Events. Diese Kategorien sind BookStack-„Bücher"; genaue Feldstruktur (Shelf/Book/Chapter/Page) liefert INT-007 nach Verifikation.

## 6. Externe Schnittstellen

Nutzt INT-007 (BookStack). Status „zu verifizieren" — siehe `platform/integrations.md`. Keine Endpunktdetails hier.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen einer Wiki-Seite |
| Leer (keine Suchtreffer) | Hinweis „keine Ergebnisse für '…'" |
| Fehler | Fehlermeldung mit Wiederholen-Option; bei dauerhaftem API-Ausfall automatischer Rückfall auf Webansicht (WIKI-F-020) |
| Offline | Zuletzt geladene Seiten aus dem Zwischenspeicher, siehe Abschnitt 8 |

## 8. Offline-Verhalten

Wiki-Inhalte gelten laut `platform/data-and-storage.md` Abschnitt 4 einen Tag als aktuell genug und werden bei fehlendem Netzzugriff aus dem Zwischenspeicher angezeigt, mit manueller Aktualisierungsmöglichkeit. Die eingebettete Webansicht (WIKI-F-020) ist bei fehlendem Netzzugriff nicht nutzbar.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| API-Token ungültig oder abgelaufen | Automatischer Rückfall auf Webansicht (WIKI-F-020), Hinweis an technische Leitung protokollieren |
| Wiki-Seite mit für die App nicht darstellbaren Inhalten (z. B. eingebettete Dateien) | In der Webansicht statt in der nativen Anzeige öffnen |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Nach erfolgreicher API-Verifikation zeigt die App mindestens die Kategorien Studium, Erstiheft und E-Key nativ an.
- Bei nicht verfügbarem API-Zugang ist das Wiki dennoch über die Webansicht nutzbar.

## 12. Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet eine Wiki-Anbindung.

## 13. Offene Fragen

- Ergebnis des INT-007-Spikes (URL, API-Token-Verfügbarkeit, freigegebene Inhalte) — `decisions/0005-wiki-bookstack-anbindung.md`.
