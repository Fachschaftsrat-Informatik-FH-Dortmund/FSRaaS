## Context

Der Change `raumplan-zwischenspeicher` (PR #144) füllt im Backend stündlich
einen Bestand der Raumplan-Termine aus INT-009, Pseudoraum `*` bereits
aufgelöst, und liefert zwei kontofreie Lese-Endpunkte aus:

- `/raeume/uebersicht`: alle Raumplan-Räume mit Zustand zum Zeitpunkt
  `zeitpunkt` (ohne Angabe „jetzt"), laufendem bzw. nächstem Termin und den
  kuratierten Merkmalen.
- `/raumplan/termine`: die Serienform für den Stundenplan-Abgleich.

`/raeume/frei` und `/raeume/{roomId}/belegung` stehen im Vertrag, sind aber
nicht umgesetzt. Die kuratierte Raumliste mit Größenklasse, E-Key und
Schließzeit liefert `/stammdaten`.

Vorbild auf App-Seite ist der Mensa-Bereich (`app/src/areas/canteen/`):

- Datenzugriff in `api.ts` über TanStack Query und `openapi-fetch`
- reine Logik in eigenen Modulen mit Jest-Tests
- Bildschirme unter `screens/`
- Zustände über `AsyncStates`

## Goals / Non-Goals

**Goals:**

- Raum-Tab mit drei Sichten: freie Räume, Übersicht, laufende Veranstaltungen
- Tagesbelegung je Raum
- Filter und Suche
- Altershinweis
- Offline-Kennzeichnung

**Non-Goals:**

- Besetzt-Meldungen
- Laufwege
- Stundenplan-Abgleich
- `/raeume/frei` im Backend
- frei wählbarer Zeitpunkt der Übersicht

## Decisions

**Freie-Raum-Suche in der App aus Übersicht und Stammdaten.**

Ablauf:

1. Die App fragt `/raeume/uebersicht?zeitpunkt=<von>` ab.
2. Sie schneidet das Ergebnis mit der kuratierten Liste aus `/stammdaten`.

Ein Raum ist für `[von, bis)` frei, wenn alle drei Bedingungen gelten:

- `zustand = frei` zu `von`;
- `freiBis ≥ bis`, wobei `freiBis` das Minimum aus `naechsterTermin.beginn`
  und der Schließzeit am Tag von `von` ist;
- `von` liegt vor der Schließzeit.

Die Übersicht kennt zu `von` den laufenden Termin und den nächsten Beginn.
Mehr braucht die Entscheidung nicht. Sie ist damit exakt und keine Näherung.

Alternative: `/raeume/frei` im Backend umsetzen. Verworfen, weil die
Freie-Raum-Logik dann in C# läge, obwohl sie die Schließzeit der App-Seite,
die Filter und die Leermeldung braucht. In der App ist sie mit Jest testbar,
und das Backend bleibt bei seiner Rolle als Zwischenspeicher (Capability
`backend-and-api`, „Einzelner Abfrage-Endpunkt für Raumsuche (entfallen)").

Ein kuratierter Raum, der in der Übersicht fehlt, wird nicht als frei
ausgewiesen. Unbekannt heißt nicht frei.

**Tagesbelegung über einen neuen Backend-Endpunkt `/raeume/{roomId}/belegung`.**

Weder die Übersicht (nur ein Zeitpunkt) noch die Serienform (ohne Woche)
liefern die Termine eines bestimmten Tages. Eine Kette von
Übersicht-Abfragen wäre ungenau, weil sich überlappende Termine verdecken,
und teuer, weil jede Abfrage alle Räume liefert.

Der Endpunkt im Vertrag passt, er setzt `datum` und liefert `termine` mit
`standAlter`. Berichtigt wird nur die 404-Beschreibung: Bekannt ist ein Raum
aus Raumplan oder kuratierter Liste, nicht nur aus der kuratierten Liste.

Der Tag wird in Europe/Berlin geschnitten. Diese Ortszeit verwendet schon der
Abruf. Ohne `datum` gilt der heutige Ortstag. Es ist ein eigenes `MapGet` in
`RaumplanEndpoints.cs`, damit eine parallel laufende Backend-Arbeit am
Prüfungsbestand höchstens an einer klar getrennten Stelle kollidiert.

**Zeitraum-Wahl: Startzeit per Schritt-Knöpfen, Dauer per Auswahl.**

Die Startzeit steht anfangs auf „jetzt", auf volle Minuten abgerundet.
Knöpfe verschieben sie um ±30 Minuten. Früher als „jetzt" geht nicht,
später höchstens 7 Tage, weil der Bestand ab heute 28 Tage deckt. Ein Knopf
„Jetzt" setzt zurück.

Zur Dauer gibt es vier Stufen: 1, 2, 3 oder 4 Stunden, voreingestellt 2. Die
Android-Alt-App rechnet mit festen Blöcken; zwei Stunden entsprechen einer
Lerngruppen-Sitzung. Eine Datums- und Uhrzeitauswahl des Betriebssystems
hätte eine zusätzliche Abhängigkeit gebracht, ohne dass die Grobwahl daran
gewinnt.

Der Vorschlag eines nahegelegenen Zeitfensters im Leerzustand ist der Knopf
„Eine Stunde später suchen".

**Größenklassen-Filter: genau die gewählte Klasse.** Das Requirement
„Größenklasse anzeigen und filtern" verlangt „nur Räume dieser
Größenklasse". Der Vertragsparameter `mindestgroesse` meint dagegen „diese
oder größer". Er gehört zu `/raeume/frei`, das hier nicht verwendet wird.
Die Spec geht vor. Zur Wahl stehen: alle, klein, mittel, groß. Daneben gibt
es den Schalter „nur mit E-Key".

**Schließzeit: Format `HH:MM`, auch `HH.MM` und `HHMM`.** Das Feld ist im
Vertrag ein freier String, gepflegt über die Verwaltungsoberfläche. Ein
Wert, der sich nicht als Uhrzeit lesen lässt, wird protokolliert (SEC-F-060)
und wie eine fehlende Schließzeit behandelt. Ein Raum ohne Schließzeit und
ohne Folgetermin am selben Tag zeigt „kein weiterer Termin bekannt".

Liegt der nächste Termin an einem späteren Tag, zeigt die Anzeige „frei bis"
Datum und Uhrzeit.

**Laufende Veranstaltungen: Gruppierung nach (Bezeichnung, Beginn, Ende).**
Eine Veranstaltung, die mehrere Räume belegt, erscheint einmal mit allen
Räumen. Der Pseudoraum `*` nennt oft mehrere Räume, und der Bestand legt je
Raum einen Eintrag an. Sortiert wird nach Ende aufsteigend, das zuerst
endende kommt oben.

**Übersicht „jetzt" mit Minutentakt.** Der Zustand „jetzt" altert mit der
Uhr, auch wenn der Bestand gleich bleibt. Die Übersicht bekommt deshalb eine
eigene Gültigkeitsdauer `raumbelegungJetzt` von einer Minute in `ttl.ts`.
Bei geöffneter Sicht wird sie jede Minute neu abgefragt. Die Tagesbelegung
und die Freie-Raum-Suche zu einem gewählten Zeitpunkt nutzen das bestehende
`raumtermine` (15 Minuten).

**Altershinweis gemessen beim Abruf.** „Veraltet" heißt: `dataUpdatedAt −
standAlter.abgerufenAm` ist größer als der Abruftakt von einer Stunde. Der
Takt steht als `RAUMPLAN_ABRUFTAKT` in `ttl.ts`.

`AsyncStates` prüft bisher `jetzt − Stand > Höchstalter`. Die Raumsichten
geben deshalb als Höchstalter `Takt + (jetzt − dataUpdatedAt)` mit. Das ist
dieselbe Bedingung, und die Grundstruktur bleibt unverändert.

Der Bannertext lautet in `AsyncStates` bisher fest auf die
Mensa-Schnittstelle. `quelleStand` bekommt deshalb einen optionalen
i18n-Schlüssel `hinweis`. Ohne ihn bleibt der bisherige Text.

**Offline: Bereich als nicht verfügbar kennzeichnen, auch mit Zwischenspeicher.**
Das Requirement „Raumsuche offline nicht verfügbar" verlangt die
Kennzeichnung „statt veraltete Ergebnisse zu zeigen". Ein Raum, der vor
20 Minuten frei war, ist kein brauchbares Ergebnis. Die Raumsichten prüfen
den Netzzustand deshalb vor `AsyncStates` und zeigen den Offline-Zustand.

**Navigation: `app/app/(tabs)/rooms/` wird ein Stack.**

- `index`: die drei Sichten mit `SegmentedControl` oben.
- `raum/[roomId]`: die Tagesbelegung.

Die Sichtwahl ist ein lokaler Zustand des Bildschirms. Der Wechsel bleibt im
Tab (Requirement „Wechsel zwischen den drei Sichten"). Der Kopf trägt
weiterhin „Raumsuche".

**Raum per Kennung wählen.** Das Suchfeld der Übersicht filtert die Liste
nach Teilstring. Mit „Belegung anzeigen" (Tastatur-Senden oder Knopf)
öffnet es die Tagesbelegung genau der eingegebenen Kennung, auch wenn sie
nicht in der Liste steht. Eine unbekannte Kennung führt zum Hinweis „Raum
unbekannt" aus der 404 `raum_unbekannt`.

Die Eingabe wird getrimmt und in Großbuchstaben gewandelt, weil alle
Raumkennungen großgeschrieben sind (`C.E.44`).

## Risks / Trade-offs

- **Freie-Raum-Suche mit „jetzt" als Start, wenn die Nutzerin lange auf der
  Sicht bleibt.** Die Startzeit wandert nicht mit. Gemildert durch den
  „Jetzt"-Knopf und die sichtbare Startzeit.
- **Minutentakt der Übersicht erzeugt Last.** Eine Antwort mit rund 150
  Räumen je Minute und geöffneter Sicht ist für das Backend unerheblich.
  Abgefragt wird nur bei geöffneter Sicht.
- **Feiertage.** Der Raumplan führt sie als belegt (Spike 2026-09-07). Die
  Ansicht laufender Veranstaltungen zeigt dann den Sollplan. Das ist eine
  offene Entscheidung, nicht Teil dieses Schnitts.
- **Schließzeit nur am Tag von `von`.** Liegt der gewählte Zeitraum über
  Mitternacht, wird die Schließzeit des Folgetags nicht geprüft. Bei
  Gebäudeschluss am Abend erscheint ein solcher Zeitraum ohnehin nicht als
  frei.
