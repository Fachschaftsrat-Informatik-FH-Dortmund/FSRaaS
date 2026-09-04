---
id: admin
titel: Verwaltung und Redaktion
praefix: ADMIN
status: accepted
prioritaet: kern
version: 0.3.3
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from: []
implemented_in:
  - backend/src/Fb4.Backend/Endpoints          # ADMIN-F-010/020/070/080/090/100/180/190
  - backend/src/Fb4.Backend/Domain              # Datenmodell Stammdaten, Laufwege, Verwaltungsprotokoll
  - backend/src/Fb4.Backend/Infrastructure/Auth # ADMIN-F-010 (serverseitige Rollenprüfung), API-F-250
  - backend/src/Fb4.Backend/Infrastructure/Audit # ADMIN-F-110, ADMIN-N-020
  - app/src/auth                                # Anmeldung gegen Authentik (INT-012)
  - app/src/areas/admin                         # ADMIN-F-020/030 (App- und Web-Layout), ADMIN-N-010
  - specs/pruefprotokolle/2026-09-02-schritt-3-verwaltung.md # ADMIN-N-010, ADMIN-F-070 (Live-Verifikation ausstehend)
related:
  - ../../platform/backend-and-api.md
  - ../../platform/identity-and-moderation.md
  - ../../platform/security-and-privacy.md
  - ../../platform/ux-and-theming.md
  - ../../decisions/0010-authentik-als-identitaetsanbieter.md
  - ../../decisions/0011-monorepo-und-openapi-vertrag.md
  - ../../decisions/0012-zuschnitt-der-ersten-ausbaustufe.md
  - ../../decisions/0018-verwaltungsoberflaeche-react-native-web.md
  - ../news/spec.md
  - ../room-finder/spec.md
  - ../canteen-ratings/spec.md
  - ../event-volunteers/spec.md
  - ../schedule/spec.md
---

# Verwaltung und Redaktion

## 1. Zweck & Nutzen

Mehrere Anforderungen des Spec-Bestands setzen voraus, dass FSR-Mitglieder Inhalte pflegen können: FSR-News redigieren (API-F-090), den offiziellen Prüfungsplan hochladen (API-F-180), Laufwege zwischen Räumen pflegen (API-F-220), Helferbedarf je Event anlegen und die Besetzung überblicken (HELFER-F-010, HELFER-F-050) sowie gemeldete Bewertungskommentare prüfen und entfernen (IDENT-F-040, IDENT-F-090 bis F-110). Keine dieser Anforderungen benennt bislang, **wo** diese Pflege stattfindet. Diese Spec schließt die Lücke und beschreibt die Verwaltungsoberfläche als eigenständiges Feature.

Der Zuschnitt folgt einer Beobachtung aus dem Alltag des FSR: Ein Teil dieser Arbeit fällt unterwegs an — eine kurze Meldung veröffentlichen, sehen ob eine Schicht besetzt ist —, ein anderer Teil ist Fließarbeit am Rechner, etwa der Prüfungsplan-Import oder die Pflege eines Nachbarschaftsgraphen. Die Oberfläche muss deshalb mit identischem Funktionsumfang sowohl als geschützter Bereich innerhalb der App als auch komfortabel am PC bedienbar sein — als **eine** Codebasis mit zwei responsiven Layouts (React Native Web, `../../decisions/0018-verwaltungsoberflaeche-react-native-web.md`), nicht als zwei getrennte Implementierungen.

## 2. Scope / Nicht-Scope

### Scope

