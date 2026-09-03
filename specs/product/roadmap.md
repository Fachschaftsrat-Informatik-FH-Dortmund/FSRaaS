---
id: roadmap
titel: Ausbaustufen und Umsetzungsreihenfolge
status: accepted
version: 0.1.4
owner: FSR FB4
last_reviewed: 2026-09-03
related:
  - ../decisions/0012-zuschnitt-der-ersten-ausbaustufe.md
  - ../decisions/0011-monorepo-und-openapi-vertrag.md
  - ../platform/quality-and-testing.md
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
| Prüfungsplan im Stundenplan (SCHED-F-190 bis F-220) | Excel-Format erst grob erfasst, Jahrgangsvarianz zu klären | INT-013 |
| Push-Zustellung (NEWS-F-060/070, SET-F-010) | Zwei Zustellwege plus Fan-out im Backend; ersetzt durch In-App-Hinweise | INT-005, ADR 0008 |
| Freitext-Kommentare und Meldeweg (RATE-F-020, RATE-F-060) | Ohne Moderationsoberfläche nicht rechtssicher betreibbar | IDENT-F-090 bis F-110 |
| Automatischer Ticket-Bezug | Verfahren der Android-Alt-App sicherheitlich ausgeschlossen | INT-017 |

Sechs dieser neun Punkte hängen an Klärungen außerhalb des Projekts. Sie laufen als Spikes parallel zur ersten Ausbaustufe (Abschnitt 5) und blockieren sie nicht.

## 3. Zuordnung je Feature

Anforderungen ohne Nennung gehören zur ersten Ausbaustufe.

| Spec | Erste Ausbaustufe | Zweite Ausbaustufe |
|---|---|---|
| SHELL | vollständig | – |
| SCHED | SCHED-F-010 bis F-180, F-230 bis F-260, F-270 bis F-450 | SCHED-F-190 bis F-220 (Prüfungsplan) |
| MENSA | vollständig | – |
| RAUM | vollständig | – |
| NEWS | NEWS-F-010 bis F-050, F-080, F-110 bis F-140 | NEWS-F-060/F-070 (Push), NEWS-F-090 (FB-Aktuelles), NEWS-F-100 (Event-Erinnerungen) |
| RATE | RATE-F-010, F-030 bis F-050, F-070 bis F-090 | RATE-F-020 (Freitext), RATE-F-060 (Melden) |
| TICKET | vollständig | – |
| SET | SET-F-020 bis F-150 | SET-F-010 (Push-Schalter) |
| ADMIN | ADMIN-F-010 bis F-110, ADMIN-N-010/020 | ADMIN-F-120 bis F-170 |
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
| 4 | Mensaplan | MENSA vollständig, Zwischenspeicher von INT-015 | Erstes vollständiges Feature, kontofrei, ohne Schreibpfad |
| 5 | Stundenplan | SCHED ohne Prüfungsplan und ohne Raumplan-Abgleich, einschließlich Gruppenlogik, Planungsmodus, Kalender-Export | Meistgenutzte Funktion beider Alt-Apps abgelöst |
| 6 | Raumsuche | RAUM vollständig (einschließlich Raumübersicht, Ansicht laufender Veranstaltungen, Besetzt-Meldungen, Laufwege-Pflege in ADMIN) und der Stundenplan-Raumabgleich SCHED-F-410 bis F-450 | Erster kontofreier Schreibpfad, erste Offline-Warteschlange |
| 7 | News | NEWS ohne Push und FB-Aktuelles, ADMIN-F-040 bis F-060 | Erste redaktionell gepflegte Inhalte |
| 8 | Semesterticket | TICKET vollständig | Bestandsfunktion abgelöst |
| 9 | Bewertungen | RATE ohne Freitext, Kontopflicht beim Schreiben | Erste kontogebundene Funktion |
| 10 | Auslieferung | Store-Auflagen (NFR Abschnitt 9), F-Droid-Recipe, geschlossener Test bei Google Play | Erste Ausbaustufe veröffentlicht |

Zu Schritt 0: Die vier Prüfskripte aus `../platform/quality-and-testing.md` Abschnitt 8 entstehen hier, nicht später — sie sind der Mechanismus, der den spec-anchored Ansatz trägt (NFR-N-140), und ohne sie läuft der Bestand ab dem ersten Merge auseinander.

