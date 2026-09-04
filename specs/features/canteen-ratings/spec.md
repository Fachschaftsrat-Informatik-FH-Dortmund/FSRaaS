---
id: canteen-ratings
titel: Mensa-Bewertungen
praefix: RATE
status: accepted
prioritaet: kern
version: 2.0.0
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from: []
implemented_in:
  - backend/src/Fb4.Backend/Infrastructure/Mensa   # RATE-F-050 (Gerichtsnormalisierung, in Roadmap-Schritt 4 vorgezogen für MENSA-F-090)
related:
  - ../canteen-photos/spec.md
  - ../../platform/backend-and-api.md
  - ../../platform/identity-and-moderation.md
  - ../../platform/security-and-privacy.md
  - ../../platform/data-and-storage.md
  - ../../platform/quality-and-testing.md
  - ../../platform/integrations.md
  - ../canteen/spec.md
---

# Mensa-Bewertungen

## 1. Zweck & Nutzen

Ermöglicht Studierenden, Gerichte des Mensaplans zu bewerten, und anderen Studierenden, sich vor der Essensauswahl an diesen Bewertungen zu orientieren. Vollständige Neuentwicklung ohne Vorbild in einer der Alt-Apps — der erste Schreibpfad und die erste nutzergenerierte Inhaltsart der neuen App.

## 2. Scope / Nicht-Scope

### Scope

- Bewertung eines Gerichts in einer von drei Stufen (schlecht, gut, sehr gut, nach dem Vorbild von Streaming-Diensten wie Netflix), optionaler Freitext-Kommentar — Verfassen erfordert ein Konto (siehe `platform/identity-and-moderation.md` Abschnitt 2, `decisions/0004-identitaet-und-anmeldung.md`).
- Lesen von Bewertungen und der Gesamtbewertung ohne Konto, für jede Nutzerin.
- Anzeige der Gesamtbewertung (Durchschnitt über alle Tage) und der Anzahl abgegebener Bewertungen je Gericht in der Übersicht (Mensaplan).
- Detailansicht je Gericht mit zusätzlicher, auf den aktuellen Tag beschränkter Durchschnittsbewertung, da sich dieselbe Gerichtsbezeichnung je nach Zubereitungstag unterscheiden kann.
- Melden und Moderation missbräuchlicher Kommentare.
- Gerätelokale Spiegelung der eigenen Bewertungen, damit der Lieblingsgericht-Abgleich des Mensaplans ohne Netzzugriff arbeiten kann.
- Einstiegspunkt ausschließlich innerhalb des Mensaplans je Gericht, kein eigener Navigationspunkt in der App-weiten Navigationsstruktur (siehe `platform/architecture.md` ARCH-F-090).

### Nicht-Scope

- Bewertung der Mensa als Ganzes (Ambiente, Service) — Scope ist ausschließlich das einzelne Gericht.
- Separate Bewertung je Mensa-Standort für dasselbe Gericht — als Idee erkannt (Entscheidung FSR FB4, 2026-08-25), aber bewusst nicht in diesem Umfang; siehe Abschnitt 13.
- Konto-Erstellung/-Verwaltung selbst (Anmeldeweg, SSO-Anbindung) — `platform/identity-and-moderation.md`, `platform/integrations.md` INT-012.
- Die Lieblingsgericht-Funktion und ihre Benachrichtigung selbst — `features/canteen/spec.md` MENSA-F-085 bis F-110. Diese Spec liefert dafür nur die Höchstbewertung und deren lokale Spiegelung (RATE-F-100).
- Fotos zu Gerichten — `features/canteen-photos/spec.md`; ein Foto ist ein eigener Beitrag, keine Bewertung, auch wenn beide dieselbe Detailansicht teilen (RATE-F-080, Erläuterung zu RATE-F-085).

## 3. Nutzergeschichten

