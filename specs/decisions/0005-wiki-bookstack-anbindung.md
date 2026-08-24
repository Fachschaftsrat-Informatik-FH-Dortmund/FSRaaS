---
nummer: 0005
titel: Wiki-Anbindung an BookStack
status: vorgeschlagen
datum: 2026-08-24
betrifft:
  - features/wiki/spec.md
  - platform/integrations.md
---

# ADR 0005: Wiki-Anbindung an BookStack

## Kontext

Der FSR pflegt sein Wissen (u. a. Prüfungsordnungen, Leitfäden, FAQ) in einer selbst betriebenen BookStack-Instanz. Die App soll dieses Wissen für Studierende zugänglich machen. Ob und wie die Instanz von außen erreichbar ist, ist noch nicht geprüft — der im Schnittstellenregister unter INT-007 festgehaltene Kenntnisstand zur BookStack-API ist ausdrücklich **unbestätigt** und wird hier nur mit dieser Einschränkung übernommen, nicht als gesicherte Tatsache.

## Entscheidung

Diese Entscheidung wird **vorläufig** getroffen und ausdrücklich vom Ergebnis des in INT-007 vorgesehenen Spikes abhängig gemacht: Empfohlen wird Option (c), die lesende Darstellung in der App über die BookStack-Schnittstelle (Option b in der folgenden Tabelle), sofern der Spike einen tragfähigen API-Zugang bestätigt. Bestätigt der Spike keinen tragfähigen Zugang, verschiebt sich die Empfehlung auf Option (a). Eine endgültige Festlegung erfolgt erst nach dem Spike, ggf. als Aktualisierung dieses ADR.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| (a) Verlinkung oder eingebettete Webansicht auf die bestehende Instanz | gering | schnell umsetzbar, kein Bruch im Redaktionsprozess des FSR | schwache Einbindung, Gestaltung nicht steuerbar, Anmeldung in der Webansicht ungeklärt, keine Offline-Nutzung, auf kleinen Bildschirmen oft unbrauchbar |
| (b) Lesende Darstellung in der App über die BookStack-Schnittstelle | mittel bis hoch | eigene Navigation (Regal › Buch › Kapitel › Seite), eigene Suche, Zwischenspeicher für Offline-Nutzung | Zugangstoken nötig, Rechtekonzept zu klären, Darstellung von Wiki-Inhalten muss nachgebaut werden, laufender Abgleich bei Änderungen der Wiki-Software |
| (c) Periodische Spiegelung in das eigene Backend | hoch | beste Ladezeiten und Offline-Eigenschaften, Redaktion bleibt unverändert in BookStack, Backend kann Inhalte aufbereiten und durchsuchbar machen | Abgleichlogik, Aktualitätsverzug, doppelte Datenhaltung, Rechteabbildung |

### Begründung der Empfehlung

Option (b) verbindet den größten Nutzenzuwachs (native Navigation, Suche, Offline-Fähigkeit) mit einem Aufwand, der ohne bestätigten API-Zugang nicht zu rechtfertigen ist — deshalb die Bedingung. Option (c) wäre der nächste Schritt, wenn sich zeigt, dass Ladezeiten oder Offline-Verhalten von (b) nicht ausreichen, bringt aber zusätzliche Abgleich- und Rechteprobleme mit sich, die ohne konkreten Bedarf nicht vorweggenommen werden sollen. Option (a) bleibt die Rückfalloption, falls der Spike keinen tragfähigen API-Zugang bestätigt.

## Konsequenzen

`features/wiki/spec.md` bleibt bis zum Ergebnis des Spikes im Status `draft`. Der Registereintrag INT-007 wird nach dem Spike aktualisiert und die als unverifiziert markierten Angaben werden entweder bestätigt oder korrigiert. Diese Entscheidung wird nach dem Spike überprüft und ggf. angepasst.

## Offene Punkte

- Ist die BookStack-Instanz von außen erreichbar?
- Existieren Zugangstoken, oder lassen sie sich einrichten?
- Welche Inhalte sind für Studierende freigegeben, welche bleiben FSR-intern?
- Wie groß ist der Bestand, und wie oft ändert er sich?
- Welche Version der Wiki-Software läuft, und was kann deren Schnittstelle tatsächlich?
- Wer im FSR verantwortet den Betrieb der Instanz?
