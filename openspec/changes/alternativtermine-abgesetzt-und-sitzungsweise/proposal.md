## Why

Im Gerätetest (Issue #77, aus der Nacharbeit zu Issue #68) waren eingeblendete
Alternativtermine kaum von den eigenen Terminen zu unterscheiden. Sie tragen
dieselbe volle Veranstaltungsfarbe; abgesetzt sind sie nur durch einen
gestrichelten Rahmen und ein kleines Textkennzeichen. Das Antippen öffnete ein
Blatt mit einer Übernahmefrage, ohne zu sagen, was der Termin ist und warum er
dort steht. Der Tester hat den Termin für einen Fehler gehalten.

Dazu kommt, dass die Einblendung gespeichert wird. Wer sie einmal einschaltet,
findet sie bei jedem späteren Öffnen der App wieder vor. Ein Hinweis darauf
fehlt, und der Schalter liegt im Ansichts-Blatt verborgen. Der Plan wirkt
dann dauerhaft voller, als er ist.

## What Changes

- **Gemeinsame, zurückgenommene Darstellung.** Jeder eingeblendete Termin,
  also Alternative oder nicht gewählte Veranstaltung (Change
  `alle-veranstaltungen-einblenden`), erscheint mit aufgehellter Fläche in der
  Veranstaltungsfarbe und gestricheltem Rahmen. Er wirkt dadurch deutlich
  schwächer als ein eigener Termin. Die Schrift hält weiter den
  Mindestkontrast ein, das Textkennzeichen bleibt.
- **Klarer Bedienweg beim Antippen.** Die Rückfrage nach einem Tipp auf einen
  eingeblendeten Termin nennt im Titel seine Art („Alternativtermin" bzw.
  „Nicht gewählte Veranstaltung"). Sie sagt, dass er nicht im eigenen Plan
  steht, und nennt Zeit, Art, Raum und Gruppe. Das Übernahme-Blatt der
  Alternativen wird dafür auf den gemeinsamen `ConfirmDialog` umgestellt.
- **Einblendung nur für die laufende Sitzung.** Beide Einblendungsschalter
  sind voreingestellt aus und beginnen bei jedem App-Start wieder aus. Einen
  gespeicherten Altwert verwirft die App beim Laden.
- **Chip in der Kopfzeile.** Solange eine Einblendung aktiv ist, steht in der
  Leiste mit dem Titel „Stundenplan" ein Chip, der sie nennt. Antippen des Chips schaltet
  die Einblendung ab.
- Der Alternativen-Schalter heißt künftig „Alternativtermine einblenden", damit
  er sich vom Schalter „Alle Veranstaltungen zeigen" unterscheidet.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: drei neue Requirements zur Darstellung eingeblendeter Termine,
  zur Rücksetzung der Einblendung beim App-Start und zum Chip in der Kopfzeile.

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Etappe 3 (Wochenansicht).

**Herkunft:** Gerätetest, Issue #77 (Refs #68).

**Abhängigkeit:** Baut auf dem Change `alle-veranstaltungen-einblenden` auf.
Dessen Merkmal `einblendung` und Schalter `alleEinblenden` sind die zweite
Quelle eingeblendeter Termine, die hier mitbehandelt wird.

**Betroffener Code:**

- `app/src/areas/schedule/ansichtEinstellungen.ts`: Die beiden
  Einblendungsschalter wandern in einen nicht gespeicherten Sitzungsstand.
- `app/src/areas/schedule/farbe.ts`: aufgehellte Fläche und Textfarbe dazu
- `app/src/areas/schedule/screens/ScheduleScreen.tsx`: Kachelstil und
  Rückfragen
- `app/src/areas/schedule/ui/`: neuer Chip, Ansichts-Blatt
- `app/app/(tabs)/(schedule)/_layout.tsx`: Kopfzeile der Wochenansicht
