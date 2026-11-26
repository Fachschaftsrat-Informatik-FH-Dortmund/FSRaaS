## 1. Gemeinsame Komponente

- [x] 1.1 `app/src/ui/BlaetterSymbol.tsx` anlegen: Ionicons
      `chevron-back`/`chevron-forward`, einheitliche Größe und Farbe,
      abgeblendet bei `aus` — verifiziert durch
      `BlaetterSymbol.test.tsx`, describe „Einheitliche Blätter-Symbole".

## 2. Einbau

- [x] 2.1 `CanteenScreen.tsx`: die Glyphen `◀`/`▶` der Tagesauswahl durch
      `BlaetterSymbol` ersetzen.
- [x] 2.2 `ScheduleScreen.tsx`: in der Wochenansicht nur die Glyphen
      `‹`/`›` durch `BlaetterSymbol` ersetzen; Bedienweg und Beschriftung
      bleiben unverändert.
- [x] 2.3 Je Bereich ein Test im describe „Einheitliche Blätter-Symbole",
      der das gemeinsame Symbolpaar an beiden Blätter-Elementen nachweist.
