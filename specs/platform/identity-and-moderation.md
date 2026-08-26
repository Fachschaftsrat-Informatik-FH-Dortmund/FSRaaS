---
id: identity-and-moderation
titel: Identität und Moderation
praefix: IDENT
status: accepted
version: 1.4.0
owner: FSR FB4
last_reviewed: 2026-08-26
derived_from: []
implemented_in: []
related:
  - security-and-privacy.md
  - backend-and-api.md
  - ../decisions/0004-identitaet-und-anmeldung.md
  - ../decisions/0010-authentik-als-identitaetsanbieter.md
  - ../features/canteen-ratings/spec.md
  - ../features/event-volunteers/spec.md
  - ../features/e-key/spec.md
---

# Identität und Moderation

## Zweck

Diese Spec legt fest, wie die App Nutzeridentität für Mensa-Bewertungen, Helfer-Anmeldungen und die E-Key-Verwaltung handhabt, welche Rollen es gibt und wie mit gemeldeten Inhalten umgegangen wird. Die datenschutzrechtliche Einordnung steht in `security-and-privacy.md`, nicht hier.

## 1. Zielkonflikt

Der Fachbereich wünscht ausdrücklich eine „einfache Möglichkeit für Studierende, sich als Helfer einzutragen" — jede Anmeldehürde arbeitet dagegen. Gleichzeitig sind Bewertungen ohne jede Identität nicht gegen Mehrfach- und Spam-Abgabe zu schützen, eine Helferliste ohne verlässliche Zuordnung ist für den FSR wertlos, und die E-Key-Verwaltung (`../features/e-key/spec.md`) braucht ein über Semestergrenzen hinweg wiedererkennbares Konto für die semesterweise Bestätigung. Diese Spec löst den Konflikt nicht durch eine einheitliche Lösung, sondern durch Abstufung je Funktion (Abschnitt 2).

## 2. Entscheidung (ADR 0004)

Entschieden in `../decisions/0004-identitaet-und-anmeldung.md`, FSR FB4, 2026-08-25:

| Funktion | Identitätsstufe | Hürde |
|---|---|---|
| Alle Lesefunktionen (Stundenplan, Mensaplan, News, Raumsuche, Wiki, Event-Kalender, Notenübersicht), Mensa-Bewertungen lesen | keine — vollständig kontofrei | keine |
| Helfer-Anmeldung | Name + ein Kontaktweg, kein Konto | niedrig |
| Mensa-Bewertung verfassen | Konto erforderlich | mittel |
| E-Key-Verwaltung | Konto erforderlich | mittel |

Zusätzlich kontogebunden ist der Zugang zur Verwaltungs- und Redaktionsoberfläche (`../features/admin/spec.md`), dort über die Rollen aus Abschnitt 4.

Das Konto entsteht über eine eigenbetriebene Authentik-Instanz als einzigen Identitätsanbieter (INT-012), angebunden per OpenID Connect im Systembrowser. Authentik meldet sich seinerseits gegen den Microsoft-Mandanten der FH Dortmund an, sobald die dafür nötige App-Registrierung erteilt ist; bis dahin führt Authentik eigene Konten mit E-Mail-Verifizierung. Für App und Backend ist dieser Unterschied unsichtbar. Passwort-Replay gegen ein Hochschulsystem bleibt in beiden Fällen ausgeschlossen. Entscheidung FSR FB4, 2026-08-25, siehe `../decisions/0010-authentik-als-identitaetsanbieter.md`; Zielkonflikt und Abstufung siehe ADR 0004.

## 3. Datensparsamkeit

| ID | Anforderung | Herkunft |
|---|---|---|
| ~~IDENT-F-010~~ | ~~Das System muss für eine Mensa-Bewertung ausschließlich ein Pseudonym als Identitätsmerkmal verlangen.~~ — entfallen | NEU |
| IDENT-F-012 | Das System muss für das Lesen von Mensa-Bewertungen kein Identitätsmerkmal verlangen. | NEU |
| IDENT-F-015 | Das System muss für das Verfassen einer Mensa-Bewertung ein Konto verlangen (siehe Abschnitt 2). | NEU |
| IDENT-F-020 | Das System muss für eine Helfer-Anmeldung ausschließlich einen Namen und genau einen Kontaktweg verlangen, kein Konto. | NEU |
| IDENT-F-030 | Das System muss darauf verzichten, für eine Helfer-Anmeldung oder für das Bewertungs-Konto Matrikelnummer, Geburtsdatum oder Adresse zu erheben. | NEU |
| IDENT-F-035 | Das System muss für die E-Key-Verknüpfung ausnahmsweise die Matrikelnummer erheben, ausschließlich zum Abgleich gegen den vom FSR angelegten E-Key-Datensatz (siehe `../features/e-key/spec.md` EKEY-F-030/035). | NEU |

