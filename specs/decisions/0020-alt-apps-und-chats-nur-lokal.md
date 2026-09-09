---
nummer: 0020
titel: Alt-App-Quellcode und WhatsApp-Rohexporte nur noch lokal, nicht im Repo
status: angenommen
datum: 2026-09-09
betrifft:
  - ../README.md
  - ../../CLAUDE.md
  - ../../.gitignore
  - ../product/legacy-inventory.md
  - ../product/whatsapp-feedback-inventory.md
---

# ADR 0020: Alt-App-Quellcode und WhatsApp-Rohexporte nur noch lokal, nicht im Repo

## Kontext

Das Repo wird von privat auf öffentlich gestellt. Eine Bestandsaufnahme vor der Umstellung ergab zwei Funde, die nicht öffentlich stehen dürfen:

- `chats/` (11 rohe WhatsApp-Gruppenchat-Exporte, ~1,6 MB, echte Namen/Handynummern von Studis seit 2022) war seit dem ersten Commit getrackt. `.gitignore` schützte bislang nur die daraus *abgeleiteten* Daten unter `analysis/`, nicht die Rohquelle selbst — genau das Gegenteil dessen, was `scripts/whatsapp_mining/README.md` verlangt.
- `alte apps/app.fsrfb4.de/` (Dump des Live-Backends) enthielt `.htpasswd`/`passwd`-Dateien mit einem Klartext-Admin-Passwort für den Admin-Bereich von `app.fsrfb4.de` — einem Dienst, der laut `specs/product/legacy-inventory.md` bis heute produktiv läuft.

Keine dieser beiden Stellen ist mit dem Ziel eines öffentlichen Repos vereinbar. Eine reine Entfernung aus dem aktuellen Stand reicht nicht: Git-Historie bleibt in einem öffentlichen Repo vollständig einsehbar, die Daten wären über alte Commits weiterhin abrufbar.

## Entscheidung

`chats/`, `alte apps/` (beide Alt-Apps und der `app.fsrfb4.de`-Dump) und `analysis/` werden aus dem Repo entfernt — aus dem aktuellen Stand per Commit und zusätzlich rückwirkend aus der gesamten Git-Historie (`git filter-repo`, gefolgt von Force-Push). Die drei Ordner liegen ab sofort ausschließlich lokal unter `FSRaaS-lokale-daten/` (Ordner neben, nicht im Repo-Arbeitsverzeichnis) und werden nicht erneut committet — `.gitignore` schützt zusätzlich davor, falls sie versehentlich wieder unter dem Repo-Pfad angelegt werden.

Damit verliert das Repo seine bisherige Leseumgebung „Alt-App-Quellcode direkt einsehbar" (CLAUDE.md, Abschnitt Struktur). Wer künftig den Alt-App-Code lesen muss (Vergleich mit der Android-App als zu übertreffendem Stand, siehe CLAUDE.md Kopfzeile), braucht lokalen Zugriff auf `FSRaaS-lokale-daten/alte apps/` — das ist beim FSR-Wechsel weiterzugeben, sonst entsteht exakt das in ADR 0002 beschriebene Übergabeproblem erneut, nur für den Alt-App-Code statt für die Anforderungen.

**Sofortmaßnahme unabhängig vom Repo:** Das im `app.fsrfb4.de`-Dump gefundene Admin-Passwort ist auf dem produktiven Server zu rotieren, unabhängig davon, ob und wann das Repo öffentlich gestellt wird — es könnte noch gültig sein.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| Nur aktuellen Stand bereinigen, Historie belassen | gering | schnell erledigt | Daten bleiben über alte Commits öffentlich abrufbar — verfehlt das Ziel |
| **Vollständige Entfernung inkl. Historie, lokale Ablage (gewählt)** | hoch einmalig (History-Rewrite, Force-Push, alle lokalen Branches/Worktrees müssen neu aufgesetzt werden) | Daten wirklich nicht mehr im Repo, Live-Credential-Fund wird nicht dauerhaft mitgeschleppt | Alt-App-Code ist ohne lokalen Ordner nicht mehr einsehbar; Übergabe-Pflicht für `FSRaaS-lokale-daten/` |
| Repo vorerst privat belassen, Bereinigung später | keiner sofort | kein Zeitdruck | verzögert das eigentliche Ziel, Live-Credential bleibt währenddessen in einem Repo mit unbekanntem Zugriffskreis |

## Konsequenzen

- `CLAUDE.md` (Abschnitt Struktur) und `specs/README.md` sind auf den Wegfall von `alte apps/` und `chats/` als Repo-Pfade hinzuweisen; Verweise auf konkrete Alt-App-Dateipfade bleiben als historische Fundstellen gültig, sind aber nur noch über die lokale Ablage nachvollziehbar.
- `specs/product/whatsapp-feedback-inventory.md` bleibt unverändert im Repo — das Dokument ist bereits aggregiert/pseudonymisiert und enthält keine Rohdaten, nur Herkunftsverweise auf `chats/<Slug>`, die jetzt auf die lokale Ablage statt einen Repo-Pfad zeigen.
- `scripts/whatsapp_mining/` bleibt im Repo (reiner Code, keine Daten); sein `README.md` verweist relativ auf `chats/` — das setzt lokal einen `chats/`-Ordner neben den Skripten voraus, den es im Repo nicht mehr gibt.

## Offene Punkte

- Ob `FSRaaS-lokale-daten/` selbst versioniert werden soll (z. B. privates Zweit-Repo) oder rein lokal bleibt: noch nicht entschieden.
- Übergabe von `FSRaaS-lokale-daten/` beim jährlichen FSR-Technik-Wechsel ist bislang nicht in einem Übergabeprozess verankert — betrifft dasselbe Strukturproblem wie ADR 0002, nur für Alt-App-Code statt Anforderungen.
