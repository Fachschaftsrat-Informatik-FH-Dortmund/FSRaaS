## Context

Was vorliegt:

- **Vertrag.** `api-contract.yaml` beschreibt seit Fassung 0.1 die Pfade
  `/meldungen`, `/meldungen/entwuerfe`, `/meldungen/entwuerfe/{entwurfId}` und
  `…/veroeffentlichung`. Weder das Backend noch die App nutzen sie.
- **Backend.** Muster für Verwaltungsfunktionen ist `VerwaltungEndpoints`:
  Gruppe hinter `AuthSetup.RedaktionPolicy`, Schreiben über einen Store, der
  Änderungen nur im Change-Tracker vormerkt, dann `AuditLog.Vormerken` und
  ein gemeinsames `SaveChangesAsync`. Gleichzeitige Bearbeitung wird zweistufig
  abgewiesen: `If-Match`-Vergleich und Concurrency-Token, beides endet in
  `412`. `ApiExceptionHandler` bildet `DbUpdateConcurrencyException` bereits
  auf `412` ab.
- **App.** Lesezugriff über `openapi-fetch` (`api`, `unwrap`) und TanStack
  Query mit persistiertem Zwischenspeicher. Die vier Zustände stellt
  `AsyncStates` dar. Gerätelokale Ablage über `storage/kv.ts`, Vorbild
  `canteen/favorites.ts`. Die Verwaltung nutzt `useAdminApi` mit Bearer-Token
  und `AdminGate`.

## Goals / Non-Goals

**Goals:**

- FSR-News redaktionell anlegen, korrigieren, veröffentlichen und
  zurückziehen, in App und Web-Export gleich
- Liste, Detail, Anpinnen und Nachladen im News-Tab
- eine Darstellung der Meldung, die App und Vorschau gemeinsam nutzen, damit
  die Vorschau nicht vom Original abweicht

**Non-Goals:** siehe `proposal.md`, Abschnitt „Nicht-Ziele".

## Decisions

### D1 — Eine Tabelle `Meldungen` für Entwurf und Veröffentlichung

Ein Datensatz trägt:

- `Id`, `Titel`, `Text`
- `Zustand`: `entwurf`, `veroeffentlicht` oder `zurueckgezogen`
- `Klassifizierung`: hier immer `fsr-news`
- `Quelle`: hier immer „FSR FB4"
- `VeroeffentlichtAm` (nullable), `AngelegtAm`, `GeaendertAm`
- `Version` (Guid, Concurrency-Token)

Der Lesepfad filtert auf `Zustand = veroeffentlicht`.

Verworfen wurde eine getrennte Entwurfs- und Meldungstabelle, die beim
Veröffentlichen kopiert. Sie verdoppelt die Felder und macht „veröffentlichte
Meldung korrigieren" zu einem Abgleich zweier Datensätze.

`Klassifizierung` und `Quelle` sind Spalten statt Konstanten im Lesepfad.
Ein späterer Import von FB-Aktuelles kann dieselbe Tabelle nutzen, ohne den
Lesepfad umzubauen.

Ein „verfassendes Konto" (Datenmodell der Capability `admin`) wird nicht als
Spalte geführt. Wer angelegt, geändert, veröffentlicht oder zurückgezogen
hat, steht im Verwaltungsprotokoll (`meldung.angelegt`,
`meldung.geaendert`, `meldung.veroeffentlicht`, `meldung.zurueckgezogen`,
Referenz `meldung:<id>`). Eine zweite Kopie derselben Angabe widerspräche der
Datensparsamkeit (API-N-080), zumal die Oberfläche sie nicht anzeigt.

### D2 — Zustandsübergänge

| Von | Handlung | Nach | Anmerkung |
|---|---|---|---|
| — | anlegen | entwurf | |
| jeder | ändern | unverändert | in `veroeffentlicht` sofort sichtbar, `VeroeffentlichtAm` bleibt |
| entwurf, zurueckgezogen | veröffentlichen | veroeffentlicht | `VeroeffentlichtAm = jetzt` |
| veroeffentlicht | veröffentlichen | veroeffentlicht | idempotent, keine neue Zeit, kein Protokolleintrag |
| veroeffentlicht | zurückziehen | zurueckgezogen | |
| zurueckgezogen | zurückziehen | zurueckgezogen | idempotent, `204` |
| entwurf | zurückziehen | — | `409 nicht_veroeffentlicht` |

