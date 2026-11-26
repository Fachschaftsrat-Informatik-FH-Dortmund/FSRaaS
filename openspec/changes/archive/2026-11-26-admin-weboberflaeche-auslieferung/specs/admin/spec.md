## ADDED Requirements

### Requirement: Auslieferung der Weboberfläche unter /admin

Das System muss den Web-Export der Verwaltungsoberfläche unter dem Pfad `/admin` so ausliefern, dass jede vorhandene Datei des Exports mit dem zu ihrer Endung gehörenden Inhaltstyp ausgeliefert wird, jeder Seitenpfad ohne Dateiendung die Einstiegsseite `index.html` erhält und eine nicht vorhandene Datei mit `404` beantwortet wird statt mit der Einstiegsseite. Herkunft: Recherche: Issue #73, Browserbefund an `https://api.fb4.it/admin`, 2026-11-26. Hintergrund: Bis 2026-11-26 erhielt auch das Skriptbündel die Einstiegsseite als `text/html`; der Browser verweigerte die Ausführung, und die Oberfläche blieb weiß. Eine fehlende Datei als `404` zu melden statt als Einstiegsseite macht einen unvollständigen Export im Netzwerkprotokoll sofort sichtbar (Capability `security-and-privacy`, „keine stillen Fehler"). Die Auslieferung selbst ist in ADR 0018 entschieden.

#### Scenario: Skriptbündel des Exports
- **WHEN** der Browser `/admin/_expo/static/js/web/entry-<hash>.js` anfragt und die Datei im Export liegt
- **THEN** liefert das System die Datei mit dem Inhaltstyp `text/javascript` aus

#### Scenario: Einstiegsseite
- **WHEN** der Browser `/admin/` anfragt
- **THEN** liefert das System `index.html` mit dem Inhaltstyp `text/html` aus

#### Scenario: Direktaufruf einer Unterseite
- **WHEN** der Browser einen Seitenpfad ohne Dateiendung unter `/admin/` anfragt, etwa nach einem Neuladen auf einer Unterseite
- **THEN** liefert das System `index.html` aus, damit die Oberfläche die Unterseite selbst auflöst

#### Scenario: Fehlende Datei
- **WHEN** der Browser eine Datei mit Endung unter `/admin/` anfragt, die im Export nicht liegt
- **THEN** antwortet das System mit `404` und nicht mit der Einstiegsseite
