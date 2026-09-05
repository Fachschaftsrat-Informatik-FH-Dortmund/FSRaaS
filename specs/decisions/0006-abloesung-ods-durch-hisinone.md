---
nummer: 0006
titel: Ablösung des ODS-Verfahrens durch HISinOne
status: vorgeschlagen
datum: 2026-08-24
betrifft:
  - ../../openspec/specs/grades/spec.md
  - ../../openspec/specs/integrations/spec.md
---

# ADR 0006: Ablösung des ODS-Verfahrens durch HISinOne

## Kontext

Die Alt-App holte die Notenübersicht aus dem ODS-Portal. Das Verfahren ist vollständig in `platform/integrations.md`, Eintrag INT-006, dokumentiert und wird hier nicht wiederholt. Wesentlich zusammengefasst: formularbasiertes Login, Sitzungstoken aus einem Meta-Refresh-Tag, Auslesen der Noten aus einer HTML-Tabelle über feste Spaltenindizes, Zugangsdaten im Klartext gespeichert und bei Tokenablauf erneut gesendet, eine fest verdrahtete interne IP-Adresse im Login-Formular. Das ODS-Portal ist fachlich überholt; der Fachbereich nutzt inzwischen HISinOne.

## Entscheidung

Das ODS-Verfahren wird nicht übernommen. Die Notenübersicht wird, falls sie überhaupt umgesetzt wird, gegen HISinOne neu gebaut — ausschließlich über einen dafür vorgesehenen Zugang, nicht durch Auslesen von Webseiten.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| ODS-Scraping fortführen | gering (Code liegt vor) | kurzfristig lauffähig | hohes Bruchrisiko bei jeder Layoutänderung, sicherheitlich nicht vertretbar (Klartext-Zugangsdaten, siehe INT-006), fachlich überholtes System |
| HISinOne über einen offiziellen Zugang | unbekannt, abhängig vom Spike-Ergebnis | sichere, wartbare Anbindung an das aktuelle System | Verfügbarkeit eines solchen Zugangs ist unbekannt |
| HISinOne-Weboberfläche auslesen | vergleichbar mit ODS-Scraping | kurzfristig lauffähig, falls überhaupt technisch möglich | verlagert dasselbe Bruch- und Sicherheitsrisiko nur auf ein neues System |
| Notenübersicht weglassen, stattdessen Verweis auf die Weboberfläche der Hochschule | am geringsten | sofort umsetzbar, kein Sicherheitsrisiko | verliert eine bei Studierenden beliebte Funktion |

### Begründung: Verzicht als ernsthafte Option

Der Verzicht auf eine native Notenübersicht (vierte Zeile der Tabelle) wird hier bewusst nicht als Verlegenheitslösung behandelt, sondern als eigenständige, ernstzunehmende Option geführt. Solange kein offizieller HISinOne-Zugang für Drittanwendungen bestätigt ist, ist der Verweis auf die Weboberfläche der Hochschule der einzige Weg, der ohne zusätzliches Sicherheitsrisiko und ohne Abhängigkeit von einem ungeklärten Zugang sofort umsetzbar ist. Ob der spätere Mehraufwand einer nativen Anbindung gerechtfertigt ist, hängt vom tatsächlichen Nutzungswert dieser Funktion ab und ist Teil der offenen Punkte.

## Konsequenzen

`features/grades/spec.md` bleibt bis zum Ergebnis des in INT-006 vorgesehenen Spikes im Status `draft` und blockiert. Sicherheitlich ist der Verzicht auf jede Form von Passwort-Replay gegenüber dem ODS-Verfahren eine deutliche Verbesserung, unabhängig davon, welche der Optionen am Ende gewählt wird.

## Offene Punkte

- Gibt es für HISinOne einen Zugang für Drittanwendungen?
- Welche Anmeldeverfahren stehen dafür zur Verfügung (z. B. SSO, OAuth, dedizierte API)?
- Wer an der Hochschule entscheidet über die Vergabe eines solchen Zugangs?
- Ist die Notenübersicht, gemessen an ihrer tatsächlichen Nutzung, den Aufwand einer nativen Anbindung wert?
