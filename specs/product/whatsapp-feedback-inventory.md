---
id: whatsapp-feedback-inventory
titel: Auswertung WhatsApp-Gruppenchats — Feature-Hinweise
status: draft
version: 0.1.2
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - chats/
related:
  - vision.md
  - legacy-inventory.md
  - ../open-questions.md
---

# Auswertung WhatsApp-Gruppenchats — Feature-Hinweise

## 1. Zweck und Vorgehen

Dieses Dokument wertet 11 WhatsApp-Gruppenchats verschiedener FB4-Kohorten automatisiert und anschließend inhaltlich aus, um zu erfassen, welche Funktionen und Anforderungen Studis an die neue App äußern oder implizit erwarten. Eine Skript-Pipeline (`scripts/whatsapp_mining/`) hat 70.453 Nachrichten geparst, pseudonymisiert und auf Relevanz vorgefiltert; ausgewertet wurden die 74 höchst-relevanten Treffer (Schwellenwert 4) samt Kontext. Dieses Dokument ist **kein Ersatz für formale Anforderungen** — es liefert Belege und Empfehlungen, die bei Bedarf mit eigener ID und Herkunftsmarkierung `Recherche: WhatsApp-Chat <Slug>, 2026-08-25` in die betroffenen Feature-Specs übernommen werden können.

## 2. Datengrundlage

| Chat/Slug | Kohorte | Zeitraum | Nachrichten | Treffer (Score ≥4) |
|---|---|---|---|---|
| efsk | FSR-Gremium / erweiterter Kreis (Kassenwesen, Event-Orga) | 2023-10-25 – 2026-08-09 | 2.401 | 8 |
| erstis-fh-informatik-ws-24-25 | Erstsemester-Onboarding WS 24/25 | 2024-08-02 – 2026-08-10 | 36 | 0 |
| erstis-fh-informatik-ws-25-26 | Erstsemester-Onboarding WS 25/26 | 2025-09-02 – 2026-08-24 | 1.095 | 0 |
| fh-do-informatik-ws-23-24 | Informatik allgemein WS 23/24 | 2023-06-27 – 2026-08-20 | 1.446 | 0 |
| fh-dortmund | Sammel-/Übergangschat, geringe Aktivität | 2022-12-04 – 2026-08-24 | 367 | 0 |
| fh-informatik-22-23 | Informatik allgemein 2022/23 (größter Chat) | 2022-08-31 – 2026-08-24 | 25.983 | 13 |
| informatik-pi-ti-ds-ws-24-25 | Praktische/Technische Informatik, Data Science WS 24/25 | 2024-08-02 – 2026-08-24 | 15.259 | 25 |
| pi-8-semester-fh-informatik | Praktische Informatik, 8. Fachsemester | 2022-09-09 – 2026-08-22 | 14.437 | 6 |
| praktische-informatik-ws-23-24 | Praktische Informatik WS 23/24 | 2023-06-27 – 2026-08-24 | 8.877 | 21 |
| wirtschaftsinformatik-verbund-master-ws-25-26 | Wirtschaftsinformatik-Verbund, Master WS 25/26 | 2025-10-07 – 2026-08-20 | 78 | 0 |
| wirtschaftsinformatik-ws-23-24 | Wirtschaftsinformatik WS 23/24 | 2023-07-24 – 2026-08-08 | 474 | 1 |

Fünf der elf Chats (Erstis beide Jahrgänge, fh-do-informatik, fh-dortmund, WI-Verbund-Master) lieferten **keinen** Treffer oberhalb der Schwelle — überwiegend Organisations-/Ankündigungschats mit wenig Diskussion. Das gesamte auswertbare Signal stammt aus 6 Chats.

## 3. Methodik

Die Pipeline bewertet jede Nachricht über eine gewichtete deutsche Keyword-Taxonomie (explizite Feature-Wünsche, Beschwerden, Alt-App-Bezüge, Domänenbegriffe je Feature) und ergänzt Kontext (±2 Nachrichten) um jeden Treffer, um Anschlussreaktionen wie „genau!!"/„+1" zu erfassen. Ausgewertet wurde Schwellenwert 4 (hohe Präzision, 74 Treffer in 67 Blöcken, ~49 KB).

