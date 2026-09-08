# INT-009-Spike: Befund und Berichtigung des Raumplan-Registereintrags

## Warum

Roadmap-Schritt 6 und Issue #28 verlangen vor jeder Umsetzung einen Spike auf INT-009, mit zwei Leitfragen: Bildet der Raumplan kurzfristige Ausfälle und Raumänderungen ab oder nur den Sollplan? Und trägt er die Prüfungstermine vollständig und rechtzeitig genug, um den am 2026-09-06 abgeschafften Excel-Upload zu ersetzen?

Der Spike wurde am 2026-09-07 gegen den Live-Dienst durchgeführt. Er beantwortet beide Fragen — die erste **negativ**, die zweite **geteilt**: rechtzeitig ja, vollständig nein. Dazu kommen vier Befunde über den Endpunkt selbst, von denen einer den Registereintrag in seiner tragenden Aussage berichtigt.

Vorgehen und Messwerte stehen vollständig in `design.md`; jeder Befund ist dort mit dem Aufruf hinterlegt, aus dem er stammt.

## Der Befund, ohne den alle anderen falsch werden

**`AllEvents` nimmt einen Zeitraum entgegen — `From` und `To`, groß geschrieben, in Unix-Sekunden.** Ohne diese Parameter liefert der Endpunkt ein Standardfenster von sieben Tagen ab dem Folgetag, und genau das hatte die erste Fassung dieses Spikes für die Reichweite des Bestands gehalten. Mit `From`/`To` reicht er beliebig weit in Vergangenheit und Zukunft: Ein einziger Aufruf über das Jahr 2026 liefert 9 911 Sätze, ein Abruf des Februars 2024 noch 337.

Die Parameternamen stehen nirgends in einer Dokumentation. Sie sind aus der HTML-Ansicht desselben Endpunkts zu gewinnen: `…/AllEvents?Accept=text/html` liefert eine FullCalendar-Seite, deren Skript `From` und `To` beim Blättern zwischen Wochen setzt. Ein Rateversuch mit den naheliegenden Schreibweisen (`from`/`to` klein, `start`/`end`, `days`, `date`, `weeks`, `limit`) bleibt wirkungslos — der Dienst ignoriert unbekannte Parameter stillschweigend, statt zu widersprechen. Das gehört in den Registereintrag, weil jede spätere Prüfung sonst denselben Fehlschluss zieht.

## Was der Spike ergeben hat

**Prüfungstermine stehen rechtzeitig im Raumplan.** Für den Prüfungszeitraum SoSe 2026 (27.07.–04.09.2026) führt der Raumplan 149 Prüfungseinträge. Ihr Feld `modified` — der Zeitpunkt der letzten Änderung, also eine Untergrenze des tatsächlichen Vorlaufs — liegt im Median 55 Tage vor dem Prüfungstermin; 129 der 149 Einträge (87 %) hatten mindestens 42 Tage Vorlauf, nur fünf weniger als 14 Tage. Das deckt den Bedarf: Der Anmeldezeitraum endete am 08.06.2026, rund sieben Wochen vor der ersten Prüfung. **Frage 2 aus Issue #28 ist positiv beantwortet.**

**Vollständig ist er nicht — er deckt 70 % ab, und die Lücke hat System.** Verglichen mit `resources/pplan(4).xlsx` (Prüfungsplan SoSe 2026, 91 Module mit Termin) führt der Raumplan 64 dieser Module; 27 fehlen. Bei 61 der 64 gemeinsamen Module stimmt der Prüfungstag exakt überein, bei drei weicht er ab. Sieben Module führt der Raumplan zusätzlich, die die Excel nicht kennt.

Die 27 fehlenden sind kein Zufallsausfall: Es sind nahezu ausnahmslos wirtschaftswissenschaftliche Module — Einführung in die Wirtschaftsinformatik 1 und 2, Allgemeine BWL, Controlling, Marketing, Finanzmanagement, Investition und Finanzierung, Supply Chain Management, Kostenmanagement, ERP 2, Beschaffungsmanagement und weitere. Sie betreffen die Studiengänge Wirtschaftsinformatik. Die naheliegende Erklärung ist, dass diese Prüfungen in Räumen außerhalb des FB4-Raumplans geschrieben werden. Geprüft ist das nicht — belegt ist nur das Muster. **Frage 1 aus Issue #28 ist negativ beantwortet.**

