## Context

`weiterAktion.ts` ist ein bildschirmübergreifendes Register nach dem
Muster von `modulauswahlAktion.ts` und `planungAktion.ts`: Der jeweils
vorn liegende Bildschirm meldet `{ freigegeben, weiter }` an,
`WeiterZugang` in der Kopfzeile (`app/(tabs)/(schedule)/_layout.tsx`) liest
den Eintrag über `useSyncExternalStore`. `registriereWeiterAktion`
benachrichtigt seine Abonnenten synchron (`for (const h of hoerer) h()`,
kein Batching, keine Microtask) — jede An- und Abmeldung rendert die
Kopfzeile also sofort neu, und auf Android bedeutet das eine native
Mutation am Header des Screen-Fragments.

Drei Bildschirme melden an: `SetupScreen` (Weg nach `/kurse`),
`CourseSelectionScreen` (nach `/gruppenkennung`) und
`GruppenkennungScreen` (nach `/planung`). Alle drei taten es bis hierher
mit demselben, wortgleich kopierten Block: `useFocusEffect` +
`useCallback`, im Rumpf `registriereWeiterAktion({ … })`, als
Aufräumschritt `registriereWeiterAktion(null)`. `weiter` rief
`router.push(…)` unmittelbar auf.

Daraus folgen zwei Befunde.

**Befund 1 — Kopfzeilen-Mutation in der laufenden Fragment-Transaktion.**
Das Antippen des Kopfzeilen-Symbols ruft `weiter` auf, `weiter` ruft
`router.push(…)`. Der Stapel bewegt sich, der bisherige Bildschirm
verliert den Fokus, der Aufräumschritt seines `useFocusEffect` läuft und
ruft `registriereWeiterAktion(null)` — eine Kopfzeilen-Mutation, ausgelöst
durch den Fokuswechsel, der Teil eben jener Navigation ist. Das ist
dieselbe Konstellation wie beim Sichern im Planungsmodus: dort trafen
`router.replace('/')` und eine Kopfzeilen-Mutation im selben
Effekt-Flush aufeinander und erzeugten auf Android/Fabric
`IllegalStateException: ScreenStackFragment added into a fragment manager
for a different fragment` (Change
`2026-09-10-planungsmodus-sichern-absturz`, design.md Context). Dort wurde
die Navigation um einen Frame versetzt; hier wurde dieselbe Maßnahme nicht
angewandt.

