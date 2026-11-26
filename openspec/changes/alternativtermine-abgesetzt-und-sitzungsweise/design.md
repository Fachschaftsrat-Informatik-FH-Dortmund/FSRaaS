## Context

Seit dem Change `alle-veranstaltungen-einblenden` gibt es zwei Quellen
eingeblendeter Termine, die Alternativen und die nicht gewählten
Veranstaltungen. Beide tragen das Merkmal `einblendung` (`typen.ts`) und laufen
über `TerminKachel` in `ScheduleScreen.tsx`. Dort bekommen sie bisher die volle
Veranstaltungsfarbe und zusätzlich `styles.kachelAlternative`, einen
gestrichelten Rahmen. Beide Schalter liegen in `AnsichtEinstellungen` und
werden unter `scheduleViewSettings` gespeichert.

Beim Antippen öffnet eine Alternative ein eigenes `Modal`-Blatt
(`AlternativeUebernehmenBlatt`), eine nicht gewählte Veranstaltung dagegen
`ConfirmDialog`. Für den Anlass siehe `proposal.md`, Abschnitt Why.

## Goals / Non-Goals

**Goals:**

- Eine Darstellung und ein Rückfragemuster für beide Arten eingeblendeter
  Termine, keine zwei Varianten.
- Der Einblendungszustand verlässt den Arbeitsspeicher nicht.

**Non-Goals:**

- Keine Änderung an Inhalt oder Erzeugung der Einblendungen (`alternativen.ts`).
- Keine Änderung der Übernahmelogik „anstelle" und „zusätzlich".
- Planungsmodus und seine Hervorhebungseinstellungen bleiben unberührt. Sie
  liegen weiter in `AnsichtEinstellungen`.

## Decisions

### 1. Aufgehellte Fläche als reine Farbfunktion

`farbe.ts` bekommt `aufgehellteFlaeche(farbe, hintergrund, anteil)`. Sie
mischt die Veranstaltungsfarbe linear in sRGB mit der Hintergrundfarbe des
Themas, mit einem Anteil von 30 % Veranstaltungsfarbe. Im hellen Thema wird
die Fläche dadurch pastellig, im dunklen gedeckt. Die Schrift kommt wie bei
jeder Kachel aus `textfarbeFuerHintergrund(flaeche)`. Damit gilt die dort
mathematisch belegte Untergrenze von rund 4,58:1 auch hier. Ein Test prüft
jede Palettenfarbe gegen beide Themenhintergründe.

Der gestrichelte Rahmen trägt die volle Veranstaltungsfarbe. So bleibt die
Zuordnung zur Veranstaltung sichtbar, während die Fläche zurücktritt.

*Alternative:* `opacity` auf der ganzen Kachel, wie bei deaktivierten
Terminen. Verworfen. Die Deckkraft senkt auch den Schriftkontrast unter
4,5:1. Außerdem wären eingeblendete und deaktivierte Termine dann nicht mehr
zu unterscheiden.

*Alternative:* Hex-Farbe mit Alphakanal (`#RRGGBB4D`). Verworfen, weil der
Kontrast der Schrift sich nicht mehr gegen eine bekannte Fläche prüfen ließe.

### 2. Sitzungsstand statt Ansichtseinstellung

Die beiden Schalter wandern aus `AnsichtEinstellungen` in ein eigenes Modul
`einblendungsStand.ts`. Es ist ein reaktiver Modulspeicher nach dem Muster
von `ansichtEinstellungen.ts` (`useSyncExternalStore`), aber ohne
`readJson`/`writeJson`. Der Stand lebt so lange wie der JS-Prozess, also genau
eine App-Sitzung, und bleibt über Ansichtswechsel erhalten. `bereinige` in
`ansichtEinstellungen.ts` liest die Felder `alternativenEinblenden` und
`alleEinblenden` nicht mehr. Ein gespeicherter Altwert fällt damit beim
nächsten Schreiben weg, wie bei den entfallenen Filterschaltern.

*Alternative:* Die Felder in `AnsichtEinstellungen` lassen und nur vom
Schreiben ausnehmen. Verworfen, weil ein Speicher, der einen Teil seiner
Felder stillschweigend nicht speichert, die Bedeutung von
`readAnsichtEinstellungen` verwischt.

### 3. Chip in `headerRight`, vor den beiden Symbolen

`EinblendungChip` (`ui/EinblendungChip.tsx`) steht in `WochenansichtKopfzeile`
links vor `EinrichtungHeaderZugang` und `VerwaltungsblattZugang`. Der Titel
„Stundenplan" bleibt der native Kopfzeilentitel. Ein eigener
`headerTitle` hätte Schriftgröße und Ausrichtung je Plattform nachbauen
müssen. Der Chip zeigt „Alternativen", „Alle Veranstaltungen" oder beide durch
„+" verbunden, dazu ein ×-Symbol. Antippen ruft `alleAbschalten()`. Die
sichtbare Höhe beträgt 28 dp, `hitSlop` erweitert die Trefffläche auf 44 dp.

*Alternative:* Der Chip ohne Aktion. Verworfen. Ein Chip sieht antippbar aus.
Bliebe das Antippen folgenlos, wäre das ein toter Bedienweg, und der Weg zum
Abschalten führte doch wieder ins Ansichts-Blatt.

### 4. Eine Rückfrage für beide Arten, über `ConfirmDialog`

`AlternativeUebernehmenBlatt` entfällt. Beide Arten öffnen `ConfirmDialog`.
Der Titel nennt die Art („Alternativtermin" / „Nicht gewählte Veranstaltung").
Die Nachricht besteht aus zwei Teilen: einem Satz, der sagt, dass der Termin
nicht im Plan steht, und woher er kommt, und einer Angabezeile mit Zeit, Art,
Raum und Gruppe, gebildet in der Hilfsfunktion `einblendungsAngaben`. Danach
folgt die Frage. Die Aktionen bleiben, was sie waren: bei Alternativen
„Anstelle", „Zusätzlich" und „Abbrechen", bei nicht gewählten „Nicht
aufnehmen" (vorbelegt) und „Modul aufnehmen".

## Risks / Trade-offs

- [Chip und zwei Symbole in einer schmalen Kopfzeile] → Der Chip kürzt seine
  Beschriftung einzeilig (`numberOfLines={1}`). Ein Prüfpunkt in `tasks.md`
  hält die Wirkung am Gerät fest.
- [Aufgehellte Fläche im dunklen Thema wirkt dunkel statt hell] → So gewollt.
  Gemeint ist „zurückgenommen gegenüber dem Hintergrund", nicht „heller".
  Geprüft wird es am Gerät in beiden Themen.
- [Nutzerinnen, die die Einblendung dauerhaft wollten, verlieren sie beim
  Neustart] → Entschieden im Issue #77. Der Chip macht den Zustand sichtbar,
  und das Einschalten ist ein Schalter im Ansichts-Blatt.

## Migration Plan

Keine Datenmigration. Der gespeicherte Wert `alternativenEinblenden` (und ein
etwaiges `alleEinblenden`) wird beim Laden ignoriert und beim nächsten
Schreiben der Ansichtseinstellungen nicht mehr mitgeschrieben.
