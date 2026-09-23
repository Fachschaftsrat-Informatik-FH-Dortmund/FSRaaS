## Why

Der weiterführende Bedienweg in der Kopfzeile (Change
`2026-09-22-einrichtung-und-kursauswahl-bedienung`) trägt dieselbe
Kollision, die auf Android bereits einmal zum Absturz geführt hat: Das
Register `weiterAktion.ts` mutiert die Kopfzeile über
`useSyncExternalStore` (ohne Batching), während die vom selben Antippen
ausgelöste Navigation die Fragment-Transaktion von react-native-screens
schon begonnen hat. Genau dafür wurde beim Sichern im Planungsmodus der
Frame-Versatz eingeführt (Change `2026-09-10-planungsmodus-sichern-absturz`,
design.md Entscheidungen 1 und 2) — an den drei Bildschirmen des
Weiter-Wegs fehlt er.

Hinzu kommt ein zweiter Fund an derselben Stelle: Das Register kennt
keinen Eigentümer. Melden sich zwei Bildschirme in der Reihenfolge an, die
beim Vorwärtsnavigieren tatsächlich auftritt (der Nachfolger meldet an,
bevor der Vorgänger den Fokus verliert), löscht der Aufräumschritt des
Vorgängers den frischen Eintrag des Nachfolgers — und das Kopfzeilen-Symbol
ist verwaist. Das ist derselbe Befund, den der vorangegangene Change im
Gerätetest bereits einmal beheben musste (Prüfprotokoll 2026-09-22); ohne
Eigentümerprüfung bleibt er über einen zweiten Weg erreichbar.

## What Changes

- `SetupScreen.tsx`, `CourseSelectionScreen.tsx` und
  `GruppenkennungScreen.tsx` navigieren nicht mehr unmittelbar aus dem
  Antippen heraus, sondern melden den Kopfzeilen-Weg zuerst ab und
  navigieren einen Frame später — dieselbe Trennung wie beim Sichern im
  Planungsmodus.
- `weiterAktion.ts` bekommt eine Besitzermarke je anmeldendem Bildschirm.
  Abgemeldet wird nur, wer noch eingetragen ist; ein verspäteter
  Aufräumschritt eines verlassenen Bildschirms läuft ins Leere.
- Der in allen drei Bildschirmen wortgleich kopierte An-/Abmeldeblock zieht
  als `useWeiterAktionAnmelden` in `weiterAktion.ts` um. Die drei
  Bildschirme behalten nur noch, was sie unterscheidet: Freigabebedingung
  und Ziel.
- Kein Verhalten aus fachlicher Sicht ändert sich: Das Symbol erscheint,
  verschwindet und führt weiter wie bisher — nur ohne die beiden
  beschriebenen Fehlerwege.

## Capabilities

Reiner Umsetzungsdefekt an bereits spezifizierten und umgesetzten
Requirements („Weiterführender Bedienweg in der Kopfzeile", „Eigener
Schritt für die Gruppenkennung nach der Modulauswahl", „Gruppenkennung
verpflichtend vor dem Planungsmodus"; archivierter Change
`2026-09-22-einrichtung-und-kursauswahl-bedienung`). Keine Anforderung
ändert sich, keine wird ergänzt oder entfernt — die Änderung bleibt
unterhalb der Spec-Ebene (Reihenfolge von React-Effekten und
Registerverwaltung, kein fachliches Verhalten). Daher `skip_specs: true`
in `.openspec.yaml`, wie beim gleichgelagerten Change
`2026-09-10-planungsmodus-sichern-absturz`.

### New Capabilities

Keine.

### Modified Capabilities

Keine — die drei genannten Anforderungen bleiben unverändert; nur ihre
technische Umsetzung wird korrigiert.

## Impact

- `app/src/areas/schedule/weiterAktion.ts` (Besitzermarke, gemeinsamer
  Anmelde-Hook, Navigationsweg mit Frame-Versatz)
- `app/src/areas/schedule/screens/SetupScreen.tsx`,
  `CourseSelectionScreen.tsx`, `GruppenkennungScreen.tsx` (Nutzung des
  gemeinsamen Hooks statt dreier Kopien)
- `app/src/areas/schedule/ui/WeiterZugang.test.tsx` und die drei
  Bildschirmtests (neue Signatur, Frame-Versatz)
- Kein API-, Daten- oder Vertragsimpact. Betrifft nur die App; der Absturz
  selbst ist Android-spezifisch (die Fragment-Transaktion gibt es nur
  dort), die Besitzermarke wirkt auf beiden Plattformen.
- Zuordnung zur Roadmap: kein eigener Schritt aus
  `specs/product/roadmap.md` — Defektvorsorge an bereits ausgeliefertem
  Verhalten aus dem abgeschlossenen Schritt „Einrichtung".
