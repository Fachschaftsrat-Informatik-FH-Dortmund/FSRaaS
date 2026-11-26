## Context

Der Raumplan-Zwischenspeicher liefert `/raeume/uebersicht` mit dem Feld
`besetztMeldungen`, bisher fest `0` (`RaumplanEndpoints.cs`). Der Vertrag
beschreibt `POST /raeume/{roomId}/besetzt-meldungen` bereits: Idempotenz-Kopf,
Antworten 202 und 429, ohne Anfragerumpf. Umgesetzt ist der Endpunkt nicht.
Eine Ratenbegrenzung gibt es im Backend noch nirgends. Hinter dem
nginx-Reverse-Proxy wertet das Backend `X-Forwarded-For` aus
(`ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` in `deploy/fsrfb4aas.service`).
`RemoteIpAddress` ist damit die Adresse der Person, nicht die des Proxys.

Auf der App-Seite ist TanStack Query 5.102 mit AsyncStorage-Persister
eingerichtet. `onlineManager` wird aus NetInfo gespeist. Mutationen laufen bisher
nur in der Verwaltung und dort bewusst mit `networkMode: 'online'` ohne
Persistenz (ARCH-F-125-Ausnahme). Eine Warteschlange existiert nicht.
`state/queryClient.ts` verweist für sie ausdrücklich auf Schritt 6.

## Goals / Non-Goals

**Goals:**

- Melden, Zählen, Zurückziehen und Ablauf von Besetzt-Meldungen, Ende zu Ende
- Idempotenz und Ratenbegrenzung für den ersten kontofreien Schreibpfad
- eine generische Offline-Schreib-Warteschlange, die spätere Schreibpfade ohne
  Umbau übernehmen

**Non-Goals:**

- Markierung massenhafter Beiträge zur Moderation
- Ratenbegrenzung der Lesepfade
- Laufwege-Nähe-Suche
- SCHED-F-410 bis SCHED-F-450

## Decisions

### Datenmodell ohne Quellenbezug

`BesetztMeldung` hat genau diese Felder:

- `Id` (Guid, gleich dem Idempotenz-Schlüssel)
- `RoomId`
- `GemeldetAm`
- `ZurueckgezogenAm?`

Nicht gespeichert werden Netzadresse, Gerätekennung, User-Agent und
Client-Version. Das Datenmodell der Capability `room-finder` sieht nur
„`roomId`, Zeitstempel" vor. Der Idempotenz-Schlüssel ist eine
Zufallskennung je Meldung. Er verknüpft zwei Meldungen desselben Geräts nicht
miteinander und ist deshalb kein Personenbezug.

Alternative: den Schlüssel nur gehasht speichern. Verworfen, weil das keinen
Schutz bringt. Wer die Datenbank lesen kann, kann Meldungen ohnehin ändern.

### Zurückziehen über die Meldungskennung

Die App erzeugt je Meldung einen UUID-v4-Schlüssel und sendet ihn als
`Idempotency-Key`. Zum Zurückziehen sendet sie dieselbe Kennung an
`DELETE /raeume/{roomId}/besetzt-meldungen/{meldungId}`. Damit ist „dieselbe
Gerätesitzung" aus dem Requirement „Besetzt-Meldung zurückziehen" erfüllt,
ohne Konto und ohne Gerätekennung. Nur das Gerät kennt die Kennung. Keine
Leseantwort liefert sie aus.

Wer die Kennung nicht kennt, kann nichts zurückziehen. Raten scheitert an
122 Zufallsbits.

`DELETE` antwortet immer mit 204, auch wenn die Meldung unbekannt, schon
abgelaufen oder einem anderen Raum zugeordnet ist. Das hat zwei Gründe:

- Der Zielzustand „Meldung nicht aktiv" ist dann erreicht.
- Ein aus der Warteschlange wiederholtes `DELETE` darf nicht als dauerhafter
  Fehler bei der Nutzerin landen.

