# FB4-App — Arbeitsanweisung

App des Fachschaftsrats Informatik (FB4) der FH Dortmund. Löst zwei Alt-Apps ab: eine Flutter/iOS-App und eine Android-App. **Die Android-App (Version 1.4.11) ist der zu übertreffende Stand** — sie ist die funktionsreichere der beiden. Ihr Quellcode liegt seit ADR 0020 nicht mehr im Repo, sondern nur lokal unter `FSRaaS-lokale-daten/alte apps/` (enthielt Live-Zugangsdaten zum Admin-Bereich von app.fsrfb4.de) — bei Bedarf beim FSR-Vorstand erfragen.

## Das Wichtigste zuerst

Dieses Projekt arbeitet **spec-anchored**: Der Anforderungsbestand ist die Quelle der Wahrheit, nicht der Code. Er entsteht vor dem Code und bleibt danach bestehen. Seit ADR 0019 (2026-09-05) liegt der fachliche Anforderungsbestand unter `openspec/specs/` (aktueller Stand) und `openspec/changes/` (laufende Vorschläge), verwaltet mit dem OpenSpec-CLI; Entscheidungen (ADRs) und Produkt-/Prozessdokumente bleiben unter `specs/`.

Daraus folgt eine Regel, die alles andere bestimmt:

> **Keine Verhaltensänderung ohne Spec-Delta im selben Merge.**

Wer Verhalten ändert, legt zuerst einen `openspec/changes/<name>/`-Vorschlag mit Spec-Delta an. Wer eine Anforderung umsetzt, schreibt einen Test, dessen Name den Requirement-Titel trägt. Wer eine Anforderung nicht mehr braucht, führt sie als REMOVED-Delta — löschen ist nie richtig.

Der Grund steht in `specs/decisions/0002-spec-anchored-arbeitsweise.md` (Grundsatzentscheidung) und `specs/decisions/0019-umstellung-auf-openspec.md` (Umstellung auf OpenSpec als Werkzeug): Beide Vorgängerprojekte sind an fehlender Übergabe gescheitert. Bei der Android-App war der Quellcode jahrelang nicht auffindbar; das Backend `app.fsrfb4.de` läuft bis heute mit Daten aus dem Wintersemester 2023/24, weil niemand mehr wusste, wie man sie pflegt. Der FSR wechselt seine Aktiven jährlich.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`Fachschaftsrat-Informatik-FH-Dortmund/FSRaaS`), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context, but adapted to this repo's own spec-anchored system rather than the generic `CONTEXT.md`/`docs/adr/` convention — points skills at `openspec/specs/`, `openspec/changes/`, and `specs/decisions/`. See `docs/agents/domain.md`.

## Struktur

```
openspec/       Fachlicher Anforderungsbestand — hier zuerst lesen und zuerst ändern (ADR 0019)
  specs/          aktueller Stand je Capability
  changes/        laufende Änderungsvorschläge (Proposal → Spec-Delta → Design → Tasks → Archive)
specs/          Entscheidungen (ADRs) und Produkt-/Prozessdokumente — weiterhin Quelle der Wahrheit für diese Themen
app/            React Native (Expo), iOS, Android und PC-Verwaltungsoberfläche (Web-Export, ADR 0018)
backend/        ASP.NET Core, PostgreSQL, Entity Framework Core
tools/          Prüfskripte für den Spec-Bestand, Codeerzeugung aus dem Vertrag
alte apps/      NICHT im Repo (ADR 0020) — Quellcode beider Alt-Apps, nur lokal unter FSRaaS-lokale-daten/
resources/      Reale Beispieldateien (Prüfungspläne)
```

## Wo was steht

| Frage | Antwort steht in |
|---|---|
| Wie schreibe ich eine Anforderung? | `specs/README.md`, Abschnitte 5, 6, 9 und 11 |
| Was soll Feature X tun? | `openspec/specs/<feature>/spec.md` |
| Wie rufe ich ein Fremdsystem auf? | `openspec/specs/integrations/spec.md` — **ausschließlich dort**, nie in einer Feature-Capability |
| Wie rufe ich das eigene Backend auf? | `openspec/specs/api-contract.yaml` |
| Was gilt querschnittlich? | `openspec/specs/` — Architektur, Daten, Sicherheit, Gestaltung, Qualität |
| Warum wurde etwas so entschieden? | `specs/decisions/` |
| Was kommt wann? | `specs/product/roadmap.md` |
| Was konnten die Alt-Apps? | `specs/product/legacy-inventory.md` |

## Regeln, die beim Arbeiten greifen

**Anforderungs-IDs (historisch).** Bestehende Verweise wie `<PRÄFIX>-F-###`/`<PRÄFIX>-N-###` (Zehnerschritte ab `010`, nie umnummeriert) stehen weiterhin in Testnamen und Git-Historie und werden dort vorerst nicht angetastet (ADR 0019, offener Punkt). Neue Anforderungen unter `openspec/specs/` bekommen keine ID mehr, sondern einen capability-basierten Requirement-Titel.

