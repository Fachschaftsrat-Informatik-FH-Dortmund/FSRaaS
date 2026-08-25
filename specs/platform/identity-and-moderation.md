---
id: identity-and-moderation
titel: Identität und Moderation
praefix: IDENT
status: draft
version: 1.2.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from: []
implemented_in: []
related:
  - security-and-privacy.md
  - backend-and-api.md
  - ../decisions/0004-identitaet-und-anmeldung.md
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

Bevorzugter Anmeldeweg für das Konto ist Hochschul-SSO (`../platform/integrations.md` INT-012, Status zu verifizieren); bei Nichtverfügbarkeit tritt ein einfaches, vom eigenen Backend verwaltetes Konto als Ersatzoption in Kraft (z. B. E-Mail-Verifizierung), ausdrücklich ohne Passwort-Replay gegen ein Hochschulsystem. Begründung, Alternativen und offene Punkte: siehe ADR 0004.

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

## 5. Missbrauchsschutz

| ID | Anforderung | Herkunft |
|---|---|---|
| IDENT-F-050 | Wenn eine Person für ein Gericht an einem Tag bereits eine Bewertung abgegeben hat, muss das System eine weitere Bewertung derselben Person für dasselbe Gericht am selben Tag ablehnen. | NEU |
| IDENT-F-060 | Das System muss Muster massenhafter, in kurzer Zeit von derselben Quelle eingehender Bewertungen erkennen und zur Prüfung markieren. | NEU |
| IDENT-F-070 | Wenn Moderation einen Missbrauchsfall bestätigt, muss das System das zugehörige Konto für 30 Tage sperren, mit Widerspruchsmöglichkeit für die betroffene Person. | NEU |

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

- Ob Hochschul-SSO als Anmeldeweg technisch/organisatorisch verfügbar ist — `../platform/integrations.md` INT-012, Klärung durch FSR FB4 mit der Hochschul-IT.
