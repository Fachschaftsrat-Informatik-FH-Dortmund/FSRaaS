---
nummer: 0010
titel: Authentik als Identitätsanbieter mit Federation zur FH
status: angenommen
datum: 2026-08-25
betrifft:
  - ../../openspec/specs/identity-and-moderation/spec.md
  - ../../openspec/specs/integrations/spec.md
  - ../../openspec/specs/security-and-privacy/spec.md
  - ../../openspec/specs/backend-and-api/spec.md
  - ../../openspec/specs/canteen-ratings/spec.md
  - ../../openspec/specs/e-key/spec.md
  - ../../openspec/specs/admin/spec.md
  - 0004-identitaet-und-anmeldung.md
---

# ADR 0010: Authentik als Identitätsanbieter mit Federation zur FH

## Kontext

`0004-identitaet-und-anmeldung.md` legt fest, dass ein Konto für zwei Funktionen nötig ist — das Verfassen von Mensa-Bewertungen (RATE) und die E-Key-Verwaltung (EKEY) —, lässt aber offen, wie dieses Konto entsteht. Bevorzugt wurde „Hochschul-SSO, sofern verfügbar" (INT-012, Status „zu verifizieren"), mit einem eigenen, vom Backend verwalteten Konto als Ersatzoption. Solange diese Frage offen blieb, hing der gesamte Schreibpfad von RATE an einer Klärung außerhalb des Projekts.

Drei Kräfte wirken auf die Auflösung. Erstens ist die Verfügbarkeit eines Hochschul-Anmeldewegs für Drittanwendungen nicht vom Projekt zu entscheiden, sondern von der Hochschul-IT — eine Abhängigkeit mit unbekannter Laufzeit. Zweitens darf die App nach `platform/security-and-privacy.md` (SEC-F-040) unter keinen Umständen Hochschul-Zugangsdaten entgegennehmen; jeder Weg muss über einen Redirect-Fluss im Systembrowser laufen. Drittens braucht auch die Admin-Oberfläche (`../../openspec/specs/admin/spec.md`) eine Rollenverwaltung — FSR-Redaktion und Moderation nach `platform/identity-and-moderation.md` (IDENT-F-040) —, und es wäre doppelte Arbeit, dafür ein zweites, unabhängiges Konto-System zu bauen.

## Entscheidung

Die App und die Admin-Oberfläche sprechen ausschließlich mit einer selbstbetriebenen Authentik-Instanz auf demselben Hetzner-VPS wie das eigene Backend (INT-008), über OpenID Connect mit Authorization-Code-Fluss und PKCE im Systembrowser. Authentik ist damit der einzige Identitätsanbieter, den App, Admin-Oberfläche und Backend kennen.

Die Anbindung an die Hochschule erfolgt **nicht** direkt aus der App, sondern als Upstream-Federation innerhalb von Authentik: Authentik meldet sich seinerseits per OAuth gegen den Microsoft-Mandanten der FH Dortmund an, wofür dort eine App-Registrierung beantragt wird. Für die App ist dieser Upstream unsichtbar — sie sieht in jedem Fall nur Authentik.