Zu Schritt 3 vor Schritt 4: Der Mensaplan braucht die Mensa-Liste aus den Stammdaten, die Raumsuche die Raumliste. Die Verwaltungsoberfläche kommt deshalb vor den Features, die von ihr abhängen — nicht als Kür am Ende.

Zu Schritt 6: Der Stundenplan-Raumabgleich (SCHED-F-410 bis F-450) gehört fachlich zum Stundenplan, wird aber hier umgesetzt, weil er den Raumplan-Zwischenspeicher aus RAUM voraussetzt. Vorab ist der Spike aus `../platform/integrations.md` INT-009 zu klären (bildet der Raumplan kurzfristige Ausfälle/Raumänderungen ab?); fällt er negativ aus, bleiben Ansicht laufender Veranstaltungen und Abgleichhinweis auf den Sollplan beschränkt.

Zu Schritt 4: Die Normalisierung der Gerichtsbezeichnungen (RATE-F-050) wird hier bereits mitgezogen, obwohl RATE selbst erst Schritt 9 ist — MENSA-F-090 (Lieblingsgerichte) braucht denselben normalisierten Gerichtsschlüssel als Bindeglied, siehe `../features/canteen/spec.md` MENSA-F-090. Ebenfalls vorgezogen: API-F-235 (App-seitiger Stammdaten-Ausgangsbestand), da MENSA der erste Konsument der Stammdaten ist. Die Lieblingsgericht-Benachrichtigung (MENSA-F-100) läuft rein lokal über die betriebssystemeigene Hintergrundaufgabe plus lokale Benachrichtigungs-API (kein Firebase, kein UnifiedPush) — F-Droid-Tauglichkeit (NFR-N-170) bleibt gewahrt; die tatsächliche Vormittags-Ausführungszeit (MENSA-N-010) ist ein Zielwert, im Prüfprotokoll `../pruefprotokolle/2026-09-04-schritt-4-mensa.md` festgehalten.

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
| Prüfungsplan-Format über mehrere Jahrgänge | Technische Leitung | Dateien liegen unter `resources/` vor | SCHED-F-190 bis F-220 |

Drei davon liegen vollständig im eigenen Einflussbereich (BookStack, Kalender-URL, Prüfungsplan-Format) und können jederzeit erledigt werden. Vier hängen von Dritten ab und werden früh angestoßen, damit die Wartezeit parallel zur ersten Ausbaustufe verstreicht statt danach.

## 6. Was diese Reihenfolge bewusst nicht tut

Sie priorisiert **nicht** nach Nutzungshäufigkeit. Der Stundenplan ist die meistgenutzte Funktion beider Alt-Apps und käme danach zuerst; er steht hier trotzdem an fünfter Stelle. Grund: Er ist zugleich die fachlich anspruchsvollste Funktion (Gruppenlogik mit belegten Fehlern in beiden Alt-Apps, Planungsmodus, Kalender-Export), und ihn ohne erprobtes Fundament, ohne Querschnittszustände und ohne Stammdatenpflege anzugehen, hieße, drei Baustellen gleichzeitig zu öffnen. Der Mensaplan davor ist fachlich einfach genug, um die Architektur an einem vollständigen Feature zu erproben, bevor die schwierige Fachlogik folgt.

Sie geht auch **nicht** davon aus, dass alles in dieser Reihenfolge fertig wird. Nach Schritt 4 existiert eine App, die etwas Nützliches tut; nach jedem weiteren Schritt eine, die mehr tut. Ein Abbruch nach Schritt 7 hinterlässt ein auslieferbares Ergebnis, kein Fragment.

## 7. Offene Fragen

- Zeitpunkt der ersten Auslieferung. Eine Kopplung an den Semesterbeginn liegt nahe, da Erstsemester laut `vision.md` die Zielgruppe mit dem höchsten Informationsbedarf sind — das setzt allerdings voraus, dass die Google-Play-Testauflage rechtzeitig davor abgeschlossen ist.
- Ob die zweite Ausbaustufe als eine Auslieferung erfolgt oder je Feature, sobald dessen Klärung vorliegt.
- Ob die Android-Alt-App bis zur Auslieferung der ersten Ausbaustufe weitergepflegt wird oder unverändert im Store bleibt.