Ändern und Veröffentlichen verlangen `If-Match` mit dem ETag des Datensatzes
und liefern bei Abweichung `412 stand_veraltet`. Beim Veröffentlichen sichert
das zu, dass der veröffentlichte Stand der ist, den die Person in der
Vorschau gesehen hat. Zurückziehen braucht kein `If-Match`, weil es keinen
Inhalt festschreibt.

Pflichtangaben: Titel nicht leer und höchstens 200 Zeichen, Text nicht leer
und höchstens 20 000 Zeichen. Verstöße ergeben `400` mit `titel_leer`,
`titel_zu_lang`, `text_leer` oder `text_zu_lang`. Die Grenzen sind gewählt,
nicht spezifiziert. Sie schützen die Datenbank vor versehentlich
eingefügten Riesentexten und liegen weit über jeder sinnvollen Meldung.

### D3 — Lesepfad mit Cursor und Liste zurückgezogener Kennungen

`GET /meldungen` liefert veröffentlichte Meldungen absteigend nach
`VeroeffentlichtAm`, Gleichstand nach `Id`.

- **Cursor.** Opaker Base64url-Wert aus Zeitpunkt (Ticks) und Kennung der
  letzten Meldung der Seite. Ein unlesbarer Cursor ergibt
  `400 cursor_ungueltig`. Ein Offset würde beim Veröffentlichen einer neuen
  Meldung zwischen zwei Seiten eine Meldung doppelt zeigen; der Cursor nicht.
- **Seitengröße.** `limit` ist 1 bis 100, Vorgabe 25. Ein Wert außerhalb
  ergibt `400 limit_ungueltig`.
- **Zurückgezogene Kennungen.** Jede Seite trägt `zurueckgezogen`, die
  Kennungen aller zurückgezogenen Meldungen. Daraus erkennt die App, welche
  angepinnte Meldung zurückgezogen wurde (ADMIN-F-050), ohne dem Server zu
  verraten, was angepinnt ist. Angepinnt ist ein rein lokales Attribut
  (DATA-F-060). Die Liste wächst nur mit Rückzügen und bleibt damit klein.
  Verworfen: ein Statusabruf je angepinnter Kennung, weil er die lokale
  Auswahl an den Server überträgt.
- **`standAlter.abgerufenAm`.** Zeitpunkt der Anfrage. Der Bestand ist der
  eigene und damit immer aktuell.
- **Das Feld `zurueckgezogen` an `Meldung` entfällt.** Die Liste enthält
  zurückgezogene Meldungen nie, das Feld wäre immer `false`.

### D4 — Angepinnte Meldungen als lokale Kopie

Die App speichert je angepinnter Meldung eine Kopie: Kennung, Titel, Text,
Zeitpunkt, Klassifizierung, Quelle, Zeitpunkt des Anpinnens und das Merkmal
`zurueckgezogen`. Ablageschlüssel ist `news.angepinnt`.

Begründung: NEWS-F-050 verlangt angepinnte Meldungen „unabhängig von ihrem
Alter" oberhalb der übrigen. Eine alte Meldung liegt aber meist auf keiner
geladenen Seite. Die Kopie trägt sie auch offline und nach einem Neustart.

Abgleich bei jedem Laden:

- Taucht die Meldung in einer geladenen Seite auf, wird die Kopie
  aufgefrischt. So kommt eine Korrektur der Redaktion an.
- Steht ihre Kennung in `zurueckgezogen`, wird sie als zurückgezogen
  markiert und ihr Text nicht mehr angezeigt.
- Wird sie später erneut veröffentlicht, hebt das nächste Auftauchen in einer
  Seite die Markierung wieder auf.

Die Liste zeigt angepinnte Meldungen oben, geordnet nach
Veröffentlichungszeitpunkt. Darunter folgen die übrigen ohne die angepinnten,
damit nichts doppelt erscheint.

Die Ordnung leitet eine reine Funktion ab. Sie ist ohne Oberfläche testbar.