**Das Namensmuster trägt zu 95 %, aber nicht durchgängig.** 142 der 149 Einträge folgen `Prüfung <Modulnummer> <Bezeichnung>`. Die Abweichungen sind zwei: `Prüfung Softwaretechnik 2` ohne jede Modulnummer, und `Prüfungen 41065 Mathematik für Informatik 1 / 43076 Mathematik für Informatik 4 (Data Science)` — Plural, zwei Module in einem Eintrag. Die bereits spezifizierte Regel, einen nicht auflösbaren Eintrag als Prüfung ohne Modulbezug zu führen und den Vorfall zu protokollieren (SEC-F-060), ist damit belegt notwendig und nicht bloß vorsorglich. **Frage 3 ist beantwortet.**

**Der Raumplan bildet keinen kalendarisch feststehenden Ausfall ab, entfernt aber einzelne abgesagte Sitzungen — ohne Markierung.** Über die Vorlesungszeit SoSe 2026 ist die Zahl der Kursinstanzen je Wochentag praktisch konstant — jeder Montag 166 oder 167, jeder Dienstag 214 bis 216, jeder Freitag durchgängig 95. **Pfingstmontag (25.05.2026) trägt 167 Kursinstanzen, exakt so viele wie der Montag darauf; Fronleichnam (04.06.2026) trägt 174, exakt so viele wie der Donnerstag darauf.** Ein Bestand, der nicht einmal gesetzliche Feiertage ausnimmt, kann für einen kalendarisch bekannten Ausfall keine Auskunft geben.

Eine Rückmeldung aus dem FSR FB4 korrigiert die ursprüngliche Einordnung der drei übrigen Tagesabweichungen (189 statt 192 am 24.06., 216 statt 214 am 14.07., 167 statt 166 am 06.07.) als bloßes Rasterrauschen: Raumänderungen kommen über das Semester vor, und Einzelfälle bei Krankheit oder Ausfall werden korrigiert. Die Nachprüfung auf Instanzebene bestätigt das **vollständig**: Alle drei Abweichungen lösen sich ohne Restdifferenz in sechs einzeln entfernte Sitzungen auf (`IT-Landschaft – Planung und Umsetzung`, `Scientific & Transversal Skills 2`, `Algorithmen und Datenstrukturen`, `Programmierkurs Systemintegration`), jeweils ersatzlos aus dem Bestand entfernt, ohne jede Markierung in `note` oder `description`. Für einen Raumwechsel derselben Sitzung über die Zeit fand sich dagegen kein Beleg — die einzigen Mehrraum-Serien im Beobachtungsfenster waren gleichzeitige Parallelbelegungen, keine Verlegungen; ein neunwöchiges Fenster bietet dafür wenig Gelegenheit. **Die Leitfrage aus Roadmap-Schritt 6 ist damit differenziert beantwortet: kalendarisch feststehende Ausfälle nein, kurzfristige Einzelabsagen ja — als stilles Verschwinden der Instanz, ohne dass der Grund im Bestand steht.**

**59 % der Kursinstanzen tragen keinen Raum, sondern den Pseudoraum `*`.** Von 7 580 Kursinstanzen der Vorlesungszeit stehen 4 473 unter `roomId: "*"`; bei 4 095 davon steht der tatsächliche Raum als Freitext im Namensfeld, etwa `… (in Raum C.E.44)` oder `… (von 09:00-16:30 Uhr, in den Räumen C.3.34 und C.3.32)`. Wer die Raumbelegung allein aus `roomId` bildet, unterschätzt sie erheblich: Liest man die Räume zusätzlich aus dem Namensfeld, steigt die erfasste Belegung um 30 %. Für die Raumsuche ist das der wichtigste praktische Befund des Spikes — sie würde sonst Räume als frei melden, in denen eine Veranstaltung läuft.

**`Room/*/Events` ist kein Sammelaufruf.** Der Stern wird dort nicht als Platzhalter, sondern als echte Raumkennung behandelt — eben jener Pseudoraum. Der Aufruf liefert 502 Sätze, sämtlich mit `roomId: "*"`, und keinen einzigen Termin eines echten Raums; die 13 Termine aus `Room/A.E.01/Events` fehlen darin. `From`/`To` wirkt auf diese Ressource nicht. Nur `AllEvents` versteht den Stern als Platzhalter über alle Räume.

**`Events` und `AllEvents` sind zwei Sichten auf denselben Bestand.** `Events` liefert die **Serien** des Semesters (`eventType: Course`, `id` leer, `interval: "weekly"`, `dateBegin`/`dateEnd` = Semesterspanne, `termId` gesetzt). `AllEvents` liefert die **Einzeltermine**, in die diese Serien ausmultipliziert sind, zusammen mit den Einzelbuchungen (`id` gesetzt, `interval` als Zahl, `dateBegin == dateEnd ==` Termintag, `termId` leer). Kursinstanzen tragen dort `courseId`, `studentSet` und `courseOfStudy` durchgängig — in einer Stichprobe über eine Vorlesungswoche in 1 011 von 1 011 Fällen.

