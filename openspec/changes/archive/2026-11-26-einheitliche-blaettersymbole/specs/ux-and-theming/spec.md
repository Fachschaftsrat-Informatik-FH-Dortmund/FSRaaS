## ADDED Requirements

### Requirement: Einheitliche Blätter-Symbole

Wo das System ein Bedienelement zum Blättern zum vorigen oder nächsten Zeitraum anbietet — etwa zum vorigen oder nächsten Tag im Mensaplan oder zur vorigen oder nächsten Woche im Stundenplan —, muss es dafür in allen Bereichen dasselbe Symbolpaar aus dem Symbolsystem der App in derselben Gestalt verwenden. Ein nicht auslösbares Blätter-Element muss dabei erkennbar abgeblendet sein. Herkunft: Recherche: Issue #121, 2026-11-26. Der Mensaplan zeigte Dreiecke in Textfarbe, der Stundenplan Winkel in Akzentfarbe; beide waren Schriftzeichen statt Symbole des Symbolsystems.

#### Scenario: Blättern in zwei Bereichen
- **WHEN** die Nutzerin im Mensaplan zwischen Tagen und im Stundenplan zwischen Wochen blättern kann
- **THEN** zeigen beide Bedienelemente dasselbe Symbolpaar in derselben Gestalt

#### Scenario: Blättern nicht möglich
- **WHEN** ein Blätter-Element nicht auslösbar ist, etwa das Zurückblättern vor den aktuellen Tag im Mensaplan
- **THEN** zeigt das System dasselbe Symbol abgeblendet
