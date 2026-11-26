## Why

Die Freitextsuche der Einrichtung vergleicht den eingegebenen Text als
zusammenhängende Zeichenkette mit Klar- und Kurznamen. Wer „Bachelor
Technisch" eingibt, findet deshalb nichts, obwohl der Endpunkt
„Bachelor Informatik (StgPO 2019), VR Technische Inf." beide Wörter
enthält, nur nicht unmittelbar hintereinander (Issue #56). Studierende
nennen ihren Studiengang in eigenen Worten und eigener Reihenfolge; die
Suche muss das tragen.

## What Changes

- Der Suchtext wird an Leerraum in Wörter zerlegt. Ein Endpunkt passt, wenn
  **jedes** Wort in seinem Klarnamen oder Kurznamen vorkommt —
  unabhängig von Reihenfolge, Groß-/Kleinschreibung und diakritischen
  Zeichen, auch als Wortteil („Technisch" trifft „Technische").
- Ein einzelnes Wort verhält sich wie bisher; bestehende Szenarien bleiben
  gültig.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Das Requirement „Freitextsuche in der Endpunktauswahl" legt
  fest, wie ein Suchtext aus mehreren Wörtern ausgewertet wird.

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Einrichtung.

**Betroffener Code:** `app/src/areas/schedule/endpunkte.ts`
(`filtereEndpunktGruppen`) samt Test. Keine Oberflächen-, Vertrags- oder
Datenänderung; keine neuen Zeichenketten.
