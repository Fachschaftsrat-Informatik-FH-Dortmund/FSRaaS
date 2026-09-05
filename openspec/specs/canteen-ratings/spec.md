## Purpose

Ermöglicht Studierenden, Gerichte des Mensaplans zu bewerten, und anderen Studierenden, sich vor der Essensauswahl an diesen Bewertungen zu orientieren — vollständige Neuentwicklung ohne Vorbild in einer der Alt-Apps, der erste Schreibpfad und die erste nutzergenerierte Inhaltsart der neuen App. Vormals `specs/features/canteen-ratings/spec.md` (Präfix `RATE`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Bewertung eines Gerichts in drei Stufen

Das System muss der Nutzerin eine Bewertung eines einzelnen Gerichts in einer der drei Stufen schlecht, gut oder sehr gut ermöglichen. Herkunft: NEU (vormals RATE-F-010). Entscheidung FSR FB4 (geändert am 2026-09-04): Statt einer feinen Sterneskala nutzt die Bewertung drei grobe Stufen nach dem Vorbild von Streaming-Diensten (Netflix) — ein Daumen nach unten für schlecht, ein Daumen nach oben für gut, zwei Daumen nach oben für sehr gut. Für Berechnungen, die einen Zahlenwert benötigen, zählen die Stufen als 1 (schlecht), 2 (gut) und 3 (sehr gut). Die Gesamtbewertung in der Übersicht zeigt die gerundete Stufe als Symbol zusammen mit der Anzahl der Bewertungen; eine Verteilung nach Stufen ist nicht gefordert.

#### Scenario: Bewertung mit höchster Stufe
- **WHEN** eine Nutzerin ein Gericht mit „sehr gut" bewertet
- **THEN** speichert das System die Bewertung mit dem Zahlenwert 3

### Requirement: Optionaler Freitext-Kommentar zur Bewertung

Das System muss der Nutzerin einen optionalen Freitext-Kommentar zu einer Bewertung ermöglichen. Herkunft: NEU (vormals RATE-F-020).

#### Scenario: Bewertung ohne Kommentar
- **WHEN** eine Nutzerin eine Bewertung ohne Freitext abgibt
- **THEN** speichert das System die Bewertung ohne Kommentar

### Requirement: Anzeige von Gesamtbewertung und Bewertungsanzahl in der Übersicht

Das System muss zu jedem Gericht die Gesamtbewertung (Durchschnittswert über alle Tage) und die Anzahl abgegebener Bewertungen in der Übersicht anzeigen. Herkunft: NEU (vormals RATE-F-030).

#### Scenario: Gericht mit bestehenden Bewertungen
- **WHEN** ein Gericht in der Übersicht dargestellt wird und bereits Bewertungen vorliegen
- **THEN** zeigt das System die Gesamtbewertung als gerundetes Symbol zusammen mit der Anzahl der Bewertungen

### Requirement: Sperre einer zweiten Bewertung am selben Tag

Wenn eine Person für ein Gericht an einem Tag bereits eine Bewertung abgegeben hat, muss das System eine weitere Bewertung derselben Person für dasselbe Gericht am selben Tag ablehnen. Herkunft: NEU (vormals RATE-F-040). Setzt die Capability `identity-and-moderation` (IDENT-F-050) technisch um; das Konto grenzt die „Person" ab.

#### Scenario: Zweite Bewertung am selben Tag
- **WHEN** eine Person für dasselbe Gericht am selben Tag bereits eine Bewertung abgegeben hat und erneut bewerten will
- **THEN** lehnt das System die zweite Bewertung ab und bietet das Bearbeiten der bestehenden Bewertung an

### Requirement: Normalisierung von Gerichtsbezeichnungen vor der Verknüpfung

Das System muss Gerichtsbezeichnungen vor der Verknüpfung mit Bewertungen normalisieren, sodass dasselbe Gericht an verschiedenen Tagen demselben Bewertungsziel zugeordnet wird. Herkunft: NEU (vormals RATE-F-050). Rohtitel der Speiseplan-Quelle (Capability `integrations`, INT-015 `title.de`, vormals INT-004 `meals[].title`) sind nicht garantiert stabil formatiert. Kernregel der Normalisierung: Kleinschreibung, Vereinheitlichung von Mehrfach-Leerzeichen auf ein einzelnes, Entfernen von führendem/nachgestelltem Whitespace, Entfernen führender Tagesnummerierungen (Muster `^\d+\.\s*`). Erweiterung für das INT-015-Titelformat (2026-09-03, Roadmap-Schritt 4): INT-015-Titel tragen Zusatzstoff-/Allergen-Codes inline in Klammern, die sich je Zubereitungstag unterscheiden können (`"… (20a,28)"` an einem Tag, `"… (20a)"` an einem anderen). Vor der Kernregel werden daher Klammergruppen entfernt, die als solche Code-Aufzählung erkennbar sind — Muster `\(\s*\d[0-9a-z,\s]*\)` (öffnende Klammer, erste Zeichen eine Ziffer, dann nur Ziffern/Kleinbuchstaben/Kommata/Leerzeichen). Klammern mit anderem Inhalt (z. B. `(scharf)`) bleiben unberührt. Die ` | `-Komponententrenner mehrteiliger Gerichte bleiben erhalten und werden von der Kernregel deterministisch behandelt.

#### Scenario: Gleiches Gericht mit unterschiedlichen Zusatzstoff-Codes
- **WHEN** derselbe Rohtitel an zwei Tagen mit unterschiedlichen Zusatzstoff-Codes in Klammern geliefert wird (z. B. `"… (20a,28)"` und `"… (20a)"`)
- **THEN** normalisiert das System beide Titel auf dasselbe Bewertungsziel

### Requirement: Melden eines Bewertungskommentars

Das System muss der Nutzerin das Melden eines Bewertungskommentars ermöglichen. Herkunft: NEU (vormals RATE-F-060).

#### Scenario: Unangemessener Kommentar
- **WHEN** eine Nutzerin einen Kommentar als unangemessen einstuft
- **THEN** kann sie ihn melden

### Requirement: Löschen der eigenen Bewertung

Das System muss der Nutzerin das Löschen der eigenen Bewertung ermöglichen. Herkunft: NEU (vormals RATE-F-070).

#### Scenario: Eigene Bewertung löschen
- **WHEN** eine Nutzerin ihre eigene, bereits abgegebene Bewertung löschen will
- **THEN** entfernt das System die Bewertung

### Requirement: Detailansicht mit tagesaktueller Durchschnittsbewertung

Wenn die Nutzerin ein Gericht antippt, muss das System eine Detailansicht mit der auf den aktuellen Tag beschränkten Durchschnittsbewertung zusätzlich zur Gesamtbewertung anzeigen. Herkunft: NEU (vormals RATE-F-080). Dieselbe normalisierte Gerichtsbezeichnung kann an verschiedenen Tagen unterschiedlich zubereitet und entsprechend unterschiedlich bewertet werden. Die tagesaktuelle Durchschnittsbewertung ergibt sich durch Filterung der vorhandenen Bewertungen auf den aktuellen Tag — kein zusätzliches Datenfeld nötig.

#### Scenario: Gericht mit abweichender Tagesbewertung
- **WHEN** ein Gericht heute anders bewertet wurde als im Gesamtdurchschnitt über alle Tage
- **THEN** zeigt die Detailansicht beide Werte getrennt

### Requirement: Eingabe der eigenen Bewertung ausschließlich in der Detailansicht

Das System muss die Eingabe einer eigenen Bewertung ausschließlich in der Detailansicht ermöglichen, nicht unmittelbar in der Gerichtsliste des Mensaplans. Herkunft: NEU (vormals RATE-F-085). Drei große, eindeutig beschriftete Antworttasten benötigen mehr Platz als das einzeilige Symbol-plus-Anzahl der Übersicht verträgt, ohne die Gerichtsliste zu überladen. Die Detailansicht ist dieselbe, die beim Antippen eines Fotos geöffnet wird, sobald Fotos umgesetzt sind (Capability `canteen-photos`, FOTO-F-030). Die Übersicht bleibt reine Anzeige ohne Eingabemöglichkeit.

#### Scenario: Bewertungsversuch in der Übersicht
- **WHEN** die Gerichtsliste des Mensaplans dargestellt wird
- **THEN** bietet sie keine Eingabemöglichkeit für eine eigene Bewertung; die drei Antworttasten erscheinen ausschließlich in der Detailansicht

### Requirement: Kontofreies Lesen, Konto nur beim Schreibpfad

Das System muss das Lesen von Bewertungen ohne Konto ermöglichen und ein Konto ausschließlich beim Verfassen, Bearbeiten oder Löschen einer eigenen Bewertung verlangen. Herkunft: NEU (vormals RATE-F-090). Entscheidung FSR FB4, 2026-08-25 (`specs/decisions/0004-identitaet-und-anmeldung.md`): Vor dieser Entscheidung genügte für jede Bewertung ein reines, gerätegebundenes Pseudonym, auch zum Verfassen. Ersetzt durch eine Kontopflicht ausschließlich für den Schreibpfad — Lesen bleibt uneingeschränkt kontofrei. Ein Konto ist nicht gerätegebunden, damit ist die Einmal-pro-Tag-Sperre nicht durch Gerätewechsel umgehbar.

#### Scenario: Bewertungen ohne Anmeldung lesen
- **WHEN** eine nicht angemeldete Nutzerin die Bewertungen eines Gerichts ansieht
- **THEN** zeigt das System sie ihr, ohne eine Anmeldung zu verlangen

#### Scenario: Verfassen erfordert Anmeldung
- **WHEN** eine nicht angemeldete Nutzerin eine eigene Bewertung abgeben will
- **THEN** fordert das System eine Anmeldung an, bevor die Bewertung gespeichert wird

### Requirement: Gerätelokale Spiegelung der eigenen Bewertungen

Das System muss die eigenen Bewertungen der angemeldeten Person gerätelokal spiegeln, damit der Lieblingsgericht-Abgleich (Capability `canteen`, MENSA-F-100) ohne Netzzugriff möglich ist. Herkunft: NEU (vormals RATE-F-100). Entscheidung FSR FB4, 2026-09-04: Die beste Bewertungsstufe (sehr gut) gilt zugleich als Lieblingsgericht-Markierung; der zuvor eigenständige Merker im Mensaplan entfällt (Capability `canteen`, MENSA-F-080 entfallen, ersetzt durch MENSA-F-085/F-087). Gespiegelt wird ausschließlich die eigene Bewertung (Gerichtsschlüssel und Bewertungsstufe), nicht die fremder Personen; die Spiegelung wird bei jeder eigenen Bewertung und bei jedem erfolgreichen Abruf fortgeschrieben und bei Abmeldung gelöscht (Capability `data-and-storage`, Abschnitt 2). Beim Bewerten ist die Nutzerin darauf hinzuweisen, dass die beste Bewertungsstufe eine Benachrichtigung nach sich zieht; abschalten lässt sie sich über SET-F-170 (Capability `settings`).

#### Scenario: Lieblingsgericht ohne Netzzugriff abgleichen
- **WHEN** eine Hintergrundaufgabe den Tagesplan ohne verlässlichen Netzzugriff gegen die eigenen Bewertungen abgleicht
- **THEN** greift sie auf die gerätelokale Spiegelung zurück und findet Gerichte mit der Bewertungsstufe „sehr gut"

#### Scenario: Abmeldung löscht die Spiegelung
- **WHEN** sich eine Nutzerin abmeldet
- **THEN** löscht das System die gerätelokale Spiegelung ihrer eigenen Bewertungen

### Requirement: Automatisierter Test der Gerichtsnormalisierung

Das System muss die Normalisierung von Gerichtsbezeichnungen automatisiert testen. Herkunft: NEU (vormals RATE-N-010).

#### Scenario: Test gegen die Normalisierungsregel
- **WHEN** die Normalisierungsfunktion mit den in der Capability `quality-and-testing` geführten Beispieltiteln aufgerufen wird
- **THEN** liefert sie für alle Beispiele das erwartete, gemeinsame Bewertungsziel

## Scope / Nicht-Scope

### Scope

- Bewertung eines Gerichts in einer von drei Stufen (schlecht, gut, sehr gut, nach dem Vorbild von Streaming-Diensten wie Netflix), optionaler Freitext-Kommentar — Verfassen erfordert ein Konto (siehe Capability `identity-and-moderation`, Abschnitt 2, `specs/decisions/0004-identitaet-und-anmeldung.md`).
- Lesen von Bewertungen und der Gesamtbewertung ohne Konto, für jede Nutzerin.
- Anzeige der Gesamtbewertung (Durchschnitt über alle Tage) und der Anzahl abgegebener Bewertungen je Gericht in der Übersicht (Mensaplan).
- Detailansicht je Gericht mit zusätzlicher, auf den aktuellen Tag beschränkter Durchschnittsbewertung, da sich dieselbe Gerichtsbezeichnung je nach Zubereitungstag unterscheiden kann.
- Melden und Moderation missbräuchlicher Kommentare.
- Gerätelokale Spiegelung der eigenen Bewertungen, damit der Lieblingsgericht-Abgleich des Mensaplans ohne Netzzugriff arbeiten kann.
- Einstiegspunkt ausschließlich innerhalb des Mensaplans je Gericht, kein eigener Navigationspunkt in der App-weiten Navigationsstruktur (siehe Capability `architecture`, ARCH-F-090).

### Nicht-Scope

- Bewertung der Mensa als Ganzes (Ambiente, Service) — Scope ist ausschließlich das einzelne Gericht.
- Separate Bewertung je Mensa-Standort für dasselbe Gericht — als Idee erkannt (Entscheidung FSR FB4, 2026-08-25), aber bewusst nicht in diesem Umfang; siehe Abschnitt „Offene Fragen".
- Konto-Erstellung/-Verwaltung selbst (Anmeldeweg, SSO-Anbindung) — Capability `identity-and-moderation`, Capability `integrations` (INT-012).
- Die Lieblingsgericht-Funktion und ihre Benachrichtigung selbst — Capability `canteen`, MENSA-F-085 bis F-110. Diese Capability liefert dafür nur die Höchstbewertung und deren lokale Spiegelung (RATE-F-100).
- Fotos zu Gerichten — Capability `canteen-photos`; ein Foto ist ein eigener Beitrag, keine Bewertung, auch wenn beide dieselbe Detailansicht teilen (RATE-F-080).

## Nutzergeschichten

- Als Studierende möchte ich ein Gericht mit einem einfachen Daumen-Urteil einschätzen, damit andere von meiner Einschätzung profitieren, ohne dass ich über eine feine Punktzahl nachdenken muss.
- Als Studierende möchte ich vor der Essensauswahl sehen, wie andere ein Gericht bewertet haben.
- Als Studierende möchte ich in einer Detailansicht sehen, wie das Gericht speziell heute bewertet wurde, da sich die Zubereitung von Tag zu Tag unterscheiden kann.
- Als Studierende möchte ich einen unangemessenen Kommentar melden können.

## Datenmodell

Bewertung: Konto-Referenz (siehe Capability `identity-and-moderation`), öffentlich angezeigtes Pseudonym (Anzeigename, vom Konto entkoppelbar), Gericht-Referenz (normalisierter Titel), Bewertungsstufe (schlecht = 1, gut = 2, sehr gut = 3), Kommentar (optional), Zeitstempel, Moderationsstatus (sichtbar/gemeldet/entfernt). Der Zeitstempel dient sowohl der Einmal-pro-Tag-Sperre als auch der Berechnung der tagesaktuellen Durchschnittsbewertung (Filterung auf den aktuellen Tag) — kein separates Feld für die Standortzuordnung, siehe Abschnitt „Nicht-Scope". Rollen- und Moderationsmodell: Capability `identity-and-moderation`. Verarbeitungsverzeichnis-Eintrag: Capability `security-and-privacy`, Abschnitt 3.

Eigene Bewertungen, gerätelokale Spiegelung: je Eintrag Gericht-Referenz (normalisierter Titel) und Bewertungsstufe, mehr nicht — kein Kommentar, kein Pseudonym, kein Zeitstempel fremder Bewertungen. Sie ist ein Zwischenspeicher der eigenen serverseitigen Bewertungen, keine zweite führende Quelle: Bei Abweichung gilt der Serverstand.

## Externe Schnittstellen

Schreibpfad ausschließlich über das eigene Backend INT-008 (siehe Capability `architecture`, ARCH-F-030). Konto-Anmeldung nutzt INT-012 (Authentik), siehe Capability `integrations` und `specs/decisions/0010-authentik-als-identitaetsanbieter.md`. Keine weiteren externen Schnittstellen.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen bestehender Bewertungen |
| Leer | Hinweis „noch keine Bewertungen — sei die/der Erste" |
| Fehler | Fehlermeldung mit Wiederholen-Option beim Laden; beim Absenden: Hinweis, dass die Bewertung in der Warteschlange verbleibt (siehe Abschnitt „Offline-Verhalten") |
| Offline | Absenden landet in der lokalen Offline-Warteschlange, siehe Abschnitt „Offline-Verhalten" |
| Übersicht (Mensaplan) | Gesamtbewertung als ein Symbol entsprechend der gerundeten Bewertungsstufe, zusammen mit der Anzahl abgegebener Bewertungen; keine Eingabemöglichkeit |
| Detailansicht geöffnet | Drei Antworttasten (schlecht, gut, sehr gut) zur eigenen Bewertung, zusätzlich Gesamt- und Tagesbewertung; dieselbe Ansicht wie beim Antippen eines Fotos (Capability `canteen-photos`, FOTO-F-030) |
| Beste Bewertungsstufe (sehr gut) gewählt | Hinweis, dass das Gericht damit als Lieblingsgericht gilt und eine Benachrichtigung auslösen kann (Capability `canteen`, MENSA-F-085), mit Verweis auf den Schalter SET-F-170 |

## Offline-Verhalten

Wenn eine Bewertung ohne Netzwerkverbindung abgesendet wird, reiht die App sie gemäß Capability `architecture` (ARCH-F-120) und Capability `data-and-storage` (DATA-F-100) in die lokale Offline-Warteschlange ein und überträgt sie bei wiederhergestellter Verbindung automatisch. Idempotenz bei erneuter Übertragung sichert Capability `backend-and-api` (API-F-140).

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Doppelte Bewertung desselben Gerichts am selben Tag | Ablehnung mit Hinweis auf die bereits bestehende eigene Bewertung, Angebot zum Bearbeiten statt Neuanlage |
| Gemeldeter Kommentar | Verbleibt sichtbar bis zur Moderationsprüfung (siehe Capability `identity-and-moderation`, IDENT-F-090) |
| Massenhafte Bewertungen von derselben Quelle in kurzer Zeit | Zur Prüfung markiert, siehe Capability `identity-and-moderation`, IDENT-F-060 |
| Kein Beleg einer Bewertung für den aktuellen Tag beim Öffnen der Detailansicht | Tagesaktuelle Bewertung als „noch keine Bewertung heute" kennzeichnen statt einer irreführenden Bewertungsstufe |

## Akzeptanzkriterien

- Eine zweite Bewertung derselben Person für dasselbe Gericht am selben Tag wird abgelehnt.
- Ein gemeldeter Kommentar bleibt bis zur Moderationsentscheidung sichtbar.
- Eine offline abgesendete Bewertung wird nach Wiederherstellung der Verbindung genau einmal gezählt.
- Nach einer Bewertung mit der besten Stufe (sehr gut) liegt das Gericht in der gerätelokalen Spiegelung vor und bleibt es nach einem Neustart der App ohne Netzzugriff.
- Die Gerichtsliste des Mensaplans zeigt zu jedem Gericht ausschließlich das Symbol der Gesamtbewertung und die Anzahl, aber keine Eingabemöglichkeit; die drei Antworttasten erscheinen ausschließlich in der Detailansicht.
- Die Detailansicht eines Gerichts zeigt korrekt sowohl die Gesamtbewertung als auch die tagesaktuelle Bewertung; existieren für den aktuellen Tag noch keine Bewertungen, zeigt die Detailansicht dies erkennbar an statt einer irreführenden Null-Bewertung.

## Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der beiden Alt-Apps bietet Bewertungen. Bestätigt für die Android-Alt-App am 2026-08-25 nach Vorliegen ihres Quellcodes.

## Offene Fragen

- Speicherdauer/Löschverhalten von Bewertungen nach Kontolöschung — bereits in Capability `identity-and-moderation` (IDENT-F-120/130) geregelt, hier nur referenziert.
- Freitext-Kommentare und Meldeweg sind der zweiten Ausbaustufe zugeordnet, gemeinsam mit der Moderationsoberfläche — ohne sie wären die Moderationspflichten aus Capability `identity-and-moderation` (IDENT-F-090 bis F-110, IDENT-N-010) nicht erfüllbar. Siehe `specs/decisions/0012-zuschnitt-der-ersten-ausbaustufe.md` und `specs/product/roadmap.md`.
- Standortbezogene Bewertung (dasselbe Gericht unterschiedlich je Mensa-Standort bewertet): vom FSR FB4 am 2026-08-25 als mögliche künftige Erweiterung benannt, aber ausdrücklich nicht in diesem Umfang zu implementieren. Bei künftiger Aufnahme: eigenes Requirement und Datenmodell-Erweiterung (Mensa-Referenz je Bewertung) nötig, kein Nachtrag zur Detailansicht.
