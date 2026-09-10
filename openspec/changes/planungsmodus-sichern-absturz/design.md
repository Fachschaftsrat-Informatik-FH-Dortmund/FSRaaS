## Context

`PlanungScreen.tsx` hat zwei `useEffect`s, die beide auf denselben
Zustandswechsel reagieren (`sichern()` setzt in einem Batch
`sessionEntscheidungen=[]`, `entfernteIds=new Set()`, `gesichert=true`):

1. Zeile 204-207: `if (!gesichert) return; router.replace('/');`
2. Zeile 212-219: registriert bei jeder Änderung von
   `hatUngesicherteAenderungen`/`sichern` erneut eine
   `PlanungAktion` bei `registriereePlanungAktion` (`planungAktion.ts`).
   Diese Funktion benachrichtigt ihre Abonnenten synchron
   (`for (const h of hoerer) h()`, kein Batching, keine Microtask), was
   `PlanungSpeichernZugang` (die Kopfzeilen-Symbole in
   `(tabs)/(schedule)/_layout.tsx`) über `useSyncExternalStore` sofort
   neu rendert.

Effekte einer Komponente laufen in Deklarationsreihenfolge; beide oben
genannten haben nach dem Sichern-Commit geänderte Dependencies und laufen
daher im selben Effekt-Flush, Effekt 1 vor Effekt 2. Effekt 1 stößt
`router.replace('/')` an — ein Wechsel aus dem verschachtelten
`(schedule)`-Stack heraus zur Tab-Wurzel, also eine Fragment-Transaktion
auf Android. Effekt 2 mutiert danach im selben Flush erneut die Kopfzeile
desselben, gerade in Entfernung befindlichen Bildschirms. Diese Kollision
— Kopfzeilen-Mutation während einer laufenden
Screen-Fragment-Transaktion — ist die plausibelste Ursache für
`IllegalStateException: ScreenStackFragment added into a fragment manager
for a different fragment` (siehe Absturzmeldung, react-native-screens auf
Android/Fabric).

Zusätzlich meldet Effekt 2 beim Unmount ab (`return () =>
registriereePlanungAktion(null)`); dieses Abmelden feuert ebenfalls einen
synchronen Notify und kann, je nachdem wann React-Navigation den
Bildschirm tatsächlich unmountet, erneut mit der Fragment-Transaktion
kollidieren.

Siehe proposal.md — Why/What Changes für die fachliche Einordnung.

## Goals / Non-Goals

**Goals:**
- Die Kopfzeile mutiert nach dem Sichern kein zweites Mal, während die
  Navigation weg vom Planungsmodus in Arbeit ist.
- Der Crash tritt beim Sichern (Kopfzeilen-Symbol) nicht mehr auf, ohne
  die fachliche Reihenfolge „Zustandslauf vor Navigation" (design.md des
  archivierten Changes, Entscheidung 13) zu verletzen.

**Non-Goals:**
- `planungAktion.ts` als gemeinsam genutzter Store (auch von
  `canteen`/`FilterResetAction` verwendet) wird nicht grundsätzlich
  asynchron gemacht — das wäre eine Verhaltensänderung an einer Stelle,
  die mit diesem Absturz nichts zu tun hat, und würde bestehende Tests
  riskieren, die synchrones Verhalten erwarten.
- `verlassenSichern()` (Zeile 227-231, Sichern beim Verlassen mit
  ungesicherten Änderungen über die Rückfrage) ruft zusätzlich zum
  `gesichert`-Effekt noch direkt `navigation.dispatch(pendingAction)` auf
  — ein möglicher doppelter Navigationsaufruf. Das ist ein eigenständiger,
  vom hier behobenen Absturz unabhängiger Verdacht und nicht Teil dieses
  Changes (siehe Open Questions).

## Decisions

**Entscheidung 1 — Kopfzeilen-Aktion meldet sich beim Sichern einmalig
ab, statt weiter zu re-registrieren.**
Der Registrierungseffekt bekommt `gesichert` in seine Dependency-Liste.
Ist `gesichert === true`, ruft er `registriereePlanungAktion(null)` auf
und registriert nichts mehr (kein weiterer Aufruf bei künftigen
Re-Renders dieses Bildschirms, auch nicht beim späteren Unmount — die
Cleanup-Funktion wird dann zu einem harmlosen No-op, da der Store bereits
`null` hält und ein wiederholter Notify mit unverändertem Wert keine
native Mutation an der bereits auf „ausgeblendet" stehenden Kopfzeile
mehr auslöst).
*Alternative erwogen:* Effekt-Reihenfolge einfach vertauschen (Kopfzeile
vor Navigation). Verworfen — das verschiebt die Kollision nur auf den
Unmount-Zeitpunkt des Bildschirms (Cleanup ruft ebenfalls
`registriereePlanungAktion(null)` auf), löst die eigentliche Ursache
nicht.

