---
nummer: 0011
titel: Monorepo mit OpenAPI-Vertrag als Schnittstellenquelle
status: angenommen
datum: 2026-08-25
zuletzt_ergaenzt: 2026-08-26
betrifft:
  - ../platform/backend-and-api.md
  - ../platform/integrations.md
  - ../platform/quality-and-testing.md
  - ../platform/architecture.md
  - ../features/admin/spec.md
  - 0002-spec-anchored-arbeitsweise.md
  - 0008-vertrieb-ueber-drei-app-stores.md
---

# ADR 0011: Monorepo mit OpenAPI-Vertrag als Schnittstellenquelle

## Kontext

Zwei Lücken blockieren gemeinsam den Beginn der Umsetzung.

Erstens ist der Vertrag des eigenen Backends nirgends festgelegt. `platform/integrations.md` führt INT-008 mit „Aufruf: zu definieren" und „Antwortstruktur: zu definieren"; `platform/backend-and-api.md` beschreibt Aufgabenschnitt und Prinzipien (API-N-030 Versionierung, API-N-040 einheitliches Fehlerformat, API-N-050 Paginierung, API-N-060 ISO 8601), aber keinen einzigen Endpunkt. Weder App noch Backend lassen sich dagegen bauen, und die in `platform/quality-and-testing.md` (QA-N-070) geforderten Vertragstests haben keinen Bezugspunkt.

Zweitens existiert kein Code-Repository. `0008-vertrieb-ueber-drei-app-stores.md` benennt als Konsequenz mehrere Artefakte, die eines voraussetzen: `LICENSE` im Wurzelverzeichnis, ein F-Droid-Metadata-Recipe mit `subdir`-Direktive, getrennte CI-Pipelines je Vertriebsweg. `platform/non-functional.md` (NFR-N-140) verlangt zusätzlich, dass die Merge-Regel aus `README.md` Abschnitt 7 — keine Verhaltensänderung ohne Spec-Änderung — durch eine automatisierte Pipeline durchgesetzt wird, und `platform/quality-and-testing.md` Abschnitt 8 beschreibt vier Prüfskripte am Spec-Bestand, die es noch nicht gibt.

Erschwerend kommt hinzu, dass drei Auslieferungseinheiten zu bedienen sind: die React-Native-App, das .NET-Backend und eine Admin-Oberfläche, die es sowohl in der App als auch als eigenständige Weboberfläche für die Bedienung am PC geben soll (`../features/admin/spec.md`).

## Entscheidung

Dieses Repository wird zum Monorepo für den gesamten Bestand: `specs/` bleibt, hinzu kommen `app/` (React Native, einschließlich der als Web-Export ausgelieferten PC-Verwaltungsoberfläche, siehe `0018-verwaltungsoberflaeche-react-native-web.md`), `backend/` (ASP.NET Core) und `tools/` (Prüfskripte, Generatoren). Ein eigenständiges `admin-web/`-Verzeichnis entfällt seit ADR 0018.

Der Schnittstellenvertrag entsteht **spec-first** als versionierte OpenAPI-Beschreibung unter `specs/platform/api-contract.yaml`. Sie ist die Quelle der Wahrheit für jeden Aufruf zwischen App beziehungsweise Admin-Oberfläche und Backend; `platform/integrations.md` INT-008 verweist darauf, statt Endpunkte zu wiederholen. Typen und Client-Code für App, Admin-Oberfläche und Backend werden daraus erzeugt, nicht von Hand geschrieben.

