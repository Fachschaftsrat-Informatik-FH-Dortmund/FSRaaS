---
nummer: 0007
titel: Datenquellen für Mensa und News
status: vorgeschlagen
datum: 2026-08-24
zuletzt_ergaenzt: 2026-08-26
betrifft:
  - features/canteen/spec.md
  - features/news/spec.md
  - platform/backend-and-api.md
  - platform/integrations.md
---

# ADR 0007: Datenquellen für Mensa und News

## Kontext

News (INT-003) und Speisepläne (INT-004) bezieht die Alt-App über `fb4app.hemacode.de` — private Infrastruktur, deren Trägerschaft und Fortbestand ungeklärt sind, ohne Zusage zur Verfügbarkeit. Der Mensa-Abruf erfolgt zusätzlich unverschlüsselt über `http://`. Der Speiseplan-Dienst ist selbst nur ein Vermittler auf OpenMensa, keine Primärquelle. Details zu beiden Schnittstellen stehen in `platform/integrations.md` (INT-003, INT-004) und werden hier nicht wiederholt. Zwei Kernfunktionen der App hängen damit an einem Dienst, den weder Fachbereich noch FSR kontrollieren.

## Entscheidung

Die Abhängigkeit von `hemacode.de` wird abgelöst. Beide Datenquellen laufen künftig über das eigene Backend (INT-008), das die jeweiligen Primärquellen anspricht, zwischenspeichert und TLS erzwingt.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| Weiter über `hemacode.de` | keiner | kein Umsetzungsaufwand | unkalkulierbares Ausfallrisiko, ungelöstes Verschlüsselungsproblem beim Mensa-Abruf |
| Direkt aus der App auf OpenMensa | mittel | löst die Vermittlerabhängigkeit für die Mensa | löst sie nicht für die News, kein gemeinsames Zwischenspeichern über beide Datenquellen |
| Über das eigene Backend (INT-008) | hoch, aber durch ADR 0003 ohnehin gesetzt | einheitliche Lösung für Mensa und News, TLS erzwungen, Zwischenspeicherung im eigenen Verantwortungsbereich | erfordert, dass das Backend gebaut und betrieben wird |
| Kontaktaufnahme mit dem Betreiber von `hemacode.de`, Weiterbetrieb unter geklärter Trägerschaft | gering, als Zwischenlösung | kurzfristig geringeres Risiko ohne eigene Backend-Arbeit | löst die grundsätzliche Fremdabhängigkeit nicht, nur vorübergehend tragfähig |

## Konsequenzen

Es ist eine Übergangsphase nötig, in der beide Wege (bisheriger Abruf über `hemacode.de` und neuer Abruf über das eigene Backend) funktionieren müssen, bis die Umstellung abgeschlossen ist. Der Fachbereich bzw. der FSR gewinnt dauerhaft Kontrolle über zwei Kernfunktionen der App, die zuvor von einer nicht selbst betriebenen Infrastruktur abhingen.

**Ergänzung 2026-08-26 — Mensa-Seite gelöst, News-Seite weiterhin offen.** Der Befund vom 2026-08-25 (siehe `platform/integrations.md`, INT-015) löst die Mensa-Hälfte dieser Entscheidung anders als hier ursprünglich angenommen: nicht über einen direkten OpenMensa-Zugriff oder eine Zwischenspeicherung der bisherigen Vermittler-Daten, sondern über eine zuvor unbekannte, offizielle Mensa-API des ITMC der TU Dortmund (INT-015) — TLS-gesichert, institutionell betrieben, mit Öffnungszeiten und zweisprachigen Bezeichnungen. INT-004 gilt damit als abgelöst. Die News-Seite (INT-003, weiterhin `hemacode.de`) ist von diesem Befund nicht betroffen und bleibt ungelöst; die Entscheidung dieses ADR (Ablösung über das eigene Backend) gilt dafür unverändert.

## Offene Punkte

- Wer betreibt `hemacode.de`, und ist diese Person oder Gruppe ansprechbar? Betrifft nach der Ergänzung vom 2026-08-26 nur noch die News-Seite (INT-003).
- Aus welcher Primärquelle stammen die News ursprünglich? Weiterhin unbekannt und zu ermitteln, bevor die Ablösung im Detail geplant werden kann.
- ~~Welche Mensen bietet OpenMensa unter welchen Kennungen an?~~ Gegenstandslos: Die Mensa-Seite nutzt seit dem Befund vom 2026-08-25 INT-015 (ITMC-API), nicht OpenMensa direkt.
- ~~Welche Nutzungsbedingungen gelten für einen direkten Zugriff auf OpenMensa?~~ Gegenstandslos, aus demselben Grund.
