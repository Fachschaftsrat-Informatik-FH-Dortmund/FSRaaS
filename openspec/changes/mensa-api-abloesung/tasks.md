## 1. Vertrag

- [x] 1.1 `openspec/specs/api-contract.yaml` additiv erweitern: `Gericht` um `komponenten` (Liste), `allergene` (Liste) und `co2Klasse`; `zusatzstoffe` behält seine bisherige Bedeutung. Verifikation: der Vertrag validiert, und die Beschreibung jedes neuen Feldes nennt INT-020 als Quelle statt INT-015.
- [x] 1.2 `Mensa` um `anschrift`, `beschreibung` und `kartenUrl` erweitern und die gepflegten `oeffnungszeiten` daraus entfernen. Verifikation: der Vertrag validiert, und kein Schema führt mehr ein pflegbares Öffnungszeitenfeld. Anmerkung: die drei neuen Felder sind im Vertrag beschrieben, aber noch von keiner Stelle befüllt — das Anreichern der Mensa-Liste aus `GET /canteens` gehört zu 6.5.
- [x] 1.3 Neues Schema für die Öffnungsangaben je Mensa (heutiger Stand mit Grund, Wochenplan, Vorausschau, Schließtage mit Zeitraum und Geltungsbereich) sowie ein Feld für den gemeldeten Datenstand. Verifikation: der Vertrag validiert.
- [x] 1.4 Typen aus dem Vertrag erzeugen (App und Backend). Verifikation: der Erzeugungslauf endet fehlerfrei, und `tsc` sowie der Backend-Build übersetzen ohne Fehler.

## 2. Backend — Anbindung an INT-020

- [x] 2.1 Client gegen `mensa.fb4.it` anlegen, der `ItmcMensaClient` ersetzt: Zielsystem ausschließlich über Konfiguration, TLS, eigener `User-Agent`. Verifikation: ein Test belegt, dass die Basisadresse aus der Konfiguration stammt und nicht im Quellcode steht.
- [x] 2.2 Schlüsselbildung auf die mit ` | ` zusammengefügten Komponenten umstellen, `GerichtNormalisierung` unverändert lassen. Verifikation: Test `Normalisierung von Gerichtsbezeichnungen vor der Verknüpfung` belegt, dass `lines` `["Gebackene Kartoffelecken", "Kräutermayonaise"]` denselben Schlüssel ergibt wie der frühere ITMC-Rohtitel `"Gebackene Kartoffelecken | Kräutermayonaise (20c,26,28,4)"`.
- [x] 2.3 Sprachrückfall und Code-Bereinigung: fehlt `nameEn`/`linesEn`, tritt die deutsche Fassung ein; verbliebene Code-Klammern werden entfernt. Verifikation: Tests mit den am 2026-09-22 beobachteten Fällen — `"herbal mayonnaise (20c,26,281,4)"` und ein Gericht ohne `nameEn`.
- [x] 2.4 Vertragstest gegen INT-020, der bei struktureller Abweichung sichtbar fehlschlägt statt sie weiterzuverarbeiten (Capability `quality-and-testing`). Verifikation: der Test schlägt fehl, wenn ein Pflichtfeld aus `Meal`, `Day` oder `Hours` fehlt oder seinen Typ wechselt.
- [x] 2.5 Durchreichen je Tag und Mensa umsetzen, mit Beachtung des von der Quelle gesetzten `Cache-Control`. Verifikation: Test `Mensa-Daten durchreichen statt zwischenspeichern` belegt, dass zwei Anfragen innerhalb der Frist einen Abruf auslösen und keine Ablage entsteht.
- [x] 2.6 Gemeldeten Datenstand der Quelle an die App weiterreichen. Verifikation: Test `Weitergabe des Datenalters der Mensa-Schnittstelle`.
- [x] 2.7 Fehler der Quelle als Fehler ausliefern, nie als leere Gerichtsliste. Verifikation: Test `Sichtbarer Fehler bei nicht erreichbarer Mensa-Schnittstelle`.
- [x] 2.8 Englische Legende auslesen, nachdem die Quelle sie am 2026-09-24 bekommen hat (`labelEn` je Eintrag, `noteEn` an der Legende). Die Klartexte von Zusatzstoffen, Allergenen und Kennzeichnungen folgen dem `Accept-Language`, das der Vertrag an `/mensen/verzeichnisse` und am Speiseplan bereits vorsah; fehlt `labelEn` zu einem Code, tritt `label` ein. Verifikation: Tests `Gerichtskategorien und Zusatzstoffhinweise in Oberflächensprache` und `Legende ohne englische Fassung fällt auf die deutsche zurück`. Der Vertrag bleibt unverändert — der Sprachparameter stand dort schon (1.1/1.2); allein das Backend hat ihn am Verzeichnis-Endpunkt bisher nicht ausgewertet. Erweitert den am 2026-09-23 getroffenen Zuschnitt der Entscheidung „Die englische Legende kommt aus der Quelle, nicht aus der App" (design.md, Nachtrag 2026-09-24).

