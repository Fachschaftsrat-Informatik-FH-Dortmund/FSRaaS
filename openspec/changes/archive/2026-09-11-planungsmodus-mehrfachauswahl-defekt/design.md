## Context

Motivation und betroffene Stellen: proposal.md, Why und Impact. Hier nur,
was die Entscheidung trägt.

**Der offene Punkt aus proposal.md ist entschieden — Auslöser 1 liegt vor,
Auslöser 2 nicht.** Live-Abfrage von INT-002 am 2026-09-11: alle 25
Endpunkte aus INT-001 mit `grade=*`, zusammen 942 Rohtermine, danach
dieselbe Verarbeitung wie in der App (`normalize.ts` →
`kursbaum.baueModulliste` → Zeilen des Planungsmodus).

- `courseId` ist in **keinem** der 942 Rohtermine leer (durchgängig ein
  nichtleerer String). Auslöser 2 — leere Kurskennung — kommt im Bestand
  nicht vor.
- Zeilen, die `terminEntsprichtEintrag` wechselseitig als denselben Slot
  ansieht, gibt es dagegen in 13 der 21 Endpunkte mit Terminen; über alle
  Endpunkte vereinigt 101 Gruppen mit 219 Zeilen. Sie unterscheiden sich in
  66 Gruppen nur im Namen, in 8 nur im Raum, in 4 in beidem (der Rest sind
  deckungsgleiche Termine aus verschiedenen Endpunkten, siehe
  Entscheidung 3).
- Der Fall aus dem Gerätetest, belegt in `INPBPI`: Alle zwölf Parallelgruppen
  „Technisches Englisch 1" bis „12" tragen `courseId` `41102`, `SV`,
  `A-P`, Fachsemester `2` — ein Modul „Technisches Englisch"
  (Requirement „Anzeigename paralleler Termingruppen ohne bedeutungslose
  Endzahl"). Montags 14:15–15:50 liegen darin „Technisches Englisch 1"
  (C.E.41) und „Technisches Englisch 10" (C.E.42), dienstags ebenso 3 und 12.
  Ein Häkchen an der einen Zeile setzt es an der anderen mit.
- Weitere Belege in `INPBPI`: „Lern- und Arbeitstechniken" (`411031`, vier
  Zeitfenster, je zwei Räume, nur der Raum weicht ab) und „Informatik und
  Gesellschaft" (`45201`, „ersten 5 Wochen"/„weitere 4 Wochen", Name und
  Raum weichen ab).

`kursbaum.baueModulliste` hält all diese Termine als getrennte Zeilen, weil
seine Zusammenfassung Raum und Name berücksichtigt. `terminEntsprichtEintrag`
berücksichtigt keines von beiden, `terminSchluessel` nur den Raum. Die drei
Ausdrücke beschreiben dieselbe Sache — „ist das derselbe Termin?" — mit drei
verschiedenen Merkmalssätzen.

