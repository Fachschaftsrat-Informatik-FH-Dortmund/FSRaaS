## Why

Der Wiedereröffnungshinweis an einer geschlossenen Mensa (`canteen-mensa-kontext`, 2026-09-07) nennt den nächsten Wochentag, für den die **gepflegten wöchentlichen Öffnungszeiten** einen Eintrag führen — nicht den Tag, an dem die Mensa laut Speiseplan tatsächlich wieder Gerichte führt. Das war eine bewusste, mit der Nutzerin getroffene Entscheidung (design.md D1 des Changes), um ohne zusätzlichen Netzverkehr auszukommen und den Hinweis offline verfügbar zu halten; das Risiko einer falschen Aussage an Feiertagen und in der vorlesungsfreien Zeit war dabei dokumentiert und in Kauf genommen.

Dieses Risiko trifft jetzt ein: Weil die wöchentliche Schablone eine reguläre Vorlesungszeit annimmt, nennt der Hinweis in der aktuellen vorlesungsfreien Zeit an jedem geschlossenen Tag pauschal den nächsten Werktag — „morgen" — unabhängig davon, ob dort tatsächlich ein Angebot vorliegt. Blättert die Nutzerin auf diesen Tag, wiederholt sich derselbe Fehler einen Tag weiter. Das ist eine wiederholte falsche Tatsachenbehauptung über die Öffnung und verstößt gegen die Regel „keine stillen Falschaussagen" (SEC-F-060, CLAUDE.md „Was aus den Alt-Apps nicht übernommen wird").

Die Nutzerin hat entschieden, das zu korrigieren: Statt der wöchentlichen Schablone soll der Hinweis darauf beruhen, wann die Mensa laut Speiseplan tatsächlich wieder Gerichte führt — so weit vorausschauend, wie der Speiseplan-Zwischenspeicher reicht, ohne künstliche Tagesgrenze, weil die App auch beim Blättern durch die Tage keine solche Grenze kennt (Requirement „Untere Grenze der Tagesauswahl": die obere Grenze ergibt sich aus dem Datenbestand, wird nicht zusätzlich festgelegt). Ein Nutzungsbild, in dem der Hinweis „kein Termin bekannt" sagt und die Nutzerin zwei Wochen später beim Blättern doch ein Angebot vorfindet, wäre schlechter als gar kein Hinweis.

Die Korrektur ist güngstiger als beim ersten Entwurf befürchtet: Der periodische Backend-Abgleich (`SpeiseplanAktualisierungJob`) ruft je Mensa bereits `GET /canteens/{id}` auf — die INT-015-Variante, die **alle** vom Quellsystem geführten Tage in einem Aufruf liefert — und speichert jeden zurückgegebenen Tag im Zwischenspeicher (`Speiseplaene`), unabhängig davon, ob er Gerichte enthält. Der Zwischenspeicher kennt damit für jede Mensa bereits den vollständigen, von der Quelle bekannten Zeithorizont; die Suche nach dem nächsten Tag mit Gerichten ist eine reine Datenbankabfrage über bereits vorhandene Daten, ohne einen einzigen zusätzlichen Aufruf an INT-015 oder zusätzliche App-seitige Netzwerk-Rundreisen über mehrere Tage.

Zugeordnet zu Roadmap-Schritt 4 (Mensaplan) als Nachbesserung, wie bereits `canteen-mensa-kontext` und `mensa-wochenende-heute-sichtbar`. Der zugrunde liegende Change ist mit diesem Vorschlag archiviert worden, damit die hier geänderte Anforderung „Wiedereröffnungshinweis an der geschlossenen Mensa" im Hauptbestand (`openspec/specs/canteen/spec.md`) steht, bevor dieses Delta sie ändert.

## What Changes

- Die Ermittlung des Wiedereröffnungstags stützt sich nicht mehr auf die gepflegten wöchentlichen Öffnungszeiten (`Mensa.oeffnungszeiten`), sondern auf den tatsächlichen Speiseplan-Zwischenspeicher: den nächsten Tag nach dem angezeigten Tag, für den die Mensa laut Zwischenspeicher mindestens ein Gericht führt.
- Die Suche ist nicht mehr auf höchstens sieben Tage begrenzt, sondern reicht so weit, wie der Speiseplan-Zwischenspeicher für diese Mensa Tage kennt (derselbe Zeithorizont, den auch die Tagesauswahl durch Blättern erreichen kann).
- Antwort des bestehenden Endpunkts `GET /mensen/{mensaId}/speiseplan/{datum}` (`openspec/specs/api-contract.yaml`) erhält ein zusätzliches, optionales Feld für den ermittelten Wiedereröffnungstag; **kein neuer Endpunkt**, kein zusätzlicher Aufruf an INT-015 (die Daten liegen durch `AlleTageAsync` bereits vollständig im Zwischenspeicher).
- Der Hinweistext bleibt eine Aussage über die Öffnung, nicht über das Angebot (unverändert aus D1) — jetzt aber durch echte Speiseplan-Daten gedeckt, nicht durch eine ungeprüfte Schablone.
- Findet der Zwischenspeicher innerhalb seines bekannten Zeithorizonts keinen Tag mit Angebot, entfällt der Zusatz ersatzlos — wie bisher beim Requirement „Keine Öffnungszeit in den folgenden sieben Tagen", jetzt ohne die künstliche Sieben-Tage-Grenze.
- Die gepflegten wöchentlichen Öffnungszeiten (`Mensa.oeffnungszeiten`) bleiben unverändert Quelle für die Anzeige der Öffnungszeit an Tagen **mit** Angebot (Requirement „Öffnungszeiten je Mensa und Wochentag" / „Öffnungszeit an der Mensa-Abschnittsüberschrift") — dieser Schnitt ändert ausschließlich die Wiedereröffnungs-Ermittlung für Tage **ohne** Angebot.

**Bewusst weggelassen:**
- Keine Unterscheidung zwischen „geschlossen" und „Quelle liefert für diesen Tag keine Daten" — die Quelle (INT-015) unterscheidet das schon heute nicht (siehe Erläuterung „Geschlossene Mensa: Ort hängt von der Gruppierung ab" in `openspec/specs/canteen/spec.md`); daran ändert dieser Schnitt nichts.
- Keine Anzeige eines konkreten Kalenderdatums zusätzlich zum Wochentagnamen, auch wenn der gefundene Tag mehr als eine Woche entfernt liegt. Das ist eine reine Formulierungsfrage der Oberfläche, siehe „Offene Frage" in design.md — vorerst bleibt die bestehende Wochentag-Formulierung, ergänzt um eine Klarstellung bei großem Abstand.
- Keine Änderung am `SpeiseplanAktualisierungJob`-Abrufzeitplan oder an der INT-015-Anbindung — der Zwischenspeicher liefert die nötigen Daten bereits.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `canteen`: Requirement „Wiedereröffnungshinweis an der geschlossenen Mensa" ändert seine Datengrundlage von den gepflegten Öffnungszeiten auf den tatsächlichen Speiseplan-Zwischenspeicher und verliert die künstliche Sieben-Tage-Grenze.

## Impact

- **Vertrag** (`openspec/specs/api-contract.yaml`): Antwortschema von `GET /mensen/{mensaId}/speiseplan/{datum}` erhält ein neues optionales Feld für den Wiedereröffnungstag.
- **Backend**: Neue Abfrage über den vorhandenen `Speiseplaene`-Zwischenspeicher (kein neuer INT-015-Aufruf, keine neue Tabelle); der Endpunkt-Handler für `/mensen/{mensaId}/speiseplan/{datum}` liefert das neue Feld mit.
- **App**: `app/src/areas/canteen/oeffnungszeiten.ts` (`naechsterOeffnungstag`) entfällt zugunsten des vom Backend gelieferten Feldes; `app/src/areas/canteen/api.ts` (`Speiseplan`-Typ) und `CanteenScreen.tsx` (Anzeige des Wiedereröffnungshinweises) werden entsprechend angepasst.
- Kein Backend-Datenmodell-, Konto- oder Datenschutzimpact; rein lesender Pfad, ausschließlich aus bereits vorhandenem Zwischenspeicher.