- Als Studierende möchte ich ein Gericht mit einem einfachen Daumen-Urteil einschätzen, damit andere von meiner Einschätzung profitieren, ohne dass ich über eine feine Punktzahl nachdenken muss.
- Als Studierende möchte ich vor der Essensauswahl sehen, wie andere ein Gericht bewertet haben.
- Als Studierende möchte ich in einer Detailansicht sehen, wie das Gericht speziell heute bewertet wurde, da sich die Zubereitung von Tag zu Tag unterscheiden kann.
- Als Studierende möchte ich einen unangemessenen Kommentar melden können.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| RATE-F-010 | Das System muss der Nutzerin eine Bewertung eines einzelnen Gerichts in einer der drei Stufen schlecht, gut oder sehr gut ermöglichen. | NEU |
| RATE-F-020 | Das System muss der Nutzerin einen optionalen Freitext-Kommentar zu einer Bewertung ermöglichen. | NEU |
| RATE-F-030 | Das System muss zu jedem Gericht die Gesamtbewertung (Durchschnittswert über alle Tage) und die Anzahl abgegebener Bewertungen in der Übersicht anzeigen. | NEU |
| RATE-F-040 | Wenn eine Person für ein Gericht an einem Tag bereits eine Bewertung abgegeben hat, muss das System eine weitere Bewertung derselben Person für dasselbe Gericht am selben Tag ablehnen. | NEU |
| RATE-F-050 | Das System muss Gerichtsbezeichnungen vor der Verknüpfung mit Bewertungen normalisieren, sodass dasselbe Gericht an verschiedenen Tagen demselben Bewertungsziel zugeordnet wird. | NEU |
| RATE-F-060 | Das System muss der Nutzerin das Melden eines Bewertungskommentars ermöglichen. | NEU |
| RATE-F-070 | Das System muss der Nutzerin das Löschen der eigenen Bewertung ermöglichen. | NEU |
| RATE-F-080 | Wenn die Nutzerin ein Gericht antippt, muss das System eine Detailansicht mit der auf den aktuellen Tag beschränkten Durchschnittsbewertung zusätzlich zur Gesamtbewertung (RATE-F-030) anzeigen. | NEU |
| RATE-F-085 | Das System muss die Eingabe einer eigenen Bewertung ausschließlich in der Detailansicht (RATE-F-080) ermöglichen, nicht unmittelbar in der Gerichtsliste des Mensaplans. | NEU |
| RATE-F-090 | Das System muss das Lesen von Bewertungen ohne Konto ermöglichen und ein Konto ausschließlich beim Verfassen, Bearbeiten oder Löschen einer eigenen Bewertung verlangen. | NEU |
| RATE-F-100 | Das System muss die eigenen Bewertungen der angemeldeten Person gerätelokal spiegeln, damit der Lieblingsgericht-Abgleich (`features/canteen/spec.md` MENSA-F-100) ohne Netzzugriff möglich ist. | NEU |

### Erläuterungen

**`RATE-F-010` — Drei Stufen statt einer 1-bis-5-Skala (geändert am 2026-09-04).** Entscheidung FSR FB4: Statt einer feinen Sterneskala nutzt die Bewertung drei grobe Stufen nach dem Vorbild von Streaming-Diensten (Netflix) — ein Daumen nach unten für schlecht, ein Daumen nach oben für gut, zwei Daumen nach oben für sehr gut. Grund: Vor einer Essensentscheidung zählt „lohnt es sich" mehr als eine Feinabstufung, die ohnehin selten konsistent vergeben wird; drei große Antworttasten sind zudem schneller zu bedienen als ein Fünf-Sterne-Regler. Für Berechnungen, die einen Zahlenwert benötigen (Durchschnitt nach RATE-F-030, Einmal-pro-Tag-Sperre nach RATE-F-040), zählen die Stufen unverändert als 1 (schlecht), 2 (gut) und 3 (sehr gut) — dieselbe Logik wie zuvor bei den Sternen, nur mit drei statt fünf Werten. Die Gesamtbewertung in der Übersicht (RATE-F-030) zeigt die gerundete Stufe als Symbol zusammen mit der Anzahl der Bewertungen; eine Verteilung nach Stufen ist nicht gefordert und bleibt offen (Abschnitt 13).

**`RATE-F-085` — Eingabefläche nur in der Detailansicht.** Drei große, eindeutig beschriftete Antworttasten benötigen mehr Platz als das einzeilige Symbol-plus-Anzahl der Übersicht (RATE-F-030) verträgt, ohne die Gerichtsliste des Mensaplans zu überladen. Die Eingabe der eigenen Bewertung ist deshalb ausschließlich der Detailansicht vorbehalten (RATE-F-080) — derselben Ansicht, die beim Antippen eines Fotos geöffnet wird, sobald Fotos umgesetzt sind (`features/canteen-photos/spec.md` FOTO-F-030). Die Übersicht bleibt reine Anzeige ohne Eingabemöglichkeit.

