---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-09
---

# Prüfprotokoll — Wochenansicht Nutzerführung: Zeitachse, Stapel, Gestaltungsfragen

Datum: 2026-09-09
Prüfer: FSR FB4 (Gerätetest, Android, helles und dunkles Erscheinungsbild)
Grundlage: `openspec/changes/stundenplan-wochenansicht-nutzerfuehrung/` (proposal,
design, specs, tasks) Block 9, Aufgaben 9.1 und 9.2.

Deckt die Punkte ab, für die `quality-and-testing` Abschnitt 3 ein datiertes
Prüfprotokoll statt eines automatisierten Tests zulässt (Gestaltung,
Barrierefreiheit).

**Ergebnis in einem Satz:** Die Zeitachse in ihrer geprüften Gestalt ist
durchgefallen. Vier gestalterische Mittel dieses Changes — Rahmen um die Lücke,
Bruchzeichen, Stundenlinien und der aufklappbare Stapel — werden am Gerät nicht
als hilfreich, sondern als Beiwerk erlebt und ersatzlos zurückgenommen. Die
tragende Entscheidung, lange Lücken zu stauchen und die Dauer zu beschriften,
bleibt bestehen und hat sich bewährt.

## 1. Zeitachse und Stapel (Aufgabe 9.1)

| Prüfpunkt | Ergebnis |
|---|---|
| Gestauchte Lücke als Lücke erkennbar, Kachelhöhen vergleichbar | **nicht bestanden** — Stauchung und Dauerangabe tragen, aber der Rahmen um die Lücke lässt sie wie einen Termin wirken. Rahmen entfällt |
| Bruchzeichen `⌇` samt Dauerangabe lesbar und als Unterbrechung verständlich | **nicht bestanden** — das Bruchzeichen ist überflüssig und entfällt. Die Dauerangabe allein trägt die Aussage und bleibt |
| Stundenlinien laufen vor und nach der Stauchung weiter, fehlen innerhalb | **gegenstandslos** — die Stundenlinien entfallen vollständig |
| Kontrast der Stundenlinien in hell und dunkel | **gegenstandslos** — siehe oben |
| Bedienbarkeit des Stapels: Aufklappen, nichts verdeckt, Trefferfläche 44×44 dp | **nicht bestanden** — die Bedienung ist schlecht. Die Stapelung entfällt vollständig |

**Begründung zur Stapelung:** Mehr als drei überschneidende Termine sind ein
Randfall, den die Nutzerin selbst herbeiführt, indem sie entsprechend viele
Veranstaltungen wählt. Für diesen Fall besteht mit der nicht maßstabsgetreuen
Ansicht bereits ein tragfähiger Weg. Ein eigener Bedienweg in der Zeitachse
rechtfertigt seinen Aufwand und seine Bedienlast damit nicht.

**Was bleibt:** Die Stauchung langer Lücken auf Stundenhöhe (`dayLayout.ts`,
Entscheidung 1) und die Beschriftung mit der echten Dauer über `dauerText()`.
Beides hat sich am Gerät bewährt und ist der eigentliche Gewinn dieses Changes
gegenüber der linearen Achse.

## 2. Gestaltungsfragen (Aufgabe 9.2, `design.md` Open Questions)

| Frage | Entscheidung |
|---|---|
| Mindestbreite je Kachel zusätzlich zur Kappung auf drei | **gegenstandslos** — mit dem Entfall der Stapelung entfällt auch die Kappung, die eine Mindestbreite ergänzen sollte |
| Gestalt eines Termins bei abgeschalteter Farbautomatik — neutrale Fläche oder Umriss | **neutrale Fläche** |
| Zwölf Farbkreise im Termindetail dauerhaft sichtbar oder hinter einem Bedienschritt | **dauerhaft sichtbar** |

## 3. Fehler an der Farbautomatik (Fund aus Frage 2)

Beim Prüfen der zweiten Gestaltungsfrage fiel auf, dass sich die Farbautomatik
**praktisch nicht abschalten lässt**: Der Schalter im Ansichts-Blatt schreibt
`farbautomatik: false`, ein bestehender Plan bleibt aber unverändert bunt.

Ursache: Die Farbe wird beim Anlegen eines Eintrags fest in den Eintrag
geschrieben (`PlanungScreen.baueSessionEintrag`, `TerminEditorScreen`) und
danach nur noch gelesen. Der Schalter wirkt deshalb ausschließlich auf Einträge,
die nach dem Abschalten entstehen. Die vorhandenen Tests prüfen genau diesen
Fall (`PlanungScreen.test.tsx`, `TerminEditorScreen.test.tsx`,
`ansichtEinstellungen.test.ts`) und decken das Verhalten bei bestehendem Plan
nicht ab — deshalb ist die Lücke der Aufgabe 8.3 entgangen.

Das verfehlt das Requirement „Farbwahl je Termin", das die automatische
Zuweisung „als solche" abschaltbar verlangt.

**Entschiedene Abhilfe:** Am Eintrag wird festgehalten, ob seine Farbe von der
Nutzerin stammt oder automatisch vergeben wurde. Ist die Automatik abgeschaltet,
erscheinen automatisch eingefärbte Einträge in der neutralen Fläche, von der
Nutzerin gewählte Farben bleiben in jedem Fall erhalten — auch dann, wenn sie
bei eingeschalteter Automatik gesetzt wurden und die Automatik danach
abgeschaltet wird.

## 4. Nebenfunde außerhalb dieses Changes

Aus demselben Gerätetest, bewusst **nicht** in diesen Change aufgenommen:

1. **Fehler im Planungsmodus:** Das Antippen eines Moduls wählt mehrere weitere
   Module mit aus. Deutlichstes Beispiel: „Technisches Englisch".
2. **Modulnamen im Planungsmodus:** Die frühere Rückmeldung, Module wie
   „Technisches Englisch" ohne Zahl zu schreiben, galt allein der Kursauswahl.
   Im Planungsmodus sollen die Namen so erscheinen, wie das Backend sie liefert.
3. **Aliase für Module:** Modulen soll ein Kurzname zugewiesen werden können,
   durch die Nutzerin selbst setzbar. Die Standardwerte sind über die
   Verwaltungsoberfläche konfigurierbar und greifen, sobald die Feldbreite im
   Stundenplan für den vollen Namen nicht mehr ausreicht. Beispiele:
   „Algorithmen und Datenstrukturen" → „AuD", „Mathematik für Informatiker 1" →
   „MaFI 1".
4. **Bestätigungsdialoge als Pop-up:** Die Rückfrage nach dem Geltungsbereich
   einer Farbwahl erscheint derzeit am Seitenende. Bestätigungsdialoge sollen in
   der gesamten Anwendung als Pop-up erscheinen.

## 5. Offene Punkte

- Die Punkte aus Abschnitt 1 und der Fehler aus Abschnitt 3 sind
  Verhaltensänderungen und brauchen ein Spec-Delta im selben Merge (CLAUDE.md).
  Da die betroffenen Requirements von diesem Change selbst stammen und noch
  nicht archiviert sind, werden sie in dessen eigenem Delta zurückgenommen —
  nach dem Muster des Prüfprotokolls vom 2026-09-09
  (`2026-09-09-stundenplan-bedienung-ohne-vormerkung.md`, Abschnitt 3).
- Die vier Nebenfunde aus Abschnitt 4 gehen in ein eigenes Issue und von dort in
  einen eigenen `openspec/changes/`-Vorschlag.
