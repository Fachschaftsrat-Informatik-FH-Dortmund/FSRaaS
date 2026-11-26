## ADDED Requirements

### Requirement: Zurückgenommene Darstellung eingeblendeter Termine

Das System muss jeden eingeblendeten Termin, also eine Alternative eines gewählten Moduls ebenso wie den Termin eines nicht gewählten Moduls, einheitlich und deutlich schwächer darstellen als die Termine des eigenen Plans. Die Fläche ist eine aufgehellte Fassung der Veranstaltungsfarbe, umgeben von einem gestrichelten Rahmen. Die Schrift muss auf dieser Fläche den Mindestkontrast von 4,5:1 einhalten. Das Textkennzeichen der Art („Alternative" bzw. „Nicht gewählt") bleibt bestehen. Wenn die Nutzerin einen eingeblendeten Termin antippt, dann muss die folgende Rückfrage im Titel die Art des Termins nennen, ausweisen, dass er nicht im eigenen Plan steht, und Zeit, Veranstaltungsart, Raum und Gruppe nennen, bevor sie eine Übernahme anbietet. Herkunft: Recherche: Gerätetest 2026-11-26 (Issue #77, Refs #68). Mit voller Veranstaltungsfarbe waren eingeblendete Termine von eigenen kaum zu unterscheiden, und das bisherige Übernahme-Blatt sagte nicht, was der angetippte Termin ist. Der Tester hielt ihn für einen Anzeigefehler.

#### Scenario: Eingeblendeter Termin neben eigenem Termin
- **WHEN** die Wochenansicht einen eingeblendeten Termin und einen Termin des eigenen Plans zeigt
- **THEN** stellt das System den eingeblendeten Termin mit aufgehellter Fläche und gestricheltem Rahmen dar, den eigenen mit voller Veranstaltungsfarbe

#### Scenario: Lesbarkeit der aufgehellten Fläche
- **WHEN** ein eingeblendeter Termin in einer beliebigen Farbe der Stundenplan-Palette dargestellt wird
- **THEN** hält seine Schrift auf der aufgehellten Fläche einen Kontrast von mindestens 4,5:1 ein

#### Scenario: Alternativtermin antippen
- **WHEN** die Nutzerin einen eingeblendeten Alternativtermin antippt
- **THEN** zeigt das System eine Rückfrage mit dem Titel „Alternativtermin", dem Hinweis, dass der Termin nicht in ihrem Plan steht, und seinen Angaben zu Zeit, Veranstaltungsart, Raum und Gruppe, bevor es die Übernahme anbietet

### Requirement: Einblendung nur für die laufende Sitzung

Das System muss die Schalter „Alternativtermine einblenden" und „Alle Veranstaltungen zeigen" bei jedem App-Start abgeschaltet beginnen lassen. Ein während der Nutzung eingeschalteter Schalter bleibt bis zum Ende der App-Sitzung aktiv, auch über einen Wechsel in andere Ansichten hinweg. Er wird nicht auf dem Gerät gespeichert. Ein aus einer früheren Fassung gespeicherter Wert wird beim Laden verworfen. Herkunft: Recherche: Gerätetest 2026-11-26 (Issue #77, Refs #68). Eine dauerhaft gespeicherte Einblendung ließ den Plan bei jedem Öffnen voller erscheinen, als er ist, ohne dass der Grund sichtbar war.

#### Scenario: App-Start nach eingeschalteter Einblendung
- **WHEN** die Nutzerin eine Einblendung einschaltet und die App anschließend neu startet
- **THEN** zeigt die Wochenansicht ausschließlich die Termine des eigenen Plans, und beide Schalter stehen auf aus

#### Scenario: Ansichtswechsel während der Sitzung
- **WHEN** die Nutzerin eine Einblendung einschaltet, in eine andere Ansicht wechselt und zur Wochenansicht zurückkehrt
- **THEN** ist die Einblendung weiterhin aktiv

### Requirement: Hinweis auf aktive Einblendung in der Kopfzeile

Solange mindestens einer der Schalter „Alternativtermine einblenden" und „Alle Veranstaltungen zeigen" aktiv ist, muss das System in der Kopfzeile der Wochenansicht, der Leiste mit dem Titel „Stundenplan", einen Chip zeigen, der die aktive Einblendung als Text nennt. Antippen des Chips muss alle Einblendungen abschalten. Der Chip ist als Bedienelement mindestens 44×44 dp groß bedienbar. Herkunft: Recherche: Gerätetest 2026-11-26 (Issue #77, Refs #68). Der Schalter liegt im Ansichts-Blatt verborgen; ohne sichtbaren Hinweis ist nicht zu erkennen, warum der Plan zusätzliche Termine zeigt.

#### Scenario: Einblendung aktiv
- **WHEN** die Nutzerin den Schalter „Alternativtermine einblenden" einschaltet
- **THEN** zeigt die Kopfzeile der Wochenansicht einen Chip „Alternativen"

#### Scenario: Keine Einblendung aktiv
- **WHEN** beide Einblendungsschalter abgeschaltet sind
- **THEN** zeigt die Kopfzeile keinen Chip

#### Scenario: Chip antippen
- **WHEN** die Nutzerin den Chip antippt
- **THEN** schaltet das System alle Einblendungen ab, und der Chip verschwindet