- Zugangsschutz und Rollenprüfung für alle Verwaltungsfunktionen.
- Redaktion von FSR-News: anlegen, bearbeiten, veröffentlichen, zurückziehen.
- Zuweisung der Rollen FSR-Redaktion und Moderation an Konten.
- Pflege der Stammdaten ohne externes Quellsystem: Mensa-Liste, Raumliste, Links-/Downloads-Liste, Semestertermine und Ticket-Bildausschnitt (API-F-230).
- Pflege der Laufwege-Datenstruktur zwischen Räumen (Grundlage für RAUM-F-060).
- Moderation gemeldeter Bewertungskommentare (zweite Ausbaustufe, siehe `../../decisions/0012-zuschnitt-der-ersten-ausbaustufe.md`).
- Anlegen von Helferbedarf und Übersicht der Besetzung (zweite Ausbaustufe).
- Import des offiziellen Prüfungsplans (zweite Ausbaustufe).
- Bereitstellung derselben Funktionen in der App und in einer eigenständigen Weboberfläche.

### Nicht-Scope

- Anlegen und Verwalten der Konten selbst (Registrierung, Passwörter, Anmeldeverfahren) — das leistet Authentik, siehe `../../decisions/0010-authentik-als-identitaetsanbieter.md`. Diese Spec weist lediglich Rollen zu.
- Redaktion von Events — erfolgt im externen ICS-Kalender (INT-011), siehe `../events/spec.md`.
- Redaktion von FB-Aktuelles — reiner Import aus INT-010 ohne FSR-Redaktion, siehe `../news/spec.md`.
- Pflege von E-Key-Datensätzen — bleibt im bestehenden Verwaltungstool des FSR (INT-014), siehe `../e-key/spec.md`.
- Pflege von Wiki-Inhalten — bleibt in BookStack, siehe `../wiki/spec.md`.
- Auswertungen und Nutzungsstatistiken — nicht Teil dieses Umfangs.

## 3. Nutzergeschichten