### Erläuterungen

**`IDENT-F-010` (entfallen).** Vor der Entscheidung ADR 0004 (2026-08-25) verlangte diese Anforderung für jede Bewertung ausschließlich ein Pseudonym, auch zum Verfassen. Ersetzt durch IDENT-F-012 (Lesen, kontofrei) und IDENT-F-015 (Schreiben, Konto erforderlich) — die Kontopflicht für den Schreibpfad ist eine inhaltliche Verschärfung gegenüber dem ursprünglichen reinen Pseudonym-Modell, kein reines Umbenennen. Das im Konto hinterlegte Identitätsmerkmal (SSO-Kennung oder E-Mail-Adresse, siehe Abschnitt 2) tritt an die Stelle des bisherigen Pseudonyms als Grundlage für IDENT-F-050 (Einmal-pro-Tag-Sperre); ein öffentlich angezeigtes Pseudonym (Anzeigename) bleibt davon unabhängig bestehen, siehe IDENT-F-120.

## 4. Rollen

| Rolle | Bewertungen | Events / News | Helferlisten | Moderation |
|---|---|---|---|---|
| Studierende | abgeben, eigene löschen | lesen | eigene Anmeldung abgeben | Inhalte melden |
| FSR-Redaktion | lesen | pflegen | einsehen | – |
| Moderation | gemeldete prüfen und entfernen | – | – | bearbeiten |

| ID | Anforderung | Herkunft |
|---|---|---|
| IDENT-F-040 | Das System muss den Zugriff auf Helferlisten auf die Rolle FSR-Redaktion und die Bearbeitung gemeldeter Inhalte auf die Rolle Moderation beschränken. | NEU |
| IDENT-F-045 | Das System muss die Rollenzugehörigkeit einer Person aus dem Identitätsanbieter (INT-012) beziehen, statt sie eigenständig zu verwalten. | NEU |

Zu IDENT-F-045: Rollen werden als Gruppen in Authentik geführt und als Claim im Token übertragen. Das Backend prüft diesen Claim, hält aber keine eigene Rollentabelle. Die Zuweisung selbst erfolgt über die Verwaltungsoberfläche (`../features/admin/spec.md` ADMIN-F-070), die auf Authentik wirkt — damit bleibt genau eine Stelle maßgeblich, und ein entzogener Zugang wirkt sofort für alle Anwendungen.

## 5. Missbrauchsschutz

| ID | Anforderung | Herkunft |
|---|---|---|
| IDENT-F-050 | Wenn eine Person für ein Gericht an einem Tag bereits eine Bewertung abgegeben hat, muss das System eine weitere Bewertung derselben Person für dasselbe Gericht am selben Tag ablehnen. | NEU |
| IDENT-F-060 | Das System muss Muster massenhafter, in kurzer Zeit von derselben Quelle eingehender Bewertungen erkennen und zur Prüfung markieren. | NEU |
| IDENT-F-065 | Das System muss Muster massenhafter, in kurzer Zeit von derselben Quelle eingehender kontofreier Beiträge erkennen und zur Prüfung markieren. | NEU |
| IDENT-F-070 | Wenn Moderation einen Missbrauchsfall bestätigt, muss das System das zugehörige Konto für 30 Tage sperren, mit Widerspruchsmöglichkeit für die betroffene Person. | NEU |
| IDENT-F-140 | Wenn sich eine Nutzerin abmeldet, muss das System zusätzlich zum lokalen Entfernen der Zugangsdaten eine serverseitige Abmeldung (RP-Initiated Logout) beim Identitätsanbieter auslösen, die die Sitzung dort invalidiert. | NEU |
| IDENT-N-030 | Das System muss kurzlebige Zugriffstoken mit Refresh-Token-Erneuerung verwenden, statt ein Zugriffstoken unverändert bis zu seinem Ablauf vorzuhalten. | NEU |
| IDENT-F-150 | Solange die FH-Föderation für Authentik nicht aktiv ist, muss das System Kontoregistrierungen zusätzlich zur Anfragequelle (IP-Adresse) begrenzen, um eine Umgehung von API-N-010 durch Mehrfachregistrierung zu erschweren. | NEU |

