## 1. Vertrag

- [x] 1.1 `api-contract.yaml` auf Fassung 0.8.0:
  - `GET /meldungen` mit `zurueckgezogen`-Kennungen, 400-Codes `cursor_ungueltig` und `limit_ungueltig`
  - `GET /meldungen/entwuerfe/{entwurfId}` neu
  - `If-Match` beim Veröffentlichen, 404/409/412 je Pfad
  - `Meldung` ohne `zurueckgezogen`
  - `Meldungsentwurf` mit `veroeffentlichtAm` und `geaendertAm`, ohne `geplanteVeroeffentlichung`

  Prüfen: `node tools/contract-codegen/src/generate.mjs` läuft durch.

## 2. Backend

- [x] 2.1 Domänenobjekt `Meldungseintrag`, `DbSet` und Modellkonfiguration (Concurrency-Token `Version`, Index auf Zustand und Zeitpunkt), Migration `NewsRedaktion`. Prüfen: `dotnet build` grün, die Migration legt nur die Tabelle `Meldungen` an.
- [x] 2.2 `MeldungenStore`: Seite lesen mit Cursor, zurückgezogene Kennungen, Entwürfe lesen, anlegen, ändern, veröffentlichen, zurückziehen nach D2 inklusive Pflichtangaben und `If-Match`. Endpunkte in `MeldungenEndpoints.cs` (Lesepfad kontofrei, Redaktion hinter `fsr-redaktion`, Protokolleintrag je Handlung), Registrierung in `Program.cs` und `TestAppFactory`. Prüfen mit Tests in `MeldungenTests.cs`:
  - „Laden und Anzeige aktueller Meldungen"
  - „Nachladen älterer Meldungen"
  - „Meldungsredaktion für FSR-News"
  - „Entfernen zurückgezogener Meldungen aus der Liste"
  - „Ablehnung bei gleichzeitiger Änderung einer Meldung"
  - „Ablehnung des Zugriffs ohne Verwaltungsrolle"
  - „Protokollierung verändernder Verwaltungshandlungen"

  `dotnet test` grün.

## 3. App: News-Tab

- [x] 3.1 `news/api.ts` (`useMeldungen` als Infinite Query, Typen aus dem Vertrag). `news/zeitstempel.ts` mit Tests „24-Stunden-Zeitformat für Zeitstempel".
- [x] 3.2 `news/angepinnt.ts`: Ablage, Abgleich und Ordnung nach D4. Tests:
  - „Anpinnen und Ablösen einzelner Meldungen"
  - „Dauerhafte Anzeige angepinnter Meldungen"
  - „Entfernen zurückgezogener Meldungen aus der Liste"
- [x] 3.3 Bausteine `MeldungKarte` (Klassifizierung mit Symbol und Text), `MeldungInhalt`, `ZurueckgezogeneKarte` und `PinSchalter` in `ui/MeldungBausteine.tsx`.
- [x] 3.4 Route `app/(tabs)/news/` als Stack (`_layout`, `index`, `[meldungId]`). `NewsScreen` mit Liste, Anpinnen, Nachladen, Aktualisieren und Fehlerhinweis. `NewsDetailScreen`. Komponententests:
  - „Laden und Anzeige aktueller Meldungen"
  - „Fehlermeldung bei nicht erreichbarem News-Dienst"
  - „Klassifizierung jeder Meldung"
  - „Nachladen älterer Meldungen"
  - „Detailansicht einer Meldung"
  - „Anpinnen und Ablösen einzelner Meldungen"

## 4. Verwaltung

- [ ] 4.1 `admin/api.ts`: Meldungs-Abfrage und Mutationen (anlegen, ändern, veröffentlichen, zurückziehen) mit Invalidierung von `['verwaltung','meldungen']` und `['meldungen']`.
- [ ] 4.2 `MeldungenScreen` (nach Zustand gruppiert, Leerzustand, „Neue Meldung") und `MeldungEditorScreen` (Editor, Vorschau mit den App-Bausteinen, Zurückziehen mit Bestätigung, 412 mit „Neueren Stand laden", offline gesperrt). Routen unter `more/admin/meldungen/`, Eintrag im Verwaltungs-Einstieg. Komponententests:
  - „Meldungsredaktion für FSR-News"
  - „Vorschau vor Veröffentlichung"
  - „Ablehnung bei gleichzeitiger Änderung einer Meldung"
- [ ] 4.3 Texte de/en, `parity.test.ts` grün.

## 5. Abschluss

- [ ] 5.1 Tabelle „Umsetzungsstand" in `openspec/specs/admin/spec.md` nachführen. GitHub-Issue für den Folge-Change „Filter, Suche und erweiterte Suche" anlegen.
- [ ] 5.2 Prüfungen grün:
  - `dotnet test`
  - `npx jest`
  - `npx tsc --noEmit` (nach Codegen)
  - `npm run lint`
  - `node tools/spec-check/src/cli.js`
  - `openspec validate news-redaktion`
- [ ] 5.3 Geräteabnahme gegen ein laufendes Backend: Meldung in der Weboberfläche anlegen, Vorschau, veröffentlichen, in der App lesen, anpinnen, zurückziehen, Kennzeichnung prüfen. Prüfprotokoll unter `specs/pruefprotokolle/`.
