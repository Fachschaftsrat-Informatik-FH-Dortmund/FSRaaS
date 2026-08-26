# FB4-App — Arbeitsanweisung

App des Fachschaftsrats Informatik (FB4) der FH Dortmund. Löst zwei Alt-Apps ab: eine Flutter/iOS-App und eine Android-App, beide unter `alte apps/`. **Die Android-App (`alte apps/android-fb4/`, Version 1.4.11) ist der zu übertreffende Stand** — sie ist die funktionsreichere der beiden.

## Das Wichtigste zuerst

Dieses Projekt arbeitet **spec-anchored**: Die Specs unter `specs/` sind die Quelle der Wahrheit, nicht der Code. Sie entstehen vor dem Code und bleiben danach bestehen.

Daraus folgt eine Regel, die alles andere bestimmt:

> **Keine Verhaltensänderung ohne Spec-Änderung im selben Merge.**

Wer Verhalten ändert, ändert zuerst die Spec. Wer eine Anforderung umsetzt, schreibt einen Test, dessen Name ihre ID trägt. Wer eine Anforderung nicht mehr braucht, setzt sie auf „entfallen" — löschen ist nie richtig.

Der Grund steht in `specs/decisions/0002-spec-anchored-arbeitsweise.md`: Beide Vorgängerprojekte sind an fehlender Übergabe gescheitert. Bei der Android-App war der Quellcode jahrelang nicht auffindbar; das Backend `app.fsrfb4.de` läuft bis heute mit Daten aus dem Wintersemester 2023/24, weil niemand mehr wusste, wie man sie pflegt. Der FSR wechselt seine Aktiven jährlich.

## Struktur

```
specs/          Quelle der Wahrheit — hier zuerst lesen und zuerst ändern
app/            React Native (Expo), iOS, Android und PC-Verwaltungsoberfläche (Web-Export, ADR 0018)
backend/        ASP.NET Core, PostgreSQL, Entity Framework Core
tools/          Prüfskripte für den Spec-Bestand, Codeerzeugung aus dem Vertrag
alte apps/      Quellcode beider Alt-Apps — Lesequelle, nie Vorlage zum Kopieren
resources/      Reale Beispieldateien (Prüfungspläne)
```

## Wo was steht

| Frage | Antwort steht in |
|---|---|
| Wie schreibe ich eine Anforderung? | `specs/README.md`, Abschnitte 4 bis 6 und 9 |
| Was soll Feature X tun? | `specs/features/<feature>/spec.md` |
| Wie rufe ich ein Fremdsystem auf? | `specs/platform/integrations.md` — **ausschließlich dort**, nie in einer Feature-Spec |
| Wie rufe ich das eigene Backend auf? | `specs/platform/api-contract.yaml` |
| Was gilt querschnittlich? | `specs/platform/` — Architektur, Daten, Sicherheit, Gestaltung, Qualität |
| Warum wurde etwas so entschieden? | `specs/decisions/` |
| Was kommt wann? | `specs/product/roadmap.md` |
| Was konnten die Alt-Apps? | `specs/product/legacy-inventory.md` |

## Regeln, die beim Arbeiten greifen

**Anforderungs-IDs.** Muster `<PRÄFIX>-F-###` funktional, `<PRÄFIX>-N-###` nicht-funktional, in Zehnerschritten ab `010`. Nie umnummerieren, nie wiederverwenden. Neue Anforderungen zählen `-F-` und `-N-` getrennt.

**Herkunft.** Jede Anforderung trägt genau eine Markierung: `Alt: <pfad>:<zeile>`, `NEU`, `Android: unbekannt`, `Alt: bewusst verworfen` oder `Recherche: <quelle>, <datum>`. Das macht sichtbar, welche Anforderung aus Code rückwärts erschlossen wurde und damit unsicher ist.

**Tests tragen die ID.** `describe('SCHED-F-080 Gruppenzuordnung bei Bereichsangabe', …)`. Ein Test ohne zugehörige Anforderung ist ein Signal, dass Spec und Code auseinanderlaufen.

**Endpunktdetails nur im Register.** Eine Feature-Spec nennt `INT-009` und beschreibt die fachliche Nutzung. URL, Feldnamen und Antwortstruktur stehen nur in `integrations.md`. Ändert sich ein Endpunkt, ändert sich genau eine Datei.

**Der Vertrag kommt vor dem Code.** Ein neuer Aufruf zwischen App und Backend wird zuerst in `api-contract.yaml` beschrieben (API-N-035), Typen werden daraus erzeugt, nicht von Hand geschrieben.

**Fassung und Datum pflegen.** Bei jeder inhaltlichen Änderung an einer Spec: `version` nach `specs/README.md` Abschnitt 8 erhöhen, `last_reviewed` auf das Änderungsdatum setzen.

## Technische Festlegungen

| Bereich | Wahl | Warum |
|---|---|---|
| App | React Native mit Expo, `expo-dev-client`, `npx expo prebuild`; `android/` und `ios/` liegen im Repo | ADR 0009 |
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

Eine Anforderung gilt als umgesetzt, wenn alle sechs Punkte erfüllt sind (`specs/platform/quality-and-testing.md` Abschnitt 7):

1. In einer Spec mit eindeutiger ID, EARS-Formulierung und Herkunftsmarkierung spezifiziert
2. Der Code setzt sie um
3. Mindestens ein automatisierter Test trägt die ID im Namen — oder ein datiertes Prüfprotokoll liegt vor, wo Abschnitt 3 das zulässt
4. `implemented_in:` im Frontmatter nennt die zuständigen Quellverzeichnisse
5. `status` der Spec ist fortgeschrieben
6. `last_reviewed` steht auf dem Änderungsdatum

## Sprache

Specs, Anforderungen, Erläuterungen und Commit-Nachrichten auf Deutsch. Bezeichner im Code auf Englisch, wo das der Sprache des jeweiligen Ökosystems entspricht. Fachbegriffe folgen `specs/product/glossary.md` — bei Widerspruch zwischen einer Formulierung und dem Glossar gilt das Glossar.
