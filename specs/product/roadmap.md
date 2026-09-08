---
id: roadmap
titel: Ausbaustufen und Umsetzungsreihenfolge
status: accepted
version: 0.4.1
owner: FSR FB4
last_reviewed: 2026-09-07
related:
  - ../decisions/0012-zuschnitt-der-ersten-ausbaustufe.md
  - ../decisions/0011-monorepo-und-openapi-vertrag.md
  - ../../openspec/specs/quality-and-testing/spec.md
  - ../README.md
---

# Ausbaustufen und Umsetzungsreihenfolge

## 1. Zweck

Dieses Dokument ordnet die Anforderungen des Spec-Bestands den beiden Ausbaustufen aus `../decisions/0012-zuschnitt-der-ersten-ausbaustufe.md` zu und legt die Reihenfolge der Umsetzung fest. Es enthält **keine** Anforderungen — es verschiebt nur, wann eine bereits spezifizierte Anforderung umgesetzt wird. Ändert sich der Zuschnitt, ändert sich dieses Dokument, nicht die betroffene Spec.

Randbedingung, die den Zuschnitt bestimmt: Die Umsetzung erfolgt nebenher durch eine einzelne Person. Jeder Schritt ist deshalb so geschnitten, dass er für sich abschließbar ist, ein lauffähiges Ergebnis hinterlässt und ohne Gedächtnisverlust unterbrochen werden kann.

## 2. Was die erste Ausbaustufe nicht enthält, und warum

| Zurückgestellt | Blockiert durch | Verweis |
|---|---|---|
| Wiki-Anbindung (WIKI) | API-Zugang seit 2026-08-26 bestätigt, Berechtigungsmodell für interne Inhalte offen; Zuordnung zur zweiten Ausbaustufe bleibt bis zur Klärung unverändert | INT-007, ADR 0005 |
| Notenübersicht (NOTEN) | Kein offizieller Zugang zu HISinOne bekannt | INT-006, ADR 0006 |
| E-Key-Verwaltung (EKEY) | Integrationsart mit dem bestehenden Verwaltungstool offen | INT-014 |
| Event-Kalender (EVENT), Helfer-Anmeldung (HELFER) | Freigabe-URL des ICS-Kalenders offen; HELFER hängt an EVENT | INT-011 |
| Klassifizierung „FB-Aktuelles" in NEWS | Auswertung der Fachbereichsseite ist neu aufzubauen | INT-010 |
| Push-Zustellung samt Benachrichtigungsregeln (NEWS-F-060/070, NEWS-F-230 bis NEWS-F-290, SET-F-010) | Zwei Zustellwege plus Fan-out im Backend; ersetzt durch In-App-Hinweise, die dieselbe Positiv-/Sperrlisten-Auswertung tragen | INT-005, ADR 0008 |
| Freitext-Kommentare und Meldeweg (RATE-F-020, RATE-F-060) | Ohne Moderationsoberfläche nicht rechtssicher betreibbar | IDENT-F-090 bis F-110 |
| Gerichtsfotos (FOTO vollständig) | Vorabfreigabe setzt die Moderationsoberfläche voraus; zusätzlich Nutzungsrechte und Ablagebedarf ungeklärt | IDENT-F-090 bis F-110, `../../openspec/specs/canteen-photos/spec.md` Abschnitt 13 |
| Automatischer Ticket-Bezug | Verfahren der Android-Alt-App sicherheitlich ausgeschlossen | INT-017 |

Fünf dieser neun Punkte hängen an Klärungen außerhalb des Projekts. Sie laufen als Spikes parallel zur ersten Ausbaustufe (Abschnitt 5) und blockieren sie nicht.

## 3. Zuordnung je Feature

Anforderungen ohne Nennung gehören zur ersten Ausbaustufe.