### D5 — Zeitstempel

Das Backend liefert ISO-8601. Die App formatiert mit `Intl.DateTimeFormat`,
`hourCycle: 'h23'`, Zeitzone des Geräts, in der gewählten Sprache. Ein
`null` oder unlesbarer Wert wird als „unbekannt" angezeigt, die Meldung bleibt
sichtbar (NEWS-F-020).

Das Rohformat `dd.MM.yyyy - HH:mm:ss` von INT-003 kommt in diesem Schnitt
nicht vor, weil INT-003 nicht importiert wird. Der Test zum Requirement prüft
deshalb die 24-Stunden-Darstellung einer Nachmittagszeit und den Fall
„unbekannt".

### D6 — Routen und gemeinsame Darstellung

- **News-Tab als Stack.** `app/(tabs)/news.tsx` wird zum Stack `news/` mit
  `index` (Liste) und `[meldungId]` (Detail), wie Raum- und Mensa-Tab.
- **Detailansicht ohne eigenen Abruf.** Sie liest die Meldung aus dem
  geladenen Bestand oder aus den angepinnten Kopien. Ein eigener kontofreier
  Einzelabruf wäre erst mit Deep-Links aus Push-Benachrichtigungen nötig
  (NEWS-F-070, zweite Ausbaustufe). Bis dahin erreicht man die Detailansicht
  nur aus der Liste. Fehlt die Meldung trotzdem, erscheint der Hinweis „nicht
  verfügbar".
- **Gemeinsame Bausteine.** `MeldungKarte` (Listeneintrag mit gekürztem Text)
  und `MeldungInhalt` (Detail) liegen in `app/src/areas/news/ui/`. Die
  Verwaltungsvorschau bindet genau diese Bausteine ein (ADMIN-F-060), nicht
  eine Nachbildung.
- **Klassifizierung.** Je Klassifizierung ein Symbol und ein Textlabel
  (NEWS-F-080, UX-F-070: nicht über Farbe allein).
- **Text als reiner Text.** Kein Markdown, keine HTML-Auswertung. Beides
  verlangt die Spec nicht, und eine Auswertung wäre eine weitere Angriffs- und
  Fehlerfläche. Der Text ist markierbar (`selectable`), damit Links kopiert
  werden können.

### D7 — Lesen in der App: Infinite Query

- **Abfrage.** `useMeldungen()` ist eine `useInfiniteQuery` mit Schlüssel
  `['meldungen']`, `staleTime('news')` (15 Minuten) und `gcTime('news')`. Für
  `AsyncStates` wird sie auf `QueryLike` abgebildet: Daten sind die
  zusammengeführten Seiten.
- **Nachladen.** `onEndReached` der Liste lädt nach. Zusätzlich gibt es eine
  sichtbare Schaltfläche „Ältere Meldungen laden" am Listenende, damit
  Nachladen nicht nur über eine Geste erreichbar ist (UX).
- **Fehlschlagendes Nachladen.** Ein Hinweis mit „Erneut versuchen" am
  Listenende; die geladenen Seiten bleiben stehen.
