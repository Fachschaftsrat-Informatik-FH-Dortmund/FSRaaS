---
titel: Konzept zur Nutzerführung
status: accepted
version: 0.2.0
owner: FSR FB4
last_reviewed: 2026-09-02
related:
  - spec.md
  - ../../platform/ux-and-theming.md
  - ../../decisions/0013-zustand-navigation-und-netzwerkschicht.md
zweck: >
  Vorüberlegung zu Roadmap-Schritt 2 (App-Rahmen). Kein akzeptierter
  Anforderungsbestand: Dieses Dokument definiert keine Anforderungen und
  vergibt keine IDs. Abschnitt 12 beschreibt, welche Anforderungen aus
  diesem Konzept in SHELL, UX und SET entstehen sollen — erst deren Merge
  (mit realer ID-Vergabe und ID-tragendem Test) ändert Verhalten.
---

# Konzept zur Nutzerführung

## 1. Einordnung

Dieses Konzept beschreibt, wie sich Nutzerinnen und Nutzer in der App
zurechtfinden: wie sie zu einem Ziel gelangen, wie sie erkennen, wo sie
sind, wie sie erfahren, was als Nächstes zu tun ist, und wie die App auf
ihre Handlungen antwortet.

Es erfindet die Navigationsstruktur nicht neu — die ist in
`spec.md` (SHELL-F-010/060) und `../../decisions/0013-zustand-navigation-und-netzwerkschicht.md`
entschieden: Tab-Leiste mit vier Bereichen plus „Mehr", datei-basiert über
Expo Router. Das Konzept füllt die Lücke zwischen dieser Grobstruktur und
der Bildschirmgestaltung der einzelnen Features.

Bezugsrahmen sind die bereits geltenden Regeln:

- **SHELL-F-020 / ARCH-F-090** — jedes der sieben Kernfeatures in höchstens
  zwei Interaktionsschritten von der Startseite aus.
- **UX-F-070 / UX-F-090** — keine Bedeutung allein über Farbe; für jede
  Gesten-Aktion ein zweiter, sichtbarer Bedienweg.
- **UX-F-100 / UX-F-110 / ARCH-F-130** — für jede Ansicht Lade-, Leer-,
  Fehler- und Offline-Zustand; der Leerzustand nennt den nächsten Schritt.
- **UX-F-050 / UX-F-060 / UX-N-020** — dynamische Schriftgröße,
  Vorleser-Beschriftung, 44×44 dp Mindestgröße.
- **SHELL-F-030 / SEC-F-010** — Zustimmungs-Gate beim Erststart,
  zurückstellbar, Basisfunktionen bleiben nutzbar.

## 2. Leitgedanken

1. **Erkennen statt erinnern.** Jede Handlungsmöglichkeit ist sichtbar
   oder über ein sichtbares Element erreichbar. Nichts Wichtiges liegt
   allein hinter langem Drücken, Wischen oder Vorwissen (UX-F-090).
2. **Führung im Kontext, nicht vorab.** Statt eines Onboarding-Karussells
   erklärt die App eine Funktion dort, wo sie gebraucht wird — im
   Leerzustand, als einzeiliger Hinweis, als Beispiel.
3. **Zwei Schritte zum Kern.** Die tägliche Nutzung (Stundenplan,
   Mensaplan, News, Raumsuche) ist einen Tap entfernt; alles Übrige einen
   weiteren. Kein Kernfeature liegt tiefer (SHELL-F-020).
4. **Immer beantwortbar: Wo bin ich, was kann ich hier, wie komme ich
   zurück.** Jeder Bildschirm hat einen Titel, einen klaren Rückweg und
   höchstens eine hervorgehobene Aktion.
5. **Der Zustand der App ist ablesbar.** Lädt sie, ist etwas leer,
   ging etwas schief, bin ich offline, sind die Daten alt — das steht
   auf dem Bildschirm, einheitlich gestaltet (UX-F-130/140, DATA-F-090).
6. **Kein Datenverlust ohne Rückfrage** (UX-F-120, DATA-F-020) und keine
   stillen Fehler (SEC-F-060) — beides sind Führungsversprechen, keine
   reinen Sicherheitsregeln.

## 3. Informationsarchitektur

### 3.1 Tab-Leiste

Vier feste Einträge (SHELL-F-060), in dieser Reihenfolge:

