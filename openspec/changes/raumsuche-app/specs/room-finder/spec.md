## MODIFIED Requirements

### Requirement: Belegung eines gewählten Raums anzeigen

Das System muss der Nutzerin die Anzeige der Belegung eines per Kennung gewählten Raums für den aktuellen Tag ermöglichen. Wählbar ist jeder Raum, den der Raumplan-Zwischenspeicher führt, auch einer außerhalb der kuratierten Raumliste. Ist die Kennung weder im Raumplan noch in der kuratierten Liste bekannt, muss das System den Hinweis „Raum unbekannt" zeigen statt einer Fehlermeldung wie bei einem technischen Ausfall. Herkunft: Android: unbekannt (vormals RAUM-F-010); um nicht kuratierte Räume und den unbekannten Raum ergänzt mit dem Change `raumsuche-app`, 2026-11-26, weil Übersicht und laufende Veranstaltungen nach dem Requirement „Tagesbelegung aus Übersicht oder laufenden Veranstaltungen öffnen" auch nicht kuratierte Räume öffnen.

#### Scenario: Raum per Kennung wählen
- **WHEN** die Nutzerin die Kennung eines Raums eingibt
- **THEN** zeigt das System dessen Belegung für den aktuellen Tag an

#### Scenario: Nicht kuratierter Raum
- **WHEN** die Nutzerin die Kennung eines Raums wählt, der im Raumplan geführt wird, aber nicht auf der kuratierten Liste steht
- **THEN** zeigt das System dessen Belegung für den aktuellen Tag an

#### Scenario: Unbekannte Raumkennung
- **WHEN** die Nutzerin eine Kennung eingibt, die weder der Raumplan noch die kuratierte Liste führt
- **THEN** zeigt das System den Hinweis „Raum unbekannt" und keine Fehlermeldung eines technischen Ausfalls

### Requirement: Suche nach freien Räumen

Das System muss der Nutzerin die Suche nach zu einem gewählten Zeitraum freien Räumen ermöglichen. Ein Raum gilt für den Zeitraum als frei, wenn zu dessen Beginn kein Termin in ihm läuft, vor dessen Ende kein Termin in ihm beginnt und das Ende nicht nach seiner gepflegten Gebäudeschließzeit liegt. Ein kuratierter Raum, zu dem der Raumplan-Zwischenspeicher keinerlei Angabe führt, darf nicht als frei ausgewiesen werden. Herkunft: Recherche: alte apps/android-fb4, service/RoomService.java, 2026-08-25 (vormals RAUM-F-020); Bedeutung von „frei im Zeitraum" und Umgang mit Räumen ohne Raumplan-Eintrag festgelegt mit dem Change `raumsuche-app`, 2026-11-26. Ohne Angabe ist der Zustand unbekannt, und „unbekannt" als „frei" auszugeben führt die Nutzerin im ungünstigsten Fall vor eine besetzte Tür.

#### Scenario: Zeitraum ohne belegte Räume
- **WHEN** für einen gewählten Zeitraum keine belegten Räume vorliegen
- **THEN** liefert die Suche eine nachvollziehbare Leermeldung statt eines Fehlers

#### Scenario: Termin beginnt innerhalb des Zeitraums
- **WHEN** ein Raum zu Beginn des gewählten Zeitraums frei ist, aber vor dessen Ende ein Termin in ihm beginnt
- **THEN** weist die Suche ihn für diesen Zeitraum nicht als frei aus

#### Scenario: Kein freier Raum im Zeitraum
- **WHEN** im gewählten Zeitraum kein Raum der kuratierten Liste frei ist
- **THEN** zeigt das System den Hinweis „keine freien Räume gefunden" und bietet an, ein späteres Zeitfenster zu suchen

#### Scenario: Kuratierter Raum ohne Raumplan-Eintrag
- **WHEN** ein Raum auf der kuratierten Liste steht, der Raumplan-Zwischenspeicher ihn aber nicht führt
- **THEN** weist die Suche ihn nicht als frei aus

### Requirement: Gepflegte Gebäudeschließzeit statt fester Wert

Falls für einen freien Raum kein nachfolgender Termin vorliegt, muss das System als Endzeitpunkt die gepflegte Gebäudeschließzeit verwenden, nicht einen fest im Quellcode hinterlegten Wert. Ist für den Raum keine Schließzeit gepflegt, muss das System angeben, dass kein weiterer Termin bekannt ist, statt einen Endzeitpunkt anzunehmen. Herkunft: Alt: bewusst verworfen (vormals RAUM-F-130); Fall ohne gepflegte Schließzeit ergänzt mit dem Change `raumsuche-app`, 2026-11-26. Die Android-Alt-App setzt pauschal 21:30 Uhr fest im Quellcode an; ein solcher Wert veraltet unbemerkt und ist nur per App-Update korrigierbar. Ein Ersatzwert in der App wäre derselbe Fehler unter anderem Namen.

#### Scenario: Kein nachfolgender Termin
- **WHEN** für einen freien Raum kein nachfolgender Termin vorliegt
- **THEN** verwendet das System die serverseitig gepflegte Gebäudeschließzeit als Endzeitpunkt

#### Scenario: Keine Schließzeit gepflegt
- **WHEN** für einen freien Raum kein nachfolgender Termin vorliegt und keine Schließzeit gepflegt ist
- **THEN** zeigt das System an, dass kein weiterer Termin bekannt ist, ohne einen Endzeitpunkt zu nennen

### Requirement: Alter eines veralteten Raumplan-Stands anzeigen

Falls der Raumplan-Zwischenspeicher älter als die vorgesehene Aktualisierungsfrequenz ist, muss das System das Alter des Stands in Raumübersicht, Ansicht laufender Veranstaltungen, Freie-Raum-Suche und Tagesbelegung sichtbar anzeigen. Die vorgesehene Aktualisierungsfrequenz ist der stündliche Abruftakt des Backends. Maßgeblich ist das Alter des Bestands zum Zeitpunkt, zu dem die App ihn abgerufen hat. Herkunft: NEU (vormals RAUM-F-260); Takt und Messzeitpunkt festgelegt und auf alle Raumsichten ausgedehnt mit dem Change `raumsuche-app`, 2026-11-26. Alle vier Sichten lesen denselben Bestand; ein Altershinweis nur in zwei davon ließe die Freie-Raum-Suche einen alten Stand kommentarlos als aktuell ausgeben. Gemessen beim Abruf wird, weil sonst die Gültigkeitsdauer des App-Zwischenspeichers zum Bestandsalter hinzukäme und der Hinweis im Normalbetrieb jede Stunde kurz aufträte.

#### Scenario: Veralteter Zwischenspeicher
- **WHEN** der Raumplan-Zwischenspeicher älter als die vorgesehene Aktualisierungsfrequenz ist
- **THEN** zeigt das System dessen Alter sichtbar an, statt ihn kommentarlos als aktuell darzustellen

#### Scenario: Aktueller Zwischenspeicher
- **WHEN** der Bestand beim Abruf durch die App jünger als eine Stunde ist
- **THEN** zeigt das System keinen Altershinweis an
