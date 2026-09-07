# Aktueller Tag am Wochenende sichtbar und erreichbar

## Warum

Das Requirement „Überspringen angebotsfreier Wochenendtage" (vormals MENSA-F-044) kennt keine Ausnahme für den aktuellen Tag. Fällt der aktuelle Tag auf einen angebotsfreien Samstag oder Sonntag, macht ihn das beim Rückblättern unerreichbar und die Bedienung bricht: `naechsterTag()` (`app/src/areas/canteen/tageswahl.ts:42`) sucht rückwärts über Sonntag und Samstag hinweg weiter, landet beim Freitag, erkennt ihn als vergangen und liefert `null`. Der Zurück-Pfeil ist dann sichtbar aktiv — `amAnfang` ist falsch, weil Montag über dem aktuellen Tag liegt (`CanteenScreen.tsx:136`) — und tut beim Antippen nichts. Wer am Samstag einmal auf Montag blättert, kommt nicht mehr zurück.

Der aktuelle Tag ist die Untergrenze der Tagesauswahl (Requirement „Untere Grenze der Tagesauswahl"). Eine Regel, die genau diese Grenze überspringt, hebt sie faktisch auf — die beiden Requirements widersprechen sich am Wochenende.

## Was sich ändert

**Der aktuelle Tag wird nie übersprungen.** Das Überspringen angebotsfreier Wochenendtage bleibt als Regel bestehen — die Mensen des Studierendenwerks führen an Wochenenden praktisch nie ein Angebot, und der eingesparte Tipp am Freitag ist der Grund, aus dem die Regel existiert. Sie bekommt genau eine Ausnahme: den aktuellen Tag. Ein Wochenendtag ist damit sichtbar, wenn er ein Angebot führt **oder** wenn er der aktuelle Tag ist; sonst bleibt er übersprungen.

**Der aktuelle Tag ist der Ausgangspunkt, auch am Wochenende.** Das ist bereits so umgesetzt (`useState(isoHeute)`, `CanteenScreen.tsx:65`), steht aber nirgends als prüfbare Anforderung. Bisher deckt nur „Anzeige des Tagesspeiseplans der gewählten Mensen" den aktuellen Tag ab, und zwar für den Fall, dass ein Angebot vorliegt. Der Wochenendfall — kein Angebot, trotzdem der gewählte Tag — ist ungeschrieben und damit ungetestet. Er wird als eigenes Requirement nachgezogen.

**Für die Anzeige selbst ändert sich nichts.** Führt an einem Tag keine gewählte Mensa ein Angebot, zeigt die App bereits den Leerzustand „kein Angebot" (`CanteenScreen.tsx`, Zweig `sektionen.length === 0`) mit dem Geschlossen-Hinweis je Mensa im Fuß. Genau dieser Zustand ist am Wochenende der richtige; er wird lediglich erreichbar.

## Nicht Teil dieser Änderung

- **Das Überspringen wird nicht abgeschafft.** Wochenendtage ohne Angebot, die nicht der aktuelle Tag sind, bleiben beim Blättern und Wischen übersprungen. Ist der aktuelle Tag ein Samstag, bleibt der folgende Sonntag unerreichbar — das ist die gewollte Wirkung der Regel, kein Restfehler.
- **Die Behandlung unbekannten Bestands bleibt.** Fehlt der Tagesbestand (offline, Ladefehler), gilt der Tag weiterhin als angebotsfrei. Bewusst beibehalten, begründet in `canteen-durchsprache-inhalt`.

## Beobachteter Nebenbefund, nicht in dieser Änderung behoben

Der Leerzustand trägt den Titel „Heute kein Angebot" (`app/src/i18n/de.json:64`), wird aber für jeden angezeigten Tag verwendet. Auf einem Folgetag ist die Aussage falsch. Der Befund ist älter als diese Änderung und wird durch sie nicht verschärft: Nach der Ausnahme landet man am Wochenende auf dem aktuellen Tag, wo „Heute" zutrifft. Bewusst ausgeklammert, damit die Änderung eine Sache tut.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `canteen`: Das Requirement „Überspringen angebotsfreier Wochenendtage" bekommt die Ausnahme für den aktuellen Tag. Neu hinzu kommt „Aktueller Tag als Ausgangspunkt der Tagesauswahl", das den bisher ungeschriebenen Wochenendfall des Einstiegs festhält.

## Auswirkung

- `app/src/areas/canteen/tageswahl.ts` — `naechsterTag()`: Der aktuelle Tag beendet die Skip-Kette, statt überschritten zu werden.
- `app/src/areas/canteen/tageswahl.test.ts` — Tests zum Requirement-Bezug der geänderten und der neuen Anforderung.
- `app/src/areas/canteen/screens/CanteenScreen.tsx` — voraussichtlich nur der Kommentarbezug; `amAnfang` und der Einstieg über `isoHeute` bleiben, wie sie sind.
- Kein Vertrag, kein Backend, keine Integration betroffen. `openspec/specs/api-contract.yaml` bleibt unberührt.