- Als FSR-Mitglied möchte ich eine kurze Meldung unterwegs vom Handy aus veröffentlichen, ohne dafür an einen Rechner zu müssen.
- Als FSR-Mitglied möchte ich den Prüfungsplan und die Laufwege-Daten am Rechner pflegen, weil beides Fließarbeit mit vielen Einträgen ist.
- Als FSR-Vorsitz möchte ich einem neuen Mitglied die Redaktionsrolle geben und einem ausgeschiedenen wieder entziehen, ohne dafür jemanden mit Serverzugang zu brauchen.
- Als Moderation möchte ich gemeldete Kommentare an einer Stelle sehen und entscheiden können, statt sie in der Datenbank zu suchen.
- Als FSR-Mitglied möchte ich vor dem Veröffentlichen sehen, wie eine Meldung in der App aussehen wird.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| ADMIN-F-010 | Falls eine Person ohne die Rolle FSR-Redaktion oder Moderation eine Verwaltungsfunktion aufruft, muss das System den Zugriff ablehnen. | NEU |
| ADMIN-F-020 | Das System muss den Verwaltungsbereich nur Konten mit mindestens einer Verwaltungsrolle überhaupt sichtbar machen. | NEU |
| ADMIN-F-030 | Das System muss denselben fachlichen Funktionsumfang in der App und in der Weboberfläche bereitstellen. | NEU |
| ADMIN-F-040 | Das System muss der Rolle FSR-Redaktion das Anlegen, Bearbeiten, Veröffentlichen und Zurückziehen von Meldungen der Klassifizierung „FSR-News" ermöglichen. | NEU |
| ADMIN-F-050 | Wenn eine Meldung zurückgezogen wird, muss das System sie aus der Meldungsliste der App entfernen und angepinnte Verweise darauf als zurückgezogen kennzeichnen. | NEU |
| ADMIN-F-060 | Das System muss vor dem Veröffentlichen einer Meldung eine Vorschau in der Darstellung der App anbieten. | NEU |
| ADMIN-F-070 | Das System muss der Rolle FSR-Redaktion das Zuweisen und Entziehen der Rollen FSR-Redaktion und Moderation für einzelne Konten ermöglichen. | NEU |
| ADMIN-F-080 | Falls eine Person sich selbst die letzte verbleibende Zuweisung der Rolle FSR-Redaktion entziehen will, muss das System den Vorgang ablehnen. | NEU |
| ADMIN-F-090 | Das System muss der Rolle FSR-Redaktion das Anlegen, Ändern und Entfernen von Laufwege-Einträgen zwischen zwei Raumkennungen mit zugehörigem Distanzmaß ermöglichen. | NEU |
| ADMIN-F-100 | Falls ein Laufwege-Eintrag eine Raumkennung nennt, die in den aggregierten Raumdaten nicht vorkommt, muss das System darauf hinweisen und den Eintrag dennoch speichern. | NEU |
| ADMIN-F-110 | Das System muss jede verändernde Verwaltungshandlung mit Zeitpunkt, handelndem Konto und betroffenem Datensatz protokollieren. | NEU |
| ADMIN-F-120 | Das System muss der Rolle Moderation eine Liste der gemeldeten Bewertungskommentare mit den Handlungsmöglichkeiten Entfernen und Verwerfen der Meldung bereitstellen. | NEU |
| ADMIN-F-130 | Das System muss der Rolle Moderation das Sperren eines Kontos gemäß IDENT-F-070 sowie das Bearbeiten eines Widerspruchs gemäß IDENT-F-110 ermöglichen. | NEU |
| ADMIN-F-140 | Das System muss der Rolle FSR-Redaktion das Anlegen und Ändern von Helferbedarf je Event, gegliedert nach Rolle, Schicht und benötigter Personenzahl, ermöglichen. | NEU |
| ADMIN-F-150 | Das System muss der Rolle FSR-Redaktion eine Übersicht aller Rollen/Schichten eines Events mit besetzten und offenen Plätzen bereitstellen. | NEU |
| ADMIN-F-160 | Das System muss der Rolle FSR-Redaktion den Upload einer Prüfungsplan-Datei sowie die Anzeige des Importergebnisses (übernommene Einträge, verworfene Zeilen mit Grund) ermöglichen. | NEU |
| ADMIN-F-170 | Wenn ein Prüfungsplan-Upload Zeilen enthält, die nicht ausgewertet werden konnten, muss das System den Import dennoch abschließen und die betroffenen Zeilen einzeln benennen. | NEU |
| ADMIN-F-180 | Das System muss der Rolle FSR-Redaktion das Anlegen, Ändern und Entfernen von Einträgen der Mensa-Liste, der Raumliste und der Links-/Downloads-Liste ermöglichen. | NEU |
| ADMIN-F-190 | Das System muss der Rolle FSR-Redaktion das Ändern der Semestertermine und des Ticket-Bildausschnitts ermöglichen. | NEU |
| ADMIN-F-200 | Wenn eine Stammdaten-Liste gespeichert wird, während sie zwischenzeitlich von einer anderen Person geändert wurde, muss das System den Speichervorgang ablehnen und den neueren Stand zur erneuten Bearbeitung anbieten. | NEU |

### Erläuterungen

**`ADMIN-F-010` / `ADMIN-F-020` — Rollenquelle.** Die Rollen stammen als Gruppenzugehörigkeit aus Authentik und werden als Claim im Token übertragen (`../../decisions/0010-authentik-als-identitaetsanbieter.md`); das Backend führt keine eigene Rollentabelle. ADMIN-F-070 wirkt deshalb auf Authentik-Gruppen, nicht auf eine backend-eigene Datenstruktur. Die Trennung zwischen ADMIN-F-010 und ADMIN-F-020 ist beabsichtigt: Die serverseitige Ablehnung ist die eigentliche Schutzmaßnahme, das Ausblenden in der Oberfläche eine reine Darstellungsfrage und für sich allein kein Schutz.