## 3. Backend — Abbau des Zwischenspeichers

- [x] 3.1 `SpeiseplanStore.cs`, `SpeiseplanAktualisierungJob.cs` und `SpeiseplanAbrufZeitplan.cs` samt zugehöriger Tests entfernen. Verifikation: der Backend-Build übersetzt, und keine Datei verweist mehr auf diese Typen. Nachtrag 2026-09-24: ein verbliebener Verweis im Kommentar von `app/src/areas/canteen/screens/CanteenScreen.tsx` zeigte noch auf `SpeiseplanStore.TagAsync` und nennt jetzt `MensaQuelle.TagAsync`; die Prüfung stellt damit auch für die App-Seite keinen Treffer mehr fest.
- [x] 3.2 EF-Core-Migration, die die Tabelle des Speiseplan-Zwischenspeichers und die Verzeichniseinträge entfernt. Verifikation: `dotnet ef migrations script` erzeugt die Migration fehlerfrei, und sie besteht allein aus `DROP TABLE` dreier Lesecache-Tabellen ohne Fremdschlüssel; da es ein reiner Lesecache war, entsteht kein Datenverlust. Erledigt: `20260923003227_MensaZwischenspeicherEntfaellt` entfernt `Speiseplaene`, `MensaVerzeichnis` und `MensaStand` in einer Transaktion, `Down` legt sie wieder an. Der Lauf gegen den echten Bestand erfolgt beim Deploy über den `DbInitializer` (Entscheidung FSR FB4, 2026-09-23: die Script-Prüfung genügt als Verifikation).
- [x] 3.3 Persistenzmodelle `SpeiseplanTag`, `GerichtCache` und `MensaVerzeichnisEintrag` entfernen oder auf reine Übertragungsformen zurückführen. Verifikation: der Backend-Build übersetzt, und die Testsuite läuft grün.

## 4. Backend — Stammdaten

- [x] 4.1 Öffnungszeiten aus der Stammdatenpflege entfernen, Anzeigereihenfolge und Standardauswahl belassen. Verifikation: Test `Pflege der Stammdaten-Listen` belegt, dass ein Mensa-Eintrag kein Öffnungszeitenfeld mehr annimmt.
- [x] 4.2 Mitgelieferten Ausgangsbestand `app/src/areas/canteen/assets/stammdaten-ausgangsbestand.json` ohne `oeffnungszeiten` neu erzeugen. Verifikation: Test `Ausgangsbestand bei nicht ladbarer Mensa-Liste` läuft unverändert grün.

## 5. App — Öffnungs- und Schließzustände

