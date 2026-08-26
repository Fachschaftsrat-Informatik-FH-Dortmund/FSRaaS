---
description: Einen vertikalen Schnitt aus der Roadmap umsetzen — Vertrag, Backend, App und Tests gemeinsam, mit Spec-Pflege im selben Zug.
argument-hint: <Schritt-Nummer aus roadmap.md oder Anforderungs-IDs, z. B. "4" oder "MENSA-F-045 MENSA-F-047">
---

Setze den folgenden vertikalen Schnitt um: **$ARGUMENTS**

Arbeite in dieser Reihenfolge. Halte nach jedem Abschnitt kurz inne und prüfe, ob der nächste noch derselbe Schnitt ist — wenn der Umfang wächst, sag es, statt ihn stillschweigend auszuweiten.

## 1. Umfang klären, bevor du Code anfasst

Lies zuerst `specs/product/roadmap.md` und bestimme, welche Anforderungs-IDs zu diesem Schnitt gehören. Lies dann jede betroffene Feature-Spec vollständig — nicht nur die Anforderungstabelle, sondern auch die Erläuterungen, die UI-Zustände (Abschnitt 7), das Offline-Verhalten (Abschnitt 8) und die Fehlerfälle (Abschnitt 9). Dort steht regelmäßig Verhalten, das in keiner Anforderungszeile auftaucht und trotzdem gilt.

Prüfe für jede Anforderung des Schnitts, ob sie schon umgesetzt ist (`implemented_in:` im Frontmatter, Tests mit der ID im Namen). Nenne mir am Anfang in wenigen Zeilen: welche IDs du umsetzt, welche du bewusst weglässt und warum.

**Stopp-Bedingung:** Wenn eine Anforderung des Schnitts auf einen offenen Punkt aus `specs/open-questions.md` oder aus dem Abschnitt „Offene Fragen" ihrer Spec trifft, setze sie nicht auf Verdacht um. Sag mir, welche Entscheidung fehlt.

## 2. Zuerst die Spec, dann der Vertrag, dann der Code

Falls beim Lesen auffällt, dass die Spec das gewünschte Verhalten nicht oder falsch beschreibt: **Spec zuerst ändern.** Neue Anforderung mit eigener ID in Zehnerschritten, EARS-Muster, genau eine Herkunftsmarkierung, `version` und `last_reviewed` gepflegt. Nicht die Spec dem Code anpassen, nachdem der Code steht.

Braucht der Schnitt einen Aufruf zwischen App und Backend, beschreibe ihn zuerst in `specs/platform/api-contract.yaml` (API-N-035) und erzeuge Typen daraus. Schreibe keine Anfrage- oder Antworttypen von Hand.

Braucht der Schnitt ein Fremdsystem, prüfe seinen Eintrag in `specs/platform/integrations.md`. Steht er dort auf „zu verifizieren" oder „zu definieren", ist das ein Grund zum Nachfragen, kein Grund zum Raten. URL und Feldnamen gehören ausschließlich dorthin — dupliziere sie nicht in eine Feature-Spec und nicht als Konstante in den Code (SEC-F-050: Zielsysteme über Konfiguration, nicht fest verdrahtet).

## 3. Umsetzen

Backend und App gehören zu diesem Schnitt, nicht in getrennte Durchgänge. Berührt der Schnitt eine Verwaltungsfunktion, gehört auch `admin-web/` dazu — App und Weboberfläche bieten denselben fachlichen Umfang (ADMIN-F-030).

Beachte durchgängig:

- **Vier Zustände je Ansicht** — Laden, Leer, Fehler, Offline (ARCH-F-130). Nutze die gemeinsame Grundstruktur aus Schritt 1 der Roadmap, definiere sie nicht je Bildschirm neu (ARCH-N-020).
- **Leerzustände nennen den nächsten Schritt** (UX-F-110), Fehlermeldungen bieten Wiederholen an.
- **Keine Bedeutung allein über Farbe** (UX-F-070), keine Aktion allein über eine Geste (UX-F-090), Mindestkontrast 4,5:1 (UX-N-010), Bedienelemente ab 44×44 dp (UX-N-020).
- **Keine Zeichenkette fest im Code** — Deutsch und Englisch von Anfang an (NFR-F-115).
- **Fehler nie stillschweigend verschlucken** (SEC-F-060).
- **Schreibpfade brauchen einen Idempotenz-Schlüssel** (API-F-140), damit ein Vorgang aus der Offline-Warteschlange nicht doppelt wirkt.

Schau in den Alt-Code unter `alte apps/`, bevor du eine Fachlogik neu erfindest — insbesondere die Android-App ist der zu übertreffende Stand. Übernimm daraus aber nichts ungeprüft: Die dokumentierten Mängel (`specs/product/legacy-inventory.md` Abschnitte 3 und 4.5) sind belegt, nicht vermutet.

## 4. Tests

Jede funktionale Anforderung mit „muss" braucht mindestens einen automatisierten Test, dessen Name ihre ID trägt (QA-F-010):

```
describe('MENSA-F-045 Blättern zu benachbarten Tagen', () => { … })
```

Für Gestaltung, Barrierefreiheit und Leistungswerte ist ein datiertes Prüfprotokoll zulässig statt eines Tests (QA-F-020). Berührt der Schnitt ein Fremdsystem, gehört ein Vertragstest dazu, der bei struktureller Abweichung sichtbar fehlschlägt statt sie weiterzuverarbeiten (QA-N-070).

Prüfe besonders die in `specs/platform/quality-and-testing.md` Abschnitt 5 benannten Bereiche — dort stehen konkrete Beispieldaten und Sonderfälle, die aus dem Altcode bekannt fehlerhaft sind.

## 5. Abschluss

Bevor du fertig meldest, prüfe die sechs Punkte aus `specs/platform/quality-and-testing.md` Abschnitt 7 für jede umgesetzte Anforderung: spezifiziert, umgesetzt, durch Test mit ID nachgewiesen, `implemented_in:` gefüllt, `status` fortgeschrieben, `last_reviewed` aktuell.

Lass anschließend die Prüfskripte aus `tools/spec-check/` laufen.

Berichte mir zum Schluss knapp: welche IDs jetzt umgesetzt sind, welche Specs du geändert hast, was offen blieb und warum. Wenn ein Test fehlschlägt oder etwas unvollständig ist, sag das ausdrücklich — melde nichts als fertig, was es nicht ist.
