## MODIFIED Requirements

### Requirement: Wiedereröffnungshinweis an der geschlossenen Mensa

Falls eine gewählte Mensa am angezeigten Tag kein Angebot führt, muss das System zusammen mit dem Geschlossen-Hinweis den nächsten Tag nennen, für den der Speiseplan-Zwischenspeicher dieser Mensa mindestens ein Gericht führt; gesucht wird ab dem Tag nach dem angezeigten Tag über den gesamten im Zwischenspeicher bekannten Zeithorizont dieser Mensa, ohne zusätzliche Tagesgrenze. Der Hinweis muss als Aussage über die Öffnung formuliert sein, nicht als Aussage über ein bestimmtes Gericht, weil ein künftiges Angebot bis zum jeweiligen Tag noch geändert werden kann. Führt kein Tag im bekannten Zeithorizont ein Angebot, entfällt der Zusatz und es bleibt beim Geschlossen-Hinweis. Herkunft: NEU, Datengrundlage von den gepflegten Öffnungszeiten auf den Speiseplan-Zwischenspeicher umgestellt 2026-09-07 (vormals: gepflegte Öffnungszeiten, höchstens sieben Tage vorausschauend, Change `canteen-mensa-kontext`).

#### Scenario: Geschlossene Mensa mit späterem Öffnungstag
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt und der Speiseplan-Zwischenspeicher für einen späteren, bereits bekannten Tag ein Angebot dieser Mensa führt
- **THEN** nennt das System zusätzlich zum Geschlossen-Hinweis den nächstgelegenen dieser Tage als Tag der Wiedereröffnung

#### Scenario: Keine Öffnungszeit in den folgenden sieben Tagen
- **WHEN** eine gewählte Mensa am angezeigten Tag kein Angebot führt und der Speiseplan-Zwischenspeicher für keinen späteren, bereits bekannten Tag ein Angebot dieser Mensa führt
- **THEN** zeigt das System allein den Geschlossen-Hinweis, ohne Angabe eines Wiedereröffnungstages

#### Scenario: Zwischenzeitlich veröffentlichter Speiseplan
- **WHEN** der Speiseplan-Zwischenspeicher zu einem zuvor ohne Angabe eines Wiedereröffnungstages angezeigten Zeithorizont nachträglich einen Tag mit Angebot dieser Mensa erhält
- **THEN** nennt das System bei der nächsten Anzeige diesen Tag als Wiedereröffnungstag, statt weiterhin ohne Angabe zu bleiben