- **Fehlschlagendes Aktualisieren bei vorhandenem Bestand.** `AsyncStates`
  zeigt in diesem Fall den Bestand ohne Hinweis. Der News-Bildschirm blendet
  deshalb selbst einen Fehlerhinweis mit Wiederholen über der Liste ein
  (NEWS-F-030; Zustand „Laden: zuletzt geladene Meldungen bleiben sichtbar").
- **Offline.** Offline zeigt `AsyncStates` wie überall den zwischengespeicherten
  Stand mit Altershinweis (DATA-F-090).

### D8 — Verwaltung: Liste, Editor, Vorschau

- **Routen.** `more/admin/meldungen/index` (Liste) und
  `more/admin/meldungen/[entwurfId]` (Editor, `neu` für eine neue Meldung).
- **Liste.** Alle Meldungen, gruppiert nach Zustand (Entwürfe,
  veröffentlicht, zurückgezogen), dazu „Neue Meldung". Der Leerzustand nennt
  den nächsten Schritt (UX-F-110).
- **Editor-Modus.** Titel- und Textfeld. Schaltflächen:
  - „Als Entwurf speichern", nur solange die Meldung nicht veröffentlicht
    ist.
  - „Vorschau".
  - „Zurückziehen" mit Bestätigung über `ConfirmDialog`, nur bei
    veröffentlichten Meldungen.
- **Vorschau-Modus.** `MeldungKarte` und `MeldungInhalt` mit den
  eingegebenen Werten. Schaltflächen: „Zurück zur Bearbeitung" und
  „Veröffentlichen" (bei einer veröffentlichten Meldung „Änderungen
  veröffentlichen"). Nur dieser Weg schreibt Änderungen an veröffentlichten
  Meldungen fest.
- **Ablauf von „Veröffentlichen" in der App.** Gegebenenfalls zuerst anlegen
  (`POST`) oder geänderten Inhalt speichern (`PUT` mit `If-Match`), dann mit
  dem frischen ETag veröffentlichen.
- **412.** Die Eingabe bleibt stehen. Ein Hinweis erscheint mit
  „Neueren Stand laden", der das Formular mit dem Serverstand füllt. So geht
  nichts verloren, bis die Person sich entscheidet.
- **Andere Fehler.** Ebenfalls ohne Verlust der Eingabe. Die Fehlermeldung
  steht im Bildschirm und nicht in `Alert.alert`, weil `Alert` im Web-Export
  nicht erscheint.
- **Offline.** Die Schaltflächen sind gesperrt, ein Hinweis nennt den Grund
  (Capability `admin`, „Offline-Verhalten").
- **Nach Erfolg** werden `['verwaltung','meldungen']` und `['meldungen']`
  invalidiert. Die App-Liste auf demselben Gerät zeigt die Änderung damit
  sofort.

### D9 — Kein Idempotenz-Schlüssel auf den Redaktions-Endpunkten

Die Querschnittsregel verlangt einen Idempotenz-Schlüssel für Schreibpfade,
damit ein Vorgang aus der Offline-Warteschlange nicht doppelt wirkt.
Verwaltungsfunktionen laufen ausdrücklich nicht über die Warteschlange
(Capability `admin`, „Offline-Verhalten"), und die übrigen
Verwaltungs-Endpunkte tragen auch keinen.

Es bleibt ein Restfall: Ein `POST` geht durch, aber die Antwort verliert sich.
Dann kann die Person nach „Erneut versuchen" einen zweiten Entwurf mit
gleichem Inhalt haben. Der doppelte Entwurf ist in der Liste sichtbar und
ohne Veröffentlichung unschädlich.

## Risks / Trade-offs

- **[Migrationen zweier paralleler Sessions]** Besetzt-Meldungen und dieser
  Change legen je eine Migration auf demselben Snapshot an. Wer zuletzt
  zusammenführt, muss `Fb4DbContextModelSnapshot.cs` vereinen, sonst erzeugt
  die nächste Migration Altlasten. Gegenmaßnahme: Hinweis im PR-Text, eigene
  Migration nur mit eigenen Tabellen.
- **[Kopie angepinnter Meldungen veraltet]** Eine korrigierte angepinnte
  Meldung, die auf keiner geladenen Seite mehr liegt, zeigt den Text vom
  Zeitpunkt des Anpinnens oder des letzten Auftauchens. Ein Rückzug wird
  trotzdem erkannt (D3); nur Korrekturen an sehr alten Meldungen kommen nicht
  an. Hingenommen, weil das Gegenmittel ein Abruf je angepinnter Kennung
  wäre.
- **[Liste zurückgezogener Kennungen wächst]** Je Rückzug 36 Zeichen. Selbst
  hunderte Rückzüge bleiben unter wenigen Kilobyte. Wird das je relevant, kann
  das Backend die Liste auf Rückzüge der letzten Jahre begrenzen.
- **[Kein serverseitiger Entwurf beim Tippen]** Ein Entwurf liegt erst nach
  „Als Entwurf speichern" oder „Veröffentlichen" auf dem Server. Bei einem
  Absturz der App mitten im Schreiben ist der Text weg. Die Capability `admin`
  verlangt nur, dass er bei Verbindungsverlust erhalten bleibt, und das tut
  er, weil der Formularzustand bei jedem Fehler stehen bleibt.
