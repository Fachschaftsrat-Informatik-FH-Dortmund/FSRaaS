## Context

INT-009 (`Room/*/AllEvents`) liefert die Einzeltermine aller Räume für einen per
`From`/`To` gewählten Zeitraum. Der Vertrag (`api-contract.yaml`, Fassung 0.7.0)
beschreibt `/raeume/uebersicht` (`RaumStatus`) und `/raumplan/termine`
(`RaumplanTermin`) bereits; Typen entstehen über `tools/contract-codegen`.
Vorbild im Backend: `PeriodicJobService`, `JobStatusRegistry`, die
Mensa-Infrastruktur (Basisadresse aus der Konfiguration, eigener User-Agent,
Standard-Resilienz).

## Goals / Non-Goals

**Goals:** stündlicher Abruf mit ausdrücklichem Zeitraum; Raumauflösung für den
Pseudoraum `*`; persistenter Bestand mit Stand des letzten Abrufs; die zwei
kontofreien Lese-Endpunkte.

**Non-Goals:** App-UI, Freie-Raum-Suche, Tagesbelegung, Besetzt-Meldungen,
Prüfungsbestand, Stundenplan-Abgleich (SCHED-F-410 ff.).

## Decisions

**Zeitraum: heute 00:00 (Europe/Berlin) bis +28 Tage.** Deckt „jetzt" (das
Standardfenster beginnt erst morgen) und mehrere Wochen für den späteren
Stundenplan-Abgleich. Ein Jahr wäre möglich (9 911 Sätze für 2026), bläht aber
jeden stündlichen Austausch ohne heutigen Nutzen auf.

**Takt: stündlich.** Die Cache-Regel in INT-009 schlägt einen Tag vor; das reicht
für Serien, nicht für Einzelabsagen, die nur als Verschwinden einer Instanz
sichtbar werden. Ein Abruf pro Stunde ist für den FBWS unerheblich.
„Vorgesehene Aktualisierungsfrequenz" im Sinne von room-finder ist damit eine
Stunde; die App leitet „veraltet" aus `standAlter.abgerufenAm` ab.

**Zeitangaben aus `timestampBegin`/`timestampEnd`.** Bei Einzelterminen sind beide
Unix-Sekunden des Termins selbst. Fehlen sie, sind sie ≤ 0 oder liegt das Ende
nicht nach dem Beginn, wird der Termin übersprungen und protokolliert (room-finder,
Fehlerfälle). `timeBegin`/`timeEnd` werden nur für `RaumplanTermin` nach der
Auffüllregel aus INT-002 auf vier Stellen gebracht.

**Raumauflösung.** Trägt ein Termin eine echte `roomId`, gilt diese. Bei `*` werden
alle Kennungen der Form `<Gebäude>.<Etage>.<Nummer>` (z. B. `C.E.44`, `A.2.02`,
`C.3.34`) aus dem Namen gelesen; je Kennung entsteht ein Bestandseintrag. Findet
sich keine, bleibt der Termin unter `*` im Bestand (für spätere Auswertungen),
erscheint aber in keiner Raumsicht. Gebäudebuchstabe und Etage werden auf
`[A-Z]` bzw. `E`, `U` oder Ziffern begrenzt, damit Uhrzeiten („9:15") und
Modulnummern nicht als Raum gelesen werden.

**Plausibilitätsprüfung.** Verworfen wird (a) eine Antwort, deren Termine sämtlich
im Standardfenster liegen (Folgetag bis +7 Tage), obwohl ein längerer, heute
beginnender Zeitraum angefordert wurde — das ist das Erkennungsmerkmal eines
ignorierten `From`/`To`; (b) eine leere Antwort bei bisher gefülltem Bestand.
Beides wirft im Job eine Ausnahme: `PeriodicJobService` protokolliert sie und
meldet sie im Health-Check (API-F-260); der Bestand bleibt unverändert, der Stand
vermerkt `quelleErreichbar = false`. Grenzfall: In einer veranstaltungsfreien
Phase mit Terminen nur in der kommenden Woche schlägt (a) fälschlich an. Das ist
die sichere Richtung — älterer Bestand plus sichtbarer Altershinweis statt eines
still geschrumpften Fensters.

**Ersetzen statt Abgleichen.** Ein bestandener Abruf ersetzt Termine und
Raumliste vollständig in einer Transaktion. Ein inkrementeller Abgleich über
`modified` bringt bei ~2 500 Sätzen je 28 Tagen nichts und verfehlt gelöschte
Instanzen.

**Datenmodell.** `RaumplanTermin` (Id, RoomId — aufgelöst, RoomIdQuelle, Name,
EventType, Beginn, Ende, Weekday, TimeBegin, TimeEnd, StudentSet, CourseOfStudy,
LecturerId, Note), `RaumplanRaum` (RoomId aus `Room/`, ohne `*`), `RaumplanStand`
(eine Zeile: AbgerufenAm des letzten erfolgreichen Abrufs, LetzterVersuchAm,
LetzterVersuchErfolgreich, Von, Bis). `description` wird nicht gespeichert — es
kann Klarnamen tragen und darf nicht angezeigt werden (INT-009).

**Übersicht.** Räume = `Room/`-Liste ∪ Räume aus dem Bestand, ohne `*`. Belegt,
wenn ein Termin `Beginn ≤ t < Ende` hat; `aktuellerTermin` ist dann der am
spätesten endende laufende. Frei: `naechsterTermin` ist der nächste beginnende
im Bestand. `art`: Name beginnt mit „Prüfung" → `pruefung`, `eventType = Course`
→ `lehrveranstaltung`, sonst `sonstiges`. Größenklasse und E-Key aus der
kuratierten Raumliste (Stammdaten), wo vorhanden. `besetztMeldungen` = 0 bis zum
Besetzt-Meldungs-Schnitt. Vor dem ersten erfolgreichen Abruf: 503 mit Code
`raumplan_nicht_verfuegbar`.

**`/raumplan/termine`.** Der Vertrag beschreibt eine Serienform (Wochentag,
HHmm) für den lokalen Abgleich. Ausgeliefert werden deshalb die eindeutigen
Kombinationen aus Raum, Wochentag, Beginn, Ende, Bezeichnung, `studentSet`,
`lecturerId` und `note` über den Bestand — nur Montag bis Freitag (Enum des
Vertrags), ohne `*`. Optionaler Filter `studiengang` auf `courseOfStudy`.

**Konfiguration.** `Raumplan:BaseUrl` (vorbelegt
`https://ws.inf.fh-dortmund.de/timetable/current/rest/`), nur https, wie
`MensaQuelleOptions`. Der Job hängt an der Datenbank (nur mit
Verbindungszeichenfolge registriert).

## Risks / Trade-offs

- Raumkennungen im Freitext folgen keinem festen Format → Regex kann einzelne
  Formen verfehlen (z. B. Außenstandorte `EF38, 1.22`). Folge: Raum erscheint
  frei. Gemildert durch Tests an den im Spike belegten Formen; Nacharbeit an
  Echtdaten nötig.
- Falscher Alarm der Abdeckungsprüfung in vorlesungsfreier Zeit → älterer
  Bestand bleibt, Health-Check zeigt Fehler. Bewusst die sichere Richtung.
