## Why

Auf Android stürzt die App unmittelbar nach dem Sichern im Planungsmodus ab
(`java.lang.IllegalStateException: ScreenStackFragment added into a fragment
manager for a different fragment`, react-native-screens/Fabric). Das
Sichern selbst gelingt — der Absturz tritt erst bei der anschließenden
Navigation zurück zur Wochenansicht auf und reißt den Nutzenden aus dem
laufenden Vorgang.

## What Changes

- In `PlanungScreen.tsx` fallen im selben Commit zwei Seiteneffekte auf
  dieselbe State-Änderung: der `router.replace('/')`-Effekt (Zeile 204-207)
  und der Kopfzeilen-Registrierungseffekt (Zeile 212-219), der über
  `registriereePlanungAktion` synchron (`useSyncExternalStore`, ohne
  Batching) einen Re-Render von `PlanungSpeichernZugang` auslöst. Beide
  laufen nacheinander in derselben Bildschirmphase, in der der
  `planung`-Bildschirm bereits vom Fragment Manager entfernt wird — die
  Kopfzeilen-Mutation trifft auf eine Screen-Fragment-Transaktion, die noch
  nicht abgeschlossen ist.
- Die beiden Effekte werden so entkoppelt, dass die Kopfzeile nicht mehr
  mutiert, nachdem die Navigation weg vom Planungsmodus eingeleitet wurde —
  entweder durch sofortiges Abmelden der Kopfzeilen-Aktion als Teil von
  `sichern()` selbst, oder durch zeitliches Verschieben eines der beiden
  Effekte, sodass react-native-screens die Fragment-Transaktion abschließen
  kann, bevor die Kopfzeile erneut verändert wird. Die endgültige
  Reihenfolge/Technik legt `design.md` fest.
- Kein Verhalten aus fachlicher Sicht ändert sich: Sichern, Navigation und
  Kopfzeilen-Symbole verhalten sich für Nutzende identisch — nur ohne
  Absturz.

## Capabilities

Reiner Defekt in der Umsetzung eines bereits spezifizierten und
umgesetzten Requirements („Ausdrückliches Sichern der Planung",
`openspec/specs/`, archivierter Change `2026-09-09-stundenplan-bedienung-ohne-vormerkung`).
Keine Anforderung ändert sich, kein Requirement wird ergänzt oder entfernt
— die Änderung bleibt unterhalb der Spec-Ebene (Reihenfolge von
React-Effekten, kein fachliches Verhalten). Daher `skip_specs: true` in
`.openspec.yaml`.

### New Capabilities

Keine.

### Modified Capabilities

Keine — die Anforderung „Ausdrückliches Sichern der Planung" bleibt
unverändert; nur ihre technische Umsetzung wird korrigiert.

## Impact

- `app/src/areas/schedule/screens/PlanungScreen.tsx` (Effekt-Reihenfolge
  rund um `sichern()`/`gesichert`)
- `app/src/areas/schedule/planungAktion.ts` (ggf. Zeitpunkt/Art der
  `useSyncExternalStore`-Benachrichtigung), falls `design.md` das als
  nötig ausweist
- Kein API-, Daten- oder Vertragsimpact. Betrifft nur die App, nur Android
  (die native Fragment-Transaktion ist Android-spezifisch;
  react-native-screens auf iOS nutzt einen anderen Mechanismus, dort ist
  bislang kein entsprechender Absturz beobachtet).
- Zuordnung zur Roadmap: kein eigener Schritt aus
  `specs/product/roadmap.md` — Defektbehebung an bereits ausgeliefertem
  Verhalten aus dem abgeschlossenen Schritt „Stundenplan-Wochenansicht".
