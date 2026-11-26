## ADDED Requirements

### Requirement: Zeitachse im Planungsmodus

Das System muss im Planungsmodus eine umschaltbare Darstellung anbieten, die die Termine des gewählten Wochentags auf einer zur Uhrzeit proportionalen Achse zeigt: Sich zeitlich überschneidende Termine stehen nebeneinander, aufeinanderfolgende untereinander. Kein Termin darf dabei verborgen werden; reicht die Breite des Bildschirms für alle nebeneinanderstehenden Termine nicht aus, muss sich die Achse seitlich verschieben lassen, statt Termine zu überdecken oder unlesbar schmal zu stauchen. Jeder Termin muss in der Zeitachse wie in der Liste wählbar sein, seine Kennzeichnungen „gewählt" und „kollidiert" tragen und für Hilfstechnologien angeben, mit wie vielen anderen Terminen des Tages er sich überschneidet. Die gewählte Darstellung muss über das Verlassen des Planungsmodus hinaus erhalten bleiben. Herkunft: Recherche: Issue #67, 2026-11-26. In der Liste stehen gleichzeitige und aufeinanderfolgende Termine gleich untereinander; ob zwei Gruppen-Slots sich ausschließen oder hintereinander belegbar sind, ist nur über den Vergleich der Uhrzeiten zu erkennen. Die Liste bleibt als Darstellung bestehen, weil sie je Termin mehr Angaben zeigt und das Anpinnen trägt.

#### Scenario: Auf die Zeitachse umschalten
- **WHEN** die Nutzerin im Planungsmodus auf die Zeitachse umschaltet
- **THEN** zeigt das System die Termine des gewählten Wochentags auf einer zur Uhrzeit proportionalen Achse

#### Scenario: Parallele Termine
- **WHEN** sich zwei Termine des gewählten Wochentags zeitlich überschneiden
- **THEN** stehen sie in der Zeitachse nebeneinander, und jeder gibt für Hilfstechnologien an, dass er sich mit einem anderen Termin überschneidet

#### Scenario: Aufeinanderfolgende Termine
- **WHEN** ein Termin beginnt, nachdem ein anderer desselben Tages geendet hat
- **THEN** steht er in der Zeitachse unter diesem, nicht daneben

#### Scenario: Wahl in der Zeitachse
- **WHEN** die Nutzerin in der Zeitachse einen Termin antippt
- **THEN** wählt oder abwählt das System ihn wie in der Liste, und die Wahl gilt in beiden Darstellungen

#### Scenario: Viele parallele Termine
- **WHEN** mehr Termine gleichzeitig stattfinden, als nebeneinander auf die Bildschirmbreite passen
- **THEN** lässt sich die Achse seitlich verschieben, und jeder Termin bleibt einzeln erkenn- und wählbar

#### Scenario: Darstellung bleibt erhalten
- **WHEN** die Nutzerin auf die Zeitachse umgeschaltet hat und den Planungsmodus später erneut öffnet
- **THEN** zeigt das System wieder die Zeitachse
