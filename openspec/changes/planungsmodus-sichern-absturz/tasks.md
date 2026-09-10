## 1. Kopfzeilen-Effekt entkoppeln

- [x] 1.1 In `PlanungScreen.tsx` den Registrierungseffekt (Zeile 212-219)
      um `gesichert` erweitern: bei `gesichert === true` einmalig
      `registriereePlanungAktion(null)` aufrufen und keine weitere
      (Re-)Registrierung mehr vornehmen (design.md, Entscheidung 1) —
      verifiziert durch einen neuen Test in `PlanungScreen.test.tsx`, der
      nach dem Sichern prüft, dass `usePlanungAktion()`/die
      Kopfzeilen-Symbole (`PlanungSpeichernZugang`) kein weiteres Mal mit
      einer nicht-`null`-Aktion re-registriert werden.

## 2. Navigation entkoppeln

- [x] 2.1 Im `gesichert`-Effekt (Zeile 204-207) `router.replace('/')`
      über `requestAnimationFrame` verzögern (design.md, Entscheidung 2)
      — verifiziert durch einen bestehenden oder angepassten Test in
      `PlanungScreen.test.tsx`, der nach dem Sichern und einem
      Frame-Flush (z. B. `jest.runOnlyPendingTimers()`/rAF-Mock je nach
      Testaufbau) weiterhin auf `/` navigiert.
- [x] 2.2 Bestehende Tests in `PlanungScreen.test.tsx`, die synchron nach
      dem Sichern eine Navigation erwarten, an den Frame-Versatz aus 2.1
      anpassen und grün bekommen (`npm test -- PlanungScreen`).

## 3. Manuelle Prüfung auf Android

- [ ] 3.1 Auf einem Android-Testbuild (Development Build) den
      ursprünglichen Reproduktionsschritt nachvollziehen — Planungsmodus
      öffnen, mindestens einen Termin wählen, „Sichern" antippen — und
      bestätigen, dass kein `IllegalStateException`/Absturz mehr auftritt
      und die Wochenansicht wie erwartet erscheint. Datiertes
      Prüfprotokoll in `tasks.md`-Kommentar oder Commit-Nachricht
      festhalten (`quality-and-testing`, da dies eine
      Laufzeit-/Stabilitätsprüfung ohne eigenes Requirement-„muss" ist).
