---
nummer: 0004
titel: Identität und Anmeldung für Community-Funktionen
status: vorgeschlagen
datum: 2026-08-24
betrifft:
  - ../platform/identity-and-moderation.md
  - ../features/canteen-ratings/spec.md
  - ../features/event-volunteers/spec.md
---

# ADR 0004: Identität und Anmeldung für Community-Funktionen

## Kontext

Der Fachbereich wünscht ausdrücklich eine einfache Möglichkeit für Studierende, sich als Helfer einzutragen — jede Anmeldehürde arbeitet dagegen. Gleichzeitig sind Mensa-Bewertungen ohne jede Identität nicht gegen Mehrfach- und Spam-Abgabe zu schützen, und eine Helferliste ohne verlässliche Zuordnung ist für den FSR wertlos. Details und Optionsbewertung: `../platform/identity-and-moderation.md`, Abschnitt 2.

## Entscheidung

Noch nicht getroffen (Status: vorgeschlagen). Empfohlen wird Option (d): abgestufte Identität — Mensa-Bewertungen bleiben pseudonym, Helfer-Anmeldungen verlangen Name und genau einen Kontaktweg. Begründung: Bewertungen sind massenhaft und niedrigschwellig, eine Anmeldehürde würde die Beteiligung unnötig senken; Helfer-Anmeldungen sind selten und brauchen für die Koordination durch den FSR ohnehin einen Kontaktweg, sodass die dort nötige Hürde keinen zusätzlichen Aufwand verursacht. Die endgültige Freigabe erfolgt erst mit dieser Entscheidung im Status „angenommen".

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| (a) Hochschul-SSO | hoch | höchste Verlässlichkeit der Identität | höchste Hürde für Studierende; Abhängigkeit von der Hochschul-IT; Verfügbarkeit für Drittanwendungen ungeklärt |
| (b) verifizierte Hochschul-Mailadresse | mittel | belegt Zugehörigkeit zur Hochschule, mittlere Verlässlichkeit | Verifizierungsverfahren nötig; E-Mail-Adresse als zusätzliches personenbezogenes Datum |
| (c) gerätegebundenes Pseudonym ohne Anmeldung | niedrig | niedrigste Hürde, schnellste Beteiligung | schwächster Schutz vor Mehrfachabgabe; Pseudonym geht bei Geräteswechsel verloren |
| (d) abgestuft: Bewertung pseudonym, Helfer-Anmeldung mit Kontaktweg | mittel | Hürde proportional zur Funktion; löst den Zielkonflikt statt ihn zu vereinheitlichen | zwei parallele Identitätsmechanismen zu pflegen |

## Konsequenzen

Mit Option (d) bleibt die Helfer-Anmeldung niedrigschwellig, während Bewertungen einen Basisschutz gegen Mehrfachabgabe erhalten (siehe `../platform/identity-and-moderation.md`, IDENT-F-050). Die App muss zwei unterschiedliche Identitätsmechanismen implementieren und pflegen statt eines einzigen einheitlichen. Eine spätere Migration auf Hochschul-SSO bliebe möglich, falls dieses für Drittanwendungen verfügbar wird.

## Offene Punkte

- Verfügbarkeit eines Hochschul-SSO für Drittanwendungen
- Zustimmung des Datenschutzbeauftragten
- Aufwand der Umsetzung