Die Antwort verrät außerdem nicht, ob eine Kennung existiert.

Zurückziehen setzt `ZurueckgezogenAm`, statt die Zeile zu löschen. Kommt ein
`POST` mit derselben Kennung später noch einmal an, etwa als verspätete
Wiederholung, bleibt die Meldung zurückgezogen. Das verlangt das Requirement
„Idempotente Besetzt-Meldung". Der Aufräumjob entfernt die Zeile nach Ablauf
ohnehin.

### Gültigkeit ab Auslösezeitpunkt

Der Anfragerumpf trägt `gemeldetAm`, den Zeitpunkt der Auslösung auf dem
Gerät. Das Backend verarbeitet ihn so:

- Es speichert `min(gemeldetAm, jetzt)`. Zukunftswerte bei falsch gehender
  Geräteuhr gelten damit als „jetzt".
- Gezählt wird, wenn `jetzt − 90 min < GemeldetAm ≤ jetzt` gilt und die
  Meldung nicht zurückgezogen ist.
- Bei `zeitpunkt`-Abfragen der Übersicht gilt dasselbe Fenster relativ zum
  Bezugszeitpunkt.
- Eine Meldung, die beim Eingang schon abgelaufen ist, wird nicht
  gespeichert. Die Antwort ist trotzdem 202, mit `gueltigBis` in der
  Vergangenheit. Die Warteschlange entfernt den Eintrag dann wie jeden
  erfolgreichen.

Wer `gemeldetAm` zurückdatiert, verkürzt nur die Wirkung der eigenen Meldung.
Das bringt keinen Missbrauchsgewinn.

Die 90 Minuten sind eine Konstante im Backend (`BesetztMeldung.Gueltigkeit`).
Die App liest den Wert nicht. Sie bekommt `gueltigBis` in der Quittung und
merkt sich dieses Ende für ihre eigenen Meldungen.

### Aufräumen

`BesetztMeldungAufraeumJob` (`PeriodicJobService`) läuft alle 15 Minuten. Er
löscht jede Zeile mit `GemeldetAm < jetzt − 90 min`, zurückgezogen oder nicht.
Der Bestand bleibt damit dauerhaft klein, und nichts liegt länger als nötig.
Das Ergebnis erscheint im Health-Check (API-F-260).

### Raumprüfung

Ein `POST` für eine Kennung, die weder der Raumplan noch die kuratierte Liste
kennt, bekommt 404 `raum_unbekannt`. Die Bekanntheitsprüfung aus
`/raeume/{roomId}/belegung` wird dafür in eine gemeinsame Hilfsmethode
gezogen. So entstehen keine Zählungen für Fantasie-Kennungen.

In der Warteschlange ist 404 ein dauerhafter Fehler. Die Nutzerin entscheidet
dann über Verwerfen oder erneuten Versuch.

Vor dem ersten Raumplan-Abruf, wenn noch kein Bestand da ist, antwortet der
Endpunkt mit 503 `raumplan_nicht_verfuegbar`, wie die Lese-Endpunkte. Die App
versucht es dann erneut.

### Ratenbegrenzung

ASP.NET Core `RateLimiter` mit der Richtlinie `kontofrei-schreiben`:

- Fester Zeitfenster-Limiter je Partition, Arbeitswerte 30 Anfragen je
  10 Minuten, ohne Warteschlange.
- Die Werte kommen aus der Konfiguration unter `Ratenbegrenzung:KontofreiSchreiben`.
- Die Partition ist die Netzadresse, bei IPv6 das /64-Präfix. Ein Anschluss
  kann sonst durch Adresswechsel innerhalb seines Präfixes beliebig viele
  Partitionen erzeugen.
- Ohne Adresse, etwa im TestServer, fällt alles in eine Partition „unbekannt".
- Die Partitionen leben nur im Arbeitsspeicher des Prozesses und verfallen
  mit ihrem Fenster.

