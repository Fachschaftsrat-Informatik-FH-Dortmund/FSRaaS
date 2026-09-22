---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-22
---

# Prüfprotokoll — Einrichtung und Kursauswahl: Bedienung

Datum: 2026-09-22
Prüfer: Umsetzung (technische Leitung), Gerätetest auf Android-Emulator (Pixel 9
Pro, API-Ebene aktuell), dunkles Erscheinungsbild
Grundlage: `openspec/changes/einrichtung-und-kursauswahl-bedienung/` (proposal,
design, specs, tasks) Aufgabe 6.4: „Gerätetest des Wegs Einrichtung →
Modulauswahl → Gruppenkennung → Planungsmodus, einschließlich der Bestätigung,
dass die Kopfzeilen-Symbole auf dem Gerät erscheinen."

**Ergebnis in einem Satz:** Der Weg fährt vollständig durch und die
Kopfzeilen-Symbole erscheinen wie entworfen; der Gerätetest deckte dabei einen
Fehler in der neu eingeführten Bedienung selbst auf — das Weiter-Symbol verlor
sich beim Zurücknavigieren —, der noch im selben Change behoben und erneut am
Gerät bestätigt wurde.

## 1. Durchgängiger Weg (Vorwärtsrichtung)

| Prüfpunkt | Ergebnis |
|---|---|
| Einrichtung → Kursauswahl (Weiter-Symbol, `SetupScreen`) | **bestanden** — orangenes Pfeilsymbol in der Kopfzeile, führt bei gewähltem Endpunkt weiter |
| Kursauswahl → Gruppenkennung, mit `module`-Parameter (`CourseSelectionScreen`) | **bestanden** — Rückmeldung „14 von 28 Terminen betreffen dich" zählt korrekt nur die Termine der gewählten Module |
| Gruppenkennung → Planungsmodus (`GruppenkennungScreen`) | **bestanden** — Einträge erscheinen mit „Eigene Gruppe · Gewählt" bzw. „Noch nicht eingeplant" |
| Symbol für das Zurücksetzen der Auswahl (Refresh-Symbol statt „close", `ModulauswahlVerwerfenZugang`) | **bestanden** — sitzt sichtbar neben dem Weiter-Symbol in der Kursauswahl, von diesem unterscheidbar |

## 2. Fund: Weiter-Symbol verwaist beim Zurücknavigieren

Beim Rückweg Gruppenkennung → Kursauswahl → Einrichtung (Kopfzeilen-Pfeil
„Zurück", nicht der App-Weg) verschwand das Weiter-Symbol auf dem jeweils
darunterliegenden Bildschirm vollständig — obwohl der Bildschirm unverändert
einen gültigen nächsten Schritt anbietet. Das Refresh-Symbol blieb dagegen
korrekt sichtbar.

**Ursache:** `weiterAktion.ts` ist ein einzelnes, bildschirmübergreifendes
Register (Kopfkommentar der Datei nennt das ausdrücklich). Alle drei
Bildschirme meldeten sich bislang über ein reines `useEffect` an — das läuft
beim Mounten und bei Änderung der Abhängigkeiten, aber nicht erneut, wenn ein
im Stapel darunterliegender, weiterhin gemounteter Bildschirm durch
Zurücknavigieren wieder in den Vordergrund tritt. Der zuletzt obenauf
angemeldete Bildschirm meldet beim Verlassen `null` ab; der darunterliegende
Bildschirm registriert sich nicht neu und das Symbol bleibt verwaist.

**Entschiedene Abhilfe:** Alle drei Bildschirme (`SetupScreen.tsx`,
`CourseSelectionScreen.tsx`, `GruppenkennungScreen.tsx`) melden sich jetzt über
`useFocusEffect` an, nicht mehr über `useEffect` — passend zum in
`weiterAktion.ts` bereits dokumentierten Anspruch „beim Verlassen meldet er
null". Dabei zeigte sich, dass `@react-navigation/native` in diesem Projekt
nicht verwendet werden kann: Seit Expo SDK 56 ist `expo-router` inkompatibel
mit `react-navigation` und die Bundlung bricht hart ab, sobald ein Bildschirm
`@react-navigation/native` importiert (Fehlermeldung „As of SDK 56, expo-router
is no longer compatible with react-navigation"). Verwendet wird stattdessen das
von `expo-router` selbst exportierte `useFocusEffect` (deckungsgleiches
Verhalten, eigene Implementierung). Die zugehörigen Bildschirmtests mocken
`expo-router` bereits vollständig; ihr Mock bildet `useFocusEffect` seither auf
ein einfaches `useEffect` ab, da ohne echten Navigationsstapel kein
Fokuswechsel zu simulieren ist — der Bildschirm gilt beim Rendern als
fokussiert.

**Nachprüfung am Gerät (Fassung mit der Abhilfe):** Weg erneut
Einrichtung → Kursauswahl → Gruppenkennung → zweimal „Zurück". Das
Weiter-Symbol erscheint auf der Kursauswahl und danach auf der Einrichtung
jeweils sofort wieder, mit unverändertem Auswahlstand. Der volle Vorwärtsweg
bis in den Planungsmodus wurde im Anschluss erneut bestätigt (Abschnitt 1).

## 3. Automatisierte Nachprüfung

Die 51 Tests der betroffenen Dateien (`SetupScreen.test.tsx`,
`CourseSelectionScreen.test.tsx`, `GruppenkennungScreen.test.tsx`,
`weiterAktion.test.ts`, `WeiterZugang.test.tsx`) sowie die volle Suite
(1322 Tests, 96 Suiten) laufen nach der Abhilfe unverändert grün — die
bestehenden Testnamen decken bereits die Requirements „Weiterführender
Bedienweg in der Kopfzeile" und „Symbol für das Zurücksetzen der Auswahl" ab.
Für das konkrete Zurücknavigieren-Szenario selbst ist ein automatisierter Test
unverhältnismäßig: Er verlangte einen echten, mehrschichtigen
Navigationsstapel, den auch die vorhandene Testinfrastruktur bewusst nicht
nachbildet (die Bildschirmtests mocken `expo-router` vollständig). Das
Requirement nennt „Durchgängige Abläufe auf dem Gerät" ausdrücklich als
Verifikationsweg für Nutzerflüsse über mehrere Bildschirme
(`quality-and-testing`, Abschnitt „Teststufen und Ausnahmen") — dieses
Protokoll ist der Nachweis.

`npx tsc --noEmit`, `npm run lint`, `npx jest` und
`node tools/spec-check/src/cli.js` liefen vollständig durch: keine neuen
Fehler, keine neue Ausnahme in der Audit-Allowlist.

## 4. Offene Punkte

Keine. Alle Aufgaben aus
`openspec/changes/einrichtung-und-kursauswahl-bedienung/tasks.md` sind
abgeschlossen; der Change ist bereit zum Archivieren.
