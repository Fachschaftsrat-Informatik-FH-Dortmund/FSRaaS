## Why

Der Planungsmodus ist seit `stundenplan-bedienung-ohne-vormerkung` bedienbar,
aber der Gerätetest vom 2026-09-09 (Issue #68) hat gezeigt, dass er das
Wichtigste nicht zeigt: Man erkennt am Feld nicht, ob eine
Veranstaltungsreihe schon erledigt ist — dort steht allein der Text
„gewählt" —, und man erfährt nicht, welchen Gruppen ein Termin zugewiesen
ist, sondern nur, ob es die eigene ist.

Dazu kommen drei Punkte, die beim Durchgehen desselben Bildschirms
aufgefallen sind: Prüfungen lassen sich an einer Stelle anlegen, an die sie
nicht gehören; die Beschriftung „Angenommener Konflikt" behauptet einen
Vorgang, den es nicht gibt; und nach dem Sichern führt ein Zurück-Pfeil
zurück in einen Modus, den man gerade verlassen hat.

## What Changes

- **Kennzeichnung des Planungsstands je Reihe.** Statt des Textes „gewählt"
  trägt jede Zeile eine Kennzeichnung mit vier unterscheidbaren Ständen:
  eingeplant, mit mehreren Terminen eingeplant (samt Anzahl), anderweitig
  eingetragen, noch einzuplanen. Der ursprüngliche Vorschlag der Issue sah
  fünf Zustände über zwei Hakenvarianten vor; daraus wurden vier mit einer
  Anzahl, weil ein durchgezogener und ein nicht durchgezogener Haken in
  Zeilengröße nicht sicher zu unterscheiden sind und das Requirement
  „Bedeutung nicht allein über Farbe" der Capability `ux-and-theming` sonst
  nicht erfüllbar wäre.
- **Zugewiesene Gruppenkennungen statt „Eigene Gruppe".** Die Zeile nennt die
  Gruppenkennungen des Termins; ist die eigene darunter, wird sie
  hervorgehoben.
- **Einstellbare farbliche Hervorhebung.** Am oberen Rand des Planungsmodus
  lassen sich drei Hervorhebungen einzeln an- und abschalten: eigene Gruppe
  (wie bisher vorbelegt), Konflikte, bereits eingeplante Reihen.
- **Modulnamen unverändert.** Im Planungsmodus erscheinen die Namen so, wie
  das Backend sie liefert. Die Zusammenführung auf einen Namensstamm ohne
  bedeutungslose Endzahl gilt nur noch für die Modulauswahl — dort ist sie
  weiterhin richtig, hier verdeckt sie den Unterschied zwischen zwei
  parallelen Terminen derselben Reihe.
- **Keine eigenen Prüfungen mehr** (**BREAKING**). Ein eigener Termin lässt
  sich nicht mehr als Prüfung kennzeichnen — weder im Planungsmodus noch in
  der Wochenansicht. Die App führt den Stundenplan; wer eine Prüfung
  vormerken will, die der offizielle Bestand nicht führt, trägt sie im
  Kalender ihres Geräts ein oder legt sie als gewöhnlichen eigenen Termin an.
  Die Auswahl aus dem offiziellen Prüfungsplan bleibt unberührt.
- **„Konflikt" statt „Angenommener Konflikt".** Ein Konflikt zwischen zwei
  gleichzeitig gewählten Terminen wird nie aktiv angenommen; die
  Beschriftung behauptet einen Vorgang, den es nicht gibt.
- **Kein Rückweg in den Planungsmodus nach dem Sichern.** Nach dem Sichern
  steht die Wochenansicht ohne Zurück-Pfeil in den verlassenen
  Planungsmodus.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Drei Requirements kommen hinzu (Kennzeichnung des
  Planungsstands, Anzeige der zugewiesenen Gruppenkennungen, einstellbare
  Hervorhebung). Drei ändern sich („Anzeigename paralleler Termingruppen ohne
  bedeutungslose Endzahl", „Bewusste Übernahme trotz Konflikt", „Visuelle
  Kennzeichnung von Prüfungsterminen"), eines entfällt („Eigenen Termin als
  Prüfung kennzeichnen"). Zwei kommen für den Rückweg und die Rohnamen hinzu.

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Etappe 5 (Planungsmodus) — Nacharbeit
an bereits geliefertem Code, kein neuer Schnitt.

**Abhängigkeit zum unarchivierten Change `stundenplan-wochenansicht`:**
Dessen `schedule`-Delta führt „Bewusste Übernahme trotz Konflikt" bereits in
der paarweisen Fassung, die der Code seit `akzeptierteKonflikte: string[]`
umsetzt; der Hauptbestand steht noch auf der überholten Fassung am einzelnen
Termin. Die MODIFIED-Fassung dieses Changes setzt auf der paarweisen Fassung
auf und trägt sie vollständig. Die noch ausstehende Bestandspflege jenes
Changes muss dieses Requirement daher **nicht** mehr synchronisieren —
sondern nur noch „Sprung zum aktuellen Wochentag" (zu übernehmen) und
„Konflikthinweis bei festen Terminen" (überholt, nicht zu übernehmen).

**Betroffener Code** (vor der Umsetzung vollständig zu prüfen):

- `app/src/areas/schedule/screens/PlanungScreen.tsx` — Zeilendarstellung
  (Zeile 493-560), Kopfbereich, Rückkehr nach dem Sichern (Zeile 204-207)
- `app/src/areas/schedule/planungsstand.ts` — Stände je Reihe
- `app/src/areas/schedule/kursbaum.ts` — `anzeigename` (Zeile 72, 170): der
  Rohname muss neben dem zusammengeführten Namen erhalten bleiben
- `app/src/areas/schedule/typen.ts` — `istPruefung` (Zeile 58) entfällt
- `app/src/areas/schedule/screens/TerminEditorScreen.tsx` — Prüfungs-Schalter
  (Zeile 286-288) entfällt
- `app/src/areas/schedule/ansichtEinstellungen.ts` — die drei
  Hervorhebungsschalter
- Textkataloge: `schedule.konfliktAngenommen`, `schedule.planungGewaehlt`,
  `schedule.planungEigeneGruppe`, `schedule.terminPruefungLabel`

**Abhängigkeit:** Die Kennzeichnung des Planungsstands ist erst am Gerät
abnehmbar, wenn `vector-icons-native-migration` gelaufen ist.

**Berührter Punkt außerhalb dieses Changes:** Der Zurück-Pfeil nach dem
Sichern liegt auf derselben Navigation, die der laufende Change
`planungsmodus-sichern-absturz` anfasst (`router.replace('/')`). Beide dürfen
nicht gleichzeitig laufen; dieser Change setzt auf dem Ergebnis jenes
Changes auf.

**Bewusst nicht in diesem Schnitt:** die noch fehlende Optimierungshälfte des
Planungsmodus — bevorzugtes Zeitfenster, Kriterienrangfolge, Anpinnen,
Vorbereitungszeit und automatischer Planungsvorschlag (Issue #27). Sie ist
im Bestand spezifiziert, aber nicht umgesetzt; kommt sie hinzu, tritt das
Zeitfenster als vierte Zeile zu den Hervorhebungen dieses Changes.