Eine abgewiesene Anfrage bekommt 429 mit Problem-Rumpf
(`code: zu_viele_anfragen`) und `Retry-After` in Sekunden. In der App ist 429
schon als wiederholbar eingeordnet (`net/problem.ts`). Die Warteschlange
wiederholt also mit Backoff.

Warum so großzügig: Auf dem Campus teilen sich viele Geräte wenige öffentliche
Adressen (eduroam-NAT). Ein enges Limit je Adresse würde dort alle gemeinsam
treffen. Gegen eine einzelne Person, die viele Meldungen erzeugt, schützt die
App zusätzlich: Pro Raum gibt es höchstens eine aktive eigene Meldung. Wer die
App umgeht, wird durch die Begrenzung je Adresse gebremst.

Jede greifende Begrenzung protokolliert das Backend als Warnung mit Endpunkt,
ohne Adresse. Das ist der Ansatzpunkt für die spätere Mustererkennung
(IDENT-F-065), siehe „Open Questions".

Die Richtlinie gilt für `POST` und `DELETE` der Besetzt-Meldungen. Spätere
kontofreie Schreibpfade, etwa Helfer-Anmeldungen, hängen sich mit
`RequireRateLimiting("kontofrei-schreiben")` an.

### Vertrag

- `POST`:
  - Anfragerumpf `BesetztMeldungEingabe { gemeldetAm: date-time }`.
  - 202 mit `BesetztMeldungQuittung { meldungId: uuid, gueltigBis: date-time }`.
  - Fehler: 400 (`idempotenz_schluessel_fehlt`, `gemeldet_am_fehlt`),
    404 `raum_unbekannt`, 409 `idempotenz_konflikt`, 429, 503.
- `DELETE /raeume/{roomId}/besetzt-meldungen/{meldungId}`: 204 und 429.
- Die Vertragsfassung steigt auf 0.9.0 (0.8.0 vergab der Change `pruefungsbestand-aus-raumplan`), weil ein Pfad und Schemas neu
  hinzukommen. Das ist nicht brechend: Den `POST` nutzt noch kein Client.

### Generische Offline-Schreib-Warteschlange (`app/src/state/schreibwarteschlange.ts`)

Die Warteschlange baut auf der Mutation-Pause/Resume von TanStack Query auf,
wie ADR 0013 festlegt. Eine eigene Speicherschicht kommt nicht dazu.

- **Registrierung**: `definiereSchreibvorgang(art, { ausfuehren, nachErfolg?, beschreibe })`
  liefert eine Beschreibung. `registriereSchreibvorgaenge(client, [...])`
  setzt dafür `setMutationDefaults(['schreibvorgang', art], …)`. Das passiert
  in `createQueryClient`, also vor der Wiederherstellung aus dem Persister.
  Eine wiederhergestellte Mutation findet ihre Funktion nur, wenn die Vorgaben
  vor dem `hydrate` gesetzt sind.
- **Einreihen**: `reiheEin(client, beschreibung, nutzdaten)` erzeugt eine
  Mutation über `getMutationCache().build(…)` und führt sie aus. Die
  Variablen tragen `{ id, eingereihtAm, nutzdaten }`. `id` ist eine UUID aus
  `expo-crypto` und dient zugleich als Idempotenz-Schlüssel.
- **Reihenfolge**: Alle Einträge teilen `scope: { id: 'schreibwarteschlange' }`.
  TanStack führt Mutationen desselben Scopes nacheinander in
  Entstehungsreihenfolge aus und hält die späteren pausiert. Das ist DATA-F-100.
  Ein dauerhaft fehlgeschlagener Eintrag blockiert die folgenden nicht.
- **Netz**: `networkMode: 'online'`. Ohne Netz pausiert die Mutation, beim
  Wechsel des `onlineManager` auf online setzt TanStack sie fort. Das ist
  ARCH-F-120/ARCH-F-160.