Plan-Einträge (`OfficialPlanEntry`) entstehen ausschließlich in
`PlanungScreen.baueSessionEintrag` und übernehmen `name` und `roomId`
unverändert aus dem Rohtermin. Keine Stelle überschreibt sie danach — auch
der Raumplan-Abgleich nicht, er zeigt nur einen Hinweis an (Requirement
„Hinweis auf Raumabweichung").

## Goals / Non-Goals

**Goals:**
- Eine Zeile des Planungsmodus, ein Slot: Antippen wählt genau die
  angetippte Zeile, Anzeige („gewählt", „zugewiesen: n"), Leiste der
  Ausstehenden und Konfliktprüfung zählen genau diesen Slot.
- Ein einziger Ausdruck für die Identität eines Rohtermins, den
  Darstellung und Auswahl gemeinsam nutzen.

**Non-Goals:**
- Die Modulbildung (`modulSchluessel`) bleibt unverändert — proposal.md,
  Capabilities. Dass derselbe Kurs aus mehreren Endpunkten mit
  verschiedenem Fachsemester als mehrere Module erscheint, ist ein eigenes
  Thema.
- Kein Umgang mit nachträglich geänderten Namen oder Räumen in INT-002
  (siehe Risks).

## Decisions

**Entscheidung 1 — Slot-Identität = Merkmale des Requirements
„Zusammenfassen deckungsgleicher Rohtermine", einschließlich des Namens.**
`terminSchluessel` umfasst künftig Kurs, Veranstaltungsart, Wochentag,
Beginn, Ende, Raum, Gruppenmenge **und Name**.
`terminEntsprichtEintrag` vergleicht nicht mehr Feld für Feld, sondern
`terminSchluessel(eintrag) === terminSchluessel(termin)` — ein Planeintrag
trägt dieselben Felder wie der Rohtermin. `kursbaum.baueModulliste`
verwendet `terminSchluessel` unverändert als Kennung beim Zusammenfassen,
statt den Namen selbst anzuhängen. Damit gilt per Konstruktion: Was als eine
Zeile erscheint, wird als ein Slot gewählt, und umgekehrt.

Der Name deckt nebenbei auch Auslöser 2 ab, falls INT-002 künftig doch leere
Kurskennungen liefert: Zwei Termine mit leerem `courseId` gelten nur noch als
gleich, wenn auch der Name übereinstimmt — derselbe Rückfall, den
`planEintraegeFuerModul` und der Raumplan-Abgleich schon heute nutzen.

*Alternative erwogen:* nur `roomId` ergänzen. Verworfen — 66 der 101
Gruppen unterscheiden sich allein im Namen, etwa „Sicherheits-und
Servicemanagement (1. Semesterhälfte)"/„(2. Semesterhälfte)" in `DDPM`.
*Alternative erwogen:* zusätzlich `lecturerName`. Verworfen — das
Requirement nennt die lehrende Person nicht als Merkmal, `kursbaum` fasst
Termine mit abweichender Lehrperson zu einer Zeile zusammen; die Auswahl
würde sonst feiner unterscheiden als die Darstellung.
*Alternative erwogen:* laufende Nummer des Rohtermins als Kennung.
Verworfen — INT-002 liefert keine Terminkennung (`id` leer beobachtet), eine
Position in der Antwort ist über Abrufe hinweg nicht stabil, und ein
gesicherter Planeintrag hätte nichts, woran er sich wiederfindet.

**Entscheidung 2 — Die Zeilenkennung im Planungsmodus trägt zusätzlich den
Modulschlüssel.**
React-Schlüssel, Sprungziel, Hervorhebung und `testID` einer Zeile lauten
`terminSchluessel(termin) + '#' + modul.key`. Derselbe Rohtermin kann in zwei
gewählten Modulen stehen (Entscheidung 3); ohne den Modulschlüssel wären
React-Schlüssel dann doppelt vergeben, und das Sprungziel aus der Leiste der
Ausstehenden träfe die Zeile des falschen Moduls. Der Modulschlüssel steht
hinten, damit die Kennung weiter mit dem lesbaren Terminschlüssel beginnt.
`springeZu` bekommt deshalb den Modulschlüssel der ausstehenden
Veranstaltung mit.

**Entscheidung 3 — Ein in allen Merkmalen gleicher Termin in zwei Modulen
bleibt ein Slot.**
Live belegt: „Informationssicherheit" (`46813`) steht in `INPBPI`
(Fachsemester 4), `INPBDS` (6) und `INDBDM` (2) mit identischem Namen, Raum
und Zeit; bei Auswahl mehrerer dieser Endpunkte entstehen drei Module. Es ist
dieselbe Veranstaltung im selben Raum — wer sie in einem Modul einplant, hat
sie eingeplant, und die Zeile erscheint in allen drei Modulen als gewählt.
Das ist die zutreffende Aussage; die Frage, ob daraus überhaupt drei Module
werden sollten, gehört zur Modulbildung (Non-Goals).

Folgerung für die Vorbelegung: Hat die Veranstaltungsart in jedem dieser
Module genau einen Slot, liefert `vorbelegteSlots` denselben Rohtermin
mehrfach. Die Vorbelegung legt ihn nur einmal in den Zwischenstand, sonst
schriebe das Sichern denselben Termin mehrfach in den Plan, und eine Abwahl
entfernte nur eine der Kopien.

**Entscheidung 4 — Eingeblendete Alternativen werden über ihre Kennung
entdoppelt.**
`alternativenDesTages` bildet die Kennung `alternative-<terminSchluessel>`.
Mit Entscheidung 1 ist sie innerhalb eines Moduls eindeutig; steht derselbe
Rohtermin in zwei gewählten Modulen (Entscheidung 3), erschiene er in der
Wochenansicht zweimal mit gleicher Kennung. Eine bereits erzeugte Kennung
wird deshalb übersprungen.

## Risks / Trade-offs

- [INT-002 ändert Name oder Raum eines bereits gesicherten Termins] → Der
  Planeintrag passt dann zu keiner Zeile mehr: Die neue Zeile erscheint
  ungewählt, die Leiste nennt die Veranstaltungsart als ausstehend, eine
  erneute Wahl legt einen zweiten Eintrag an, der alte bleibt in der
  Wochenansicht stehen. Bisher hätte der Vergleich einen Raumwechsel
  stillschweigend überbrückt — um den Preis des hier behobenen Fehlers.
  Nachteil hingenommen: Der Zustand ist sichtbar, nicht still, und der
  Nutzer verliert keinen Eintrag. Ob und wie oft INT-002 Namen oder Räume
  laufender Termine ändert, ist nicht erhoben (Open Questions).
- [Bestehende Tests adressieren Zeilen über das `testID`-Präfix
  `zeile-<Kurs>|<Art>|<Tag>|<Beginn>|<Ende>`] → bleibt gültig, weil
  Terminschlüssel und Modulschlüssel hinten angehängt werden.

## Migration Plan

Keine. Gesicherte Planeinträge tragen `name` und `roomId` seit jeher aus dem
Rohtermin; der strengere Vergleich findet sie unverändert wieder.
Auslieferung wie jede App-Änderung, kein Vertrag und kein Backend betroffen.

## Open Questions

- Ändert INT-002 Namen oder Räume laufender Termine während des Semesters,
  statt einen neuen Termin anzulegen? Beantwortbar durch wiederholte
  Abrufe über einige Wochen; das Ergebnis ändert diese Behebung nicht, nur
  ob der Fall aus Risks eine eigene Behandlung braucht.
