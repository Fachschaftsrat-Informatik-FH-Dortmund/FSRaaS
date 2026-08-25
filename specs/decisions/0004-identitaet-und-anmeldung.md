---
nummer: 0004
titel: Identität und Anmeldung
status: angenommen
datum: 2026-08-25
betrifft:
  - ../platform/identity-and-moderation.md
  - ../platform/integrations.md
  - ../features/canteen-ratings/spec.md
  - ../features/event-volunteers/spec.md
  - ../features/e-key/spec.md
---

# ADR 0004: Identität und Anmeldung

## Kontext

`platform/identity-and-moderation.md` beschreibt einen Zielkonflikt: Der Fachbereich wünscht eine niedrigschwellige Möglichkeit für Studierende, sich als Helfer einzutragen und Mensa-Gerichte zu bewerten, während Bewertungen ohne jede Identität nicht gegen Mehrfach- und Spam-Abgabe zu schützen sind. Mit der Einführung von E-Key (`features/e-key/spec.md`) kam eine dritte, andersartige Anforderung hinzu: Die semesterweise Bestätigung eines ausgeliehenen physischen Schlüssels braucht ein über Semestergrenzen hinweg wiedererkennbares Konto — ein reines gerätegebundenes Pseudonym (Option (c)/(d) aus der bisherigen Optionstabelle) kann bei GeräteWechsel oder Neuinstallation unbemerkt umgangen werden, was bei einem Sicherheits-Schlüssel schwerer wiegt als bei einer Mensa-Bewertung.

## Entscheidung

Die App ist ohne Konto vollständig nutzbar für alle Lesefunktionen (Stundenplan, Mensaplan, News, Raumsuche, Wiki, Event-Kalender, Notenübersicht) sowie für die Helfer-Anmeldung (Name + ein Kontaktweg reichen weiterhin, kein Konto nötig). Ein Konto ist ausschließlich für zwei Funktionen erforderlich: das **Verfassen** einer Mensa-Bewertung (Lesen bleibt kontofrei) und die **E-Key-Verwaltung** (Verknüpfung, Status, semesterweise Bestätigung).

Bevorzugter Anmeldeweg für dieses Konto ist **Hochschul-SSO**, sofern technisch und organisatorisch verfügbar (siehe `platform/integrations.md` INT-012, Status zu verifizieren). Ist Hochschul-SSO nicht nutzbar, tritt ein einfaches, vom eigenen Backend verwaltetes Konto (z. B. E-Mail-Verifizierung) als Ersatzoption in Kraft. In beiden Fällen ausgeschlossen: Passwort-Replay gegen ein Hochschulsystem, wie es die Alt-App beim ODS-Verfahren tat (`platform/security-and-privacy.md`, `platform/integrations.md` INT-006) — SSO läuft ausschließlich über den dafür vorgesehenen offiziellen Anmeldeweg der Hochschule (z. B. OAuth/OIDC), nie über eine Nachbildung des Login-Formulars.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| Kein Konto irgendwo (durchgängig Pseudonym/Gerät, bisherige Option c/d) | gering | einfachste Umsetzung, niedrigste Hürde überall | E-Key-Bestätigung durch Geräte-/Neuinstallations-Umgehung nicht verlässlich durchsetzbar |
| Konto für alles, auch Bewertungen (bisherige Option a) | hoch | höchste Verlässlichkeit überall, ein einziges Identitätskonzept | erhöht die Hürde für die bewusst niedrigschwellig angelegte Bewertungsfunktion, gefährdet Beteiligung |
| **Hybrid: Konto nur für Bewertung-Schreiben und E-Key, sonst kontofrei** | mittel | Hürde passt zur tatsächlichen Kritikalität der jeweiligen Funktion; Helfer-Anmeldung und alle Lesefunktionen bleiben niedrigschwellig | zwei parallele Identitätskonzepte in einer App (kontofrei vs. kontogebunden) zu erklären und zu pflegen |
| Hochschul-SSO als alleiniger Anmeldeweg ohne Ersatzoption | zu prüfen | höchste Verlässlichkeit, keine eigene Passwortverwaltung | App wäre unbenutzbar für die betroffenen Funktionen, falls SSO technisch/organisatorisch nicht erreichbar ist — zu riskant ohne vorherige Bestätigung |

Die Hybrid-Option ist gewählt. Ob das dafür nötige Konto per Hochschul-SSO oder per Ersatzoption entsteht, ist eine zweite, unabhängige Achse dieser Entscheidung (siehe „Entscheidung" oben) und hängt vom Ergebnis der INT-012-Verifikation ab.

## Konsequenzen

`platform/identity-and-moderation.md` wird um ein drittes Datensparsamkeits-Profil ergänzt (Konto, für RATE-Schreiben und EKEY) neben Pseudonym (RATE-Lesen) und Name+Kontaktweg (HELFER). `features/canteen-ratings/spec.md` erhält eine neue Anforderung für das Konto-Gate beim Absenden einer Bewertung; Lesen bleibt unverändert kontofrei. `features/e-key/spec.md` referenziert dasselbe Konto-Konzept. `platform/integrations.md` erhält einen neuen Registereintrag INT-012 für Hochschul-SSO mit Status „zu verifizieren".

## Offene Punkte

- Ist Hochschul-SSO technisch und organisatorisch nutzbar (Rücksprache mit Hochschul-IT/Fachbereich)? Siehe `platform/integrations.md` INT-012.
- Falls Hochschul-SSO nicht verfügbar ist: konkrete Ausgestaltung der Ersatzoption (z. B. E-Mail-Verifizierung, ggf. mit Matrikelnummer-Abgleich zur Bestätigung der Fachbereichszugehörigkeit).
- UX-seitige Ausgestaltung des Kontenzwangs nur beim Schreibpfad (z. B. Konto-Erstellung erst beim ersten Bewertungsversuch anbieten, nicht beim App-Start).
