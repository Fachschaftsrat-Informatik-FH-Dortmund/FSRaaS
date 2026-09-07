## MODIFIED Requirements

### Requirement: Konflikthinweis bei festen Terminen

Wenn sich zwei Termine des persönlichen Plans mit dem Status „fest" zeitlich überschneiden, muss das System beide Termine mit einem sichtbaren Konflikthinweis darstellen, unabhängig davon, ob sie offiziell oder eigen sind. Hat die Nutzerin die Überschneidung nach der Anforderung zur bewussten Übernahme trotz Konflikt angenommen, darf das System keinen wiederkehrenden Konflikthinweis mehr erzeugen; das Terminpaar trägt dann allein die Kennzeichnung „angenommener Konflikt". Die Annahme gilt ausschließlich für dieses Paar: Überschneidet sich einer der beiden Termine mit einem dritten, für den keine Annahme vorliegt, muss das System dafür einen Konflikthinweis erzeugen. Herkunft: NEU, entschieden 2026-09-07; vormals SCHED-F-230. Ohne die Bindung an das Paar entstünde die umgekehrte Fehlerart zur Dauerwarnung: Wird ein angenommener Gegenpart entfernt und ein anderer Termin tritt an dieselbe Stelle, bliebe die neue, nie angenommene Kollision stumm — ein stillschweigend verschluckter Befund, den die Capability `security-and-privacy` untersagt.

#### Scenario: Zwei feste Termine überschneiden sich
- **WHEN** zwei Termine mit Status „fest" zeitlich überschneidend sind
- **THEN** stellt das System beide mit einem sichtbaren Konflikthinweis dar

#### Scenario: Konflikt wurde bewusst angenommen
- **WHEN** die Nutzerin die Überschneidung zweier fester Termine bewusst angenommen hat
- **THEN** zeigt das System keinen Konflikthinweis mehr, sondern allein die Kennzeichnung „angenommener Konflikt"

#### Scenario: Angenommener Gegenpart wird durch einen anderen Termin ersetzt
- **WHEN** die Nutzerin eine Überschneidung zweier fester Termine angenommen hat, einen der beiden Termine entfernt und einen anderen festen Termin anlegt, der sich mit dem verbliebenen überschneidet
- **THEN** stellt das System für dieses neue Paar wieder einen sichtbaren Konflikthinweis dar

#### Scenario: Dritter Termin überschneidet sich zusätzlich
- **WHEN** ein fester Termin eine angenommene Überschneidung mit einem zweiten und zusätzlich eine nicht angenommene mit einem dritten festen Termin hat
- **THEN** zeigt das System für das angenommene Paar allein die Kennzeichnung „angenommener Konflikt" und für das dritte Paar einen Konflikthinweis

### Requirement: Bewusste Übernahme trotz Konflikt

Das System muss der Nutzerin ermöglichen, trotz einer erkannten Kollision einen Termin bewusst in den Plan zu übernehmen; das Paar aus dem übernommenen Termin und dem Termin, mit dem er kollidiert, muss dauerhaft als „angenommener Konflikt" gekennzeichnet bleiben. Kollidiert der übernommene Termin mit mehreren Terminen, muss das System die Annahme für jedes betroffene Paar einzeln festhalten. Herkunft: NEU, entschieden 2026-09-07; vormals SCHED-F-310. Die Kennzeichnung am einzelnen Termin statt am Paar wäre nicht rekonstruierbar: Ein Termin kann gleichzeitig eine angenommene und eine offene Kollision haben.

#### Scenario: Konflikt bewusst akzeptieren
- **WHEN** die Nutzerin trotz erkannter Kollision einen Termin übernimmt
- **THEN** kennzeichnet das System das Paar aus beiden Terminen dauerhaft als „angenommenen Konflikt"

#### Scenario: Übernahme bei mehreren Kollisionen
- **WHEN** die Nutzerin einen Termin übernimmt, der mit zwei bereits vorhandenen festen Terminen kollidiert
- **THEN** hält das System die Annahme für beide Paare einzeln fest

### Requirement: Sprung zum aktuellen Wochentag

Wenn die Einstellung „beim Öffnen zum aktuellen Wochentag springen" aktiv ist, dann muss das System beim Öffnen des Stundenplans den aktuellen Wochentag anzeigen. Ist die Einstellung abgeschaltet, muss das System stattdessen die zuletzt betrachtete Woche und deren zuletzt betrachteten Wochentag anzeigen. Liegt kein zuletzt betrachteter Stand vor, zeigt es die laufende Woche und den aktuellen Wochentag. Herkunft: NEU, entschieden 2026-09-07; vormals SCHED-F-150. Die vorige Fassung beschrieb allein den aktiven Fall und ließ offen, was der abgeschaltete Schalter bewirkt — damit hatte die Einstellung keine beschriebene Wirkung. Wer sie abschaltet, will an der Stelle weiterarbeiten, an der er aufgehört hat; sonst wäre der Schalter überflüssig.

#### Scenario: Öffnen mit aktivierter Einstellung
- **WHEN** die Einstellung aktiv ist und die Nutzerin den Stundenplan öffnet
- **THEN** zeigt das System den aktuellen Wochentag

#### Scenario: Öffnen mit abgeschalteter Einstellung
- **WHEN** die Einstellung abgeschaltet ist und die Nutzerin den Stundenplan öffnet, nachdem sie zuvor eine andere Woche und einen anderen Wochentag betrachtet hat
- **THEN** zeigt das System diese Woche und diesen Wochentag erneut

#### Scenario: Abgeschaltete Einstellung ohne vorherigen Stand
- **WHEN** die Einstellung abgeschaltet ist und noch kein zuletzt betrachteter Stand vorliegt
- **THEN** zeigt das System die laufende Woche und den aktuellen Wochentag