- [x] 5.1 Öffnungszeiten aus der Schnittstelle beziehen und je Wochentag anzeigen. Verifikation: Test `Öffnungszeiten je Mensa und Wochentag`.
- [ ] 5.2 (Datenweg steht: `ausgabezeitFuer` in `app/src/areas/canteen/oeffnungszeiten.ts` samt Test mit den Werten des Max-Ophüls-Platzes und der Hauptmensa. Offen ist allein die Anzeige.) Ausgabezeit zusätzlich ausweisen, wenn sie abweicht. Verifikation: Test `Ausweis der Ausgabezeit bei abweichender Öffnungszeit` mit den Werten des Max-Ophüls-Platzes (offen ab 08:00, Ausgabe ab 11:30) und der Hauptmensa (keine Abweichung).
- [ ] 5.3 Die drei Zustände je Mensa und Tag umsetzen — geöffnet mit Gerichten, geöffnet ohne Speiseplan, geschlossen. Verifikation: Tests `Geschlossen-Hinweis für geschlossene Mensa` und `Hinweis für geöffnete Mensa ohne Speiseplan`.
- [ ] 5.4 Schließungsgrund und Zeitraum anzeigen. Verifikation: Test `Grund und Zeitraum einer Schließung` mit dem Fall der Mensa Süd (Betriebsferien bis 04.10.).
- [ ] 5.5 Wiedereröffnungshinweis auf Öffnungsvorschau und Schließtage umstellen. Verifikation: Test `Wiedereröffnungshinweis an der geschlossenen Mensa`, einschließlich des Falls einer Mensa ohne Speiseplan.
- [ ] 5.6 Öffnungszeit für geschlossene Mensen unterdrücken, für geöffnete ohne Speiseplan anzeigen. Verifikation: Test `Keine Öffnungszeit für geschlossene Mensa`.
- [ ] 5.7 Öffnungszeit an der Abschnittsüberschrift auch im Fall „geöffnet ohne Speiseplan" führen. Verifikation: Test `Öffnungszeit an der Mensa-Abschnittsüberschrift`.
- [ ] 5.8 Wochenend-Überspringen auf die Öffnungsangabe umstellen. Verifikation: Test `Überspringen geschlossener Wochenendtage` mit einem samstags geöffneten Standort ohne Speiseplan.
- [ ] 5.9 Chip-Leiste um den Abschnitt der geöffneten Mensa ohne Speiseplan ergänzen. Verifikation: Test `Nicht auswählbare Chips ohne sichtbaren Abschnitt`.

## 6. App — Gerichtsdarstellung

- [ ] 6.1 Gerichtsbezeichnung nach Komponenten gegliedert darstellen, erste Komponente hervorgehoben. Verifikation: Test `Gerichtsbezeichnung nach Komponenten gegliedert`.
- [ ] 6.2 Allergene und Zusatzstoffe am Gericht unterscheidbar ausweisen. Verifikation: Test `Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe`.
- [ ] 6.3 Kennzeichnungen aus dem festen Vokabular der Quelle anzeigen, einschließlich „artgerecht". Verifikation: Test `Anzeige von Gericht-Kennzeichnungen`.
- [ ] 6.4 CO₂-Klasse und Klimateller-Abzeichen anzeigen. Verifikation: Test `Anzeige der CO₂-Klasse am Gericht`.
- [ ] 6.5 Standortangaben je Mensa anbieten (Anschrift, Beschreibung, Kartenverweis), mit Auslassen einzelner fehlender Angaben. Verifikation: Test `Standortangaben der Mensa`.

## 7. App — Filter, Sortierung, Gruppierung

- [ ] 7.1 Filtermenü in Allergene und Zusatzstoffe trennen, bestehende Auswahl unverändert übernehmen. Verifikation: Test `Getrennte Abschnitte für Allergene und Zusatzstoffe im Filtermenü`, der eine vor der Trennung gespeicherte Auswahl lädt.
- [ ] 7.2 Sammelschalter für Gluten (`20a`–`20f`) und Nüsse (`27a`–`27h`). Verifikation: Test `Sammelschalter für zusammengehörige Allergengruppen`.
- [ ] 7.3 Unverträglichkeitsauswahl auf die getrennte Führung nachziehen, ohne den bestehenden Übertragungsausschluss zu berühren. Verifikation: Test `Festlegen eigener Unverträglichkeiten`; der bestehende Test zum Übertragungsverbot bleibt grün.
- [ ] 7.4 CO₂-Klassen in den Ausschlussfilter aufnehmen. Verifikation: Test `Ausschluss nach Kennzeichnung`.
- [ ] 7.5 CO₂-Klasse als Sortierkriterium und als Gruppierungs-Baustein aufnehmen. Verifikation: Tests `Sortierkriterien für Gerichte` und `Wahl der Gruppierung`.
- [ ] 7.6 Beschriftung der Quellreihenfolge auf INT-020 beziehen. Verifikation: Test `Gruppenreihenfolge-Kriterien bei Kategorie-Gruppierung`.