**`ADMIN-F-030` — eine Codebasis, zwei Layouts.** Die PC-taugliche Ansicht existiert wegen der Bedienbarkeit am PC (Tastatur, große Tabellen, Dateiauswahl beim Prüfungsplan-Import), nicht wegen abweichender Funktionalität. Seit `../../decisions/0018-verwaltungsoberflaeche-react-native-web.md` ist das keine zweite Implementierung mehr, sondern dieselbe React-Native-Codebasis wie die App, per Web-Export ausgeliefert — beide sprechen denselben Vertrag (`../../platform/api-contract.yaml`) und denselben Anmeldeweg an, und teilen sich dieselben Komponenten. Unterschiede in der Darstellung — etwa eine mehrspaltige Tabelle am PC gegenüber einer Liste auf dem Telefon — sind ausdrücklich zulässig und kein Verstoß gegen diese Anforderung; ein Auseinanderlaufen des Funktionsumfangs selbst ist durch die gemeinsame Codebasis strukturell erschwert, nicht nur durch Disziplin vermieden.

**`ADMIN-F-050` — Zurückziehen statt Löschen.** Eine bereits ausgelieferte Meldung kann auf Geräten im Zwischenspeicher liegen (`../../platform/data-and-storage.md` Abschnitt 4) und laut NEWS-F-050 angepinnt sein. Ein stilles Verschwinden würde für angepinnte Meldungen einen Eintrag ohne Inhalt hinterlassen; die Kennzeichnung als zurückgezogen macht den Vorgang stattdessen sichtbar.

**`ADMIN-F-080` — Aussperrschutz.** Ohne diese Regel könnte sich der FSR versehentlich vollständig aus der eigenen Verwaltung aussperren; die Wiederherstellung wäre nur mit Serverzugang möglich und damit an einzelne Personen gebunden — genau das Muster, das `../../decisions/0002-spec-anchored-arbeitsweise.md` als Ursache des Scheiterns der Alt-Apps benennt. Das Backend prüft die Regel auf dem aufgelösten Kontobezeichner (siehe ADMIN-F-070): Da jede verändernde Rollenfunktion selbst die Rolle FSR-Redaktion voraussetzt (ADMIN-F-010), greift die Ablehnung genau dann, wenn das betroffene Konto die einzige verbleibende Zuweisung hält — also beim Selbstentzug.

**`ADMIN-F-070` — Kontoauswahl.** Konten mit bestehender Verwaltungsrolle listet die Oberfläche aus Authentik (INT-012). Ein Konto **ohne** bisherige Rolle wird über seinen Benutzernamen benannt; das Backend löst diesen vor der Aussperrprüfung und dem Protokolleintrag zur stabilen Authentik-Konto-Id auf (`../../platform/integrations.md` INT-012, `core/users/?username=`). Eine bereits numerische Kennung gilt unverändert. Ein unbekannter Benutzername wird als Fehler zurückgemeldet, nicht stillschweigend übergangen (SEC-F-060).

**`ADMIN-F-100` — Hinweis statt Ablehnung.** Die aggregierten Raumdaten sind ein Abbild der FBWS-Termine (INT-002/INT-009) und enthalten nur Räume, in denen tatsächlich Veranstaltungen stattfinden. Ein Verbindungsgang oder ein Treppenhaus taucht dort nie auf, ist für einen Nachbarschaftsgraphen aber sinnvoll. Eine harte Ablehnung würde die Pflege unnötig einschränken; der Hinweis genügt, um Tippfehler zu bemerken.

**`ADMIN-F-110` — Umfang der Protokollierung.** Protokolliert werden Zeitpunkt, Konto und betroffener Datensatz, nicht der Inhalt nutzergenerierter Beiträge — `../../platform/security-and-privacy.md` (SEC-N-120) untersagt personenbezogene Inhalte in Protokollen, und API-N-080 verlangt Datensparsamkeit. Bei einer Moderationsentscheidung wird also festgehalten, dass ein bestimmter Kommentar entfernt wurde, nicht sein Wortlaut.