**Zwei kleinere Befunde.** Der bislang nicht erfasste Endpunkt `Room/` liefert die Raumliste (35 Kennungen, darunter `Online`, die Außenstandorte EF38/EF40A/EF44 und der Pseudoraum `*`). Und das Pfadsegment vor `/rest/` ist wirkungslos: `/timetable/ss26/`, `/timetable/ws2627/`, `/timetable/next/` liefern dasselbe wie `/timetable/current/` — eine Semesterwahl über den Pfad gibt es nicht. `current` lieferte am 2026-09-07 noch `SS 26`; der Umschaltzeitpunkt bleibt unbekannt.

## Was sich mit diesem Change ändert

Geändert wird, was der Spike als Tatsache erhoben hat:

- **`integrations`, INT-009** — der Eintrag beschreibt künftig alle drei Ressourcen, die Parameter `From`/`To`, die unterschiedliche Bedeutung des Sterns, das Verhältnis Serien/Einzeltermine, den Pseudoraum mit Raumangabe im Freitext und die Grenzen als Prüfungsquelle.
- **`backend-and-api`, „Raumtermine über Platzhalter-Aufruf beziehen"** — der Abruf nennt künftig den Zeitraum ausdrücklich, statt sich auf das Standardfenster zu verlassen, und verlangt, den Raum aus dem Namensfeld zu lesen, wenn `roomId` den Pseudoraum trägt.
- **`room-finder`, „Raumtermine über den Backend-Zwischenspeicher beziehen"** — Begründung berichtigt; an die App selbst ändert sich nichts.
- **`room-finder`, „Raum als belegt kennzeichnen"** — die Belegung stützt sich nicht allein auf `roomId`.

## Zwei Entscheidungen, die jetzt anstehen

Beide gehören nicht in diesen Change. Issue #28 hält ausdrücklich fest: „Findet er eine Lücke, ist das eine neue Entscheidung — kein stiller Rückfall auf den Upload."

**Reichen 70 % für den Prüfungsbestand?** Der Raumplan ist rechtzeitig und tagesgenau, aber er lässt die wirtschaftswissenschaftlichen Prüfungen aus — für Studierende der Wirtschaftsinformatik fehlt damit ein erheblicher Teil ihres Prüfungsplans, während er für die Informatik-Studiengänge weitgehend vollständig ist. Denkbar sind: den Bestand so nehmen und die Lücke am Prüfungsplan sichtbar ausweisen; den Excel-Import als Ergänzung wieder aufnehmen (INT-013 ist als REMOVED geführt, die Formatanalyse der fünf Jahrgangsdateien ist im Registereintrag erhalten geblieben); oder die Herkunft der fehlenden Prüfungen zuerst beim Fachbereich klären. Die vier betroffenen Requirements bleiben bis zur Entscheidung unverändert im Bestand.

**Was bleibt vom Stundenplan-Raumabgleich?** Die sechs Requirements (`schedule`, vormals SCHED-F-410 bis F-450) sollen Raumänderungen und Ausfälle erkennen. Für einen kalendarisch feststehenden Ausfall wie einen Feiertag liefert der Raumplan keine Auskunft. Für eine kurzfristige Einzelabsage dagegen schon — sie verschwindet ersatzlos aus dem Einzelterminbestand, und genau das ist die Bedingung, die das bereits spezifizierte Requirement „Hinweis auf fehlende Zuordnung im Raumplan" (vormals SCHED-F-430) prüft: ein offizieller Termin, der im aktuellen Raumplan nicht mehr auffindbar ist. Für einen reinen Raumwechsel derselben Sitzung (vormals SCHED-F-420) bleibt unklar, ob er im Bestand ankommt — kein Beleg dafür, aber auch keine Widerlegung. Zu entscheiden bleibt der Zuschnitt in Kenntnis dieser Differenzierung, nicht mehr in der Annahme, der Raumplan trage überhaupt keine Korrektur.

## Eine Randnotiz

**`description` trägt Buchungsvermerke mit Klarnamen.** Zwei Sätze der Stichprobe enthielten Einträge der Form `gebucht von <Vor- und Nachname>`. Das Feld ist bisher als „Freitext, meist leer" geführt. Es gehört nicht in die App-Anzeige; der Registereintrag hält das künftig fest.
