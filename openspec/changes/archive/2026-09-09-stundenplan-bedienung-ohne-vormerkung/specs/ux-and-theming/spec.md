## ADDED Requirements

### Requirement: Unterscheidung abgeleiteter Angaben von Quelldaten

Das System muss Angaben, die es selbst aus vorhandenen Daten geschlossen hat, in derselben Ansicht von den unverändert übernommenen Angaben eines Fremdsystems unterscheidbar darstellen. Die Unterscheidung muss ohne Farbwahrnehmung erkennbar sein — durch Anordnung, Auszeichnung, Symbol oder eine benannte Zuschreibung — und sie muss in jeder Ansicht, in der beide Arten nebeneinanderstehen, auf dieselbe Weise erfolgen. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Im Planungsmodus stehen Zeit, Raum, Bezeichnung, Gruppenmenge und lehrende Person — sämtlich aus INT-002 übernommen — in derselben Zeile und derselben Gestalt wie „noch nicht eingeplant", „bereits zugewiesen", „eigene Gruppe" und der Kollisionshinweis, die allesamt Schlussfolgerungen der App sind. Eine Nutzerin kann damit nicht erkennen, was der Fachbereich sagt und was die App meint; bei einer falschen Schlussfolgerung — etwa aus einer unsicheren Gruppenkennung — wendet sie sich an den Fachbereich statt an die App. Das bestehende Requirement „Kennzeichnung als unbestätigte Ableitung" der Capability `schedule` regelt denselben Gedanken für den Raumplan-Abgleich; diese Anforderung hebt ihn auf die gesamte Oberfläche.

#### Scenario: Abgeleitete und übernommene Angabe nebeneinander
- **WHEN** eine Ansicht eine aus vorhandenen Daten geschlossene Angabe neben einer unverändert übernommenen Angabe eines Fremdsystems zeigt
- **THEN** stellt das System beide unterscheidbar dar, und die Unterscheidung ist ohne Farbwahrnehmung erkennbar

#### Scenario: Dieselbe Unterscheidung in zwei Ansichten
- **WHEN** dieselbe Art abgeleiteter Angabe in zwei verschiedenen Ansichten erscheint
- **THEN** verwendet das System dafür dieselbe Form der Unterscheidung
