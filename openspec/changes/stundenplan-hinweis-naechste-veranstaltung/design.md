## Context

Siehe proposal.md - Why. Relevanter Bestand:

- `wochenansicht.ts`s `leerGrund(entries, wochenanfang, wochentag)` liefert bereits `'ohneTermine' | 'gueltigkeitszeitraum'`; `ScheduleScreen.tsx`s `LeererTag` übersetzt das 1:1 in `schedule.tagLeerZeitraum`/`schedule.tagLeerOhneTermine`.
- `wochenrechnung.ts` hat bereits die Bausteine für „nächstes Vorkommen eines Wochentags" (`endeDesNaechstenVorkommens`, für die Deaktivieren-Funktion) sowie `wochentagVonDatum`, `verschiebeDatum`, `datumFuerWochentag`, `wochenanfang` — alle exportiert, keine neue Datumsbibliothek nötig.
- `imGueltigkeitszeitraum(datum, gueltigVon, gueltigBis)` prüft bereits ein einzelnes ISO-Datum gegen einen Zeitraum; `null` an einer Grenze heißt „offen".
- `PlanEntry` (typen.ts) trägt `weekday`, `gueltigVon`, `gueltigBis` an jedem Eintrag, unabhängig vom Wochentag der aktuell angezeigten Woche.

## Goals / Non-Goals

**Goals:**
- Aus dem gesamten `entries`-Bestand das früheste künftige Datum ermitteln, an dem mindestens ein Eintrag gültig ist, ausgehend vom tatsächlichen „jetzt", nicht vom angezeigten Wochenanfang.
- Den bestehenden Leerzustand-Text um diesen Hinweis erweitern, inklusive des Falls „keine bekannt".

**Non-Goals:**
- Keine Änderung an `imGueltigkeitszeitraum`, `terminSchluessel` oder der INT-002-Anbindung.
- Keine Vorschau, welche Veranstaltung das genau ist (Name/Uhrzeit) — nur das Datum. Eine detailliertere Vorschau wäre ein eigenes Requirement mit eigener Abwägung (Datenschutz/Umfang), hier bewusst nicht mitgezogen.
- Kein Zwischenspeichern/Caching der Berechnung über Renders hinweg hinaus, das `useMemo` üblicherweise bietet — der Plan ist geräteseitig klein (siehe `data-and-storage`), eine wöchentliche Neuberechnung ist unproblematisch.

## Decisions

### 1. Eine neue reine Funktion `naechsteGueltigeVeranstaltung(entries, jetztSek)` in `wochenansicht.ts`

Signatur: `(entries: readonly PlanEntry[], jetztSek: number) => string | null` (ISO-Datum oder `null`).

Für jeden Eintrag: Kandidatendatum = das erste Datum ab „heute" (aus `jetztSek`), dessen Wochentag `entry.weekday` entspricht (`wochentagVonDatum`/`verschiebeDatum` schrittweise, wie `endeDesNaechstenVorkommens` es für eine Woche vormacht, hier aber wochenweise weitergezählt, solange `imGueltigkeitszeitraum(kandidat, entry.gueltigVon, entry.gueltigBis)` falsch ist). Die Schleife bricht nach 104 Wochen (zwei Jahre) je Eintrag ab — das deckt jeden real vorkommenden Zeitraum (ein Semester) und verhindert eine Endlosschleife bei einem offenen, aber nie mehr gültigen Zeitraum (`gueltigBis` in der Vergangenheit, `gueltigVon` `null`). Das früheste Kandidatendatum über alle Einträge ist das Ergebnis; findet keiner einen Kandidaten, `null`.

**Alternative verworfen**: Direkt zum ersten Vorkommen ab `gueltigVon` springen statt wochenweise zu zählen. Spart Iterationen, verdoppelt aber den Code (Sonderfall „Vorkommen vor `gueltigVon`" vs. „danach") für eine Eingabegröße (Anzahl `PlanEntry`, typischerweise unter 30), bei der 104 Iterationen je Eintrag keine spürbare Kosten verursachen.

### 2. Aufrufzeitpunkt: „jetzt", nicht der angezeigte Wochenanfang

`ScheduleScreen.tsx` ruft die Funktion mit der echten aktuellen Zeit auf (dieselbe Quelle wie `istAktiv`/die Jetzt-Anzeige), nicht mit `stand.wochenanfang`. Das Requirement verlangt „nächste im persönlichen Plan bekannte Veranstaltung" unabhängig davon, welche Woche gerade betrachtet wird (proposal.md - What Changes).

### 3. `LeererTag` bekommt den vorberechneten Wert als Prop statt selbst zu rechnen

`naechsteGueltigeVeranstaltung(entries, jetztSek)` wird einmal auf Bildschirmebene (`useMemo`, Abhängigkeiten `entries`, gerundetes „jetzt" analog der bestehenden Jetzt-Anzeige) berechnet und nur bei `grund === 'gueltigkeitszeitraum'` als zusätzliches Prop an `LeererTag` gereicht — dieselbe Aufteilung wie beim vorhandenen `grund`-Prop, kein zweiter Zugriff auf `entries` innerhalb der Komponente.

### 4. Formatierung des Datums über `t()` mit ICU-Datumsformat, kein eigener Formatierer

Wie an anderer Stelle in `schedule.*` (Übersetzungsdateien) üblich: Der Übersetzungsschlüssel erhält das ISO-Datum als Parameter, i18next formatiert es lokal- und sprachabhängig (Requirement NFR-F-115, Deutsch/Englisch von Anfang an). Kein manuelles Datumsformat im Code.

## Risks / Trade-offs

**Falscher Eindruck von Genauigkeit, wenn FBWS zwischenzeitlich neue Termine veröffentlicht** → Der Hinweis basiert auf dem zuletzt abgerufenen `entries`-Bestand (gerätelokaler Plan, `data-and-storage`), nicht auf einer Live-Abfrage. Das ist bestehendes Verhalten der ganzen Wochenansicht (kein Auto-Refresh je Sekunde) und wird hier nicht verschärft.

**104-Wochen-Deckel versteckt einen Eintrag mit ungewöhnlich langem, aber gültigem künftigem Zeitraum** → Kein real beobachteter Fall (`dateBegin`/`dateEnd` decken laut `openspec/specs/integrations/spec.md` einzelne Veranstaltungszeiträume, keine mehrjährigen Spannen). Träte er doch auf, zeigt das System „keine bekannt" statt eines falschen Datums — der sichere Fehlerfall, kein stiller Datenverlust.

## Sequenzierung

Dieser Change setzt `stundenplan-wochenansicht-nutzerfuehrung` voraus (noch nicht archiviert): Das Requirement „Kennzeichnung eines leeren Wochentags" und `leerGrund` müssen aus jenem Change übernommen sein, bevor dieser MODIFIED-Delta greift. Die Spec-Delta-Datei dieses Changes kopiert daher den Requirement-Text jenes Changes als Basis (nicht den noch in `openspec/specs/schedule/spec.md` stehenden Vorgänger „Leerer Tag bei wirksamem Filter").