Grenzen: rein keyword-basiert, keine Negations- oder Sarkasmus-Erkennung, kein Vollständigkeitsanspruch. Die globale Begriffshäufigkeit (siehe `analysis/candidates/candidates.md`) zeigt, dass der überwiegende Teil der Chats aus allgemeiner Studien-Organisation besteht (Klausuren, Ilias, Mathe, Gruppentreffen) — keine dedizierten App-Feedback-Kanäle. Die Fundstellen sind daher eine Stichprobe spontan geäußerter Meinungen, kein repräsentativer Survey.

## 4. Themenübersicht

| Thema | Beschreibung | Chats | Erwähnungen | Bezug | Nachfrage-Stärke | Herkunft |
|---|---|---|---|---|---|---|
| iOS-Nichtverfügbarkeit der Alt-App | Über Jahre wiederkehrend: FB4-App zeitweise oder dauerhaft nicht im iOS App Store / nicht installierbar. | 3 (fh-informatik-22-23, informatik-pi-ti-ds-ws-24-25, praktische-informatik-ws-23-24) | 7 | SHELL | hoch | Recherche: WhatsApp-Chat fh-informatik-22-23 / informatik-pi-ti-ds-ws-24-25 / praktische-informatik-ws-23-24, 2026-08-25 |
| App-Fragmentierung (FB4 vs. Studo vs. HISinOne) | Studis wechseln je nach fehlender Funktion zwischen mehreren Apps/Portalen. | 2 (informatik-pi-ti-ds-ws-24-25, praktische-informatik-ws-23-24) | 6 | SHELL, NEU (Konsolidierung) | mittel | Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25 / praktische-informatik-ws-23-24, 2026-08-25 |
| Stundenplan-Nutzung & -Wunsch | Aktive Nutzung als Hauptfunktion; Wunsch nach übersichtlicherer, selbst zusammenstellbarer Ansicht; Frust bei Gruppenkennungs-Änderungen. | 3 (informatik-pi-ti-ds-ws-24-25, praktische-informatik-ws-23-24, pi-8-semester-fh-informatik) | 11 | SCHED | hoch | Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25 / praktische-informatik-ws-23-24 / pi-8-semester-fh-informatik, 2026-08-25 |
| News/Aktuelles-Nutzung | Aktive Nutzung zur Ausfall-/Terminkommunikation; Wunsch nach Markieren/Anpinnen wichtiger Infos. | 3 (fh-informatik-22-23, pi-8-semester-fh-informatik, praktische-informatik-ws-23-24) | 4 | NEWS | mittel | Recherche: WhatsApp-Chat fh-informatik-22-23 / pi-8-semester-fh-informatik / praktische-informatik-ws-23-24, 2026-08-25 |
| Ticket-Download-Fehler | Konkreter Bug-Report: digitales Semesterticket lässt sich nicht laden. | 1 (praktische-informatik-ws-23-24) | 1 | TICKET | konkret, geringes Volumen | Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25 |
| Noten-/HISinOne-Verwirrung | Wiederkehrende Unsicherheit, wann/wo Klausurergebnisse in HISinOne erscheinen. | 2 (fh-informatik-22-23, informatik-pi-ti-ds-ws-24-25) | 2 | NOTEN | mittel | Recherche: WhatsApp-Chat fh-informatik-22-23 / informatik-pi-ti-ds-ws-24-25, 2026-08-25 |
| Wichtige-Nachrichten-Markierung | Wunsch nach Pin-Funktion „wie bei Telegram" (im Chat-Kontext geäußert, auf App übertragbar). | 1 (praktische-informatik-ws-23-24) | 2 | NEWS | schwach, aber konkret | Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25 |
| Raumsuche-Nutzung | Bestätigte Nutzung der Alt-App-Funktion „leere Räume". | 1 (fh-informatik-22-23) | 1 | RAUM | schwach | Recherche: WhatsApp-Chat fh-informatik-22-23, 2026-08-25 |
| Abstimmungsbedarf | Einzelbeleg für Chat-Umfrage zu FSR-Entscheidung (Kalenderkauf), nicht app-bezogen. | 1 (fh-informatik-22-23) | 1 | NEU (spekulativ) | sehr schwach | Recherche: WhatsApp-Chat fh-informatik-22-23, 2026-08-25 |
| Ersti-Onboarding-Timing | Einzelbeleg: Erstizeitung/Mentoring-Infos kamen später als erwartet. | 1 (informatik-pi-ti-ds-ws-24-25) | 1 | NEU (spekulativ) | sehr schwach | Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25, 2026-08-25 |