| Spec | Erste Ausbaustufe | Zweite Ausbaustufe |
|---|---|---|
| SHELL | vollständig | – |
| SCHED | vollständig, einschließlich SCHED-F-190 bis F-220 (Prüfungsplan, seit 2026-09-06 in Schritt 6) | – |
| MENSA | vollständig; MENSA-F-085 bis F-110 erst mit Schritt 9, da an die Bewertung gekoppelt | – |
| RAUM | vollständig | – |
| NEWS | NEWS-F-010 bis F-050, F-080, F-110 bis F-140, NEWS-F-150 bis NEWS-F-220 (Filter, Suche, erweiterte Suche) | NEWS-F-060/F-070 (Push), NEWS-F-090 (FB-Aktuelles), NEWS-F-100 (Event-Erinnerungen), NEWS-F-230 bis NEWS-F-290 mit NEWS-N-010 (Benachrichtigungsregeln, zusammen mit Push) |
| RATE | RATE-F-010, F-030 bis F-050, F-070 bis F-090 | RATE-F-020 (Freitext), RATE-F-060 (Melden) |
| TICKET | vollständig | – |
| SET | SET-F-020 bis F-170 (SET-F-170 mit Schritt 9) | SET-F-010 (Push-Schalter) |
| ADMIN | ADMIN-F-010 bis F-110, ADMIN-N-010/020 | ADMIN-F-120 bis F-150 (F-160/F-170 am 2026-09-06 entfallen) |
| FOTO | – | vollständig |
| EVENT, HELFER, WIKI, NOTEN, EKEY | – | vollständig |
| IDENT | IDENT-F-012/015/020/030, F-040/045, F-050/060/065, F-120/130 | IDENT-F-070, F-080 bis F-110 (Moderation), IDENT-N-010/020 |
| ARCH, API, DATA, SEC, UX, NFR, QA | tragend für beide Stufen, Umsetzung schrittweise mit den Features | – |

## 4. Umsetzungsreihenfolge der ersten Ausbaustufe

Vertikale Schnitte: Jeder Schritt umfasst Vertragsanteil, Backend, App und Tests gemeinsam und endet mit einem lauffähigen Stand. Die Reihenfolge folgt zwei Regeln — was andere Schritte trägt, kommt zuerst; und was ohne Anmeldung auskommt, kommt vor dem, was sie braucht.

| Nr | Schritt | Umfasst | Ergebnis |
|---|---|---|---|
| 0 | Fundament | Monorepo, `LICENSE`, CI mit den vier Prüfskripten aus QA Abschnitt 8, Codeerzeugung aus dem Vertrag, App-Gerüst mit Dev-Client, Backend-Gerüst mit Datenbank, Sprachdateien Deutsch und Englisch | Leere App startet auf dem Gerät, Backend antwortet, CI blockiert einen Merge ohne Spec-Delta |
| 1 | Querschnitt | Lade-, Leer-, Fehler- und Offline-Zustand als wiederverwendbare Grundstruktur (ARCH-F-130, ARCH-N-020), Fehlerformat (API-N-040), Zwischenspeicher-Schicht (DATA), Zustimmungs-Gate (SHELL-F-030, SEC-F-010) | Jede folgende Ansicht erbt Zustände und Fehlerbehandlung |
| 2 | App-Rahmen | SHELL vollständig, Erscheinungsbild und Sprachwahl (UX-F-020/030, SET-F-020, SET-F-100/110) | Navigation steht, Bereiche sind leer aber erreichbar |
| 3 | Stammdaten und Verwaltung | API-F-230 bis F-240, ADMIN-F-010 bis F-030, F-070 bis F-110, Anmeldung gegen Authentik | FSR kann Mensen, Räume und Links pflegen; Rollen greifen |
| 4 | Mensaplan | MENSA ohne die bewertungsgekoppelten Lieblingsgerichte (F-085 bis F-110), Zwischenspeicher von INT-015 | Erstes vollständiges Feature, kontofrei, ohne Schreibpfad |
| 5 | Stundenplan | SCHED ohne Prüfungsplan und ohne Raumplan-Abgleich, einschließlich Gruppenlogik, kursbasierter Einrichtung, Datumsbezug, Planungsmodus und Kalender-Export | Meistgenutzte Funktion beider Alt-Apps abgelöst |
| 6 | Raumsuche | RAUM vollständig (einschließlich Raumübersicht, Ansicht laufender Veranstaltungen, Besetzt-Meldungen, Laufwege-Pflege in ADMIN), der Stundenplan-Raumabgleich SCHED-F-410 bis F-450 und der aus dem Raumplan abgeleitete Prüfungsbestand SCHED-F-190 bis F-220 | Erster kontofreier Schreibpfad, erste Offline-Warteschlange |
| 7 | News | NEWS ohne Push und FB-Aktuelles, ADMIN-F-040 bis F-060 | Erste redaktionell gepflegte Inhalte |
| 8 | Semesterticket | TICKET vollständig | Bestandsfunktion abgelöst |
| 9 | Bewertungen | RATE ohne Freitext, Kontopflicht beim Schreiben, RATE-F-100 (lokale Spiegelung); daran gekoppelt MENSA-F-085 bis F-110 und SET-F-170 | Erste kontogebundene Funktion; Lieblingsgerichte entstehen hier |
| 10 | Auslieferung | Store-Auflagen (NFR Abschnitt 9), F-Droid-Recipe, geschlossener Test bei Google Play | Erste Ausbaustufe veröffentlicht |

