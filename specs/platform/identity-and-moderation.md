---
id: identity-and-moderation
titel: Identität und Moderation
praefix: IDENT
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-24
derived_from: []
implemented_in: []
related:
  - security-and-privacy.md
  - backend-and-api.md
  - ../decisions/0004-identitaet-und-anmeldung.md
  - ../features/canteen-ratings/spec.md
  - ../features/event-volunteers/spec.md
---

# Identität und Moderation

## Zweck

Diese Spec legt fest, wie die App Nutzeridentität für Mensa-Bewertungen und Helfer-Anmeldungen handhabt, welche Rollen es gibt und wie mit gemeldeten Inhalten umgegangen wird. Die datenschutzrechtliche Einordnung steht in `security-and-privacy.md`, nicht hier.

## 1. Zielkonflikt

Der Fachbereich wünscht ausdrücklich eine „einfache Möglichkeit für Studierende, sich als Helfer einzutragen" — jede Anmeldehürde arbeitet dagegen. Gleichzeitig sind Bewertungen ohne jede Identität nicht gegen Mehrfach- und Spam-Abgabe zu schützen, und eine Helferliste ohne verlässliche Zuordnung ist für den FSR wertlos. Diese Spec löst den Konflikt nicht durch eine einheitliche Lösung, sondern durch Abstufung je Funktion (Abschnitt 2).

## 2. Optionen

| Option | Aufwand | Schutzwirkung | Hürde für Studierende | Datenschutzfolgen |
|---|---|---|---|---|
| (a) Hochschul-SSO | hoch | höchste Verlässlichkeit | höchste Hürde | Abhängigkeit von Hochschul-IT; keine eigene Passwortspeicherung |
| (b) verifizierte Hochschul-Mailadresse | mittel | mittel, belegt Zugehörigkeit | mittlere Hürde | E-Mail-Adresse als personenbezogenes Datum, Verifizierungsverfahren nötig |
| (c) gerätegebundenes Pseudonym ohne Anmeldung | niedrig | niedrig | niedrigste Hürde | wenig Daten, aber kein Schutz bei Geräteswechsel |
| (d) abgestuft: Bewertung pseudonym, Helfer-Anmeldung mit Kontaktweg | mittel | proportional zur Funktion | niedrig für Bewertung, mittel für Helfer-Anmeldung | Datenerhebung proportional zur jeweiligen Funktion |

Empfehlung: Option (d). Bewertungen sind niedrigschwellig und massenhaft, eine Anmeldehürde würde die Beteiligung unnötig senken; Helfer-Anmeldungen sind selten und brauchen ohnehin einen Kontaktweg für die Koordination durch den FSR, sodass die dort nötige Hürde keine zusätzliche Kosten verursacht. Die endgültige Entscheidung liegt bei `../decisions/0004-identitaet-und-anmeldung.md` und ist dort noch nicht getroffen.

## 3. Datensparsamkeit

| ID | Anforderung | Herkunft |
|---|---|---|
| IDENT-F-010 | Das System muss für eine Mensa-Bewertung ausschließlich ein Pseudonym als Identitätsmerkmal verlangen. | NEU |
| IDENT-F-020 | Das System muss für eine Helfer-Anmeldung ausschließlich einen Namen und genau einen Kontaktweg verlangen. | NEU |
| IDENT-F-030 | Das System muss darauf verzichten, für eine Bewertung oder eine Helfer-Anmeldung Matrikelnummer, Geburtsdatum oder Adresse zu erheben. | NEU |

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
| IDENT-F-070 | Wenn Moderation einen Missbrauchsfall bestätigt, muss das System die Möglichkeit bieten, das zugehörige Pseudonym oder Gerät zu sperren. | NEU |

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
| IDENT-F-120 | Das System muss Bewertungen nach Löschung des zugehörigen Kontos weiterhin anzeigen, wobei das Pseudonym von der Person entkoppelt bleibt. | NEU |
| IDENT-F-130 | Wenn eine Nutzerin oder ein Nutzer die Löschung des eigenen Kontos beantragt, muss das System alle personenbezogenen Daten dieser Person löschen, mit Ausnahme bereits entkoppelter Bewertungsinhalte. | NEU |

Zu IDENT-N-020: 30 Tage sind als Frist gewählt, weil der FSR nach einem Event üblicherweise noch Dank, Nachbesprechung oder Abrechnung mit den Helfenden organisiert; danach besteht kein fachlicher Bedarf mehr, Name und Kontaktweg vorzuhalten.

## 8. Verweis Datenschutz

Die datenschutzrechtliche Einordnung (Rechtsgrundlage, Betroffenenrechte, Auftragsverarbeitung) steht in `security-and-privacy.md`.

## 9. Offene Fragen

- Endgültige Entscheidung zwischen den Optionen (a) bis (d) — `../decisions/0004-identitaet-und-anmeldung.md`.
- Exakte Ausgestaltung der Missbrauchssperre (Dauer, Wiederzulassung) — Klärung bei Umsetzung von IDENT-F-070.
