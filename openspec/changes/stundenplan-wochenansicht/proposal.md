# Wochenansicht des Stundenplans

## Warum

Der Stundenplan ist die meistgenutzte Funktion beider Alt-Apps und steht an erster Stelle der Tab-Leiste — aber `app/src/areas/schedule/screens/ScheduleScreen.tsx` ist sieben Zeilen lang und rendert `<ComingSoon />`. Dahinter liegt eine vollständige, getestete Logikschicht: `dayLayout.ts`, `jetzt.ts`, `wochenrechnung.ts`, `wochentage.ts`, `ansichtEinstellungen.ts` und `semesterwechsel.ts` werden von **keinem** Bildschirm und keiner Route importiert. Neunzehn Anforderungen sind damit fertig ausprogrammiert und für die Nutzerin unsichtbar.

Die Durchsprache vom 2026-09-06 (`herkunft-schedule-durchsprache`) hat den Anforderungsbestand dieser Capability vollständig geprüft und dabei ausdrücklich festgehalten, dass es keine laufende Implementierung gibt, auf die sich eine Bestätigung stützen könnte. Der Spec-Weg ist an dieser Stelle ausgeschöpft: Das nächste belastbare Prüfsignal für die rund siebzig Anforderungen von Roadmap-Schritt 5 entsteht erst aus laufendem Code.

Zwei Anforderungslücken sind beim Zuschnitt dieses Schnitts aufgefallen und werden hier mitbehoben, weil die Darstellung sonst auf einem falschen Modell aufsetzt.

## Was sich ändert

**Die Wochenansicht entsteht** und verdrahtet die vorhandene Logik: Wochentagsleiste mit bedarfsweisem Samstag und Belegungsvorschau, Kalenderdatum je Tag, Blättern über Wochengrenzen, Gültigkeitszeitraum, Kennzeichnung vorlesungsfreier Wochen, proportionale Zeitachse mit Lücken und der Schalter dagegen, Nebeneinanderdarstellung überschneidender Termine, laufender und nächster Termin samt Hervorhebung der aktuellen Uhrzeit.

**Eigene Termine werden bedienbar.** Anlegen, Kennzeichnen, Bearbeiten und Löschen über einen sichtbaren Weg, mit Zusatzangaben, wiederkehrend oder einmalig, und der Kennzeichnung als Prüfung. Der Termin-Editor ist der erste Schreibpfad des Stundenplans; er schreibt ausschließlich lokal (`planStore.ts`, DATA-F-010).

**Der Konflikthinweis bekommt ein tragfähiges Modell.** Bisher trägt jeder Eintrag ein Boolean `akzeptierterKonflikt`. Ein Konflikt ist aber eine Beziehung zwischen zwei Terminen, und die Anforderung sagt selbst, das *Terminpaar* trage die Kennzeichnung. Mit einem Eintrags-Flag entsteht folgender Ablauf: A und B kollidieren, die Nutzerin nimmt die Kollision an, löscht B und legt C zur selben Zeit an — A trägt das Flag weiter, die neue, nie angenommene Kollision bleibt stumm. Die Durchsprache hat die Dauerwarnung beseitigt und dabei die umgekehrte Fehlerart ermöglicht: eine verschwiegene Kollision. Künftig wird die Annahme über die Kennung des Gegenparts geführt.

**Das Verhalten ohne Tagessprung wird geregelt.** Die Anforderung „Sprung zum aktuellen Wochentag" beschreibt nur den aktiven Fall. Was die App zeigt, wenn die Einstellung abgeschaltet ist, steht nirgends — entsprechend liest heute niemand das Feld `sprungZuHeute`, es ist geschrieben und umschaltbar, aber wirkungslos. Künftig kehrt die App zur zuletzt betrachteten Woche und deren Wochentag zurück.

**Der Schalter „alle Filter abschalten" wird gebaut** (Anforderung besteht bereits). Er wirkt als Überlagerung: die drei bestehenden Filtereinstellungen bleiben unangetastet und wirken nach dem Zurücknehmen unverändert weiter, wie die Anforderung es verlangt.

## Betroffene Capabilities

### Neue Capabilities

Keine.

### Geänderte Capabilities

- `schedule`: zwei Requirements ändern sich — „Konflikthinweis bei festen Terminen" und „Bewusste Übernahme trotz Konflikt" führen die Annahme künftig am Terminpaar statt am einzelnen Eintrag; „Sprung zum aktuellen Wochentag" regelt zusätzlich den abgeschalteten Fall.

Keine neuen und keine entfallenden Anforderungen. Der Schalter zum Abschalten aller Filter steht seit dem 2026-09-06 in der Capability und wird hier nur umgesetzt.

## Umfang

Roadmap-Schritt 5, Etappe 3 (Plan). Der Schnitt umfasst 19 Anforderungen, deren Logik bereits vorliegt und nur verdrahtet wird, sowie 12 Anforderungen, die neu entstehen.

**Bewusst nicht Teil dieses Schnitts:**

- **Etappe 4 (Export)** — iCal-Export, Kalenderexport in den Gerätekalender, vorbelegter Exportzeitraum, gleichrangiger Datei-Export, Auswahl der Terminarten beim Export.
- **Etappe 5 (Planungsmodus)** — Kandidatenauswahl, Kriterienrangfolge, Voreinstellungen, Anpinnen, Pflicht-Markierung, automatischer Vorschlag, Vorbereitungszeiten. Eine Ausnahme: die Anforderung „Bewusste Übernahme trotz Konflikt" liegt formal in diesem Block, wird aber von „Konflikthinweis bei festen Terminen" im Text vorausgesetzt und deshalb hier mitgeführt.
- **Roadmap-Schritt 6** — der Abgleich mit dem Raumplan (sechs Anforderungen) und der aus dem Raumplan abgeleitete offizielle Prüfungsbestand. Beide setzen den INT-009-Spike voraus (Issue #28). Die lokale Kennzeichnung eines *eigenen* Termins als Prüfung gehört dagegen in diesen Schnitt, sie hängt an keiner Fremdquelle.

Alles ist reine Gerätelogik und Darstellung: kein Backend-Anteil, keine Änderung an `openspec/specs/api-contract.yaml`, kein neuer Aufruf gegen ein Fremdsystem.

## Offene Punkte

Der Abschnitt „Offene Fragen" der Capability `schedule` wird von diesem Schnitt nicht berührt; die dort verzeichneten Klärungen betreffen den Raumplan-Abgleich und den Prüfungsbestand, also Roadmap-Schritt 6. Aus `specs/open-questions.md` ist keine Frage betroffen.

## Auswirkung

- `app/src/areas/schedule/` — neues Konfliktmodul; `typen.ts` und `planStore.ts` folgen dem geänderten Konfliktmodell; `ansichtEinstellungen.ts` bekommt die Überlagerung und den zuletzt betrachteten Tag.
- `app/src/areas/schedule/screens/` — `ScheduleScreen.tsx` löst `<ComingSoon />` ab; Termindetails und Termin-Editor kommen hinzu.
- `app/app/(tabs)/(schedule)/` — zwei Routen mehr, weiterhin reine Re-Exporte (SHELL-F-050).
- Sprachdateien Deutsch und Englisch (NFR-F-115).
- Keine Änderung an `backend/`, am Vertrag oder an `openspec/specs/integrations/spec.md`.