**Befund 2 — Register ohne Eigentümer.** `aktuelleAktion` ist eine einzige
Modulvariable, `registriereWeiterAktion(null)` löscht sie bedingungslos.
Beim Vorwärtsnavigieren liegen Fokusverlust des Vorgängers und Fokusgewinn
des Nachfolgers nicht in garantierter Reihenfolge; react-navigation
feuert `focus` des neuen Bildschirms, bevor der alte seinen
Aufräumschritt durchlaufen hat, wenn beide im selben Commit verarbeitet
werden. Dann meldet der Nachfolger an und der Vorgänger löscht
unmittelbar danach — das Kopfzeilen-Symbol verschwindet, obwohl der
Nachfolger es angemeldet hat. Genau dieser Zustand („Weiter-Symbol
verwaist") ist im Gerätetest des vorangegangenen Changes schon einmal
aufgetreten und dort über den Wechsel von `useEffect` zu `useFocusEffect`
behoben worden (Prüfprotokoll 2026-09-22). Der Wechsel beseitigt den
damaligen Auslöser (fehlende Neuanmeldung nach „Zurück"), nicht aber
diesen zweiten Weg zum selben Symptom.

## Goals / Non-Goals

**Goals**
- Kopfzeilen-Mutation und Fragment-Transaktion laufen nacheinander, nicht
  überlappend — für alle drei Bildschirme des Weiter-Wegs.
- Ein verlassener Bildschirm kann den Eintrag eines anderen nicht löschen.
- Der dreifach kopierte An-/Abmeldeblock steht einmal.

**Non-Goals**
- `modulauswahlAktion.ts` und `planungAktion.ts` bleiben unangetastet.
  Beide werden von genau einem Bildschirm bedient; die Eigentümerfrage
  stellt sich dort nicht, und `planungAktion.ts` trägt seine eigene,
  bereits umgesetzte Absicherung (Change
  `2026-09-10-planungsmodus-sichern-absturz`, Entscheidung 1). Ob sich die
  drei Register später zu einem Muster zusammenfassen lassen, ist eine
  eigene Frage (siehe Open Questions).
- Kein fachliches Verhalten: Freigabebedingungen, Ziele und der Umgang mit
  der fehlenden Gruppenkennung bleiben, wie sie spezifiziert sind.

## Decisions

**Entscheidung 1 — Jede Anmeldung trägt eine Besitzermarke; abgemeldet
wird nur, wer eingetragen ist.**
`registriereWeiterAktion(besitzer, aktion)` merkt sich neben der Aktion
das anmeldende Objekt; `meldeWeiterAktionAb(besitzer)` räumt nur ab, wenn
`besitzer` noch der eingetragene ist, und benachrichtigt andernfalls nicht
einmal die Abonnenten. Die Marke ist ein leeres Objekt aus einem `useRef`
des Bildschirms — je Bildschirminstanz stabil, nur über Identität
verglichen, ohne Inhalt.
*Alternative erwogen:* fortlaufender Zähler (Generation) statt
Objektidentität. Verworfen — die Identität ist bereits eindeutig und
braucht keinen Zustand im Modul, der beim Zurücksetzen im Test mitgeführt
werden müsste.
*Alternative erwogen:* das Register auf einen Stapel umstellen, aus dem
sich jeder Bildschirm wieder heraushängt. Verworfen als zu viel für das
Problem — zu jeder Zeit liegt genau ein Bildschirm vorn, ein Stapel
brächte eine zweite Quelle der Wahrheit neben dem Navigationsstapel.

**Entscheidung 2 — Der Weiter-Weg meldet sich beim Antippen selbst ab und
navigiert einen Frame später.**
`navigiereNachAbmeldung(navigiere)` räumt den aktuellen Eintrag sofort ab
und ruft `navigiere` in `requestAnimationFrame`. Damit ist die
Kopfzeilen-Mutation (`WeiterZugang` rendert zu `null`) committet, bevor
react-native-screens die Fragment-Transaktion beginnt — dieselbe Trennung
und dieselbe Begründung wie in Change
`2026-09-10-planungsmodus-sichern-absturz`, Entscheidung 2. Der
Aufräumschritt beim späteren Fokusverlust wird dadurch zum No-op: Der
Eintrag ist bereits fort, und ist inzwischen der Nachfolger eingetragen,
greift Entscheidung 1.
*Alternative erwogen:* nur den `router.push`-Aufruf verzögern, ohne vorher
abzumelden. Verworfen — das verschiebt die Kopfzeilen-Mutation lediglich
mit, denn sie hängt am Fokuswechsel und damit an der Navigation selbst;
die beiden blieben gekoppelt.
*Alternative erwogen:* `InteractionManager.runAfterInteractions`.
Verworfen aus demselben Grund wie im vorangegangenen Change: unnötig
konservativ, wartet auf alle laufenden Animationen und verzögert den
Schritt spürbar, ohne Sicherheitsgewinn für diesen einen lokalen
Renderschritt.
*Alternative erwogen:* Abmelden allein, ohne Frame-Versatz. Verworfen —
die Abmeldung liefe dann im selben synchronen Durchlauf wie der
`push`-Aufruf; ob der Kopfzeilen-Render davor committet ist, bliebe eine
Frage des Commit-Zeitpunkts statt einer Zusicherung.

**Entscheidung 3 — Der An-/Abmeldeblock zieht als
`useWeiterAktionAnmelden(freigegeben, weiter)` in `weiterAktion.ts`.**
Der Hook hält die Marke aus Entscheidung 1, kapselt `useFocusEffect` samt
Aufräumschritt und liegt neben dem Register, dessen Vertrag er bedient.
Die drei Bildschirme behalten nur, was sie unterscheidet: die
Freigabebedingung und ein `useCallback` mit dem Ziel. Warum
`useFocusEffect` und nicht `useEffect`, steht damit ebenfalls nur noch an
einer Stelle.
*Alternative erwogen:* den Hook in eine eigene Datei legen, damit
`weiterAktion.ts` frei von React-Navigation bleibt. Verworfen — der Hook
ist die einzige vorgesehene Art, dieses Register zu bedienen; ihn davon zu
trennen verteilte einen Vertrag auf zwei Dateien. Die Bildschirmtests
vertreten `expo-router` ohnehin bereits, `weiterAktion.test.ts` tut es nun
ebenso.
*Alternative erwogen:* den Hook auch das Ziel übernehmen lassen (etwa
`useWeiterAktionAnmelden(freigegeben, ziel)`), sodass die Bildschirme gar
kein `weiter` mehr schreiben. Verworfen — `GruppenkennungScreen` navigiert
nicht immer, sondern benennt ohne Kennung die fehlende Angabe. Ein Hook,
der beide Fälle abdeckte, trüge die Fallunterscheidung dorthin, wo sie
fachlich nicht hingehört.

## Risks / Trade-offs

- [Ein Frame Verzögerung vor jedem Schritt des Einrichtungswegs] → nicht
  wahrnehmbar (~16 ms), die fachliche Reihenfolge bleibt unverändert.
- [Das Kopfzeilen-Symbol verschwindet einen Frame vor dem Bildschirm] →
  beabsichtigt und der Kern der Maßnahme; bei ~16 ms nicht als Flackern
  wahrnehmbar. Auf dem Folgebildschirm meldet dessen eigener Hook das
  Symbol wieder an.
- [`requestAnimationFrame` ist ein Timing-Heuristikum, keine harte
  Sequenzierungszusage von react-native-screens] → dieselbe Bewertung wie
  im vorangegangenen Change: In Kombination mit der sofortigen Abmeldung
  bleibt kein bekannter Auslöser übrig. Tritt ein Absturz dennoch auf, ist
  das das Signal, `InteractionManager.runAfterInteractions` doch
  einzusetzen.
- [`weiterAktion.ts` hängt nun an `expo-router`] → betrifft nur den Test
  des Moduls, der `expo-router` wie die Bildschirmtests vertritt; das
  Register selbst bleibt ein gewöhnlicher Store.
- [Bildschirmtests erwarteten die Navigation synchron] → auf `waitFor`
  umgestellt, wie schon in `PlanungScreen.test.tsx`; Teil der Umsetzung.

## Migration Plan

Reine Code-Änderung in `weiterAktion.ts` und den drei Bildschirmen, kein
Datenmodell, kein Vertrag betroffen. Kein Rollout in Schritten nötig —
Release wie jede andere App-Änderung über die üblichen Kanäle (App Store,
Play Store, F-Droid); kein Rollback-Mechanismus über den normalen
Store-Rollback hinaus erforderlich.

## Open Questions

- Die drei Register `weiterAktion.ts`, `modulauswahlAktion.ts` und
  `planungAktion.ts` tragen inzwischen dasselbe Muster in drei Fassungen,
  zwei davon mit eigenen Absicherungen gegen dieselbe
  Fragment-Transaktions-Kollision. Ob sie sich zu einem gemeinsamen
  Kopfzeilen-Register zusammenfassen lassen, ist eine eigene Frage — sie
  berührt weder die hier getroffenen Entscheidungen noch eine Anforderung
  und wäre bei Bedarf ein eigener Change.
