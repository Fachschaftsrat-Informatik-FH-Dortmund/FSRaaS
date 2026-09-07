## 1. Vertrag

- [ ] 1.1 `openspec/specs/api-contract.yaml`: Antwortschema von `GET /mensen/{mensaId}/speiseplan/{datum}` um das optionale Feld `naechsteOeffnung` (`type: string, format: date, nullable: true`) ergänzen, Fassung erhöhen (design.md D2). Verifikation: `openspec validate` bzw. das projekteigene Vertragsprüfskript unter `tools/` läuft grün, generierte Contract-Typen enthalten das neue Feld.

## 2. Backend — Zwischenspeicher

- [ ] 2.1 EF-Core-Migration: Spalte `AnzahlGerichte int NOT NULL DEFAULT 0` auf `Speiseplaene`, rückwirkend aus der Länge des `GerichteJson`-Arrays befüllt (design.md Migration Plan Schritt 1). Verifikation: Migration wendet sich auf einer Kopie der bestehenden Datenbank fehlerfrei an, bestehende Zeilen tragen danach die korrekte Anzahl.
- [ ] 2.2 `SpeiseplanAktualisierungJob.MensaAktualisierenAsync` setzt `AnzahlGerichte = cache.Count` beim Schreiben jeder `SpeiseplanTag`-Zeile (design.md Migration Plan Schritt 2). Verifikation: bestehende Fälle in `SpeiseplanAktualisierungJobTests.cs` weiterhin grün, ergänzt um einen Fall, der die gesetzte Spalte für einen Tag ohne Gerichte prüft.
- [ ] 2.3 `SpeiseplanStore.TagAsync` erweitern: wenn die ermittelte Gerichtsliste leer ist, zusätzlich den nächsten Tag mit `AnzahlGerichte > 0` für dieselbe Mensa nach dem angefragten Datum ermitteln (design.md D2); sonst bleibt das Feld `null`, ohne die Zusatzabfrage auszuführen. Verifikation: `describe('Wiedereröffnungshinweis an der geschlossenen Mensa', …)` in `MensaSpeiseplanTests.cs` prüft beide Scenarios aus der Spec sowie „Zwischenzeitlich veröffentlichter Speiseplan".
- [ ] 2.4 Endpunkt-Projektion (`Fb4.Backend.Contract.Generated`-Typ `Speiseplan`/Response-DTO) um `naechsteOeffnung` ergänzen und aus `SpeiseplanStore.TagAsync` durchreichen. Verifikation: bestehender Endpunkt-Test in `MensaSpeiseplanTests.cs` erwartet das Feld in der JSON-Antwort.

## 3. App

- [ ] 3.1 `app/src/areas/canteen/oeffnungszeiten.ts`: `naechsterOeffnungstag` entfernen, `oeffnungszeitFuer` unverändert lassen; zugehörige Fälle aus `oeffnungszeiten.test.ts` entfernen, die ausschließlich die entfallene Funktion prüften. Verifikation: `npm run typecheck` und `npm test` grün.
- [ ] 3.2 `Speiseplan`-Typ in `app/src/areas/canteen/api.ts` um `naechsteOeffnung: string | null` erweitern (aus dem generierten Vertragstyp). Verifikation: `npm run typecheck` grün.
- [ ] 3.3 `CanteenScreen.tsx`: geschlossene Abschnitte lesen `naechsteOeffnung` aus der Speiseplan-Antwort der jeweiligen Mensa statt `naechsterOeffnungstag` aufzurufen; Formatierung nach design.md D3 (Wochentag innerhalb der laufenden Woche, sonst zusätzlich das Datum über den neuen Schlüssel `mensa.wiederGeoeffnetDatum`). Verifikation: `describe('Wiedereröffnungshinweis an der geschlossenen Mensa', …)` in `CanteenScreen.test.tsx` prüft „Geschlossene Mensa mit späterem Angebot im Zwischenspeicher", „Kein bekannter Tag mit Angebot" und den Datumszusatz bei mehr als sechs Tagen Abstand.
- [ ] 3.4 `de.json`/`en.json`: neuen Schlüssel `mensa.wiederGeoeffnetDatum` ergänzen (NFR-F-115, keine Zeichenkette fest im Code). Verifikation: i18n-Vollständigkeitsprüfung (bestehendes Skript/Test für parallele Schlüssel in beiden Sprachdateien) grün.

## 4. Abschluss

- [ ] 4.1 Gesamten Testlauf (`npm test` app-seitig, Backend-Testsuite) sowie `npm run typecheck` einmal vollständig grün bestätigen. Verifikation: beide Läufe ohne Fehler, Ergebnis im PR/Commit vermerkt.
