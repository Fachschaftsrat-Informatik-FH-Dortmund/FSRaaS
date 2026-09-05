# Herkunfts-Durchsprache der Mensa-Capabilities

## Warum

Die Herkunftsmarkierung soll nach `CLAUDE.md` sichtbar machen, „welche Anforderung aus Code rückwärts erschlossen wurde und damit unsicher ist". Über die drei Mensa-Capabilities tragen 89 von 105 geltenden Anforderungen die Markierung `NEU` — ein Anteil, der die Markierung wertlos macht, wenn er nicht geprüft ist. Geprüft war er nicht: `tools/spec-check` liest das OpenSpec-Format nicht (siehe Aufgabe 5), sodass QA-N-090 seit ADR 0019 „OK" meldet, ohne eine einzige dieser 89 Anforderungen gesehen zu haben.

Die Durchsprache hat alle 89 gegen `specs/product/legacy-inventory.md` geprüft und dort, wo das Inventar schweigt, im Altcode nachgesehen.

## Was sich ändert

**Fünf Anforderungen bekommen einen Alt-Rückverweis.** Sie bleiben `NEU` — die Markierung misst, ob eine Anforderung vorwärts entschieden oder rückwärts aus Altcode erschlossen wurde, nicht ob es zufällig ein Vorbild gibt. Wo ein Vorbild existiert, wird es künftig als `vgl. <Inventar-ID>` im selben Satz genannt, damit die Information nicht verlorengeht:

| Anforderung | Rückverweis | Verhältnis zum Vorbild |
|---|---|---|
| Tageswechsel durch Wischen | `vgl. L-048` | gleiches Verhalten, engeres Zeitfenster |
| Untere Grenze der Tagesauswahl | `vgl. L-048` | Gegenteil: die Flutter-App erlaubte sieben Tage rückwärts |
| Geschlossen-Hinweis für Mensa ohne Angebot | `vgl. L-049` | Nachfolger des Leerzustands „Keine Daten vorhanden" |
| Keine Öffnungszeit für Mensa ohne Angebot | `vgl. AND-018` | Verfeinerung der Android-Öffnungszeiten |
| Gliederung nach Mensa-Auswahlreihenfolge | `vgl. L-046` | Nachfolger der Kachel je Mensa, jetzt als Abschnitt einer Liste |

**Die übrigen 84 bleiben unverändert `NEU`** — geprüft und bestätigt, nicht ungeprüft stehengelassen. Für `canteen-ratings` (12) und `canteen-photos` (21) belegt das die Abdeckungsübersicht des Inventars selbst (`RATE | 0 | 0`), ergänzt um eine Suche nach Kamera-, Bildwahl- und Upload-Code in beiden Alt-Apps, die leer ausging.

**Die Definition von `NEU` wird vereinheitlicht.** `legacy-inventory.md` Abschnitt 5 definiert `NEU` heute als „ohne Vorbild in beiden Alt-Apps" und widerspricht damit der Begründung in `CLAUDE.md`. Der Satz wird auf die Sicherheits-Lesart umgestellt; die Abdeckungsübersicht bleibt als Prüfmittel unberührt.

**Zuschreibungen an ein Gremium entfallen.** 17 Stellen in `canteen` und `canteen-ratings` führen Festlegungen als „Entscheidung FSR FB4", „auf Wunsch des FSR FB4", „auf Nachfrage" oder „Nutzerwunsch". Ein solches Rückfrageverfahren hat es nicht gegeben; die Festlegungen stammen vom einzigen Entwickler des Projekts, der zugleich FSR-Mitglied ist. Sie lauten künftig „Entschieden <Datum>." — das Datum trägt die Information, die ein Nachfolger braucht, ohne ein Verfahren zu behaupten.

**Das Glossar bekommt das tragende Vokabular.** „Aktive Mensa", „Maßgebliche Mensa", „Normalisierter Gerichtsschlüssel", „Bewertungsstufe" und „Höchstbewertung" sind heute nur in einer Erläuterungstabelle von `canteen/spec.md` definiert, obwohl `docs/agents/domain.md` dem Glossar bei Widerspruch den Vorrang gibt.

## Nicht Teil dieses Changes

- Die 43 gleichartigen Zuschreibungen in 14 weiteren Capabilities (eigenes Issue).
- Der Ausbau des Stern-Prototyps in `favorites.ts` (eigenes Issue, gebunden an die Einführung der Daumen-Bewertung).
- Die Begriffe „Gruppierung", „Gruppenreihenfolge", „Gerichte-Sortierung" und „Preset" im Glossar — sie ziehen mit ihrer Umsetzung nach.