**`ADMIN-F-180` / `ADMIN-F-190` / `ADMIN-F-200` — Stammdaten-Pflege statt Konfigurationsdatei.** Das abgelöste Backend `app.fsrfb4.de` pflegte diese Daten über ein Formular ohne Übersicht, Validierung oder Historie und veraltete dadurch (`../../platform/integrations.md` INT-008, „Lese-/Schreibtrennung bei `/data`"). Diese Anforderungen verlegen die Pflege in die Verwaltungsoberfläche. Gespeichert wird je Liste als Ganzes (vollständige Ersetzung), abgesichert gegen gleichzeitige Bearbeitung durch dieselbe optimistische Nebenläufigkeitskontrolle wie bei Meldungsentwürfen und Laufwegen (`If-Match`, siehe Abschnitt 9); ADMIN-F-200 ist die zugehörige Fehlerreaktion. Die Prüfung greift zweistufig: der `If-Match`-Vergleich vor der Änderung und eine Nebenläufigkeitskennung auf Datenbankebene, die das Zeitfenster bis zum Festschreiben abdeckt — beide Wege münden in dieselbe Antwort (`412`), die App lädt daraufhin den neueren Stand nach und bietet ihn zur erneuten Bearbeitung an. Strukturell fehlerhafte Eingaben (leere oder doppelte Kennungen) werden als `400` abgewiesen, nicht erst beim Speichern. Der App wird derselbe Bestand kontofrei ausgeliefert (API-F-230), mit einem im Anwendungspaket mitgelieferten Ausgangsbestand als Rückfall (API-F-235).

**`ADMIN-F-120` bis `ADMIN-F-170` — Ausbaustufe.** Diese sechs Anforderungen gehören zur zweiten Ausbaustufe, weil die von ihnen bedienten Funktionen dort liegen: Moderation gemeinsam mit RATE-F-020/060, Helferbedarf gemeinsam mit HELFER, Prüfungsplan gemeinsam mit SCHED-F-190 bis F-220 und der Klärung von INT-013. Zuordnung siehe `../../product/roadmap.md`.

## 5. Datenmodell

Meldungsentwurf (FSR-News): Titel, Text, geplanter Veröffentlichungszeitpunkt, Zustand (Entwurf, veröffentlicht, zurückgezogen), verfassendes Konto. Nach Veröffentlichung entsteht daraus eine Meldung im Sinne von `../news/spec.md` Abschnitt 5, Klassifizierung „FSR-News".

Rollenzuweisung: Konto-Referenz und Rolle. Führendes System ist Authentik; das Backend hält keine eigene Kopie, sondern liest die Zuweisung aus dem Token und schreibt Änderungen über Authentik zurück.

Laufwege-Eintrag: zwei Raumkennungen und ein Distanzmaß (Arbeitsziel Fußweg-Minuten, siehe `../room-finder/spec.md` Abschnitt 13). Grobe Felder bereits in `../../platform/backend-and-api.md` Abschnitt 5 vorgedacht.

Stammdaten (ADMIN-F-180/190): Mensa-Liste, Raumliste, Links-/Downloads-Liste, Semestertermine und Ticket-Bildausschnitt. Feldstruktur je Ressource in `../../platform/backend-and-api.md` Abschnitt 5 und im Vertrag (`../../platform/api-contract.yaml`, Schemata `Mensa`, `Raum`, `Link`, `Semestertermine`, `Bildausschnitt`). Führendes System ist das eigene Backend; es gibt keine externe Quelle.

Verwaltungsprotokoll: Zeitpunkt, handelndes Konto, Art der Handlung, Referenz auf den betroffenen Datensatz. Kein Inhalt nutzergenerierter Beiträge (siehe Erläuterung zu ADMIN-F-110).

Helferbedarf und Prüfungsplan haben kein eigenes Datenmodell in dieser Spec — sie werden in `../event-volunteers/spec.md` beziehungsweise `../../platform/backend-and-api.md` Abschnitt 5 geführt und hier nur bearbeitet.

## 6. Externe Schnittstellen

Alle Verwaltungsfunktionen laufen über das eigene Backend INT-008; der Vertrag steht in `../../platform/api-contract.yaml`. Anmeldung und Rollenzuweisung nutzen INT-012 (Authentik). Der Prüfungsplan-Upload verarbeitet eine Datei aus INT-013, ruft diese Quelle aber nicht selbst ab — der Download aus dem Hochschul-Intranet bleibt ein manueller Schritt außerhalb des Systems. Keine Endpunktdetails hier — siehe `../../platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Nicht angemeldet | Anmeldeaufforderung; der Verwaltungsbereich ist nicht sichtbar (ADMIN-F-020) |
| Angemeldet ohne Verwaltungsrolle | Verwaltungsbereich bleibt unsichtbar; ein direkt aufgerufener Verwaltungspfad wird abgelehnt (ADMIN-F-010) |
| Laden | Ladeanzeige beim Abrufen von Entwürfen, Rollen, Laufwegen, Stammdaten oder Meldungen |
| Leer | Je Bereich benannter Leerzustand mit dem nächsten Schritt, etwa „noch keine Entwürfe — neue Meldung anlegen" (`../../platform/ux-and-theming.md` UX-F-110) |
| Fehler | Fehlermeldung mit Wiederholen-Option; ein nicht gespeicherter Entwurf bleibt erhalten |
| Offline | Verwaltungsfunktionen sind nicht verfügbar, siehe Abschnitt 8 |
| Vorschau | Darstellung der Meldung in der Ansicht der App vor dem Veröffentlichen (ADMIN-F-060) |
| Import läuft | Fortschrittsanzeige beim Prüfungsplan-Upload, danach Ergebnisbericht (ADMIN-F-160/170) |

## 8. Offline-Verhalten

Verwaltungsfunktionen sind ausschließlich online nutzbar und werden ohne Netzzugriff als nicht verfügbar gekennzeichnet. Sie werden ausdrücklich **nicht** in die Offline-Warteschlange aufgenommen (`../../platform/architecture.md` ARCH-F-120): Anders als eine Mensa-Bewertung ist eine Redaktions- oder Moderationshandlung an einen Zustand gebunden, der sich zwischen Auslösung und Übertragung geändert haben kann — eine Meldung wurde inzwischen von jemand anderem bearbeitet, ein Kommentar bereits entfernt, eine Rolle bereits entzogen. Eine verzögert übertragene Handlung würde in diesen Fällen einen fremden, neueren Stand überschreiben.

Ein lokal begonnener, noch nicht abgesendeter Meldungsentwurf bleibt davon unberührt und geht bei Verbindungsverlust nicht verloren.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Zwei Personen bearbeiten denselben Meldungsentwurf gleichzeitig | Der zweite Speichervorgang wird abgelehnt, mit Hinweis auf die zwischenzeitliche Änderung und Anzeige des neueren Stands |
| Zwei Personen bearbeiten dieselbe Stammdaten-Liste gleichzeitig | Der zweite Speichervorgang wird abgelehnt (ADMIN-F-200); der neuere Stand wird erneut geladen und zur Bearbeitung angeboten |
| Rollenänderung schlägt fehl, weil Authentik nicht erreichbar ist | Fehlermeldung mit Wiederholen-Option; die bisherige Rollenzuweisung bleibt unverändert |
| Prüfungsplan-Datei hat ein unerwartetes Format | Import abbrechen, bisherigen Bestand unverändert lassen, erkannte Abweichung benennen |
| Prüfungsplan-Datei enthält einzelne unlesbare Zeilen | Import abschließen, unlesbare Zeilen einzeln im Ergebnisbericht benennen (ADMIN-F-170) |
| Laufwege-Eintrag verweist zweimal auf dieselbe Raumkennung | Ablehnen mit Hinweis; ein Weg von einem Raum zu sich selbst hat kein Distanzmaß |
| Gemeldeter Kommentar wurde von der verfassenden Person bereits gelöscht | Meldung als erledigt kennzeichnen, keine Fehlermeldung |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| ADMIN-N-010 | Das System muss die Weboberfläche auf Bildschirmbreiten ab 1024 Pixeln vollständig bedienbar machen, ohne die Hochformat-Vorgabe der App (NFR-N-150) zu berühren. | NEU |
| ADMIN-N-020 | Das System muss Verwaltungsprotokolle mindestens zwölf Monate vorhalten, damit eine Handlung über einen Wechsel der FSR-Besetzung hinweg nachvollziehbar bleibt. | NEU |

### Erläuterungen

**`ADMIN-N-020`** — Zwölf Monate sind gewählt, weil die FSR-Besetzung jährlich wechselt; eine kürzere Frist würde bedeuten, dass die neue Besetzung Handlungen der vorherigen nicht mehr nachvollziehen kann. Die Frist steht nicht im Widerspruch zu den dreißig Tagen für technische Betriebsprotokolle (`../../platform/security-and-privacy.md` Abschnitt 3): Dort geht es um IP-Adressen und aufgerufene Endpunkte, hier um Verwaltungshandlungen ohne personenbezogene Inhalte.

## 11. Akzeptanzkriterien

- Ein Konto ohne Verwaltungsrolle erhält bei direktem Aufruf eines Verwaltungspfads eine Ablehnung vom Server, nicht nur eine ausgeblendete Schaltfläche (ADMIN-F-010).
- Dieselbe Meldung lässt sich in der App und in der Weboberfläche anlegen, bearbeiten und veröffentlichen, mit gleichem Ergebnis (ADMIN-F-030/040).
- Eine veröffentlichte und anschließend zurückgezogene Meldung erscheint nicht mehr in der Meldungsliste; war sie angepinnt, ist sie dort als zurückgezogen erkennbar (ADMIN-F-050).
- Der Versuch, die letzte verbleibende Zuweisung der Rolle FSR-Redaktion zu entziehen, wird abgelehnt (ADMIN-F-080).
- Ein Laufwege-Eintrag mit unbekannter Raumkennung wird gespeichert und dabei sichtbar als unbekannt gekennzeichnet (ADMIN-F-100).
- Jede verändernde Handlung erscheint im Verwaltungsprotokoll mit Zeitpunkt und Konto, ohne den Inhalt nutzergenerierter Beiträge (ADMIN-F-110).

## 12. Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet Verwaltungs- oder Redaktionsfunktionen. Die Alt-Apps waren reine Lese-Clients (`../../product/vision.md` Abschnitt 2); Inhalte entstanden außerhalb.

## 13. Offene Fragen

- ~~Ob der Web-Export vom Backend mitausgeliefert oder separat als statische Seite gehostet wird~~ Geklärt bei Einrichtung von Schritt 3 (FSR FB4, 2026-09-02): Der Web-Export wird **vom Backend mitausgeliefert** — ASP.NET Core stellt die statischen Export-Dateien unter dem Pfad `/admin` bereit. Eine Auslieferung, eine Domain, gemeinsame TLS-Konfiguration; die CI baut den Expo-Web-Export und legt ihn ins Backend-Artefakt. Siehe `../../decisions/0018-verwaltungsoberflaeche-react-native-web.md`.
- ~~Ergebnis des in ADR 0018 vorgesehenen Prototyps~~ Erfolgreich durchgeführt und bestätigt am 2026-08-26, siehe dort.
- Ob Meldungsentwürfe eine geplante Veröffentlichung zu einem künftigen Zeitpunkt unterstützen sollen oder nur sofortiges Veröffentlichen; für die erste Ausbaustufe ist das Feld im Datenmodell vorgesehen, eine zeitgesteuerte Auslieferung aber nicht gefordert.
- Ob das Verwaltungsprotokoll (ADMIN-F-110) in der Oberfläche einsehbar sein soll oder nur serverseitig geführt wird — für die erste Ausbaustufe genügt die serverseitige Führung.

## 14. Umsetzungsstand (Roadmap-Schritt 3)

| Anforderung | Stand |
|---|---|
| ADMIN-F-010, ADMIN-F-020, ADMIN-F-030 | umgesetzt (Backend-Rollenprüfung, App-Sichtbarkeit an Rolle gebunden, Unterseiten zusätzlich mit Umleitung bei Direktaufruf ohne Rolle; gemeinsame Codebasis App + Web-Export) |
| ADMIN-F-070 | **teilweise** — App/Web-Fluss, Backend-Endpunkt und `IAuthentikDirectory` vorhanden; Konten ohne bisherige Rolle werden über den Benutzernamen benannt und backendseitig zur Konto-Id aufgelöst (`core/users/?username=`, INT-012). Vertragstest gegen die INT-012-Struktur grün. Der **Lesepfad** der Authentik-Verwaltungs-API ist am 2026-09-03 live gegen `auth.tobtech.de` bestätigt. Ausstehend: erster schreibender Rollenwechsel und ein durchgängiger Anmeldevorgang über den Browser (Prüfprotokoll `../pruefprotokolle/2026-09-02-schritt-3-verwaltung.md`). |
| ADMIN-F-080 | umgesetzt (Ablehnung beim Entzug der letzten FSR-Redaktions-Zuweisung, als reine Funktion getestet; App zeigt den Grund an) |
| ADMIN-F-090, ADMIN-F-100 | umgesetzt (Laufwege-Pflege mit Hinweis auf unbekannte Raumkennungen) |
| ADMIN-F-110, ADMIN-N-020 | umgesetzt (Verwaltungsprotokoll je verändernder Handlung; Aufbewahrung 12 Monate über periodischen Aufräum-Job) |
| ADMIN-F-180, ADMIN-F-190 | umgesetzt (Mensa-, Raum- und Links-Liste anlegen/ändern/entfernen; Semestertermine und Ticket-Bildausschnitt änderbar; Backend- und Komponententests je Anforderung) |
| ADMIN-F-200 | umgesetzt (zweistufig: `If-Match`-Prüfung und Nebenläufigkeitskennung auf Datenbankebene → `412`; die App lädt daraufhin den neueren Stand nach) |
| ADMIN-N-010 | **teilweise** — Schwellwertlogik (1024 px) festgelegt und getestet; die Kartenliste ist auf breiten Bildschirmen bereits vollständig bedienbar. Das eigene **mehrspaltige Tabellen-Rendering** ab 1024 px steht noch aus (Prüfprotokoll `../pruefprotokolle/2026-09-02-schritt-3-verwaltung.md`). |
| ADMIN-F-040 bis ADMIN-F-060 | offen — News-Redaktion, Roadmap-Schritt 7 (NEWS) |
| ADMIN-F-120 bis ADMIN-F-170 | offen — zweite Ausbaustufe |
| Web-Export-Auslieferung (ADR 0018) | umgesetzt — der Deploy-Workflow baut den Expo-Web-Export mit `experiments.baseUrl='/admin'` nach `wwwroot/admin`, das Backend liefert ihn unter `https://api.fb4.it/admin` aus (`Program.cs`, `deploy/nginx-fsrfb4aas.conf`). Erstmals real 2026-09-04. **Ausstehend:** `https://api.fb4.it/admin` als Redirect-URI in der Authentik-Anwendung eintragen, damit der Browser-Anmeldevorgang durchläuft (Betriebseinstellung); danach der erste schreibende Rollenwechsel über den Browser. |