## 8. App — Datenalter

- [ ] 8.1 Altershinweis auch bei bestehender Netzverbindung zeigen, wenn die Quelle einen überalterten Stand meldet. Verifikation: Test `Altershinweis bei veralteten Daten der Mensa-Schnittstelle`.
- [ ] 8.2 Belegen, dass die App die Mensa-Schnittstelle nie unmittelbar anspricht. Verifikation: Test `News und Mensa-Speisepläne über das Backend`.

## 9. Entscheidungen und Register

- [x] 9.1 Neuen ADR unter `specs/decisions/` anlegen: Ablösung von INT-015 durch INT-020 und Wegfall des serverseitigen Mensa-Zwischenspeichers; löst ADR 0007 in diesem Punkt ab. Erledigt: `specs/decisions/0021-mensa-api-des-fsr-ohne-eigenen-zwischenspeicher.md`.
- [x] 9.2 In ADR 0007 einen Verweis auf den neuen ADR aufnehmen und `zuletzt_ergaenzt` auf das Änderungsdatum setzen. Erledigt: Ergänzung 2026-09-22 im Abschnitt „Konsequenzen", `zuletzt_ergaenzt: 2026-09-22`.
- [ ] 9.3 Nach dem Archivieren, sobald der Registereintrag im Bestand steht: Übersichtstabelle am Ende von `openspec/specs/integrations/spec.md` um INT-020 ergänzen und INT-015 auf „abgelöst durch INT-020" setzen — die Tabelle ist Prosa und wird vom Archivlauf nicht mitgeführt. Im selben Zug die Registerkennung in ADR 0021 (Abschnitt „Entscheidung", Alternativentabelle) und in der Ergänzung 2026-09-22 von ADR 0007 nachtragen; vorher bricht sie die Verweisprüfung. Verifikation: `node tools/spec-check/src/cli.js` bleibt grün, die Tabelle nennt INT-020 mit den betroffenen Capabilities, und keine Zeile führt INT-015 mehr als aktive Mensa-Quelle.
- [x] 9.4 Offene Frage in `specs/open-questions.md` („Woher stammt die Mensa-Liste …") auf INT-020 nachführen. Verifikation: der Eintrag nennt die neue Quelle und das Entscheidungsdatum. Erledigt: Eintrag nennt INT-020 und die Entscheidung vom 2026-09-22 (`specs/decisions/0021-…`); `version` in `open-questions.md` auf 0.5.3 erhöht.
- [x] 9.5 Offene Fragen in `openspec/specs/canteen/spec.md` nachführen: die Frage nach der führenden Öffnungszeit-Quelle als am 2026-09-22 neu entschieden durchstreichen, den Punkt „Weitere Gruppierungs-/Sortier-Bausteine" um die aufgenommene CO₂-Klasse ergänzen. Verifikation: beide Einträge geben den Stand nach diesem Change wieder. Erledigt: Zeile zur Öffnungszeit-Quelle um die Ablösung durch INT-020 ergänzt (durchgestrichen), Gruppierungs-/Sortier-Punkt nennt die CO₂-Klasse aus INT-020.

## 10. Abschluss

- [ ] 10.1 Gesamte Testsuite in App und Backend grün, `tsc` und Lint fehlerfrei. Verifikation: die Läufe enden ohne Fehler.
- [ ] 10.2 Gerätetest des Mensaplans gegen die Live-Schnittstelle: Tagwechsel, geschlossene Mensa, geöffnete Mensa ohne Speiseplan, Filtermenü, Sortierung. Verifikation: datiertes Prüfprotokoll unter `specs/pruefprotokolle/` (Capability `quality-and-testing` lässt das für Gestaltung und Bedienung zu).
- [ ] 10.3 Change archivieren. Verifikation: `openspec archive mensa-api-abloesung` läuft durch, und die Spec-Deltas sind in `openspec/specs/` übernommen (DoD-Punkt 4).
