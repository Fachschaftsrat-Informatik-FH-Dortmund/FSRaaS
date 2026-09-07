## Context

Siehe proposal.md – „Why" für die Motivation. Technischer Ausgangspunkt:

- `SpeiseplanAktualisierungJob.MensaAktualisierenAsync` (`backend/src/Fb4.Backend/Infrastructure/Mensa/SpeiseplanAktualisierungJob.cs:77-114`) ruft je Mensa bereits `ItmcMensaClient.AlleTageAsync` auf — `GET /canteens/{id}` liefert **alle** von INT-015 geführten Tage einer Mensa in einem Aufruf (Datum → Gerichtsliste). Der Job löscht bei jedem Lauf alle vorhandenen `SpeiseplanTag`-Zeilen dieser Mensa und schreibt für **jedes** von der Quelle zurückgegebene Datum eine neue Zeile — unabhängig davon, ob die Gerichtsliste leer ist. Der Zwischenspeicher (`Speiseplaene`) kennt damit nach jedem Lauf exakt den Zeithorizont, den die Quelle für diese Mensa aktuell führt.
- `SpeiseplanStore.TagAsync` (`backend/src/Fb4.Backend/Infrastructure/Mensa/SpeiseplanStore.cs:24-41`) liest genau eine Zeile für `(mensaId, datum)` und liefert `([], stand)`, wenn keine Zeile existiert oder ihre Gerichtsliste leer ist — das ist bereits die einzige Stelle, die „geschlossen" feststellt.
- App-seitig ersetzt `naechsterOeffnungstag` (`app/src/areas/canteen/oeffnungszeiten.ts:38-48`) die Wiedereröffnungs-Schätzung rein aus `Mensa.oeffnungszeiten` (gepflegte Wochenschablone), ohne jeden Bezug zum tatsächlichen Speiseplan. `CanteenScreen.tsx` ruft diese Funktion für jeden `geschlossen`-Abschnitt auf und übergibt das Ergebnis (einen Wochentag-Index) an den Übersetzungsschlüssel `mensa.wiederGeoeffnet`.

## Goals / Non-Goals