**Herkunft bleibt Pflicht.** Jede Anforderung trägt genau eine Markierung: `Alt: <pfad>:<zeile>`, `NEU`, `Android: unbekannt`, `Alt: bewusst verworfen` oder `Recherche: <quelle>, <datum>`. In OpenSpec-Requirements steht sie als abschließender Satz „Herkunft: …" im Requirement-Text. Das macht sichtbar, welche Anforderung aus Code rückwärts erschlossen wurde und damit unsicher ist.

**Tests tragen den Requirement-Bezug.** Bestehend: `describe('SCHED-F-080 Gruppenzuordnung bei Bereichsangabe', …)`. Neu: Requirement-Titel statt ID, z. B. `describe('Gruppenzuordnung bei Bereichsangabe', …)`. Ein Test ohne zugehörige Anforderung ist ein Signal, dass Spec und Code auseinanderlaufen.

**Endpunktdetails nur im Register.** Eine Feature-Capability nennt die Schnittstelle und beschreibt die fachliche Nutzung. URL, Feldnamen und Antwortstruktur stehen nur in `openspec/specs/integrations/spec.md`. Ändert sich ein Endpunkt, ändert sich genau eine Datei.

**Der Vertrag kommt vor dem Code.** Ein neuer Aufruf zwischen App und Backend wird zuerst in `openspec/specs/api-contract.yaml` beschrieben, Typen werden daraus erzeugt, nicht von Hand geschrieben.

**Fassung und Datum pflegen.** Bei jeder inhaltlichen Änderung an einem verbliebenen `specs/`-Dokument (ADRs, Produkt-/Prozessdokumente): `version` nach `specs/README.md` Abschnitt 8 erhöhen, `last_reviewed` auf das Änderungsdatum setzen. Für Capability-Specs unter `openspec/specs/` ersetzt der archivierte Change (`openspec/changes/archive/`) diese Historie.

## Technische Festlegungen

| Bereich | Wahl | Warum |
|---|---|---|
| App | React Native mit Expo, `expo-dev-client`, `npx expo prebuild`; `app/android/` liegt im Repo, `app/ios/` entsteht mit dem ersten iOS-Prebuild | ADR 0009 |
| Ausdrücklich nicht | EAS Cloud Build, `expo-updates`, Firebase im Android-Build | F-Droid verlangt reproduzierbare Builds ohne proprietäre Abhängigkeiten (NFR-N-170/210) |
| Backend | ASP.NET Core, PostgreSQL, EF Core, Hosted Services für periodische Aufgaben | ADR 0011 |
| Anmeldung | OpenID Connect gegen eigenbetriebenes Authentik; Federation zur FH ist dort konfiguriert, für die App unsichtbar | ADR 0010 |
| Vertrieb | App Store, Play Store, F-Droid; Quellcode unter MIT | ADR 0008 |
| Sprachen | Deutsch und Englisch von Anfang an; keine Zeichenkette fest im Code | NFR-F-115 |

## Was aus den Alt-Apps nicht übernommen wird

Beide Alt-Apps enthalten belegte Mängel, vollständig gelistet in `specs/product/legacy-inventory.md` Abschnitte 3 und 4.5. Die vier, die beim Arbeiten am ehesten in Versuchung führen:

- **Kein Passwort-Replay.** Beide Apps speichern Hochschul-Zugangsdaten und senden sie wiederholt an ein Formular. Ausgeschlossen (SEC-F-040), auch wenn dadurch Funktionen entfallen — der automatische Ticket-Bezug etwa.
- **Keine stillen Fehler.** Ein `try` ohne `catch`, ein verschluckter Parsing-Fehler: beides existiert im Altcode und ist untersagt (SEC-F-060).
- **Kein TLS-Verzicht.** Beide Apps rufen Dienste über `http://` auf, obwohl `https://` funktioniert. Ausnahmslos TLS (SEC-N-030). Bei Zertifikatsproblemen der Hochschule wird deren Aussteller als zusätzlicher Vertrauensanker aufgenommen, nie die Prüfung abgeschaltet (SEC-N-105).
- **Kein Datenverlust ohne Rückfrage.** Die Flutter-App löscht bei unerwarteter Datenmenge den gesamten Stundenplan. Untersagt (DATA-F-020).

## Definition of Done

Eine Anforderung gilt als umgesetzt, wenn alle Punkte erfüllt sind (`openspec/specs/quality-and-testing/spec.md`, vormals `specs/platform/quality-and-testing.md` Abschnitt 7):

1. Als Requirement mit EARS-Formulierung, Herkunftsmarkierung und mindestens einem Scenario in einem archivierten OpenSpec-Change spezifiziert
2. Der Code setzt sie um
3. Mindestens ein automatisierter Test trägt den Requirement-Bezug im Namen — oder ein datiertes Prüfprotokoll liegt vor, wo Abschnitt 3 das zulässt
4. Der Change ist archiviert (`openspec archive`), das Spec-Delta ist in `openspec/specs/` übernommen

## Sprache

Specs, Anforderungen, Erläuterungen und Commit-Nachrichten auf Deutsch. Bezeichner im Code auf Englisch, wo das der Sprache des jeweiligen Ökosystems entspricht. Fachbegriffe folgen `specs/product/glossary.md` — bei Widerspruch zwischen einer Formulierung und dem Glossar gilt das Glossar.