## 5. Je-Feature-Abgleich

| Feature | Chat-Signal | Befund | Empfehlung |
|---|---|---|---|
| SHELL (app-shell) | ja, indirekt | Wiederkehrende iOS-Ausfälle über mehrere Jahre bestätigen hohe Priorität von „eine App, plattformübergreifend" (bereits Leitziel in vision.md). | Keine neue Anforderung nötig — als zusätzliche Begründung in `vision.md` §2 ergänzbar. |
| RAUM (room-finder) | ja, schwach | Ein Beleg für Nutzung der Alt-Funktion „leere Räume". | Bestehende Spec ausreichend, kein neuer Bedarf erkennbar. |
| SCHED (schedule) | ja, stark | Hohe Nutzung bestätigt; Frust über Gruppenkennungs-Änderungen deckt sich mit bereits bekanntem Alt-App-Fehler (siehe `legacy-inventory.md` M-016). Gezielter Zusatzdurchlauf (2026-08-25, Themen Wahlpflicht/Gruppenwechsel/Kollision, s. u.) bestätigt zusätzlich informellen Gruppenwechsel als gelebtes Verhalten sowie eine konkrete Lücke: Wahlpflicht-Termine fehlten im Alt-App-Stundenplan, wenn sie einem anderen Fachsemester zugeordnet waren. | Kern-Priorität bestätigt; Robustheit bei Gruppenkennungs-/Semesterwechsel priorisieren. Wahlpflicht-Planungsmodus und Gruppenwechsel-Einsicht als SCHED-F-250 bis SCHED-F-320 in `features/schedule/spec.md` übernommen. |
| MENSA (canteen) | nein | Keine Erwähnung in den Kandidaten-Treffern. | Keine Ableitung möglich, Spec unverändert lassen. |
| RATE (canteen-ratings) | nein | Kein einziger „Mensa bewerten"-Treffer trotz eigener Keyword-Kategorie. | Siehe Offene Frage 1 — passive Chat-Analyse bildet dieses Bedürfnis vermutlich nicht ab. |
| NEWS (news) | ja, mittel | News-Sektion aktiv zur Ausfallkommunikation genutzt; Wunsch nach Pin-Funktion für wichtige Infos. | Bestätigt Relevanz der bereits speced Pin-/Push-Funktion. |
| EVENT (events) | nein, direkt | Nur im FSR-internen efsk-Chat sichtbar (Weihnachtsmarkt-Orga), kein Studi-seitiges Signal. | Kein zusätzlicher Bedarf aus Studi-Perspektive erkennbar. |
| HELFER (event-volunteers) | ja, nur FSR-intern | Helfer-Koordination im efsk-Chat bestätigt organisatorischen Bedarf aus FSR-Sicht, kein Studi-Wunsch. | Bestehende Spec (FSR-Perspektive) ausreichend bestätigt. |
| WIKI (wiki) | nein | Keine Erwähnung. | Kein Befund. |
| TICKET (semester-ticket) | ja, konkret | Ein Bug-Report zu Ticket-Download. | Als Qualitäts-/Zuverlässigkeitshinweis vermerken (siehe Offene Frage 2 zur Aktualität). |
| NOTEN (grades) | ja, mittel | Wiederkehrende Verwirrung rund um HISinOne-Notenabruf. | Bestätigt Priorität des bereits blockierten HISinOne-Spikes. |
| SET (settings) | nein | Keine Erwähnung. | Kein Befund. |

## 6. Neue/nicht abgedeckte Themen

| Thema | Beschreibung | Bezug zu Nicht-Zielen? | Empfehlung |
|---|---|---|---|
| App-Fragmentierung (Studo/HISinOne als Ausweichlösung) | Studis nutzen Drittanbieter-Apps, weil einzelne Funktionen in der Alt-App fehlen/unzuverlässig sind. | Nein — unterstützt sogar Leitziel „Eine App statt zwei". | Als zusätzliche Begründung in `vision.md` ergänzbar, kein neues Feature nötig. |
| In-App-Umfragefunktion für FSR-Entscheidungen | Ein Beleg für Chat-Abstimmung zu einer FSR-Entscheidung. | Nein direkt, aber fraglich ob innerhalb des „kern"-Umfangs. | Zu dünne Evidenzbasis (1 Beleg) — als offene Frage vormerken, nicht in Spec übernehmen. |
| Ersti-Onboarding-Timing | Erstizeitung/Mentoring-Infos kamen laut einem Beleg später als erwartet. | Nein. | Einzelbeleg, keine belastbare Ableitung — ggf. bei künftiger Auswertung erneut prüfen. |
| E-Mail-Abruf in der App | Eine Frage, ob die App E-Mails abrufen kann. | Ja, grenzt an Nicht-Ziel 1 (kein Ersatz für offizielle Hochschulsysteme). | Nicht aufnehmen, klar außerhalb Scope. |