- **Wiederholung**: Nur bei `AppError.retryable` (Netz, Zeitüberschreitung,
  5xx, 429), höchstens 5 Wiederholungen. Die Abstände wachsen als
  `min(2 s · 2^n, 5 min)`. Das sind die Arbeitswerte für die offene Frage in
  `data-and-storage`. Nicht wiederholbare Fehler wie 400, 404 und 409 gehen
  sofort in den Fehlerzustand.
- **Persistenz**: `shouldDehydrateMutation` nimmt Einträge der Warteschlange
  in den Zuständen `pending` (wartend oder laufend) und `error` auf. Die
  Vorgabe nähme nur pausierte. Nach der Wiederherstellung ruft
  `setzeWarteschlangeFort(client)` jeden wartenden Eintrag mit `continue()`
  wieder an, auch einen, der beim Beenden der App gerade lief. Die
  Scope-Regel hält die Reihenfolge ein. Eine doppelte Wirkung verhindert der
  Idempotenz-Schlüssel.
- **Erfolg**: Ein Abonnent des Mutation-Caches entfernt erfolgreiche Einträge
  sofort. `gcTime` ist für Einträge der Warteschlange `Infinity`, damit ein
  fehlgeschlagener Eintrag nicht nach fünf Minuten still verschwindet.
- **Manuelle Entscheidung** (DATA-F-110):
  - `versucheErneut(client, eintrag)` entfernt die alte Mutation und reiht
    dieselben Variablen neu ein, also mit derselben `id` und damit idempotent.
  - `verwirf(client, eintrag)` entfernt sie.
  - Beide bietet der Statusbaustein an.
- **Verfall**: Einträge mit `eingereihtAm` älter als 7 Tage entfernt
  `raeumeVerfalleneAuf` beim Fortsetzen und beim Lesen des Status. Der Verfall
  wird über `logDatenhinweis` protokolliert, ohne Nutzdaten.
- **Status**: `useSchreibwarteschlange(art?)` liefert die Einträge mit Zustand
  `wartend`, `laeuft` oder `fehlgeschlagen` über `useMutationState` und
  aktualisiert sich bei Änderungen. `ui/SchreibwarteschlangeStatus.tsx` zeigt
  sie mit der bereichseigenen Beschreibung (`beschreibe(nutzdaten, t)`) und
  den beiden Entscheidungen an.
- **Verwaltung bleibt ausgenommen**: Die Grundeinstellung
  `mutations.networkMode: 'online'` ohne Persistenz bleibt für alle anderen
  Mutationen bestehen. Verwaltungshandlungen werden weiterhin abgelehnt statt
  eingereiht (ARCH-F-125).
- **Zurückziehen eines noch nicht übertragenen Eintrags**: Liegt das `POST`
  noch in der Warteschlange, entfernt die App es dort, statt ein `DELETE`
  hinterherzuschicken. Liegt es nicht mehr dort, reiht sie ein `DELETE` ein.
  Das geht auch offline, denn eine Rücknahme überschreibt keinen fremden
  Stand.

Alternative: eine eigene Warteschlange über AsyncStorage. Verworfen in
ADR 0013, weil Wartungslast entstünde. Die Scope-Serialisierung und die
Pause-Logik von TanStack decken FIFO und Fortsetzen ab. Selbst zu bauen sind
nur Persistenz-Filter, Verfall und Status, und die bleiben schmal.

### Eigene Meldungen auf dem Gerät

`room-finder/eigeneMeldungen.ts` hält unter `fb4:raum.eigeneBesetztMeldungen`
eine Liste `{ meldungId, roomId, gueltigBis }` aller übertragenen eigenen
Meldungen. Abgelaufene Einträge werden beim Lesen entfernt. Eine
Kontoverknüpfung gibt es nicht. „Alle lokalen Daten löschen" erfasst die
Liste über das Präfix.

Noch nicht übertragene Meldungen liest die App aus der Warteschlange selbst
und führt sie nicht doppelt.

