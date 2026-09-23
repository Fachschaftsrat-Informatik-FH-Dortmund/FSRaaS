## 1. Besitzermarke am Register

- [x] 1.1 In `weiterAktion.ts` `registriereWeiterAktion(besitzer, aktion)`
      um die Besitzermarke erweitern und `meldeWeiterAktionAb(besitzer)`
      als Gegenstück einführen, das nur abräumt und benachrichtigt, wenn
      die Marke noch eingetragen ist (design.md, Entscheidung 1) —
      verifiziert durch `weiterAktion.test.ts`, „ein nachträglich
      abmeldender Vorgänger löscht den Eintrag des Nachfolgers nicht" und
      „benachrichtigt die Kopfzeile nicht, wenn ein Fremder abmeldet".

## 2. Navigation entkoppeln

- [x] 2.1 In `weiterAktion.ts` `navigiereNachAbmeldung(navigiere)`
      ergänzen: Eintrag sofort abräumen, `navigiere` erst im nächsten
      `requestAnimationFrame` (design.md, Entscheidung 2) — verifiziert
      durch `weiterAktion.test.ts`, „räumt den Eintrag sofort ab und
      navigiert erst im nächsten Frame".
- [x] 2.2 `SetupScreen.tsx`, `CourseSelectionScreen.tsx` und
      `GruppenkennungScreen.tsx` auf `navigiereNachAbmeldung` umstellen;
      in `GruppenkennungScreen` bleibt das Benennen der fehlenden Angabe
      unverzögert, weil es nicht navigiert.
- [x] 2.3 Die drei Bildschirmtests auf den Frame-Versatz anpassen
      (`waitFor` wie in `PlanungScreen.test.tsx`) und zusätzlich prüfen,
      dass der Kopfzeilen-Eintrag unmittelbar nach dem Antippen schon fort
      ist (`npm test -- SetupScreen CourseSelectionScreen GruppenkennungScreen`).

## 3. Gemeinsame Anmeldung

- [x] 3.1 `useWeiterAktionAnmelden(freigegeben, weiter)` in
      `weiterAktion.ts` einführen — hält die Marke aus 1.1, kapselt
      `useFocusEffect` samt Aufräumschritt (design.md, Entscheidung 3) —
      verifiziert durch `weiterAktion.test.ts`, Abschnitt „Gemeinsame
      Anmeldung des Bedienwegs".
- [x] 3.2 Den dreifach kopierten An-/Abmeldeblock aus den drei
      Bildschirmen entfernen und durch den Hook ersetzen; `WeiterZugang.test.tsx`
      auf die neue Signatur von `registriereWeiterAktion` heben.

## 4. Manuelle Prüfung auf Android

- [x] 4.1 Auf einem Android-Testbuild (Development Build) den
      Einrichtungsweg vollständig durchlaufen — Endpunkt wählen, über das
      Kopfzeilen-Symbol zur Modulauswahl, Modul ankreuzen, weiter zur
      Gruppenkennung, Kennung setzen, weiter in den Planungsmodus — und
      bestätigen, dass kein `IllegalStateException`/Absturz auftritt und
      das Weiter-Symbol auf jedem Schritt erscheint, auch nach
      „Zurück". Datiertes Prüfprotokoll hier festhalten
      (`quality-and-testing`, Laufzeit-/Stabilitätsprüfung ohne eigenes
      Requirement-„muss").

### Prüfprotokoll 2026-09-23 — Android-Testbuild

Der Einrichtungsweg wurde auf einem Android-Development-Build vollständig
durchlaufen: Endpunkt wählen, über das Kopfzeilen-Symbol zur Modulauswahl,
Modul ankreuzen, weiter zur Gruppenkennung, Kennung setzen, weiter in den
Planungsmodus. Kein `IllegalStateException`, kein Absturz; das
Weiter-Symbol erscheint auf jedem Schritt, auch nach „Zurück". Damit gilt
die Absicherung als bestätigt.