## 7. Widerspruch zu Nicht-Zielen

Abgleich gegen die drei in `vision.md` genannten Nicht-Ziele (kein Ersatz für offizielle Hochschulsysteme, nicht hochschulweit, keine Monetarisierung):

- Der E-Mail-Abruf-Wunsch (Abschnitt 6) grenzt an Nicht-Ziel 1 — wird nicht übernommen.
- Keine Hinweise auf Monetarisierungs- oder Werbewünsche in den Kandidaten-Treffern.
- Keine Hinweise auf eine gewünschte Ausweitung über FB4 hinaus — alle Chats sind Informatik-/Wirtschaftsinformatik-spezifisch, konsistent mit der definierten Zielgruppe.

## 8. Offene Fragen / Nächste Schritte

1. ~~**RATE (Mensa-Bewertungen) ohne Chat-Evidenz:** Studis würden ein noch nicht existierendes Konzept vermutlich nicht spontan im Chat vorschlagen. Vor einer Abwertung der RATE-Priorität sollte der FSR das gezielt nachfragen (z. B. kurze In-App-Umfrage nach Launch), statt sich allein auf diese passive Analyse zu verlassen.~~ **Erledigt:** FSR FB4 hat am 2026-08-25 den Umfang direkt festgelegt (Gesamtbewertung plus tagesaktuelle Detailansicht, Standortbezug bewusst zurückgestellt), ohne gesonderte Umfrage — siehe `features/canteen-ratings/spec.md` RATE-F-080.
2. **Aktualität des Ticket-Download-Bugs prüfen:** Der Beleg stammt vom 2025-10-15 — vor Übernahme in die TICKET-Spec sollte geprüft werden, ob das Problem noch besteht.
3. **Mehr Recall bei Bedarf:** Ein Nachlauf mit `--threshold 3` (reine Wiederholung von Schritt 4 der Pipeline, ~203–285 KB Kandidaten) liefert mehr Tiefe, falls der FSR zu einzelnen Themen (z. B. RAUM, WIKI) mehr Belege sucht, die im aktuellen Schwelle-4-Set kaum vorkommen.
4. **Kein Vollständigkeitsanspruch:** Diese Auswertung deckt nur bereits geäußerte, spontane Nachrichten ab — kein Ersatz für eine gezielte Befragung der Studis.
5. ~~**SCHED vertiefen (Wahlpflicht/Gruppenwechsel):** Die generische Keyword-Taxonomie (siehe `scripts/whatsapp_mining/keywords_de.py`, Kategorie E) deckt Domänenbegriffe wie „Wahlpflicht", „Gruppenwechsel" oder „Kollision" nicht ab.~~ **Erledigt (2026-08-25):** Gezielter Zusatzdurchlauf direkt über `analysis/parsed/*.jsonl` (pseudonymisiert, ohne die generische Pipeline erneut auszuführen) mit sieben Zusatzbegriffen; 6 der 10 hier ausgewerteten Chats (efsk als FSR-internes Gremium ausgeschlossen) lieferten Treffer. Ergebnis in `features/schedule/spec.md` als SCHED-F-250 bis SCHED-F-320 übernommen.

## 9. Anhang: Pipeline-Reproduktion

Bei neuen Chat-Exporten (z. B. nächstes Semester) die aktualisierten Archive nach `chats/` legen und erneut ausführen:

```bash
python scripts/whatsapp_mining/01_extract.py
python scripts/whatsapp_mining/02_parse.py
python scripts/whatsapp_mining/03_score.py
python scripts/whatsapp_mining/04_build_candidates.py --threshold 4 --context 2
```

Details zu Schwellenwerten und Dateilayout: `scripts/whatsapp_mining/README.md`.
