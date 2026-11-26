## Context

Seit PR #144 (Change `raumplan-zwischenspeicher`) ruft `RaumplanAbruf` den
Platzhalter-Aufruf `Room/*/AllEvents` stündlich über 28 Tage ab. Es prüft, ob die
Antwort den Zeitraum abdeckt, löst den Pseudoraum `*` über das Namensfeld auf
(`RaumAufloesung`) und ersetzt den Bestand nur vollständig. Der Vertrag
beschreibt `/stundenplan/pruefungsplan` und `/stundenplan/pruefungsplan/stand`
bereits, aber ohne Vollständigkeitshinweis und mit einem einzigen `roomId` je
Prüfungstermin. Weder Backend noch App verwenden das Schema bisher. Motivation
und Umfang: siehe `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Prüfungsbestand mit ausreichendem Vorlauf
- ehrlicher Vollständigkeitshinweis
- Änderungszeitpunkt ohne Fehlalarm durch abgelaufene Prüfungen
- Wiederverwendung von Client, Raumauflösung und Plausibilitätsprüfung des
  Zwischenspeichers

**Non-Goals:**
- jede App-Änderung
- HTTP-Cache-Header: Die Raumplan-Endpunkte führen sie bisher ebenfalls nicht, sie
  kommen querschnittlich nach.
- Benachrichtigungszustellung (Push)
- Auftrennen des Plural-Eintrags `Prüfungen 41065 … / 43076 …` in zwei Prüfungen:
  Die Spec verlangt hier ausdrücklich „ohne Modulbezug".

## Decisions

### 1. Zur 70-%-Lücke: hinnehmen, an jede Antwort knüpfen, nichts still weglassen

Die Grundsatzentscheidung steht seit 2026-09-10 in der Spec: hinnehmen und
ausweisen, keine Reaktivierung des Excel-Imports. Dieser Change entscheidet, wie
das Ausweisen technisch aussieht, sodass die App die Lücke nicht übersehen kann:

- **Pflichtfeld statt Dokumentation.** Die Antwort von
  `/stundenplan/pruefungsplan` trägt das Pflichtfeld `vollstaendigkeit` mit
  diesen Feldern:
  - `quelle: "raumplan"`
  - `vollstaendig: false`
  - `abdeckungAnteil: 0.7`
  - `abdeckungGemessenAm: "2026-09-07"`

  Eine Antwort ohne diesen Hinweis gibt es nicht, auch nicht bei leerem Bestand.
  Ein generierter Client, der das Feld ignoriert, fällt in der Typprüfung nicht
  auf; die Pflicht zur Anzeige liegt deshalb bei der App-Umsetzung, die das
  Requirement „Unvollständigkeit ist Teil des Bestands" mit Test nachweisen muss.
- **Gemessener Wert statt Behauptung.** Der Anteil stammt aus dem Spike
  (64 von 91 Modulen, SoSe 2026). Das Messdatum geht mit, damit niemand den Wert
  für eine laufende Messung hält. Er steht als Konstante mit Quellverweis im Code.
  Eine Konfigurationsoption wäre eine Stellschraube, die niemand pflegt — dieselbe
  Bringschuld, an der das Altsystem gescheitert ist. Eine neue Messung ist eine
  Codeänderung mit Spec-Bezug.
- **Kein Fließtext vom Server.** Der Hinweis ist maschinenlesbar. Die App
  formuliert ihn zweisprachig (keine fest verdrahtete Zeichenkette) und kann den
  bekannten Schwerpunkt der Lücke nennen, die wirtschaftswissenschaftlichen
  Module der Wirtschaftsinformatik.
- **Nichts wird still verworfen.** Diese Fälle bleiben im Bestand:
  - Eintrag mit nicht auflösbarem Namensmuster: als Prüfung ohne Modulbezug,
    protokolliert
  - Prüfung ohne erkennbaren Raum: mit leerer Raumliste
  - Prüfung in mehreren Räumen: zusammengeführt, nicht verdoppelt und nicht
    gekürzt

  Vor dem ersten Abruf antwortet der Endpunkt mit 503
  (`pruefungsbestand_nicht_verfuegbar`) statt mit einer leeren Liste.

Verworfene Alternativen:
- Den Hinweis nur in die Spec schreiben: Die App sähe ihn nicht.
- Den Bestand um eine manuell gepflegte Ergänzungsliste erweitern: Das
  widerspricht der Entscheidung vom 2026-09-10.
- Die Lücke je Studiengang ausweisen: Der Raumplan kennt bei Prüfungen keinen
  Studiengang (`courseOfStudy` leer).

### 2. Eigener Abruf über 183 Tage statt Ableitung aus dem 28-Tage-Zwischenspeicher

Die Spec sprach von „dem zwischengespeicherten Raumplan". Der ist aber auf
28 Tage ausgelegt, und das reicht nicht (siehe Proposal). Erwogen wurden drei
Wege:

| Weg | Bewertung |
|---|---|
| Zwischenspeicher auf 183 Tage erweitern | Jeder stündliche Abruf würde rund sechsmal größer. Die Raumsicht braucht davon nichts. |
| Ableitung bei jeder Anfrage live aus INT-009 | Widerspricht „ausschließlich aus dem eigenen Zwischenspeicher". Außerdem gäbe es keinen Vorgängerstand, gegen den sich eine Änderung erkennen ließe. |
| **Eigener Job, gleicher Aufruf, 183 Tage, alle sechs Stunden, nur Prüfungseinträge persistiert** | gewählt |

Das Requirement wird entsprechend geändert. Sechs Stunden, weil Prüfungstermine
sich selten und mit Wochen Vorlauf ändern. Ein Tag wäre für die
Änderungsmeldung zu träge, eine Stunde verschwendete den FBWS. 183 Tage ab
Tagesbeginn decken während der Vorlesungszeit den ganzen folgenden
Prüfungszeitraum ab. Laut Spike lieferte ein ganzes Jahr 9 911 Sätze; ein halbes
Jahr bleibt also im Bereich weniger MB.

Gemeinsam genutzt werden:
- `FbwsRaumplanClient`
- `RaumAufloesung`
- die Zeitraumberechnung: `RaumplanAbruf.ZeitraumAb` bekommt eine Dauer
- die Erkennung des Standardfensters, ausgelagert als statische Methode von
  `RaumplanAbruf`

Am Verhalten des Zwischenspeichers ändert sich nichts.

### 3. Erkennung

Zuerst wird der Name nach NFC normalisiert, weil ein zerlegtes „u + ¨" sonst
nicht passt. Danach gilt:
- **Prüfung:** Der getrimmte Name beginnt mit `Prüfung` oder `Prüfungen`, gefolgt
  von Leerraum oder Ende. So fällt „Prüfungsvorbereitung" nicht hinein.
- **Modulbezug:** `^Prüfung\s+(\d{5,6})\s+(\S.*)$`. Fünf- und sechsstellig nach
  Spike und Curricula, zum Beispiel `411031`.
- **Bezeichnung ohne Modulbezug:** der Rest nach dem Leitwort. Beim Plural-Eintrag
  bleiben die Modulnummern damit im Text, und die Suche nach `41065` findet ihn.
  Das ist der Weg, den die Spec für Nachholprüfungen vorsieht.

`eventType` wird bewusst nicht geprüft. Im Spike sind alle Prüfungseinträge
`Event`. Benennt der Fachbereich den Typ um, bliebe aber jede Prüfung still weg;
eine Namensänderung dagegen fiele über die Warnung bei einem Rückgang auf null
auf (siehe Risiken). `RaumplanEndpoints` klassifiziert `art: pruefung` ebenfalls
allein am Namen.

Nicht auflösbare Einträge werden je Abruf in einer einzigen Warnung mit Anzahl
und Namen protokolliert, nicht in einer Zeile je Eintrag. Sonst wiederholte jeder
Sechs-Stunden-Lauf dieselben Zeilen. Prüfungsnamen tragen keine Personendaten,
`description` wird wie im Zwischenspeicher nie gelesen.

### 4. Datenmodell und Zusammenführung

- `Pruefungstermin`:
  - `Id`
  - `Name`: Originalname, NFC
  - `Modulnummer?`
  - `Bezeichnung`
  - `Beginn`, `Ende`
  - `Raeume`: `List<string>`, über die primitive Sammlung von EF Core 9
    abgebildet: `text[]` in PostgreSQL, JSON im InMemory-Provider der Tests
- `PruefungsbestandStand`: genau eine Zeile mit
  - `AbgerufenAm`
  - `LetzterVersuchAm`
  - `LetzterVersuchErfolgreich`
  - `GeaendertAm`
  - `Von`, `Bis`

Schlüssel der Zusammenführung ist (Name, Beginn, Ende). Die Räume aller
Einträge mit diesem Schlüssel werden vereinigt, ohne `*`, und sortiert. Ein
bestandener Abruf ersetzt den Bestand vollständig in einer Transaktion, wie beim
Zwischenspeicher.

### 5. Änderungserkennung

Vor dem Ersetzen werden zwei Mengen verglichen:
- der neue Bestand
- der alte Bestand, eingeschränkt auf Prüfungen, deren Ende nach dem Beginn des
  neuen Zeitraums liegt

Verglichen wird über (Modulnummer, Bezeichnung, Beginn, Ende, Räume).
Unterscheiden sie sich, wird `GeaendertAm` auf jetzt gesetzt. Die erste Ableitung
zählt als Änderung. Ein Hash im Stand wurde verworfen: Er kann abgelaufene
Prüfungen nicht herausrechnen, ohne den alten Bestand ohnehin zu lesen.
Prüfungen, die am fernen Ende neu ins Fenster rücken, zählen als Änderung. Das
ist ehrlich, denn sie sind für die App neu, und es kommt selten vor.

### 6. Vertrag

Fassung 0.7.1 → 0.8.0, im Projekt üblich für Änderungen vor 1.0, auch brechende
(vgl. 0.6.0 → 0.7.0 beim Mensa-Umbau):
- `Pruefungstermin.roomId` wird `raeume: string[]`.
- Die Antwort erhält das Pflichtfeld `vollstaendigkeit` (Schema
  `Pruefungsbestandsvollstaendigkeit`).
- Die Fehlerantwort 503 wird als eigene Response dokumentiert.
- Die Beschreibung von `Pruefungstermin` nennt die Erkennung am Namen.

Typen entstehen über `tools/contract-codegen`, für Backend und App.

## Risks / Trade-offs

- **[Namensänderung des Fachbereichs]** Schreibt der Fachbereich „Klausur" statt
  „Prüfung", schrumpft der Bestand auf null, und zwar formal korrekt. → Fällt der
  Bestand von mehr als null auf null Prüfungen, obwohl die Antwort Termine
  enthält, protokolliert der Abruf eine Warnung. Er übernimmt den leeren Bestand
  trotzdem: Nach dem Prüfungszeitraum ist „null Prüfungen" ein legitimer Zustand.
- **[Raumangabe im Prüfungsnamen]** Nennt eine Prüfung ihren Raum im Namen
  („… (in Raum C.E.44)"), unterscheiden sich die Namen ihrer Raumeinträge. Dann
  entstehen zwei Prüfungstermine statt einem. → Im Spike nicht beobachtet. Wird es
  sichtbar, wird die Raumangabe vor der Schlüsselbildung entfernt; das ist ein
  eigener Change mit Echtdatenbeleg.
- **[Last]** Ein Abruf über ein halbes Jahr alle sechs Stunden kommt zum
  stündlichen 28-Tage-Abruf hinzu. → Größenordnung laut Spike unkritisch,
  Standard-Resilienz des HTTP-Clients greift.
- **[Abdeckungswert altert]** 70 % gilt für SoSe 2026. → Das Messdatum wird
  mitgeliefert. Eine Nachmessung an den Jahrgangsdateien unter `resources/` steht
  im Spike als offener Punkt.
- **[Vorlauf über 183 Tage]** Einzelne Prüfungen werden über ein halbes Jahr im
  Voraus gebucht (Spike-Maximum 203 Tage). Sie erscheinen erst, wenn sie ins
  Fenster rücken, also immer noch Monate vor dem Termin.

## Migration Plan

Eine EF-Migration legt die Tabellen `Pruefungstermine` und `PruefungsbestandStand`
an. Sie ist rein additiv. Rückweg: Migration zurücknehmen; der
Raumplan-Zwischenspeicher ist nicht betroffen. Bis zum ersten Lauf nach dem
Ausrollen antwortet `/stundenplan/pruefungsplan` mit 503.