| Position | Bereich | Symbol (fachlich, UX-F-150) |
|---|---|---|
| 1 | Stundenplan | Kalender/Raster |
| 2 | Mensaplan | Besteck |
| 3 | News | Sprechblase/Zeitung |
| 4 | Raumsuche | Lupe/Grundriss |
| 5 | **Mehr** | Punkte-Menü |

Beschriftung immer sichtbar (kein reines Icon-Tab), damit die Bereiche
ohne Symbolkenntnis benennbar sind. Aktiver Tab durch Akzentfarbe
**und** gefülltes Symbol markiert (UX-F-070).

### 3.2 „Mehr"-Ebene

„Mehr" ist ein eigener Stack mit einer gruppierten Liste. Gruppen mit
Zwischenüberschrift, damit die Liste bei wachsendem Funktionsumfang
lesbar bleibt (ARCH-N-010):

- **Mein Studium** — Semesterticket, Notenübersicht¹, E-Key¹
- **Fachschaft** — Events¹, Helfer-Anmeldung¹, Wiki¹
- **App** — Einstellungen, Rückmeldung an den FSR (SET-F-140),
  Über die App (SET-F-130), Datenschutzerklärung (SET-F-060),
  Lizenzhinweise (SET-F-080)

¹ Ausbaustufe 2 — bis dahin nicht in der Liste, nicht ausgegraut
(keine toten Einträge).

Verwaltung/Redaktion (ADMIN) erscheint nur für angemeldete Personen mit
Rolle, als eigene Gruppe „Verwaltung" am Ende.

### 3.3 Startansicht

Beim regulären Start (SHELL-Abschnitt 7) öffnet die App direkt einen
Tab, keine gesonderte Dashboard-Seite. Standard: **Stundenplan** — die
meistgenutzte Funktion beider Alt-Apps (`roadmap.md` Abschnitt 6).
In den Einstellungen wählbar (neue SET-Anforderung, Abschnitt 12);
„zuletzt genutzt" ist die Alternative, aber schwerer vorhersehbar und
wird nicht als Standard gesetzt.

Kein separater Home-Screen, weil er eine sechste Ebene wäre, die mit den
Tabs um dieselbe Aufgabe konkurriert und den Zwei-Schritte-Weg nicht
verkürzt.

## 4. Erststart und Ersteinrichtung

### 4.1 Ablauf

1. **Zustimmungs-Gate** (SHELL-F-030): kurze Erklärung, Link zur
   Datenschutzerklärung, zwei gleichwertig sichtbare Optionen —
   „Zustimmen" und „Später – nur Basisfunktionen". Kein Vollbild-Zwang,
   keine vorausgewählte Option, kein Dark Pattern.
2. **Direkt in die Startansicht.** Kein Tutorial, kein Karussell,
   keine Konto-Aufforderung.
3. **Ersteinrichtung passiert im Leerzustand des jeweiligen Bereichs.**
   Der Stundenplan ohne gewählte Gruppe zeigt „Studiengang und Semester
   wählen" mit Knopf; der Mensaplan ohne gewählte Mensa zeigt „Mensa in
   den Einstellungen auswählen" mit Direktlink (Muster aus UX-F-110,
   Vorbild L-Befund in `../../platform/ux-and-theming.md`).

### 4.2 Was bewusst nicht passiert

- Kein mehrseitiges Onboarding-Karussell — es wird übersprungen und
  vermittelt nichts Dauerhaftes.
- Kein Coach-Mark-Overlay-Schwarm beim ersten Öffnen eines Bereichs —
  höchstens **ein** einzeiliger, schließbarer Hinweis pro Bereich, danach
  nie wieder.
- Keine Push-Berechtigungsabfrage beim Start — erst wenn die Nutzerin
  eine Benachrichtigung aktiv einschaltet (SET-F-010, Fehlerfall in
  SET-Abschnitt 9).

## 5. Orientierung: Wo bin ich?