Solange die App-Registrierung bei der FH nicht erteilt ist, betreibt Authentik eigene Konten mit E-Mail-Verifizierung als Anmeldeweg. Der Wechsel auf die Federation ist danach eine Konfigurationsänderung in Authentik und erfordert weder eine Änderung an der App noch am Backend noch an einer Anforderung dieses Spec-Bestands.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **Authentik als alleiniger Anbieter, FH-Anbindung als Upstream-Federation (gewählt)** | mittel — eine zusätzliche Komponente zu betreiben, Federation zu konfigurieren | App kennt genau einen Anmeldeweg; die FH-Freigabe wird vom kritischen Pfad genommen, weil eigene Konten bis dahin tragen; Rollen für Admin und Moderation entstehen im selben System | eine weitere selbstbetriebene Komponente mit Aktualisierungs- und Sicherungspflicht; Ausfall von Authentik legt alle kontogebundenen Funktionen gleichzeitig still |
| Direkte Anbindung der App an den FH-Microsoft-Mandanten | gering bis mittel, sofern die Registrierung erteilt wird | keine zusätzliche Komponente; Identität stammt unmittelbar von der Hochschule | RATE bliebe bis zur Freigabe unbaubar; ohne Hochschulkonto keinerlei Zugang; Rollenverwaltung für FSR-Redaktion und Moderation müsste separat entstehen, da die App keine Gruppen im FH-Mandanten anlegen kann |
| Eigene Konto-Verwaltung im Backend (Ersatzoption aus ADR 0004) | mittel — Registrierung, E-Mail-Verifizierung, Passwortzurücksetzung, Sitzungsverwaltung selbst bauen | keine zusätzliche Fremdkomponente | sicherheitskritische Funktionalität selbst gebaut und dauerhaft gepflegt, in einem ehrenamtlich getragenen Projekt mit wechselnder Besetzung; ein späterer Wechsel auf Hochschul-Anmeldung wäre ein Bruch statt einer Konfigurationsänderung |
| Kontopflicht aufgeben, Bewertungen gerätegebunden | gering | einfachster Weg, keine Anmeldung nirgends | widerspricht `0004-identitaet-und-anmeldung.md`; die Einmal-pro-Tag-Sperre (IDENT-F-050) wäre durch Neuinstallation umgehbar, und EKEY hätte keine über Semestergrenzen tragfähige Identität |

### Erläuterungen

**Zur gewählten Option.** Der entscheidende Vorteil ist nicht technischer, sondern zeitlicher Natur: Die Federation ist eine Konfigurationsfrage innerhalb von Authentik, keine Eigenschaft der App. Damit entkoppelt diese Entscheidung den Projektfortschritt von einer Freigabe, deren Zeitpunkt niemand im Projekt beeinflussen kann — bei gleichbleibendem Ziel.

## Konsequenzen

- `platform/integrations.md` INT-012 wechselt von „Hochschul-SSO, zu verifizieren" zu „Authentik (eigenbetrieben), Upstream-Federation zur FH". Die Unsicherheit verschiebt sich damit von „welcher Anmeldeweg?" zu „wann steht die Federation?" und blockiert keine Umsetzung mehr.
- Alle kontogebundenen Anforderungen (IDENT-F-015, RATE-F-090, EKEY-F-030 ff., ADMIN) beziehen sich auf dasselbe Konto.
- Rollen (FSR-Redaktion, Moderation) werden als Authentik-Gruppen geführt und als Claim im Token übertragen; das Backend wertet sie aus, statt eine eigene Rollentabelle zu pflegen. Das löst IDENT-F-040 ohne zusätzliche Datenhaltung.
- `platform/security-and-privacy.md` Abschnitt 3 erhält Authentik als verarbeitende Stelle im Verarbeitungsverzeichnis; bei aktiver Federation kommt der Microsoft-Mandant der FH als weiterer Empfänger hinzu.
- Der Betrieb von Authentik fällt unter dieselben Betriebsanforderungen wie das Backend (API-N-070 Sicherungen, API-N-090 Überwachung).
- Ein Ausfall von Authentik betrifft alle kontogebundenen Funktionen gleichzeitig. Lesefunktionen bleiben davon unberührt, da sie kontofrei sind (IDENT-F-012) — die Bereichsisolation aus NFR-N-080 bleibt damit gewahrt.

## Offene Punkte

- Zeitpunkt und Ergebnis der App-Registrierung im FH-Microsoft-Mandanten; wer sie beantragt und wer dort entscheidet.
- Welche Claims der FH-Upstream liefert und ob daraus die Fachbereichszugehörigkeit verlässlich ableitbar ist — relevant, falls die Bewertungsfunktion später auf FB4-Angehörige beschränkt werden soll.
- Ob bei aktiver Federation die zuvor angelegten eigenen Konten migriert oder parallel weiterbetrieben werden.
- Betriebszuschnitt der Authentik-Instanz auf dem Hetzner-VPS (eigener Container, Sicherung, Aktualisierungsrhythmus) — festzuhalten in `0003-eigenes-backend-fuer-community-funktionen.md`.
