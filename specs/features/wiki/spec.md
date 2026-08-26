---
id: wiki
titel: Wiki-Anbindung
praefix: WIKI
status: draft
prioritaet: kern
version: 0.2.0
owner: FSR FB4
last_reviewed: 2026-08-26
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
| WIKI-F-060 | Das System darf ausschließlich für Studierende freigegebene BookStack-Bücher anzeigen; als intern gekennzeichnete Bücher (z. B. „Intern") müssen ausgeschlossen bleiben. | Recherche: Live-Testabruf wiki.fsrfb4.de, 2026-08-26 |

### Erläuterungen

**`WIKI-F-010`/`WIKI-F-020`** — Der Live-Testabruf vom 2026-08-26 bestätigt, dass BookStack tatsächlich API-Token bereitstellt und die App darüber lesend zugreifen kann (siehe `platform/integrations.md` INT-007). Bedingt bleiben die Anforderungen dennoch: Der geprüfte Token liefert derzeit auch interne Inhalte zurück, siehe `WIKI-F-060` und `decisions/0005-wiki-bookstack-anbindung.md`.

**`WIKI-F-060`** — Beim Testabruf lieferte der bereitgestellte Token uneingeschränkt alle 12 Bücher zurück, einschließlich des in BookStack selbst als „nicht öffentlich" beschriebenen Buchs „Intern". BookStack unterscheidet an der geprüften Schnittstelle nicht selbst zwischen öffentlich und FSR-intern; die Trennung muss die App-Seite (Konto mit eingeschränkten Rechten oder serverseitige Positivliste) herstellen, bevor WIKI umgesetzt wird.

## 5. Datenmodell

Bestätigt durch Live-Testabruf (2026-08-26, 12 Bücher): Studium, IT, HoPo, Erstiheft, E-Key, Dezernate, Rechtliches, Bester Standort, Organisatorisches, Events, Willkommen, Intern. Die ersten zehn entsprechen der bei der Recherche (2026-08-24) festgestellten Struktur; „Willkommen" und „Intern" kamen beim Testabruf hinzu — „Intern" ist laut BookStack-Beschreibung nicht für Studierende bestimmt und fällt unter `WIKI-F-060`. Diese Kategorien sind BookStack-„Bücher"; Feldstruktur Shelf/Book/Chapter/Page siehe `platform/integrations.md` INT-007.

## 6. Externe Schnittstellen

Nutzt INT-007 (BookStack). Status „Kernzugriff bestätigt, Berechtigungsmodell offen" — siehe `platform/integrations.md`. Keine Endpunktdetails hier.

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

- Wie wird technisch sichergestellt, dass als intern gekennzeichnete Bücher (`WIKI-F-060`) nicht an Studierende ausgeliefert werden — eigenes rechtebeschränktes BookStack-Konto oder serverseitige Positivliste? — `decisions/0005-wiki-bookstack-anbindung.md`.
- Endgültige Festlegung auf Option (b) aus `decisions/0005-wiki-bookstack-anbindung.md`, abhängig von der Klärung des Berechtigungsmodells.
