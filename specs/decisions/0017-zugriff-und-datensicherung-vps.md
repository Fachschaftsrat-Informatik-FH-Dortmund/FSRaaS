---
nummer: 0017
titel: Zugriffsverwaltung und Datensicherung auf dem Hetzner-VPS
status: angenommen
datum: 2026-08-26
betrifft:
  - ../../openspec/specs/backend-and-api/spec.md
  - 0003-eigenes-backend-fuer-community-funktionen.md
---

# ADR 0017: Zugriffsverwaltung und Datensicherung auf dem Hetzner-VPS

## Kontext

`decisions/0003-eigenes-backend-fuer-community-funktionen.md` lässt „konkreter Server-Zuschnitt, Zugriffsverwaltung, Backup-Ziel" als offenen Punkt stehen. Das ist exakt das Muster, an dem beide Alt-Projekte laut `CLAUDE.md` gescheitert sind: Betriebswissen an Einzelpersonen gebunden, `app.fsrfb4.de` läuft seit Wintersemester 2023/24 unbemerkt mit veralteten Daten, weil niemand mehr wusste, wie man sie pflegt. Für die **neue** Infrastruktur ist genau dieselbe Frage bislang ebenso ungeklärt: kein Secrets-Konzept, keine Zugriffs-Onboarding-/Offboarding-Regel, kein Backup-Wiederherstellungsziel. Der FSR wechselt seine technisch Verantwortlichen jährlich (`decisions/0002-spec-anchored-arbeitsweise.md`); jede Lösung muss von einem wechselnden Ein- bis Zwei-Personen-Team tatsächlich pflegbar sein.

## Entscheidung

Drei Bausteine, bewusst ohne neue Infrastrukturklasse:

- **Zugriff:** individuelle SSH-Schlüssel und benannte Linux-Nutzerkonten je Person, kein geteilter Root-Zugang. Offboarding heißt „einen Schlüssel entfernen", nicht „ein von allen gekanntes Geheimnis neu verteilen". Für die wenigen tatsächlich geteilten Geheimnisse (Hetzner-Konsole, DB-Root, OIDC-Client-Secrets): ein Bitwarden-Organisationskonto oder selbstbetriebenes Vaultwarden auf demselben VPS.
- **Rotation:** aller geteilten Geheimnisse bei jedem jährlichen FSR-Technik-Wechsel — ein garantiert eintretendes Ereignis, kein zusätzlicher, oft ignorierter Kalenderplan.
- **Backup:** Hetzners eigenes automatisiertes Server-Backup als Auffangnetz, zusätzlich ein täglicher `pg_dump` auf eine räumlich getrennte Hetzner Storage Box. RPO ≈ 24 Stunden (deckt sich mit dem bereits in `backend-and-api.md` Abschnitt 10 vorgeschlagenen Arbeitsziel), RTO ≤ 1 Arbeitstag über ein dokumentiertes Wiederherstellungs-Runbook, mit einer tatsächlichen Wiederherstellungsprobe je Semester.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| **Individuelle SSH-Keys + Bitwarden/Vaultwarden + Rotation beim Jahreswechsel + Hetzner-Backup + separater `pg_dump` + jährliche Wiederherstellungsprobe (gewählt)** | mittel, einmalig einzurichten | von 1–2 Personen tatsächlich pflegbar; Rotation an ein garantiert eintretendes Ereignis gekoppelt | kein automatisches Secret-Rotationssystem — Rotation bleibt ein manueller, aber dokumentierter Schritt |
| HashiCorp Vault (Cluster) | hoch | feingranulare, auditierbare Secrets-Verwaltung | selbst eine neue, komplexe, an Spezialwissen gebundene Komponente — widerspricht dem Ziel, genau das zu vermeiden |
| Geteiltes Passwort-Dokument/Chat (faktischer Status quo) | keiner | kein Einrichtungsaufwand | exakt das Muster, an dem `app.fsrfb4.de` bereits gescheitert ist; kein sauberes Offboarding möglich |
| Backups nur auf dem VPS selbst | gering | einfachste Umsetzung | schützt nicht gegen Verlust des VPS selbst (Hardwaredefekt, Kompromittierung, Kontosperre) |
| Multi-Region/Multi-Provider-Hochverfügbarkeit | sehr hoch | maximale Ausfallsicherheit | weit jenseits von Bedarf, Budget und Betriebsfähigkeit eines FSR-Projekts |

## Konsequenzen

- `decisions/0003-eigenes-backend-fuer-community-funktionen.md` gilt an dieser Stelle als aufgelöst; der dortige offene Punkt verweist künftig hierher.
- `backend-and-api.md` Abschnitt 6/10 erhält API-N-160 (Sicherung auf organisatorisch getrenntem Ziel), API-N-170 (Wiederherstellung ≤ 1 Arbeitstag, RPO ≤ 24 h), API-N-180 (jährliche Wiederherstellungsprobe, Prüfprotokoll) und API-N-190 (dokumentiertes Onboarding/Offboarding inkl. Geheimnis-Rotation).

## Offene Punkte

- Konkrete Instanzgröße des Hetzner-VPS — Arbeitsziel bleibt „kleinste für ASP.NET-Core-Betrieb plus PostgreSQL tragfähige Größe, Hochskalierung bei Bedarf" (unverändert aus `decisions/0003-...md`).
- Wer konkret (Rollenbezeichnung im FSR) das Wiederherstellungs-Runbook je Semester ausführt — organisatorisch beim FSR FB4 festzulegen, sobald der Betrieb steht.