Für das Backend gilt: ASP.NET Core mit PostgreSQL und Entity Framework Core, periodische Aufgaben (Raumaggregation, Zwischenspeicher-Auffrischung, Importe) als Hosted Services im selben Dienst.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **Monorepo einschließlich `specs/`, OpenAPI spec-first (gewählt)** | mittel — ein Repository einzurichten, Generatoren aufzusetzen | eine einzige CI kann die Merge-Regel über App, Backend, Admin und Specs hinweg durchsetzen; App und Backend lassen sich gegen denselben Vertrag parallel bauen; ein Änderungsstand umfasst Spec, Vertrag und Code gemeinsam | das Repository wird groß und heterogen; F-Droid muss über die `subdir`-Direktive auf `app/android` gelenkt werden |
| Getrennte Repositories, `specs/` eigenständig | gering je Repository, hoch in Summe | klare Trennung je Auslieferungseinheit; das App-Repository bleibt schlank und F-Droid-nah | die Kopplung von Spec und Code lässt sich nicht in einer Pipeline prüfen — genau der Mechanismus, den `0002-spec-anchored-arbeitsweise.md` als tragend beschreibt |
| Zwei Repositories: App öffentlich, Backend samt Specs getrennt | mittel | trennt das, was F-Droid reproduzierbar bauen muss, vom Rest | Spec und App-Code liegen auseinander; die Merge-Regel greift ausgerechnet dort nicht, wo die meisten Anforderungen umgesetzt werden |
| Vertrag aus dem .NET-Code erzeugen statt vorab festlegen | gering | keine Doppelpflege zwischen Schema und Umsetzung | der Vertrag entsteht erst mit dem Backend; die App kann nicht parallel dagegen bauen, und Vertragstests prüfen die Umsetzung gegen sich selbst statt gegen eine unabhängige Vorgabe |

### Erläuterungen

**Zur Wahl spec-first.** Bei vertikalen Schnitten je Feature (`product/roadmap.md`) entstehen App- und Backend-Anteil derselben Anforderung unmittelbar nacheinander. Ein vorab festgelegter Vertrag macht diese Reihenfolge frei wählbar und liefert zugleich den Bezugspunkt, den QA-N-070 für Vertragstests braucht. Der Zusatzaufwand gegenüber der code-first-Variante beschränkt sich darauf, das Schema vor der Umsetzung zu schreiben — was in einem spec-anchored Vorgehen ohnehin der Arbeitsweise entspricht.

**Zur Wahl von PostgreSQL.** Das bestehende E-Key-Verwaltungstool des FSR (INT-014) läuft bereits auf PostgreSQL. Dieselbe Datenbanktechnik hält die spätere Integration (API-F-175) einfacher und vermeidet einen zweiten Betriebszweig auf demselben Server.

## Konsequenzen

- `specs/platform/api-contract.yaml` wird Teil des Spec-Bestands und unterliegt denselben Änderungsregeln wie jede Spec (`README.md` Abschnitt 8). Eine Vertragsänderung ist eine Spec-Änderung.
- `platform/integrations.md` INT-008 verweist für Aufruf und Antwortstruktur auf diese Datei, statt sie zu beschreiben. Die Regel „Endpunktdetails stehen nur im Register" bleibt gewahrt, weil der Vertrag als Anhang des Registereintrags gilt.
- Die vier Prüfskripte aus `platform/quality-and-testing.md` Abschnitt 8 entstehen unter `tools/spec-check/` und laufen in der CI bei jedem Pull Request.
- `LICENSE` (MIT, NFR-N-160) liegt im Wurzelverzeichnis und gilt für den gesamten Bestand.
- Das F-Droid-Recipe zeigt per `subdir` auf `app/android` (bereits in `0008-vertrieb-ueber-drei-app-stores.md` vorgesehen).
- Die Admin-Oberfläche teilt sich mit der App seit `0018-verwaltungsoberflaeche-react-native-web.md` nicht nur den aus dem Vertrag erzeugten Client und den Anmeldefluss gegen Authentik (`0010-authentik-als-identitaetsanbieter.md`), sondern dieselbe Codebasis und Komponenten — unterschiedlich ist nur das responsive Layout, nicht die Implementierung.

## Offene Punkte

- Werkzeug für die Codeerzeugung aus dem Vertrag je Zielsprache (TypeScript für App und Admin-Oberfläche, C# für das Backend) — bei Einrichtung der Pipeline zu wählen.
- ~~Ob die Admin-Weboberfläche eigenständig ausgeliefert oder vom Backend mitgeliefert wird.~~ Die Codebasis-Frage ist mit ADR 0018 geklärt (eine Codebasis mit `app/`); die Hosting-Frage des Web-Exports bleibt dort als offener Punkt bestehen.
- Aufteilung der CI in Pipelines je Vertriebsweg (App Store, Play Store, F-Droid) und deren Auslöser.
