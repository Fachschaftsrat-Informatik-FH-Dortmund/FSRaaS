## 1. Vertrag

- [ ] 1.1 `api-contract.yaml`: `POST /raeume/{roomId}/besetzt-meldungen` mit Rumpf `BesetztMeldungEingabe`, 202 `BesetztMeldungQuittung`, 400/404/409/503; neuer Pfad `DELETE /raeume/{roomId}/besetzt-meldungen/{meldungId}` (204, 429); Fassung 0.8.0
- [ ] 1.2 `node tools/contract-codegen/src/generate.mjs`, erzeugte Typen (TS und C#) eingecheckt

## 2. Backend

- [ ] 2.1 Entität `BesetztMeldung` (Id, RoomId, GemeldetAm, ZurueckgezogenAm) im `Fb4DbContext`, eigene Migration `BesetztMeldungen`
- [ ] 2.2 Bekanntheitsprüfung eines Raums aus `RaumplanEndpoints` als gemeinsame Hilfsmethode
- [ ] 2.3 `BesetztMeldungEndpoints`: `POST` (Idempotenz, `gemeldetAm` gekappt auf jetzt, abgelaufen ⇒ nicht gespeichert, 409 bei Fremdraum) und `DELETE` (immer 204, setzt `ZurueckgezogenAm`)
- [ ] 2.4 Zählung gültiger Meldungen in `/raeume/uebersicht` (Fenster 90 min relativ zum Bezugszeitpunkt, ohne zurückgezogene)
- [ ] 2.5 `BesetztMeldungAufraeumJob` alle 15 Minuten
- [ ] 2.6 Ratenbegrenzung `kontofrei-schreiben` (Netzadresse, IPv6 /64, konfigurierbar, 429 mit Problem-Rumpf und `Retry-After`, Warnung ohne Adresse im Protokoll)
- [ ] 2.7 Tests in `Fb4.Backend.Tests`: „Raum als besetzt melden", „Raumbesetzt-Meldungen ohne Personenbezug", „Anzahl der Besetzt-Meldungen anzeigen", „Besetzt-Meldung zurückziehen", „Gültigkeitsdauer einer Besetzt-Meldung", „Idempotente Besetzt-Meldung", „Ratenbegrenzung kontofreier Schreibpfade"; `dotnet test` grün

## 3. App: Offline-Schreib-Warteschlange

- [ ] 3.1 `state/schreibwarteschlange.ts`: Registrierung, Einreihen, Scope-FIFO, Backoff, Persistenz-Filter, Fortsetzen nach Neustart, Erfolg entfernen, erneut versuchen/verwerfen, Verfall nach 7 Tagen, `useSchreibwarteschlange`
- [ ] 3.2 `queryClient.ts`/`Providers.tsx`: Schreibvorgänge vor der Wiederherstellung registrieren, Mutationen der Warteschlange persistieren, nach der Wiederherstellung fortsetzen
- [ ] 3.3 Tests gegen einen echten `QueryClient`: „Lokale Offline-Warteschlange mit FIFO-Übertragung", „Offline-Warteschlange für Schreibvorgänge", „Pause-/Fortsetzungs-Mechanismus der Offline-Warteschlange", „Manuelle Entscheidung bei dauerhaft fehlgeschlagenem Schreibvorgang", „Status der Offline-Warteschlange einsehbar"
- [ ] 3.4 `ui/SchreibwarteschlangeStatus.tsx` mit Komponententest „Status der Offline-Warteschlange einsehbar"

## 4. App: Raumsuche

- [ ] 4.1 `room-finder/besetztMeldung.ts`: Schreibvorgänge „besetztMeldung" und „besetztMeldungZurueckziehen", eigene Meldungen auf dem Gerät (`eigeneMeldungen.ts`), Hook für Melden/Zurückziehen; Tests „Raum als besetzt melden" (offline eingereiht), „Besetzt-Meldung zurückziehen"
- [ ] 4.2 Baustein `BesetztMeldung` in der Tagesbelegung, auch offline; Melden per Kennung in `RaumOffline`; Komponententests „Raum als besetzt melden", „Besetzt-Meldung zurückziehen", „Anzahl der Besetzt-Meldungen anzeigen"
- [ ] 4.3 Hinweis „N× als besetzt gemeldet" in Übersicht und Freie-Raum-Suche; Komponententest „Besetzt-Meldung zusätzlich in der Übersicht anzeigen"
- [ ] 4.4 Statusbaustein der Warteschlange im Raum-Bereich
- [ ] 4.5 Texte de/en; `parity.test.ts` grün

## 5. Prüfungen und Abschluss

- [ ] 5.1 `dotnet test`, `npx jest`, `npx tsc --noEmit`, `npm run lint`, `node tools/spec-check/src/cli.js`, `openspec validate besetzt-meldungen` grün
- [ ] 5.2 Geräteabnahme auf Android: Melden online und offline, Übertragung nach Wiederverbindung, Zurückziehen, Anzeige in Übersicht (Prüfprotokoll unter `specs/pruefprotokolle/`)
