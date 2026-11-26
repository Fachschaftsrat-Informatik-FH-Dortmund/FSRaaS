## Why

Roadmap-Schritt 7 (News) soll die ersten redaktionell gepflegten Inhalte in die
App bringen. Heute ist der News-Tab ein Platzhalter (`NewsScreen` zeigt „Kommt
bald"), das Backend hat keine Meldungen, und die Verwaltung kann keine anlegen.
Der Vertrag beschreibt die Meldungs-Endpunkte zwar seit Fassung 0.1, umgesetzt
ist davon nichts. Gleichzeitig hängen beide Alt-Apps für News an
`hemacode.de` (INT-003), einer privaten Infrastruktur ohne geklärte
Trägerschaft (ADR 0007). Erst eine eigene Redaktion gibt dem FSR einen Weg,
Meldungen selbst zu veröffentlichen.

## What Changes

Der Schnitt umfasst Vertrag, Backend, App und Verwaltungsoberfläche für
Meldungen der Klassifizierung „FSR-News".

- **Vertrag zuerst** (`api-contract.yaml`, Fassung 0.8.0):
  - `GET /meldungen` liefert zusätzlich die Kennungen aller zurückgezogenen
    Meldungen. Das Feld `zurueckgezogen` an `Meldung` entfällt, weil die
    Liste zurückgezogene Meldungen ohnehin nicht enthält.
  - Neu: `GET /meldungen/entwuerfe/{entwurfId}`.
  - Veröffentlichen verlangt `If-Match`.
  - `Meldungsentwurf` trägt `veroeffentlichtAm` und `geaendertAm`; das Feld
    `geplanteVeroeffentlichung` entfällt (siehe Nicht-Ziele).
  - Keiner dieser Pfade ist bisher implementiert. Die Änderungen brechen
    deshalb keinen bestehenden Client.
- **Backend**:
  - Persistenz der Meldungen mit EF-Migration `NewsRedaktion`.
  - Kontofreier Lese-Endpunkt mit Cursor-Blättern.
  - Redaktions-Endpunkte hinter der Richtlinie `fsr-redaktion`: anlegen,
    ändern, veröffentlichen, zurückziehen. Ändern und Veröffentlichen sind
    mit `If-Match` gegen gleichzeitige Bearbeitung gesichert.
  - Jede verändernde Handlung bekommt einen Eintrag im Verwaltungsprotokoll.
- **App, News-Tab**:
  - Liste der Meldungen, absteigend nach Veröffentlichungszeitpunkt, mit
    sichtbarer Klassifizierung.
  - Nachladen älterer Meldungen beim Blättern ans Listenende.
  - Detailansicht einer Meldung.
  - Anpinnen und Lösen über eine sichtbare Schaltfläche. Angepinnte Meldungen
    stehen dauerhaft oben, auch über Neustarts hinweg. Eine zurückgezogene
    angepinnte Meldung wird als zurückgezogen gekennzeichnet.
  - Zeitstempel im 24-Stunden-Format; ein unlesbarer Zeitstempel erscheint
    als „unbekannt".
  - Lade-, Leer-, Fehler- und Offline-Zustände über `AsyncStates`, dazu
    Herunterziehen zum Aktualisieren.
- **Verwaltungsoberfläche (App und Web-Export)**, Bereich „Meldungen":
  - Liste aller Entwürfe, veröffentlichten und zurückgezogenen Meldungen.
  - Editor für Titel und Text.
  - Vorschau in der Darstellung der App (Listenkarte und Detailansicht),
    aus der allein veröffentlicht wird.
  - Zurückziehen mit Bestätigung.
  - Hinweis auf eine zwischenzeitliche Änderung mit Weg zum neueren Stand.

### Nicht-Ziele

- **Push-Benachrichtigungen** samt Navigation aus einer Benachrichtigung
  (NEWS-F-060/F-070) und die Positiv-/Sperrliste (NEWS-F-230 bis F-290,
  NEWS-N-010). Laut Roadmap Abschnitt 2/3 zweite Ausbaustufe.
- **FB-Aktuelles** (NEWS-F-090, Import aus INT-010). Zweite Ausbaustufe, die
  Auswertung der Fachbereichsseite ist eine offene Klärung (Roadmap
  Abschnitt 5).
- **Event-Erinnerungen** (NEWS-F-100). Zweite Ausbaustufe, hängt an EVENT.
- **Filter, Suche und erweiterte Suche** (NEWS-F-110, F-120, F-130 und F-150
  bis F-220). Sie gehören laut Roadmap zur ersten Ausbaustufe und zu
  Schritt 7, laufen aber als eigener Folge-Change (Issue #156). Grund: Der erweiterte
  Suchmodus braucht eine eigene Entscheidung zu Ausdrucks-Engine und
  ReDoS-Schutz (offene Frage der Capability `news`). Der Schnitt teilt
  Schritt 7 deshalb wie vorgesehen in zwei Teile. Der Lese-Endpunkt nimmt den
  Parameter `klassifizierung` schon heute entgegen.
- **Zeitgesteuerte Veröffentlichung**. Die Capability `admin` lässt offen, ob
  Entwürfe einen geplanten Veröffentlichungszeitpunkt bekommen. Die erste
  Ausbaustufe verlangt nur sofortiges Veröffentlichen. Das Feld entfällt
  deshalb aus dem Vertrag, statt ungenutzt mitzulaufen.
- **Einsicht in das Verwaltungsprotokoll** in der Oberfläche. Offene Frage
  der Capability `admin`; serverseitige Führung genügt.
- **Löschen von Entwürfen**. Die Capability `admin` fordert anlegen,
  bearbeiten, veröffentlichen und zurückziehen, kein Löschen.

### Offene Entscheidungen, die dieser Schnitt nicht trifft

- **Übernahme des Bestands von INT-003.** ADR 0007 sieht eine Übergangsphase
  vor, in der der Abruf über `hemacode.de` und der neue Weg nebeneinander
  laufen. Die Primärquelle des bisherigen Feeds ist laut ADR 0007 weiterhin
  unbekannt. Dieser Schnitt liefert FSR-News ausschließlich aus der eigenen
  Redaktion und importiert INT-003 nicht. Ob und wie der Altbestand
  übernommen wird, bleibt offen.
- **Altbackend-Hinweise `/messages`.** Ob die versions- und sprachabhängigen
  Hinweise in NEWS aufgehen, ist eine offene Frage (`specs/open-questions.md`)
  und wird hier nicht berührt.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `news`: neues Requirement „Detailansicht einer Meldung". Bisher beschreibt
  die Capability nur die Liste, die gekürzte Texte zeigt; der vollständige
  Text braucht einen eigenen Ort.
- `admin`:
  - „Meldungsredaktion für FSR-News" präzisiert: Zustände, Bearbeiten einer
    veröffentlichten Meldung, erneutes Veröffentlichen, Pflichtfelder.
  - „Entfernen zurückgezogener Meldungen aus der Liste" präzisiert: Was die
    App bei einer angepinnten, zurückgezogenen Meldung noch zeigt.
  - „Vorschau vor Veröffentlichung" auf das Übernehmen von Änderungen an
    einer bereits veröffentlichten Meldung ausgedehnt.
  - Neues Requirement „Ablehnung bei gleichzeitiger Änderung einer Meldung",
    analog zur bestehenden Regel für Stammdaten-Listen.

## Impact

- `openspec/specs/api-contract.yaml`: Pfade unter `/meldungen`, Schemata
  `Meldung` und `Meldungsentwurf`, Fassung 0.8.0. Daraus erzeugt
  `tools/contract-codegen` TS- und C#-Typen.
- `backend/src/Fb4.Backend/`:
  - neues Domänenobjekt `Meldungseintrag` und Eintrag im `Fb4DbContext`
  - Migration `NewsRedaktion`
  - neuer `MeldungenStore` und `Endpoints/MeldungenEndpoints.cs`
  - Registrierung in `Program.cs` und `TestAppFactory`
  - Tests in `Fb4.Backend.Tests`

  Die parallel laufende Session für Besetzt-Meldungen legt ebenfalls eine
  Migration an. Beim Zusammenführen ist `Fb4DbContextModelSnapshot.cs` zu
  vereinen.
- `app/src/areas/news/`: Datenzugriff, Anpinn-Ablage, Zeitstempel-Format,
  Bildschirme für Liste und Detail und Darstellungsbausteine, die die
  Verwaltungsvorschau mitbenutzt. `app/app/(tabs)/news.tsx` wird zum
  verschachtelten Stack `news/` mit `index` und `[meldungId]`.
- `app/src/areas/admin/`: Meldungs-Abfragen in `api.ts`, Bildschirme
  `MeldungenScreen` und `MeldungEditorScreen`, Eintrag im
  Verwaltungs-Einstieg; Routen unter `app/app/(tabs)/more/admin/meldungen/`.
- `app/src/i18n/de.json`, `en.json`: Texte für News und Redaktion.
- `openspec/specs/admin/spec.md`: Tabelle „Umsetzungsstand" nachgeführt.