### Oberfläche

- **Tagesbelegung (`RoomDayScreen`)**: Unter der Überschrift steht ein
  Baustein `BesetztMeldung`.
  - Er zeigt die Anzahl gültiger Meldungen aus der Übersicht, die ohnehin
    jede Minute neu geladen wird.
  - Ohne eigene Meldung zeigt er die Schaltfläche „Als besetzt melden".
  - Mit eigener Meldung zeigt er „Du hast diesen Raum gemeldet (gültig bis
    HH:MM)" und „Meldung zurückziehen".
  - Ist die eigene Meldung noch nicht übertragen, steht dort „Wird übertragen,
    sobald du online bist".
  - Offline zeigt der Bildschirm wie bisher die Nicht-verfügbar-Kennzeichnung.
    Darunter bleibt der Melde-Baustein bedienbar. Das ist die Ausnahme aus dem
    Abschnitt „UI-Flows & Zustände" der Capability `room-finder`.
- **Unter der Offline-Kennzeichnung des Bereichs (`RaumOffline`)** steht
  `BesetztMeldenPerKennung`: ein Feld für die Raumkennung und die
  Schaltfläche „Als besetzt melden". So erfüllt sich
  das Szenario „Besetzt-Meldung offline", ohne dass die Übersicht geladen sein
  muss.
- **Übersicht und Freie-Raum-Suche**: Bei `besetztMeldungen > 0` erscheint die
  Zeile „N× als besetzt gemeldet" mit Symbol und Text, nicht nur farbig.
  Zustand frei/belegt bleibt der offizielle. Das ist das Requirement
  „Besetzt-Meldung zusätzlich in der Übersicht anzeigen".
- Der Statusbaustein der Warteschlange erscheint oben im Raum-Bereich,
  solange er Einträge der Art `besetztMeldung` oder `besetztMeldungZurueckziehen`
  hat.
- Nach einer erfolgreichen Meldung oder Rücknahme werden `['raumuebersicht']`
  invalidiert. Die Anzahl steigt dann sichtbar.

## Risks / Trade-offs

- **Die geteilte Adresse im Hochschulnetz** kann bei Missbrauch durch eine
  Person auch andere bremsen. Gegenmittel: der großzügige, konfigurierbare
  Schwellwert und die Warnung im Protokoll, damit Häufungen auffallen.
- **Die Geräteuhr bestimmt die Gültigkeit mit.** Sie ist nach oben auf den
  Eingang begrenzt. Eine nachgehende Uhr verkürzt nur die eigene Meldung.
- **Interne API von TanStack.** `getMutationCache().build` ist öffentliche,
  aber wenig dokumentierte API. Die Tests der Warteschlange laufen gegen einen
  echten `QueryClient` und schlagen bei einer Verhaltensänderung in einer
  neuen Version fehl.
- **Ein laufender Eintrag beim Beenden der App** wird nach dem Neustart erneut
  gesendet. Der Idempotenz-Schlüssel macht das unschädlich.
- **Mehrere Prozesse**: Der Limiter liegt im Prozessspeicher. Bei mehr als
  einer Backend-Instanz müsste er verteilt werden. Heute läuft eine Instanz
  auf dem VPS.

## Migration Plan

- Eigene EF-Migration `BesetztMeldungen` (Tabelle `BesetztMeldungen`, Index
  `(RoomId, GemeldetAm)`). Rein additiv, kein Rückbau nötig.
- `DbInitializer` spielt sie beim Start ein.

## Open Questions

- Mustererkennung kontofreier Beiträge (IDENT-F-065): Welches Merkmal trägt
  die Markierung, und wo landet sie? Bleibt offen, bis eine
  Moderationsoberfläche existiert. Dieser Schnitt speichert keine
  Quellenkennung.
- Ob 30 Anfragen je 10 Minuten im Hochschulnetz passen, zeigt erst der
  Betrieb. Der Wert ist per Konfiguration änderbar.