**`RATE-F-040` — Setzt IDENT-F-050 (`platform/identity-and-moderation.md`) technisch um; das Konto grenzt die „Person" ab, siehe dort.

**`RATE-F-090`** — Entscheidung FSR FB4, 2026-08-25 (`decisions/0004-identitaet-und-anmeldung.md`): Vor dieser Entscheidung genügte für jede Bewertung ein reines, gerätegebundenes Pseudonym, auch zum Verfassen. Ersetzt durch eine Kontopflicht ausschließlich für den Schreibpfad — Lesen bleibt uneingeschränkt kontofrei. Löst die bisherige Offene Frage zur Umgehbarkeit der Einmal-pro-Tag-Sperre bei Gerätewechsel (siehe Abschnitt 13): Ein Konto ist nicht gerätegebunden.

**`RATE-F-050`** — Rohtitel der Speiseplan-Quelle (INT-015 `title.de`, vormals INT-004 `meals[].title`) sind nicht garantiert stabil formatiert (siehe `platform/quality-and-testing.md` Abschnitt 5, „Normalisierung der Gerichtsbezeichnungen"). Ohne Normalisierung würden geringfügig unterschiedlich geschriebene, aber identische Gerichte als getrennte Bewertungsziele geführt. Kernregel der Normalisierung: Kleinschreibung, Vereinheitlichung von Mehrfach-Leerzeichen auf ein einzelnes, Entfernen von führendem/nachgestelltem Whitespace, Entfernen führender Tagesnummerierungen (Muster `^\d+\.\s*`). Diese Regel ist der verbindliche Ausgangspunkt für die in `platform/quality-and-testing.md` (QA) geforderten Tests.

**Erweiterung für das INT-015-Titelformat (2026-09-03, Roadmap-Schritt 4).** INT-015-Titel tragen Zusatzstoff-/Allergen-Codes inline in Klammern (`platform/integrations.md` INT-015), die sich je Zubereitungstag unterscheiden können (`"… (20a,28)"` an einem Tag, `"… (20a)"` an einem anderen). Vor der Kernregel werden daher Klammergruppen entfernt, die als solche Code-Aufzählung erkennbar sind — Muster `\(\s*\d[0-9a-z,\s]*\)` (öffnende Klammer, erste Zeichen eine Ziffer, dann nur Ziffern/Kleinbuchstaben/Kommata/Leerzeichen). Klammern mit anderem Inhalt (z. B. `(scharf)`) bleiben unberührt. Die ` | `-Komponententrenner mehrteiliger Gerichte bleiben erhalten und werden von der Kernregel deterministisch behandelt. Weitere beobachtete Schreibvarianten dürfen bei Bedarf ergänzt werden, ohne dass die Kernregel entfällt.

**`RATE-F-100` — die Höchstbewertung trägt seit dem 2026-09-04 eine zweite Bedeutung.** Entscheidung FSR FB4, 2026-09-04: Die beste Bewertungsstufe (sehr gut) nach RATE-F-010 gilt zugleich als Lieblingsgericht-Markierung; der zuvor eigenständige Merker im Mensaplan entfällt (`features/canteen/spec.md` MENSA-F-080 entfallen, ersetzt durch MENSA-F-085/F-087). Für diese Spec folgt daraus genau eine zusätzliche Anforderung: Die eigenen Bewertungen müssen gerätelokal vorliegen, weil der Abgleich gegen den Tagesplan in einer Hintergrundaufgabe ohne verlässlichen Netzzugriff läuft (`features/canteen/spec.md` Erläuterung zu MENSA-F-100). Gespiegelt wird ausschließlich die **eigene** Bewertung (Gerichtsschlüssel und Bewertungsstufe), nicht die fremder Personen; die Spiegelung wird bei jeder eigenen Bewertung und bei jedem erfolgreichen Abruf fortgeschrieben und bei Abmeldung gelöscht (`platform/data-and-storage.md` Abschnitt 2). Beim Bewerten ist die Nutzerin darauf hinzuweisen, dass die beste Bewertungsstufe eine Benachrichtigung nach sich zieht — sonst überrascht die Folge; abschalten lässt sie sich über SET-F-170.

**`RATE-F-080`** — Entscheidung FSR FB4, 2026-08-25 (siehe `product/whatsapp-feedback-inventory.md` Abschnitt 8, dort als offene Frage geführt und nun direkt vom FSR beantwortet statt über eine gesonderte Nutzerumfrage): Dieselbe normalisierte Gerichtsbezeichnung (RATE-F-050) kann an verschiedenen Tagen unterschiedlich zubereitet und entsprechend unterschiedlich bewertet werden. Die tagesaktuelle Durchschnittsbewertung ergibt sich durch Filterung der vorhandenen Bewertungen (Zeitstempel, siehe Datenmodell) auf den aktuellen Tag — kein zusätzliches Datenfeld nötig.

## 5. Datenmodell

Bewertung: Konto-Referenz (siehe `platform/identity-and-moderation.md`), öffentlich angezeigtes Pseudonym (Anzeigename, vom Konto entkoppelbar), Gericht-Referenz (normalisierter Titel), Bewertungsstufe (schlecht = 1, gut = 2, sehr gut = 3), Kommentar (optional), Zeitstempel, Moderationsstatus (sichtbar/gemeldet/entfernt). Der Zeitstempel dient sowohl der Einmal-pro-Tag-Sperre (RATE-F-040) als auch der Berechnung der tagesaktuellen Durchschnittsbewertung (RATE-F-080, Filterung auf den aktuellen Tag) — kein separates Feld für die Standortzuordnung, siehe Abschnitt 2 Nicht-Scope. Rollen- und Moderationsmodell: `platform/identity-and-moderation.md`. Verarbeitungsverzeichnis-Eintrag: `platform/security-and-privacy.md` Abschnitt 3.

Eigene Bewertungen, gerätelokale Spiegelung (RATE-F-100): je Eintrag Gericht-Referenz (normalisierter Titel) und Bewertungsstufe, mehr nicht — kein Kommentar, kein Pseudonym, kein Zeitstempel fremder Bewertungen. Sie ist ein Zwischenspeicher der eigenen serverseitigen Bewertungen, keine zweite führende Quelle: Bei Abweichung gilt der Serverstand.

## 6. Externe Schnittstellen

Schreibpfad ausschließlich über das eigene Backend INT-008 (siehe `platform/architecture.md` ARCH-F-030). Konto-Anmeldung nutzt INT-012 (Authentik), siehe `platform/integrations.md` und `../../decisions/0010-authentik-als-identitaetsanbieter.md`. Keine weiteren externen Schnittstellen.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen bestehender Bewertungen |
| Leer | Hinweis „noch keine Bewertungen — sei die/der Erste" |
| Fehler | Fehlermeldung mit Wiederholen-Option beim Laden; beim Absenden: Hinweis, dass die Bewertung in der Warteschlange verbleibt (siehe Abschnitt 8) |
| Offline | Absenden landet in der lokalen Offline-Warteschlange, siehe Abschnitt 8 |
| Übersicht (Mensaplan) | Gesamtbewertung als ein Symbol entsprechend der gerundeten Bewertungsstufe, zusammen mit der Anzahl abgegebener Bewertungen; keine Eingabemöglichkeit (RATE-F-085) |
| Detailansicht geöffnet | Drei Antworttasten (schlecht, gut, sehr gut) zur eigenen Bewertung, zusätzlich Gesamt- und Tagesbewertung; dieselbe Ansicht wie beim Antippen eines Fotos (RATE-F-085, `features/canteen-photos/spec.md` FOTO-F-030) |
| Beste Bewertungsstufe (sehr gut) gewählt | Hinweis, dass das Gericht damit als Lieblingsgericht gilt und eine Benachrichtigung auslösen kann (`features/canteen/spec.md` MENSA-F-085), mit Verweis auf den Schalter SET-F-170 |

## 8. Offline-Verhalten

Wenn eine Bewertung ohne Netzwerkverbindung abgesendet wird, reiht die App sie gemäß `platform/architecture.md` (ARCH-F-120) und `platform/data-and-storage.md` (DATA-F-100) in die lokale Offline-Warteschlange ein und überträgt sie bei wiederhergestellter Verbindung automatisch. Idempotenz bei erneuter Übertragung sichert `platform/backend-and-api.md` (API-F-140).

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Doppelte Bewertung desselben Gerichts am selben Tag | Ablehnung mit Hinweis auf die bereits bestehende eigene Bewertung, Angebot zum Bearbeiten statt Neuanlage |
| Gemeldeter Kommentar | Verbleibt sichtbar bis zur Moderationsprüfung (siehe `platform/identity-and-moderation.md` IDENT-F-090) |
| Massenhafte Bewertungen von derselben Quelle in kurzer Zeit | Zur Prüfung markiert, siehe `platform/identity-and-moderation.md` IDENT-F-060 |
| Kein Beleg einer Bewertung für den aktuellen Tag beim Öffnen der Detailansicht | Tagesaktuelle Bewertung als „noch keine Bewertung heute" kennzeichnen statt einer irreführenden Bewertungsstufe |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| RATE-N-010 | Das System muss die Normalisierung von Gerichtsbezeichnungen (RATE-F-050) automatisiert testen. | NEU |

## 11. Akzeptanzkriterien

- Eine zweite Bewertung derselben Person für dasselbe Gericht am selben Tag wird abgelehnt.
- Ein gemeldeter Kommentar bleibt bis zur Moderationsentscheidung sichtbar.
- Eine offline abgesendete Bewertung wird nach Wiederherstellung der Verbindung genau einmal gezählt.
- Nach einer Bewertung mit der besten Stufe (sehr gut) liegt das Gericht in der gerätelokalen Spiegelung vor und bleibt es nach einem Neustart der App ohne Netzzugriff (RATE-F-100).
- Die Gerichtsliste des Mensaplans zeigt zu jedem Gericht ausschließlich das Symbol der Gesamtbewertung und die Anzahl, aber keine Eingabemöglichkeit; die drei Antworttasten erscheinen ausschließlich in der Detailansicht (RATE-F-085).
- Die Detailansicht eines Gerichts zeigt korrekt sowohl die Gesamtbewertung als auch die tagesaktuelle Bewertung; existieren für den aktuellen Tag noch keine Bewertungen, zeigt die Detailansicht dies erkennbar an statt einer irreführenden Null-Bewertung.

## 12. Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der beiden Alt-Apps bietet Bewertungen. Bestätigt für die Android-Alt-App am 2026-08-25 nach Vorliegen ihres Quellcodes.

## 13. Offene Fragen

- Speicherdauer/Löschverhalten von Bewertungen nach Kontolöschung — bereits in `platform/identity-and-moderation.md` (IDENT-F-120/130) geregelt, hier nur referenziert.
- ~~Ob Hochschul-SSO als Konto-Anmeldeweg verfügbar ist.~~ Beantwortet am 2026-08-25: Der Anmeldeweg läuft über eine eigenbetriebene Authentik-Instanz, die Anbindung an die Hochschule ist eine Konfigurationsfrage dort und blockiert die Umsetzung nicht — siehe `../../decisions/0010-authentik-als-identitaetsanbieter.md`.
- Freitext-Kommentare (RATE-F-020) und Meldeweg (RATE-F-060) sind der zweiten Ausbaustufe zugeordnet, gemeinsam mit der Moderationsoberfläche — ohne sie wären die Moderationspflichten aus `platform/identity-and-moderation.md` (IDENT-F-090 bis F-110, IDENT-N-010) nicht erfüllbar. Siehe `../../decisions/0012-zuschnitt-der-ersten-ausbaustufe.md` und `../../product/roadmap.md`.
- Standortbezogene Bewertung (dasselbe Gericht unterschiedlich je Mensa-Standort bewertet): vom FSR FB4 am 2026-08-25 als mögliche künftige Erweiterung benannt, aber ausdrücklich nicht in diesem Umfang zu implementieren. Bei künftiger Aufnahme: eigene ID-Vergabe und Datenmodell-Erweiterung (Mensa-Referenz je Bewertung) nötig, kein Nachtrag zu RATE-F-080.
