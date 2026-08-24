<!--
Kopiervorlage für eine Feature-Spec. Siehe specs/README.md für Lebenszyklus, ID-Schema,
EARS-Muster und Herkunftsmarkierung. Diesen Kommentarblock beim Anlegen der Spec entfernen.
-->
---
id: <kebab-case, entspricht dem Ordnernamen>
titel: <Klarname deutsch>
praefix: <PREFIX>
status: draft            # draft | accepted | implemented | deprecated
prioritaet: kern         # kern | bestand | ausbau
version: 0.1.0
owner: FSR FB4
last_reviewed: JJJJ-MM-TT
derived_from: []         # Pfade im Alt-Code; leer bei Neuentwicklung
implemented_in: []       # Quellverzeichnisse; wird bei Umsetzung gefüllt
related: []              # relative Pfade zu anderen Specs
---

# <Klarname des Features>

## 1. Zweck & Nutzen

<!--
Ein bis drei Absätze: Welches Problem der Nutzerinnen und Nutzer löst dieses Feature?
Warum existiert es? Kein Anforderungstext, keine technischen Details — reine Motivation.
-->

## 2. Scope / Nicht-Scope

<!--
Zwei Listen. "Scope": Was dieses Feature abdeckt. "Nicht-Scope": Was bewusst außerhalb
liegt, mit kurzer Begründung oder Verweis auf die Spec, die es stattdessen abdeckt.
Hilft, Abgrenzungsdiskussionen einmalig zu klären statt bei jeder Anforderung neu.
-->

### Scope

-

### Nicht-Scope

-

## 3. Nutzergeschichten

<!--
Kurzform "Als <Rolle> möchte ich <Ziel>, damit <Nutzen>." Eine Nutzergeschichte kann von
mehreren Anforderungen in Abschnitt 4 konkretisiert werden. Keine ID nötig, dient der
Verständlichkeit, nicht der Prüfbarkeit.
-->

-

## 4. Funktionale Anforderungen

<!--
Tabellenform ist Pflicht (siehe specs/README.md Abschnitt 9). Je Anforderung eine Zeile:
eigene ID (<PREFIX>-F-###, Zehnerschritte ab 010), ein EARS-Muster, genau eine Aussage,
Herkunftsmarkierung ohne eckige Klammern in der Spalte "Herkunft".
Braucht eine Anforderung mehr als zwei Sätze Begründung, folgt darunter ein kurzer
Abschnitt "### Erläuterungen" mit der ID als Bezug.
-->

| ID | Anforderung | Herkunft |
|---|---|---|
| `<PREFIX>-F-010` | <EARS-Satz> | <Alt: pfad:zeile \| NEU \| Android: unbekannt \| Alt: bewusst verworfen> |
| `<PREFIX>-F-020` | <EARS-Satz> | <Herkunft> |

<!-- Nur bei Bedarf:
### Erläuterungen

**`<PREFIX>-F-010`** — <Begründung, Sonderfälle, Beispieldaten>
-->

## 5. Datenmodell

<!--
Entitäten, Felder, Typen, Beziehungen, die dieses Feature benötigt. Nur, was zu diesem
Feature gehört — geteilte Datenmodelle gehören nach platform/data-and-storage.md (DATA)
und werden hier per Verweis referenziert.
-->

## 6. Externe Schnittstellen

<!--
Nur Verweise auf INT-### aus platform/integrations.md, z. B. "Nutzt INT-002 (FBWS Termine)".
Keine Endpunktdetails, keine Wiederholung von Feldern oder URLs — die stehen ausschließlich
im Schnittstellenregister. Bei neuem Schnittstellenbedarf: dort zuerst einen Eintrag anlegen.
-->

## 7. UI-Flows & Zustände

<!--
Für jeden relevanten Bildschirm/Flow: Lade-Zustand, Leer-Zustand, Fehler-Zustand und
Offline-Zustand ausdrücklich benennen, auch wenn die Antwort "wie Ladezustand" oder
"nicht anwendbar, weil <Grund>" lautet. Kein Zustand darf stillschweigend fehlen.
-->

## 8. Offline-Verhalten

<!--
Was ist ohne Netzwerkverbindung nutzbar, was nicht? Welche Daten werden lokal vorgehalten,
wie lange gelten sie als aktuell genug? Falls das Feature zwingend online ist: explizit so
begründen, nicht einfach auslassen.
-->

## 9. Fehlerfälle

<!--
Über die UI-Fehlerzustände aus Abschnitt 7 hinaus: fachliche Fehlerfälle (ungültige
Eingabe, Konflikt, Berechtigung fehlt, Datenquelle liefert unerwartetes Format) und die
geforderte Systemreaktion je Fall.
-->

## 10. Nicht-funktionale Anforderungen

<!--
Nur was speziell für dieses Feature gilt. Querschnittliches steht in platform/non-functional.md
und wird hier nur referenziert. Tabellenform wie in Abschnitt 4.
-->

| ID | Anforderung | Herkunft |
|---|---|---|
| `<PREFIX>-N-010` | <EARS-Satz> | <Herkunft> |

## 11. Akzeptanzkriterien

<!--
Prüfbare Kriterien, bei deren Erfüllung die Spec als für den aktuellen Stand umgesetzt
gilt. Können Anforderungen aus Abschnitt 4 bündeln oder zusätzliche End-to-End-Szenarien
beschreiben.
-->

## 12. Bewusst nicht übernommenes Altverhalten

<!--
Auflistung von Verhalten der Alt-App(s), das absichtlich nicht übernommen wird, mit
Begründung. Jeder Eintrag korrespondiert in der Regel mit einer Anforderung, die mit
[Alt: bewusst verworfen] markiert ist, oder erklärt, warum es dazu keine Anforderung gibt.
-->

## 13. Offene Fragen

<!--
Ungeklärte Punkte, die die Umsetzung dieses Features betreffen. Projektweite offene Fragen
gehören stattdessen nach specs/open-questions.md. Format: Frage, warum sie relevant ist,
wer sie klären muss.
-->

-
