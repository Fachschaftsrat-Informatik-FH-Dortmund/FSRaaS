---
nummer: 0005
titel: Wiki-Anbindung an BookStack
status: vorgeschlagen
datum: 2026-08-24
betrifft:
  - ../../openspec/specs/wiki/spec.md
  - ../../openspec/specs/integrations/spec.md
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

**Ergänzung 2026-08-26 — Spike-Ergebnis.** Ein Live-Testabruf gegen `https://wiki.fsrfb4.de/api/` mit einem vom FSR bereitgestellten Token bestätigt den in `platform/integrations.md` INT-007 zuvor unverifizierten Kenntnisstand: Instanz erreichbar, Token-Authentifizierung funktioniert, Struktur Shelf › Book › Chapter › Page bestätigt, Inhalte als HTML abrufbar. Die Bedingung für die Empfehlung von Option (b) aus diesem ADR — „sofern der Spike einen tragfähigen API-Zugang bestätigt" — ist damit technisch erfüllt.

Nicht erfüllt ist sie vollständig: Der geprüfte Token liefert uneingeschränkt alle Bücher zurück, auch das als „nicht öffentlich" gekennzeichnete Buch „Intern". BookStack trennt an dieser Stelle nicht selbst zwischen öffentlich und FSR-intern — die Trennung müsste über ein eigenes, rechtebeschränktes Konto oder eine serverseitige Positivliste hergestellt werden. Solange das nicht geklärt ist, bleibt die endgültige Festlegung auf Option (b) offen; siehe „Offene Punkte".

## Offene Punkte

- ~~Ist die BookStack-Instanz von außen erreichbar?~~ Ja, bestätigt 2026-08-26 (`https://wiki.fsrfb4.de`).
- ~~Existieren Zugangstoken, oder lassen sie sich einrichten?~~ Ja, ein Token existiert (Stand 2026-08-26) — läuft testweise über ein persönliches Nutzerkonto, nicht über ein Dienstkonto.
- Welche Inhalte sind für Studierende freigegeben, welche bleiben FSR-intern? **Weiterhin offen und jetzt konkret**: mindestens das Buch „Intern" muss ausgeschlossen werden; eine API-seitige Trennung ist nicht erkennbar.
- Wie groß ist der Bestand, und wie oft ändert er sich? Bestand bekannt (2 Regale, 12 Bücher, 87 Seiten, Stand 2026-08-26); Änderungshäufigkeit weiterhin nicht systematisch erfasst.
- Welche Version der Wiki-Software läuft, und was kann deren Schnittstelle tatsächlich? Version aus der Antwort nicht direkt ablesbar; nur lesende Endpunkte (`GET`) wurden geprüft.
- Wer im FSR verantwortet den Betrieb der Instanz? Weiterhin offen.
- **Neu:** Soll für den produktiven Betrieb ein eigenes, rechtebeschränktes BookStack-Dienstkonto eingerichtet werden, statt dauerhaft über das jetzige, an ein persönliches Konto gebundene Test-Token zu laufen?