| Mittel | Regel |
|---|---|
| Bildschirmtitel | Jeder Screen trägt einen Titel in der Kopfzeile, der dem Listeneintrag entspricht, über den er erreicht wurde. |
| Rückweg | Stack-Screens haben ein sichtbares Zurück (Kopfzeile links) **und** reagieren auf die System-Zurück-Geste/-Taste identisch. |
| Tab-Wechsel | Wechsel des Tabs verwirft den Stack des verlassenen Tabs nicht; Rückkehr zeigt die zuletzt gesehene Ebene. Erneuter Tap auf den aktiven Tab springt an dessen Wurzel. |
| Modale Ansichten | Nur für in sich geschlossene Teilaufgaben (z. B. „Eintrag hinzufügen"). Immer mit „Abbrechen" oben links und „Fertig/Sichern" oben rechts. |
| Tiefe | Kernfeature-Ziele nie tiefer als zwei Ebenen unter dem Tab (SHELL-F-020). |

### 5.1 Einsprünge von außen

- **Betriebssystem-Schnellzugriffe** (SHELL-F-040): mindestens
  „Stundenplan heute" und „Semesterticket anzeigen". Ein Einsprung
  landet auf dem Zielbildschirm mit funktionierendem Zurück-Weg in die
  App, nicht in einer Sackgasse.
- **Deep Links** (Expo Router, datei-basiert): eine per Link geöffnete
  News-Meldung oder Wiki-Seite baut den Stack darüber auf, sodass
  Zurück zur Übersicht führt.

## 6. Aktionen auffindbar machen

| Aktionsart | Platzierung |
|---|---|
| Primäraktion einer Ansicht (höchstens eine) | Kopfzeile rechts oder — bei „Element erzeugen" — als sichtbarer Knopf/FAB in der Ansicht. |
| Sekundäraktionen | Kopfzeilen-Menü (⋯) oder Inline-Knöpfe. Nie ausschließlich als Wischgeste oder langes Drücken (UX-F-090). |
| Elementbezogene Aktionen (Stundenplan-Eintrag färben/löschen, News anpinnen) | Sichtbares Bedienelement am Element (Menüpunkt, Knopf). Langes Drücken/Wischen darf zusätzlich angeboten werden, ist aber nie der einzige Weg. |
| Zerstörende Aktionen (löschen, Ticket entfernen, alle lokalen Daten löschen) | Sichtbar, aber nicht hervorgehoben (kein Akzent), immer mit Bestätigungsdialog (UX-F-120), Bestätigungsknopf klar beschriftet („Löschen", nicht „OK"). |
| Aktualisieren | Zieh-zum-Aktualisieren **und** eine sichtbare Aktualisieren-Aktion für jede Ansicht mit direkt abrufbaren Ferndaten (UX-F-160). |

## 7. Zustände und Rückmeldung

Alle vier Zustände über die eine Grundstruktur `app/src/ui/state/AsyncStates.tsx`
(ARCH-N-020), nie je Bildschirm neu erfunden.

| Zustand | Führung |
|---|---|
| Laden | Einheitliche Ladeanzeige (UX-F-140). Bei vorhandenem Altbestand: alten Stand zeigen, Aktualisierung dezent im Hintergrund andeuten — nicht durch einen Vollbild-Spinner ersetzen. |
| Leer | Text + nächster Schritt (UX-F-110), kein nackter Leerbildschirm. |
| Fehler | Einheitliche Fehlerdarstellung (UX-F-130) mit Klartext-Ursache (kein Code, kein Stacktrace) und „Wiederholen". Nie stiller Abbruch (SEC-F-060). |
| Offline | Als solcher gekennzeichnet; Ansichten mit lokalem Zwischenspeicher zeigen den letzten Stand mit Altershinweis (DATA-F-090). Raumsuche wird offline ausdrücklich als „nicht verfügbar" markiert (ARCH-F-110/RAUM). |

### 7.1 Rückmeldung zu Schreibvorgängen

- Erfolg kurz bestätigen (kurze Einblendung), keine Klick-weg-Dialoge.
- Offline ausgelöster Schreibvorgang (Bewertung, Helfer-Anmeldung,
  Besetzt-Meldung): sichtbarer Hinweis „wird gesendet, sobald wieder
  online", der Vorgang wird bei Verbindung ohne weitere Interaktion
  fortgesetzt (ARCH-F-120/160).
- Zustandsabhängige Schreibvorgänge (Verwaltung, Moderation,
  Kontolöschung, E-Key-Verknüpfung) scheitern offline **sofort** mit
  klarer Meldung, statt in eine Warteschlange zu gehen (ARCH-F-125).

## 8. Führung zu einwilligungspflichtigen Funktionen

Funktionen mit Personenbezug sind ohne Zustimmung gesperrt
(`app/src/consent/RequiresConsent.tsx`, SEC-F-010). Die Sperre ist kein
toter Bildschirm, sondern erklärt:

- welche Funktion gesperrt ist und warum (ein Satz),
- ein Knopf „Datenschutzerklärung ansehen und zustimmen", der direkt
  zum Zustimmungsschritt führt,
- nach erteilter Zustimmung kehrt die App an genau die Stelle zurück,
  an der die Nutzerin war.

Analog für Funktionen, die eine Anmeldung brauchen (Bewertung schreiben,
Helfer-Anmeldung ab Ausbaustufe 2): erst beim Auslösen der Aktion nach
Anmeldung fragen, nicht als Zugangshürde vor dem Bereich.

## 9. Barrierefreiheit als Führungsmittel

| Regel | Umsetzung |
|---|---|
| Vorleser-Reihenfolge | Folgt der visuellen Reihenfolge; Kopfzeile → Inhalt → Aktionen. Jedes Bedienelement beschriftet (UX-F-060). |
| Fokus nach Navigation | Nach einem Screen-Wechsel liegt der Lese-/Fokuspunkt auf dem neuen Titel, nicht am Seitenanfang darüber. |
| Dynamische Schrift | Layouts brechen bei großer Systemschrift um, statt abzuschneiden (UX-F-050). |
| Trefferflächen | 44×44 dp Minimum, auch für Icon-Knöpfe in der Kopfzeile (UX-N-020). |
| Bedeutung nie nur über Farbe | Aktiver Tab, Gruppen-Fremdtermine im Stundenplan, Gerichts-Kennzeichen: immer zusätzlich Text/Symbol (UX-F-070/080). |
| Bewegung | Übergänge kurz und dezent; „Bewegung reduzieren" des Systems wird respektiert (neue UX-Anforderung, Abschnitt 12). |

## 10. Sprache und Mikrotexte

- Deutsch und Englisch von Anfang an, keine Zeichenkette fest im Code
  (NFR-F-115); Sprachwahl in den Einstellungen (SET-F-100/110).
- Knöpfe tragen Verben, die die Handlung benennen („Gruppe wählen",
  „Zustimmen", „Löschen") — nicht „OK"/„Weiter", wo eine konkrete
  Handlung gemeint ist.
- Fehlermeldungen: was ist passiert, was kann die Nutzerin tun. Keine
  Schuldzuweisung, kein Fachjargon, keine internen Codes.
- Ton: sachlich, knapp, durchgängig per „du" (studentisches Umfeld,
  konsistent mit der FSR-Außenkommunikation) — Festlegung FSR FB4,
  2026-09-02. Gilt für beide Sprachdateien (im Englischen ohnehin „you").

## 11. Bewusst nicht übernommen

| Aus den Alt-Apps / verbreitete Muster | Grund |
|---|---|
| Fünf gleichrangige Tabs als einzige Struktur | Trägt den erweiterten Umfang nicht (ARCH-N-010, SHELL-F-010). |
| Seitenmenü/Hamburger-Drawer | Versteckt die Navigation hinter einem Symbol; „Tab + Mehr" hält die Kernbereiche sichtbar (SHELL-F-010, Erläuterung). |
| Aktionen nur über langes Drücken (Stundenplan färben/löschen, News anpinnen) | Ohne Vorwissen nicht auffindbar (UX-F-090). |
| Onboarding-Karussell / Coach-Mark-Flut | Wird übersprungen, vermittelt nichts Dauerhaftes; Kontext-Hinweise sind wirksamer. |
| Push-Berechtigung beim ersten Start erzwingen | Abfrage ohne Bezug zu einer Nutzerhandlung führt zu reflexhafter Ablehnung. |
| Vollbild-Zwang zur Datenschutz-Zustimmung vor jeder Nutzung | Stärker als SEC-F-010 verlangt, blockiert kontofreie Kernfunktionen grundlos (SHELL-F-030, Erläuterung). |

## 12. Ableitung in den Spec-Bestand

> **Überführt am 2026-09-02** (Roadmap-Schritt 2). Die hier hergeleiteten
> Anforderungen sind mit realen IDs in SHELL, UX und SET aufgenommen und durch
> ID-tragende Tests bzw. das Prüfprotokoll `../../pruefprotokolle/2026-09-02-app-rahmen.md`
> belegt. Zuordnung Slot → reale ID: SHELL F-070/F-080/F-090/F-100/F-110 (F-080
> in F-080 + F-085 aufgeteilt, EARS je eine Aussage); UX F-170/F-180 (in F-180 +
> F-185)/F-190/F-200; „Anrede du" = UX-F-210; „Bewegung reduzieren" = UX-N-030;
> SET F-160. Die Slot-Tabellen unten bleiben als Herleitung stehen.

Damit dieses Konzept wirksam wird, entstehen folgende Anforderungen im
Spec-Bestand. Die IDs werden **erst bei Aufnahme in die jeweilige Spec**
vergeben (nächste freie Nummer je Präfix, Zehnerschritte, `README.md`
Abschnitt 5) — die Spalte „Slot" nennt nur die voraussichtliche Nummer.

### Neu in `spec.md` (Präfix SHELL)

| Slot | Anforderung (EARS, Kurzfassung) | Herkunft |
|---|---|---|
| F-070 | Beim regulären Start muss das System die konfigurierte Startansicht öffnen; ohne Konfiguration den Stundenplan. | NEU |
| F-080 | Das System muss je Tab einen eigenständigen Navigations-Stack führen, der bei Tab-Wechsel erhalten bleibt; erneutes Antippen des aktiven Tabs kehrt an dessen Wurzel zurück. | NEU |
| F-090 | Das System muss „Mehr" als gruppierte Liste darstellen und Bereiche künftiger Ausbaustufen erst mit deren Umsetzung aufnehmen (keine ausgegrauten Einträge). | NEU |
| F-100 | Wenn ein Bereich über Schnellzugriff oder Deep Link geöffnet wird, muss das System einen Navigations-Stack aufbauen, der einen Rückweg in die reguläre Struktur bietet. | Alt: quick_actions_manager.dart (L-004) |
| F-110 | Wenn eine Ansicht wegen fehlender Einwilligung oder fehlender Anmeldung gesperrt ist, muss das System den Grund nennen, einen direkten Weg zur Freischaltung anbieten und danach an die ursprüngliche Stelle zurückkehren. | NEU |

### Neu in `../../platform/ux-and-theming.md` (Präfix UX)

| Slot | Anforderung (EARS, Kurzfassung) | Herkunft |
|---|---|---|
| F-170 | Das System muss auf jedem Bildschirm einen Titel führen, der der Bezeichnung des Einstiegspunkts entspricht, über den er erreicht wurde. | NEU |
| F-180 | Das System muss je Ansicht höchstens eine visuell hervorgehobene Primäraktion vorsehen; zerstörende Aktionen dürfen nicht hervorgehoben sein. | NEU |
| F-190 | Wenn ein Bereich erstmals geöffnet wird, darf das System höchstens einen schließbaren Einführungshinweis zeigen und danach nicht erneut. | Alt: bewusst verworfen |
| F-200 | Nach einem Wechsel des Bildschirms muss das System den Bedienfokus für Bildschirmvorleser auf den neuen Titel setzen. | NEU |
| F-210 | Das System muss Nutzertexte durchgängig in der Anrede „du" formulieren. | NEU |
| N-030 | Das System muss die Systemeinstellung „Bewegung reduzieren" respektieren und Übergangsanimationen entsprechend reduzieren. | NEU |

### Neu in `../settings/spec.md` (Präfix SET)

| Slot | Anforderung (EARS, Kurzfassung) | Herkunft |
|---|---|---|
| F-160 | Das System muss der Nutzerin die Wahl der Startansicht (einer der Tab-Bereiche oder „zuletzt genutzt") ermöglichen. | NEU |

### Anzupassen

- `spec.md` Abschnitt 7: „konfigurierte Startansicht" mit der neuen
  Startansicht-Anforderung (Slot F-070) verknüpfen.
- `../../platform/ux-and-theming.md`: Symbolzuordnung der Tabs unter
  der bestehenden Symbolsystem-Anforderung (UX, Symbolsystem) als
  Beispieltabelle ergänzen.
- Betroffene Specs: `version` erhöhen (README Abschnitt 8),
  `last_reviewed` auf das Änderungsdatum.

### Roadmap-Bezug

Umsetzung gehört zu **Schritt 2 (App-Rahmen)** — „SHELL vollständig".
Die UX-Anforderungen tragen schrittweise mit den Features (`roadmap.md`
Abschnitt 3, Zeile ARCH/UX). Keine Auswirkung auf die Reihenfolge.

## 13. Offene Fragen

- ~~Ob „zuletzt genutzt" als Startansicht-Option den Umsetzungsaufwand
  wert ist~~ Umgesetzt 2026-09-02 (SET-F-160): ein zusätzlich vermerkter
  `lastTab`-Schlüssel genügt.
- Ob die Tab-Leiste auf Bildschirmen ab 1024 px Breite (NFR-N-150,
  adaptives Layout) zu einer Seitenleiste wird — klärt sich mit der
  Tablet-Gestaltung, nicht jetzt.
- Genaues Verhalten des Kopfzeilen-Menüs (⋯) bei nur einer
  Sekundäraktion: Menü oder direkter Knopf.