Zu Schritt 0: Die vier Prüfskripte aus `openspec/specs/quality-and-testing/spec.md` entstehen hier, nicht später — sie sind der Mechanismus, der den spec-anchored Ansatz trägt (NFR-N-140), und ohne sie läuft der Bestand ab dem ersten Merge auseinander.

Zu Schritt 3 vor Schritt 4: Der Mensaplan braucht die Mensa-Liste aus den Stammdaten, die Raumsuche die Raumliste. Die Verwaltungsoberfläche kommt deshalb vor den Features, die von ihr abhängen — nicht als Kür am Ende.

Zu Schritt 6: Der Stundenplan-Raumabgleich (SCHED-F-410 bis F-450) gehört fachlich zum Stundenplan, wird aber hier umgesetzt, weil er den Raumplan-Zwischenspeicher aus RAUM voraussetzt. Der vorab geforderte Spike auf `../../openspec/specs/integrations/spec.md` INT-009 ist am 2026-09-07 durchgeführt (Change `int-009-spike-befund`, Issue #28) und fällt **differenziert** aus: Einen kalendarisch feststehenden Ausfall wie einen Feiertag bildet der Raumplan nicht ab — er führt selbst Pfingstmontag und Fronleichnam 2026 als belegt, mit exakt so vielen Kursinstanzen wie der gleiche Wochentag der Folgewoche. Eine kurzfristige Einzelabsage bei Krankheit oder Ausfall entfernt er dagegen ersatzlos aus dem Bestand, ohne Markierung — nach einem Hinweis des FSR FB4 auf Instanzebene nachvollzogen (sechs Fälle über neun Vorlesungswochen, alle vollständig erklärt). Ein Raumwechsel derselben Sitzung über die Zeit ließ sich im geprüften Semester nicht nachweisen. Ansicht laufender Veranstaltungen und Abgleichhinweis können sich damit auf Einzelabsagen stützen, nicht auf kalendarisch bekannte Unterbrechungen; ob und wie die sechs Abgleich-Requirements das aufgreifen, ist eine offene Entscheidung. Zwei weitere Befunde des Spikes wirken unmittelbar in diesen Schritt hinein: Der Abruf muss den Zeitraum über die undokumentierten Parameter `From`/`To` ausdrücklich setzen, sonst liefert der Endpunkt nur sieben Tage; und 59 % der Kursinstanzen tragen die Pseudo-Raumkennung `*` und nennen ihren Raum nur im Namensfeld — wer das übergeht, meldet rund ein Drittel der belegten Zeit als frei.

Zu Schritt 4: Die Normalisierung der Gerichtsbezeichnungen (RATE-F-050) wird hier bereits mitgezogen, obwohl RATE selbst erst Schritt 9 ist — sie trägt als Gerichtsschlüssel sowohl die Zusammenfassung der Gerichtsliste (MENSA-F-012) als auch später Lieblingsgerichte (MENSA-F-090) und Fotos (FOTO-F-130). Ebenfalls vorgezogen: API-F-235 (App-seitiger Stammdaten-Ausgangsbestand), da MENSA der erste Konsument der Stammdaten ist. Die Lieblingsgericht-Benachrichtigung (MENSA-F-100) läuft rein lokal über die betriebssystemeigene Hintergrundaufgabe plus lokale Benachrichtigungs-API (kein Firebase, kein UnifiedPush) — F-Droid-Tauglichkeit (NFR-N-170) bleibt gewahrt; die tatsächliche Vormittags-Ausführungszeit (MENSA-N-010) ist ein Zielwert, im Prüfprotokoll `../pruefprotokolle/2026-09-04-schritt-4-mensa.md` festgehalten.

Zur Überarbeitung des Mensaplans vom 2026-09-04 (`../../openspec/specs/canteen/spec.md` Fassung 2.6.0): Schritt 4 war damit vorübergehend nicht mehr abgeschlossen. Der Nachlauf zerfällt in zwei Teile. **Teil A, unabhängig von Schritt 9, umgesetzt am 2026-09-04 als Abschluss von Schritt 4:** zusammengefasste Gerichtsliste (MENSA-F-012 bis F-018), Datumsgrenzen und Wischen (MENSA-F-042 bis F-046), Geschlossen-Hinweis (MENSA-F-049), die Ansicht aller Mensen (MENSA-F-120 bis F-150), der Unverträglichkeiten-Filter (MENSA-F-170 bis F-215), die Preisgruppe (MENSA-F-220/F-230 mit SET-F-180/F-190) und das Herunterziehen zum Aktualisieren (MENSA-F-240). Bis auf den serverseitigen Job-Zeitplan (MENSA-N-020 über API-F-076: Ortszeit-Läufe vor den Nutzungsspitzen und nach Mensaschluss statt starrem Intervall) kontofrei und ohne Vertragsänderung, da Zusammenfassung, Filter und Preisanzeige in der App entstehen. Die allgemeinen Lese-Endpunkt-Härtungen API-N-016 (HTTP-Cache-Header/304) und API-N-017 (Ratenbegrenzung kontofreier Leseanfragen) sind bewusst **nicht** Teil dieses Schnitts, sondern ein eigener API-Härtungs-Schnitt. **Teil B, gebunden an Schritt 9:** MENSA-F-085/F-087 (Lieblingsgericht aus der Höchstbewertung), MENSA-F-105 mit SET-F-170 (Abschalter) und die Nachführung von MENSA-F-100/F-110 auf die neue Quelle. Bis Teil B liegt der in Schritt 4 gelieferte Stern-Merker nach MENSA-F-080 im Code, obwohl die Anforderung entfallen ist; das ist bewusst und in der MENSA-Spec unter „Umsetzungsstand" festgehalten, damit der Rückstand nicht als Versehen gelesen wird.

Zum Umfang von Schritt 5 (2026-09-04): Die SCHED-Spec wurde nach Rücksprache mit einer studierenden Person und einem Live-Abgleich gegen FBWS auf Fassung 3.0.0 gehoben — dreizehn Anforderungen geändert, dreiundzwanzig neu (SCHED-F-460 bis F-680). Der Schritt umfasst damit rund siebzig Anforderungen und ist der bislang größte. Erwogen und verworfen wurde, den Planungsmodus als eigenen Schritt abzutrennen; Begründung der Entscheidung: die Terminkollision einer Wiederholerin zwischen zwei Fachsemestern ist dasselbe Problem wie die eines Wahlpflichtmoduls, eine Trennung würde die gemeinsame Konfliktlogik zweimal bauen. Der Schritt wird stattdessen intern in fünf Etappen abgearbeitet (reine Logik, Einrichtung, Plan, Export, Planung), jede für sich mit grünen Tests abgeschlossen.

Zu Schritt 10: Die Testauflage bei Google Play (NFR-N-200: zwölf Testende über vierzehn zusammenhängende Tage) erzeugt allein zwei Wochen Vorlauf und ist bereits während Schritt 8 anzustoßen, nicht erst in Schritt 10.

## 5. Parallel laufende Klärungen

Diese Punkte sind nicht Teil der Umsetzungsreihenfolge, sondern laufen unabhängig davon. Jeder von ihnen entscheidet über einen Baustein der zweiten Ausbaustufe.

| Klärung | Wer | Wovon sie abhängt | Was sie freischaltet |
|---|---|---|---|
| App-Registrierung im Microsoft-Mandanten der FH | FSR FB4 mit Hochschul-IT | Freigabe durch die Hochschule | Anmeldung mit Hochschulkonto statt eigenem Konto |
| Zugang zu HISinOne für Drittanwendungen | FSR FB4 mit Hochschul-IT | Existenz eines offiziellen Zugangs | NOTEN, ggf. Ticket-Bezug |
| BookStack-Instanz: freigegebene Inhalte / Berechtigungsmodell (Erreichbarkeit und Token seit 2026-08-26 bestätigt) | FSR FB4 | Eigener Betrieb, keine Fremdabhängigkeit | WIKI |
| Integrationsart mit dem E-Key-Verwaltungstool | Technische Leitung | Schnittstelle oder Datenbankzugriff | EKEY |
| Freigabe-URL des FSR-Kalenders | FSR FB4 | Eigene Konfiguration | EVENT, HELFER |
| Auswertung der Fachbereichsseite `aktuelles-ni` | Technische Leitung | Aktueller Seitenaufbau | NEWS-F-090 |
| AVV mit Hetzner (Hosting) und ggf. Google (iOS-Push-Bridge) abschließen | FSR FB4 | Vertragsabschluss vor Produktivbetrieb mit personenbezogenen Daten | Rechtssicherer Betrieb ab Schritt 3 |
| ~~Trägt INT-009 kurzfristige Raumänderungen sowie den Prüfungsbestand vollständig und rechtzeitig?~~ | Technische Leitung | ~~Live-Beobachtung des Raumplans über mehrere Wochen~~ | **Beantwortet am 2026-09-07** (Change `int-009-spike-befund`, Issue #28): Kalendarisch feststehende Ausfälle **nein**, kurzfristige Einzelabsagen **ja** (stilles Entfernen der Instanz), Raumwechsel derselben Sitzung unbelegt; Prüfungstermine rechtzeitig (Median 55 Tage Vorlauf), aber nur zu 70 % vollständig. Zwei Folgeentscheidungen offen — Zuschnitt des Raumabgleichs und Umgang mit der Prüfungslücke |

Zwei der verbliebenen offenen Punkte liegen vollständig im eigenen Einflussbereich (BookStack, Kalender-URL) und können jederzeit erledigt werden. Vier hängen von Dritten ab und werden früh angestoßen, damit die Wartezeit parallel zur ersten Ausbaustufe verstreicht statt danach. Der INT-009-Punkt ist erledigt; er brauchte keine wochenlange Beobachtung, sondern einen Abruf mit den richtigen Zeitraum-Parametern gegen einen zurückreichenden Bestand.

## 6. Was diese Reihenfolge bewusst nicht tut

Sie priorisiert **nicht** nach Nutzungshäufigkeit. Der Stundenplan ist die meistgenutzte Funktion beider Alt-Apps und käme danach zuerst; er steht hier trotzdem an fünfter Stelle. Grund: Er ist zugleich die fachlich anspruchsvollste Funktion (Gruppenlogik mit belegten Fehlern in beiden Alt-Apps, Planungsmodus, Kalender-Export), und ihn ohne erprobtes Fundament, ohne Querschnittszustände und ohne Stammdatenpflege anzugehen, hieße, drei Baustellen gleichzeitig zu öffnen. Der Mensaplan davor ist fachlich einfach genug, um die Architektur an einem vollständigen Feature zu erproben, bevor die schwierige Fachlogik folgt.

Sie geht auch **nicht** davon aus, dass alles in dieser Reihenfolge fertig wird. Nach Schritt 4 existiert eine App, die etwas Nützliches tut; nach jedem weiteren Schritt eine, die mehr tut. Ein Abbruch nach Schritt 7 hinterlässt ein auslieferbares Ergebnis, kein Fragment.

## 7. Offene Fragen

- Umbenennung der bestehenden Anforderungs-ID-Verweise in Testnamen (`app/`, `backend/`, z. B. `describe('SCHED-F-080 …')`) auf die neuen OpenSpec-Requirement-Titel nach der Umstellung auf OpenSpec (ADR 0019) — eigener, separater Schritt, Umfang und Zeitpunkt noch offen.
- Zeitpunkt der ersten Auslieferung. Eine Kopplung an den Semesterbeginn liegt nahe, da Erstsemester laut `vision.md` die Zielgruppe mit dem höchsten Informationsbedarf sind — das setzt allerdings voraus, dass die Google-Play-Testauflage rechtzeitig davor abgeschlossen ist.
- Ob die zweite Ausbaustufe als eine Auslieferung erfolgt oder je Feature, sobald dessen Klärung vorliegt.
- Ob die Android-Alt-App bis zur Auslieferung der ersten Ausbaustufe weitergepflegt wird oder unverändert im Store bleibt.