**Entscheidung 2 — `router.replace('/')` wird einen Frame verzögert.**
Der `gesichert`-Effekt ruft `router.replace('/')` nicht mehr direkt,
sondern über `requestAnimationFrame(() => router.replace('/'))`. Das
garantiert, dass die aus Entscheidung 1 resultierende
Kopfzeilen-Transaktion (Rendern von `PlanungSpeichernZugang` als `null`)
von React Native und `react-native-screens` vollständig verarbeitet ist,
bevor die Fragment-Transaktion der Navigation beginnt — beide
Mutationen laufen dadurch garantiert nacheinander statt potenziell
überlappend.
*Alternative erwogen:* `InteractionManager.runAfterInteractions` statt
`requestAnimationFrame`. Verworfen als unnötig konservativ (wartet auf
alle laufenden Interaktionen/Animationen, nicht nur den einen
Kopfzeilen-Renderdurchlauf) — würde das Sichern für Nutzende spürbar
verzögern, ohne einen zusätzlichen Sicherheitsgewinn gegenüber
`requestAnimationFrame` für diesen konkreten, rein lokalen Renderschritt.
*Alternative erwogen:* Nur Entscheidung 1 ohne Entscheidung 2. Verworfen
— Entscheidung 1 beseitigt zwar die zweite (Unmount-)Mutation, aber
Effekt 1 und der bereinigte Effekt 2 laufen weiterhin im selben
synchronen Flush; ohne den Frame-Versatz bliebe unklar, ob React Native
den durch Entscheidung 1 ausgelösten Re-Render von
`PlanungSpeichernZugang` sicher vor Beginn der Fragment-Transaktion aus
Effekt 1 committet. Beide Entscheidungen zusammen entkoppeln die beiden
nativen Mutationen unabhängig von Committing-Feinheiten.

Fachliche Reihenfolge bleibt gewahrt: der komplette Zustandslauf
(`mehrereUebernehmen`, `verwerfeZwischenstand`, `setGesichert`) ist vor
dem verzögerten `router.replace('/')` bereits synchron abgeschlossen —
nur der Navigationsaufruf selbst verschiebt sich um einen Frame
(ca. 16 ms, nicht wahrnehmbar).

## Risks / Trade-offs

- [Ein Frame Verzögerung vor der Navigation] → nicht wahrnehmbar (~16 ms),
  ändert nichts an der fachlichen Reihenfolge „Zustand vor Navigation".
- [`requestAnimationFrame` ist ein Timing-Heuristikum, kein hartes
  Sequenzierungsgarantie von react-native-screens] → Mitigation:
  Entscheidung 1 reduziert die Zahl der nach dem Sichern noch möglichen
  Kopfzeilen-Mutationen auf genau eine (den Übergang zu `null`); in
  Kombination mit Entscheidung 2 bleibt für einen erneuten Absturz kein
  bekannter Auslöser übrig. Sollte der Absturz dennoch erneut auftreten,
  ist das ein Signal, `InteractionManager.runAfterInteractions` (siehe
  verworfene Alternative) doch einzusetzen.
- [Bestehende Tests (`PlanungScreen.test.tsx`) prüfen vermutlich
  synchron, dass nach dem Sichern navigiert wurde] → Mitigation: Tests
  müssen ggf. auf den verzögerten Aufruf warten (Fake-Timer/`act` mit
  `requestAnimationFrame`-Flush); Teil der Umsetzung, kein offener Punkt.

## Migration Plan

Reine Code-Änderung an zwei Stellen in `PlanungScreen.tsx`, kein
Datenmodell, kein Vertrag betroffen. Kein Rollout in Schritten nötig —
Release wie jede andere App-Änderung über die üblichen Kanäle (App
Store, Play Store, F-Droid); kein Rollback-Mechanismus über den
normalen Store-Rollback hinaus erforderlich.

## Open Questions

- Ist der in „Non-Goals" genannte doppelte Navigationsaufruf in
  `verlassenSichern()` (`sichern()` + anschließend
  `navigation.dispatch(pendingAction)`, während der `gesichert`-Effekt
  zusätzlich `router.replace('/')` auslöst) ein eigenständiger Bug? Lässt
  sich ohne Codeänderung an dieser Stelle beantworten (Log/Repro), ändert
  weder Specs noch die hier getroffenen Entscheidungen — bei Bedarf als
  eigener Change zu behandeln.
