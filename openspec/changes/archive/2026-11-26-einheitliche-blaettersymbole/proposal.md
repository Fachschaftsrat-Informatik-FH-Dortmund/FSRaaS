## Why

Mensaplan und Stundenplan bieten beide das Blättern zum vorigen bzw. nächsten
Zeitraum an — der Mensaplan tageweise, der Stundenplan wochenweise. Beide
zeichnen dafür eigene Pfeile: der Mensaplan die Dreiecke `◀`/`▶` in
Textfarbe, der Stundenplan die Winkel `‹`/`›` in Akzentfarbe (Issue #121).
Dieselbe Bedienung sieht damit je Bereich anders aus.

Das bestehende Requirement „Einheitliches Symbolsystem für wiederkehrende
fachliche Bedeutungen" greift hier nicht: Es regelt fachliche Bedeutungen wie
„vegetarisch", nicht Bedienelemente. Zudem sind beide Pfeilpaare
Schriftzeichen, nicht Symbole aus dem gewählten Symbolsystem (Ionicons).

## What Changes

- Ein Requirement kommt hinzu: Bedienelemente zum Blättern zwischen
  Zeiträumen zeigen in allen Bereichen dasselbe Symbolpaar aus dem
  Symbolsystem der App, in derselben Gestalt.
- Umsetzung über eine gemeinsame Komponente `BlaetterSymbol`
  (`app/src/ui/BlaetterSymbol.tsx`, Ionicons `chevron-back`/`chevron-forward`),
  die Mensaplan und Stundenplan-Wochenansicht verwenden. Bedienweg,
  Beschriftung für Bildschirmvorleser und Trefferfläche bleiben unverändert.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `ux-and-theming`: Requirement „Einheitliche Blätter-Symbole" kommt hinzu.
  Bestehende Requirements ändern sich nicht.
