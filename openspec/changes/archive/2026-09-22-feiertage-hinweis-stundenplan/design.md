## Context

Siehe `proposal.md` — Why. Der Hinweis läuft rein clientseitig in der App (Capability `schedule`), ohne Backend- oder Vertragsänderung.

## Goals / Non-Goals

**Goals:**
- Gesetzliche NRW-Feiertage ohne Pflegeaufwand und ohne Fremdsystem erkennen.
- Der Hinweis funktioniert unabhängig vom Raumplan-Abgleich (kein INT-009-Abrufstand nötig).

**Non-Goals:**
- Vorlesungsfreie Einzeltage, Brückentage, Semesterferien — nicht berechenbar, bleiben offen (siehe `schedule/spec.md`, „Offene Fragen").
- Feiertage anderer Bundesländer — die Zielgruppe (FB4, FH Dortmund) ist NRW-spezifisch.

## Decisions

**Berechnung statt Liste oder API.** Gesetzliche Feiertage in Deutschland sind für ein gegebenes Bundesland und Jahr vollständig deterministisch: Nach § 2 Feiertagsgesetz NRW sind es elf Tage: sechs fest im Kalender (Neujahr, Tag der Arbeit, Tag der Deutschen Einheit, Allerheiligen, 1./2. Weihnachtstag), fünf über die Gaußsche Osterformel aus dem Ostersonntag abgeleitet (Karfreitag −2, Ostermontag +1, Christi Himmelfahrt +39, Pfingstmontag +50, Fronleichnam +60 Tage). Der Reformationstag ist in NRW kein gesetzlicher Feiertag (anders als in den norddeutschen Ländern) und gehört nicht dazu. Eine Berechnung braucht keine jährliche Pflege und keinen Netzzugriff — im Gegensatz zu einer vom FSR gepflegten Liste (verworfen, siehe proposal.md) oder einer externen Feiertags-API (verworfen: neue Fremdsystem-Abhängigkeit für deterministisch berechenbare Daten, bräuchte einen eigenen Eintrag in `integrations/spec.md` samt Verfügbarkeits-/SLA-Einschätzung ohne Gegenwert).

**Unabhängig vom Raumplan-Abgleich.** Der Hinweis prüft nur das Datum des Stundenplan-Termins gegen die berechnete Feiertagsliste des betroffenen Jahres — keine Abhängigkeit von INT-009, dessen Abrufstand oder einer Zuordnung über `courseId`. Das hält ihn robust gegenüber allem, was der INT-009-Spike als Grenze des Raumplan-Abgleichs festgestellt hat (veralteter Stand, fehlende Zuordnung, Pseudoraum).

**Kein eigenes Requirement für Feiertage in anderen Bundesländern.** Die App ist FB4-spezifisch (FH Dortmund, NRW); eine Bundesland-Auswahl wäre Aufwand ohne erkennbaren Bedarf.

## Risks / Trade-offs

[Berechnungsfehler bei einer der elf Feiertagsregeln] → Osterformel ist ein Standardalgorithmus (Gauß'sche Osterformel), feste Daten sind trivial zu verifizieren; Testfälle gegen mehrere bekannte Jahre (inkl. der im INT-009-Spike belegten Pfingstmontag/Fronleichnam-Termine 2026) decken das ab.

[Gesetzesänderung führt neuen oder entfernt bestehenden NRW-Feiertag] → selten (letzte Änderung: Reformationstag 2018) und würde ohnehin einen App-Update erfordern, unabhängig von der gewählten Quelle — kein Nachteil gegenüber einer gepflegten Liste, die im selben Fall ebenso nachgezogen werden müsste.