**Goals:**
- Der Wiedereröffnungshinweis beruht auf demselben Datenbestand, den der Speiseplan selbst verwendet — keine zweite, unabhängige Datenquelle mit eigenem Wahrheitsanspruch.
- Kein zusätzlicher Aufruf an INT-015 und keine zusätzliche App-zu-Backend-Rundreise über mehrere Tage — die Antwort entsteht aus einer einzigen zusätzlichen, günstigen Datenbankabfrage innerhalb des ohnehin abgerufenen Tages-Endpunkts.
- Die Suche ist nicht künstlich auf sieben Tage begrenzt, sondern reicht so weit wie der Zwischenspeicher selbst (Requirement „Untere Grenze der Tagesauswahl": obere Grenze ergibt sich aus dem Datenbestand).

**Non-Goals:**
- Keine Änderung an `Mensa.oeffnungszeiten` oder an der Anzeige der Öffnungszeit für Tage **mit** Angebot (Requirements „Öffnungszeiten je Mensa und Wochentag", „Öffnungszeit an der Mensa-Abschnittsüberschrift") — nur die Wiedereröffnungs-Ermittlung für Tage **ohne** Angebot ändert ihre Grundlage.
- Kein neuer INT-015-Aufruf, keine Änderung an `SpeiseplanAktualisierungJob`s Abrufzeitplan oder an `AlleTageAsync`.
- Keine Unterscheidung „geschlossen" vs. „Quelle liefert keine Daten" — bleibt wie bisher ununterscheidbar (Erläuterung in `openspec/specs/canteen/spec.md`).
- Keine Anzeige eines vollständigen Kalenderdatums zusätzlich zum Wochentagnamen (siehe „Offene Fragen").

## Decisions

### D1 — Neue Spalte `AnzahlGerichte` statt String-Vergleich auf `GerichteJson`

`SpeiseplanTag` bekommt eine zusätzliche, beim Schreiben gesetzte Spalte `AnzahlGerichte` (Anzahl der Einträge in `GerichteJson`), damit die Suche nach dem nächsten Tag mit Angebot per SQL (`WHERE "AnzahlGerichte" > 0`) läuft, statt bei jeder Abfrage die JSON-Spalte jeder Kandidatenzeile zu deserialisieren oder sich auf die exakte Zeichenfolge `"[]"` als leere Liste zu verlassen.

*Alternative:* Vergleich `GerichteJson <> '[]'`. Verworfen — funktioniert nur, solange die Serialisierung stabil exakt `[]` ohne Leerzeichen erzeugt; eine künftige Änderung an der `JsonSerializerOptions`-Konfiguration (z. B. `WriteIndented`) würde die Prüfung stillschweigend brechen, ohne dass ein Test das anzeigt, solange niemand gezielt eine leere Liste prüft.

Migration: `AnzahlGerichte int NOT NULL DEFAULT 0`, rückwirkend befüllt aus der bestehenden `GerichteJson`-Spalte (ein `UPDATE` in der Migration, siehe Migration Plan) und ab sofort von `SpeiseplanAktualisierungJob` beim Schreiben jeder Zeile gesetzt (`cache.Count`).

### D2 — Erweiterung des bestehenden Tages-Endpunkts, kein neuer Endpunkt

`GET /mensen/{mensaId}/speiseplan/{datum}` (`openspec/specs/api-contract.yaml`) bekommt ein neues optionales Antwortfeld:

```yaml
naechsteOeffnung:
  type: string
  format: date
  nullable: true
  description: >
    Nächster Tag nach `datum`, für den der Speiseplan-Zwischenspeicher dieser
    Mensa ein Angebot führt. Nur gesetzt, wenn `gerichte` leer ist; `null`,
    wenn kein solcher Tag im bekannten Zeithorizont liegt.
```

`SpeiseplanStore.TagAsync` berechnet dieses Feld nur, wenn `gerichte` leer ist (eine zusätzliche Abfrage `Speiseplaene.Where(t => t.MensaId == mensaId && t.Datum > datum && t.AnzahlGerichte > 0).OrderBy(t => t.Datum).Select(t => t.Datum).FirstOrDefaultAsync()`), sonst bleibt es `null`, ohne die zusätzliche Abfrage überhaupt auszuführen.

*Alternative:* eigener Endpunkt `GET /mensen/{mensaId}/naechste-oeffnung/{datum}`. Verworfen — die App braucht den Wert ausschließlich zusammen mit dem Tages-Speiseplan derselben Mensa, den sie ohnehin abruft; ein zweiter Endpunkt bedeutet einen zweiten Aufruf für dieselbe Information zur selben Zeit, ohne eigenen Nutzen.

*Alternative:* serverseitig immer berechnen, auch wenn `gerichte` nicht leer ist. Verworfen — unnötige Datenbankarbeit bei jedem Aufruf eines offenen Tages, dem häufigsten Fall.

### D3 — App: `naechsterOeffnungstag` entfällt, Feld direkt aus der Antwort

`app/src/areas/canteen/oeffnungszeiten.ts` verliert `naechsterOeffnungstag` ersatzlos; `oeffnungszeitFuer` bleibt unverändert (weiterhin zuständig für die Öffnungszeit an Tagen mit Angebot). Der `Speiseplan`-Typ in `app/src/areas/canteen/api.ts` bekommt das Feld `naechsteOeffnung: string | null`. `CanteenScreen.tsx` liest es aus der Antwort der jeweils geschlossenen Mensa, statt es aus den Öffnungszeiten zu errechnen.

Formatierung: Der Hinweis übersetzt `naechsteOeffnung` (ein ISO-Datum) weiterhin über den Wochentag-Schlüssel `mensa.weekday.<n>` für Tage innerhalb der laufenden Woche; liegt das Datum mehr als sechs Tage entfernt, ergänzt der Hinweis das Datum in Kurzform (`t('mensa.wiederGeoeffnetDatum', { datum })`), damit „Montag" nicht mit dem nächsten oder übernächsten Montag verwechselt wird. Neuer Schlüssel `mensa.wiederGeoeffnetDatum` in `de.json`/`en.json` neben dem bestehenden `mensa.wiederGeoeffnet`.

### D4 — Zeithorizont ist implizit, keine explizite Obergrenze im Vertrag

Die Suche nach dem nächsten Tag mit Angebot hat keine im Vertrag festgelegte Tagesgrenze (anders als die verworfene „höchstens sieben Tage" aus `canteen-mensa-kontext`) — sie endet, sobald der Zwischenspeicher keine weitere Zeile mit `AnzahlGerichte > 0` mehr liefert. Das folgt der Entscheidung der Nutzerin: Die Tagesauswahl selbst kennt keine Obergrenze außer dem Datenbestand (Requirement „Untere Grenze der Tagesauswahl"), der Wiedereröffnungshinweis soll sich nicht widersprüchlich enger verhalten. Der Zeithorizont ist damit kein fester Wert, sondern folgt automatisch dem, was INT-015 über `GET /canteens/{id}` gerade liefert (erfahrungsgemäß mehrere Wochen, siehe „Offene Fragen").

## Risks / Trade-offs

- **Der Zeithorizont von INT-015 ist nicht vertraglich zugesichert** (`openspec/specs/integrations/spec.md` INT-015: „keine erkennbare Versionszusage über v3 hinaus, kein SLA") → Liefert die Quelle einmal nur wenige Tage voraus, liefert der Hinweis entsprechend seltener einen Wiedereröffnungstag; das ist kein Fehlverhalten, sondern die ehrliche Abbildung des tatsächlichen Datenbestands, und strenger als die alte, aus einer Schablone geratene Aussage.
- **Der Speiseplan eines weit in der Zukunft liegenden Tages kann sich bis dahin noch ändern** (Gerichte, oder die Mensa schließt doch) → Der Hinweistext bleibt bewusst eine Aussage über die Öffnung, nicht über ein bestimmtes Gericht (unverändert aus D1 von `canteen-mensa-kontext`); der Zwischenspeicher wird ohnehin bei jedem Job-Lauf komplett neu geschrieben, sodass sich der Hinweis bei einer Planänderung von selbst korrigiert.
- **Migration der neuen Spalte auf bestehenden Daten** → Rückwirkende Befüllung aus `GerichteJson` in derselben Migration (siehe Migration Plan), kein Datenverlust, keine manuelle Nacharbeit nötig.

## Migration Plan

1. EF-Core-Migration: Spalte `AnzahlGerichte int NOT NULL DEFAULT 0` auf `Speiseplaene`, im selben Migrationsschritt per SQL aus der Länge des in `GerichteJson` gespeicherten JSON-Arrays befüllt (einmaliger `UPDATE`, keine Anwendungslogik nötig, da beim nächsten Job-Lauf ohnehin komplett neu geschrieben wird).
2. `SpeiseplanAktualisierungJob` setzt `AnzahlGerichte = cache.Count` beim Schreiben jeder Zeile.
3. `openspec/specs/api-contract.yaml`: neues Feld `naechsteOeffnung` an der bestehenden Antwort, Fassung erhöhen (`specs/README.md` Abschnitt 8 gilt hier sinngemäß für den Vertrag: Änderung ist rückwärtskompatibel, additiv).
4. `SpeiseplanStore.TagAsync` erweitert um die bedingte Zusatzabfrage.
5. App: `naechsterOeffnungstag` entfernen, `Speiseplan`-Typ und `CanteenScreen.tsx` auf das neue Feld umstellen, neue Übersetzungsschlüssel ergänzen.

Rücknahme: Revert des Merges; die neue Spalte bleibt ungenutzt liegen, bis eine spätere Migration sie entfernt — kein Datenverlust, kein Konfliktrisiko mit dem alten Verhalten, weil `naechsterOeffnungstag` vollständig entfällt statt daneben zu bestehen.

## Open Questions

- **Tatsächlicher Zeithorizont von INT-015** — wie viele Tage `GET /canteens/{id}` in der Praxis üblicherweise voraus liefert, ist nicht dokumentiert (INT-015-Eintrag nennt nur die Antwortstruktur, keine Zeitspanne). Ändert weder Spezifikation noch Vorgehen: Die Suche ist unabhängig von der konkreten Spanne korrekt, sie liefert nur seltener oder häufiger ein Ergebnis. Zu beobachten bei der Verifikation dieses Changes.
