## MODIFIED Requirements

### Requirement: Meldungsredaktion für FSR-News

Das System muss der Rolle FSR-Redaktion das Anlegen, Bearbeiten, Veröffentlichen und Zurückziehen von Meldungen der Klassifizierung „FSR-News" ermöglichen. Eine Meldung befindet sich dabei in genau einem der Zustände Entwurf, veröffentlicht oder zurückgezogen. Ein Entwurf erscheint nicht in der Meldungsliste der App. Die Bearbeitung einer veröffentlichten Meldung wird mit dem Speichern in der App sichtbar; ihr Veröffentlichungszeitpunkt bleibt dabei unverändert. Eine zurückgezogene Meldung kann erneut veröffentlicht werden und erhält dann den Zeitpunkt der erneuten Veröffentlichung. Titel und Text sind Pflichtangaben; eine Meldung mit leerem Titel oder leerem Text wird abgewiesen. Herkunft: NEU (vormals ADMIN-F-040); Zustände, Bearbeiten nach Veröffentlichung, erneutes Veröffentlichen und Pflichtangaben festgelegt mit dem Change `news-redaktion`, 2026-11-26. Ein Tippfehler in einer veröffentlichten Meldung soll sich beheben lassen, ohne die Meldung zurückzuziehen und neu anzulegen; ein unveränderter Zeitpunkt verhindert, dass eine korrigierte Meldung wie eine neue nach oben springt.

#### Scenario: Meldung anlegen und veröffentlichen
- **WHEN** ein Konto mit Rolle FSR-Redaktion eine neue Meldung anlegt und veröffentlicht
- **THEN** erscheint die Meldung als FSR-News in der Meldungsliste der App

#### Scenario: Entwurf bleibt unsichtbar
- **WHEN** ein Konto mit Rolle FSR-Redaktion eine Meldung anlegt, aber nicht veröffentlicht
- **THEN** erscheint sie nicht in der Meldungsliste der App

#### Scenario: Veröffentlichte Meldung korrigieren
- **WHEN** ein Konto mit Rolle FSR-Redaktion den Text einer veröffentlichten Meldung ändert und speichert
- **THEN** zeigt die Meldungsliste der App den geänderten Text mit unverändertem Veröffentlichungszeitpunkt

#### Scenario: Leerer Titel
- **WHEN** eine Meldung mit leerem Titel gespeichert werden soll
- **THEN** weist das System den Vorgang mit einem Hinweis auf die fehlende Pflichtangabe ab

### Requirement: Entfernen zurückgezogener Meldungen aus der Liste

Wenn eine Meldung zurückgezogen wird, muss das System sie aus der Meldungsliste der App entfernen und angepinnte Verweise darauf als zurückgezogen kennzeichnen. Ein als zurückgezogen gekennzeichneter Verweis zeigt nur noch den Titel, nicht mehr den Text der Meldung, und lässt sich weiterhin ablösen. Herkunft: NEU (vormals ADMIN-F-050); Anzeige des gekennzeichneten Verweises festgelegt mit dem Change `news-redaktion`, 2026-11-26. Eine Meldung wird zurückgezogen, weil ihr Inhalt nicht mehr gelten soll; der Titel genügt, um den Verweis wiederzuerkennen.

#### Scenario: Angepinnte Meldung wird zurückgezogen
- **WHEN** eine angepinnte Meldung zurückgezogen wird
- **THEN** entfernt das System sie aus der Meldungsliste und kennzeichnet den angepinnten Verweis als zurückgezogen statt ihn kommentarlos verschwinden zu lassen

#### Scenario: Gekennzeichneten Verweis ablösen
- **WHEN** die Nutzerin einen als zurückgezogen gekennzeichneten angepinnten Verweis ablöst
- **THEN** verschwindet der Verweis aus der Liste

### Requirement: Vorschau vor Veröffentlichung

Das System muss vor dem Veröffentlichen einer Meldung und vor dem Übernehmen von Änderungen an einer bereits veröffentlichten Meldung eine Vorschau in der Darstellung der App anbieten; ausgelöst wird beides nur aus dieser Vorschau heraus. Die Vorschau zeigt die Meldung so, wie sie in der Meldungsliste und in der Detailansicht der App erscheinen wird. Herkunft: NEU (vormals ADMIN-F-060); auf Änderungen an veröffentlichten Meldungen ausgedehnt mit dem Change `news-redaktion`, 2026-11-26, weil eine solche Änderung ebenso unmittelbar in der App sichtbar wird wie eine Erstveröffentlichung.

#### Scenario: Vorschau vor dem Veröffentlichen
- **WHEN** eine Redaktionsperson eine Meldung fertig verfasst hat und veröffentlichen will
- **THEN** zeigt das System zunächst eine Vorschau in der App-Darstellung, bevor die Veröffentlichung ausgelöst wird

#### Scenario: Vorschau vor dem Übernehmen einer Korrektur
- **WHEN** eine Redaktionsperson eine bereits veröffentlichte Meldung geändert hat und die Änderung übernehmen will
- **THEN** zeigt das System zunächst eine Vorschau in der App-Darstellung, bevor die Änderung in der App sichtbar wird

## ADDED Requirements

### Requirement: Ablehnung bei gleichzeitiger Änderung einer Meldung

Wenn eine Meldung gespeichert oder veröffentlicht werden soll, während sie seit dem Laden durch die bearbeitende Person von einer anderen Person geändert wurde, muss das System den Vorgang ablehnen, darauf hinweisen und den neueren Stand zur erneuten Bearbeitung anbieten; die eigene, nicht gespeicherte Eingabe bleibt dabei erhalten, bis die Person den neueren Stand übernimmt. Herkunft: NEU, aus dem Fehlerfall „Zwei Personen bearbeiten denselben Meldungsentwurf gleichzeitig" dieser Capability zum Requirement erhoben mit dem Change `news-redaktion`, 2026-11-26. Dieselbe zweistufige Prüfung wie bei Stammdaten-Listen (Requirement „Ablehnung bei gleichzeitiger Änderung einer Stammdaten-Liste"). Dass auch das Veröffentlichen geprüft wird, verhindert, dass eine Person einen Stand veröffentlicht, den sie in der Vorschau nie gesehen hat.

#### Scenario: Zweiter Speichervorgang
- **WHEN** zwei Personen dieselbe Meldung geladen haben und die zweite nach der ersten speichert
- **THEN** lehnt das System den zweiten Speichervorgang ab und bietet den neueren Stand an, ohne die Eingabe der zweiten Person zu verwerfen

#### Scenario: Veröffentlichen eines überholten Stands
- **WHEN** eine Person eine Meldung veröffentlichen will, die seit dem Öffnen ihrer Vorschau von einer anderen Person geändert wurde
- **THEN** lehnt das System die Veröffentlichung ab und bietet den neueren Stand an
