## Purpose

Zeigt Inhalte des vom FSR betriebenen BookStack-Wikis (`wiki.fsrfb4.de`) in der App, statt Studierende auf eine separate Website zu verweisen. Vollständige Neuentwicklung ohne Vorbild in einer der Alt-Apps; abhängig von der noch offenen Verifikation der BookStack-API (INT-007). Vormals `specs/features/wiki/spec.md` (Präfix `WIKI`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Native Anzeige bei vorhandenem API-Token

Sofern ein API-Token für das Wiki hinterlegt ist, muss das System Wiki-Seiten direkt in der App anzeigen. Herkunft: NEU. (vormals WIKI-F-010)

Der Live-Testabruf vom 2026-08-26 bestätigt, dass BookStack tatsächlich API-Token bereitstellt und die App darüber lesend zugreifen kann (siehe Capability `integrations`, INT-007). Bedingt bleibt die Anforderung dennoch: Der geprüfte Token liefert derzeit auch interne Inhalte zurück, siehe Requirement „Ausschluss interner Bücher" und `specs/decisions/0005-wiki-bookstack-anbindung.md`.

#### Scenario: Token hinterlegt
- **WHEN** ein gültiges API-Token für BookStack hinterlegt ist
- **THEN** zeigt die App Wiki-Seiten nativ an

### Requirement: Webansicht als Rückfalloption

Falls kein tragfähiger API-Zugang verfügbar ist, muss das System eine eingebettete Webansicht der BookStack-Instanz als Rückfalloption anzeigen. Herkunft: NEU. (vormals WIKI-F-020)

#### Scenario: Kein tragfähiger API-Zugang
- **WHEN** kein tragfähiger API-Zugang zu BookStack verfügbar ist
- **THEN** zeigt das System stattdessen eine eingebettete Webansicht der Instanz

### Requirement: Navigierbare Hierarchie

Das System muss Wiki-Inhalte entlang der Hierarchie Shelf (Regal) › Book (Buch) › Chapter (Kapitel) › Page (Seite) navigierbar machen. Herkunft: NEU. (vormals WIKI-F-030)

#### Scenario: Navigation durch die Hierarchie
- **WHEN** die Nutzerin ein Regal öffnet
- **THEN** navigiert sie über Bücher und Kapitel bis zu einzelnen Seiten

### Requirement: Volltextsuche

Das System muss eine Volltextsuche über die angezeigten Wiki-Inhalte anbieten. Herkunft: NEU. (vormals WIKI-F-040)

#### Scenario: Suche ohne Treffer
- **WHEN** eine Suche keine Treffer liefert
- **THEN** zeigt das System den Hinweis „keine Ergebnisse für '…'"

### Requirement: Direkter Einstiegspunkt zum Erstiheft

Das System muss der Nutzerin einen direkten Einstiegspunkt zum Erstiheft-Inhalt bereitstellen, unabhängig von dessen Position in der Kategorienstruktur. Herkunft: Recherche: wiki.fsrfb4.de, 2026-08-24. (vormals WIKI-F-050)

#### Scenario: Erstiheft direkt erreichbar
- **WHEN** eine Erstsemester-Nutzerin die App öffnet
- **THEN** findet sie einen direkten Zugang zum Erstiheft, ohne die Kategorienstruktur manuell zu durchsuchen

### Requirement: Ausschluss interner Bücher

Das System darf ausschließlich für Studierende freigegebene BookStack-Bücher anzeigen; als intern gekennzeichnete Bücher (z. B. „Intern") müssen ausgeschlossen bleiben. Herkunft: Recherche: Live-Testabruf wiki.fsrfb4.de, 2026-08-26. (vormals WIKI-F-060)

Beim Testabruf lieferte der bereitgestellte Token uneingeschränkt alle 12 Bücher zurück, einschließlich des in BookStack selbst als „nicht öffentlich" beschriebenen Buchs „Intern". BookStack unterscheidet an der geprüften Schnittstelle nicht selbst zwischen öffentlich und FSR-intern; die Trennung muss die App-Seite (Konto mit eingeschränkten Rechten oder serverseitige Positivliste) herstellen, bevor diese Capability umgesetzt wird.

#### Scenario: Als intern gekennzeichnetes Buch
- **WHEN** das Token auch das Buch „Intern" zurückliefert
- **THEN** filtert das System es aus der Anzeige, bevor Inhalte an Studierende ausgeliefert werden

## Scope / Nicht-Scope

### Scope
- Anzeige von Wiki-Inhalten entlang der bestehenden BookStack-Kategorienstruktur (siehe Datenmodell).
- Volltextsuche innerhalb der angezeigten Wiki-Inhalte.
- Rückfalloption über eingebettete Webansicht, falls kein tragfähiger API-Zugang verfügbar ist (siehe INT-007, „Ersatzoption").

### Nicht-Scope
- Bearbeitung von Wiki-Inhalten aus der App heraus — die App ist ausschließlich lesend, Redaktion bleibt in BookStack selbst.
- Kontogebundene E-Key-Verwaltung (Verknüpfung, Status/Berechtigungen, Verloren-Meldung, semesterweise Bestätigung) — eigenständiges Feature, siehe Capability `e-key`. Die allgemeine E-Key-Wiki-Kategorie (Informationstext, Terminvereinbarung zur Ausgabe) bleibt Inhalt dieser Capability wie jede andere BookStack-Kategorie; `e-key` verweist dorthin.

## Nutzergeschichten

- Als Studierende möchte ich Prüfungsordnungen und Leitfäden direkt in der App nachschlagen, ohne eine separate Website zu öffnen.
- Als Erstsemester möchte ich das Erstiheft in der App finden, wenn ich mich orientieren möchte.
- Als Studierende möchte ich nach einem Stichwort im Wiki suchen, statt die Kategorienstruktur manuell zu durchsuchen.

## Datenmodell

Bestätigt durch Live-Testabruf (2026-08-26, 12 Bücher): Studium, IT, HoPo, Erstiheft, E-Key, Dezernate, Rechtliches, Bester Standort, Organisatorisches, Events, Willkommen, Intern. Die ersten zehn entsprechen der bei der Recherche (2026-08-24) festgestellten Struktur; „Willkommen" und „Intern" kamen beim Testabruf hinzu — „Intern" ist laut BookStack-Beschreibung nicht für Studierende bestimmt und fällt unter das Requirement „Ausschluss interner Bücher". Diese Kategorien sind BookStack-„Bücher"; Feldstruktur Shelf/Book/Chapter/Page siehe Capability `integrations`, INT-007.

## Externe Schnittstellen

Nutzt INT-007 (BookStack). Status „Kernzugriff bestätigt, Berechtigungsmodell offen" — siehe Capability `integrations`. Keine Endpunktdetails hier.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen einer Wiki-Seite |
| Leer (keine Suchtreffer) | Hinweis „keine Ergebnisse für '…'" |
| Fehler | Fehlermeldung mit Wiederholen-Option; bei dauerhaftem API-Ausfall automatischer Rückfall auf Webansicht |
| Offline | Zuletzt geladene Seiten aus dem Zwischenspeicher, siehe Offline-Verhalten |

## Offline-Verhalten

Wiki-Inhalte gelten laut Capability `data-and-storage` einen Tag als aktuell genug und werden bei fehlendem Netzzugriff aus dem Zwischenspeicher angezeigt, mit manueller Aktualisierungsmöglichkeit. Die eingebettete Webansicht ist bei fehlendem Netzzugriff nicht nutzbar.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| API-Token ungültig oder abgelaufen | Automatischer Rückfall auf Webansicht, Hinweis an technische Leitung protokollieren |
| Wiki-Seite mit für die App nicht darstellbaren Inhalten (z. B. eingebettete Dateien) | In der Webansicht statt in der nativen Anzeige öffnen |

## Nicht-funktionale Anforderungen

Keine über Capability `non-functional` hinausgehenden Anforderungen.

## Akzeptanzkriterien

- Nach erfolgreicher API-Verifikation zeigt die App mindestens die Kategorien Studium, Erstiheft und E-Key nativ an.
- Bei nicht verfügbarem API-Zugang ist das Wiki dennoch über die Webansicht nutzbar.

## Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet eine Wiki-Anbindung.

## Offene Fragen

- Wie wird technisch sichergestellt, dass als intern gekennzeichnete Bücher nicht an Studierende ausgeliefert werden — eigenes rechtebeschränktes BookStack-Konto oder serverseitige Positivliste? — `specs/decisions/0005-wiki-bookstack-anbindung.md`.
- Endgültige Festlegung auf Option (b) aus `specs/decisions/0005-wiki-bookstack-anbindung.md`, abhängig von der Klärung des Berechtigungsmodells.