Zu IDENT-F-140/IDENT-N-030: Ohne serverseitige Invalidierung bliebe ein entwendetes Token nach „Abmelden" clientseitig weiter gültig. Ergänzt `data-and-storage.md` DATA-F-130 (lokales Entfernen), das für sich allein nicht ausreicht.

Zu IDENT-F-150: Betrifft insbesondere die für die erste Ausbaustufe vorgesehene Missbrauchserkennung bei Bewertungen (IDENT-F-060) — ein kontobezogenes Ratenlimit (`backend-and-api.md` API-N-010) ist wirkungslos, solange ein Konto durch bloße E-Mail-Verifizierung günstig neu angelegt werden kann.

## 6. Moderation nutzergenerierter Inhalte

Lebenszyklus eines Bewertungskommentars: eingereicht → sichtbar → gemeldet → geprüft → sichtbar/entfernt.

| ID | Anforderung | Herkunft |
|---|---|---|
| IDENT-F-080 | Das System muss eingereichte Bewertungskommentare unmittelbar nach dem Absenden veröffentlichen, ohne redaktionelle Vorprüfung. | NEU |
| IDENT-F-090 | Wenn eine Nutzerin oder ein Nutzer einen Kommentar meldet, muss das System ihn zur Prüfung durch die Moderation markieren, ohne ihn automatisch auszublenden. | NEU |
| IDENT-N-010 | Das System muss gemeldete Inhalte innerhalb von fünf Werktagen prüfen. | NEU |
| IDENT-F-100 | Wenn die Moderation einen gemeldeten Kommentar entfernt, muss das System die einreichende Person über die Entfernung und den Grund benachrichtigen. | NEU |
| IDENT-F-110 | Das System muss der einreichenden Person die Möglichkeit bieten, der Entfernung ihres Kommentars zu widersprechen. | NEU |

Zu IDENT-F-080: Vorprüfung vor Veröffentlichung (Prämoderation) wurde erwogen und verworfen. Der FSR betreibt die Moderation ehrenamtlich und kann keine durchgängige Prüfzeit vor Veröffentlichung zusagen; eine Prämoderationswarteschlange würde Bewertungen tage- statt minutenaktuell machen und die Beteiligung dämpfen. Nachträgliche Prüfung mit niedrigschwelligem Meldeweg ist der für ehrenamtlich betriebene Communitys übliche Ansatz und wird hier übernommen.

## 7. Aufbewahrung und Löschung

| ID | Anforderung | Herkunft |
|---|---|---|
| IDENT-N-020 | Wenn ein Event beendet ist, muss das System die zugehörigen Helfer-Kontaktdaten spätestens nach 30 Tagen löschen. | NEU |
| IDENT-F-120 | Das System muss Bewertungen nach Löschung des zugehörigen Kontos weiterhin anzeigen, wobei das angezeigte Pseudonym vom gelöschten Konto entkoppelt bleibt. | NEU |
| IDENT-F-130 | Wenn eine Nutzerin oder ein Nutzer die Löschung des eigenen Kontos beantragt, muss das System alle personenbezogenen Daten dieser Person löschen, mit Ausnahme bereits entkoppelter Bewertungsinhalte. | NEU |

Zu IDENT-N-020: 30 Tage sind als Frist gewählt, weil der FSR nach einem Event üblicherweise noch Dank, Nachbesprechung oder Abrechnung mit den Helfenden organisiert; danach besteht kein fachlicher Bedarf mehr, Name und Kontaktweg vorzuhalten.

## 8. Verweis Datenschutz

Die datenschutzrechtliche Einordnung (Rechtsgrundlage, Betroffenenrechte, Auftragsverarbeitung) steht in `security-and-privacy.md`.

## 9. Offene Fragen

- Zeitpunkt und Ergebnis der App-Registrierung im Microsoft-Mandanten der FH Dortmund, die Authentik für die Federation benötigt — `../platform/integrations.md` INT-012, Klärung durch FSR FB4 mit der Hochschul-IT. Die Umsetzung ist davon nicht blockiert, da Authentik bis dahin eigene Konten führt.
- Ob bei aktiver Federation zuvor angelegte eigene Konten migriert oder parallel weiterbetrieben werden — offener Punkt in `../decisions/0010-authentik-als-identitaetsanbieter.md`.
- Auf welches Merkmal IDENT-F-065 die „Quelle" bei kontofreien Beiträgen stützt (Netzadresse, geräteseitige Kennung oder beides) — bei Umsetzung festzulegen, unter Beachtung von SEC-N-120 und der Aufbewahrungsfrist technischer Protokolle.
